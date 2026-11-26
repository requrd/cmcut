import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { getenv } from "../src/config/getenv.ts";
import { getJlseArgs } from "../src/config/getJlseArgs.ts";

describe("getenv", () => {
  it("設定済みの値を返す", () => {
    process.env.CMCUT_TEST_VALUE = "hello";
    assert.equal(getenv("CMCUT_TEST_VALUE"), "hello");
  });

  it("未設定・空文字ならエラー", () => {
    delete process.env.CMCUT_TEST_VALUE;
    assert.throws(() => getenv("CMCUT_TEST_VALUE"), /CMCUT_TEST_VALUE/);
    process.env.CMCUT_TEST_VALUE = "";
    assert.throws(() => getenv("CMCUT_TEST_VALUE"), /CMCUT_TEST_VALUE/);
  });
});

describe("getJlseArgs", () => {
  beforeEach(() => {
    process.env.INPUT = "/recorded/番組名 #1.m2ts";
    process.env.OUTPUT = "/encoded/sub dir/番組名 #1.mp4";
  });

  it("入力・出力ディレクトリ・拡張子なしのファイル名を渡す", () => {
    const args = getJlseArgs(["-c:v", "libx264"], undefined);
    assert.deepEqual(args, [
      "-i",
      "/recorded/番組名 #1.m2ts",
      "-e",
      "-o",
      " -c:v libx264",
      "-r",
      "-d",
      "/encoded/sub dir",
      "-n",
      "番組名 #1",
    ]);
  });

  it("hwOptions があれば -g で -y 付きで渡す", () => {
    const args = getJlseArgs(["-c:v", "h264_vaapi"], [
      "-vaapi_device",
      "/dev/dri/renderD128",
    ]);
    assert.deepEqual(args.slice(0, 5), [
      "-i",
      "/recorded/番組名 #1.m2ts",
      "-e",
      "-g",
      " -y -vaapi_device /dev/dri/renderD128",
    ]);
  });

  it("OUTPUT が未設定ならエラー", () => {
    delete process.env.OUTPUT;
    assert.throws(() => getJlseArgs(["-c:v", "libx264"], undefined), /OUTPUT/);
  });
});
