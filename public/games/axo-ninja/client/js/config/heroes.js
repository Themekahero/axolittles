import { CONST } from "./constants.js";

export const HERO_ANIMATION_STATES = [
  "Idle",
  "Run",
  "Jump",
  "Fall",
  "Attack",
  "Ability",
  "Hurt",
  "Death",
  "Ultimate",
];

function toFinite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function cloneAbilities(abilities) {
  const src = abilities && typeof abilities === "object" ? abilities : {};
  return Object.fromEntries(
    Object.entries(src).map(([key, value]) => [
      key,
      value && typeof value === "object" ? { ...value } : value,
    ]),
  );
}

function applyNumericOverrides(target, overrides) {
  if (!target || typeof target !== "object") return;
  if (!overrides || typeof overrides !== "object") return;
  Object.entries(overrides).forEach(([key, value]) => {
    if (!Number.isFinite(Number(value))) return;
    target[key] = Number(value);
  });
}

function applyHeroGameplayTuning(baseHero, tuning = {}) {
  const next = {
    ...baseHero,
    abilities: cloneAbilities(baseHero?.abilities),
  };

  const moveSpeedScale = clampNumber(
    toFinite(tuning.moveSpeedScale, 1),
    0.25,
    4,
  );
  const damageScale = clampNumber(toFinite(tuning.damageScale, 1), 0.25, 4);
  const cooldownScale = clampNumber(toFinite(tuning.cooldownScale, 1), 0.2, 4);

  const prevRuntimeScale = Number.isFinite(next.runtimeMoveSpeedScale)
    ? Number(next.runtimeMoveSpeedScale)
    : 1;
  next.runtimeMoveSpeedScale = round3(
    clampNumber(prevRuntimeScale * moveSpeedScale, 0.25, 4),
  );

  if (Number.isFinite(next.damage)) {
    next.damage = Math.max(1, Math.round(next.damage * damageScale));
  }

  Object.values(next.abilities).forEach((ability) => {
    if (!ability || typeof ability !== "object") return;
    if (Number.isFinite(ability.cooldown)) {
      ability.cooldown = round3(
        clampNumber(ability.cooldown * cooldownScale, 0.05, 120),
      );
    }
  });

  // Optional direct overrides.
  if (Number.isFinite(tuning.damage)) {
    next.damage = Math.max(1, Math.round(Number(tuning.damage)));
  }
  if (Number.isFinite(tuning.hearts)) {
    next.hearts = Math.max(1, Math.round(Number(tuning.hearts)));
  }
  if (Number.isFinite(tuning.moveSpeed)) {
    next.moveSpeed = clampNumber(Number(tuning.moveSpeed), 0.1, 20);
  }
  if (Number.isFinite(tuning.runtimeMoveSpeedScale)) {
    next.runtimeMoveSpeedScale = round3(
      clampNumber(Number(tuning.runtimeMoveSpeedScale), 0.25, 4),
    );
  }

  if (tuning.abilities && typeof tuning.abilities === "object") {
    Object.entries(tuning.abilities).forEach(
      ([abilityKey, abilityOverrides]) => {
        if (
          !next.abilities[abilityKey] ||
          typeof next.abilities[abilityKey] !== "object"
        )
          return;
        applyNumericOverrides(next.abilities[abilityKey], abilityOverrides);
      },
    );
  }

  return next;
}

export const HEROES = {
  ninja: {
    id: "ninja",
    legacyId: "axolittle",
    name: "Ninja",
    hearts: 5,
    damage: 22,
    moveSpeed: CONST.HERO_SPEED.ninja,
    runtimeMoveSpeedScale: 1,
    abilities: {
      A: { name: "WaterShield", cooldown: 12, duration: 6, blocksHits: 1 },
      B: { name: "BubbleDash", cooldown: 6, dashDistance: CONST.DASH.Distance },
      basicAbility: { name: "WaterBlast", cooldown: 1.2 },
      ultimate: {
        name: "AquaNova",
        radius: 250,
        chargeRequired: 100,
      },
    },
  },
  // flora: {
  //   id: "flora",
  //   legacyId: "pudge",
  //   name: "Flora",
  //   hearts: 5,
  //   damage: 28,
  //   moveSpeed: CONST.HERO_SPEED.flora,
  //   runtimeMoveSpeedScale: 1,
  //   abilities: {
  //     A: { name: "GroundSlam", radius: 200, cooldown: 7 },
  //     B: { name: "SandShield", reduction: 0.4, cooldown: 10, duration: 5 },
  //     basicAbility: { name: "BoulderThrow", cooldown: 2 },
  //     ultimate: {
  //       name: "Earthbreaker",
  //       stunSec: 1.5,
  //       chargeRequired: 100,
  //     },
  //   },
  // },
  // jelly: {
  //   id: "jelly",
  //   legacyId: "seal",
  //   name: "Jelly",
  //   hearts: 5,
  //   damage: 20,
  //   moveSpeed: CONST.HERO_SPEED.jelly,
  //   runtimeMoveSpeedScale: 1,
  //   abilities: {
  //     A: {
  //       name: "SlideDash",
  //       cooldown: 5,
  //       dashDistance: CONST.DASH.Distance,
  //     },
  //     B: { name: "FreezeTouch", freezeSec: 2, cooldown: 8 },
  //     basicAbility: { name: "IceSpike", cooldown: 1.5 },
  //     ultimate: {
  //       name: "PolarStorm",
  //       radius: 300,
  //       freezeSec: 3,
  //       chargeRequired: 100,
  //     },
  //   },
  // },
};

// Backward compatibility aliases for legacy ids still used by backend/database.
HEROES.axolittle = HEROES.ninja;
// HEROES.pudge = HEROES.flora;
// HEROES.seal = HEROES.jelly;

// Gameplay tuning helper (move speed, cooldowns, damage).
// Example:
// tuneHeroGameplay("ninja", { moveSpeedScale: 1.1, cooldownScale: 0.9, damageScale: 1.15 });
export function tuneHeroGameplay(heroId, tuning = {}) {
  const key = String(heroId || "").trim();
  if (!key || !HEROES[key]) return null;
  HEROES[key] = applyHeroGameplayTuning(HEROES[key], tuning);
  return HEROES[key];
}

export function tuneAllHeroesGameplay(tuning = {}) {
  const touched = [];
  Object.keys(HEROES).forEach((heroId) => {
    const tuned = tuneHeroGameplay(heroId, tuning);
    if (tuned) touched.push(heroId);
  });
  return touched;
}
