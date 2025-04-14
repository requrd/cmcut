interface VideoStreamOptionsFunction {
  (encodeInJlse?: boolean): string[];
}

interface AudioStreamOptionsFunction {
  (isDualMono: boolean): string[];
}

interface FfmpegOptionsPlugin {
  hardwareOptions: string[] | undefined;
  videoStreamOptions: VideoStreamOptionsFunction;
  audioStreamOptions: AudioStreamOptionsFunction;
  qualityOptions: string[];
}

/**
 * FFmpegの引数を生成する.
 * 出力先は含まない.
 *
 * @param {(string | undefined)} input FFmpegで直接利用する場合、ファイルパスを指定する. jlse経由で利用する場合はundefinedを指定する.
 * @param {boolean} isDualMono 二ヶ国語の放送の場合True.
 * @param {FfmpegOptionsPlugin} plugin プラグイン関数でエンコード設定を指定する.
 * @returns {string[]} FFmpegの引数リスト.
 */
const getFfmpegOptions = (
  input: string | undefined,
  isDualMono: boolean,
  plugin: FfmpegOptionsPlugin,
): string[] => {
  const args: string[] = [];
  if (input) {
    if (plugin.hardwareOptions) {
      args.push(...plugin.hardwareOptions);
    }
    args.push("-fix_sub_duration", "-y", "-i", input);
  }
  args.push(...plugin.videoStreamOptions(input === undefined));
  args.push(...plugin.audioStreamOptions(isDualMono));
  args.push("-map", "0:s?", "-c:s", "mov_text");
  args.push(...plugin.qualityOptions);
  if (input === undefined) {
    args.push("-stats", "-aspect", "16:9");
  }
  return args;
};

export { FfmpegOptionsPlugin, getFfmpegOptions };
