import type { CommandModule } from "yargs";
import { parentsHandler } from "../handlers/parents.handler.js";

export const parentsCommand: CommandModule = {
  command: "parents",
  describe: "Analyze static parent-child relationships between React components",
  builder: (yargs) =>
    yargs
      .option("format", {
        alias: "f",
        type: "string",
        choices: ["table", "json"] as const,
        default: "table",
        description: "Output format",
      })
      .option("path", {
        alias: "p",
        type: "string",
        description: "Directory to scan (default: ./src)",
      }),
  handler: (argv) => {
    parentsHandler(argv as any);
  },
};
