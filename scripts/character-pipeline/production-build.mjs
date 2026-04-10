/**
 * Fetches Fandom infobox facts (cached), writes production character guides, and
 * regenerates pull-simulator-banners.generated.js.
 *
 *   node scripts/character-pipeline/production-build.mjs
 *   node scripts/character-pipeline/production-build.mjs --fetch-only
 *   node scripts/character-pipeline/production-build.mjs --guides-only
 *
 * Skips regen for any guide that exists and is not a draft (no draft_guide: true).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const TRACKING_DIR = path.join(REPO_ROOT, "_character-tracking");
const CHAR_DIR = path.join(REPO_ROOT, "_characters");
const PULL_BANNERS_OUT = path.join(REPO_ROOT, "assets/pull-simulator/pull-simulator-banners.generated.js");
const CACHE_PATH = path.join(TRACKING_DIR, "infobox-cache.json");

const DELAY_MS = 120;

/** Hand-written guides — never overwritten by the generator. */
const HAND_PUBLISHED = {
  "genshin-impact": new Set(["furina", "nahida", "arlecchino"]),
  "honkai-star-rail": new Set(["acheron", "firefly", "ruan-mei"]),
  "wuthering-waves": new Set(["jinhsi", "camellya", "verina"]),
};

const GAMES = {
  "genshin-impact": {
    wiki: "https://genshin-impact.fandom.com",
    official: "https://genshin.hoyoverse.com/en/",
    hub: "/characters/genshin-impact/",
    app_cta_label: "Try Wacky Wisher",
    app_cta_url: "/wacky-wisher-stores/",
    combat_label: "Element",
    weapon_label: "Weapon",
    images: [
      "/assets/images/wackywisher/1.png",
      "/assets/images/wackywisher/2.png",
      "/assets/images/wackywisher/3.png",
      "/assets/images/wackywisher/4.png",
      "/assets/images/wackywisher/5.png",
      "/assets/images/wackywisher/6.png",
    ],
    teasers: [
      "/assets/images/characters/genshin-impact/furina.jpg",
      "/assets/images/characters/genshin-impact/nahida.jpg",
      "/assets/images/characters/genshin-impact/arlecchino.jpg",
    ],
  },
  "honkai-star-rail": {
    wiki: "https://honkai-star-rail.fandom.com",
    official: "https://hsr.hoyoverse.com/en-us/",
    hub: "/characters/honkai-star-rail/",
    app_cta_label: "Warp into Wacky Warper",
    app_cta_url: "/appstores/",
    combat_label: "Damage Type",
    weapon_label: "Path",
    images: [
      "/assets/images/offrail/banner.png",
      "/assets/images/offrail/firefly-2.png",
      "/assets/images/offrail/background-smaller.png",
      "/assets/images/offrail/firefly.png",
      "/assets/images/offrail/2x4banner-small.png",
    ],
    teasers: [
      "/assets/images/characters/honkai-star-rail/acheron.jpg",
      "/assets/images/characters/honkai-star-rail/firefly.jpg",
      "/assets/images/characters/honkai-star-rail/ruan-mei.jpg",
    ],
  },
  "wuthering-waves": {
    wiki: "https://wutheringwaves.fandom.com",
    official: "https://wutheringwaves.kurogames.com/en/",
    hub: "/characters/wuthering-waves/",
    app_cta_label: "Build a team in Wacky Wuwa",
    app_cta_url: "/wacky-wuwa-stores/",
    combat_label: "Attribute",
    weapon_label: "Weapon",
    images: [
      "/assets/images/wackywuwa/banner.png",
      "/assets/images/wackywuwa/1.png",
      "/assets/images/wackywuwa/2.jpg",
      "/assets/images/wackywuwa/chat.webp",
    ],
    teasers: [
      "/assets/images/characters/wuthering-waves/jinhsi.jpg",
      "/assets/images/characters/wuthering-waves/camellya.jpg",
      "/assets/images/characters/wuthering-waves/verina.jpg",
    ],
  },
};

const PATH_ROLE_HSR = {
  Destruction: "Main DPS",
  Hunt: "Main DPS",
  Erudition: "Main DPS / AoE",
  Harmony: "Support / Buffer",
  Nihility: "Debuffer / Sub-DPS",
  Abundance: "Healer",
  Preservation: "Shielder / Sustain",
  Remembrance: "Support / Summon",
  Elation: "Follow-up DPS",
};

