import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getFfmpegOptions } from "../src/config/ffmpegOptionsPlugin.ts";
import { softwarePlugin } from "../src/config/softwareOptions.ts";
import { vaapiOptions, vaapiPlugin } from "../src/config/vaapiOptions.ts";

/** 引数リストから flag の直後の値をすべて取り出す */
const valuesOf = (args: string[], flag: string) => args.flatMap((arg, i) => (arg === flag ? [args[i + 1]] : []));

describe("getFfmpegOptions", () => {
  describe("FFmpeg 直接実行 (input あり)", () => {
    it("software: 入力指定が先頭に付き、-stats は付かない", () => {
      const args = getFfmpegOptions("/rec/in.m2ts", false, softwarePlugin);
      assert.deepEqual(args.slice(0, 4), [
        "-fix_sub_duration",
        "-y",
        "-i",
        "/rec/in.m2ts",
      ]);
      assert.deepEqual(valuesOf(args, "-c:v"), ["libx264"]);
      assert.deepEqual(valuesOf(args, "-c:a"), ["aac"]);
      assert.ok(!args.includes("-stats"));
    });

    it("vaapi: ハードウェアオプションが -i より前に入る", () => {
      const args = getFfmpegOptions("/rec/in.m2ts", false, vaapiPlugin);
      assert.deepEqual(args.slice(0, vaapiOptions.length), vaapiOptions);
      assert.ok(args.indexOf("-vaapi_device") < args.indexOf("-i"));
      assert.deepEqual(valuesOf(args, "-vf"), ["deinterlace_vaapi"]);
    });
  });

  describe("jlse 経由 (input なし)", () => {
    it("入力指定もハードウェアオプションも付かず、-stats が付く", () => {
      const args = getFfmpegOptions(undefined, false, vaapiPlugin);
      assert.ok(!args.includes("-i"));
      assert.ok(!args.includes("-vaapi_device"));
      assert.deepEqual(args.slice(-3), ["-stats", "-aspect", "16:9"]);
    });

    it("vaapi: jlse 経由では hwupload を挟む", () => {
      const args = getFfmpegOptions(undefined, false, vaapiPlugin);
      assert.deepEqual(valuesOf(args, "-vf"), [
        "format=nv12,hwupload,deinterlace_vaapi",
      ]);
    });
  });

  it("字幕は mov_text で残す", () => {
    for (const plugin of [softwarePlugin, vaapiPlugin]) {
      const args = getFfmpegOptions(undefined, false, plugin);
      assert.deepEqual(valuesOf(args, "-c:s"), ["mov_text"]);
    }
  });

  describe("二ヶ国語 (デュアルモノ)", () => {
    for (
      const [name, plugin] of [
        ["software", softwarePlugin],
        ["vaapi", vaapiPlugin],
      ] as const
    ) {
      it(`${name}: 左右チャンネルを分けて jpn/eng を付ける`, () => {
        const args = getFfmpegOptions(undefined, true, plugin);
        assert.deepEqual(valuesOf(args, "-filter_complex"), [
          "channelsplit[FL][FR]",
        ]);
        assert.ok(valuesOf(args, "-map").includes("[FL]"));
        assert.ok(valuesOf(args, "-map").includes("[FR]"));
        assert.deepEqual(valuesOf(args, "-metadata:s:a:0"), ["language=jpn"]);
        assert.deepEqual(valuesOf(args, "-metadata:s:a:1"), ["language=eng"]);
      });
    }

    it("通常音声では filter_complex を使わない", () => {
      for (const plugin of [softwarePlugin, vaapiPlugin]) {
        const args = getFfmpegOptions(undefined, false, plugin);
        assert.ok(!args.includes("-filter_complex"));
      }
    });
  });
});
