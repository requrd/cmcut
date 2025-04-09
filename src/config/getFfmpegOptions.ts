import { getenv } from "./getenv.ts";
// const videoHeight = parseInt(process.env.VIDEORESOLUTION, 10);
const isDualMono = parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2;

/**
 * FFmpegのオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} - FFmpegの引数となるパラメータ
 */
const getFfmpegOptions = (input: string | undefined) => {
  const args: string[] = [];
  if (input) {
    args.push("-y", "-i", input);
  }
  args.push(...videoStreamOptions());
  args.push(...audioStreamOptions(isDualMono));
  args.push("-ignore_unknown");
  return args.concat(...qualityOptions());
};

/**
 * ビデオストリームオプション
 *
 * @returns {string[]}
 */
const videoStreamOptions = () => {
  const codec = "libx264"; //libx264でエンコード
  const videoFilter = "yadif";
  return ["-c:v", codec, "-vf", videoFilter];
};
/**
 * オーディオストリームオプション
 *
 * @param {boolean} isDualMono
 * @returns { string[] }
 */
const audioStreamOptions = (isDualMono: boolean) =>
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

/**
 * 品質オプション
 *
 * @returns {string[]}
 */
const qualityOptions = () => {
  const preset = "veryfast";
  const crf = "23";
  return [
    "-stats",
    "-preset",
    preset,
    "-aspect",
    "16:9",
    "-crf",
    crf,
    "-f",
    "mp4",
  ];
};
export { getFfmpegOptions };
