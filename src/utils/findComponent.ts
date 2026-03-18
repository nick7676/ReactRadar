import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import { isReactComponent } from "./componentDetection.js";

export const findComponent = async (
  dirPath: string
): Promise<{ name: string; loc: number }[]> => {
  const rootPath = path.resolve(dirPath);
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

  const results: { name: string; loc: number }[] = [];

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf8");
      if (isReactComponent(file, content)) {
        const loc = content.split("\n").length;
        results.push({ name: file, loc });
      }
    })
  );

  return results;
};
