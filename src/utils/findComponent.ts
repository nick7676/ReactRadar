import fs from "fs";
import path from "path";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

const JSX_PATTERN =
  /<[A-Z][a-zA-Z]*|<(div|span|p|h[1-6]|ul|li|button|input|form|section|main|header|footer|nav|img|a)\b/;
const EXPORT_DEFAULT_COMPONENT = /export\s+default\s+(function|class)\s+[A-Z]/;
const ARROW_COMPONENT =
  /export\s+(?:default\s+)?(?:const|let)\s+[A-Z][a-zA-Z]*\s*[:=]\s*(?:\(|React\.FC|FC)/;

const isReactComponent = (fullPath: string, content: string): boolean => {
  const ext = path.extname(fullPath);

  if ((ext === ".tsx" || ext === ".jsx") && JSX_PATTERN.test(content)) {
    return true;
  }

  if (EXPORT_DEFAULT_COMPONENT.test(content)) {
    return true;
  }

  if (ARROW_COMPONENT.test(content)) {
    return true;
  }

  return false;
};

export const findComponent = (
  dirPath: string
): { name: string; loc: number }[] => {
  let results: { name: string; loc: number }[] = [];
  const list = fs.readdirSync(dirPath);

  list.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(file)) {
        results = results.concat(findComponent(fullPath));
      }
    } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
      const content = fs.readFileSync(fullPath, "utf8");

      if (isReactComponent(fullPath, content)) {
        const loc = content.split("\n").length;
        results.push({ name: fullPath, loc });
      }
    }
  });

  return results;
};
