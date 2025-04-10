import axios from "axios";
/**
 * axiosのエラーを表示する
 * @param {Error} error
 */
const handle_error = (error: any) => {
  const { status, statusText, config } = error.response;
  console.error(
    `Error! HTTP Status: ${status} ${statusText}\nURL:${config.url}`,
  );
  throw error;
};
/**
 * エンドポイントからデータを取得する
 * @param {string} url
 * @param {Object} query
 * @returns {Object}
 */
const fetch_data = async (url: string, query: Object) => {
  try {
    const response = await axios.get(url, {
      headers: { accept: "application/json" },
      params: query,
    });
    return response.data;
  } catch (error) {
    handle_error(error);
  }
};
/**
 * 対象のレコードのサムネイルを再生成する
 * @param {string} record_id
 * @param {string?} video_file_id
 */
const reGenerateThumbnail = async (
  record_id: string,
  video_file_id: string | undefined,
) => {
  try {
    const record = await fetch_data(`/api/recorded/${record_id}`, {
      isHalfWidth: true,
    });
    await axios.delete(`/api/thumbnails/${record.thumbnails[0]}`);
    await axios.post(
      `/api/thumbnails/videos/${video_file_id ?? record.videoFiles[0].id}`,
    );
  } catch (error) {
    handle_error(error);
  }
};

const main = async () => {
  // 引数がセットされていた場合、優先して指定する
  const record_id = process.argv[2] ?? process.env.RECORDEDID;
  const video_file_id = process.argv[3] ?? process.env.VIDEOFILEID;

  if (record_id === undefined) {
    throw Error(`record info is not set\nreqcord id: ${record_id}`);
  }
  await reGenerateThumbnail(record_id, video_file_id);
};

(async () => {
  await main();
})();
