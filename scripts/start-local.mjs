import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const build = path.join(root, ".next");
const output = path.join(build, "standalone");
const server = path.join(output, "server.js");
if (!existsSync(server)) {
  console.error("Build InfoHub first with npm run build.");
  process.exit(1);
}

cpSync(path.join(build, "static"), path.join(output, ".next", "static"), { recursive: true });
const publicDir = path.join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(output, "public"), { recursive: true });
}

process.env.HOSTNAME = "127.0.0.1";
process.env.INFOHUB_DATA_DIR = path.resolve(root, process.env.INFOHUB_DATA_DIR || "data/published");
await import(pathToFileURL(server).href);
