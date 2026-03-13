import fs from "fs";
import chalk from "chalk";
import Table from "cli-table3";
import { analyzeComponentNavigation } from "../analyzers/navigationMetrics.js";

export const parentsHandler = async (argv: { path?: string; format?: "table" | "json" }) => {
  const targetDir = argv.path || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`\nNo directory found: ${targetDir}\n`));
    process.exit(1);
  }

  const result = await analyzeComponentNavigation({ rootPath: targetDir });

  if (result.totalComponents === 0) {
    console.log(chalk.yellow("\nNo React components found.\n"));
    return;
  }

  if (argv.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(chalk.blue(`\nReactRadar Component Navigation Metrics (${targetDir})\n`));

  const table = new Table({
    head: [
      chalk.cyan("Component"),
      chalk.cyan("Depth"),
      chalk.cyan("Children Count")
    ],
    style: { head: [], border: [] },
  });

  const sortedComponents = [...result.components].sort((a, b) => {
    const depthA = a.depth ?? Infinity;
    const depthB = b.depth ?? Infinity;
    if (depthA !== depthB) return depthA - depthB;
    return a.name.localeCompare(b.name);
  });

  sortedComponents.forEach((c) => {
    table.push([
      c.name,
      c.depth !== undefined ? c.depth.toString() : "-",
      c.children.length.toString()
    ]);
  });

  console.log(table.toString());

  const summaryTable = new Table({
    head: [
      chalk.magenta("Total Components"),
      chalk.magenta("Avg Depth"),
      chalk.magenta("Avg Children / Component")
    ],
    style: { head: [], border: [] },
  });

  summaryTable.push([
    result.totalComponents.toString(),
    result.avgDepth.toFixed(2),
    result.avgChildren.toFixed(2)
  ]);

  console.log("\n" + summaryTable.toString() + "\n");

  console.log(chalk.blue(`Component Render Tree:\n`));
  const roots = sortedComponents.filter((c) => c.parents.length === 0);
  const componentMap = new Map(result.components.map((c) => [c.name, c]));

  const printTree = (nodeName: string, indent: string, visited: Set<string>) => {
    const node = componentMap.get(nodeName);
    if (!node) {
      console.log(`${indent}-> ${chalk.gray(nodeName)}`);
      return;
    }

    if (indent !== "") {
      const childrenInfo = node.children.length > 0 ? ` ${chalk.gray(`(${node.children.length} children)`)}` : "";
      console.log(`${indent}-> ${node.name}${childrenInfo}`);
    } else {
      console.log(chalk.green(`${node.name}:`));
    }

    if (visited.has(node.name)) {
      if (node.children.length > 0) {
        console.log(`${indent}  ${chalk.red("[Circular]")}`);
      }
      return;
    }

    visited.add(node.name);

    const nextIndent = indent === "" ? "  " : indent + "  ";
    for (const childName of node.children) {
      printTree(childName, nextIndent, new Set(visited));
    }
  };

  roots.forEach((root) => {
    printTree(root.name, "", new Set());
    console.log();
  });
};
