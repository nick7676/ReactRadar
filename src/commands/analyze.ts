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
        choices: ["table"] as const,
        default: "table",
        description: "Output format",
      })
      .option("path", {
        alias: "p",
        type: "string",
        description: "Directory to scan",
      }),
  handler: (argv) => analyzeHandler(argv as any),
};
