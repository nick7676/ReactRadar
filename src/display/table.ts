import CliTable3 from "cli-table3";
import chalk from "chalk";
import path from "path";
import type { ComponentFile } from "../utils/findComponent.js";

const MAX_PATH = 40;
const MAX_NAME = 30;

const truncate = (value: string, max: number) =>
  value.length > max ? value.slice(0, max - 1) + "…" : value;

const getStatus = (loc: number) => {
  const icon = "■";
  if (loc > 300) return chalk.red.bold(icon);
  if (loc > 200) return chalk.yellow(icon);
  return chalk.green(icon);
};

export const table = (files: ComponentFile[]) => {
  const t = new CliTable3({
    head: ["path", "name", "lines", ""],
    style: { head: [], border: [] },
  });

  files.forEach((f) => {
    const dir = path.relative(process.cwd(), path.dirname(f.filePath));
    t.push([
      truncate(dir || ".", MAX_PATH),
      truncate(f.componentName, MAX_NAME),
      f.loc,
      getStatus(f.loc),
    ]);
  });

  return t.toString();
};
