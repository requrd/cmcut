interface Progress {
  total_num: number;
  now_num: number;
  avisynth_flag: boolean;
  percent: number;
  log_updated: boolean;
  log: string;
  duration: number;
  steps: number;
  step: number;
}
export { Progress };
