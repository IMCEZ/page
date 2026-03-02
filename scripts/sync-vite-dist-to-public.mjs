import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "Kimi_Agent_三端适配美化", "app", "dist");
const publicDir = path.join(repoRoot, "public");

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const distIndex = path.join(distDir, "index.html");
  const distAssets = path.join(distDir, "assets");

  if (!(await pathExists(distIndex))) {
    throw new Error(`Missing dist index.html at: ${distIndex}`);
  }
  if (!(await pathExists(distAssets))) {
    throw new Error(`Missing dist assets dir at: ${distAssets}`);
  }

  await fs.mkdir(publicDir, { recursive: true });

  // Publish index.html
  await fs.copyFile(distIndex, path.join(publicDir, "index.html"));

  // Publish assets (replace fully to avoid stale hashed files)
  const publicAssets = path.join(publicDir, "assets");
  await fs.rm(publicAssets, { recursive: true, force: true });
  await fs.cp(distAssets, publicAssets, { recursive: true });

  // Copy any other top-level dist files (besides index.html + assets/)
  const top = await fs.readdir(distDir, { withFileTypes: true });
  await Promise.all(
    top
      .filter((d) => d.isFile() && d.name !== "index.html")
      .map((d) =>
        fs.copyFile(path.join(distDir, d.name), path.join(publicDir, d.name))
      )
  );

  // eslint-disable-next-line no-console
  console.log(`Synced Vite dist to public: ${distDir} -> ${publicDir}`);
}

await main();
