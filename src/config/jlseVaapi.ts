import { execJlse } from "./execJlse";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { vaapiOptions, vaapiPlugin } from "./vaapiOptions";

execJlse(getFfmpegOptions(undefined, parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, vaapiPlugin), vaapiOptions);
