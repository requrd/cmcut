interface VideoStreamOptionsFunction {
  (encodeInJlse?: boolean): string[];
}

interface AudioStreamOptionsFunction {
  (isDualMono: boolean): string[];
}

interface QualityOptionsFunction {
  (encodeInJlse?: boolean): string[];
}

interface FfmpegOptionsPlugin {
  videoStreamOptions: VideoStreamOptionsFunction;
  audioStreamOptions: AudioStreamOptionsFunction;
  qualityOptions: QualityOptionsFunction;
}

const getFfmpegOptions = (
  input: string | undefined,
  isDualMono: boolean,
  plugin: FfmpegOptionsPlugin
): string[] => {
  const args: string[] = [];
  if (input) {
    args.push("-y", "-i", input);
  }
  args.push(...plugin.videoStreamOptions(input !== undefined));
  args.push(...plugin.audioStreamOptions(isDualMono));
  args.push("-ignore_unknown");
  return args.concat(...plugin.qualityOptions(input !== undefined));
};

export { FfmpegOptionsPlugin, getFfmpegOptions };
