import { LEVEL_ASSETS } from "../config/levelAssets.js";
import {
  collectWorldVisualPaths,
  WORLD_VISUALS,
} from "../config/worldVisuals.js";

function toAssetCacheKey(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) {
    try {
      const parsed = new URL(src);
      return parsed.pathname.replace(/^\/+/, "");
    } catch {
      return src;
    }
  }
  return src.replace(/^\/+/, "");
}

/** Resolve asset path: full URLs (e.g. CDN) unchanged; relative paths use same-origin. */
export function getAssetBase() {
  return typeof window !== "undefined" ? window.location?.origin || "" : "";
}

export function toPublicAssetPath(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const normalizedPath = src.replace(/^\/+/, "");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  // Relative to the page URL so the game works from any subdirectory.
  return normalizedPath;
}

const assets = {
  images: new Map(),
  audio: new Map(),
};

const pendingAssetLoads = {
  images: new Map(),
  audio: new Map(),
};

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".mp4"]);

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = toPublicAssetPath(path);
  });
}

export function configureAudioElement(audioNode) {
  if (!audioNode) return audioNode;
  audioNode.preload = "metadata";
  try {
    audioNode.playsInline = true;
  } catch {}
  audioNode.setAttribute?.("playsinline", "");
  audioNode.setAttribute?.("webkit-playsinline", "");
  return audioNode;
}

function loadAudio(path) {
  return new Promise((resolve, reject) => {
    const a = configureAudioElement(new Audio());
    let settled = false;
    let timeoutId = null;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      a.removeEventListener("canplaythrough", onReady);
      a.removeEventListener("canplay", onReady);
      a.removeEventListener("loadedmetadata", onReady);
      a.removeEventListener("loadeddata", onReady);
      a.removeEventListener("error", onError);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      fn();
    };
    const onReady = () => finish(() => resolve(a));
    const onError = (event) => finish(() => reject(event));
    a.addEventListener("canplaythrough", onReady, { once: true });
    a.addEventListener("canplay", onReady, { once: true });
    a.addEventListener("loadedmetadata", onReady, { once: true });
    a.addEventListener("loadeddata", onReady, { once: true });
    a.addEventListener("error", onError, { once: true });
    a.src = toPublicAssetPath(path);
    a.load();
    timeoutId = setTimeout(() => {
      finish(() => resolve(a));
    }, 2500);
  });
}

export const HERO_SPRITES = {
  ninja: {
    // Hero art ships with the build (vendored locally, no CDN).
    idle: "assets/sprites/hero/idle.webp",
    run: "assets/sprites/hero/run.webp",
    jump: "assets/sprites/hero/jump.webp",
    fall: "assets/sprites/hero/fall.png",
    attack: "assets/sprites/hero/attack.png",
    ability: "assets/sprites/hero/ability.png",
    hurt: "assets/sprites/hero/hurt.webp",
    death: "assets/sprites/hero/death.webp",
    ultimate: "assets/sprites/hero/ultimate.png",
  },
};

export const HERO_SPRITE_META = {
  ninja: {
    idle: { frameCount: 6, fps: 7 },
    run: { frameCount: 4, fps: 9 },
    jump: { frameCount: 6, fps: 8 },
    fall: { frameCount: 6, fps: 8 },
    attack: { frameCount: 4, fps: 9 },
    ability: { frameCount: 4, fps: 9 },
    hurt: { frameCount: 6, fps: 8 },
    death: { frameCount: 4, fps: 5 },
    ultimate: { frameCount: 4, fps: 9 },
  },
};

