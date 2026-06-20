/**
 * Fallback level config when API is unavailable.
 * Mirrors server/scripts/seedGameConfig.js values.
 */

function toNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function buildEnemyList(enemyTypeMaxCount = {}, enemyRewards = {}) {
  const out = [];
  for (const [enemyCode, rawCount] of Object.entries(enemyTypeMaxCount)) {
    const count = toNonNegativeInt(rawCount, 0);
    if (!enemyCode || count <= 0) continue;
    out.push({
      enemyCode,
      enemyName: enemyCode,
      hp: 0,
      damage: 0,
      count,
      reward: toNonNegativeInt(enemyRewards?.[enemyCode], 0),
      active: true,
    });
  }
  return out;
}

function buildEnemiesByCode(enemies = []) {
  const out = {};
  for (const entry of enemies) {
    const enemyCode = String(entry?.enemyCode || "").trim();
    if (!enemyCode) continue;
    out[enemyCode] = { ...entry };
  }
  return out;
}

function cloneNumberMap(value) {
  return value && typeof value === "object" ? { ...value } : {};
}

function cloneEnemyList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => ({
    enemyCode: String(entry?.enemyCode || "").trim(),
    enemyName:
      String(entry?.enemyName || entry?.enemyCode || "").trim() ||
      String(entry?.enemyCode || "").trim(),
    hp: toNonNegativeInt(entry?.hp, 0),
    damage: toNonNegativeInt(entry?.damage, 0),
    count: toNonNegativeInt(entry?.count, 0),
    reward: toNonNegativeInt(entry?.reward, 0),
    active: entry?.active !== false,
  }));
}

const BASE_FALLBACK_LEVEL_CONFIG_BY_ID = {
  1: {
    isFallback: true,
    levelId: 1,
    levelName: "Coral Cove",
    timeLimitSec: 510,
    bossName: "Sand Boss",
    bossCode: "sandBoss",
    bossHp: 1200,
    bossDamage: 26,
    maxTotalCoins: 20250,
    maxCollectibleCoins: 400,
    coinValue: 20,
    bossReward: 7650,
    enemyMaxCount: 50,
    enemyRewards: {
      plague: 50,
      red: 75,
      spiked: 100,
      golden: 125,
      grin: 150,
    },
    enemyTypeMaxCount: {
      plague: 14,
      red: 10,
      spiked: 10,
      golden: 10,
      grin: 6,
    },
    active: true,
  },
  2: {
    isFallback: true,
    levelId: 2,
    levelName: "Blue Depths",
    timeLimitSec: 570,
    bossName: "Crab Boss",
    bossCode: "crabBoss",
    bossHp: 1400,
    bossDamage: 30,
    maxTotalCoins: 22550,
    maxCollectibleCoins: 450,
    coinValue: 20,
    bossReward: 8500,
    enemyMaxCount: 50,
    enemyRewards: {
      fishScout: 50,
      coralHydra: 75,
      coralShooter: 100,
      eliteWaterGuard: 125,
      jellyBomber: 150,
    },
    enemyTypeMaxCount: {
      fishScout: 8,
      coralHydra: 10,
      coralShooter: 12,
      eliteWaterGuard: 12,
      jellyBomber: 8,
    },
    active: true,
  },
  3: {
    isFallback: true,
    levelId: 3,
    levelName: "Ice Peak",
    timeLimitSec: 690,
    bossName: "Ice Titan",
    bossCode: "iceTitan",
    bossHp: 1600,
    bossDamage: 28,
    maxTotalCoins: 22100,
    maxCollectibleCoins: 350,
    coinValue: 20,
    bossReward: 9500,
    enemyMaxCount: 60,
    enemyRewards: {
      plague: 50,
      red: 75,
      spiked: 100,
      golden: 125,
      grin: 150,
    },
    enemyTypeMaxCount: {
      plague: 16,
      red: 12,
      spiked: 12,
      golden: 12,
      grin: 8,
    },
    active: true,
  },
  4: {
    isFallback: true,
    levelId: 4,
    levelName: "Shadow Hollow",
    timeLimitSec: 810,
    bossName: "Grave Witch",
    bossCode: "necroKing",
    bossHp: 1800,
    bossDamage: 35,
    maxTotalCoins: 35100,
    maxCollectibleCoins: 400,
    coinValue: 20,
    bossReward: 12500,
    enemyMaxCount: 70,
    enemyRewards: {
      plague: 50,
      red: 75,
      spiked: 100,
      golden: 125,
      grin: 150,
    },
    enemyTypeMaxCount: {
      plague: 18,
      red: 14,
      spiked: 14,
      golden: 14,
      grin: 10,
    },
    active: true,
  },
};

