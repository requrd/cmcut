import { vaapiOptions, getVaapiOptions } from "./getVaapiOptions.mjs";
import { execJlse } from "./execJlse.mjs";

execJlse(getVaapiOptions(), vaapiOptions);