// Backward compatibility aliases for legacy ids.
HERO_SPRITES.axolittle = HERO_SPRITES.ninja;
// HERO_SPRITES.pudge = HERO_SPRITES.flora || HERO_SPRITES.ninja;
// HERO_SPRITES.seal = HERO_SPRITES.jelly || HERO_SPRITES.ninja;
HERO_SPRITES.pudge = HERO_SPRITES.ninja;
HERO_SPRITES.seal = HERO_SPRITES.ninja;
HERO_SPRITE_META.axolittle = HERO_SPRITE_META.ninja;
// HERO_SPRITE_META.pudge = HERO_SPRITE_META.flora || HERO_SPRITE_META.ninja;
// HERO_SPRITE_META.seal = HERO_SPRITE_META.jelly || HERO_SPRITE_META.ninja;
HERO_SPRITE_META.pudge = HERO_SPRITE_META.ninja;
HERO_SPRITE_META.seal = HERO_SPRITE_META.ninja;

const HERO_ACTION_KEYS = [
  "idle",
  "run",
  "jump",
  "fall",
  "attack",
  "ability",
  "hurt",
  "death",
  "ultimate",
];

const HERO_MOVING_ACTIONS = new Set(["run", "attack", "ability"]);

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

function defaultHeroActionFps(action) {
  return HERO_MOVING_ACTIONS.has(action) ? 8 : 3;
}

function ensureHeroMeta(heroId) {
  if (
    !HERO_SPRITE_META[heroId] ||
    typeof HERO_SPRITE_META[heroId] !== "object"
  ) {
    HERO_SPRITE_META[heroId] = {};
  }
  const meta = HERO_SPRITE_META[heroId];
  HERO_ACTION_KEYS.forEach((action) => {
    if (!meta[action] || typeof meta[action] !== "object") {
      meta[action] = {};
    }
  });
  return meta;
}

// Tune one hero animation set (all PNG actions) by arguments.
// Example:
// tuneHeroActions("ninja", { allSpeedScale: 0.9, actionSpeedScale: { attack: 0.8 }, fps: { run: 10 } });
export function tuneHeroActions(heroId, tuning = {}) {
  const key = String(heroId || "").trim();
  if (!key || !HERO_SPRITES[key]) return null;

  const meta = ensureHeroMeta(key);
  const allSpeedScale = clamp(toFinite(tuning.allSpeedScale, 1), 0.1, 4);
  const actionSpeedScale =
    tuning.actionSpeedScale && typeof tuning.actionSpeedScale === "object"
      ? tuning.actionSpeedScale
      : {};
  const fpsOverrides =
    tuning.fps && typeof tuning.fps === "object" ? tuning.fps : {};
  const frameCountOverrides =
    tuning.frameCount && typeof tuning.frameCount === "object"
      ? tuning.frameCount
      : {};

  HERO_ACTION_KEYS.forEach((action) => {
    const actionScale = clamp(toFinite(actionSpeedScale[action], 1), 0.1, 4);
    const currentFps = toFinite(meta[action].fps, defaultHeroActionFps(action));
    let nextFps = round3(
      clamp(currentFps * allSpeedScale * actionScale, 1, 30),
    );
    if (Number.isFinite(Number(fpsOverrides[action]))) {
      nextFps = round3(clamp(Number(fpsOverrides[action]), 1, 30));
    }
    meta[action].fps = nextFps;

    if (Number.isFinite(Number(frameCountOverrides[action]))) {
      meta[action].frameCount = Math.max(
        1,
        Math.round(Number(frameCountOverrides[action])),
      );
    }
  });

  return meta;
}

export function tuneAllHeroActions(tuning = {}) {
  const touched = [];
  Object.keys(HERO_SPRITES).forEach((heroId) => {
    const next = tuneHeroActions(heroId, tuning);
    if (next) touched.push(heroId);
  });
  return touched;
}

const ENEMY_SPRITE_IDS = [
  "iceSlime",
  "iceCrab",
  "fishScout",
  "jellyBomber",
  "coralShooter",
  "sandWorm",
  "crabSnapper",
  "skeletonWarrior",
  "ghostWailer",
  "zombieGrabber",
  "frostGiant",
  "eliteWaterGuard",
  "sandGolem",
  "necromancer",
  "coralHydra",
  "beachSerpentMini",
  "shadowWraithMini",
  "spikedSkull",
];

