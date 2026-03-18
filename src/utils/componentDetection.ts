import path from "path";
import { parse } from "@typescript-eslint/parser";

type ASTNode = { type: string; [k: string]: unknown };

function walk(node: ASTNode, fn: (n: ASTNode) => boolean): boolean {
  if (fn(node)) return true;
  const keys = Object.keys(node) as (keyof ASTNode)[];
  for (const key of keys) {
    if (key === "type" || key === "loc" || key === "range" || key === "parent")
      continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          walk(item as ASTNode, fn)
        )
          return true;
      }
    } else if (val && typeof val === "object" && "type" in (val as object)) {
      if (walk(val as ASTNode, fn)) return true;
    }
  }
  return false;
}

function hasJSX(ast: ASTNode): boolean {
  return walk(ast, (n) => n.type === "JSXElement" || n.type === "JSXFragment");
}

function isPascalCase(s: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(s) && s.length > 0;
}

function getExportedComponentName(ast: ASTNode): string | null {
  const body = (ast as { body?: ASTNode[] }).body;
  if (!Array.isArray(body)) return null;
  for (const stmt of body) {
    const n = stmt as ASTNode;
    if (n.type === "ExportDefaultDeclaration") {
      const decl = n.declaration as ASTNode;
      if (
        decl.type === "FunctionDeclaration" ||
        decl.type === "ClassDeclaration"
      ) {
        const id = decl.id as unknown as { name?: string } | undefined;
        if (id?.name && isPascalCase(id.name)) return id.name;
        if (id?.name) return id.name;
      }
      if (decl.type === "Identifier") {
        const name = (decl as unknown as { name?: string }).name;
        if (name) return name;
      }
      if (
        decl.type === "CallExpression" ||
        decl.type === "ArrowFunctionExpression" ||
        decl.type === "FunctionExpression"
      )
        return null;
    }
    if (n.type === "ExportNamedDeclaration") {
      const decl = n.declaration as ASTNode | undefined;
      if (decl?.type === "VariableDeclaration") {
        const declarations = decl.declarations as
          | Array<{ id: ASTNode; init?: ASTNode }>
          | undefined;
        for (const d of declarations ?? []) {
          if (d.id?.type === "Identifier") {
            const name = (d.id as unknown as { name: string }).name;
            if (
              isPascalCase(name) &&
              d.init &&
              ((d.init as ASTNode).type === "ArrowFunctionExpression" ||
                (d.init as ASTNode).type === "FunctionExpression")
            )
              return name;
          }
        }
      }
      if (
        decl?.type === "FunctionDeclaration" ||
        decl?.type === "ClassDeclaration"
      ) {
        const id = decl.id as unknown as { name?: string } | undefined;
        if (id?.name) return id.name;
      }
    }
  }
  return null;
}

function isExportedComponent(ast: ASTNode): boolean {
  const body = (ast as { body?: ASTNode[] }).body;
  if (!Array.isArray(body)) return false;
  for (const stmt of body) {
    const n = stmt as ASTNode;
    if (n.type === "ExportDefaultDeclaration") {
      const decl = n.declaration as ASTNode;
      if (
        decl.type === "FunctionDeclaration" ||
        decl.type === "ClassDeclaration"
      )
        return true;
      if (decl.type === "Identifier") return true;
      if (
        decl.type === "ArrowFunctionExpression" ||
        decl.type === "FunctionExpression"
      )
        return true;
      if (decl.type === "CallExpression") return true;
    }
    if (n.type === "ExportNamedDeclaration") {
      const decl = n.declaration as ASTNode | undefined;
      if (decl?.type === "VariableDeclaration") {
        for (const d of (decl.declarations as Array<{
          id: ASTNode;
          init?: ASTNode;
        }>) ?? []) {
          if (
            d.id?.type === "Identifier" &&
            isPascalCase((d.id as unknown as { name: string }).name) &&
            d.init &&
            ((d.init as ASTNode).type === "ArrowFunctionExpression" ||
              (d.init as ASTNode).type === "FunctionExpression")
          )
            return true;
        }
      }
      if (
        decl?.type === "FunctionDeclaration" ||
        decl?.type === "ClassDeclaration"
      )
        return true;
    }
  }
  return false;
}

export function isReactComponent(fullPath: string, content: string): boolean {
  const ext = path.extname(fullPath);
  if (ext !== ".tsx" && ext !== ".jsx" && ext !== ".ts" && ext !== ".js")
    return false;
  try {
    const ast = parse(content, {
      filePath: fullPath,
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    }) as unknown as ASTNode;
    if ((ext === ".tsx" || ext === ".jsx") && hasJSX(ast)) return true;
    return isExportedComponent(ast);
  } catch {
    return false;
  }
}

export function getComponentName(
  fullPath: string,
  content: string
): string | null {
  try {
    const ast = parse(content, {
      filePath: fullPath,
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    }) as unknown as ASTNode;
    return getExportedComponentName(ast);
  } catch {
    return null;
  }
}
