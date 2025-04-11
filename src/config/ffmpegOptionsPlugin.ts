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
