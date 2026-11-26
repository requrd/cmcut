import { createClient, formatError, reGenerateThumbnail } from "./thumbnail.ts";

/**
 * 録画のサムネイルを再生成する
 * 使い方: node reGenerateThumbnail.js [recordedId] [videoFileId]
 * 引数がなければ EPGStation が渡す RECORDEDID / VIDEOFILEID を使う
 */
const main = async () => {
  // 引数がセットされていた場合、優先して指定する
  const recordId = process.argv[2] ?? process.env.RECORDEDID;
  const videoFileId = process.argv[3] ?? process.env.VIDEOFILEID;

  if (recordId === undefined) {
    throw Error("record id is not set (pass it as an argument or RECORDEDID)");
  }
  await reGenerateThumbnail(createClient(), recordId, videoFileId);
};

try {
  await main();
} catch (error) {
  console.error(formatError(error));
  process.exitCode = 1;
}
