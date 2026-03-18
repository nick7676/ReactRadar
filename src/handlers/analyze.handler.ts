import fs from "fs/promises";
import chalk from "chalk";
import { table } from "../display/table.js";
import { findComponent } from "../utils/findComponent.js";
import { consoleColor } from "../utils/colorFunction.js";

export const analyzeHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
}) => {
  const targetDir = argv.path || process.cwd();

  try {
    await fs.access(targetDir);
  } catch {
    console.error(chalk.red(`\nNo directory found: ${targetDir}\n`));
    process.exit(1);
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
