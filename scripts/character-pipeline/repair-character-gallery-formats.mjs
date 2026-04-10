/**
 * Repair downloaded gallery files so their extensions match their actual bytes.
 *
 * For any file under:
 *   assets/images/character-gallery/{game}/{slug}/{NN}.{ext}
 * it detects the real format (jpeg/png/webp) and renames the file to the correct
 * extension if needed. Then it updates the corresponding `_characters/{game}/{slug}.md`
 * teaser/gallery src references so pages stop pointing at stale extensions.
 *
 * Finally regenerate pull banner art via:
 *   node scripts/character-pipeline/production-build.mjs --guides-only
 *
 * Usage:
 *   node scripts/character-pipeline/repair-character-gallery-formats.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const GAL_ROOT = path.join(REPO_ROOT, "assets/images/character-gallery");
const CHAR_DIR = path.join(REPO_ROOT, "_characters");

const games = fs
  .readdirSync(GAL_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function detectFormat(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf.length >= 8 && buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") return "png";
  if (buf.length >= 12 && buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "webp";
  return null;
}

function extForFormat(fmt) {
  if (fmt === "jpeg") return "jpg";
  if (fmt === "png") return "png";
  if (fmt === "webp") return "webp";
  return null;
}

function relGallery(game, slug, file) {
  return `/assets/images/character-gallery/${game}/${slug}/${file}`;
}

function listSlugDirs(gameDir) {
  return fs
    .readdirSync(gameDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

const renameOps = [];
const mdPatchOps = new Map(); // key: `${game}/${slug}` => array of {oldRel, newRel}

for (const game of games) {
  const gameDir = path.join(GAL_ROOT, game);
  for (const slug of listSlugDirs(gameDir)) {
    const folder = path.join(gameDir, slug);
    const files = fs
      .readdirSync(folder, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => n !== ".manifest.json")
      .filter((n) => /\.(jpe?g|png|webp)$/i.test(n));

    if (!files.length) continue;

    for (const f of files) {
      const abs = path.join(folder, f);
      const buf = fs.readFileSync(abs);
      const fmt = detectFormat(buf);
      if (!fmt) continue;
      const wantExt = extForFormat(fmt);
      const haveExt = path.extname(f).toLowerCase().replace(".", "");
      if (wantExt && haveExt && wantExt !== haveExt) {
        const stem = path.basename(f, path.extname(f));
        const target = `${stem}.${wantExt}`;
        const absTarget = path.join(folder, target);

        // If target exists, prefer the larger one (usually the real render).
        if (fs.existsSync(absTarget)) {
          const a = fs.statSync(abs).size;
          const b = fs.statSync(absTarget).size;
          if (b >= a) {
            fs.unlinkSync(abs);
          } else {
            fs.renameSync(abs, absTarget);
          }
        } else {
          fs.renameSync(abs, absTarget);
        }

        renameOps.push({
          game,
          slug,
          oldFile: f,
          newFile: target,
        });

        const oldRel = relGallery(game, slug, f);
        const newRel = relGallery(game, slug, target);
        const k = `${game}/${slug}`;
        if (!mdPatchOps.has(k)) mdPatchOps.set(k, []);
        mdPatchOps.get(k).push({ oldRel, newRel });
      }
    }
  }
}

// Patch teaser/gallery references in guides.
for (const [k, patches] of mdPatchOps.entries()) {
  const [game, slug] = k.split("/");
  const mdPath = path.join(CHAR_DIR, game, `${slug}.md`);
  if (!fs.existsSync(mdPath)) continue;

  let raw = fs.readFileSync(mdPath, "utf8");
  for (const { oldRel, newRel } of patches) {
    raw = raw.split(oldRel).join(newRel);
  }
  fs.writeFileSync(mdPath, raw, "utf8");
}

console.log(`Renamed ${renameOps.length} gallery files and patched ${mdPatchOps.size} guide(s).`);

