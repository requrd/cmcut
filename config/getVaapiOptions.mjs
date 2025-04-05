const isDualMono = parseInt(process.env.AUDIOCOMPONENTTYPE, 10) == 2;

/**
 * FFmpeg(vaapi)のオプションを作成する
 *
 * @param {string} input 入力ファイルの絶対パス
 * @returns {string[]} FFmpegの引数となるパラメータ
 */
const getVaapiOptions = (input) => {
  const args = ["-y"];

  // my settings
  const audioBitrate = "60k";
  const qp = 25;
  const videoFilter = "deinterlace_vaapi,scale_vaapi=h=720:w=-2";

  // vaapi
  Array.prototype.push.apply(args, [
    "-vaapi_device",
    "/dev/dri/renderD128",
    "-hwaccel",
    "vaapi",
    "-hwaccel_output_format",
    "vaapi",
  ]);

  // 字幕用
  Array.prototype.push.apply(args, ["-fix_sub_duration"]);
  // ビデオストリーム設定
  Array.prototype.push.apply(args, ["-map", "0:v", "-c:v", "h264_vaapi"]);
  // インターレス解除
  Array.prototype.push.apply(args, ["-vf", videoFilter]);
  // オーディオストリーム設定
  if (isDualMono) {
    Array.prototype.push.apply(args, [
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
    ]);
  } else {
    Array.prototype.push.apply(args, ["-map", "0:a"]);
  }
  Array.prototype.push.apply(args, ["-c:a", "libopus", "-strict", "-2"]);
  // 字幕ストリーム設定
  Array.prototype.push.apply(args, ["-map", "0:s?", "-c:s", "mov_text"]);
  // 品質設定
  //Array.prototype.push.apply(args, ['-preset', 'veryfast', '-crf', '26']);

  // Other my options ...
  Array.prototype.push.apply(args, [
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
  ]);
  return args;
};
export { getVaapiOptions };
