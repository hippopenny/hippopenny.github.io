/**
 * Character coverage pipeline: wiki roster → tracking markdown, manifest JSON, optional draft stubs.
 *
 * Usage (repo root):
 *   node scripts/character-pipeline/pipeline.mjs tracking
 *   node scripts/character-pipeline/pipeline.mjs manifest
 *   node scripts/character-pipeline/pipeline.mjs scaffold
 *
 * Data source: Fandom category APIs (editorial reference; hero images should follow CHARACTER_CONTENT_WORKFLOW.md).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const TRACKING_DIR = path.join(REPO_ROOT, "_character-tracking");
const CHAR_DIR = path.join(REPO_ROOT, "_characters");

const GAMES = {
  "genshin-impact": {
    title: "Genshin Impact",
    wiki: "https://genshin-impact.fandom.com",
    category: "Category:Playable_Characters",
    combat_type_label: "Element",
    weapon_label: "Weapon",
    default_combat: "TBD",
    default_weapon: "TBD",
    hub: "/characters/genshin-impact/",
    app_cta_label: "Try Wacky Wisher",
    app_cta_url: "/wacky-wisher-stores/",
  },
  "honkai-star-rail": {
    title: "Honkai: Star Rail",
    wiki: "https://honkai-star-rail.fandom.com",
    category: "Category:Playable_Characters",
    combat_type_label: "Damage Type",
    weapon_label: "Path",
    default_combat: "TBD",
    default_weapon: "TBD",
    hub: "/characters/honkai-star-rail/",
    app_cta_label: "Warp into Wacky Warper",
    app_cta_url: "/appstores/",
  },
  "wuthering-waves": {
    title: "Wuthering Waves",
    wiki: "https://wutheringwaves.fandom.com",
    category: "Category:Playable_Resonators",
    combat_type_label: "Attribute",
    weapon_label: "Weapon",
    default_combat: "TBD",
    default_weapon: "TBD",
    hub: "/characters/wuthering-waves/",
    app_cta_label: "Build a team in Wacky Wuwa",
    app_cta_url: "/wacky-wuwa-stores/",
  },
};

const SCAFFOLD_SKIP = new Set(
  [
    // Genshin: wiki noise / non-standard entries
    "Manekin",
    "Manekina",
    "Wonderland Manekin",
    // Traveler element variants — single Traveler guide
    "Traveler (Anemo)",
    "Traveler (Dendro)",
    "Traveler (Electro)",
    "Traveler (Geo)",
    "Traveler (Hydro)",
    "Traveler (Pyro)",
    "Traveler (Unaligned)",
    // HSR: alternate persona already covered elsewhere
    "Sparxie",
  ].map((s) => s.toLowerCase())
);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/•/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

async function fetchCategoryMembers(wikiOrigin, categoryTitle) {
  const base = `${wikiOrigin}/api.php?action=query&list=categorymembers&cmtype=page&cmlimit=500&format=json`;
  let cmcontinue = "";
  const out = [];
  for (;;) {
    const url = cmcontinue
      ? `${base}&cmtitle=${encodeURIComponent(categoryTitle)}&cmcontinue=${encodeURIComponent(cmcontinue)}`
      : `${base}&cmtitle=${encodeURIComponent(categoryTitle)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const data = await res.json();
    const batch = data.query?.categorymembers ?? [];
    out.push(...batch.map((m) => m.title));
    cmcontinue = data.continue?.cmcontinue ?? "";
    if (!cmcontinue) break;
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b));
}

function guideExists(game, slug) {
  return fs.existsSync(path.join(CHAR_DIR, game, `${slug}.md`));
}

function readFrontmatterDraft(game, slug) {
  const p = path.join(CHAR_DIR, game, `${slug}.md`);
  if (!fs.existsSync(p)) return false;
  const raw = fs.readFileSync(p, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return /^draft_guide:\s*true\s*$/m.test(m[1]);
}

function buildTrackingMarkdown(gameKey, wikiTitles) {
  const g = GAMES[gameKey];
  const rows = [];
  rows.push(`# ${g.title} — character coverage`);
  rows.push("");
  rows.push(
    `Roster source: [Fandom wiki category](${g.wiki}/wiki/${encodeURIComponent(g.category)}) (sync with \`npm run character:tracking\`).`
  );
  rows.push("");
  rows.push("| Character | Slug | Guide page | Status |");
  rows.push("| --- | --- | --- | --- |");
  for (const title of wikiTitles) {
    const slug = slugify(title);
    const rel = `_characters/${gameKey}/${slug}.md`;
    const exists = guideExists(gameKey, slug);
    const draft = exists ? readFrontmatterDraft(gameKey, slug) : false;
    let status = "not started";
    if (exists) {
      status = draft ? "draft stub" : "published";
    }
    const pagePath = `/characters/${gameKey}/${slug}/`;
    rows.push(`| ${title} | \`${slug}\` | [${pagePath}](${pagePath}) | ${status} |`);
  }
  rows.push("");
  rows.push("## Workflow");
  rows.push("");
  rows.push("- Replace **draft stub** entries with researched guidance before removing `draft_guide` / `published` flags (see `CHARACTER_CONTENT_WORKFLOW.md`).");
  rows.push("- Prefer **official** art and facts for hero images and time-sensitive claims.");
  rows.push("");
  return rows.join("\n");
}

function writeTrackingFiles() {
  fs.mkdirSync(TRACKING_DIR, { recursive: true });
  return Promise.all(
    Object.entries(GAMES).map(async ([gameKey, g]) => {
      const titles = await fetchCategoryMembers(g.wiki, g.category);
      const md = buildTrackingMarkdown(gameKey, titles);
      const out = path.join(
        TRACKING_DIR,
        gameKey === "genshin-impact"
          ? "genshin-impact.md"
          : gameKey === "honkai-star-rail"
            ? "honkai-star-rail.md"
            : "wuthering-waves.md"
      );
      fs.writeFileSync(out, md, "utf8");
      console.log("Wrote", path.relative(REPO_ROOT, out), `(${titles.length} rows)`);
    })
  );
}

async function writeManifest() {
  fs.mkdirSync(TRACKING_DIR, { recursive: true });
  const manifest = { generated_at: new Date().toISOString().slice(0, 10), games: {} };
  for (const [gameKey, g] of Object.entries(GAMES)) {
    const titles = await fetchCategoryMembers(g.wiki, g.category);
    manifest.games[gameKey] = titles.map((title) => {
      const slug = slugify(title);
      const wikiPath = title.replace(/ /g, "_");
      return {
        wiki_title: title,
        slug,
        wiki_url: `${g.wiki}/wiki/${encodeURIComponent(wikiPath)}`,
        guide_repo_path: `_characters/${gameKey}/${slug}.md`,
        guide_exists: guideExists(gameKey, slug),
      };
    });
  }
  const out = path.join(TRACKING_DIR, "wiki-manifest.json");
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Wrote", path.relative(REPO_ROOT, out));
}

function stubBody(gameKey, displayName, slug, g) {
  const teaserFallback =
    gameKey === "genshin-impact"
      ? "/assets/images/characters/genshin-impact/furina.jpg"
      : gameKey === "honkai-star-rail"
        ? "/assets/images/characters/honkai-star-rail/acheron.jpg"
        : "/assets/images/characters/wuthering-waves/jinhsi.jpg";
  const officialHome =
    gameKey === "genshin-impact"
      ? "https://genshin.hoyoverse.com/en/"
      : gameKey === "honkai-star-rail"
        ? "https://hsr.hoyoverse.com/en-us/"
        : "https://wutheringwaves.kurogames.com/en/";

  return `---
title: ${displayName} Guide
excerpt: "Draft scaffold — replace with a decision-first ${g.title} guide before publishing."
character: ${displayName}
game: ${gameKey}
permalink: /characters/${gameKey}/${slug}/
tagline: "Draft placeholder — rewrite after verifying kit, banners, and meta."
teaser: ${teaserFallback}
image_source_label: "TODO: link official art or trailer (see CHARACTER_CONTENT_WORKFLOW.md)"
image_source_url: "${officialHome}"
role: TBD
combat_type_label: ${g.combat_type_label}
combat_type: ${g.default_combat}
weapon_or_path_label: ${g.weapon_label}
weapon_or_path: ${g.default_weapon}
pull_rating: B
preview_trick: "TODO: one concrete rotation or build tip."
quick_verdict: "TBD — verify live patch and roster context"
investment: TBD
mode_focus: TBD
updated_for: Replace before publishing
quick_take: Draft scaffold. Research official kit text and current community consensus, then rewrite this block in a decision-first voice per CHARACTER_CONTENT_WORKFLOW.md.
quick_tricks:
  - "TODO"
  - "TODO"
  - "TODO"
rotation_trick: "TODO"
daily_plan: "TODO"
common_mistakes:
  - "TODO"
  - "TODO"
build_priority: TODO — replace with researched priorities.
gearing: TODO
premium_team: TODO
budget_team: TODO
upgrade_order: TODO
dupe_value: TODO
verdict: TODO — close with an honest pull/build recommendation.
app_cta_label: ${g.app_cta_label}
app_cta_url: ${g.app_cta_url}
hub_url: ${g.hub}
player_cta_copy: TODO short CTA line
draft_guide: true
published: false
strengths:
  - TODO
weaknesses:
  - TODO
best_for:
  - TODO
avoid_if:
  - TODO
---
`;
}

async function scaffoldDrafts() {
  let created = 0;
  let skipped = 0;
  for (const [gameKey, g] of Object.entries(GAMES)) {
    const titles = await fetchCategoryMembers(g.wiki, g.category);
    for (const title of titles) {
      if (SCAFFOLD_SKIP.has(title.toLowerCase())) {
        skipped++;
        continue;
      }
      const slug = slugify(title);
      const target = path.join(CHAR_DIR, gameKey, `${slug}.md`);
      if (fs.existsSync(target)) {
        skipped++;
        continue;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, stubBody(gameKey, title, slug, g), "utf8");
      created++;
    }
  }
  console.log(`Scaffold: ${created} draft files created, ${skipped} skipped or already present.`);
}

const cmd = process.argv[2] || "help";

if (cmd === "tracking") {
  await writeTrackingFiles();
} else if (cmd === "manifest") {
  await writeManifest();
} else if (cmd === "scaffold") {
  await scaffoldDrafts();
  await writeTrackingFiles();
} else {
  console.log(`Commands: tracking | manifest | scaffold`);
  process.exit(cmd === "help" ? 0 : 1);
}
