// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { spawn } from "child_process";
import { stat } from "node:fs/promises";
import { getDuration } from "./getDuration.ts";
import { getVaapiOptions } from "./getVaapiOptions.ts";
import { getenv } from "./getenv.ts";

const ffmpeg = getenv("FFMPEG");
const args = getVaapiOptions(getenv("INPUT"));
args.push(getenv("OUTPUT"));

(async () => {
  // 進捗計算のために動画の長さを取得
  const duration = await getDuration(getenv("INPUT"));

  const child = spawn(ffmpeg, args);
  // debug for ffmpeg
  //const child = spawn(ffmpeg, args, { stdio: "inherit" });

  /**
   * エンコード進捗表示用に標準出力に進捗情報を吐き出す
   * 出力する JSON
   * {"type":"progress","percent": 0.8, "log": "view log" }
   */
  child.stderr.on("data", (data) => {
    let strbyline = String(data).split("\n");
    for (let i = 0; i < strbyline.length; i++) {
      let str = strbyline[i];
      if (str.startsWith("frame")) {
        // 想定log
        // frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x
        const progress = {};
        const ffmpeg_reg =
          /frame=\s*(?<frame>\d+)\sfps=\s*(?<fps>\d+(?:\.\d+)?)\sq=\s*(?<q>[+-]?\d+(?:\.\d+)?)\sL?size=\s*(?<size>\d+(?:\.\d+)?)kB\stime=\s*(?<time>\d+[:\.\d+]*)\sbitrate=\s*(?<bitrate>\d+(?:\.\d+)?)kbits\/s(?:\sdup=\s*(?<dup>\d+))?(?:\sdrop=\s*(?<drop>\d+))?\sspeed=\s*(?<speed>\d+(?:\.\d+)?)x/;
        let ffmatch = str.match(ffmpeg_reg);
        /**
         * match結果
         * [
         *   'frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x',
         *   '5159',
         *   '11',
         *   '29.0',
         *   '122624',
         *   '00:02:51.84',
         *   '5845.8',
         *   '19',
         *   '0',
         *   '0.372',
         *   index: 0,
         *   input: 'frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x    \r',
         *   groups: [Object: null prototype] {
         *     frame: '5159',
         *     fps: '11',
         *     q: '29.0',
         *     size: '122624',
         *     time: '00:02:51.84',
         *     bitrate: '5845.8',
         *     dup: '19',
         *     drop: '0',
         *     speed: '0.372'
         *   }
         * ]
         */

        if (ffmatch === null) continue;

        progress["frame"] = parseInt(ffmatch.groups.frame);
        progress["fps"] = parseFloat(ffmatch.groups.fps);
        progress["q"] = parseFloat(ffmatch.groups.q);
        progress["size"] = parseInt(ffmatch.groups.size);
        progress["time"] = ffmatch.groups.time;
        progress["bitrate"] = parseFloat(ffmatch.groups.bitrate);
        progress["dup"] =
          ffmatch.groups.dup == null ? 0 : parseInt(ffmatch.groups.dup);
        progress["drop"] =
          ffmatch.groups.drop == null ? 0 : parseInt(ffmatch.groups.drop);
        progress["speed"] = parseFloat(ffmatch.groups.speed);

        let current = 0;
        const times = progress.time.split(":");
        for (let i = 0; i < times.length; i++) {
          if (i == 0) {
            current += parseFloat(times[i]) * 3600;
          } else if (i == 1) {
            current += parseFloat(times[i]) * 60;
          } else if (i == 2) {
            current += parseFloat(times[i]);
          }
        }

        // 進捗率 1.0 で 100%
        const percent = current / duration;
        const log =
          "frame= " +
          progress.frame +
          " fps=" +
          progress.fps +
          " size=" +
          progress.size +
          " time=" +
          progress.time +
          " bitrate=" +
          progress.bitrate +
          " drop=" +
          progress.drop +
          " speed=" +
          progress.speed;

        console.log(
          JSON.stringify({ type: "progress", percent: percent, log: log })
        );
      }
    }
  });

  child.on("error", (err) => {
    console.error(err);
    throw new Error(err);
  });

  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  child.on("exit", async (code) => {
    console.error("Exited with code: " + String(code));
    const output = process.env.OUTPUT;
    console.error("Output: " + output);
    const stats = await stat(output);
    console.error(stats.size);
    if (stats.size < 10 * 1024) {
      console.error("File site too small (< 10k). Raising error");
      throw new Error(1);
    }
  });
})();
