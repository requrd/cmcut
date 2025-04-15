// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { spawn } from "child_process";
import { stat } from "node:fs/promises";
import { getDuration } from "./getDuration";
import { getenv } from "./getenv";
import { Progress } from "./Progress";
import { updateProgress } from "./updateProgress";

/**
 * bashよりコマンド、引数を発行してエンコードを実行する.
 *
 * @async
 * @param {string} command 実行するコマンドのパス
 * @param {string[]} args 引数リスト
 * @returns {Promise<void>}
 */
async function encode(command: string, args: string[]) {
  let progress: Progress = {
    total_num: 0,
    now_num: 0,
    avisynth_flag: false,
    percent: 0,
    log_updated: false,
    log: "",
    // 進捗計算のために動画の長さを取得
    duration: await getDuration(getenv("INPUT")),
    steps: 4,
    step: 0,
  };
  const env = Object.create(process.env);
  env.HOME = "/root";
  const child = spawn(command, args, { env: env });
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
      progress = updateProgress(line, progress);
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
    try {
      const st = await stat(output);
      console.error(st.size);
      if (st.size < 10 * 1024) {
        console.error("File site too small (< 10k). Raising error");
        throw new Error("1");
      }
    } catch (e: any) {
      if (e.message === "1") {
        throw e;
      } else {
        throw new Error("File is not found. May be ffmpeg process not started.");
      }
    }
  });
}

export { encode };
