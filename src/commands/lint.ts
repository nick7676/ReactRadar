import type { CommandModule } from "yargs";
import { lintHandler } from "../handlers/lint.handler.js";
import type { SharedArgv } from "./sharedOptions.js";
import { sharedOptions } from "./sharedOptions.js";

export const lintCommand: CommandModule<{}, SharedArgv> = {
  command: "lint",
  describe: "Check for errors and unused variables in React components",
  builder: (yargs) =>
    sharedOptions(yargs),
  handler: (argv) => {
    lintHandler(argv);
  },
};
