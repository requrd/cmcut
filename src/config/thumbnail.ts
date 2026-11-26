import axios, { type AxiosInstance } from "axios";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 8888;
const DEFAULT_CONFIG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "config.yml",
);

/**
 * EPGStation API のベース URL を決定する
 * 環境変数 EPGSTATION_URL > config.yml の port > 8888 の順で決める
 * @param {NodeJS.ProcessEnv} env 環境変数
 * @param {string} configPath EPGStation の config.yml のパス
 * @returns {string}
 */
const getBaseURL = (
  env: NodeJS.ProcessEnv = process.env,
  configPath: string = DEFAULT_CONFIG_PATH,
): string => {
  if (env.EPGSTATION_URL) {
    return env.EPGSTATION_URL;
  }
  let port = DEFAULT_PORT;
  try {
    const match = readFileSync(configPath, "utf-8").match(/^port:\s*(\d+)/m);
    if (match) {
      port = Number(match[1]);
    }
  } catch {
    // config.yml が読めない場合はデフォルトポートを使う
  }
  return `http://localhost:${port}`;
};

/**
 * EPGStation API 用の axios クライアントを作る
 * @param {string} baseURL
 * @returns {AxiosInstance}
 */
const createClient = (baseURL: string = getBaseURL()): AxiosInstance => axios.create({ baseURL });

/**
 * エラーを1行のメッセージにする
 * @param {unknown} error
 * @returns {string}
 */
const formatError = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response) {
    const { status, statusText, config } = error.response;
    return `Error! HTTP Status: ${status} ${statusText}\nURL:${config?.baseURL ?? ""}${config?.url}`;
  }
  if (axios.isAxiosError(error)) {
    return `Error! ${error.code ?? ""} ${error.message}`;
  }
  return `Error! ${error instanceof Error ? error.message : String(error)}`;
};

/**
 * 対象のレコードのサムネイルを再生成する
 * @param {AxiosInstance} client EPGStation API 用のクライアント
 * @param {string} recordId
 * @param {string?} videoFileId 未指定の場合は最初のビデオファイルを使う
 */
const reGenerateThumbnail = async (
  client: AxiosInstance,
  recordId: string,
  videoFileId: string | undefined,
): Promise<void> => {
  const { data: record } = await client.get(`/api/recorded/${recordId}`, {
    headers: { accept: "application/json" },
    params: { isHalfWidth: true },
  });
  const target = videoFileId ?? record.videoFiles?.[0]?.id;
  if (target === undefined) {
    throw Error(`video file is not found\nrecord id: ${recordId}`);
  }
  for (const thumbnailId of record.thumbnails ?? []) {
    await client.delete(`/api/thumbnails/${thumbnailId}`);
  }
  await client.post(`/api/thumbnails/videos/${target}`);
};

export { createClient, formatError, getBaseURL, reGenerateThumbnail };
