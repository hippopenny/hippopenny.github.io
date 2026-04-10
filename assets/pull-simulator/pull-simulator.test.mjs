/**
 * Node smoke tests (no browser). Run: node assets/pull-simulator/pull-simulator.test.mjs
 */
import assert from "assert";
import { SIMULATOR_CONFIGS } from "./pull-simulator-config.js";
import {
  mergePersistedPullState,
  storageKeyForConfig,
  STORAGE_PREFIX
} from "./pull-simulator-storage.js";

function resolveRarity(state, pity, randoms) {
  let i = 0;
  const rnd = () => {
    if (i >= randoms.length) throw new Error(`RNG exhausted at ${i}`);
    return randoms[i++];
  };

  const nextPity5 = state.pity5 + 1;
  const nextPity4 = state.pity4 + 1;
  const p = pity;

  if (nextPity5 >= p.fiveStarHard) return 5;

  const softPityStart = Math.floor(p.fiveStarHard * 0.82);
  let fiveStarRate = p.baseFiveStarRate;
  if (nextPity5 > softPityStart) {
    const progress = (nextPity5 - softPityStart) / (p.fiveStarHard - softPityStart);
    fiveStarRate = fiveStarRate + (1 - fiveStarRate) * progress * 0.72;
  }
  if (rnd() < fiveStarRate) return 5;

  const floor5 = p.fourStarFloorFiveStarRate ?? 0.06;
  if (nextPity4 >= p.fourStarHard) {
    if (rnd() < floor5) return 5;
    return 4;
  }
  if (rnd() < p.baseFourStarRate) return 4;

  return 3;
}

function chooseRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickOffBannerStandard(config, bannerId) {
  const banner = config.banners.find((b) => b.id === bannerId);
  const std = config.standardFiveStarPool;
  const pick = chooseRandom(std);
  return { banner: banner.name, pick: pick.name, stdSize: std.length };
}

for (const key of Object.keys(SIMULATOR_CONFIGS)) {
  const cfg = SIMULATOR_CONFIGS[key];
  assert.ok(cfg.currency, `${key}: currency`);
  assert.ok(cfg.currency.costPerWish === 160, `${key}: cost 160`);
  assert.ok(cfg.standardFiveStarPool?.length >= 1, `${key}: standard pool`);
  assert.strictEqual(cfg.pity.fourStarFloorFiveStarRate, 0.06, `${key}: 6% floor`);
}

const gi = SIMULATOR_CONFIGS["genshin-impact"].pity;

assert.strictEqual(resolveRarity({ pity5: 89, pity4: 0 }, gi, []), 5, "hard 5★ at 90th pull");

assert.strictEqual(
  resolveRarity({ pity5: 0, pity4: 9 }, gi, [1, 0.05]),
  5,
  "4★ floor: 6% upgrades to 5★"
);

assert.strictEqual(
  resolveRarity({ pity5: 0, pity4: 9 }, gi, [1, 0.07]),
  4,
  "4★ floor: otherwise 4★"
);

assert.strictEqual(
  resolveRarity({ pity5: 0, pity4: 0 }, gi, [1, 0.04]),
  4,
  "normal: 4★ branch"
);

assert.strictEqual(
  resolveRarity({ pity5: 0, pity4: 0 }, gi, [1, 1]),
  3,
  "normal: 3★"
);

const wu = SIMULATOR_CONFIGS["wuthering-waves"].pity;
assert.strictEqual(resolveRarity({ pity5: 79, pity4: 0 }, wu, []), 5, "WuWa hard at 80");

const ob = pickOffBannerStandard(SIMULATOR_CONFIGS["genshin-impact"], "furina");
assert.ok(ob.pick && ob.pick !== "Furina", "off-banner is from standard pool not featured");
assert.strictEqual(ob.stdSize, 7);

// --- Storage key + merge (localStorage contract)
assert.strictEqual(
  storageKeyForConfig("genshin-impact"),
  `${STORAGE_PREFIX}:genshin-impact`,
  "per-game isolated storage key"
);

const baseFallback = {
  activeBannerId: "furina",
  pity5: 0,
  pity4: 0,
  featuredGuarantee: false,
  totalPulls: 0,
  recentResults: [],
  inventory: {},
  rarityCounts: { 5: 0, 4: 0, 3: 0 },
  premiumCurrency: 1600,
  lastAdRewardAt: null
};

assert.strictEqual(
  mergePersistedPullState(baseFallback, { activeBannerId: "nahida" }, "furina").activeBannerId,
  "furina",
  "?banner= in URL overrides stored tab"
);

assert.strictEqual(
  mergePersistedPullState(baseFallback, { activeBannerId: "nahida" }, null).activeBannerId,
  "nahida",
  "stored tab used when no URL override"
);

assert.strictEqual(
  mergePersistedPullState(baseFallback, { premiumCurrency: "oops" }, null).premiumCurrency,
  1600,
  "non-numeric premiumCurrency falls back"
);

assert.deepStrictEqual(
  mergePersistedPullState(baseFallback, { rarityCounts: { 5: 2 } }, null).rarityCounts,
  { 5: 2, 4: 0, 3: 0 },
  "partial rarityCounts merge with defaults"
);

assert.strictEqual(
  mergePersistedPullState(baseFallback, { lastAdRewardAt: "bad" }, null).lastAdRewardAt,
  null,
  "invalid lastAdRewardAt falls back"
);

assert.strictEqual(
  mergePersistedPullState(baseFallback, { lastAdRewardAt: 1_700_000_000_000 }, null).lastAdRewardAt,
  1_700_000_000_000,
  "numeric lastAdRewardAt kept"
);

const roundTrip = JSON.parse(
  JSON.stringify(
    mergePersistedPullState(
      baseFallback,
      {
        pity5: 40,
        premiumCurrency: 5000,
        inventory: { Furina: 1 },
        lastAdRewardAt: null
      },
      null
    )
  )
);
assert.strictEqual(roundTrip.pity5, 40);
assert.strictEqual(roundTrip.inventory.Furina, 1);
assert.strictEqual(roundTrip.premiumCurrency, 5000);

console.log("pull-simulator.test.mjs: all assertions passed.");
