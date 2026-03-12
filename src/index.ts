import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .command(
    "analyze",
    "Analyze your React project",
    (yargs) => {
      return yargs.option("format", {
        alias: "f",
        type: "string",
        choices: ["table", "json"] as const,
        default: "table",
        description: "Output format",
      });
    },
    (argv) => {
      console.log(`Running analyze in ${argv.format} format...`);
    }
  )
  .demandCommand(1, "You must provide a command")
  .help()
  .parse();