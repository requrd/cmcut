// ref. https://github.com/plife18/docker-epgstation/blob/main/epgstation/config/enc_vaapi.js
import { encode } from "./execEncode.ts";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin.ts";
import { getenv } from "./getenv.ts";
import { vaapiPlugin } from "./vaapiOptions.ts";

(async () => {
  await encode(
    getenv("FFMPEG"),
    getFfmpegOptions(getenv("INPUT"), parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, vaapiPlugin).concat(
      getenv("OUTPUT"),
    ),
  );
})();
