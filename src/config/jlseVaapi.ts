import { encode } from "./execEncode.ts";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin.ts";
import { getenv } from "./getenv.ts";
import { getJlseArgs } from "./getJlseArgs.ts";
import { vaapiOptions, vaapiPlugin } from "./vaapiOptions.ts";

(async () => {
  await encode(
    "jlse",
    getJlseArgs(
      getFfmpegOptions(undefined, parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, vaapiPlugin),
      vaapiOptions,
    ),
  );
})();