export const ENEMY_SPRITES = Object.fromEntries(
  ENEMY_SPRITE_IDS.map((id) => [
    id,
    {
      idle: `assets/sprites/enemies/${id}/idle.png`,
      attack: `assets/sprites/enemies/${id}/attack.png`,
      hurt: `assets/sprites/enemies/${id}/hurt.png`,
      death: `assets/sprites/enemies/${id}/death.png`,
    },
  ]),
);

const REAL_ENEMY_VARIANTS = [
  {
    key: "golden",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/voidlings/webp/Golden_spirit_walking_ycsgx8.webp",
    frameCount: 4,
    fps: 7,
  },
  {
    key: "grin",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/voidlings/webp/Grinning_Horn_walking_vdkau3.webp",
    frameCount: 5,
    fps: 8,
  },
  {
    key: "plague",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/voidlings/webp/Plague_Mask_floating_gnxww7.webp",
    frameCount: 7,
    fps: 8,
  },
  {
    key: "red",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/voidlings/webp/Red_Wraith_floating_teaw1o.webp",
    frameCount: 7,
    fps: 8,
  },
  {
    key: "spiked",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/voidlings/webp/Spiked_Skull_flying_x1rrlo.webp",
    frameCount: 4,
    fps: 7,
  },
];

const REAL_ENEMY_VARIANT_BY_TYPE = {
  skeletonWarrior: "golden",
  ghostWailer: "plague",
  zombieGrabber: "red",
  necromancer: "grin",
  shadowWraithMini: "grin",
  spikedSkull: "spiked",
};

function buildVariantSet(path) {
  return {
    idle: path,
    attack: path,
    hurt: path,
    death: path,
    alt: path,
  };
}

export const ENEMY_SPRITE_META = {};

const REAL_ENEMY_VARIANTS_BY_KEY = Object.fromEntries(
  REAL_ENEMY_VARIANTS.map((variant) => [variant.key, variant]),
);
const REAL_ENEMY_FALLBACK_VARIANTS = REAL_ENEMY_VARIANTS.filter(
  (variant) => variant.key !== "spiked",
);

// Seed/API runtime codes like "golden" and "grin" spawn directly in gameplay,
// so they need their own sprite keys in addition to the legacy mapped ids.
REAL_ENEMY_VARIANTS.forEach((variant) => {
  ENEMY_SPRITES[variant.key] = buildVariantSet(variant.path);
  ENEMY_SPRITE_META[variant.key] = {
    frameCount: variant.frameCount,
    fps: variant.fps,
  };
});

// Use the exact 5 provided real enemy sheets. Grave level enemy types are pinned to 5 unique variants.
let fallbackVariantIndex = 0;
ENEMY_SPRITE_IDS.forEach((id) => {
  const forcedKey = REAL_ENEMY_VARIANT_BY_TYPE[id];
  const variant = forcedKey
    ? REAL_ENEMY_VARIANTS_BY_KEY[forcedKey]
    : REAL_ENEMY_FALLBACK_VARIANTS[
        fallbackVariantIndex++ % REAL_ENEMY_FALLBACK_VARIANTS.length
      ];
  ENEMY_SPRITES[id] = buildVariantSet(variant.path);
  ENEMY_SPRITE_META[id] = { frameCount: variant.frameCount, fps: variant.fps };
});

// Water-world enemy overrides use user-provided sheets.
const WATER_ENEMY_SHEETS = {
  fishScout: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/marine/webp/seahorse_r7gecs.webp",
    frameCount: 6,
    fps: 7,
  },
  jellyBomber: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/marine/webp/octopus_ayaux4.webp",
    frameCount: 5,
    fps: 6,
  },
  coralShooter: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/marine/webp/redfish_splpww.webp",
    frameCount: 4,
    fps: 7,
  },
  eliteWaterGuard: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/marine/webp/pirana_deoln3.webp",
    frameCount: 6,
    fps: 7,
  },
  coralHydra: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/marine/webp/crab_fqwtpr.webp",
    frameCount: 5,
    fps: 6,
  },
};

