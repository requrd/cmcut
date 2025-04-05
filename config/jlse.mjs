import { spawn } from "child_process";
import { basename, extname, dirname } from "path";
import { getDuration } from "./getDuration.mjs";
import { getFfmpegOptions } from "./getFfmpegOptions.mjs";
import { updateProgress } from "./updateProgress.mjs";

/**
 * jlseの引数を生成する
 * @param {string} input
 * @param {string} output
 * @param {string[]} options
 * @returns {string[]}
 */
const getJlseArgs = (input, output, options) => [
  "-i",
  input,
  "-e",
  "-o",
  " " + options.reduce((prev, curr) => prev + " " + curr),
  "-r",
  "-d",
  dirname(output),
  "-n",
  basename(output, extname(output)),
];

/**
 * JLSEを実行中のサブプロセスを取得する
 * @param {string} input - 入力ファイルのパス
 * @param {string} output - 出力ファイルのパス
 * @param {string[]} options
 * @returns JLSEのサブプロセス
 */
const getJlseProcess = (input, output, options) => {
  const env = Object.create(process.env);
  env.HOME = "/root";
  // console.error(`env: ${JSON.stringify(env)}`);
  return spawn("jlse", getJlseArgs(input, output, options), { env: env });
};

//メインの処理 ここから

/**
 * jlseを開始する
 *
 * @async
 * @param {string[]} options ffmpegのオプション
 * @returns {*} 
 */
const exec_jlse = async(options) => {
  const input = process.env.INPUT;
  //進捗管理用オブジェクト
  let progress = {
    total_num: 0,
    now_num: 0,
    avisynth_flag: false,
    percent: 0,
    log_updated: false,
    log: "",
    // 進捗計算のために動画の長さを取得
    duration: await getDuration(input),
    steps: 4,
    step: 0,
  };
  const child = getJlseProcess(input, process.env.OUTPUT, options);
  /**
   * エンコード進捗表示用に標準出力に進捗情報を吐き出す
   * 出力する JSON
   * {"type":"progress","percent": 0.8, "log": "view log" }
   */
  child.stderr.on("data", (data) => {
    const lines = String(data).split("\n");
    for (const line of lines) {
      progress = updateProgress(line, progress);
    }
  });

  child.on("error", (err) => {
    console.error(err);
    throw new Error(err);
  });

  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  child.on("close", (code) => {
    //終了後にしたい処理があれば書く
  });
};
(exec_jlse(getFfmpegOptions()))();