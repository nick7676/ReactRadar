#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { analyzeCommand } from "./commands/analyze.js";

yargs(hideBin(process.argv)).command(analyzeCommand).demandCommand(1).help().parse();