Object.entries(WATER_ENEMY_SHEETS).forEach(([id, sheet]) => {
  ENEMY_SPRITES[id] = buildVariantSet(sheet.path);
  ENEMY_SPRITE_META[id] = {
    frameCount: sheet.frameCount,
    fps: sheet.fps,
  };
});

const BOSS_SPRITE_IDS = ["iceTitan", "crabBoss", "necroKing", "sandBoss"];

/** @type {Record<string, { idle: string; attack1: string; attack2: string; hurt: string; death: string; special: string; walk2?: string; hurt2?: string; skullFall?: string; death1?: string; rebirth?: string; childWalk?: string; childAttack?: string; childHurt?: string; childDeath?: string }>} */
export const BOSS_SPRITES = Object.fromEntries(
  BOSS_SPRITE_IDS.map((id) => [
    id,
    {
      idle: `assets/sprites/bosses/${id}/idle.png`,
      attack1: `assets/sprites/bosses/${id}/attack1.png`,
      attack2: `assets/sprites/bosses/${id}/attack2.png`,
      hurt: `assets/sprites/bosses/${id}/hurt.png`,
      death: `assets/sprites/bosses/${id}/death.png`,
      special: `assets/sprites/bosses/${id}/special.png`,
    },
  ]),
);

export const BOSS_PROJECTILE_SPRITES = {
  iceTitan: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/ice_spikes_bykktv.webp",
    scale: 2.35,
    frameCount: 5,
    fps: 12,
    loop: false,
  },
  crabBoss: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/crab-boss/webp/eel_energy_ball_powjog.webp",
    scale: 1.8,
  },
  sandBoss: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/sand/webp/attack_qvawaz.webp",
    scale: 1.8,
  },
  necroKing: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/fire-skull_bouncing_z8vzub.webp",
    scale: 1.1,
    frameCount: 7,
    fps: 12,
  },
  necroKingSkyFire: {
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/skull_fall_ucvppm.webp",
    scale: 1.8,
  },
};

// Boss-specific sheet remaps for sets that do not use the default file names.
BOSS_SPRITES.iceTitan.idle =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/ice_titan_walk_h9paqy.webp";
BOSS_SPRITES.iceTitan.attack1 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/ice_titan_attack_p2iihh.webp";
BOSS_SPRITES.iceTitan.attack2 = BOSS_SPRITES.iceTitan.attack1;
BOSS_SPRITES.iceTitan.hurt =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/ice_titan_hurt_wsk7fz.webp";
BOSS_SPRITES.iceTitan.special = BOSS_SPRITES.iceTitan.attack1;
BOSS_SPRITES.iceTitan.death =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/ice_titan_death_i3dvzu.webp";
BOSS_SPRITES.iceTitan.rebirth =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/baby_ice_rebirth_e4sysb.webp";
BOSS_SPRITES.iceTitan.childWalk =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/baby_ice_walk_gboysw.webp";
BOSS_SPRITES.iceTitan.childAttack =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/baby_ice_attack_ogunqg.webp";
BOSS_SPRITES.iceTitan.childHurt =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/baby_ice_hurt_idni1g.webp";
BOSS_SPRITES.iceTitan.childDeath =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/frost-boss/webp/baby_ice_death_eej0ao.webp";

BOSS_SPRITES.crabBoss.idle =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/crab-boss/webp/crab_walk_rmpzrp.webp";
BOSS_SPRITES.crabBoss.attack1 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/crab-boss/webp/crab_attack_frq7h5.webp";
BOSS_SPRITES.crabBoss.attack2 = BOSS_SPRITES.crabBoss.attack1;
BOSS_SPRITES.crabBoss.hurt =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/crab-boss/webp/crab_hurt_rgqbiw.webp";
BOSS_SPRITES.crabBoss.death =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/crab-boss/webp/crab_dead_fvmwyx.webp";
BOSS_SPRITES.crabBoss.special = BOSS_SPRITES.crabBoss.attack1;

