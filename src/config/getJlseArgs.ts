import { basename, dirname, extname } from "path";
import { getenv } from "./getenv";

/**
 * jlseの引数を生成する
 * @param {string[]} ffmpegOptions
 * @param {string[]?} hwOptions
 * @returns {string[]}
 */
const getJlseArgs = (
  ffmpegOptions: string[],
  hwOptions: string[] | undefined,
) => {
  const outfile = getenv("OUTPUT");
  const args: string[] = ["-i", getenv("INPUT"), "-e"];
  if (hwOptions) {
    args.push(
      "-g",
      " -y " + hwOptions.reduce((prev, curr) => prev + " " + curr),
    );
  }
  return args.concat([
    "-o",
    " " + ffmpegOptions.reduce((prev, curr) => prev + " " + curr),
    "-r",
    "-d",
    dirname(outfile),
    "-n",
    basename(outfile, extname(outfile)),
  ]);
};
export { getJlseArgs };
