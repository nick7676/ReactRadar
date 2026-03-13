#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { analyzeCommand } from "./commands/analyze.js";
import { parentsCommand } from "./commands/parents.js";
import { lintCommand } from "./commands/lint.js";

yargs(hideBin(process.argv))
  .command(analyzeCommand)
  .command(parentsCommand)
  .command(lintCommand)
  .demandCommand(1)
  .help()
  .parse();