// Beach boss (sand) – CDN sprite URLs.
BOSS_SPRITES.sandBoss.idle =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/sand/webp/sand_walk_calmdg.webp";
BOSS_SPRITES.sandBoss.attack1 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/sand/webp/sand_attack_s9wjlr.webp";
BOSS_SPRITES.sandBoss.attack2 = BOSS_SPRITES.sandBoss.attack1;
BOSS_SPRITES.sandBoss.hurt =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/sand/webp/sand_hurt_w0c029.webp";
BOSS_SPRITES.sandBoss.death =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/sand/webp/sand_death_uryani.webp";
BOSS_SPRITES.sandBoss.special = BOSS_SPRITES.sandBoss.attack1;

// Graveyard boss (witch) – CDN sprite URLs.
BOSS_SPRITES.necroKing.idle =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/1-witch-walk_tp3hcw.webp";
BOSS_SPRITES.necroKing.walk2 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/2-witch-walk_rfx9dd.webp";
BOSS_SPRITES.necroKing.attack1 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/1-witch-attack1_eqtiw0.webp";
BOSS_SPRITES.necroKing.attack2 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/2-witch-hurt_mzihnv.webp";
BOSS_SPRITES.necroKing.hurt =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/1-witch-hurt_tcesq0.webp";
BOSS_SPRITES.necroKing.hurt2 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/2-witch-hurt_mzihnv.webp";
BOSS_SPRITES.necroKing.death =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/2-witch_death_yufqai.webp";
BOSS_SPRITES.necroKing.death1 =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/1-witch_die_nqdim0.webp";
BOSS_SPRITES.necroKing.special = BOSS_SPRITES.necroKing.walk2;
BOSS_SPRITES.necroKing.skullFall =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/boss/witch-boss/webp/skull_fall_ucvppm.webp";

// Allow boss keys to render correctly when used in editor enemy layer.
BOSS_SPRITE_IDS.forEach((id) => {
  ENEMY_SPRITES[id] = {
    idle: BOSS_SPRITES[id].idle,
    attack: BOSS_SPRITES[id].attack1 || BOSS_SPRITES[id].idle,
    hurt: BOSS_SPRITES[id].hurt || BOSS_SPRITES[id].idle,
    death: BOSS_SPRITES[id].death || BOSS_SPRITES[id].idle,
    alt: BOSS_SPRITES[id].special || BOSS_SPRITES[id].idle,
  };
});

export const BOSS_SPRITE_META = {
  iceTitan: {
    idle: { frameCount: 5, fps: 6 },
    attack1: { frameCount: 4, fps: 8 },
    attack2: { frameCount: 4, fps: 8 },
    special: { frameCount: 4, fps: 8 },
    hurt: { frameCount: 8, fps: 7 },
    rebirth: { frameCount: 2, fps: 6 },
    childWalk: { frameCount: 5, fps: 6 },
    childAttack: { frameCount: 4, fps: 8 },
    childHurt: { frameCount: 2, fps: 6 },
    childDeath: { frameCount: 4, fps: 5 },
    death: { frameCount: 5, fps: 1.2 },
  },
  crabBoss: {
    idle: { frameCount: 5, fps: 6 },
    attack1: { frameCount: 7, fps: 8 },
    attack2: { frameCount: 7, fps: 8 },
    special: { frameCount: 7, fps: 8 },
    hurt: { frameCount: 2, fps: 6 },
    death: { frameCount: 5, fps: 5 },
  },
  sandBoss: {
    idle: { frameCount: 5, fps: 6 },
    attack1: { frameCount: 5, fps: 8 },
    attack2: { frameCount: 5, fps: 8 },
    special: { frameCount: 5, fps: 8 },
    hurt: { frameCount: 2, fps: 6 },
    death: { frameCount: 3, fps: 3 },
  },
  necroKing: {
    idle: { frameCount: 7, fps: 6 },
    walk2: { frameCount: 6, fps: 7 },
    attack1: { frameCount: 8, fps: 8 },
    attack2: { frameCount: 7, fps: 6 },
    hurt: { frameCount: 8, fps: 6 },
    hurt2: { frameCount: 7, fps: 6 },
    death: { frameCount: 4, fps: 5 },
    death1: { frameCount: 5, fps: 5 },
    skullFall: { frameCount: 10, fps: 12 },
  },
};

