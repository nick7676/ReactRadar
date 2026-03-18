import fs from "fs/promises";
import path from "path";
import { isReactComponent } from "./componentDetection.js";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

export const findComponent = async (
  dirPath: string
): Promise<{ name: string; loc: number }[]> => {
  let results: { name: string; loc: number }[] = [];
  const list = await fs.readdir(dirPath);

  await Promise.all(
    list.map(async (file) => {
      const fullPath = path.join(dirPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        if (!EXCLUDED_DIRS.has(file)) {
          const sub = await findComponent(fullPath);
          results = results.concat(sub);
        }
      } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
        const content = await fs.readFile(fullPath, "utf8");
        if (isReactComponent(fullPath, content)) {
          const loc = content.split("\n").length;
          results.push({ name: fullPath, loc });
        }
      }
    })
  );

  return results;
};
