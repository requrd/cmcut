import { FfmpegOptionsPlugin } from "./ffmpegOptionsPlugin";
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
    return ["-map", "0:v", "-c:v", codec, "-vf", videoFilter];
  },
  audioStreamOptions: (isDualMono) => {
    const options = isDualMono
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
      ]
      : ["-map", "0:a", "-map", "-0:13?", "-map", "-0:10?"];
    return options.concat(["-c:a", "libopus", "-strict", "-2"]);
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

export { vaapiOptions, vaapiPlugin };