export const UI_IMAGES = {
  hearts:
    "https://ik.imagekit.io/6rsuaxauw/Frame%20307.webp",
  axocoin: "https://ik.imagekit.io/6rsuaxauw/grok-image-f3ff8b55-c0fe-46fa-a0c7-fdbe20d61c6d%201%203.webp",
  axocoinRelic: "https://ik.imagekit.io/6rsuaxauw/grok-image-f3ff8b55-c0fe-46fa-a0c7-fdbe20d61c6d%201%203.webp",

  throwShuriken:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/enemies/shuriken/webp/shuriken_hu819j.webp",
  gameOverBg:
    "https://ik.imagekit.io/6rsuaxauw/axo%20quest%20main%20menu/axo%20quest%20banner%201%201%201.webp?updatedAt=1778170517895",
};

export const HERO_PORTRAITS = {
  ninja: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axo_ninja_olg2gr.webp",
  
};

// Backward compatibility aliases for legacy ids.
HERO_PORTRAITS.axolittle = HERO_PORTRAITS.ninja;
HERO_PORTRAITS.pudge = HERO_PORTRAITS.ninja;
HERO_PORTRAITS.seal = HERO_PORTRAITS.ninja;

export const SFX = {
  coin: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/coin_collected_rkqfid.m4a",
  jump: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/jump_1_endf80.m4a",
  blade:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/ninja_blade_1_pgyeua.m4a",
  graveBossEntry:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/graveyard-bossentry_xeuz96.m4a",
  stageComplete:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/stage-completion_hvmwtx.mp4",
  victory:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/victory_1_aci7gr.m4a",
  heroDeath:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/death_yovt3c.mp4",
  scream:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/scream_1_vrflh4.m4a",
};

function addPath(paths, path) {
  const normalized = String(path || "").trim();
  if (normalized) paths.add(normalized);
}

function addPaths(paths, values) {
  if (!Array.isArray(values)) return;
  values.forEach((value) => addPath(paths, value));
}

function addObjectValues(paths, obj) {
  if (!obj || typeof obj !== "object") return;
  Object.values(obj).forEach((value) => addPath(paths, value));
}

function addWorldPaths(paths, worldKey) {
  const key = String(worldKey || "")
    .trim()
    .toLowerCase();
  if (!key) return;
  const worldVisual = WORLD_VISUALS[key];
  if (!worldVisual) return;
  addObjectValues(paths, worldVisual.tileTextures);
  addObjectValues(paths, worldVisual.variants);
  (worldVisual.decorations || []).forEach((entry) =>
    addPath(paths, entry?.path),
  );
}

function resolveBossAssetKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const compact = raw.replace(/[\s_-]+/g, "").toLowerCase();
  const alias = {
    icetitan: "iceTitan",
    crabboss: "crabBoss",
    gravewitch: "necroKing",
    sandboss: "sandBoss",
  };
  return alias[compact] || raw;
}

function resolveAssetSetEntry(collection, value) {
  const raw = String(value || "").trim();
  if (!raw || !collection || typeof collection !== "object") return null;
  if (collection[raw]) return collection[raw];
  const lower = raw.toLowerCase();
  const match = Object.keys(collection).find(
    (key) => key.toLowerCase() === lower,
  );
  return match ? collection[match] : null;
}

