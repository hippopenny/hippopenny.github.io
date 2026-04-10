/**
 * Re-enrich only folders flagged as `unknown-format` in the image verifier report.
 *
 * Intended to run after:
 *   node scripts/character-pipeline/verify-character-images.mjs --output ...
 *
 * Usage:
 *   node scripts/character-pipeline/repair-unknown-format-folders.mjs
 *   node scripts/character-pipeline/repair-unknown-format-folders.mjs --report _character-tracking/image-verify-report-final-1.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const reportArgIdx = process.argv.indexOf("--report");
const reportFile =
  reportArgIdx >= 0 && process.argv[reportArgIdx + 1]
    ? process.argv[reportArgIdx + 1]
    : "_character-tracking/image-verify-report-final-1.json";

const reportPath = path.isAbsolute(reportFile)
  ? reportFile
  : path.join(REPO_ROOT, reportFile);

if (!fs.existsSync(reportPath)) {
  console.error(`Missing report file: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const suspiciousFolders = new Map(); // game/slug -> {game, slug}

for (const s of report.suspicious || []) {
  if (!s.flags?.includes("unknown-format")) continue;
  suspiciousFolders.set(`${s.game}/${s.slug}`, { game: s.game, slug: s.slug });
}

const entries = [...suspiciousFolders.values()].sort((a, b) => {
  const k1 = `${a.game}/${a.slug}`;
  const k2 = `${b.game}/${b.slug}`;
  return k1.localeCompare(k2);
});

console.log(
  `Found ${entries.length} folders with unknown-format. Re-enriching sequentially...`
);

function runEnrich(game, slug) {
  return new Promise((resolve, reject) => {
    const args = [
      "scripts/character-pipeline/enrich-character-images.mjs",
      "--game",
      game,
      "--slug",
      slug,
      "--force",
    ];

    const child = spawn("node", args, {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`enrich failed for ${game}/${slug} (exit ${code})`));
    });
  });
}

async function main() {
  let ok = 0;
  for (let i = 0; i < entries.length; i++) {
    const { game, slug } = entries[i];
    console.log(`[${i + 1}/${entries.length}] Re-enrich ${game}/${slug}`);
    await runEnrich(game, slug);
    ok++;
  }
  console.log(`Done. Successfully re-enriched ${ok}/${entries.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

