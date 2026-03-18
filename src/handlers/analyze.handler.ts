import fs from "fs";
import { table } from "../display/table.js";
import { findComponent } from "../utils/findComponent.js";
import { consoleColor } from "../utils/colorFunction.js";

export const analyzeHandler = async (argv: {
  path?: string;
  format?: "table" | "json";
}) => {
  const targetDir = argv.path || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.log(
      consoleColor(
        { type: "keyword", value: "red" },
        `\nNo directory found: ${targetDir}\n`
      )
    );
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