function pathExtension(path) {
  const src = String(path || "")
    .trim()
    .toLowerCase();
  const dotIndex = src.lastIndexOf(".");
  return dotIndex >= 0 ? src.slice(dotIndex) : "";
}

function assetTypeForPath(path) {
  const ext = pathExtension(path);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "";
}

function assetLoadKey(path) {
  const publicPath = toPublicAssetPath(path);
  return (
    toAssetCacheKey(path) || toAssetCacheKey(publicPath) || publicPath || path
  );
}

function getCachedAsset(map, path) {
  const publicPath = toPublicAssetPath(path);
  const sourceCacheKey = toAssetCacheKey(path);
  const publicCacheKey = toAssetCacheKey(publicPath);
  return (
    map.get(path) ||
    map.get(publicPath) ||
    map.get(sourceCacheKey) ||
    map.get(publicCacheKey) ||
    null
  );
}

function cacheAssetVariants(map, path, asset) {
  const publicPath = toPublicAssetPath(path);
  const sourceCacheKey = toAssetCacheKey(path);
  const publicCacheKey = toAssetCacheKey(publicPath);
  map.set(path, asset);
  if (publicPath) map.set(publicPath, asset);
  if (sourceCacheKey) map.set(sourceCacheKey, asset);
  if (publicCacheKey) map.set(publicCacheKey, asset);
  return asset;
}

function createFallbackImage() {
  const fallback = document.createElement("canvas");
  fallback.width = 64;
  fallback.height = 64;
  const ctx = fallback.getContext("2d");
  ctx.fillStyle = "#ff00aa";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 60, 60);
  return fallback;
}

async function loadAssetPath(path) {
  const type = assetTypeForPath(path);
  if (!type) return null;

  const targetMap = type === "image" ? assets.images : assets.audio;
  const pendingMap =
    type === "image" ? pendingAssetLoads.images : pendingAssetLoads.audio;
  const cached = getCachedAsset(targetMap, path);
  if (cached) return cached;

  const loadKey = assetLoadKey(path);
  if (pendingMap.has(loadKey)) {
    return pendingMap.get(loadKey);
  }

  const job =
    type === "image"
      ? loadImage(path)
          .then((img) => cacheAssetVariants(targetMap, path, img))
          .catch(() =>
            cacheAssetVariants(targetMap, path, createFallbackImage()),
          )
      : loadAudio(path)
          .then((audio) => cacheAssetVariants(targetMap, path, audio))
          .catch(() => null);

  pendingMap.set(loadKey, job);
  try {
    return await job;
  } finally {
    pendingMap.delete(loadKey);
  }
}

function toUniquePaths(paths = []) {
  const unique = new Set();
  (paths || []).forEach((path) => addPath(unique, path));
  return [...unique];
}

export function getBootAssetPaths() {
  const paths = new Set();
  addPath(paths, UI_IMAGES.mainScreenBg);
  addPath(paths, UI_IMAGES.axocoin);
  addObjectValues(paths, HERO_PORTRAITS);
  addPath(paths, SFX.uiClick);
  addPath(paths, SFX.coin);
  return [...paths];
}

