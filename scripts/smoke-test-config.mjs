// EPGStation の config ディレクトリに置いたスクリプトが Node で読み込めるかを確認する.
//
// 使い方: node scripts/smoke-test-config.mjs <dir>
//
// エンコード用スクリプトは読み込んだ時点で処理を始めるため import はせず,
// 環境変数を空にして1ファイルずつ別プロセスで実行する.
// 必須の環境変数が無いところで止まるのは正常で, モジュールの読み込み自体に
// 失敗した場合 (CJS/ESM の不一致, 依存パッケージの欠落, 構文エラーなど) だけを失敗とする.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const LOAD_ERRORS = [
  /in ES module scope/, // exports / require is not defined in ES module scope
  /ERR_MODULE_NOT_FOUND/,
  /ERR_UNSUPPORTED_DIR_IMPORT/,
  /ERR_UNKNOWN_FILE_EXTENSION/,
  /ERR_PACKAGE_PATH_NOT_EXPORTED/,
  /ERR_REQUIRE_ESM/,
  /does not provide an export named/,
  /^SyntaxError/m,
];

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node smoke-test-config.mjs <dir>");
  process.exit(2);
}

const files = readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
if (files.length === 0) {
  console.error(`no .js files in ${dir}`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [resolve(join(dir, file))], {
    env: { PATH: process.env.PATH },
    encoding: "utf-8",
    timeout: 10_000,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const loadError = LOAD_ERRORS.find((pattern) => pattern.test(output));
  if (result.error || loadError) {
    failed++;
    console.error(`NG ${file}`);
    console.error(result.error?.message ?? output.trim());
  } else {
    console.log(`OK ${file}`);
  }
}

if (failed > 0) {
  console.error(`${failed}/${files.length} file(s) failed to load`);
  process.exit(1);
}
console.log(`all ${files.length} file(s) loaded`);
