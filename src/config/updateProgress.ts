import { Progress } from "./Progress";

/**
 * 取得したログから状態を更新する
 * @param {string} line -  e.g." frame= 2847 fps=0.0 q=-1.0 Lsize=  216432kB time=00:01:35.64 bitrate=18537.1kbits/s speed= 222x"
 * @param {Object} progress
 * @returns progress - 更新済みのprogress
 */
const updateToFfmpeg = (line: string, progress: Progress) => {
  const encoding: {
    [key: string]: any;
    frame?: number;
    fps?: number;
    q?: number;
    time?: string;
    speed?: string;
  } = {};
  const fields = (line + " ").match(/[A-z]*=[A-z,0-9,\s,.,\/,:,-]* /g);
  if (fields === null) {
    return progress;
  }
  for (const field of fields) {
    encoding[field.split("=")[0]] = field
      .split("=")[1]
      .replace(/\r/g, "")
      .trim();
  }
  encoding["frame"] = parseInt(String(encoding["frame"] || "0"));
  encoding["fps"] = parseFloat(String(encoding["fps"] || "0"));
  encoding["q"] = parseFloat(String(encoding["q"] || "0"));

  // 進捗率 1.0 で 100%
  if (encoding.time) {
    progress.now_num = encoding.time
      .split(":")
      .reduce(
        (prev: number, curr: string, i: number) => prev + parseFloat(curr) * 60 ** (2 - i),
        0,
      );
  } else {
    progress.now_num = 0;
  }
  progress.total_num = progress.duration;
  progress.log = `(${progress.step}/${progress.steps}) FFmpeg: time=${encoding.time} speed=${encoding.speed}`;
  progress.log_updated = true;
  return progress;
};

const updateToAviSynth = (line: string, progress: Progress) => {
  const encoding: { [key: string]: any } = {};
  const raw_avisynth_data = line.replace(/AviSynth\s/, "");
  const creatingMatch = raw_avisynth_data.match(
    /Creating\slwi\sindex\sfile\s(\d+)%/,
  );
  if (creatingMatch) {
    progress.total_num = 200;
    progress.now_num = Number(creatingMatch[1]);
    progress.now_num += progress.avisynth_flag ? 100 : 0;
    progress.avisynth_flag = progress.avisynth_flag
      ? true
      : progress.now_num == 100
      ? true
      : false;
  }
  progress.log_updated = true;
  progress.log = `(${progress.step}/${progress.steps}) AviSynth:Creating lwi index files`;
  return progress;
};

const updateToLogoFrame = (line: string, progress: Progress) => {
  const raw_logoframe_data = line.replace(/logoframe\s/, "");
  if (raw_logoframe_data.startsWith("checking") && raw_logoframe_data) {
    const logoframe = raw_logoframe_data.match(
      /checking\s*(\d+)\/(\d+)\sended./,
    );
    if (logoframe !== null) {
      progress.now_num = Number(logoframe[1]);
      progress.total_num = Number(logoframe[2]);
      progress.log_updated = true;
    }
  }
  progress.log = `(${progress.step}/${progress.steps}) logoframe: ${progress.now_num}/${progress.total_num}`;
  return progress;
};

const updateToChapter = (line: string, progress: Progress) => {
  const raw_chapter_exe_data = line.replace(/chapter_exe\s/, "");
  const videoFramesMatch = raw_chapter_exe_data.match(
    /\tVideo\sFrames:\s(\d+)\s\[\d+\.\d+fps\]/,
  );
  if (videoFramesMatch) {
    progress.total_num = Number(videoFramesMatch[1]);
    progress.log_updated = true;
  }

  const muteMatch = raw_chapter_exe_data.match(
    /mute\s?\d+:\s(\d+)\s\-\s\d+フレーム/,
  );
  if (muteMatch) {
    progress.now_num = Number(muteMatch[1]);
    progress.log_updated = true;
  }

  if (raw_chapter_exe_data.startsWith("end")) {
    progress.now_num = progress.total_num;
    progress.log_updated = true;
  }
  progress.log = `(${progress.step}/${progress.steps}) Chapter_exe: ${progress.now_num}/${progress.total_num}`;
  return progress;
};

const applyUpdate = (line: string, progress: Progress) => {
  const steps = new Map([
    ["AviSynth", updateToAviSynth],
    ["chapter_exe", updateToChapter],
    ["logoframe", updateToLogoFrame],
    ["frame", updateToFfmpeg],
  ]);
  progress.steps = steps.size;
  progress.step = 0;
  for (const [text, fn] of steps) {
    progress.step += 1;
    const matchResult = line.match(new RegExp(`^${text}`, "i"));
    if (matchResult) {
      try {
        return fn(line, progress);
      } catch (e) {
        console.error(e);
        return progress;
      }
    }
  }
  // 進捗表示に必要ない出力データを流す
  console.log(line);
  return progress;
};

/**
 * jlse実行中のログ行を解析し、進捗が更新された場合に標準出力する
 * @param {string} line - ログ行
 * @param {Object} progress - 直前までの進捗
 * @returns Object - 更新済みの進捗
 */
const updateProgress = (line: string, progress: Progress) => {
  progress = applyUpdate(line, progress);
  progress.percent = progress.now_num / progress.total_num;
  if (progress.log_updated) {
    console.log(
      JSON.stringify({
        type: "progress",
        percent: progress.percent,
        log: progress.log,
      }),
    );
    progress.log_updated = false;
  }
  return progress;
};
export { updateProgress };
