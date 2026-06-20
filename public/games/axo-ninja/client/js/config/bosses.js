export const BOSS_STATES = [
  "inactive",
  "awaken",
  "float_phase1",
  "attack1_lamp_skull_sequence",
  "transition_to_phase2",
  "float_phase2",
  "attack2_scream",
  "hurt_phase1",
  "hurt_phase2",
  "dead",
  "Idle",
  "AttackPattern1",
  "AttackPattern2",
  "Special",
  "PhaseTransition",
  "Enrage",
  "Rebirth",
];

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

function applyBossTuning(baseConfig, tuning = {}) {
  const base = { ...baseConfig };

  const moveSpeedScale = clamp(toFinite(tuning.moveSpeedScale, 1), 0.2, 4);
  const attackSpeedScale = clamp(toFinite(tuning.attackSpeedScale, 1), 0.2, 4);
  const damageScale = clamp(toFinite(tuning.damageScale, 1), 0.25, 4);
  const hpScale = clamp(toFinite(tuning.hpScale, 1), 0.25, 6);

  if (Number.isFinite(base.moveSpeed)) {
    base.moveSpeed = round3(base.moveSpeed * moveSpeedScale);
  }
  if (Number.isFinite(base.baseDamage)) {
    base.baseDamage = Math.max(1, Math.round(base.baseDamage * damageScale));
  }
  if (Number.isFinite(base.maxHp)) {
    base.maxHp = Math.max(1, Math.round(base.maxHp * hpScale));
  }

  const attackCd = Number.isFinite(base.attackCooldownSec)
    ? base.attackCooldownSec
    : 2.4;
  const specialCd = Number.isFinite(base.specialCooldownSec)
    ? base.specialCooldownSec
    : 1.6;
  base.attackCooldownSec = round3(clamp(attackCd / attackSpeedScale, 0.2, 12));
  base.specialCooldownSec = round3(
    clamp(specialCd / attackSpeedScale, 0.2, 12),
  );

  if (Number.isFinite(tuning.moveSpeed)) {
    base.moveSpeed = round3(clamp(tuning.moveSpeed, 0.1, 8));
  }
  if (Number.isFinite(tuning.baseDamage)) {
    base.baseDamage = Math.max(1, Math.round(tuning.baseDamage));
  }
  if (Number.isFinite(tuning.maxHp)) {
    base.maxHp = Math.max(1, Math.round(tuning.maxHp));
  }
  if (Number.isFinite(tuning.attackCooldownSec)) {
    base.attackCooldownSec = round3(clamp(tuning.attackCooldownSec, 0.2, 12));
  }
  if (Number.isFinite(tuning.specialCooldownSec)) {
    base.specialCooldownSec = round3(clamp(tuning.specialCooldownSec, 0.2, 12));
  }

  return base;
}

