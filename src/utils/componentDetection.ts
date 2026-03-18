import path from "path";
import { parse } from "@typescript-eslint/parser";

type ASTNode = { type: string; [k: string]: unknown };

function walk(node: ASTNode, fn: (n: ASTNode) => boolean): boolean {
  if (fn(node)) return true;
  for (const key of Object.keys(node)) {
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
  return /^[A-Z][a-zA-Z0-9]*$/.test(s);
}

interface IdLike {
  name?: string;
}

interface DeclaratorLike {
  id: ASTNode;
  init?: ASTNode;
}

function getExportedComponentName(ast: ASTNode): string | null {
  const body = (ast as { body?: ASTNode[] }).body;
  if (!Array.isArray(body)) return null;

  for (const stmt of body) {
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration as ASTNode;
      if (
        decl.type === "FunctionDeclaration" ||
        decl.type === "ClassDeclaration"
      ) {
        const id = decl.id as IdLike | undefined;
        if (id?.name) return id.name;
      }
      if (decl.type === "Identifier") {
        const id = decl as unknown as IdLike;
        if (id.name) return id.name;
      }
      if (
        decl.type === "CallExpression" ||
        decl.type === "ArrowFunctionExpression" ||
        decl.type === "FunctionExpression"
      )
        return null;
    }

    if (stmt.type === "ExportNamedDeclaration") {
      const decl = stmt.declaration as ASTNode | undefined;
      if (decl?.type === "VariableDeclaration") {
        for (const d of (decl.declarations as DeclaratorLike[]) ?? []) {
          if (d.id?.type === "Identifier") {
            const name = (d.id as unknown as IdLike).name!;
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
        const id = decl.id as IdLike | undefined;
        if (id?.name) return id.name;
      }
    }
  }
  return null;
}

function hasExportedComponent(ast: ASTNode): boolean {
  const body = (ast as { body?: ASTNode[] }).body;
  if (!Array.isArray(body)) return false;

  for (const stmt of body) {
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration as ASTNode;
      if (
        decl.type === "FunctionDeclaration" ||
        decl.type === "ClassDeclaration" ||
        decl.type === "Identifier" ||
        decl.type === "ArrowFunctionExpression" ||
        decl.type === "FunctionExpression" ||
        decl.type === "CallExpression"
      )
        return true;
    }

    if (stmt.type === "ExportNamedDeclaration") {
      const decl = stmt.declaration as ASTNode | undefined;
      if (decl?.type === "VariableDeclaration") {
        for (const d of (decl.declarations as DeclaratorLike[]) ?? []) {
          if (
            d.id?.type === "Identifier" &&
            isPascalCase((d.id as unknown as IdLike).name!) &&
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

export interface ComponentDetectionResult {
  isComponent: boolean;
  name: string | null;
}

const VALID_EXTS = new Set([".tsx", ".jsx", ".ts", ".js"]);

export function parseFile(fullPath: string, content: string): ASTNode | null {
  try {
    return parse(content, {
      filePath: fullPath,
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    }) as unknown as ASTNode;
  } catch {
    return null;
  }
}

export function detectComponent(
  fullPath: string,
  content: string
): ComponentDetectionResult {
  const ext = path.extname(fullPath);
  if (!VALID_EXTS.has(ext)) return { isComponent: false, name: null };

  const ast = parseFile(fullPath, content);
  if (!ast) return { isComponent: false, name: null };

  const name = getExportedComponentName(ast);

  if (hasJSX(ast)) return { isComponent: true, name };

  if (ext === ".ts" || ext === ".js") {
    return { isComponent: name !== null && isPascalCase(name), name };
  }

  return { isComponent: hasExportedComponent(ast), name };
}

export function isReactComponent(fullPath: string, content: string): boolean {
  return detectComponent(fullPath, content).isComponent;
}

export function getComponentName(
  fullPath: string,
  content: string
): string | null {
  return detectComponent(fullPath, content).name;
}
