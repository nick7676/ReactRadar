import chalk from "chalk";
import { table } from "../display/table.js";
import { findComponent } from "../utils/findComponent.js";
import { consoleColor } from "../utils/colorFunction.js";
import { validateDirectory } from "../utils/validateDirectory.js";

export const analyzeHandler = async (argv: {
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

  console.log(
    consoleColor(
      { type: "keyword", value: "blue" },
      `\nReactRadar is scanning: ${targetDir}\n`
    )
  );

  const files = await findComponent(targetDir);

  if (!files.length) {
    console.log(
      consoleColor(
        { type: "ansi", color: "yellow" },
        "No components found."
      )
    );
    return;
  }

  if (argv.format === "json") {
    console.log(JSON.stringify(files, null, 2));
    return;
  }

  console.log(table(files));
};
