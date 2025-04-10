// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { encode } from "./execEncode";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { vaapiPlugin } from "./vaapiOptions";

const command = getenv("FFMPEG");
const isDualMono = parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2;
const args = getFfmpegOptions(getenv("INPUT"), isDualMono, vaapiPlugin);
args.push(getenv("OUTPUT"));

(async () => {
  await encode(command, args);
})();
