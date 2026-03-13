import chalk from "chalk";
import type { NavigationMetricsResult } from "../interfaces/NavigationMetricsResult.js";

export const printNavigationMetrics = (result: NavigationMetricsResult, targetDir: string) => {
  const sortedComponents = [...result.components].sort((a, b) => {
    const depthA = a.depth ?? Infinity;
    const depthB = b.depth ?? Infinity;
    if (depthA !== depthB) return depthA - depthB;
    return a.name.localeCompare(b.name);
  });

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
      const childrenInfo =
        node.children.length > 0 ? ` ${chalk.gray(`(${node.children.length} children)`)}` : "";
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

