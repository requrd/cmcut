import { spawn } from "child_process";
import { getenv } from "./getenv";
import { getFfmpegOptions } from "./getFfmpegOptions";

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
