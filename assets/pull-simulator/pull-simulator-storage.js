export const STORAGE_PREFIX = "hippo-pull-simulator/v1";

export function storageKeyForConfig(configKey) {
  return `${STORAGE_PREFIX}:${configKey}`;
}

/**
 * Merges persisted JSON with defaults. Mirrors URL `?banner=` when requestedBannerId is set.
 */
export function mergePersistedPullState(fallback, parsed, requestedBannerId) {
  return {
    ...fallback,
    ...parsed,
    activeBannerId: requestedBannerId || parsed.activeBannerId || fallback.activeBannerId,
    rarityCounts: { ...fallback.rarityCounts, ...(parsed.rarityCounts || {}) },
    inventory: parsed.inventory || {},
    premiumCurrency:
      typeof parsed.premiumCurrency === "number"
        ? parsed.premiumCurrency
        : fallback.premiumCurrency,
    lastAdRewardAt:
      parsed.lastAdRewardAt === null || typeof parsed.lastAdRewardAt === "number"
        ? parsed.lastAdRewardAt
        : fallback.lastAdRewardAt
  };
}
