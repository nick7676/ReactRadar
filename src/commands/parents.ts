import type { CommandModule } from "yargs";
import { parentsHandler } from "../handlers/parents.handler.js";
import type { SharedArgv } from "./sharedOptions.js";
import { sharedOptions } from "./sharedOptions.js";

export const parentsCommand: CommandModule<{}, SharedArgv> = {
  command: "parents",
  describe:
    "Analyze static parent-child relationships between React components",
  builder: (yargs) => sharedOptions(yargs),
  handler: (argv) => {
    parentsHandler(argv);
  },
};
