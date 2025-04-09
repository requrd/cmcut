import { vaapiOptions, getVaapiOptions } from "./getVaapiOptions.ts";
import { execJlse } from "./execJlse.ts";

execJlse(getVaapiOptions(), vaapiOptions);
