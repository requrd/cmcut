import { execFile } from "child_process";
import { getenv } from "./getenv";

const ffprobe = getenv("FFPROBE");
/**
 * 動画長取得関数
 * @param {string} filePath ファイルパス
 * @return {Promise<int>} 動画長を返す (秒)
 */
const getDuration = (filePath: string) => {
  return new Promise<number>((resolve, reject) => {
    execFile(
      ffprobe,
      ["-v", "0", "-show_format", "-of", "json", filePath],
      (err, stdout) => {
        if (err) {
          reject(err);

          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(parseFloat(result.format.duration));
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
export { getDuration };
