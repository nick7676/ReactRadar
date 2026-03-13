import path from "path";
import fs from "fs";

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== "node_modules" &&
      entry.name !== "dist"
    ) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(tsx|jsx|ts)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}
