export const ELEMENT = {
  WATER: "water",
  ICE: "ice",
  SAND: "sand",
  DARK: "dark",
  FIRE: "fire"
};

export const ELEMENT_SYMBOL = {
  [ELEMENT.WATER]: "🌊",
  [ELEMENT.ICE]: "❄",
  [ELEMENT.SAND]: "🏖",
  [ELEMENT.DARK]: "☠",
  [ELEMENT.FIRE]: "🔥"
};

export const ELEMENT_COLOR = {
  [ELEMENT.WATER]: "#5ec6ff",
  [ELEMENT.ICE]: "#c7f1ff",
  [ELEMENT.SAND]: "#e7c07a",
  [ELEMENT.DARK]: "#b786d9",
  [ELEMENT.FIRE]: "#ff8a54"
};

export const HERO_DEFAULT_ELEMENT = {
  ninja: ELEMENT.WATER,
  // jelly: ELEMENT.ICE,
  // flora: ELEMENT.SAND
};

// Backward compatibility for legacy ids.
HERO_DEFAULT_ELEMENT.axolittle = HERO_DEFAULT_ELEMENT.ninja;
HERO_DEFAULT_ELEMENT.pudge = HERO_DEFAULT_ELEMENT.ninja;
HERO_DEFAULT_ELEMENT.seal = HERO_DEFAULT_ELEMENT.ninja;

export const CORE_PASSIVE_CATEGORY = {
  [ELEMENT.ICE]: "movement",
  [ELEMENT.WATER]: "defense",
  [ELEMENT.SAND]: "defense",
  [ELEMENT.DARK]: "meter",
  [ELEMENT.FIRE]: "damage"
};

export const CORE_PASSIVE_VALUES = {
  [ELEMENT.ICE]: { airControlMultiplier: 1.10 },
  [ELEMENT.WATER]: { waterHealTickMultiplier: 1.10 },
  [ELEMENT.SAND]: { knockbackMultiplier: 0.92 },
  [ELEMENT.DARK]: { ultKillMultiplier: 1.05 },
  [ELEMENT.FIRE]: { burnSec: 2, burnDps: 1 }
};

export const WORLD_ELEMENT = {
  ice: ELEMENT.ICE,
  water: ELEMENT.WATER,
  beach: ELEMENT.SAND,
  grave: ELEMENT.DARK
};

const ADVANTAGE = {
  [ELEMENT.WATER]: ELEMENT.FIRE,
  [ELEMENT.FIRE]: ELEMENT.ICE,
  [ELEMENT.ICE]: ELEMENT.SAND,
  [ELEMENT.SAND]: ELEMENT.WATER
};

export function getElementMultiplier(attacker, defender) {
  if (!attacker || !defender) return 1.0;
  if (attacker === ELEMENT.DARK || defender === ELEMENT.DARK) return 1.0;
  if (ADVANTAGE[attacker] === defender) return 1.1;
  if (ADVANTAGE[defender] === attacker) return 0.95;
  return 1.0;
}

const TYPE_TO_ELEMENT = {
  iceSlime: ELEMENT.ICE,
  spikedSkull: ELEMENT.ICE,
  spiked: ELEMENT.ICE,
  iceCrab: ELEMENT.ICE,
  frostGiant: ELEMENT.ICE,
  iceTitan: ELEMENT.ICE,

  fishScout: ELEMENT.WATER,
  jellyBomber: ELEMENT.WATER,
  coralShooter: ELEMENT.WATER,
  eliteWaterGuard: ELEMENT.WATER,
  coralHydra: ELEMENT.WATER,
  crabBoss: ELEMENT.WATER,

  sandWorm: ELEMENT.SAND,
  crabSnapper: ELEMENT.SAND,
  sandGolem: ELEMENT.SAND,
  sandBoss: ELEMENT.SAND,
  beachSerpentMini: ELEMENT.SAND,

  skeletonWarrior: ELEMENT.DARK,
  ghostWailer: ELEMENT.DARK,
  zombieGrabber: ELEMENT.DARK,
  necromancer: ELEMENT.DARK,
  shadowWraithMini: ELEMENT.DARK,
  necroKing: ELEMENT.DARK
};

export function getEntityElement(type, fallback = ELEMENT.DARK) {
  return TYPE_TO_ELEMENT[type] || fallback;
}

export const ATTUNEMENT_OPTION = {
  DEFAULT: "default",
  FIRE: ELEMENT.FIRE
};

export function resolveAttunement({ world, selected, hasFireUnlocked }) {
  if (selected === ELEMENT.FIRE && hasFireUnlocked) return ELEMENT.FIRE;
  return WORLD_ELEMENT[world] || ELEMENT.DARK;
}

export function isValidElement(value) {
  return Object.values(ELEMENT).includes(value);
}

export function getCorePassiveCategory(element) {
  return CORE_PASSIVE_CATEGORY[element] || null;
}

export function getCorePassiveValue(element) {
  return CORE_PASSIVE_VALUES[element] || {};
}

export function getElementSkinNames(heroId, element) {
  const normalizedHero = (() => {
    const key = String(heroId || "").trim().toLowerCase();
    if (key === "axolittle") return "ninja";
    if (key === "pudge") return "ninja";
    if (key === "seal") return "ninja";
    return key || "ninja";
  })();
  const base = {
    ninja: { A: "Shield", B: "Dash", Skill: "Blast", ULT: "Nova" },
    // flora: { A: "Slam", B: "Guard", Skill: "Throw", ULT: "Breaker" },
    // jelly: { A: "Slide", B: "Touch", Skill: "Spike", ULT: "Storm" }
  };

  const prefix = {
    [ELEMENT.WATER]: "Tide",
    [ELEMENT.ICE]: "Glacier",
    [ELEMENT.SAND]: "Dune",
    [ELEMENT.DARK]: "Umbral",
    [ELEMENT.FIRE]: "Ember"
  }[element] || "Core";

  const row = base[normalizedHero] || base.ninja;
  return {
    A: `${prefix} ${row.A}`,
    B: `${prefix} ${row.B}`,
    Skill: `${prefix} ${row.Skill}`,
    ULT: `${prefix} ${row.ULT}`
  };
}
