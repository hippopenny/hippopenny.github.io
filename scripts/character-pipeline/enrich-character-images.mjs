/**
 * Download character artwork from Fandom wikis (game-accurate splashes, cards, wish art)
 * into assets/images/character-gallery/{game}/{slug}/ and patch guide front matter.
 *
 * Keeps existing teaser + official image_source on HAND_PUBLISHED guides; only appends gallery.
 * Other guides: teaser = best local hero; gallery = up to MAX_IMAGES files.
 *
 *   node scripts/character-pipeline/enrich-character-images.mjs
 *   node scripts/character-pipeline/enrich-character-images.mjs --game wuthering-waves --limit 8
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const CHAR_DIR = path.join(REPO_ROOT, "_characters");
const OUT_ROOT = path.join(REPO_ROOT, "assets/images/character-gallery");
const MANIFEST = path.join(REPO_ROOT, "_character-tracking/wiki-manifest.json");

const MAX_IMAGES = 5;
const THUMB_WIDTH = 900;
const DELAY_MS = 110;
// Verifier flags images < 6000KB as "too small".
// Keep this safely above that threshold so we don't keep borderline thumbnails.
const MIN_DOWNLOAD_BYTES = 9000;

const HAND_PUBLISHED = {
  "genshin-impact": new Set(["furina", "nahida", "arlecchino"]),
  "honkai-star-rail": new Set(["acheron", "firefly", "ruan-mei"]),
  "wuthering-waves": new Set(["jinhsi", "camellya", "verina"]),
};

const GAME_WIKI = {
  "genshin-impact": "https://genshin-impact.fandom.com",
  "honkai-star-rail": "https://honkai-star-rail.fandom.com",
  "wuthering-waves": "https://wutheringwaves.fandom.com",
};

const SKIP_NAME = /map |^map_|icon|item |^item_|emblem|stencil|constellation|talent |^talent_|sprint|menu |artifact|^artifact_|quest |logo|\.svg|sprite|mini |sticker|emoji|thumb|avatar|^[0-9]+px|weapon/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function scoreFile(name) {
  const n = name.replace(/^File:/i, "");
  let s = 0;
  if (/splash|wish|full|card|portrait|render|game|art|official|promo|splash art/i.test(n)) s += 12;
  if (/character|resonator|showcase|preview|demonstration/i.test(n)) s += 6;
  if (/chibi|emoji|sticker|map |invokation|tcg/i.test(n)) s -= 15;
  return s;
}

async function wikiJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function listPageImages(wikiBase, pageTitle) {
  const url = `${wikiBase}/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=25&format=json`;
  const data = await wikiJson(url);
  const pages = data.query?.pages ?? {};
  const p = Object.values(pages)[0];
  if (!p || p.missing) return [];
  const imgs = p.images ?? [];
  return imgs
    .filter((im) => im.title?.startsWith("File:"))
    .map((im) => im.title)
    .filter((t) => !SKIP_NAME.test(t) && scoreFile(t) > -5)
    .sort((a, b) => scoreFile(b) - scoreFile(a))
    .slice(0, 25);
}

async function imageThumbUrl(wikiBase, fileTitle) {
  const url = `${wikiBase}/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=${THUMB_WIDTH}&format=json`;
  const data = await wikiJson(url);
  const pages = data.query?.pages ?? {};
  const p = Object.values(pages)[0];
  const ii = p?.imageinfo?.[0];
  return ii?.thumburl || ii?.url || null;
}

/** Fallback when the page embeds few File: images (e.g. stub pages). */
async function pageThumbnailDirect(wikiBase, pageTitle) {
  const url = `${wikiBase}/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=${THUMB_WIDTH}`;
  const data = await wikiJson(url);
  const p = Object.values(data.query?.pages ?? {})[0];
  return p?.thumbnail?.source || null;
}

