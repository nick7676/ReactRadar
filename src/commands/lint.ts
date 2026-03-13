import type { CommandModule } from "yargs";
import { lintHandler } from "../handlers/lint.handler.js";

export const lintCommand: CommandModule = {
  command: "lint",
  describe: "Check for errors and unused variables in React components",
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
    lintHandler(argv as any);
  },
};