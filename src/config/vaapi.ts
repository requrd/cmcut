// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { encode } from "./execEncode";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { vaapiPlugin } from "./vaapiOptions";

(async () => {
  await encode(
    getenv("FFMPEG"),
    getFfmpegOptions(getenv("INPUT"), parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, vaapiPlugin).concat(
      getenv("OUTPUT"),
    ),
  );
})();
