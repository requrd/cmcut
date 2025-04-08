// const videoHeight = parseInt(process.env.VIDEORESOLUTION, 10);
const isDualMono = parseInt(process.env.AUDIOCOMPONENTTYPE, 10) == 2;

/**
 * FFmpegのオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} - FFmpegの引数となるパラメータ
 */
const getFfmpegOptions = (input) => {
  const preset = "veryfast";
  const codec = "libx264"; //libx264でエンコード
  const crf = 23;
  const videoFilter = "yadif";

  const args = [];
  if (input) {
    args.push("-y", "-i", input);
  }
  args.push(...audioStreamOptions(isDualMono));
  Array.prototype.push.apply(args, ["-ignore_unknown"]);

  // その他設定
  Array.prototype.push.apply(args, [
    "-stats",
    "-vf",
    videoFilter,
    "-preset",
    preset,
    "-aspect",
    "16:9",
    "-c:v",
    codec,
    "-crf",
    crf,
    "-f",
    "mp4",
  ]);
  return args;
};

/**
 * オーディオストリームオプション
 *
 * @param {boolean} isDualMono
 * @returns { string[] }
 */
const audioStreamOptions = (isDualMono) =>
  isDualMono
    ? [
        "-filter_complex",
        "channelsplit[FL][FR]",
        "-map",
        "0:v",
        "-map",
        "[FL]",
        "-map",
        "[FR]",
        "-metadata:s:a:0",
        "language=jpn",
        "-metadata:s:a:1",
        "language=eng",
        "-c:a ac3",
        "-ar 48000",
        "-ab 256k",
      ]
    : ["-c:a", "aac"];
export { getFfmpegOptions };
