import fs from "fs/promises";

export async function validateDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    throw new Error(`No directory found: ${dir}`);
  }
}