function detectFormatFromBuffer(buf) {
  // JPEG SOI
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  // PNG signature
  if (buf.length >= 8 && buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") return "png";
  // WEBP: RIFF....WEBP
  if (buf.length >= 12 && buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

async function downloadFile(url, destBase) {
  const res = await fetch(url, { headers: { "User-Agent": "HippoPennyGalleryBot/1.0 (educational fansite)" } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_DOWNLOAD_BYTES) return null;

  const ext = detectFormatFromBuffer(buf);
  if (!ext) return null;
  const dest = destBase + "." + ext;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return dest;
}

function extFromUrl(u) {
  const m = u.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
  return m ? `.${m[1].toLowerCase()}` : ".jpg";
}

function wikiPageUrl(wikiBase, pageTitle) {
  const enc = pageTitle.replace(/ /g, "_");
  return `${wikiBase}/wiki/${encodeURIComponent(enc).replace(/%2F/g, "/")}`;
}

function isHandPublished(game, slug) {
  return HAND_PUBLISHED[game]?.has(slug) ?? false;
}

function selectGalleryFileTitles(titles, max) {
  const hardExclude = /weapon|sword|bow|claymore|polearm|catalyst|artifact|material|talent|constellation|emblem|icon|stencil|map |sticker|emoji/i;
  const filtered = titles.filter((t) => !hardExclude.test(t));

  const rules = [
    { idx: 0, re: /splash|hero|full wish|character.*splash|character.*render/i },
    { idx: 1, re: /card|portrait|character.*card/i },
    { idx: 2, re: /wish|trailer|demo|promotion|promo|official|demonstration/i },
    { idx: 3, re: /in-?game|game|battle|scene/i },
    { idx: 4, re: /splash|render|promo|official/i },
  ];

  const picks = [];
  for (const r of rules) {
    const candidates = filtered.filter((t) => r.re.test(t));
    if (!candidates.length) continue;
    const best = candidates.sort((a, b) => scoreFile(b) - scoreFile(a))[0];
    if (!picks.includes(best)) picks.push(best);
    if (picks.length >= max) break;
  }

  if (picks.length < max) {
    const remaining = filtered
      .filter((t) => !picks.includes(t))
      .sort((a, b) => scoreFile(b) - scoreFile(a));
    for (const t of remaining) {
      picks.push(t);
      if (picks.length >= max) break;
    }
  }

  return picks.slice(0, max);
}

function galleryItemYaml(rel, label, pageUrl) {
  return `  - src: ${rel}\n    label: "${label}"\n    url: "${pageUrl}"`;
}

function patchFrontMatter(raw, { gameKey, wikiTitle, relPaths, handOnlyAppend }) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);
  if (!m) return raw;
  let fm = m[1];
  const body = m[2];
  const wikiBase = GAME_WIKI[gameKey];
  const pageUrl = wikiPageUrl(wikiBase, wikiTitle);
  const labels = ["Hero render", "Splash / card", "Wish / promo art", "In-game style shot", "Extra splash"];

  const newItems = relPaths.map((rel, i) => galleryItemYaml(rel, labels[i] || "Art", pageUrl)).join("\n");

  if (handOnlyAppend) {
    if (/^gallery:/m.test(fm)) {
      fm = fm.replace(/^gallery:\r?\n([\s\S]*?)(?=\r?\nstrengths:)/m, (block0, inner) => {
        const existingSrcs = new Set([...inner.matchAll(/src:\s*(\S+)/g)].map((x) => x[1]));
        const add = relPaths.filter((r) => !existingSrcs.has(r));
        if (!add.length) return block0;
        const addYaml = add.map((rel, i) => galleryItemYaml(rel, labels[i] || "Wiki art", pageUrl)).join("\n");
        return `gallery:\n${inner.replace(/\s+$/, "")}\n${addYaml}\n`;
      });
    } else {
      fm = fm.replace(/\r?\n(?=strengths:)/, `\ngallery:\n${newItems}\n`);
    }
  } else {
    if (/^gallery:/m.test(fm)) {
      fm = fm.replace(/^gallery:\r?\n[\s\S]*?(?=\r?\nstrengths:)/m, `gallery:\n${newItems}\n`);
    } else {
      fm = fm.replace(/\r?\n(?=strengths:)/, `\ngallery:\n${newItems}\n`);
    }
    if (relPaths[0]) {
      fm = fm.replace(/^teaser:.*$/m, `teaser: ${relPaths[0]}`);
      fm = fm.replace(
        /^image_source_label:.*$/m,
        `image_source_label: "Fandom wiki (${wikiTitle}) — game promo & splash renders"`
      );
      fm = fm.replace(/^image_source_url:.*$/m, `image_source_url: "${pageUrl}"`);
    }
  }

  return `---\n${fm.trim()}\n---${body}`;
}

async function processOne(gameKey, row, { force }) {
  const slug = row.slug;
  const wikiTitle = row.wiki_title;
  const wikiBase = GAME_WIKI[gameKey];
  const mdPath = path.join(CHAR_DIR, gameKey, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return { skip: true };

  const outDir = path.join(OUT_ROOT, gameKey, slug);
  const marker = path.join(outDir, ".manifest.json");
  if (!force && fs.existsSync(marker)) {
    const prev = JSON.parse(fs.readFileSync(marker, "utf8"));
    if (prev.wikiTitle === wikiTitle && prev.count >= 1) {
      return { skip: true, cached: true };
    }
  }

  if (force && fs.existsSync(outDir)) {
    for (const fn of fs.readdirSync(outDir)) {
      if (fn === ".manifest.json") continue;
      if (!/\.(jpe?g|png|webp)$/i.test(fn)) continue;
      fs.unlinkSync(path.join(outDir, fn));
    }
  }

  const files = await listPageImages(wikiBase, wikiTitle);
  await sleep(DELAY_MS);

  fs.mkdirSync(outDir, { recursive: true });

  const relPaths = [];
  const selected = selectGalleryFileTitles(files, MAX_IMAGES);
  const usedTitles = new Set();
  let n = 0;
  for (const fileTitle of selected) {
    if (n >= MAX_IMAGES) break;
    usedTitles.add(fileTitle);
    let thumb;
    try {
      thumb = await imageThumbUrl(wikiBase, fileTitle);
    } catch {
      continue;
    }
    await sleep(DELAY_MS);
    if (!thumb) continue;
    const destBase = path.join(outDir, String(n + 1).padStart(2, "0"));
    const dest = await downloadFile(thumb, destBase);
    if (!dest) continue;
    relPaths.push(`/assets/images/character-gallery/${gameKey}/${slug}/${path.basename(dest)}`);
    n++;
  }

  if (relPaths.length < MAX_IMAGES) {
    const remaining = files.filter((t) => !usedTitles.has(t)).sort((a, b) => scoreFile(b) - scoreFile(a));
    for (const fileTitle of remaining) {
      if (relPaths.length >= MAX_IMAGES) break;
      let thumb;
      try {
        thumb = await imageThumbUrl(wikiBase, fileTitle);
      } catch {
        continue;
      }
      await sleep(DELAY_MS);
      if (!thumb) continue;
      const destBase = path.join(outDir, String(n + 1).padStart(2, "0"));
      const dest = await downloadFile(thumb, destBase);
      if (!dest) continue;
      relPaths.push(`/assets/images/character-gallery/${gameKey}/${slug}/${path.basename(dest)}`);
      n++;
    }
  }

  if (relPaths.length === 0) {
    const direct = await pageThumbnailDirect(wikiBase, wikiTitle);
    await sleep(DELAY_MS);
    if (direct) {
      const destBase = path.join(outDir, "01");
      const dest = await downloadFile(direct, destBase);
      if (dest) relPaths.push(`/assets/images/character-gallery/${gameKey}/${slug}/${path.basename(dest)}`);
    }
  }

  if (relPaths.length === 0 && gameKey === "genshin-impact" && (slug === "aether" || slug === "lumine")) {
    const srcDir = path.join(OUT_ROOT, gameKey, "traveler");
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(outDir, { recursive: true });
      for (const fn of fs.readdirSync(srcDir)) {
        if (fn === ".manifest.json" || !/\.(jpe?g|png|webp)$/i.test(fn)) continue;
        fs.copyFileSync(path.join(srcDir, fn), path.join(outDir, fn));
        relPaths.push(`/assets/images/character-gallery/${gameKey}/${slug}/${fn}`);
        if (relPaths.length >= MAX_IMAGES) break;
      }
    }
  }

  fs.writeFileSync(
    marker,
    JSON.stringify({ wikiTitle, slug, gameKey, count: relPaths.length, at: new Date().toISOString() }, null, 2),
    "utf8"
  );

  if (relPaths.length === 0) return { skip: true, empty: true };

  const raw = fs.readFileSync(mdPath, "utf8");
  const hand = isHandPublished(gameKey, slug);
  const next = patchFrontMatter(raw, {
    gameKey,
    wikiTitle,
    relPaths,
    handOnlyAppend: hand,
  });
  fs.writeFileSync(mdPath, next, "utf8");
  return { ok: true, n: relPaths.length };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  let limit = Infinity;
  const li = args.indexOf("--limit");
  if (li >= 0 && args[li + 1]) limit = parseInt(args[li + 1], 10);
  let onlyGame = null;
  const gi = args.indexOf("--game");
  if (gi >= 0 && args[gi + 1]) onlyGame = args[gi + 1];
  let onlySlug = null;
  const si = args.indexOf("--slug");
  if (si >= 0 && args[si + 1]) onlySlug = args[si + 1];

  if (!fs.existsSync(MANIFEST)) {
    console.error("Missing wiki-manifest.json — run npm run character:manifest");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const gameKey of Object.keys(manifest.games)) {
    if (onlyGame && gameKey !== onlyGame) continue;
    for (const row of manifest.games[gameKey]) {
      if (onlySlug && row.slug !== onlySlug) continue;
      if (done >= limit) break;
      try {
        const r = await processOne(gameKey, row, { force });
        if (r.skip) {
          skipped++;
          if (r.empty) process.stdout.write(`○ ${gameKey}/${row.slug} (no wiki images)\n`);
          else if (r.cached) skipped;
          else process.stdout.write(`○ ${gameKey}/${row.slug}\n`);
        } else {
          done++;
          process.stdout.write(`✓ ${gameKey}/${row.slug} (${r.n} imgs)\n`);
        }
      } catch (e) {
        failed++;
        process.stdout.write(`✗ ${gameKey}/${row.slug} ${e.message}\n`);
      }
    }
  }

  console.log(`Done: updated ${done}, skipped ${skipped}, errors ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
