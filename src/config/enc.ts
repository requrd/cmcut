import { encode } from "./execEncode";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { softwarePlugin } from "./softwareOptions";

const command = getenv("FFMPEG");
const args = getFfmpegOptions(getenv("INPUT"), parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, softwarePlugin);
args.push(getenv("OUTPUT"));

// ここから処理開始
(async () => {
  await encode(command, args);
})();
