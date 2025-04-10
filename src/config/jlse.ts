import { execJlse } from "./execJlse";
import { getFfmpegOptions } from "./ffmpegOptionsPlugin";
import { getenv } from "./getenv";
import { softwarePlugin } from "./softwareOptions";

execJlse(getFfmpegOptions(undefined, parseInt(getenv("AUDIOCOMPONENTTYPE"), 10) == 2, softwarePlugin));
