export const ENEMY_AI_STATES = ["Patrol", "Chase", "Attack", "Hurt", "Death"];

const COMMON = {
  attackCooldownSec: 1.2,
  hurtRecoverySec: 0.3,
  removeAfterDeathSec: 1,
  attackFramePoint: 0.6
};

function toFinite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function applyEnemyTuning(baseConfig, tuning = {}) {
  const base = {
    ...baseConfig,
  };

  const walkSpeedScale = clamp(toFinite(tuning.walkSpeedScale, 1), 0.2, 4);
  const attackSpeedScale = clamp(toFinite(tuning.attackSpeedScale, 1), 0.2, 4);
  const damageScale = clamp(toFinite(tuning.damageScale, 1), 0.25, 4);
  const hpScale = clamp(toFinite(tuning.hpScale, 1), 0.25, 6);

  if (Number.isFinite(base.speed)) {
    base.speed = round3(base.speed * walkSpeedScale);
  }
  if (Number.isFinite(base.damage)) {
    base.damage = Math.max(1, Math.round(base.damage * damageScale));
  }
  if (Number.isFinite(base.hp)) {
    base.hp = Math.max(1, Math.round(base.hp * hpScale));
  }

  const baseAttackCooldown = Number.isFinite(base.attackCooldownSec)
    ? base.attackCooldownSec
    : COMMON.attackCooldownSec;
  base.attackCooldownSec = round3(
    clamp(baseAttackCooldown / attackSpeedScale, 0.15, 10),
  );

  const baseAttackDuration = Number.isFinite(base.attackDurationSec)
    ? base.attackDurationSec
    : 0.5;
  base.attackDurationSec = round3(
    clamp(baseAttackDuration / attackSpeedScale, 0.15, 10),
  );

  if (Number.isFinite(tuning.walkSpeed)) {
    base.speed = round3(clamp(tuning.walkSpeed, 0.1, 8));
  }
  if (Number.isFinite(tuning.damage)) {
    base.damage = Math.max(1, Math.round(tuning.damage));
  }
  if (Number.isFinite(tuning.hp)) {
    base.hp = Math.max(1, Math.round(tuning.hp));
  }
  if (Number.isFinite(tuning.attackCooldownSec)) {
    base.attackCooldownSec = round3(clamp(tuning.attackCooldownSec, 0.15, 10));
  }
  if (Number.isFinite(tuning.attackDurationSec)) {
    base.attackDurationSec = round3(clamp(tuning.attackDurationSec, 0.15, 10));
  }

  return base;
}

function hasWalkAndAttackProfile(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  if (!Number.isFinite(cfg.speed)) return false;
  return (
    Number.isFinite(cfg.attackDurationSec) ||
    Number.isFinite(cfg.attackStartRange) ||
    Number.isFinite(cfg.attackHitRange)
  );
}

// Only enemies and bosses that appear in seedGameConfig.js.
export const ENEMIES = {
  // Normal enemies that appear in levelEnemies (Beach / Water)
  fishScout:   { hp: 20, damage: 22, speed: 1.8, detectRange: 200, coins: 50,  w: 44, h: 72, ...COMMON }, // 50 in L2
  jellyBomber: { hp: 32, damage: 22, speed: 1.3, detectRange: 200, coins: 150, w: 122, h: 120, ...COMMON }, // 150 in L2
  coralShooter:{ hp: 18, damage: 22, speed: 1.1, detectRange: 200, coins: 100, w: 74, h: 64, ...COMMON }, // 100 in L2

  // Void / dark enemies from seedGameConfig (golden/grin/plague/red)
  // Fallback coins mirror the current seedGameConfig rewards.
  golden: { hp: 25, damage: 22, speed: 1.6, detectRange: 220, coins: 125, w: 60, h: 72, ...COMMON },  // rewards up to 125
  grin:   { hp: 30, damage: 22, speed: 1.6, detectRange: 220, coins: 150, w: 60, h: 72, ...COMMON },  // rewards up to 150
  plague: { hp: 20, damage: 22, speed: 1.4, detectRange: 220, coins: 50,  w: 60, h: 72, ...COMMON },  // rewards up to 50
  red:    { hp: 22, damage: 22, speed: 1.5, detectRange: 220, coins: 75,  w: 60, h: 72, ...COMMON },  // rewards up to 75

  // Elite / special enemies
  eliteWaterGuard: { hp: 38, damage: 22, speed: 1.1, detectRange: 260, coins: 125, w: 84, h: 66, ...COMMON }, // 125 in L2
  coralHydra:  { hp: 20, damage: 22, speed: 1.0, detectRange: 260, coins: 75,  miniBoss: true, w: 80, h: 60, ...COMMON }, // 75 in L2
  // "spiked" in seed maps onto spikedSkull here.
  spikedSkull: { hp: 20, damage: 22, speed: 1.85, detectRange: 190, coins: 100, ...COMMON }, // rewards up to 100 in Beach/Ice/Grave levels

  // Bosses (one per level)
  sandBoss:  { hp: 1200, damage: 26, speed: 1.0, detectRange: 280, coins: 7650,  w: 100, h: 110, ...COMMON },  // Sand Boss bossReward
  crabBoss:  { hp: 1400, damage: 30, speed: 1.05, detectRange: 300, coins: 8500,  w: 108, h: 116, ...COMMON }, // Crab Boss bossReward
  iceTitan:  { hp: 1600, damage: 28, speed: 0.95, detectRange: 280, coins: 9500,              ...COMMON },     // Ice Titan bossReward
  necroKing: { hp: 1800, damage: 35, speed: 0.9,  detectRange: 320, coins: 12500, w: 112, h: 122, ...COMMON }, // Grave Witch bossReward
};

