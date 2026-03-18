import type { Argv } from "yargs";

export interface SharedArgv {
  path?: string;
  format?: "table" | "json";
}

export const sharedOptions = <T>(yargs: Argv<T>): Argv<T & SharedArgv> =>
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
      description: "Directory to scan",
    });

