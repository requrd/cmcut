const isDualMono = parseInt(process.env.AUDIOCOMPONENTTYPE, 10) == 2;

/**
 * FFmpeg(vaapi)のオプションを作成する
 * 引数無しで呼ばれた場合、jlse用のオプションとしてオプションを作成する
 *
 * @param {string?} input
 * @returns {string[]} FFmpegの引数となるパラメータ
 */
const getVaapiOptions = (input) => {
  const args = [];
  if (input) {
    args.push(...vaapiOptions);
  }
  // input 設定
  if (input) {
    args.push("-y", "-i", input);
  }
  args.push(...videoStreamOptions(input === undefined));
  args.push(...autdioStreamOptions(isDualMono));
  // 字幕ストリーム設定
  args.push("-map", "0:s?", "-c:s", "mov_text");
  return args.concat(qualityOptions(input === undefined));
};

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

/**
 * ビデオストリームオプション
 * jlseでは追加のオプションが必要になる
 *
 * @param {boolean} endocde_in_jlse
 * @returns {string[]}
 */
const videoStreamOptions = (endocde_in_jlse) => {
  const codec = "h264_vaapi";
  const videoFilter =
    (endocde_in_jlse ? "format=nv12,hwupload," : "") +
    "deinterlace_vaapi,scale_vaapi=h=720:w=-2";
  return ["-map", "0:v", "-c:v", codec, "-vf", videoFilter];
};

/**
 * オーディオストリームオプション
 *
 * @param {boolean} isDualMono
 * @returns {string[]}
 */
const autdioStreamOptions = (isDualMono) => {
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
};

/**
 * 品質オプション
 *
 * @param {boolean} endocde_in_jlse
 * @returns {string[]}
 */
const qualityOptions = (endocde_in_jlse) => {
  const audioBitrate = "60k";
  const qp = 25;
  const options = [
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
  return endocde_in_jlse
    ? ["-stats", "-aspect", "16:9"].concat(options)
    : options;
};

export { vaapiOptions, getVaapiOptions };
