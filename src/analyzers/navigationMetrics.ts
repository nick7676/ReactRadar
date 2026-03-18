import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import { detectComponent, parseFile } from "../utils/componentDetection.js";
import type { ComponentNode } from "../interfaces/ComponentNode.js";
import type { NavigationMetricsResult } from "../interfaces/NavigationMetricsResult.js";

type ASTNode = { type: string; [k: string]: unknown };

function walk(node: ASTNode, fn: (n: ASTNode) => void): void {
  fn(node);
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "loc" || key === "range" || key === "parent")
      continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === "object" && "type" in item)
          walk(item as ASTNode, fn);
      }
    } else if (val && typeof val === "object" && "type" in (val as object)) {
      walk(val as ASTNode, fn);
    }
  }
}

interface FileAnalysis {
  componentName: string;
  filePath: string;
  imports: Map<string, string>;
  jsxTags: Set<string>;
}

function extractImportsAndJSX(ast: ASTNode): {
  imports: Map<string, string>;
  jsxTags: Set<string>;
} {
  const imports = new Map<string, string>();
  const jsxTags = new Set<string>();

  walk(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      const source = (node.source as { value?: string })?.value;
      if (!source) return;
      const specifiers = node.specifiers as ASTNode[] | undefined;
      for (const spec of specifiers ?? []) {
        if (
          spec.type === "ImportDefaultSpecifier" ||
          spec.type === "ImportSpecifier"
        ) {
          const local = (spec.local as { name?: string })?.name;
          if (local) imports.set(local, source);
        }
      }
    }

    if (node.type === "JSXOpeningElement") {
      const nameNode = node.name as ASTNode;
      if (nameNode?.type === "JSXIdentifier") {
        const tagName = (nameNode as unknown as { name: string }).name;
        if (/^[A-Z]/.test(tagName)) jsxTags.add(tagName);
      }
      if (nameNode?.type === "JSXMemberExpression") {
        const obj = (nameNode as { object?: ASTNode }).object;
        if (obj?.type === "JSXIdentifier") {
          const tagName = (obj as unknown as { name: string }).name;
          if (/^[A-Z]/.test(tagName)) jsxTags.add(tagName);
        }
      }
    }
  });

  return { imports, jsxTags };
}

function tryResolve(
  source: string,
  importerDir: string,
  pathIndex: Map<string, string>
): string | null {
  const resolved = path.resolve(importerDir, source);
  const candidates = [
    resolved,
    resolved + ".tsx",
    resolved + ".jsx",
    resolved + ".ts",
    resolved + ".js",
    path.join(resolved, "index.tsx"),
    path.join(resolved, "index.jsx"),
    path.join(resolved, "index.ts"),
    path.join(resolved, "index.js"),
  ];
  for (const c of candidates) {
    const hit = pathIndex.get(c);
    if (hit) return hit;
  }
  return null;
}

export async function analyzeComponentNavigation({
  rootPath,
}: {
  rootPath: string;
}): Promise<NavigationMetricsResult> {
  const resolvedRoot = path.resolve(rootPath);
  const files = await fg(["**/*.{tsx,jsx,ts,js}"], {
    cwd: resolvedRoot,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
    absolute: true,
  });

  const parsed = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf8");
      const info = detectComponent(file, content);
      if (!info.isComponent) return null;

      const componentName =
        info.name ?? path.basename(file, path.extname(file));
      const ast = parseFile(file, content);
      if (!ast) return null;

      const { imports, jsxTags } = extractImportsAndJSX(ast);
      return {
        componentName,
        filePath: file,
        imports,
        jsxTags,
      } satisfies FileAnalysis;
    })
  );

  const analyses = parsed.filter((a): a is FileAnalysis => a !== null);

  const pathIndex = new Map<string, string>();
  const nameIndex = new Map<string, FileAnalysis>();

  for (const a of analyses) {
    pathIndex.set(a.filePath, a.componentName);
    const withoutExt = a.filePath.replace(/\.(tsx|jsx|ts|js)$/, "");
    pathIndex.set(withoutExt, a.componentName);
    if (path.basename(withoutExt) === "index") {
      pathIndex.set(path.dirname(a.filePath), a.componentName);
    }
    nameIndex.set(a.componentName, a);
  }

  const childrenMap = new Map<string, Set<string>>();
  const parentsMap = new Map<string, Set<string>>();
  for (const a of analyses) {
    childrenMap.set(a.componentName, new Set());
    parentsMap.set(a.componentName, new Set());
  }

  const addRelation = (parent: string, child: string) => {
    childrenMap.get(parent)!.add(child);
    if (!parentsMap.has(child)) parentsMap.set(child, new Set());
    parentsMap.get(child)!.add(parent);
  };

  for (const analysis of analyses) {
    const importerDir = path.dirname(analysis.filePath);
    const resolvedImports = new Set<string>();

    for (const [localName, source] of analysis.imports) {
      if (!analysis.jsxTags.has(localName)) continue;

      let resolved: string | null = null;
      if (source.startsWith(".")) {
        resolved = tryResolve(source, importerDir, pathIndex);
      }
      if (!resolved && nameIndex.has(localName)) {
        resolved = localName;
      }

      if (resolved && resolved !== analysis.componentName) {
        addRelation(analysis.componentName, resolved);
        resolvedImports.add(localName);
      }
    }

    for (const tag of analysis.jsxTags) {
      if (resolvedImports.has(tag)) continue;
      if (nameIndex.has(tag) && tag !== analysis.componentName) {
        addRelation(analysis.componentName, tag);
      }
    }
  }

  const depthMap = new Map<string, number>();
  const roots = analyses.filter(
    (a) => !parentsMap.get(a.componentName)?.size
  );
  const queue: { name: string; depth: number }[] = roots.map((r) => ({
    name: r.componentName,
    depth: 0,
  }));

  while (queue.length > 0) {
    const { name, depth } = queue.shift()!;
    if (depthMap.has(name)) continue;
    depthMap.set(name, depth);
    const children = childrenMap.get(name);
    if (children) {
      for (const child of children) {
        if (!depthMap.has(child))
          queue.push({ name: child, depth: depth + 1 });
      }
    }
  }

  const components: ComponentNode[] = analyses.map((a) => ({
    name: a.componentName,
    filePath: a.filePath,
    children: [...(childrenMap.get(a.componentName) ?? [])],
    parents: [...(parentsMap.get(a.componentName) ?? [])],
    depth: depthMap.get(a.componentName),
  }));

  const total = components.length;
  const depths = components.map((c) => c.depth ?? 0);
  const childCounts = components.map((c) => c.children.length);

  const avgDepth =
    total > 0 ? depths.reduce((a, b) => a + b, 0) / total : 0;
  const avgChildren =
    total > 0 ? childCounts.reduce((a, b) => a + b, 0) / total : 0;

  const relations = components
    .filter((c) => c.children.length > 0)
    .map((c) => ({ parent: c.name, children: c.children }));

  return {
    components,
    avgDepth,
    avgChildren,
    totalComponents: total,
    relations,
  };
}
