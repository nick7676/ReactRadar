import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import type { NavigationMetricsResult } from "../interfaces/NavigationMetricsResult.js";
import type { ComponentNode } from "../interfaces/ComponentNode.js";
import {
  isReactComponent,
  getComponentName,
} from "../utils/componentDetection.js";

export async function analyzeComponentNavigation(options: {
  rootPath: string;
}): Promise<NavigationMetricsResult> {
  const rootPath = path.resolve(options.rootPath);
  const files = fg.sync(["**/*.{tsx,jsx,ts,js}"], {
    cwd: rootPath,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
    absolute: true,
  });

  const componentsByName = new Map<string, ComponentNode>();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    if (!isReactComponent(file, content)) continue;

    const nameFromAST = getComponentName(file, content);
    let name = nameFromAST ?? path.basename(file, path.extname(file));
    if (name.toLowerCase() === "index") {
      name = path.basename(path.dirname(file));
    }

    const childrenMatches = Array.from(
      content.matchAll(/<([A-Z][a-zA-Z0-9]*)\b/g)
    ).map((m) => m[1] as string);
    const childrenNames = Array.from(new Set(childrenMatches));

    if (!componentsByName.has(name)) {
      componentsByName.set(name, {
        name,
        filePath: file,
        children: childrenNames,
        parents: [],
      });
    }
  }

  for (const [name, node] of componentsByName.entries()) {
    for (const childName of node.children) {
      const childNode = componentsByName.get(childName);
      if (childNode) {
        childNode.parents.push(name);
      } else {
        componentsByName.set(childName, {
          name: childName,
          filePath: "",
          children: [],
          parents: [name],
        });
      }
    }
  }

  const roots = Array.from(componentsByName.values()).filter(
    (n) => n.parents.length === 0
  );
  for (const node of componentsByName.values()) {
    // Reset depths before BFS recomputation
    delete node.depth;
  }

  const queue = roots.map((r) => ({ node: r, depth: 0 }));

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (node.depth !== undefined && depth >= node.depth) continue;
    node.depth = depth;

    for (const childName of node.children) {
      const child = componentsByName.get(childName);
      if (child && (child.depth === undefined || depth + 1 < child.depth)) {
        queue.push({ node: child, depth: depth + 1 });
      }
    }
  }

  const components = Array.from(componentsByName.values());
  const totalComponents = components.length;

  let sumDepth = 0;
  let countWithDepth = 0;
  let sumChildren = 0;

  for (const comp of components) {
    if (comp.depth !== undefined) {
      sumDepth += comp.depth;
      countWithDepth++;
    }
    sumChildren += comp.children.length;
  }

  const avgDepth = countWithDepth > 0 ? sumDepth / countWithDepth : 0;
  const avgChildren = totalComponents > 0 ? sumChildren / totalComponents : 0;

  const relations = components.map((c) => ({
    parent: c.name,
    children: c.children,
  }));

  return {
    components,
    avgDepth,
    avgChildren,
    totalComponents,
    relations,
  };
}
