#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { analyzeCommand } from "./commands/analyze.js";
import { parentsCommand } from "./commands/parents.js";

yargs(hideBin(process.argv))
  .command(analyzeCommand)
  .command(parentsCommand)
  .demandCommand(1)
  .help()
  .parse();
