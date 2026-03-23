import type { CommandModule } from "yargs";
import { lintHandler } from "../handlers/lint.handler.js";
import type { SharedArgv } from "./sharedOptions.js";
import { sharedOptions } from "./sharedOptions.js";

export type LintArgv = SharedArgv & { verbose?: boolean };

export const lintCommand: CommandModule<{}, LintArgv> = {
  command: "lint",
  describe: "Check for errors and unused variables in React components",
  builder: (yargs) =>
    sharedOptions(yargs).option("verbose", {
      alias: "v",
      type: "boolean",
      default: false,
      describe: "Log scanned files and ESLint setup on stderr",
    }),
  handler: (argv) => {
    lintHandler(argv);
  },
};
