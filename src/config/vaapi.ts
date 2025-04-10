// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { spawn } from "child_process";
import { stat } from "node:fs/promises";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getDuration } from "./getDuration";
import { getenv } from "./getenv";
import { vaapiPlugin } from "./vaapiOptions";

const command = getenv("FFMPEG");
const isDualMono = parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2;
const args = getFfmpegOptions(getenv("INPUT"), isDualMono, vaapiPlugin);
args.push(getenv("OUTPUT"));

function parse(line: string, duration: number) {
  if (!line.startsWith("frame")) return;
  // 想定log
  // frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x
  const progress: {
    frame?: number;
    fps?: number;
    q?: number;
    size?: number;
    time?: string;
    bitrate?: number;
    dup?: number;
    drop?: number;
    speed?: number;
  } = {};
  const ffmpeg_reg =
    /frame=\s*(?<frame>\d+)\sfps=\s*(?<fps>\d+(?:\.\d+)?)\sq=\s*(?<q>[+-]?\d+(?:\.\d+)?)\sL?size=\s*(?<size>\d+(?:\.\d+)?)kB\stime=\s*(?<time>\d+[:\.\d+]*)\sbitrate=\s*(?<bitrate>\d+(?:\.\d+)?)kbits\/s(?:\sdup=\s*(?<dup>\d+))?(?:\sdrop=\s*(?<drop>\d+))?\sspeed=\s*(?<speed>\d+(?:\.\d+)?)x/;
  let ffmatch = line.match(ffmpeg_reg);
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

  if (ffmatch === null) return;
  if (ffmatch.groups) {
    progress["frame"] = parseInt(ffmatch.groups.frame || "0");
    progress["fps"] = parseFloat(ffmatch.groups.fps || "0");
    progress["q"] = parseFloat(ffmatch.groups.q || "0");
    progress["size"] = parseInt(ffmatch.groups.size || "0");
    progress["time"] = ffmatch.groups.time || "0:0:0";
    progress["bitrate"] = parseFloat(ffmatch.groups.bitrate || "0");
    progress["dup"] = parseInt(ffmatch.groups.dup || "0");
    progress["drop"] = parseInt(ffmatch.groups.drop || "0");
    progress["speed"] = parseFloat(ffmatch.groups.speed || "0");
  }

  let current = 0;
  const times = (progress.time || "0:0:0").split(":");
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
  const log = "frame= "
    + progress.frame
    + " fps="
    + progress.fps
    + " size="
    + progress.size
    + " time="
    + progress.time
    + " bitrate="
    + progress.bitrate
    + " drop="
    + progress.drop
    + " speed="
    + progress.speed;

  console.log(
    JSON.stringify({ type: "progress", percent: percent, log: log }),
  );
}

async function encode(command: string, args: string[]) {
  // 進捗計算のために動画の長さを取得
  const duration = await getDuration(getenv("INPUT"));

  const child = spawn(command, args);
  // debug for ffmpeg
  // const child = spawn(ffmpeg, args, { stdio: "inherit" });

  /**
   * エンコード進捗表示用に標準出力に進捗情報を吐き出す
   * 出力する JSON
   * {"type":"progress","percent": 0.8, "log": "view log" }
   */
  child.stderr.on("data", (data) => {
    let lines = String(data).split("\n");
    for (const line of lines) {
      parse(line, duration);
    }
  });

  child.on("error", (err) => {
    console.error(err);
    throw err;
  });

  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  child.on("exit", async (code) => {
    console.error("Exited with code: " + String(code));
    const output = getenv("OUTPUT");
    console.error("Output: " + output);
    const st = await stat(output);
    console.error(st.size);
    if (st.size < 10 * 1024) {
      console.error("File site too small (< 10k). Raising error");
      throw new Error("1");
    }
  });
}
(async () => {
  await encode(command, args);
})();