export const BOSSES = {
  iceTitan: {
    name: "Ice Titan",
    maxHp: 1600,
    iceChildHp: 800,
    baseDamage: 28,
    moveSpeed: 1.2,
    w: 280,
    h: 210,
    drawOffsetY: 10,
    attackCooldownSec: 2.4,
    specialCooldownSec: 1.6,
    attacks: ["slam", "iceShard", "summonCrabs"],
    special: "glacialRift",
  },
  crabBoss: {
    name: "Crab Boss",
    maxHp: 1400, // matches seedGameConfig bossHp for crabBoss
    baseDamage: 30, // matches seedGameConfig bossDamage for crabBoss
    moveSpeed: 1.3,
    w: 254,
    h: 220,
    drawOffsetY: 0,
    attackCooldownSec: 2.4,
    specialCooldownSec: 1.6,
    attacks: ["tidalSlam", "waterOrb", "summonFish"],
    special: "maelstrom",
  },
  sandBoss: {
    name: "Sand Boss",
    maxHp: 1200,
    baseDamage: 26,
    moveSpeed: 1.2,
    w: 240,
    h: 200,
    drawOffsetY: 12,
    attackCooldownSec: 2.4,
    specialCooldownSec: 1.6,
    attacks: ["slam", "sandOrb", "summonMinions"],
    special: "sandStorm",
  },
  necroKing: {
    name: "Grave Witch",
    maxHp: 1800, // matches seedGameConfig bossHp for graveWitch -> necroKing
    phase1Hp: 1800,
    phase2Hp: 1800,
    baseDamage: 35, // matches seedGameConfig bossDamage for graveWitch -> necroKing
    moveSpeed: 1.2,
    w: 252,
    h: 248,
    drawOffsetY: -6,
    attackCooldownSec: 2.4,
    specialCooldownSec: 1.6,
    attacks: ["graveSlam", "soulBolt", "raiseUndead"],
    special: "deathFog",
    // Grave Witch boss behavior tuning is centralized here for fast balancing.
    necro: {
      introDuration: 0.55,
      entryApproachDuration: 1.25,
      entryApproachSpeed: 0.0,
      floatMoveSpeedPhase1: 1.45,
      floatMoveSpeedPhase2: 1.95,
      floatMoveSpeedScream: 0.75,
      moveDeadzone: 24,
      floatVelocitySmoothing: 8.5,
      bossFloatHeight: 36,
      floatBobAmplitude: 6,
      floatBobFrequency: 1.8,
      floatYLerp: 0.22,
      arenaPadding: 30,
      phase1AttackDelay: 0.0,
      phase1SkullCount: 9999,
      phase1SkullInterval: 4.0,
      skullGrowDuration: 0.42,
      skullInitialScale: 0.9,
      skullFinalScale: 2.2,
      skullRadius: 16,
      skullGroundOffset: 34,
      skullSpeed: 2.2,
      skullHitPoints: 3,
      skullRange: 620,
      skullDamageMultiplier: 1.0,
      skullAimLead: 0.46,
      skullAimLeadMaxFrames: 20,
      lampFireDuration: 0.45,
      lampFireDurationMin: 0.45,
      lampFireDurationMax: 0.45,
      lampFireOffsetX: 26,
      lampFireLift: 8,
      lampFireJitterX: 18,
      phase2HandAnchorXRatio: 0.29,
      phase2HandAnchorYRatio: 0.22,
      phase2GroundOffsetY: 14,
      phase2RespawnDelay: 1.4,
      phase2RespawnHpRatio: 1.0,
      phase2TransitionDuration: 0.75,
      phase2VerticalAmplitude: 0,
      phase2VerticalFrequency: 0.65,
      phase2TopOffsetY: 250,
      phase2SideRatio: 0.18,
      phase2RiseSpeed: 3.8,
      phase2SlideSpeed: 3.2,
      phase2DropSpeed: 4.2,
      phase2PostAttackPauseSec: 1.25,
      phase2DownPauseSec: 8.0,
      screamDuration: 1.6,
      screamRadius: 340,
      screamDamage: 40,
      screamTickInterval: 0.32,
      screamRingCount: 8,
      screamRingInterval: 0.24,
      screamRingSpeed: 300,
      screamRingThickness: 24,
      screamRingMaxRadius: 560,
      screamRingDamage: 34,
      screamRingKnockbackX: 2.8,
      screamRingKnockbackY: -1.7,
      phase2HandFireInterval: 5.0,
      phase2HandFireIntervalMin: 5.0,
      phase2HandFireIntervalMax: 5.0,
      screamHandFireInterval: 5.0,
      screamHandFireSpeed: 8.4,
      screamHandFireRadius: 12,
      screamHandFireDamage: 24,
      screamHandFireSpriteScale: 1.65,
      screamSkyFireInterval: 0.8,
      screamSkyFireSpreadX: 110,
      screamSkyFireStartHeight: 230,
      screamSkyFireSpeed: 7.2,
      screamSkyFireFallDuration: 2.8,
      screamSkyFireSpawnYRatio: 0.2,
      screamSkyFireRadius: 14,
      screamSkyFireDamage: 30,
      screamSkyFireSpriteScale: 1.8,
      screamBlastRange: 340,
      screamBlastHalfAngleDeg: 34,
      screamBlastDamage: 52,
      screamBlastKnockbackX: 4.2,
      screamBlastKnockbackY: -2.3,
      screamCooldown: 5.0,
      immuneWhileScreaming: false,
      hurtDurationSec: 0.55,
      hitRetaliateWindowSec: 1.1,
      hitRetaliateThreshold: 2,
      hitRetaliateCooldown: 2.0,
      deathDurationSec: 3.2,
    },
  },
};

export const BOSS_PHASE_THRESHOLDS = [0.7, 0.4, 0.2];
export const BOSS_ENRAGE = { speedMultiplier: 1.2, damageMultiplier: 1.15 };

// Example: tuneBoss("crabBoss", { moveSpeedScale: 0.9, attackSpeedScale: 0.8 });
export function tuneBoss(type, tuning = {}) {
  const key = String(type || "").trim();
  if (!key || !BOSSES[key]) return null;
  BOSSES[key] = applyBossTuning(BOSSES[key], tuning);
  return BOSSES[key];
}

export function tuneAllBosses(tuning = {}) {
  const touched = [];
  Object.keys(BOSSES).forEach((type) => {
    const tuned = tuneBoss(type, tuning);
    if (tuned) touched.push(type);
  });
  return touched;
}
