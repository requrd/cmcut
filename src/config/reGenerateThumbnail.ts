import axios from "axios";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * EPGStation API のベース URL を決定する
 * 環境変数 EPGSTATION_URL > config.yml の port > 8888 の順で決める
 * @returns {string}
 */
const getBaseURL = () => {
  if (process.env.EPGSTATION_URL) {
    return process.env.EPGSTATION_URL;
  }
  let port = 8888;
  try {
    const configPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "config.yml",
    );
    const match = readFileSync(configPath, "utf-8").match(/^port:\s*(\d+)/m);
    if (match) {
      port = Number(match[1]);
    }
  } catch {
    // config.yml が読めない場合はデフォルトポートを使う
  }
  return `http://localhost:${port}`;
};

const client = axios.create({ baseURL: getBaseURL() });

/**
 * axiosのエラーを表示する
 * @param {Error} error
 */
const handle_error = (error: any): never => {
  if (error?.response) {
    const { status, statusText, config } = error.response;
    console.error(
      `Error! HTTP Status: ${status} ${statusText}\nURL:${config?.baseURL ?? ""}${config?.url}`,
    );
  } else {
    console.error(`Error! ${error?.code ?? ""} ${error?.message ?? error}`);
  }
  process.exit(1);
};
/**
 * エンドポイントからデータを取得する
 * @param {string} url
 * @param {Object} query
 * @returns {Object}
 */
const fetch_data = async (url: string, query: Object) => {
  const response = await client.get(url, {
    headers: { accept: "application/json" },
    params: query,
  });
  return response.data;
};
/**
 * 対象のレコードのサムネイルを再生成する
 * @param {string} record_id
 * @param {string?} video_file_id
 */
const reGenerateThumbnail = async (
  record_id: string,
  video_file_id: string | undefined,
) => {
  try {
    const record = await fetch_data(`/api/recorded/${record_id}`, {
      isHalfWidth: true,
    });
    for (const thumbnail_id of record.thumbnails ?? []) {
      await client.delete(`/api/thumbnails/${thumbnail_id}`);
    }
    const target = video_file_id ?? record.videoFiles?.[0]?.id;
    if (target === undefined) {
      throw Error(`video file is not found\nrecord id: ${record_id}`);
    }
    await client.post(`/api/thumbnails/videos/${target}`);
  } catch (error) {
    handle_error(error);
  }
};

const main = async () => {
  // 引数がセットされていた場合、優先して指定する
  const record_id = process.argv[2] ?? process.env.RECORDEDID;
  const video_file_id = process.argv[3] ?? process.env.VIDEOFILEID;

  if (record_id === undefined) {
    throw Error(`record info is not set\nreqcord id: ${record_id}`);
  }
  await reGenerateThumbnail(record_id, video_file_id);
};

await main();
