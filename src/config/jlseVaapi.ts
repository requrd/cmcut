import { encode } from "./execEncode";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { getJlseArgs } from "./getJlseArgs";
import { vaapiOptions, vaapiPlugin } from "./vaapiOptions";

const env = Object.create(process.env);
env.HOME = "/root";

(async () => {
  await encode(
    "jlse",
    getJlseArgs(
      getFfmpegOptions(undefined, parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, vaapiPlugin),
      vaapiOptions,
    ),
    env,
  );
})();