const SKIP_WIKI_TITLES = new Set(
  [
    "Manekin",
    "Manekina",
    "Wonderland Manekin",
    "Traveler (Anemo)",
    "Traveler (Dendro)",
    "Traveler (Electro)",
    "Traveler (Geo)",
    "Traveler (Hydro)",
    "Traveler (Pyro)",
    "Traveler (Unaligned)",
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pick(arr, i) {
  return arr[Math.abs(i) % arr.length];
}

const CHAR_GALLERY_ROOT = path.join(REPO_ROOT, "assets/images/character-gallery");

function firstGalleryImage(gameKey, slug) {
  const dir = path.join(CHAR_GALLERY_ROOT, gameKey, slug);
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f !== ".manifest.json" && /\.(jpe?g|png|webp)$/i.test(f))
    .sort();
  if (!files.length) return null;
  return `/assets/images/character-gallery/${gameKey}/${slug}/${files[0]}`;
}

function yamlQuote(s) {
  const t = String(s).replace(/"/g, '\\"');
  return `"${t}"`;
}

function extractPipeFields(wikitext, fields) {
  const out = {};
  for (const f of fields) {
    const re = new RegExp(`\\|${f}\\s*=\\s*([^\\n]*)`, "i");
    const m = wikitext.match(re);
    if (m) {
      let v = m[1].trim();
      v = v.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
      v = v.replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, "$1");
      v = v.replace(/\[\[([^\]]+)\]\]/g, "$1");
      v = v.replace(/'''?/g, "");
      v = v.trim();
      if (v && v !== "{{") {
        v = v.replace(/\{\{([^}[|]+)(?:\|[^}]*)?\}\}/g, "$1").trim();
        out[f] = v.split("|")[0].trim();
      }
    }
  }
  return out;
}

async function fetchWikitext(wikiBase, pageTitle) {
  const url = `${wikiBase}/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&redirects=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  if (data.error) return { error: data.error.info || "error", wikitext: "" };
  const wt = data.parse?.wikitext?.["*"] || "";
  if (!wt) return { error: "empty", wikitext: "" };
  return { wikitext: wt, title: data.parse?.title };
}

function parseGenshin(wt) {
  const box = extractPipeFields(wt, ["element", "weapon", "quality", "region"]);
  let rarity = parseInt(box.quality, 10);
  if (!Number.isFinite(rarity)) rarity = 4;
  return {
    element: box.element || "Unknown",
    weapon: box.weapon || "Unknown",
    rarity,
    region: box.region || "",
  };
}

function parseHSR(wt) {
  const box = extractPipeFields(wt, ["path", "combatType", "rarity"]);
  let rarity = parseInt(String(box.rarity || "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(rarity)) rarity = 4;
  return {
    path: box.path || "Unknown",
    combatType: box.combatType || "Unknown",
    rarity,
  };
}

function parseWuWa(wt) {
  let box = extractPipeFields(wt, ["attribute", "weapon", "rarity", "role", "class"]);
  if (!box.attribute && /Rover Infobox/i.test(wt)) {
    box = { ...box, ...extractPipeFields(wt, ["attribute", "role", "order"]) };
    box.rarity = box.rarity || "5";
  }
  let rarity = parseInt(String(box.rarity || "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(rarity)) rarity = 5;
  const roleFirst = (box.role || "Combat").split(";")[0]?.trim() || "Combat";
  return {
    attribute: box.attribute || "Unknown",
    weapon: box.weapon || "Unknown",
    rarity,
    roleHint: roleFirst,
    class: box.class || "",
  };
}

function genshinRole(f) {
  if (f.rarity <= 4) {
    if (f.weapon === "Catalyst") return "Support / Sub-DPS";
    return "Sub-DPS / Flex";
  }
  if (["Claymore", "Polearm", "Bow"].includes(f.weapon)) return "Main DPS";
  if (f.weapon === "Sword") return "Main DPS / Sub-DPS";
  if (f.weapon === "Catalyst") return "Support / Main DPS";
  return "Main DPS / Flex";
}

function hsrRole(path, rarity) {
  if (PATH_ROLE_HSR[path]) return PATH_ROLE_HSR[path];
  return rarity <= 4 ? "Flex / Niche" : "Main DPS / Flex";
}

function wuwaRole(f) {
  if (/heal/i.test(f.roleHint)) return "Healer / Support";
  if (/damage|dealer|dps/i.test(f.roleHint)) return "Main DPS";
  if (/support/i.test(f.roleHint)) return "Support";
  return f.rarity >= 5 ? "Main DPS / Flex" : "Sub-DPS / Support";
}

function pullRating(rarity) {
  if (rarity >= 5) return "A";
  return "B";
}

function mistakesForGame(gameKey) {
  if (gameKey === "genshin-impact") {
    return [
      "Copying showcase rotations without matching ER/support investment.",
      "Splitting artifact farms across three half-built sets.",
      "Pulling constellations before baseline talents and weapons are sorted.",
    ];
  }
  if (gameKey === "honkai-star-rail") {
    return [
      "Chasing perfect relic substats before core traces are online.",
      "Running teams that fight over skill points every turn.",
      "Assuming a Light Cone is optional when the kit math assumes it.",
    ];
  }
  return [
    "Chasing perfect Echo substats before forte basics are leveled.",
    "Rotate swaps that desync buff windows.",
    "Comparing damage to showcases with different investment tiers.",
  ];
}

function shouldRegenerateGuide(gameKey, slug, absPath, forceAll) {
  if (HAND_PUBLISHED[gameKey]?.has(slug)) return false;
  if (forceAll) return true;
  if (!fs.existsSync(absPath)) return true;
  const raw = fs.readFileSync(absPath, "utf8");
  if (raw.includes("draft_guide: true")) return true;
  if (/Draft scaffold/i.test(raw)) return true;
  return false;
}

function buildGuideFrontMatter(gameKey, displayName, slug, factsIn, meta) {
  const facts = {
    rarity: 5,
    ...factsIn,
  };
  if (!Number.isFinite(facts.rarity)) facts.rarity = 5;
  const g = GAMES[gameKey];
  const permalink = `/characters/${gameKey}/${slug}/`;

  let role, combat, weapon, excerpt, tagline, qv, investment, mode, take, bp, gear, prem, bud, up, dupe, verdict;
  const tr = pullRating(facts.rarity);

  if (gameKey === "genshin-impact") {
    role = genshinRole(facts);
    combat = facts.element;
    weapon = facts.weapon;
    excerpt = `${displayName} Genshin guide: ${combat} ${weapon}, investment notes, teams, and pull context — verify live banners before spending.`;
    tagline = `${combat} ${weapon} unit — prioritize kits that match your account before chasing dupes.`;
    qv = facts.rarity >= 5 ? "Evaluate on banner context and roster gaps" : "Strong 4★ value when featured; skip if duplicates hurt velocity";
    investment = facts.rarity >= 5 ? "Medium to High" : "Low to Medium";
    mode = "General/spiral-capable teams";
    take = `${displayName} is a ${combat} character using ${weapon}. Start from official kit descriptions, then shape artifacts and teams around whether you need on-field time or quick swaps. Compare against current roster before pulling — banner timing and supports move the real value. Facts distilled from community wiki infobox; confirm patch-sensitive details in-game.`;
    bp = `Stabilize Energy Recharge (if burst-heavy), then weapon/artifact priorities that match ${displayName}'s main scaling. Talent order follows whichever talent delivers the majority of team damage.`;
    gear = `Build ${combat}-appropriate sets and stats that match ${weapon} gameplay: crit and offensive thresholds for carries, ER and support stats for enablers.`;
    prem = `Premium teams stack ${combat} synergy with modern supports that do not waste field time. Swap in your best buffer/healer that respects ${weapon} spacing.`;
    bud = `Budget clears run flexible off-field damage plus one defensive backbone. Use universal pieces first, then farm domain-specialized artifacts after basics feel smooth.`;
    up = `Core damage or utility talent first, burst if central, basics last unless on-field auto reliance is explicit.`;
    dupe = `Constellation value varies; C0 usually defines baseline power — check honest dupe reviews before extra wishes.`;
    verdict = `${displayName} fits players who want ${combat} coverage with ${weapon} pacing. Pull when banners line up with your account plan, not from abstract tier panic.`;
  } else if (gameKey === "honkai-star-rail") {
    role = hsrRole(facts.path, facts.rarity);
    combat = facts.combatType;
    weapon = facts.path;
    excerpt = `${displayName} HSR guide: ${combat} ${facts.path}, relic focus, teams — confirm current warp banners.`;
    tagline = `${combat} (${facts.path}) — build teams that match Path role before chasing signatures.`;
    qv = facts.rarity >= 5 ? "Worth planning around if traces and cones fit your goals" : "Good budget pick when rate-up aligns";
    investment = facts.rarity >= 5 ? "Medium to High" : "Low";
    mode = "Missions, Simulated Universe, endgame farms";
    take = `${displayName} follows the ${facts.path} Path with ${combat} damage type. Build relics and Light Cones that reinforce that role—speed tuning for supports, break or crit packages for carries. Compare with your existing roster; Path overlap can make skips rational even for strong kits. Infobox snapshot via Fandom; verify traces/LC recommendations each patch.`;
    bp = `Traces that unlock the character's win condition first, then relic main stats that stabilize the intended rotation (speed breakpoints, effect hit rate, or break as needed).`;
    gear = `Relics + Light Cone should answer the unit's primary check: survival, SP economy, debuff consistency, or pure damage.`;
    prem = `Premium teams pair ${displayName} with top supports on the same weakness-plan without starving action economy.`;
    bud = `Budget teams accept slower clears by leaning on f2p light cones and flexible healers/shielders.`;
    up = `Trace materials: core skill → talent → leftovers. Plan weekly boss drops ahead of banner end.`;
    dupe = `Eidolon power spikes differ; E0 baseline is the honest comparison point for most accounts.`;
    verdict = `${displayName} is a ${facts.path} pick with ${combat} typing. Invest when you can finish traces and a sane cone path.`;
  } else {
    role = wuwaRole(facts);
    combat = facts.attribute;
    weapon = facts.weapon;
    excerpt = `${displayName} WuWa guide: ${combat} ${weapon}, Echo priorities, teams — check current convenes.`;
    tagline = `${combat} ${weapon} — Echoes and rotations matter more than perfect min-rolls early.`;
    qv = facts.rarity >= 5 ? "Premium pull when carry or niche is clearly missing" : "Sensible 4★ stopgap while building two strong carries";
    investment = facts.rarity >= 5 ? "Medium to High" : "Low to Medium";
    mode = "Overworld, Tower, high-difficulty remotes";
    take = `${displayName} uses ${combat} with ${weapon}. Build Echo sets that match their attack cadence, then tune team swaps so buff windows align. Pull value shifts fast as convenes rerun—confirm today's rates before spending. Data traced from wiki infobox; validate in-game tooltips.`;
    bp = `Skill/forte levels that unlock damage windows, then Echo farming toward one coherent set bonus before chasing god rolls.`;
    gear = `Weapon aligns with kit; Echo substats after correct sets beat scattered legendaries.`;
    prem = `Stack premier supports that battery ${combat} tempo without hogging field time.`;
    bud = `Lean on accessible healers/shields and flexible sub-DPS until main carry spikes arrive.`;
    up = `Forte upgrades that touch damage coefficients first, resonance chain when it impacts rotations.`;
    dupe = `Resonance chain nodes: read concrete bonuses before extra pulls—some tiers are comfort, not power.`;
    verdict = `${displayName} is a ${combat} ${weapon} pick. Worth it when the role (${role}) is genuinely open on your roster.`;
  }

  const preview = `Confirm ${combat}/${weapon} rotation basics, then invest in one stable team shell.`;
  const tricks = [
    `Read ${displayName}'s in-game kit: note field-time needs vs quick-swap value.`,
    `Before farming limited domains, clear one ER or survivability floor that stops failed bursts.`,
    `Compare vs recent banner mates — overlap often matters more than abstract power.`,
  ];

  const teaser = pick(g.teasers, meta.idx);
  const lines = [
    "---",
    `title: ${yamlQuote(`${displayName} Guide`)}`,
    `excerpt: ${yamlQuote(excerpt)}`,
    `character: ${displayName}`,
    `game: ${gameKey}`,
    `permalink: ${permalink}`,
    `tagline: ${yamlQuote(tagline)}`,
    `teaser: ${teaser}`,
    `image_source_label: ${yamlQuote("Placeholder teaser — replace with official character art (workflow)")}`,
    `image_source_url: ${yamlQuote(g.official)}`,
    `role: ${role}`,
    `combat_type_label: ${g.combat_label}`,
    `combat_type: ${combat}`,
    `weapon_or_path_label: ${g.weapon_label}`,
    `weapon_or_path: ${weapon}`,
    `pull_rating: ${tr}`,
    `preview_trick: ${yamlQuote(preview)}`,
    `quick_verdict: ${yamlQuote(qv)}`,
    `investment: ${investment}`,
    `mode_focus: ${mode}`,
    `updated_for: Recheck when featured banners or direct competitors release`,
    `quick_take: ${yamlQuote(take)}`,
    "quick_tricks:",
    ...tricks.map((t) => `  - ${yamlQuote(t)}`),
    `rotation_trick: ${yamlQuote(`Open with supports, align ${displayName}'s main window, then exit before buffs expire.`)}`,
    `daily_plan: ${yamlQuote(
      gameKey === "genshin-impact"
        ? "One talent milestone + one artifact domain focus until the rotation stops feeling starved."
        : gameKey === "honkai-star-rail"
          ? "One trace goal + one relic farm pass until breakpoints feel honest."
          : "One forte goal + one Echo farm pass until clear speed stabilizes."
    )}`,
    "common_mistakes:",
    ...mistakesForGame(gameKey).map((t) => `  - ${yamlQuote(t)}`),
    `build_priority: ${yamlQuote(bp)}`,
    `gearing: ${yamlQuote(gear)}`,
    `premium_team: ${yamlQuote(prem)}`,
    `budget_team: ${yamlQuote(bud)}`,
    `upgrade_order: ${yamlQuote(up)}`,
    `dupe_value: ${yamlQuote(dupe)}`,
    `verdict: ${yamlQuote(verdict)}`,
    `app_cta_label: ${yamlQuote(g.app_cta_label)}`,
    `app_cta_url: ${g.app_cta_url}`,
    `hub_url: ${g.hub}`,
    `player_cta_copy: ${yamlQuote(`Try the ${gameKey.includes("genshin") ? "Wacky Wisher" : gameKey.includes("honkai") ? "Wacky Warper" : "Wacky Wuwa"} pull sim after planning.`)}`,
    "gallery:",
    `  - src: ${teaser}`,
    `    label: ${yamlQuote("Placeholder teaser — replace with official art")}`,
    "strengths:",
    `  - ${yamlQuote(`Clear ${combat} identity for team-building.`)}`,
    `  - ${yamlQuote(`Weapon (${weapon}) gives obvious build targets.`)}`,
    "weaknesses:",
    `  - ${yamlQuote("Patch/banner competition can move value quickly.")}`,
    `  - ${yamlQuote("Needs honest trace/Echo investment — not a zero-setup win.")}`,
    "best_for:",
    `  - ${yamlQuote("Players who want the role this unit fills, not just rarity color.")}`,
    "avoid_if:",
    `  - ${yamlQuote("You already run multiple overlapping carries without room to rotate.")}`,
    "---",
    "",
  ];

  return lines.join("\n");
}

async function loadOrFetchCache(manifest, fetchEnabled) {
  /** @type {Record<string, Record<string, any>>} */
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    } catch {
      cache = {};
    }
  }

  if (!fetchEnabled) return cache;

  for (const gameKey of Object.keys(manifest.games)) {
    const g = GAMES[gameKey];
    if (!g) continue;
    if (!cache[gameKey]) cache[gameKey] = {};

    const rows = manifest.games[gameKey];
    let i = 0;
    for (const row of rows) {
      const title = row.wiki_title;
      if (SKIP_WIKI_TITLES.has(title.toLowerCase())) continue;
      const slug = row.slug;
      if (cache[gameKey][slug]?.wikitext_ok) {
        i++;
        continue;
      }
      process.stdout.write(`fetch ${gameKey} ${title}...\n`);
      const { wikitext, error } = await fetchWikitext(g.wiki, title);
      let facts;
      if (error || !wikitext) {
        facts = { error: error || "no text", rarity: 5 };
        if (gameKey === "genshin-impact") Object.assign(facts, { element: "Unknown", weapon: "Unknown" });
        else if (gameKey === "honkai-star-rail") Object.assign(facts, { path: "Unknown", combatType: "Unknown" });
        else Object.assign(facts, { attribute: "Unknown", weapon: "Unknown", roleHint: "Combat" });
      } else if (gameKey === "genshin-impact") {
        facts = parseGenshin(wikitext);
        facts.wikitext_ok = true;
      } else if (gameKey === "honkai-star-rail") {
        facts = parseHSR(wikitext);
        facts.wikitext_ok = true;
      } else {
        facts = parseWuWa(wikitext);
        facts.wikitext_ok = true;
      }
      cache[gameKey][slug] = { wiki_title: title, ...facts };
      i++;
      await sleep(DELAY_MS);
    }
  }

  fs.mkdirSync(TRACKING_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  return cache;
}

function writePullBanners(manifest, cache) {
  const out = [];
  out.push(`/** Auto-generated by scripts/character-pipeline/production-build.mjs — do not edit by hand. */`);
  out.push("");

  for (const gameKey of ["genshin-impact", "honkai-star-rail", "wuthering-waves"]) {
    const constName =
      gameKey === "genshin-impact"
        ? "GENSHIN_BANNERS"
        : gameKey === "honkai-star-rail"
          ? "HSR_BANNERS"
          : "WUWA_BANNERS";
    const g = GAMES[gameKey];
    const rows = [...(manifest.games[gameKey] || [])].sort((a, b) =>
      a.wiki_title.localeCompare(b.wiki_title)
    );
    const banners = [];
    let idx = 0;
    for (const row of rows) {
      if (SKIP_WIKI_TITLES.has(row.wiki_title.toLowerCase())) continue;
      const slug = row.slug;
      const cf = cache[gameKey]?.[slug] || {};
      let label = "Featured";
      let blurb = "Fan sim rate-up — odds approximate live game.";
      if (gameKey === "genshin-impact") {
        label = `${cf.element || "?"} · ${cf.weapon || "?"}`;
        blurb = `${row.wiki_title}: ${cf.element || ""} ${cf.weapon || ""} (verify banners).`.trim();
      } else if (gameKey === "honkai-star-rail") {
        label = `${cf.combatType || "?"} · ${cf.path || "?"}`;
        blurb = `${row.wiki_title}: ${cf.combatType || ""} / ${cf.path || ""} (verify warps).`.trim();
      } else {
        label = `${cf.attribute || "?"} · ${cf.weapon || "?"}`;
        blurb = `${row.wiki_title}: ${cf.attribute || ""} ${cf.weapon || ""} (verify convenes).`.trim();
      }
      banners.push({
        id: slug,
        name: row.wiki_title,
        label,
        image: firstGalleryImage(gameKey, slug) || pick(g.images, idx),
        guideUrl: `/characters/${gameKey}/${slug}/`,
        blurb,
      });
      idx++;
    }
    out.push(`export const ${constName} = ${JSON.stringify(banners, null, 2)};`);
    out.push("");
  }

  fs.writeFileSync(PULL_BANNERS_OUT, out.join("\n"), "utf8");
  console.log("Wrote", path.relative(REPO_ROOT, PULL_BANNERS_OUT));
}

function writeAllGuides(manifest, cache, forceAll) {
  let n = 0;
  let skipped = 0;
  let idx = 0;
  for (const gameKey of Object.keys(manifest.games)) {
    for (const row of manifest.games[gameKey]) {
      if (SKIP_WIKI_TITLES.has(row.wiki_title.toLowerCase())) continue;
      const slug = row.slug;
      const abs = path.join(CHAR_DIR, gameKey, `${slug}.md`);
      if (!shouldRegenerateGuide(gameKey, slug, abs, forceAll)) {
        skipped++;
        idx++;
        continue;
      }
      const cf = cache[gameKey]?.[slug] || {};
      const facts = { ...cf };
      delete facts.wiki_title;
      delete facts.wikitext_ok;
      delete facts.error;
      const body = buildGuideFrontMatter(gameKey, row.wiki_title, slug, facts, { idx });
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, body, "utf8");
      n++;
      idx++;
    }
  }
  console.log(`Guides written: ${n}, skipped (kept existing): ${skipped}`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const fetchOnly = args.has("--fetch-only");
  const guidesOnly = args.has("--guides-only");
  const forceGuides = args.has("--force-guides");
  const manifestPath = path.join(TRACKING_DIR, "wiki-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("Missing _character-tracking/wiki-manifest.json — run npm run character:manifest first.");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const cache = await loadOrFetchCache(manifest, !guidesOnly);

  if (!fetchOnly) {
    writePullBanners(manifest, cache);
    writeAllGuides(manifest, cache, forceGuides);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
