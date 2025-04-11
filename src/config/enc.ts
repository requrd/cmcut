import { encode } from "./execEncode";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { softwarePlugin } from "./softwareOptions";

// ここから処理開始
(async () => {
  await encode(
    getenv("FFMPEG"),
    getFfmpegOptions(getenv("INPUT"), parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, softwarePlugin).concat(
      getenv("OUTPUT"),
    ),
  );
})();
