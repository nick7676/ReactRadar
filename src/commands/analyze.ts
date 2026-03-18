import type { CommandModule } from "yargs";
import { analyzeHandler } from "../handlers/analyze.handler.js";
import type { SharedArgv } from "./sharedOptions.js";
import { sharedOptions } from "./sharedOptions.js";

export const analyzeCommand: CommandModule<{}, SharedArgv> = {
  command: "analyze",
  describe: "Analyze your React project",
  builder: (yargs) =>
    sharedOptions(yargs),
  handler: (argv) => analyzeHandler(argv),
};
