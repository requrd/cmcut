import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import type { Progress } from "../src/config/Progress.ts";
import { updateProgress } from "../src/config/updateProgress.ts";

const newProgress = (overrides: Partial<Progress> = {}): Progress => ({
  total_num: 0,
  now_num: 0,
  avisynth_flag: false,
  percent: 0,
  log_updated: false,
  log: "",
  duration: 0,
  steps: 4,
  step: 0,
  ...overrides,
});

/** console.log を差し替えて、出力された行を返す */
const captureLog = (t: TestContext) => {
  const lines: string[] = [];
  t.mock.method(console, "log", (line: string) => {
    lines.push(line);
  });
  return lines;
};

describe("updateProgress", () => {
  describe("FFmpeg", () => {
    it("time から経過秒数を計算し、duration に対する割合を出す", (t) => {
      const out = captureLog(t);
      const progress = updateProgress(
        "frame= 2847 fps=0.0 q=-1.0 Lsize=  216432kB time=00:01:35.64 bitrate=18537.1kbits/s speed= 222x",
        newProgress({ duration: 191.28 }),
      );

      assert.equal(progress.now_num, 95.64);
      assert.equal(progress.total_num, 191.28);
      assert.equal(progress.percent, 0.5);
      assert.equal(progress.log, "(4/4) FFmpeg: time=00:01:35.64 speed=222x");
      assert.equal(progress.log_updated, false);
      assert.deepEqual(out.map((l) => JSON.parse(l)), [
        {
          type: "progress",
          percent: 0.5,
          log: "(4/4) FFmpeg: time=00:01:35.64 speed=222x",
        },
      ]);
    });

    it("時:分:秒 の時が繰り上がる", (t) => {
      captureLog(t);
      const progress = updateProgress(
        "frame=100 fps=30 q=-1.0 size=1kB time=01:02:03.50 bitrate=1kbits/s speed=1x",
        newProgress({ duration: 7200 }),
      );
      assert.equal(progress.now_num, 3723.5);
    });

    it("time がない行は 0 として扱う", (t) => {
      captureLog(t);
      const progress = updateProgress(
        "frame=0 fps=0.0 q=0.0 size=0kB",
        newProgress({ duration: 100 }),
      );
      assert.equal(progress.now_num, 0);
      assert.equal(progress.percent, 0);
    });
  });

  describe("AviSynth", () => {
    it("1回目のインデックス作成は 0-100 / 200", (t) => {
      captureLog(t);
      const progress = updateProgress(
        "AviSynth Creating lwi index file 40%",
        newProgress(),
      );
      assert.equal(progress.now_num, 40);
      assert.equal(progress.total_num, 200);
      assert.equal(progress.avisynth_flag, false);
      assert.equal(progress.log, "(1/4) AviSynth:Creating lwi index files");
    });

    it("100% に達したら2回目は 100 を足して数える", (t) => {
      captureLog(t);
      let progress = updateProgress(
        "AviSynth Creating lwi index file 100%",
        newProgress(),
      );
      assert.equal(progress.avisynth_flag, true);

      progress = updateProgress(
        "AviSynth Creating lwi index file 30%",
        progress,
      );
      assert.equal(progress.now_num, 130);
      assert.equal(progress.percent, 0.65);
    });
  });

  describe("chapter_exe", () => {
    it("Video Frames を総数、mute の開始フレームを現在値にする", (t) => {
      captureLog(t);
      let progress = updateProgress(
        "chapter_exe \tVideo Frames: 53946 [29.97fps]",
        newProgress(),
      );
      assert.equal(progress.total_num, 53946);

      progress = updateProgress(
        "chapter_exe mute 3: 26973 - 30フレーム",
        progress,
      );
      assert.equal(progress.now_num, 26973);
      assert.equal(progress.percent, 0.5);
      assert.equal(progress.log, "(2/4) Chapter_exe: 26973/53946");
    });

    it("end で 100% になる", (t) => {
      captureLog(t);
      const progress = updateProgress(
        "chapter_exe end",
        newProgress({ total_num: 1000, now_num: 10 }),
      );
      assert.equal(progress.now_num, 1000);
      assert.equal(progress.percent, 1);
    });
  });

  describe("logoframe", () => {
    it("checking N/M ended. から進捗を取る", (t) => {
      captureLog(t);
      const progress = updateProgress(
        "logoframe checking  250/1000 ended.",
        newProgress(),
      );
      assert.equal(progress.now_num, 250);
      assert.equal(progress.total_num, 1000);
      assert.equal(progress.percent, 0.25);
      assert.equal(progress.log, "(3/4) logoframe: 250/1000");
    });
  });

  it("どれにも当てはまらない行はそのまま出力し、進捗 JSON は出さない", (t) => {
    const out = captureLog(t);
    const before = newProgress({ now_num: 1, total_num: 2 });
    const progress = updateProgress("some other log", before);
    assert.deepEqual(out, ["some other log"]);
    assert.equal(progress.now_num, 1);
    assert.equal(progress.log_updated, false);
  });
});
