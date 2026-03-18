import type { CommandModule } from "yargs";
import { analyzeHandler } from "../handlers/analyze.handler.js";

export const analyzeCommand: CommandModule = {
  command: "analyze",
  describe: "Analyze your React project",
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
  handler: (argv) => analyzeHandler(argv as any),
};