// Alias seed-only codes to internal entries so every seedGameConfig enemy/boss name has a runtime mapping.
ENEMIES.spiked = ENEMIES.spikedSkull;
ENEMIES.beachCrusher = ENEMIES.sandBoss;
ENEMIES.graveWitch = ENEMIES.necroKing;

// Legacy/unused runtime enemies kept for reference (commented out).
/*
export const LEGACY_ENEMIES = {
  iceSlime: { hp: 40, damage: 8, speed: 1.4, detectRange: 200, coins: 50, ...COMMON },
  iceCrab: { hp: 52, damage: 11, speed: 1.2, detectRange: 200, coins: 62, ...COMMON },
  sandWorm: { hp: 22, damage: 13, speed: 1.4, detectRange: 200, coins: 68, ...COMMON },
  crabSnapper: { hp: 20, damage: 12, speed: 1.2, detectRange: 200, coins: 68, ...COMMON },
  skeletonWarrior: { hp: 56, damage: 14, speed: 1.4, detectRange: 200, coins: 75, ...COMMON },
  ghostWailer: { hp: 42, damage: 15, speed: 1.9, detectRange: 200, coins: 80, ...COMMON },
  zombieGrabber: { hp: 62, damage: 16, speed: 1.0, detectRange: 200, coins: 75, ...COMMON },
  frostGiant: { hp: 120, damage: 18, speed: 1.0, detectRange: 260, coins: 140, elite: true, ...COMMON },
  sandGolem: { hp: 130, damage: 19, speed: 0.9, detectRange: 260, coins: 145, elite: true, ...COMMON },
  necromancer: { hp: 125, damage: 20, speed: 1.0, detectRange: 260, coins: 152, elite: true, ...COMMON },
  beachSerpentMini: { hp: 175, damage: 23, speed: 1.1, detectRange: 260, coins: 185, miniBoss: true, ...COMMON },
  shadowWraithMini: { hp: 205, damage: 25, speed: 1.05, detectRange: 280, coins: 220, miniBoss: true, ...COMMON },
};
*/

// Single helper for runtime balancing.
// Example: tuneEnemy("crabSnapper", { walkSpeedScale: 1.2, attackSpeedScale: 1.15 });
export function tuneEnemy(type, tuning = {}) {
  const key = String(type || "").trim();
  if (!key || !ENEMIES[key]) return null;
  ENEMIES[key] = applyEnemyTuning(ENEMIES[key], tuning);
  return ENEMIES[key];
}

// Applies only to enemies that define explicit walk+attack fields.
export function tuneWalkAttackEnemies(tuning = {}) {
  const touched = [];
  Object.keys(ENEMIES).forEach((type) => {
    const cfg = ENEMIES[type];
    if (!hasWalkAndAttackProfile(cfg)) return;
    const tuned = tuneEnemy(type, tuning);
    if (tuned) touched.push(type);
  });
  return touched;
}

// Default balancing: only enemies with explicit walk+attack profiles are tuned.
tuneWalkAttackEnemies({ walkSpeedScale: 0.88, attackSpeedScale: 0.82 });
