/**
 * Verify downloaded character gallery images.
 *
 * Flags:
 * - file format vs extension mismatch (e.g. .jpg file that is actually WEBP)
 * - very small images (likely icons/materials)
 * - weird aspect ratios (optional; requires decodable dims)
 *
 * Usage:
 *   node scripts/character-pipeline/verify-character-images.mjs
 *   node scripts/character-pipeline/verify-character-images.mjs --game genshin-impact --slug nefer
 *   node scripts/character-pipeline/verify-character-images.mjs --output report.json --json
 *   node scripts/character-pipeline/verify-character-images.mjs --only-changed
 *   node scripts/character-pipeline/verify-character-images.mjs --only-changed --since main
 *   node scripts/character-pipeline/verify-character-images.mjs --fail-on-suspicious
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const GAL_ROOT = path.join(REPO_ROOT, "assets/images/character-gallery");

const argv = process.argv.slice(2);
const args = new Set(argv);
const gameArgIdx = argv.indexOf("--game");
const slugArgIdx = argv.indexOf("--slug");
const outputIdx = argv.indexOf("--output");
const sinceIdx = argv.indexOf("--since");
const jsonOut = args.has("--json");
const onlyGame = gameArgIdx >= 0 ? argv[gameArgIdx + 1] : null;
const onlySlug = slugArgIdx >= 0 ? argv[slugArgIdx + 1] : null;
const outputPath = outputIdx >= 0 ? argv[outputIdx + 1] : null;
const onlyChanged = args.has("--only-changed");
const sinceRef = onlyChanged && sinceIdx >= 0 ? argv[sinceIdx + 1] : onlyChanged ? "HEAD" : null;
const failOnSuspicious = args.has("--fail-on-suspicious");

function gitOk() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: REPO_ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Paths under assets/images/character-gallery that differ from `sinceRef` plus untracked images.
 */
function changedGalleryImageAbsPaths(since) {
  const out = new Set();
  const addOutput = (text) => {
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim().replace(/\//g, path.sep);
      if (!t || t.endsWith(".manifest.json")) continue;
      if (!/\.(jpe?g|png|webp)$/i.test(t)) continue;
      const abs = path.normalize(path.join(REPO_ROOT, t));
      if (!abs.startsWith(path.normalize(GAL_ROOT + path.sep)) && abs !== path.normalize(GAL_ROOT)) continue;
      out.add(abs);
    }
  };
  const diff = execSync(`git diff --name-only ${since} -- assets/images/character-gallery`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  addOutput(diff);
  const untracked = execSync("git ls-files -o --exclude-standard -- assets/images/character-gallery", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  addOutput(untracked);
  return [...out].filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());
}

function readU16BE(buf, off) {
  return buf.readUInt16BE(off);
}

function detectFormat(buf) {
  // JPEG SOI
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  // PNG signature
  if (buf.length >= 8 && buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a")
    return "png";
  // WEBP: RIFF....WEBP
  if (buf.length >= 12 && buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return "webp";
  return "unknown";
}

function extFromPath(p) {
  const ext = path.extname(p).toLowerCase().replace(".", "");
  return ext || "unknown";
}

function jpegDimensions(buf) {
  // Scan for SOF markers.
  for (let i = 0; i < buf.length - 9; i++) {
    if (buf[i] === 0xff) {
      const marker = buf[i + 1];
      const sofMarkers = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf];
      if (sofMarkers.includes(marker)) {
        const height = readU16BE(buf, i + 5);
        const width = readU16BE(buf, i + 7);
        return { width, height };
      }
    }
  }
  return null;
}

function pngDimensions(buf) {
  // IHDR chunk starts at offset 8, width/height at 16..23.
  if (buf.length < 24) return null;
  // Width at 16..19, height at 20..23
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function aspectFlag(width, height) {
  const ar = width / height;
  if (!Number.isFinite(ar)) return null;
  // Portrait-ish and square-ish are most common for characters; banners can be wider, but extreme ratios are suspicious.
  if (ar < 0.45) return `aspect-too-narrow(${ar.toFixed(2)})`;
  if (ar > 2.5) return `aspect-too-wide(${ar.toFixed(2)})`;
  return null;
}

function walkDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    out.push(e.name);
  }
  return out;
}

function listImageFiles(folder) {
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .filter((n) => n !== ".manifest.json");
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1);
}

const report = {
  generated_at: new Date().toISOString(),
  filters: { onlyGame, onlySlug, onlyChanged, sinceRef },
  totals: { folders: 0, images: 0, suspiciousImages: 0, mismatchFiles: 0 },
  suspicious: [],
};

