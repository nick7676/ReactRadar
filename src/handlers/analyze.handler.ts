import chalk from "chalk";
import fs from "fs";
import { findComponent } from "../utils/findComponent.js";
import path from "path";

export const analyzeHandler = (argv: { path?: string }) => {
  const targetDir = argv.path || path.join(process.cwd(), "src");

  if (!fs.existsSync(targetDir)) {
    console.log(chalk.red(`\nNo directory found: ${targetDir}\n`));
    return;
  }

  console.log(chalk.blue(`\nReactRadar is scanning: ${targetDir}\n`));

  const files = findComponent(targetDir);

  files.forEach((f) => {
    const fileName = path.relative(process.cwd(), f.name);
    const output = `${fileName} -> ${f.loc} Lines`;

    if (f.loc > 300) {
      console.log(chalk.red.bold(output));
    } else if (f.loc > 200) {
      console.log(chalk.yellow(output));
    } else {
      console.log(chalk.green(output));
    }
  });
};