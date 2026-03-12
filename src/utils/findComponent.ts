import fs from "fs";
import path from "path";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

export const findComponent = (dirPath: string): { name: string; loc: number }[] => {
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
      const loc = content.split("\n").length;

      results.push({
        name: fullPath,
        loc,
      });
    }
  });

  return results;
};
