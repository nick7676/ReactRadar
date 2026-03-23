import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const CLI_PATH = path.join(repoRoot, "dist/index.js");

export function runCLI(args: string[]): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const env = { ...process.env };
  delete env.FORCE_COLOR;
  env.NO_COLOR = "1";
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
    env,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}
