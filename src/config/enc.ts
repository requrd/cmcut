import { encode } from "./execEncode.ts";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin.ts";
import { getenv } from "./getenv.ts";
import { softwarePlugin } from "./softwareOptions.ts";

// ここから処理開始
(async () => {
  await encode(
    getenv("FFMPEG"),
    getFfmpegOptions(getenv("INPUT"), parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, softwarePlugin).concat(
      getenv("OUTPUT"),
    ),
  );
})();
