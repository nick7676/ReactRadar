import type { CommandModule } from "yargs";
import { watchHandler } from "../handlers/watch.handler.js";

export const watchCommand: CommandModule = {
  command: "watch",
  describe: "Connect to a running React localhost and monitor rendered components",
  builder: (yargs) =>
    yargs.option("port", {
      alias: "p",
      type: "number",
      default: 3000,
      description: "Port of the React localhost (default: 3000)",
    }),
  handler: (argv) => {
    watchHandler(argv as any);
  },
};
