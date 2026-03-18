import chalk from "chalk";
import { analyzeComponentNavigation } from "../analyzers/navigationMetrics.js";
import { printNavigationMetrics } from "../display/navigationMetrics.js";
import { consoleColor } from "../utils/colorFunction.js";
import { validateDirectory } from "../utils/validateDirectory.js";

export const parentsHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
}) => {
  const targetDir = argv.path || process.cwd();

  try {
    await validateDirectory(targetDir);
  } catch (err) {
    console.error(chalk.red(`\n${(err as Error).message}\n`));
    process.exitCode = 1;
    return;
  }

  const result = await analyzeComponentNavigation({ rootPath: targetDir });

  if (result.totalComponents === 0) {
    console.log(
      consoleColor(
        { type: "ansi", color: "yellow" },
        "\nNo React components found.\n"
      )
    );
    return;
  }

  if (argv.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printNavigationMetrics(result, targetDir);
};
