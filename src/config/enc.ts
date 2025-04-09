import { spawn } from "child_process";
import { getFfmpegOptions } from "./getFfmpegOptions.ts";
import { getenv } from "./getenv.ts";

const ffmpeg = getenv("FFMPEG");
const args = getFfmpegOptions(getenv("INPUT"));
args.push(getenv("OUTPUT"));

// ここから処理開始
const child = spawn(ffmpeg, args);

child.stderr.on("data", (data) => {
  console.error(String(data));
});

child.on("error", (err) => {
  console.error(err);
  throw err;
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});
