import chalk from "chalk";
import fs from "fs";
import { table } from "../display/table.js";
import { findComponent } from "../utils/findComponent.js";

export const analyzeHandler = (argv: { path?: string }) => {
  const targetDir = argv.path || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.log(chalk.red(`\nNo directory found: ${targetDir}\n`));
    return;
  }

  console.log(chalk.blue(`\nReactRadar is scanning: ${targetDir}\n`));

  const files = findComponent(targetDir);

  if (!files.length) {
    console.log(chalk.yellow("No components found."));
    return;
  }

  table(files);
};