import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (existsSync(standaloneDir)) {
  const standaloneNextDir = path.join(standaloneDir, ".next");
  await mkdir(standaloneNextDir, { recursive: true });
  await cp(path.join(root, ".next", "static"), path.join(standaloneNextDir, "static"), {
    recursive: true
  });

  const publicDir = path.join(root, "public");
  if (existsSync(publicDir)) {
    await cp(publicDir, path.join(standaloneDir, "public"), { recursive: true });
  }
}
