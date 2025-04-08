const isDualMono = parseInt(process.env.AUDIOCOMPONENTTYPE, 10) == 2;

/**
 * FFmpeg(vaapi)のオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} FFmpegの引数となるパラメータ
 */
const getVaapiOptions = (input) => {
  // my settings
  const videoFilter = "deinterlace_vaapi,scale_vaapi=h=720:w=-2";

  const args = [];
  args.push(...vaapiOptions);
  // 字幕用
  args.push("-fix_sub_duration");
  // input 設定
  if (input) {
    args.push("-y", "-i", input);
  }
  args.push(...videoStreamOptions(videoFilter));
  args.push(...autdioStreamOptions(isDualMono));
  // 字幕ストリーム設定
  args.push("-map", "0:s?", "-c:s", "mov_text");
  return args.concat(qualityOptions());
};

const vaapiOptions = [
  "-vaapi_device",
  "/dev/dri/renderD128",
  "-hwaccel",
  "vaapi",
  "-hwaccel_output_format",
  "vaapi",
];

/**
 * ビデオストリームオプション
 *
 * @param {string} videoFilter
 * @returns {string[]}
 */
const videoStreamOptions = (videoFilter) => [
  "-map",
  "0:v",
  "-c:v",
  "h264_vaapi",
  "-vf",
  videoFilter,
];

/**
 * オーディオストリームオプション
 *
 * @param {boolean} isDualMono
 * @returns {string[]}
 */
const autdioStreamOptions = (isDualMono) => {
  options = isDualMono
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
};

/**
 * 品質オプション
 *
 * @returns {string[]}
 */
const qualityOptions = () => {
  const audioBitrate = "60k";
  const qp = 25;
  return [
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
  ];
};

export { getVaapiOptions };
