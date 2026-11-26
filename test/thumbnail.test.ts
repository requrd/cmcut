import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { promisify } from "node:util";
import { createClient, formatError, getBaseURL, reGenerateThumbnail } from "../src/config/thumbnail.ts";

interface FakeRecord {
  thumbnails?: number[];
  videoFiles?: { id: number }[];
}

/**
 * EPGStation API を模した HTTP サーバー
 * 受け取ったリクエストを requests に記録する
 */
const startFakeEPGStation = async () => {
  const requests: string[] = [];
  const records = new Map<string, FakeRecord>();
  const server: Server = createServer((req, res) => {
    requests.push(`${req.method} ${req.url}`);
    const match = req.url?.match(/^\/api\/recorded\/(\d+)/);
    if (req.method === "GET" && match) {
      const record = records.get(match[1]);
      if (!record) {
        res.statusCode = 404;
        res.statusMessage = "Not Found";
        return res.end();
      }
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(record));
    }
    res.end("{}");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    records,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

describe("getBaseURL", () => {
  let dir: string;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "cmcut-test-"));
  });
  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("EPGSTATION_URL が最優先", () => {
    const config = join(dir, "config.yml");
    writeFileSync(config, "port: 1234\n");
    assert.equal(
      getBaseURL({ EPGSTATION_URL: "http://epgstation:8888" }, config),
      "http://epgstation:8888",
    );
  });

  it("config.yml の port を使う", () => {
    const config = join(dir, "config.yml");
    writeFileSync(
      config,
      "port: 1234\nmirakurunPath: http://mirakurun:40772/\nmysql:\n  port: 3306\n",
    );
    assert.equal(getBaseURL({}, config), "http://localhost:1234");
  });

  it("インデントされた port (他の設定項目) は使わない", () => {
    const config = join(dir, "config.yml");
    writeFileSync(config, "mysql:\n  port: 3306\n");
    assert.equal(getBaseURL({}, config), "http://localhost:8888");
  });

  it("config.yml が無ければ 8888", () => {
    assert.equal(
      getBaseURL({}, join(dir, "missing.yml")),
      "http://localhost:8888",
    );
  });
});

describe("reGenerateThumbnail", () => {
  let epg: Awaited<ReturnType<typeof startFakeEPGStation>>;
  before(async () => {
    epg = await startFakeEPGStation();
  });
  after(async () => {
    await epg.close();
  });
  beforeEach(() => {
    epg.requests.length = 0;
    epg.records.clear();
  });

  it("既存サムネイルを消してから、最初のビデオファイルで再生成する", async () => {
    epg.records.set("1", { thumbnails: [5, 6], videoFiles: [{ id: 9 }, { id: 10 }] });
    await reGenerateThumbnail(createClient(epg.url), "1", undefined);
    assert.deepEqual(epg.requests, [
      "GET /api/recorded/1?isHalfWidth=true",
      "DELETE /api/thumbnails/5",
      "DELETE /api/thumbnails/6",
      "POST /api/thumbnails/videos/9",
    ]);
  });

  it("videoFileId を指定するとそれを使う", async () => {
    epg.records.set("1", { thumbnails: [], videoFiles: [{ id: 9 }] });
    await reGenerateThumbnail(createClient(epg.url), "1", "42");
    assert.deepEqual(epg.requests, [
      "GET /api/recorded/1?isHalfWidth=true",
      "POST /api/thumbnails/videos/42",
    ]);
  });

  it("ビデオファイルが無ければ、サムネイルを消さずにエラー", async () => {
    epg.records.set("1", { thumbnails: [5], videoFiles: [] });
    await assert.rejects(
      reGenerateThumbnail(createClient(epg.url), "1", undefined),
      /video file is not found/,
    );
    assert.deepEqual(epg.requests, ["GET /api/recorded/1?isHalfWidth=true"]);
  });

  it("録画が無ければ 404 のエラーになる", async () => {
    await assert.rejects(
      reGenerateThumbnail(createClient(epg.url), "999", undefined),
      (error) => {
        assert.match(formatError(error), /HTTP Status: 404 Not Found/);
        assert.match(formatError(error), /\/api\/recorded\/999/);
        return true;
      },
    );
  });
});

describe("formatError", () => {
  it("接続できないときはエラーコードを1行で返す", async () => {
    // ポート 1 は通常何も待ち受けていない
    const error = await createClient("http://127.0.0.1:1")
      .get("/api/recorded/1")
      .catch((e: unknown) => e);
    assert.equal(formatError(error), "Error! ECONNREFUSED connect ECONNREFUSED 127.0.0.1:1");
  });

  it("通常の Error はメッセージを返す", () => {
    assert.equal(formatError(new Error("boom")), "Error! boom");
  });
});

describe("reGenerateThumbnail.ts (スクリプトとして実行)", () => {
  const script = new URL("../src/config/reGenerateThumbnail.ts", import.meta.url).pathname;
  const run = (args: string[], env: NodeJS.ProcessEnv) =>
    promisify(execFile)(process.execPath, [script, ...args], {
      env: { PATH: process.env.PATH, ...env },
    }).then(
      ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
      (e) => ({ code: e.code as number, stdout: e.stdout as string, stderr: e.stderr as string }),
    );

  let epg: Awaited<ReturnType<typeof startFakeEPGStation>>;
  before(async () => {
    epg = await startFakeEPGStation();
  });
  after(async () => {
    await epg.close();
  });

  it("環境変数 RECORDEDID で動き、exit 0 で終わる", async () => {
    epg.records.set("3", { thumbnails: [7], videoFiles: [{ id: 8 }] });
    epg.requests.length = 0;
    const result = await run([], { RECORDEDID: "3", EPGSTATION_URL: epg.url });
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(epg.requests, [
      "GET /api/recorded/3?isHalfWidth=true",
      "DELETE /api/thumbnails/7",
      "POST /api/thumbnails/videos/8",
    ]);
  });

  it("失敗したら1行のエラーを出して exit 1", async () => {
    const result = await run(["999"], { EPGSTATION_URL: epg.url });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /^Error! HTTP Status: 404 Not Found/);
    assert.ok(!result.stderr.includes("    at "), "スタックトレースを出さない");
  });

  it("録画 ID が無ければ exit 1", async () => {
    const result = await run([], { EPGSTATION_URL: epg.url });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /record id is not set/);
  });
});