export function getLevelAssetPaths(levelAsset = {}) {
  const levelId = Number(levelAsset?.levelId ?? levelAsset?.id);
  const manifestLevel = Number.isFinite(levelId)
    ? LEVEL_ASSETS[levelId] || {}
    : {};
  const resolvedLevelAsset = {
    ...manifestLevel,
    ...levelAsset,
  };
  const paths = new Set();
  const heroId = String(resolvedLevelAsset.heroId || "ninja")
    .trim()
    .toLowerCase();
  const heroSprites =
    resolveAssetSetEntry(HERO_SPRITES, heroId) || HERO_SPRITES.ninja;
  const heroPortrait = HERO_PORTRAITS[heroId] || HERO_PORTRAITS.ninja;
  const bossId = resolveBossAssetKey(
    resolvedLevelAsset.boss || resolvedLevelAsset.bossCode,
  );
  const enemyEntries = Array.isArray(resolvedLevelAsset.enemies)
    ? resolvedLevelAsset.enemies
    : [];

  addPaths(paths, resolvedLevelAsset.parallax);
  addPaths(paths, resolvedLevelAsset.backgroundSprites);
  addPath(paths, resolvedLevelAsset.dayNightTransition?.overlay);
  addPath(paths, resolvedLevelAsset.music);
  addWorldPaths(paths, resolvedLevelAsset.world || manifestLevel.world);
  addObjectValues(paths, heroSprites);
  addPath(paths, heroPortrait);
  addObjectValues(paths, UI_IMAGES);

  enemyEntries.forEach((entry) => {
    const enemyId =
      typeof entry === "string"
        ? entry
        : String(entry?.enemyCode || entry?.type || "").trim();
    addObjectValues(paths, resolveAssetSetEntry(ENEMY_SPRITES, enemyId));
  });

  addObjectValues(paths, resolveAssetSetEntry(BOSS_SPRITES, bossId));
  Object.entries(BOSS_PROJECTILE_SPRITES).forEach(([key, entry]) => {
    if (!bossId) return;
    if (key !== bossId && !key.startsWith(`${bossId}`)) return;
    const path =
      typeof entry === "string"
        ? entry
        : typeof entry?.path === "string"
          ? entry.path
          : "";
    addPath(paths, path);
  });

  addPaths(paths, [
    SFX.coin,
    SFX.jump,
    SFX.blade,
    SFX.heroDeath,
    SFX.stageComplete,
    SFX.victory,
  ]);
  if (bossId === "necroKing") {
    addPaths(paths, [SFX.graveBossEntry, SFX.scream]);
  }

  return [...paths];
}

function uniquePathsFromManifest() {
  const paths = new Set();

  Object.values(LEVEL_ASSETS).forEach((l) => {
    l.parallax.forEach((p) => paths.add(p));
    (l.backgroundSprites || []).forEach((p) => paths.add(p));
    paths.add(l.music);
  });

  Object.values(HERO_SPRITES).forEach((set) =>
    Object.values(set).forEach((p) => paths.add(p)),
  );
  Object.values(ENEMY_SPRITES).forEach((set) =>
    Object.values(set).forEach((p) => paths.add(p)),
  );
  Object.values(BOSS_SPRITES).forEach((set) =>
    Object.values(set).forEach((p) => paths.add(p)),
  );
  Object.values(BOSS_PROJECTILE_SPRITES).forEach((entry) => {
    const path =
      typeof entry === "string"
        ? entry
        : typeof entry?.path === "string"
          ? entry.path
          : "";
    if (path) paths.add(path);
  });
  Object.values(UI_IMAGES).forEach((p) => paths.add(p));
  Object.values(HERO_PORTRAITS).forEach((p) => paths.add(p));
  Object.values(SFX).forEach((p) => paths.add(p));
  collectWorldVisualPaths().forEach((p) => paths.add(p));

  return [...paths];
}

export async function preloadAllAssets() {
  return preloadPaths(uniquePathsFromManifest());
}

export async function preloadPaths(paths = []) {
  const jobs = toUniquePaths(paths)
    .map((path) => loadAssetPath(path))
    .filter(Boolean);
  await Promise.all(jobs);
  return assets;
}

export function getImage(path) {
  return getCachedAsset(assets.images, path);
}

export function getAudio(path) {
  const base = getCachedAsset(assets.audio, path);
  if (!base) return null;
  // Reuse preloaded element when idle to minimize MP3 start latency.
  if (base.paused || base.ended) {
    return configureAudioElement(base);
  }
  const src = base.currentSrc || base.src || toPublicAssetPath(path);
  const clone = configureAudioElement(new Audio(src));
  clone.load();
  return clone;
}
