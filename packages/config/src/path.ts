import { existsSync } from "node:fs";
import path from "node:path";

export function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, "turbo.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find workspace root (turbo.json)");
}