function inspectOneImage(game, slug, imgName, p) {
  const st = fs.statSync(p);
  const bytes = st.size;
  report.totals.images += 1;

  const buf = fs.readFileSync(p);
  const fmt = detectFormat(buf);
  const ext = extFromPath(p);

  const flags = [];
  if (fmt !== "unknown") {
    const expectedExt = fmt === "jpeg" ? "jpg" : fmt;
    if (ext !== expectedExt) {
      flags.push(`format-mismatch(ext.${ext} != ${fmt})`);
      report.totals.mismatchFiles += 1;
    }
  } else {
    flags.push("unknown-format");
  }

  if (bytes < 6000) flags.push(`too-small(${formatKB(bytes)}KB)`);

  let dims = null;
  if (fmt === "jpeg") dims = jpegDimensions(buf);
  if (fmt === "png") dims = pngDimensions(buf);
  if (dims?.width && dims?.height) {
    const f = aspectFlag(dims.width, dims.height);
    if (f) flags.push(f);
  }

  if (flags.length) {
    report.totals.suspiciousImages += 1;
    report.suspicious.push({
      game,
      slug,
      file: imgName,
      sizeKB: Number(formatKB(bytes)),
      detectedFormat: fmt,
      extension: ext,
      dims: dims ? { width: dims.width, height: dims.height } : null,
      flags,
    });
  }
}

function parseGalleryAbsPath(absPath) {
  const rel = path.relative(GAL_ROOT, path.normalize(absPath));
  const parts = rel.split(path.sep);
  if (parts.length < 3) return null;
  const game = parts[0];
  const slug = parts[1];
  const imgName = parts.slice(2).join(path.sep);
  if (!/\.(jpe?g|png|webp)$/i.test(imgName)) return null;
  return { game, slug, imgName };
}

if (onlyChanged) {
  if (!gitOk()) {
    console.error("verify-character-images: --only-changed requires a git checkout at repo root.");
    process.exit(1);
  }
  const paths = changedGalleryImageAbsPaths(sinceRef);
  const seenFolders = new Set();
  for (const abs of paths) {
    const parsed = parseGalleryAbsPath(abs);
    if (!parsed) continue;
    if (onlyGame && parsed.game !== onlyGame) continue;
    if (onlySlug && parsed.slug !== onlySlug) continue;
    const folderKey = `${parsed.game}/${parsed.slug}`;
    if (!seenFolders.has(folderKey)) {
      seenFolders.add(folderKey);
      report.totals.folders += 1;
    }
    inspectOneImage(parsed.game, parsed.slug, parsed.imgName, abs);
  }
  if (!paths.length) {
    console.log(`No changed or untracked gallery images vs ${sinceRef} (and filters).`);
  }
} else {
  for (const game of fs.readdirSync(GAL_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    if (onlyGame && game !== onlyGame) continue;
    const gameDir = path.join(GAL_ROOT, game);

    for (const slug of walkDirs(gameDir)) {
      if (onlySlug && slug !== onlySlug) continue;
      const folder = path.join(gameDir, slug);
      const manifest = path.join(folder, ".manifest.json");
      if (!fs.existsSync(manifest)) continue;

      report.totals.folders += 1;
      const images = listImageFiles(folder);
      for (const imgName of images) {
        const p = path.join(folder, imgName);
        inspectOneImage(game, slug, imgName, p);
      }
    }
  }
}

// Summary output
const suspiciousByFolder = {};
for (const s of report.suspicious) {
  const k = `${s.game}/${s.slug}`;
  suspiciousByFolder[k] = (suspiciousByFolder[k] || 0) + 1;
}

console.log(`Verified folders: ${report.totals.folders}`);
console.log(`Verified images: ${report.totals.images}`);
console.log(`Suspicious images: ${report.totals.suspiciousImages}`);
console.log(`Format mismatches: ${report.totals.mismatchFiles}`);

const sortedFolders = Object.entries(suspiciousByFolder).sort((a, b) => b[1] - a[1]).slice(0, 30);
if (sortedFolders.length) {
  console.log("Top suspicious folders:");
  for (const [k, c] of sortedFolders) {
    console.log(`- ${k}: ${c} files flagged`);
  }
}

if (outputPath) {
  const out = jsonOut ? report : report; // keep JSON always; flag mainly for clarity
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote report: ${path.resolve(outputPath)}`);
}

if (failOnSuspicious && report.totals.suspiciousImages > 0) {
  process.exitCode = 1;
}

