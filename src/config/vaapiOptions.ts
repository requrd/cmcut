import { FfmpegOptionsPlugin, getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
// const videoHeight = parseInt(process.env.VIDEORESOLUTION, 10);
// ユーザー設定
const audioBitrate = "60k";
const qp = "25";

const vaapiOptions = [
  "-vaapi_device",
  "/dev/dri/renderD128",
  "-hwaccel",
  "vaapi",
  "-hwaccel_output_format",
  "vaapi",
  // 字幕用
  "-fix_sub_duration",
];
const vaapiPlugin: FfmpegOptionsPlugin = {
  hardwareOptions: vaapiOptions,
  videoStreamOptions: (encodeInJlse) => {
    const codec = "h264_vaapi";
    const videoFilter = encodeInJlse
      ? "format=nv12,hwupload,deinterlace_vaapi"
      : "deinterlace_vaapi";
    return ["-c:v", codec, "-vf", videoFilter];
  },
  audioStreamOptions: (isDualMono) => {
    return isDualMono
      ? [
        "-filter_complex",
        "channelsplit[FL][FR]",
        "-map",
        "[FL]",
        "-map",
        "[FR]",
        "-metadata:s:a:0",
        "language=jpn",
        "-metadata:s:a:1",
        "language=eng",
        "-c:a",
        "libopus",
        "-strict",
        "-2",
      ]
      : ["-map", "0:a", "-map", "-0:13?", "-map", "-0:10?"];
  },
  qualityOptions: [
    "-map",
    "0:s?",
    "-c:s",
    "mov_text",
    "-q",
    "-1",
    "-qp",
    qp,
    "-g",
    "300",
    "-bf",
    "8",
    "-i_qfactor",
    "0.7143",
    "-b_qfactor",
    "1.3",
    "-qmin",
    "20",
    "-qmax",
    "51",
    "-compression_level",
    "0",
    "-f",
    "mp4",
    "-ar",
    "48000",
    "-ab",
    audioBitrate,
    "-ac",
    "2",
  ],
};

/**
 * FFmpeg(vaapi)のオプションを作成する
 * 引数無しで呼ばれた場合、jlse用のオプションとしてオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} FFmpegの引数となるパラメータ
 */
const getVaapiOptions = (input: string | undefined = undefined) => {
  const isDualMono = parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2;
  return getFfmpegOptions(input, isDualMono, vaapiPlugin);
};

export { getVaapiOptions, vaapiOptions };
