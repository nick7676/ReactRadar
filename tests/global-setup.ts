import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default async function globalSetup() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  execSync("npm run build", { cwd: root, stdio: "inherit" });
}