function cloneLevelConfig(level) {
  const enemyRewards = cloneNumberMap(level?.enemyRewards);
  const enemyTypeMaxCount = cloneNumberMap(level?.enemyTypeMaxCount);
  const enemies = cloneEnemyList(
    Array.isArray(level?.enemies) && level.enemies.length > 0
      ? level.enemies
      : buildEnemyList(enemyTypeMaxCount, enemyRewards),
  );
  return {
    isFallback: level?.isFallback === true,
    levelId: toNonNegativeInt(level?.levelId, 1),
    levelName: String(level?.levelName || "").trim(),
    timeLimitSec: toNonNegativeInt(level?.timeLimitSec, 420),
    bossName: String(level?.bossName || "").trim(),
    bossCode: String(level?.bossCode || "").trim(),
    bossHp: toNonNegativeInt(level?.bossHp, 0),
    bossDamage: toNonNegativeInt(level?.bossDamage, 0),
    maxTotalCoins: toNonNegativeInt(level?.maxTotalCoins, 0),
    maxCollectibleCoins: toNonNegativeInt(level?.maxCollectibleCoins, 0),
    coinValue: toNonNegativeInt(level?.coinValue, 0),
    bossReward: toNonNegativeInt(level?.bossReward, 0),
    enemyMaxCount: toNonNegativeInt(level?.enemyMaxCount, 0),
    enemyRewards,
    enemyTypeMaxCount,
    enemies,
    enemiesByCode: buildEnemiesByCode(enemies),
    active: level?.active !== false,
  };
}

export const FALLBACK_LEVEL_CONFIG_BY_ID = Object.freeze(
  Object.fromEntries(
    Object.entries(BASE_FALLBACK_LEVEL_CONFIG_BY_ID).map(([id, level]) => [
      id,
      cloneLevelConfig(level),
    ]),
  ),
);

export const FALLBACK_MAX_TOTAL_COINS = Object.freeze(
  Object.fromEntries(
    Object.entries(BASE_FALLBACK_LEVEL_CONFIG_BY_ID).map(([id, level]) => [
      id,
      toNonNegativeInt(level?.maxTotalCoins, 0),
    ]),
  ),
);

export const FALLBACK_BOSS_REWARDS = Object.freeze({
  sandBoss: 7650,
  crabBoss: 8500,
  iceTitan: 9500,
  necroKing: 12500,
  graveWitch: 12500, // alias for necroKing
});

export function getFallbackLevelConfig(levelId) {
  const id = Math.max(1, Math.floor(Number(levelId) || 1));
  return cloneLevelConfig(
    BASE_FALLBACK_LEVEL_CONFIG_BY_ID[id] || BASE_FALLBACK_LEVEL_CONFIG_BY_ID[1],
  );
}

export function getFallbackLevelConfigById() {
  const out = {};
  for (const key of Object.keys(BASE_FALLBACK_LEVEL_CONFIG_BY_ID)) {
    out[key] = getFallbackLevelConfig(Number(key));
  }
  return out;
}

export function getFallbackMaxTotalCoins(levelId) {
  const id = Math.max(1, Math.floor(Number(levelId) || 1));
  return FALLBACK_MAX_TOTAL_COINS[id] ?? FALLBACK_MAX_TOTAL_COINS[1];
}

export function getFallbackCoinValue(levelId) {
  return getFallbackLevelConfig(levelId).coinValue;
}
