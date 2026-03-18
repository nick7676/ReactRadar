import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import { detectComponent } from "./componentDetection.js";

export interface ComponentFile {
  filePath: string;
  componentName: string;
  loc: number;
}

export const findComponent = async (
  dirPath: string
): Promise<ComponentFile[]> => {
  const rootPath = path.resolve(dirPath);
  const files = await fg(["**/*.{tsx,jsx,ts,js}"], {
    cwd: rootPath,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
    absolute: true,
  });

  const detected = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf8");
      const info = detectComponent(file, content);
      if (!info.isComponent) return null;
      const loc = content.split("\n").length;
      const componentName =
        info.name ?? path.basename(file, path.extname(file));
      return { filePath: file, componentName, loc } satisfies ComponentFile;
    })
  );

  return detected
    .filter((r): r is ComponentFile => r !== null)
    .sort((a, b) => a.filePath.localeCompare(b.filePath));
};
