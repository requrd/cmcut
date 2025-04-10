import { getenv } from "./getenv";
import {
  FfmpegOptionsPlugin,
  getFfmpegOptions as getOptions,
} from "./ffmpegOptionsPlugin";
// const videoHeight = parseInt(process.env.VIDEORESOLUTION, 10);
// ユーザー設定
const preset = "veryfast";
const crf = "23";

const ffmpegPlugin: FfmpegOptionsPlugin = {
  hardwareOptions: undefined,
  videoStreamOptions: () => {
    const codec = "libx264";
    const videoFilter = "yadif";
    return ["-c:v", codec, "-vf", videoFilter];
  },
  audioStreamOptions: (isDualMono) => {
    return isDualMono
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
          "-c:a",
          "ac3",
          "-ar",
          "48000",
          "-ab",
          "256k",
        ]
      : ["-c:a", "aac"];
  },
  qualityOptions: [
    "-ignore_unknown",
    "-preset",
    preset,
    "-crf",
    crf,
    "-f",
    "mp4",
  ],
};

/**
 * FFmpegのオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} - FFmpegの引数となるパラメータ
 */
const getFfmpegOptions = (input: string | undefined = undefined) => {
  const isDualMono = parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2;
  return getOptions(input, isDualMono, ffmpegPlugin);
};

export { getFfmpegOptions };
