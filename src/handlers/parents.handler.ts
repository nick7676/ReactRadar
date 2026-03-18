import fs from "fs";
import chalk from "chalk";
import { analyzeComponentNavigation } from "../analyzers/navigationMetrics.js";
import { printNavigationMetrics } from "../display/navigationMetrics.js";

export const parentsHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
}) => {
  const targetDir = argv.path || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`\nNo directory found: ${targetDir}\n`));
    process.exit(1);
  }

  const result = await analyzeComponentNavigation({ rootPath: targetDir });

  if (result.totalComponents === 0) {
    console.log(chalk.yellow("\nNo React components found.\n"));
    return;
  }

  if (argv.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printNavigationMetrics(result, targetDir);
};
