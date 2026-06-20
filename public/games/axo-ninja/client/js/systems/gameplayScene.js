import { CONST } from "../config/constants.js";
import { LEVEL_ASSETS, getLevelDisplayName } from "../config/levelAssets.js";
import {
  getFallbackCoinValue,
  getFallbackLevelConfig,
  getFallbackMaxTotalCoins,
  FALLBACK_BOSS_REWARDS,
} from "../config/levelFallbacks.js";
import {
  BOSS_PROJECTILE_SPRITES,
  SFX,
  UI_IMAGES,
  HERO_PORTRAITS,
  configureAudioElement,
  getAudio,
  getImage,
} from "../core/assets.js";
import { TileMap } from "../core/tilemap.js";
import { Camera } from "../core/camera.js";
import { ObjectPool } from "../core/pool.js";
import { Player } from "../entities/player.js";
import { Enemy } from "../entities/enemy.js";
import { Boss } from "../entities/boss.js";
import { Coin } from "../entities/coin.js";
import { Particle } from "../entities/particle.js";
import {
  rectsOverlap,
  distance,
  randomRange,
  clamp,
  compactInPlace,
} from "../utils/math.js";
import { directionToTarget, normalizeDirection } from "../utils/aiming.js";
import { TILE } from "../config/tileIds.js";
import { ENEMIES } from "../config/enemies.js";
import { WORLD_VISUALS } from "../config/worldVisuals.js";
import { normalizeLevelData } from "./levelNormalization.js";
import {
  ELEMENT,
  ELEMENT_COLOR,
  ELEMENT_SYMBOL,
  getElementMultiplier,
  getEntityElement,
  getElementSkinNames,
  getCorePassiveValue,
  resolveAttunement,
} from "../config/elements.js";
import { shouldUseReducedEffects } from "../utils/platform.js";

function levelPath(levelId) {
  const fileLevelId = Math.max(1, Math.floor(Number(levelId) || 1));
  const fileNameId = String(fileLevelId).padStart(2, "0");
  try {
    return new URL(`../../levels/level${fileNameId}.json`, import.meta.url)
      .href;
  } catch {
    return `client/levels/level${fileNameId}.json`;
  }
}

function toPx(tileCoord) {
  return tileCoord * CONST.GAME.TILE;
}

const POWER_LABEL = {
  skill: "Throw (SPACE)",
};
const HEART_DAMAGE = 100;
const BOSS_STOMP_DAMAGE = 45;
const FIXED_HERO_HEARTS = 5;
const DEFAULT_COLLECTIBLE_AXO_VALUE = getFallbackCoinValue(1);
const RESPAWN_DROP_DURATION_SEC = 2.1;
const RESPAWN_BRIEF_PROTECTION_SEC = 2.0;
const ENABLE_AUTO_GENERATED_SPAWNS = false;
const BOSS_ENTRY_UI_DURATION_SEC = 1.65;
const LEVEL_CLEAR_TRANSITION_SEC = 0.45;
const HERO_BOSS_DAMAGE_MULTIPLIER = 3;
const FINAL_LEVEL_CHEST_REWARD_AXO = 8000;
const FINAL_LEVEL_MAP_COLLECTIBLE_LIMIT = 400;
const FINAL_LEVEL_CHEST_LOCKED_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/chest_locked_1_pfkprz.webp";
const FINAL_LEVEL_CHEST_OPEN_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/cherst_opening_1_rkgbjw.webp";
const FINAL_LEVEL_CHEST_OPEN_FRAME_COUNT = 9;
const FINAL_LEVEL_CHEST_OPEN_HOLD_SEC = 1.25;
const FINAL_LEVEL_CHEST_OPEN_SCALE = 1.35;
const SPECIAL_OBJECT_SPRITES = {
  boss_flag:
    "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/flags/flag1.webp",
};
/** Fallback boss rewards when API level config is unavailable (matches seedGameConfig). */
const BOSS_AXO_COINS = FALLBACK_BOSS_REWARDS;
const BOSS_DAMAGE_TYPES = new Set([
  "iceTitan",
  "crabBoss",
  "necroKing",
  "sandBoss",
]);
const FINAL_LEVEL_ID = Math.max(
  ...Object.keys(LEVEL_ASSETS).map((id) => Number(id) || 0),
);
const HIDDEN_HEART_POP_OUT_DISTANCE_PX = Math.round(CONST.GAME.TILE * 0.8);
const HIDDEN_HEART_POP_OUT_DURATION_SEC = 0.28;
const HIDDEN_HEART_PICKUP_SIZE = 40;
const BOSS_ENTRY_NOTICE_TEXT = "GET READY";
const MOBILE_ZOOM_OUT = 1.7;
const TABLET_ZOOM_OUT = 1.34;
/** Shift camera up on mobile so more sky and less floor is visible (pixels). */
const MOBILE_SKY_VIEW_BIAS = 90;
const CHECKPOINT_STEP_TILES = 6;
const PARALLAX_SPRITESHEET_RATIO_THRESHOLD = 6;
const HERO_MOUTH_BUBBLE_MIN_INTERVAL_SEC = 0.16;
const HERO_MOUTH_BUBBLE_MAX_INTERVAL_SEC = 0.34;
const HERO_MOUTH_BUBBLE_MAX_ACTIVE = 6;
const CHECKPOINT_SAFE_GROUND = new Set([
  TILE.SOLID,
  TILE.ICE,
  TILE.BRICK,
  TILE.GIFT_BOX,
  TILE.ONE_WAY,
]);
const CHECKPOINT_HAZARDS = new Set([
  TILE.SPIKES,
  TILE.BARBED_WIRE,
  TILE.WATER,
  TILE.POISON,
]);
const BOSS_SOLID_TILES = new Set([
  TILE.SOLID,
  TILE.ICE,
  TILE.BRICK,
  TILE.GIFT_BOX,
]);
const BOSS_WORLD_BY_CODE = {
  iceTitan: "ice",
  crabBoss: "water",
  necroKing: "grave",
  sandBoss: "beach",
};
const ENEMY_CODE_BY_LOWER = Object.keys(ENEMIES).reduce((acc, key) => {
  acc[key.toLowerCase()] = key;
  return acc;
}, {});

function normalizeEnemyCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return ENEMY_CODE_BY_LOWER[raw.toLowerCase()] || raw;
}

function normalizeBossCode(value) {
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

function toNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function isBreakableRewardTile(tile) {
  return tile === TILE.BRICK || tile === TILE.GIFT_BOX || tile === TILE.ICE;
}

function isHiddenHeartExitTile(tile) {
  return (
    tile === TILE.EMPTY ||
    tile === TILE.ONE_WAY ||
    tile === TILE.WATER ||
    tile === TILE.POISON
  );
}

export class GameplayScene {
  constructor({
    ctx,
    canvas,
    input,
    audio,
    manifestCacheState = null,
    onLevelComplete,
    onRunEnd,
    onExitToMap,
    onGameOverRetry,
    onGameOverEnter = null,
    onRestartFromStart = null,
    attunementPreference = "default",
    hasFireUnlocked = false,
    permanentElementCore = null,
    veteranModeEnabled = false,
    startingHearts = FIXED_HERO_HEARTS,
    campaignCoinBase = 0,
    campaignRunCoinCarry = 0,
    serverLevelConfigById = {},
    serverHeroConfigByCode = {},
    onFireUnlock = null,
    onCoreClaim = null,
    onAxoCoinsCollected = null,
  }) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.input = input;
    this.audio = audio;
    this.manifestCacheState = manifestCacheState;
    this.onLevelComplete = onLevelComplete;
    this.onRunEnd = onRunEnd;
    this.onExitToMap = onExitToMap;
    this.onGameOverRetry = onGameOverRetry;
    this.onGameOverEnter = onGameOverEnter;
    this.onRestartFromStart = onRestartFromStart;
    this.onFireUnlock = onFireUnlock;
    this.onCoreClaim = onCoreClaim;
    this.onAxoCoinsCollected = onAxoCoinsCollected;

    this.camera = new Camera(
      canvas._logicalWidth ?? canvas.width,
      canvas._logicalHeight ?? canvas.height,
    );

    const bodyMarkedReduced =
      typeof document !== "undefined" &&
      document.body?.classList?.contains("ios-performance-mode");
    this.reducedEffectsMode =
      shouldUseReducedEffects() || Boolean(bodyMarkedReduced);
    this.enemyPool = new ObjectPool(() => new Enemy(), 64);
    this.coinPool = new ObjectPool(() => new Coin(), 256);
    this.particlePool = new ObjectPool(
      () => new Particle(),
      this.reducedEffectsMode ? 96 : 512,
    );

    this.zoneEffects = [];
    this.telegraphs = [];
    this.coinPickupTexts = [];
    this.heroProjectiles = [];
    this.bossProjectiles = [];

    this.player = null;
    this.boss = new Boss();
    this.map = null;
    this.levelData = null;

    this.levelId = 1;
    this.heroId = "ninja";
    this.profile = null;
    this.currentElement = ELEMENT.WATER;
    this.attunementPreference = attunementPreference;
    this.hasFireUnlocked = hasFireUnlocked;
    this.permanentElementCore = permanentElementCore || null;
    this.veteranModeEnabled = Boolean(veteranModeEnabled);
    this.startingHearts = clamp(
      Math.floor(Number(startingHearts) || FIXED_HERO_HEARTS),
      1,
      FIXED_HERO_HEARTS,
    );
    this.serverLevelConfigById = serverLevelConfigById || {};
    this.serverHeroConfigByCode = serverHeroConfigByCode || {};
    this.campaignCoinBase = Math.max(
      0,
      Math.floor(Number(campaignCoinBase) || 0),
    );
    this.displayCoinCarry = Math.max(
      0,
      Math.floor(Number(campaignRunCoinCarry) || 0),
    );
    this.elementSkinNames = null;
    this.currentLevelConfig = null;
    this.currentLevelEnemyConfigByType = {};
    this.currentLevelEnemyConfigList = [];
    this.currentHeroConfig = null;
    this.heroMaxHearts = FIXED_HERO_HEARTS;
    this.levelCoinValue = DEFAULT_COLLECTIBLE_AXO_VALUE;
    this.levelBossReward = 0;
    this.useApiBossConfig = true;
    this.enemyConfigWarnings = new Set();

    this.levelRunTime = 0;
    this.timeRemaining = 0;
    this.runCoins = 0; // backend commit coin (AxoCoin)
    this.runAxoCoins = 0;
    this.collectedCoinCount = 0;
    this.enemyKills = {};
    this.levelCoinCap = getFallbackMaxTotalCoins(1);
    this.levelEnemyCap = 60;

    this.arenaLocked = false;
    this.arenaRectPx = null;
    this.bossDefeated = false;
    this.levelCompleteSent = false;
    this.iceRebirthChildrenRemaining = 0;

    this.restarting = false;
    this.respawnPending = false;
    this.respawnTimer = 0;
    this.respawnDelaySec = 0.85;
    this.checkpointPx = null;
    this.checkpointStepPx = toPx(CHECKPOINT_STEP_TILES);
    this.showPause = false;
    this.gameOverActive = false;
    this.gameOverStats = null;
    this.musicButtonRect = null;
    this.gameOverRetryButtonRect = null;
    this.gameOverMenuButtonRect = null;
    this.enemiesDefeated = 0;
    this.runEndReported = false;

    this.initialEnemySpawn = [];
    this.initialCoinSpawn = [];
    this.initialAxoCoinSpawn = [];
    this.initialHeartSpawn = [];
    this.reservedRunCoinSpawns = [];
    this.reservedAxoCoinSpawns = [];
    this.initialBossSpawn = null;

    this.combatChallenges = [];
    this.activeCombatChallenge = null;
    this.timedCoinRooms = [];
    this.secretRoutes = [];
    this.brickPuzzle = null;
    this.highRiskSpawned = false;
    this.coreClaimThisRun = null;
    this.activeRelicCategories = new Set();
    this.powerUnlockOrder = ["skill"];
    this.powerNotice = null;
    this.powerHintCooldown = 0;
    this.relicSeals = 0;
    this.relicSealsRequired = 3;
    this.bossGateUnlocked = true;
    this.bossGateHintCooldown = 0;
    this.killCombo = 0;
    this.comboTimer = 0;
    this.bossIntroTimer = 0;
    this.bossIntroTitle = "";
    this.levelClearPending = false;
    this.levelClearTimer = 0;
    this.levelClearPayload = null;
    this.finalLevelChest = null;
    this.heroMouthBubbleTimer = 0;
    this.ambientBubbles = [];
    this.ambientBubbleSpawnTimer = 0;
    this.ambientSnowflakes = [];
    this.ambientSnowSpawnTimer = 0;
    this.maxAmbientBubbles = this.reducedEffectsMode ? 10 : 44;
    this.maxAmbientSnowflakes = this.reducedEffectsMode ? 16 : 80;
    this.iceNightTransitionAlpha = 0;
    this.iceNightLocked = false;
    this.hiddenHeartBrickKeys = new Set();
    this.dynamicCoinDrops = false;
    this.objectManifestLoaded = false;
    this.objectManifestLoading = false;
    this.objectSpriteByType = new Map();
    this.objectSpriteStates = new Map();
    this.cactusHazards = [];

    this.isEditorMode = false;
    this.currentLayer = "tiles";
    this.showGrid = true;
    this.history = [];
    this.redoStack = [];
    this.camera.zoom = 1;
    // The editor runtime (~135KB module) is lazy-loaded on the first editor
    // toggle request, so normal players never pay its parse/compile cost.
    this.editorRuntime = null;
    this.editorRuntimePromise = null;
    this.onEditorBootstrapKeyDown = (e) => this.handleEditorBootstrapKey(e);
    document.addEventListener("keydown", this.onEditorBootstrapKeyDown);
  }

  isEditorAvailable() {
    const env =
      window.__AXO_ENV__ && typeof window.__AXO_ENV__ === "object"
        ? window.__AXO_ENV__
        : {};
    return Boolean(env.EDITOR_DEV_MODE && env.EDITOR_ENABLED);
  }

  handleEditorBootstrapKey(e) {
    const isToggleKey = e.code === "Backquote" || e.key === "`";
    if (!isToggleKey || e.repeat) return;
    if (!this.isEditorAvailable()) return;
    if (this.editorRuntimePromise) return;
    void this.ensureEditorRuntime().then((runtime) => {
      runtime?.requestEditorToggle();
    });
  }

  removeEditorBootstrapListener() {
    if (!this.onEditorBootstrapKeyDown) return;
    document.removeEventListener("keydown", this.onEditorBootstrapKeyDown);
    this.onEditorBootstrapKeyDown = null;
  }

  async ensureEditorRuntime() {
    if (this.editorRuntime) return this.editorRuntime;
    if (!this.editorRuntimePromise) {
      this.editorRuntimePromise = import("./levelEditorRuntime.js")
        .then(({ LevelEditorRuntime }) => {
          this.editorRuntime = new LevelEditorRuntime(this);
          // The runtime's own key listener handles the toggle from now on.
          this.removeEditorBootstrapListener();
          if (this.levelData) this.editorRuntime.onLevelLoaded();
          return this.editorRuntime;
        })
        .catch((error) => {
          this.editorRuntimePromise = null;
          console.error("Failed to load level editor runtime", error);
          return null;
        });
    }
    return this.editorRuntimePromise;
  }

  async start(levelId, heroId, profile) {
    this.levelId = levelId;
    this.heroId = heroId;
    this.profile = profile;
    const apiLevelConfig =
      this.serverLevelConfigById?.[this.levelId] ||
      getFallbackLevelConfig(this.levelId);
    this.currentLevelConfig = apiLevelConfig;
    const levelEnemyRuntimeConfig = this.buildLevelEnemyConfigByType(
      apiLevelConfig?.enemies,
    );
    this.currentLevelEnemyConfigByType = levelEnemyRuntimeConfig.byType;
    this.currentLevelEnemyConfigList = levelEnemyRuntimeConfig.list;
    const apiCoinValue = toNonNegativeInt(
      apiLevelConfig?.coinValue,
      DEFAULT_COLLECTIBLE_AXO_VALUE,
    );
    this.levelCoinValue =
      apiCoinValue > 0 ? apiCoinValue : DEFAULT_COLLECTIBLE_AXO_VALUE;
    this.levelBossReward = 0;
    const apiMaxTotalCoins = Number(apiLevelConfig?.maxTotalCoins);
    const apiEnemyMaxCount = Number(apiLevelConfig?.enemyMaxCount);
    this.levelCoinCap =
      Number.isFinite(apiMaxTotalCoins) && apiMaxTotalCoins > 0
        ? Math.floor(apiMaxTotalCoins)
        : getFallbackMaxTotalCoins(levelId);
    this.levelEnemyCap =
      Number.isFinite(apiEnemyMaxCount) && apiEnemyMaxCount > 0
        ? Math.floor(apiEnemyMaxCount)
        : 60;
    const response = await fetch(levelPath(levelId), { cache: "no-store" });
    const rawLevelData = await response.json();
    const levelPayload =
      rawLevelData && typeof rawLevelData === "object"
        ? { ...rawLevelData, id: levelId }
        : { id: levelId };
    this.levelData = normalizeLevelData(levelPayload, levelId);
    if (!this.levelData.name && apiLevelConfig?.levelName) {
      this.levelData.name = apiLevelConfig.levelName;
    }
    this.useApiBossConfig = this.isApiBossConfigCompatible(
      apiLevelConfig?.bossCode,
    );
    this.levelBossReward = this.useApiBossConfig
      ? toNonNegativeInt(apiLevelConfig?.bossReward, 0)
      : 0;
    void this.ensureObjectManifestLoaded();

    // Precompute static object-based hazards (e.g., beach cactus).
    this.cactusHazards = [];
    const objects = Array.isArray(this.levelData?.objects)
      ? this.levelData.objects
      : [];
    const tileSize = CONST.GAME.TILE;
    for (const entry of objects) {
      if (!entry || entry.type !== "beach_cactus") continue;
      const tx = Number(entry.x);
      const ty = Number(entry.y);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
      const px = tx * tileSize;
      const py = ty * tileSize;
      this.cactusHazards.push({
        x: px,
        y: py,
        w: tileSize,
        h: tileSize,
      });
    }

    this.map = TileMap.fromLevelData(this.levelData, CONST.GAME.TILE);

    const levelWidthPx = this.levelData.sizeTiles.w * CONST.GAME.TILE;
    const levelHeightPx = this.levelData.sizeTiles.h * CONST.GAME.TILE;
    this.camera.setWorldBounds(0, 0, levelWidthPx, levelHeightPx);

    const heroCode = String(heroId || "")
      .trim()
      .toLowerCase();
    this.currentHeroConfig = this.serverHeroConfigByCode?.[heroCode] || null;
    const configuredMaxHearts = toNonNegativeInt(
      this.currentHeroConfig?.maxHearts,
      FIXED_HERO_HEARTS,
    );
    const heroHearts =
      configuredMaxHearts > 0 ? configuredMaxHearts : FIXED_HERO_HEARTS;
    this.player = new Player(heroId, heroHearts, this.currentHeroConfig);
    this.heroId = this.player.heroId;
    this.heroMaxHearts = Math.max(
      1,
      toNonNegativeInt(this.player.maxHearts, FIXED_HERO_HEARTS),
    );

    this.currentElement = resolveAttunement({
      world: this.levelData.world,
      selected: this.attunementPreference,
      hasFireUnlocked: this.hasFireUnlocked,
    });
    this.elementSkinNames = getElementSkinNames(
      this.heroId,
      this.currentElement,
    );
    this.player.setAttunement(this.currentElement, this.levelData.world, {
      permanentCore: this.permanentElementCore,
      veteranModeEnabled: this.veteranModeEnabled,
    });

    this.initialEnemySpawn = [];
    this.initialCoinSpawn = [];
    this.initialAxoCoinSpawn = [];
    this.initialHeartSpawn = [];
    this.initialBossSpawn = null;

    this.captureInitialSpawns();
    this.resetRunState();
    this.editorRuntime?.onLevelLoaded();

    const levelAsset = LEVEL_ASSETS[this.levelId] || {};
    let track = getAudio(levelAsset.music);
    if (!track && levelAsset.music) {
      // Fallback when preload missed/failed a music file.
      track = configureAudioElement(
        new Audio(toPublicAssetPath(levelAsset.music)),
      );
      track.load();
    }
    if (track) {
      configureAudioElement(track);
      // Ensure level music always starts from the beginning on retry/restart.
      track.pause();
      track.currentTime = 0;
    }
    const startBgMusic = () => {
      if (!track) return;
      this.audio.crossfadeTo(track, 0.12);
    };
    const scheduleStart = () => {
      if (!track) return;
      if (track.readyState >= 2) {
        startBgMusic();
        return;
      }
      const onReady = () => {
        track.removeEventListener("canplaythrough", onReady);
        track.removeEventListener("error", onReady);
        startBgMusic();
      };
      track.addEventListener("canplaythrough", onReady, { once: true });
      track.addEventListener("error", onReady, { once: true });
      setTimeout(() => {
        track.removeEventListener("canplaythrough", onReady);
        track.removeEventListener("error", onReady);
        startBgMusic();
      }, 1200);
    };
    scheduleStart();
    setTimeout(() => {
      if (track && track.paused) startBgMusic();
    }, 400);
  }

  captureInitialSpawns() {
    const level = this.levelData;
    const baseEnemyList =
      Array.isArray(level?.enemies) && level.enemies.length > 0
        ? level.enemies
        : [
            ...(Array.isArray(level?.spawns?.enemies)
              ? level.spawns.enemies
              : []),
            ...(Array.isArray(level?.spawns?.elites)
              ? level.spawns.elites
              : []),
            ...(level?.spawns?.miniBoss ? [level.spawns.miniBoss] : []),
          ];
    const filteredEnemyList = baseEnemyList.filter(
      (entry) => !this.isEnemySpawnInWaterOrSpikes(entry),
    );
    this.initialEnemySpawn = this.buildResolvedEnemySpawnPlan(
      filteredEnemyList,
    ).map((entry) => ({ ...entry }));
    const objectCoinEntries = Array.isArray(level.objects)
      ? level.objects
          .filter((entry) => entry?.type === "coin")
          .map((entry) => ({ x: entry.x, y: entry.y }))
      : [];
    const objectHeartEntries = Array.isArray(level.objects)
      ? level.objects
          .filter((entry) => entry?.type === "heart")
          .map((entry) => ({ x: entry.x, y: entry.y }))
      : [];
    const runCoinSourceRaw =
      objectCoinEntries.length > 0 ? objectCoinEntries : level.coins || [];
    const runCoinSource =
      this.levelId >= FINAL_LEVEL_ID
        ? runCoinSourceRaw.slice(0, FINAL_LEVEL_MAP_COLLECTIBLE_LIMIT)
        : runCoinSourceRaw;
    const coinLayout =
      typeof this.designCoinLayout === "function"
        ? this.designCoinLayout(runCoinSource, level.axoCoins || [])
        : fallbackDesignCoinLayout(
            this.map,
            this.levelData,
            runCoinSource,
            level.axoCoins || [],
          );
    const designedCoins = coinLayout;
    this.initialCoinSpawn = designedCoins.initialRun;
    this.reservedRunCoinSpawns = designedCoins.reservedRun;
    this.initialAxoCoinSpawn = designedCoins.initialAxo;
    this.reservedAxoCoinSpawns = designedCoins.reservedAxo;
    this.initialHeartSpawn = objectHeartEntries;
    const localBossType = String(level.spawns?.boss?.type || "").trim();
    const apiBossCode = normalizeBossCode(this.currentLevelConfig?.bossCode);
    const shouldUseApiBossCode =
      Boolean(apiBossCode) && this.isApiBossConfigCompatible(apiBossCode);
    const levelWorld = String(level.world || "").trim();
    // Beach level always uses sand boss; never ice or other bosses.
    const resolvedBossType =
      levelWorld === "beach"
        ? "sandBoss"
        : shouldUseApiBossCode
          ? apiBossCode
          : localBossType;
    this.initialBossSpawn = level.spawns?.boss
      ? {
          ...level.spawns.boss,
          type: resolvedBossType,
        }
      : null;
  }

  buildLevelEnemyConfigByType(enemies) {
    const byType = {};
    if (!Array.isArray(enemies)) {
      return { byType, list: [] };
    }

    const mergedByType = new Map();
    for (const entry of enemies) {
      const enemyCode = normalizeEnemyCode(entry?.enemyCode);
      if (!enemyCode) continue;
      if (!ENEMIES[enemyCode]) {
        this.warnEnemyConfigOnce(
          `api-unknown:${enemyCode}`,
          `Ignoring API enemy config for unknown runtime type "${enemyCode}".`,
        );
        continue;
      }
      const previous = mergedByType.get(enemyCode) || {
        enemyCode,
        enemyName: String(entry?.enemyName || enemyCode).trim() || enemyCode,
        hp: toNonNegativeInt(entry?.hp, ENEMIES[enemyCode]?.hp || 0),
        damage: toNonNegativeInt(
          entry?.damage,
          ENEMIES[enemyCode]?.damage || 0,
        ),
        count: 0,
        reward: toNonNegativeInt(entry?.reward, ENEMIES[enemyCode]?.coins || 0),
      };
      previous.enemyName =
        String(entry?.enemyName || previous.enemyName || enemyCode).trim() ||
        enemyCode;
      previous.hp = toNonNegativeInt(entry?.hp, previous.hp);
      previous.damage = toNonNegativeInt(entry?.damage, previous.damage);
      previous.count += toNonNegativeInt(entry?.count, 0);
      previous.reward = toNonNegativeInt(entry?.reward, previous.reward);
      mergedByType.set(enemyCode, previous);
    }

    const list = [...mergedByType.values()];
    for (const normalized of list) {
      byType[normalized.enemyCode] = normalized;
      byType[normalized.enemyCode.toLowerCase()] = normalized;
    }

    return { byType, list };
  }

  applyRuntimeBossOverrides() {
    if (!this.boss?.active) return;
    if (!this.useApiBossConfig) return;
    const levelConfig = this.currentLevelConfig || {};
    const bossHp = toNonNegativeInt(levelConfig.bossHp, 0);
    if (bossHp > 0) {
      this.boss.maxHp = bossHp;
      this.boss.hp = bossHp;
    }
    const bossDamage = toNonNegativeInt(levelConfig.bossDamage, 0);
    if (bossDamage > 0 && this.boss.cfg && typeof this.boss.cfg === "object") {
      this.boss.cfg = {
        ...this.boss.cfg,
        baseDamage: bossDamage,
      };
    }
  }

  isApiBossConfigCompatible(apiBossCode) {
    const normalizedBossCode = normalizeBossCode(apiBossCode);
    if (!normalizedBossCode) return true;
    const bossWorld = BOSS_WORLD_BY_CODE[normalizedBossCode] || "";
    const levelWorld = String(this.levelData?.world || "")
      .trim()
      .toLowerCase();
    if (!bossWorld || !levelWorld) return true;
    return bossWorld === levelWorld;
  }

  getRuntimeEnemyReward(enemyType) {
    const normalizedKey = normalizeEnemyCode(enemyType);
    const key = normalizedKey.toLowerCase();
    if (!key) return null;
    const reward = Number(
      this.currentLevelEnemyConfigByType?.[normalizedKey]?.reward ??
        this.currentLevelEnemyConfigByType?.[key]?.reward,
    );
    if (!Number.isFinite(reward) || reward < 0) return null;
    return Math.floor(reward);
  }

  warnEnemyConfigOnce(key, message, details = null) {
    if (!key || this.enemyConfigWarnings.has(key)) return;
    this.enemyConfigWarnings.add(key);
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      if (details !== null && details !== undefined) {
        console.warn(`[enemy-config] ${message}`, details);
      } else {
        console.warn(`[enemy-config] ${message}`);
      }
    }
  }

  buildResolvedEnemySpawnPlan(spawnEntries) {
    const slots = Array.isArray(spawnEntries) ? spawnEntries : [];
    const normalizedSlots = [];
    for (const entry of slots) {
      if (!entry || typeof entry !== "object") continue;
      normalizedSlots.push({
        ...entry,
        type: normalizeEnemyCode(entry.type),
      });
    }

    const apiRoster = Array.isArray(this.currentLevelEnemyConfigList)
      ? this.currentLevelEnemyConfigList.filter(
          (entry) => toNonNegativeInt(entry?.count, 0) > 0,
        )
      : [];
    const hasApiRoster = apiRoster.length > 0;
    const accepted = [];

    if (!hasApiRoster) {
      for (const slot of normalizedSlots) {
        if (!slot.type || !ENEMIES[slot.type]) {
          this.warnEnemyConfigOnce(
            `local-unknown:${slot.type || "missing"}`,
            `Skipping local enemy spawn with unknown type "${slot.type || "missing"}".`,
            slot,
          );
          continue;
        }
        accepted.push(slot);
      }
    } else {
      // Local level JSON owns positions/types; API roster only validates and tunes those placed spawns.
      const localAvailableByType = new Map();
      for (const slot of normalizedSlots) {
        if (!slot.type || !ENEMIES[slot.type]) continue;
        localAvailableByType.set(
          slot.type,
          (localAvailableByType.get(slot.type) || 0) + 1,
        );
      }

      const remainingByType = new Map();
      for (const entry of apiRoster) {
        const enemyCode = normalizeEnemyCode(entry?.enemyCode);
        if (!enemyCode || !ENEMIES[enemyCode]) continue;
        const localAvailable = toNonNegativeInt(
          localAvailableByType.get(enemyCode),
          0,
        );
        const configuredCount = toNonNegativeInt(entry.count, 0);
        remainingByType.set(
          enemyCode,
          Math.min(configuredCount, localAvailable),
        );
      }

      for (const slot of normalizedSlots) {
        if (!slot.type || !ENEMIES[slot.type]) {
          this.warnEnemyConfigOnce(
            `slot-unknown:${slot.type || "missing"}`,
            `Local spawn slot uses unknown enemy type "${slot.type || "missing"}"; skipping that spawn.`,
            slot,
          );
          continue;
        }

        if (!remainingByType.has(slot.type)) {
          this.warnEnemyConfigOnce(
            `slot-extra-type:${this.levelId}:${slot.type}`,
            `Local spawn type "${slot.type}" is not part of the active API enemy roster for level ${this.levelId}; skipping that spawn.`,
          );
          continue;
        }

        const remaining = remainingByType.get(slot.type) || 0;
        if (remaining <= 0) {
          this.warnEnemyConfigOnce(
            `slot-overflow:${this.levelId}:${slot.type}`,
            `Local level layout has more "${slot.type}" spawns than the API level config allows; skipping overflow spawns.`,
          );
          continue;
        }

        accepted.push(slot);
        remainingByType.set(slot.type, remaining - 1);
      }

      let unresolvedEnemySlots = 0;
      for (const entry of apiRoster) {
        const remaining = remainingByType.get(entry.enemyCode) || 0;
        unresolvedEnemySlots += remaining;
      }

      if (unresolvedEnemySlots > 0) {
        this.warnEnemyConfigOnce(
          `missing-slots:${this.levelId}`,
          `API enemy roster still has ${unresolvedEnemySlots} unplaced spawn(s) after consuming the local level layout for level ${this.levelId}.`,
        );
      }
    }

    const enemyCap = Math.max(0, toNonNegativeInt(this.levelEnemyCap, 0));
    if (enemyCap > 0 && accepted.length > enemyCap) {
      this.warnEnemyConfigOnce(
        `enemy-cap:${this.levelId}`,
        `Resolved enemy spawn plan exceeds level enemy cap (${accepted.length}/${enemyCap}); truncating overflow spawns.`,
      );
      return accepted.slice(0, enemyCap);
    }
    return accepted;
  }

  resetRunState() {
    this.runEndReported = false;
    this.levelRunTime = 0;
    this.timeRemaining = this.levelData.timeLimitSec;
    this.runCoins = 0;
    this.runAxoCoins = 0;
    this.collectedCoinCount = 0;
    this.enemyKills = {};

    this.showPause = false;
    this.gameOverActive = false;
    this.gameOverStats = null;
    this.gameOverRetryButtonRect = null;
    this.gameOverMenuButtonRect = null;
    this.restarting = false;
    this.respawnPending = false;
    this.respawnTimer = 0;
    this.enemiesDefeated = 0;

    this.arenaLocked = false;
    this.bossDefeated = false;
    this.levelCompleteSent = false;
    this.iceRebirthChildrenRemaining = 0;

    this.zoneEffects = [];
    this.telegraphs = [];
    this.coinPickupTexts = [];
    this.heroProjectiles = [];
    this.bossProjectiles = [];
    this.combatChallenges = [];
    this.activeCombatChallenge = null;
    this.timedCoinRooms = [];
    this.secretRoutes = [];
    this.brickPuzzle = null;
    this.highRiskSpawned = false;
    this.coreClaimThisRun = null;
    this.activeRelicCategories.clear();
    this.powerNotice = null;
    this.powerHintCooldown = 0;
    this.relicSeals = 0;
    this.bossGateUnlocked = true;
    this.bossGateHintCooldown = 0;
    this.killCombo = 0;
    this.comboTimer = 0;
    this.bossIntroTimer = 0;
    this.bossIntroTitle = "";
    this.levelClearPending = false;
    this.levelClearTimer = 0;
    this.levelClearPayload = null;
    this.finalLevelChest = null;
    this.heroMouthBubbleTimer = 0;
    this.iceNightTransitionAlpha = 0;
    this.iceNightLocked = false;

    this.enemyPool.items.forEach((e) => {
      e.active = false;
    });
    this.coinPool.items.forEach((c) => {
      c.active = false;
    });
    this.particlePool.items.forEach((p) => {
      p.active = false;
    });

    this.map.brickRewardsUsed.clear();

    const start = this.levelData.playerStart;
    this.player.resetAt(toPx(start.x), toPx(start.y), this.heroMaxHearts);
    this.player.hp = clamp(
      this.startingHearts * HEART_DAMAGE,
      HEART_DAMAGE,
      this.player.maxHp,
    );
    this.checkpointStepPx = this.getCheckpointStepPxForCurrentLevel();
    this.resetCheckpointToStart();

    for (const e of this.initialEnemySpawn) {
      this.spawnEnemy(e.type, toPx(e.x), toPx(e.y));
    }

    for (const coin of this.initialCoinSpawn) {
      this.spawnCoin(toPx(coin.x) + 22, toPx(coin.y) + 22, 1, "axo");
    }

    for (const coin of this.initialAxoCoinSpawn) {
      this.spawnCoin(
        toPx(coin.x) + 22,
        toPx(coin.y) + 22,
        coin.value || 15,
        "axo",
      );
    }

    for (const heart of this.initialHeartSpawn) {
      const heartX =
        toPx(heart.x) + (CONST.GAME.TILE - HIDDEN_HEART_PICKUP_SIZE) * 0.5;
      const heartY =
        toPx(heart.y) + (CONST.GAME.TILE - HIDDEN_HEART_PICKUP_SIZE) * 0.5;
      this.spawnCoin(heartX, heartY, 1, "heart", 0, {
        w: HIDDEN_HEART_PICKUP_SIZE,
        h: HIDDEN_HEART_PICKUP_SIZE,
      });
    }

    if (this.initialBossSpawn) {
      this.boss.reset(
        this.initialBossSpawn.type,
        toPx(this.initialBossSpawn.x),
        toPx(this.initialBossSpawn.y),
      );
      this.applyRuntimeBossOverrides();
      this.boss.engaged = false;
    } else {
      this.boss.active = false;
    }

    const arena = this.levelData.bossArena;
    this.arenaRectPx = arena
      ? {
          x: toPx(arena.x),
          y: toPx(arena.y),
          w: toPx(arena.w),
          h: toPx(arena.h),
        }
      : null;

    if (this.boss.active && this.boss.type === "sandBoss") {
      this.placeSandBossOnFloor();
    }

    this.setupAdventureObjectives();
    this.setupHiddenHeartBricks();
    this.initAmbientBubbles();
    this.initAmbientSnow();
    this.showPowerNotice("Use your throwable power and defeat the boss.", 2.8);
  }

  restartFromStart() {
    this.showPause = false;
    // Bank the run's coins before restarting, same as the quit path,
    // so restarting never silently forfeits what was collected.
    this.reportRunEnd(false, "quit");
    if (typeof this.onRestartFromStart === "function") {
      this.onRestartFromStart();
      return;
    }
    this.resetRunState();
  }

  update(dt) {
    this.input.update();

    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const viewportClass = this.getViewportClass();
    if (viewportClass === "mobile" || viewportClass === "tablet") {
      const zoomOut =
        viewportClass === "tablet" ? TABLET_ZOOM_OUT : MOBILE_ZOOM_OUT;
      this.camera.viewWidth = vw * zoomOut;
      this.camera.viewHeight = vh * zoomOut;
    } else {
      this.camera.viewWidth = vw;
      this.camera.viewHeight = vh;
    }
    const worldW = Number(this.levelData?.sizeTiles?.w) * CONST.GAME.TILE;
    const worldH = Number(this.levelData?.sizeTiles?.h) * CONST.GAME.TILE;
    if (Number.isFinite(worldW) && worldW > 0) {
      this.camera.viewWidth = Math.min(this.camera.viewWidth, worldW);
    }
    if (Number.isFinite(worldH) && worldH > 0) {
      this.camera.viewHeight = Math.min(this.camera.viewHeight, worldH);
    }

    if (this.isEditorMode) {
      this.updateEditor(dt);
      this.input.endFrame();
      return;
    }

    if (this.gameOverActive) {
      this.handleGameOverInput();
      this.input.endFrame();
      return;
    }

    // Keyboard pause
    if (this.input.consume("pause")) {
      this.showPause = !this.showPause;
    }

    // Mouse/touch pause (HUD click)
    const p = this.input?.pointer;
    if (p && p.clicked) {
      const mx = p.x;
      const my = p.y;
      const r = this.pauseButtonRect;
      if (
        p.clicked &&
        r &&
        mx >= r.x &&
        mx <= r.x + r.w &&
        my >= r.y &&
        my <= r.y + r.h
      ) {
        this.showPause = !this.showPause;
      }
    }

    if (this.showPause) {
      if (this.input.consume("restart")) {
        this.restartFromStart();
        this.input.endFrame();
        return;
      }
      if (this.input.consume("back")) {
        this.showPause = false;
        this.reportRunEnd(false, "quit");
        if (typeof this.onExitToMap === "function") {
          this.onExitToMap();
        }
        this.input.endFrame();
        return;
      }
      if (this.input.consume("confirm")) {
        this.showPause = false;
      }
      const p = this.input?.pointer;
      if (p && p.clicked) {
        const mx = p.x;
        const my = p.y;
        const inRect = (rect) =>
          rect &&
          mx >= rect.x &&
          mx <= rect.x + rect.w &&
          my >= rect.y &&
          my <= rect.y + rect.h;
        const playRect = this.pausePlayButtonRect;
        const restartRect = this.pauseRestartButtonRect;
        if (inRect(playRect)) {
          this.showPause = false;
        } else if (inRect(restartRect)) {
          this.restartFromStart();
        } else {
          const exitRect = this.pauseExitButtonRect;
          if (inRect(exitRect)) {
            this.showPause = false;
            this.reportRunEnd(false, "quit");
            if (typeof this.onExitToMap === "function") this.onExitToMap();
          }
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.input.consume("restart")) {
      this.restartFromStart();
      this.input.endFrame();
      return;
    }

    if (this.player.dead) {
      this.handleDeathRespawn(dt);
      this.input.endFrame();
      return;
    }

    if (this.levelClearPending) {
      this.levelClearTimer = Math.max(0, this.levelClearTimer - dt);
      this.player.vx = 0;
      this.player.vy = 0;
      this.camera.follow(this.player);
      if (this.levelClearTimer <= 0 && !this.levelCompleteSent) {
        this.levelCompleteSent = true;
        if (this.levelClearPayload) {
          this.onLevelComplete(this.levelClearPayload);
        }
      }
      this.input.endFrame();
      return;
    }

    this.levelRunTime += dt;
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);

    this.handleBossArenaLock();
    if (this.bossIntroTimer > 0) {
      this.bossIntroTimer = Math.max(0, this.bossIntroTimer - dt);
      this.player.vx = 0;
      this.player.vy = 0;
      this.camera.follow(this.player);
      this.input.endFrame();
      return;
    }

    this.player.update(dt, this, this.input);
    this.clampPlayerToWorldBounds();
    this.applyObjectHazards();
    this.updateFinalLevelChestState(dt);
    this.updateAutoCheckpoint();

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active) continue;
      enemy.update(dt, this);
    }
    this.handlePlayerEnemyContacts();

    if (this.boss.active) {
      this.boss.update(dt, this);
    }

    for (const coin of this.coinPool.items) {
      if (!coin.active) continue;
      coin.update(dt);
      if (!coin.collectible) continue;
      if (rectsOverlap(coin.bounds, this.player.bounds)) {
        this.collectCoin(coin);
      }
    }

    this.updateAdventureObjectives(dt);
    this.updateZoneEffects(dt);
    this.updateHeroProjectiles(dt);
    this.updateBossProjectiles(dt);

    for (const p of this.particlePool.items) {
      if (!p.active) continue;
      p.update(dt);
    }

    compactInPlace(this.telegraphs, (t) => {
      t.life -= dt;
      return t.life > 0;
    });
    compactInPlace(this.coinPickupTexts, (entry) => {
      entry.life -= dt;
      entry.y -= 34 * dt;
      return entry.life > 0;
    });

    const isWaterLevel = this.levelData?.world === "water";
    const isPhoneView = this.getViewportClass() === "mobile";
    const skyBias = isPhoneView && !isWaterLevel ? -MOBILE_SKY_VIEW_BIAS : 0;
    const cameraFollowSmooth = isWaterLevel ? 0.18 : 0.12;
    this.camera.follow(this.player, cameraFollowSmooth, 0, skyBias);
    this.keepPlayerOnScreen();
    this.powerHintCooldown = Math.max(0, this.powerHintCooldown - dt);
    this.bossGateHintCooldown = Math.max(0, this.bossGateHintCooldown - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) {
      this.killCombo = 0;
    }
    this.updateHeroMouthBubbles(dt);
    this.updateAmbientBubbles(dt);
    this.updateAmbientSnow(dt);
    if (this.powerNotice?.life > 0) {
      this.powerNotice.life = Math.max(0, this.powerNotice.life - dt);
    }

    const awaitingFinalChest =
      this.levelId >= FINAL_LEVEL_ID &&
      this.finalLevelChest &&
      this.finalLevelChest.active &&
      (!this.finalLevelChest.opened ||
        (Number(this.finalLevelChest.openedTimer) || 0) > 0);
    if (
      this.bossDefeated &&
      !this.levelCompleteSent &&
      !this.levelClearPending &&
      !awaitingFinalChest
    ) {
      const payload = {
        levelId: this.levelId,
        heroId: this.heroId,
        runCoins: this.runAxoCoins,
        time: Math.floor(this.levelRunTime),
        result: "win",
        bossDefeated: true,
        collectedCoinCount: this.collectedCoinCount,
        enemyKills: { ...this.enemyKills },
        heartsRemaining: this.player.currentHearts,
        coreClaim: this.coreClaimThisRun,
        autoAdvance: true,
      };
      this.levelClearPending = true;
      this.levelClearTimer = LEVEL_CLEAR_TRANSITION_SEC;
      this.levelClearPayload = payload;
    }

    this.input.endFrame();
  }

  updateEditor(dt) {
    this.editorRuntime?.update(dt);
  }

  clampPlayerToWorldBounds() {
    if (!this.player || !this.levelData?.sizeTiles) return;
    const worldW = this.levelData.sizeTiles.w * CONST.GAME.TILE;
    const worldH = this.levelData.sizeTiles.h * CONST.GAME.TILE;
    let minX = 0;
    let minY = 0;
    let maxX = Math.max(0, worldW - this.player.w);
    let maxY = Math.max(0, worldH - this.player.h);

    if (this.arenaLocked && this.arenaRectPx) {
      const arenaPad = 8;
      minX = Math.max(minX, this.arenaRectPx.x + arenaPad);
      maxX = Math.min(
        maxX,
        this.arenaRectPx.x + this.arenaRectPx.w - this.player.w - arenaPad,
      );
    }

    maxX = Math.max(minX, maxX);
    maxY = Math.max(minY, maxY);

    if (this.player.x < minX) {
      this.player.x = minX;
      this.player.vx = Math.max(0, this.player.vx);
    } else if (this.player.x > maxX) {
      this.player.x = maxX;
      this.player.vx = Math.min(0, this.player.vx);
    }

    if (this.player.y < minY) {
      this.player.y = minY;
      this.player.vy = Math.max(0, this.player.vy);
    } else if (this.player.y > maxY) {
      this.player.y = maxY;
      this.player.vy = Math.min(0, this.player.vy);
      this.player.onGround = true;
    }
  }

  keepPlayerOnScreen() {
    if (!this.player || !this.camera) return;
    const cam = this.camera;
    const isWaterLevel = this.levelData?.world === "water";
    const cx = this.player.x + this.player.w * 0.5;
    const cy = this.player.y + this.player.h * 0.5;
    const padX = Math.min(110, cam.viewWidth * 0.25);
    const padY = isWaterLevel
      ? Math.min(56, cam.viewHeight * 0.16)
      : Math.min(96, cam.viewHeight * 0.28);

    const leftLimit = cam.x + padX;
    const rightLimit = cam.x + cam.viewWidth - padX;
    const topLimit = cam.y + padY;
    const bottomLimit = cam.y + cam.viewHeight - padY;

    if (cx < leftLimit) {
      cam.x = cx - padX;
    } else if (cx > rightLimit) {
      cam.x = cx + padX - cam.viewWidth;
    }

    if (cy < topLimit) {
      cam.y = cy - padY;
    } else if (cy > bottomLimit) {
      cam.y = cy + padY - cam.viewHeight;
    }

    const maxCamX = cam.bounds.x + cam.bounds.w - cam.viewWidth;
    const maxCamY = cam.bounds.y + cam.bounds.h - cam.viewHeight;
    cam.x = clamp(cam.x, cam.bounds.x, Math.max(cam.bounds.x, maxCamX));
    cam.y = clamp(cam.y, cam.bounds.y, Math.max(cam.bounds.y, maxCamY));
  }

  applyObjectManifest(manifest) {
    const items = Array.isArray(manifest?.items) ? manifest.items : [];
    const basePath = String(manifest?.basePath || "/");
    for (const item of items) {
      const type = String(item?.type || "").trim();
      const file = String(item?.file || "").trim();
      if (!type || !file) continue;
      const mergedPath = file.startsWith("/") ? file : `${basePath}${file}`;
      const publicPath = toPublicAssetPath(mergedPath);
      if (!publicPath) continue;
      this.objectSpriteByType.set(type, publicPath);
    }
  }

  ensureObjectManifestLoaded() {
    if (this.objectManifestLoaded || this.objectManifestLoading) return;

    const levelKey = String(this.levelId ?? 1);
    const manifestUrl = toPublicAssetPath("assets/objects/manifest.json");
    const cacheState = this.manifestCacheState;

    // Fallback (shouldn't happen in normal gameplay): behave like the
    // previous per-instance loader.
    if (
      !cacheState ||
      typeof cacheState !== "object" ||
      !cacheState.loadedManifestByLevelId ||
      !cacheState.pendingManifestRequests
    ) {
      this.objectManifestLoading = true;
      fetch(manifestUrl, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
        .then((manifest) => this.applyObjectManifest(manifest))
        .finally(() => {
          this.objectManifestLoaded = true;
          this.objectManifestLoading = false;
        });
      return;
    }

    const { loadedManifestByLevelId, pendingManifestRequests } = cacheState;

    // If we already loaded it for this level, reuse immediately.
    if (
      Object.prototype.hasOwnProperty.call(loadedManifestByLevelId, levelKey)
    ) {
      const cached = loadedManifestByLevelId[levelKey];
      this.applyObjectManifest(cached);
      this.objectManifestLoaded = true;
      this.objectManifestLoading = false;
      return;
    }

    // If a fetch is already in-flight for this level, dedupe.
    const pending = pendingManifestRequests[levelKey];
    if (pending) {
      this.objectManifestLoading = true;
      pending
        .then((manifest) => this.applyObjectManifest(manifest))
        .catch(() => {})
        .finally(() => {
          this.objectManifestLoaded = true;
          this.objectManifestLoading = false;
        });
      return pending;
    }

    this.objectManifestLoading = true;
    const promise = fetch(manifestUrl, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((manifest) => {
        loadedManifestByLevelId[levelKey] = manifest;
        return manifest;
      })
      .finally(() => {
        delete pendingManifestRequests[levelKey];
      });

    pendingManifestRequests[levelKey] = promise;

    promise
      .then((manifest) => this.applyObjectManifest(manifest))
      .catch(() => {})
      .finally(() => {
        this.objectManifestLoaded = true;
        this.objectManifestLoading = false;
      });

    return promise;
  }

  resolveObjectSpritePath(objectType) {
    const raw = String(objectType || "").trim();
    if (!raw || raw === "coin") return "";
    const normalized = raw.toLowerCase();
    const direct = this.objectSpriteByType.get(raw);
    if (direct) return direct;
    const directFallback = SPECIAL_OBJECT_SPRITES[normalized];
    if (directFallback) return directFallback;

    const world = String(this.levelData?.world || "").toLowerCase();
    if (world && !raw.startsWith(`${world}_`)) {
      const worldPrefixed = this.objectSpriteByType.get(`${world}_${raw}`);
      if (worldPrefixed) return worldPrefixed;
    }

    for (const [type, path] of this.objectSpriteByType.entries()) {
      if (type.endsWith(`_${raw}`)) return path;
    }
    return "";
  }

  getObjectSprite(path) {
    const publicPath = toPublicAssetPath(path);
    if (!publicPath) return null;
    const cached = this.objectSpriteStates.get(publicPath);
    if (cached) return cached;

    const preloaded = getImage(toAssetCacheKey(publicPath));
    if (hasRenderableImage(preloaded)) {
      const state = { image: preloaded, failed: false };
      this.objectSpriteStates.set(publicPath, state);
      return state;
    }

    const image = new Image();
    const state = { image, failed: false };
    image.onerror = () => {
      state.failed = true;
    };
    image.src = publicPath;
    this.objectSpriteStates.set(publicPath, state);
    return state;
  }

  drawPlacedObjects() {
    const objects = Array.isArray(this.levelData?.objects)
      ? this.levelData.objects
      : [];
    if (objects.length === 0) return;
    if (!this.objectManifestLoaded && !this.objectManifestLoading) {
      void this.ensureObjectManifestLoaded();
    }

    const tileSize = CONST.GAME.TILE;
    const worldName = String(this.levelData?.world || "ice").toLowerCase();
    const isCoconutTree = (e) =>
      String(e?.type || "").toLowerCase() === "beach_coconut_tree";
    const isBossFlag = (e) =>
      String(e?.type || "").toLowerCase() === "boss_flag";
    const worldTileSprites = collectWorldTileSpritePaths(worldName);

    for (const entry of objects) {
      if (!entry || entry.type === "coin" || entry.type === "heart") continue;
      const tx = Number(entry.x);
      const ty = Number(entry.y);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;

      const spritePath = this.resolveObjectSpritePath(entry.type);
      if (!spritePath) continue;
      // Do not render terrain/tile visuals as "objects" (they belong to Tiles).
      if (worldTileSprites.has(normalizeAssetPathForMatch(spritePath)))
        continue;
      const state = this.getObjectSprite(spritePath);
      if (!state || state.failed || !hasRenderableImage(state.image)) continue;

      const image = state.image;
      const naturalW = Math.max(
        1,
        Number(image.naturalWidth || image.width || tileSize),
      );
      const naturalH = Math.max(
        1,
        Number(image.naturalHeight || image.height || tileSize),
      );
      const coconut = isCoconutTree(entry);
      const bossFlag = isBossFlag(entry);
      const minDrawH = bossFlag
        ? tileSize * 3.2
        : coconut
          ? tileSize * 1.5
          : tileSize * 0.95;
      const maxDrawH = bossFlag
        ? tileSize * 4.15
        : coconut
          ? tileSize * 3.5
          : tileSize * 2.4;
      const preferredDrawH = bossFlag
        ? tileSize * 3.7
        : coconut
          ? tileSize * 2.5
          : tileSize * 1.65;
      const minDrawW = bossFlag
        ? tileSize * 0.85
        : coconut
          ? tileSize * 1.2
          : tileSize * 0.8;
      const maxDrawW = bossFlag
        ? tileSize * 2.2
        : coconut
          ? tileSize * 3.5
          : tileSize * 2.5;
      const drawH = clamp(preferredDrawH, minDrawH, maxDrawH);
      const drawW = clamp((naturalW / naturalH) * drawH, minDrawW, maxDrawW);

      const worldX = tx * tileSize;
      const worldY = ty * tileSize;
      const drawX = worldX + (tileSize - drawW) * 0.5 - this.camera.x;
      const drawY = worldY + tileSize - drawH - this.camera.y;
      this.ctx.drawImage(image, drawX, drawY, drawW, drawH);
    }
  }

  drawEditorWorldOverlays(ctx) {
    this.editorRuntime?.drawWorldOverlays(ctx);
  }

  drawEditorScreenOverlays(ctx) {
    this.editorRuntime?.drawScreenOverlays(ctx);
  }

  undo() {
    this.editorRuntime?.undo();
  }

  redo() {
    this.editorRuntime?.redo();
  }

  saveLevel() {
    this.editorRuntime?.saveLevel();
  }

  loadLevel() {
    this.editorRuntime?.loadLevel();
  }

  exportLevelJSON() {
    this.editorRuntime?.exportLevelJSON();
  }

  importLevelJSON() {
    this.editorRuntime?.importLevelJSON();
  }

  dispose() {
    this.removeEditorBootstrapListener();
    this.editorRuntime?.dispose();
  }

  togglePause() {
    this.showPause = !this.showPause;
  }

  isWaterSwimEnabled() {
    return this.levelData?.world === "water";
  }

  isTileInsideBossArena(tx, ty) {
    const arena = this.levelData?.bossArena;
    if (!arena) return false;
    const arenaX = Number(arena.x);
    const arenaY = Number(arena.y);
    const arenaW = Number(arena.w);
    const arenaH = Number(arena.h);
    if (
      !Number.isFinite(arenaX) ||
      !Number.isFinite(arenaY) ||
      !Number.isFinite(arenaW) ||
      !Number.isFinite(arenaH) ||
      arenaW <= 0 ||
      arenaH <= 0
    ) {
      return false;
    }
    return (
      tx >= arenaX &&
      tx < arenaX + arenaW &&
      ty >= arenaY &&
      ty < arenaY + arenaH
    );
  }

  isWaterSwimSuppressedAt(rect) {
    if (!this.isWaterSwimEnabled()) return false;
    const suppressInBossArena = Boolean(
      this.levelData?.suppressWaterSwimInBossArena,
    );
    if (!suppressInBossArena) return false;
    if (!this.arenaRectPx || !rect) return false;
    return rectsOverlap(rect, this.arenaRectPx);
  }

  getViewportClass() {
    if (typeof window === "undefined") return "desktop";
    const width = Math.max(1, Number(window.innerWidth) || 0);
    const height = Math.max(1, Number(window.innerHeight) || 0);
    const shortSide = Math.min(width, height);
    const supportsTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      (typeof navigator !== "undefined" &&
        Number(navigator.maxTouchPoints || 0) > 0);

    if (width < 820 || shortSide < 560) return "mobile";
    if (supportsTouch && width <= 1366 && shortSide <= 1024) return "tablet";
    if (width < 1560) return "laptop";
    return "desktop";
  }

  isMobileView() {
    const viewportClass = this.getViewportClass();
    return viewportClass === "mobile" || viewportClass === "tablet";
  }

  shouldUseExpensiveCanvasEffects() {
    return !this.reducedEffectsMode;
  }

  shadowBlurValue(value) {
    return this.shouldUseExpensiveCanvasEffects() ? value : 0;
  }

  getCosmeticBurstCount(baseCount, reducedRatio = 0.25, minimum = 1) {
    const safeBase = Math.max(0, Math.floor(Number(baseCount) || 0));
    if (!this.reducedEffectsMode) return safeBase;
    return Math.max(minimum, Math.ceil(safeBase * reducedRatio));
  }

  hudFontSize() {
    return this.isMobileView() ? 12 : 14;
  }

  hudPillHeight() {
    return this.isMobileView() ? 30 : 34;
  }

  shouldInlineHudWithTopOverlay() {
    if (!this.isMobileView()) return false;
    const width = this.canvas._logicalWidth ?? this.canvas.width ?? 0;
    const height = this.canvas._logicalHeight ?? this.canvas.height ?? 0;
    const isLandscape = width > height;
    return isLandscape || width >= 700;
  }

  draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const cw = canvas._logicalWidth ?? canvas.width;
    const ch = canvas._logicalHeight ?? canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    if (this.isMobileView() || this.isEditorMode) {
      ctx.scale(cw / this.camera.viewWidth, ch / this.camera.viewHeight);
    }

    this.drawBackground();
    if (!this.isEditorMode) {
      this.drawAmbientBubbles();
      this.drawAmbientSnow();
    }
    this.map.draw(ctx, this.camera, {
      world: this.levelData?.world,
      getImage,
      // Keep tile auto-variants enabled in editor so top/left/right/inner are visible.
      disableAutoVariants: false,
    });
    this.drawPlacedObjects();
    this.drawFinalLevelChest();

    for (const coin of this.coinPool.items) {
      if (!coin.active) continue;
      coin.draw(ctx, this.camera);
    }

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active) continue;
      enemy.draw(ctx, this.camera);
    }

    if (this.boss.active) {
      this.boss.draw(ctx, this.camera);
    }

    this.player.draw(ctx, this.camera);
    this.drawHeroMouthBubbles();

    for (const proj of this.heroProjectiles) {
      this.drawHeroProjectile(proj);
    }
    for (const proj of this.bossProjectiles) {
      this.drawBossProjectile(proj);
    }

    for (const z of this.zoneEffects) {
      this.drawZone(z);
    }

    for (const t of this.telegraphs) {
      this.drawTelegraph(t);
    }
    for (const entry of this.coinPickupTexts) {
      this.drawCoinPickupText(entry);
    }

    for (const p of this.particlePool.items) {
      if (!p.active) continue;
      p.draw(ctx, this.camera);
    }

    if (this.arenaLocked && this.arenaRectPx) {
      this.drawBossGate();
    }

    if (this.isEditorMode) {
      this.drawEditorWorldOverlays(ctx);
    }

    ctx.restore();

    this.drawHud();

    if (this.isEditorMode) {
      this.drawEditorScreenOverlays(ctx);
    }

    if (!this.isEditorMode && this.showPause) {
      this.drawPauseOverlay();
    }

    if (!this.isEditorMode && this.player.dead && !this.gameOverActive) {
      this.drawRespawnOverlay();
    }

    if (!this.isEditorMode && this.gameOverActive) {
      this.drawGameOverOverlay();
    } else if (this.canvas && this.canvas.style && !this.showPause) {
      this.canvas.style.cursor = "default";
    }

    if (!this.isEditorMode && this.bossIntroTimer > 0) {
      this.drawBossIntroOverlay();
    }

    // if (this.levelClearPending) {
    //   this.drawLevelClearOverlay();
    // }
  }

  drawBackground() {
    const ctx = this.ctx;
    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const useCameraSize = this.isMobileView() || this.isEditorMode;
    const w = useCameraSize ? this.camera.viewWidth : vw;
    const h = useCameraSize ? this.camera.viewHeight : vh;
    const levelAsset = LEVEL_ASSETS[this.levelId];
    const parallaxLayers = levelAsset?.parallax || [];
    const transition = levelAsset?.dayNightTransition || null;
    const transitionAlpha = this.getIceNightTransitionAlpha(levelAsset, w);
    const drawDayLayers = transitionAlpha < 0.999;

    const gradients = {
      ice: ["#d8f2ff", "#8cb7e5"],
      water: ["#bde8ff", "#3a7cd8"],
      beach: ["#ffedc8", "#e6b768"],
      grave: ["#cbc8dc", "#61527b"],
    };
    const world = this.levelData.world;
    const [a, b] = gradients[world] || ["#ced8e6", "#7788a0"];
    const gradKey = `${world}:${h}`;
    if (this.bgGradientKey !== gradKey) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, a);
      grad.addColorStop(1, b);
      this.bgGradient = grad;
      this.bgGradientKey = gradKey;
    }
    ctx.fillStyle = this.bgGradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < parallaxLayers.length; i += 1) {
      if (!drawDayLayers) break;
      const path = parallaxLayers[i];
      const img = getImage(path);
      if (!img) continue;
      const speed = 0.08 + i * 0.11;
      const sourceRatio = img.width / Math.max(1, img.height);

      if (sourceRatio >= PARALLAX_SPRITESHEET_RATIO_THRESHOLD) {
        // Some custom layers are exported as very-wide sprite sheets.
        // Sample a viewport-sized window from the strip based on camera position.
        const targetAspect = w / Math.max(1, h);
        const frameW = Math.max(
          1,
          Math.min(img.width, Math.floor(img.height * targetAspect)),
        );
        const worldW =
          Number(this.levelData?.sizeTiles?.w) * CONST.GAME.TILE ||
          this.camera.bounds?.w ||
          w;
        const cameraScrollable = Math.max(
          1,
          worldW - (this.camera.viewWidth || w),
        );
        const cameraOffsetX = clamp(
          this.camera.x - (this.camera.bounds?.x || 0),
          0,
          cameraScrollable,
        );
        const maxSrcX = Math.max(0, img.width - frameW);
        const srcX = Math.round((cameraOffsetX / cameraScrollable) * maxSrcX);
        ctx.drawImage(img, srcX, 0, frameW, img.height, 0, 0, w, h);
        continue;
      }

      const drawH = h;
      const drawW = Math.max(
        1,
        Math.round((img.width / Math.max(1, img.height)) * drawH),
      );
      const scroll = (((this.camera.x * speed) % drawW) + drawW) % drawW;
      const startX = Math.floor(-scroll) - drawW;
      const rightEdge = w + drawW;
      // Overlap repeated draws to hide vertical white seams (beach water bg needs more overlap).
      const parallaxOverlapPx = world === "beach" ? 4 : 1;
      const stepX = Math.max(1, drawW - parallaxOverlapPx);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      for (let x = startX; x < rightEdge; x += stepX) {
        ctx.drawImage(img, x, 0, drawW, drawH);
      }
      ctx.restore();
    }

    if (transition?.overlay) {
      const overlayImg = getImage(transition.overlay);
      if (overlayImg) {
        if (transitionAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = transitionAlpha;
          ctx.drawImage(overlayImg, 0, 0, w, h);
          ctx.restore();
        }
      }
    }
  }

  getIceNightTransitionAlpha(levelAsset, viewportWidth) {
    const transition = levelAsset?.dayNightTransition || null;
    if (!transition?.overlay) return 0;

    const world = String(this.levelData?.world || "").toLowerCase();
    if (world !== "ice") return 0;

    const heroCenterX = this.player
      ? this.player.x + this.player.w * 0.5
      : this.camera.x + (this.camera.viewWidth || viewportWidth) * 0.5;
    const bossArenaXTile = Number(this.levelData?.bossArena?.x);

    let targetAlpha = 0;

    // Preferred behavior: fade in night while approaching the boss arena.
    if (Number.isFinite(bossArenaXTile) && bossArenaXTile >= 0) {
      const arenaX = bossArenaXTile * CONST.GAME.TILE;
      const bossAreaOnly = transition?.bossAreaOnly !== false;
      if (bossAreaOnly) {
        const arenaMeta = this.levelData?.bossArena || null;
        const arenaY = Number(arenaMeta?.y);
        const arenaW = Number(arenaMeta?.w);
        const arenaH = Number(arenaMeta?.h);
        const hasArenaRect =
          Number.isFinite(arenaY) &&
          Number.isFinite(arenaW) &&
          Number.isFinite(arenaH) &&
          arenaW > 0 &&
          arenaH > 0;
        if (hasArenaRect && this.player?.bounds) {
          const arenaRect = {
            x: arenaX,
            y: arenaY * CONST.GAME.TILE,
            w: arenaW * CONST.GAME.TILE,
            h: arenaH * CONST.GAME.TILE,
          };
          const inBossArea =
            this.arenaLocked || rectsOverlap(this.player.bounds, arenaRect);
          targetAlpha = inBossArea ? 1 : 0;
        } else {
          targetAlpha = heroCenterX >= arenaX ? 1 : 0;
        }
      } else {
        const leadInTiles = clamp(Number(transition.leadInTiles ?? 18), 0, 80);
        const startX = Math.max(0, arenaX - leadInTiles * CONST.GAME.TILE);
        const endX = Math.max(startX + 1, arenaX);
        const raw = clamp((heroCenterX - startX) / (endX - startX), 0, 1);
        targetAlpha = raw * raw * (3 - 2 * raw); // smoothstep easing
      }
      return this.getStickyIceNightAlpha(targetAlpha, transition);
    }

    // Fallback for levels without bossArena metadata.
    const worldW =
      Number(this.levelData?.sizeTiles?.w) * CONST.GAME.TILE ||
      this.camera.bounds?.w ||
      this.camera.viewWidth ||
      viewportWidth;
    const cameraScrollable = Math.max(
      1,
      worldW - (this.camera.viewWidth || viewportWidth),
    );
    const cameraOffsetX = clamp(
      this.camera.x - (this.camera.bounds?.x || 0),
      0,
      cameraScrollable,
    );
    const levelProgress = clamp(cameraOffsetX / cameraScrollable, 0, 1);
    const start = clamp(Number(transition.startProgress ?? 0.82), 0, 1);
    const end = clamp(Number(transition.endProgress ?? 1), start + 0.001, 1);
    const raw = clamp((levelProgress - start) / (end - start), 0, 1);
    targetAlpha = raw * raw * (3 - 2 * raw); // smoothstep easing
    return this.getStickyIceNightAlpha(targetAlpha, transition);
  }

  getStickyIceNightAlpha(targetAlpha, transition) {
    const instantSwitch = Boolean(transition?.instantSwitch);
    const oneWay = transition?.oneWay !== false;

    if (instantSwitch) {
      const wantsNight = targetAlpha > 0;
      if (!oneWay) {
        return wantsNight ? 1 : 0;
      }
      if (this.iceNightLocked) return 1;
      if (wantsNight) {
        this.iceNightLocked = true;
        this.iceNightTransitionAlpha = 1;
        return 1;
      }
      this.iceNightTransitionAlpha = 0;
      return 0;
    }

    if (!oneWay) return targetAlpha;

    if (this.iceNightLocked) return 1;

    const current = Number.isFinite(this.iceNightTransitionAlpha)
      ? this.iceNightTransitionAlpha
      : 0;
    const next = Math.max(current, targetAlpha);
    this.iceNightTransitionAlpha = next;

    const lockAt = clamp(Number(transition?.lockAtAlpha ?? 0.97), 0.7, 1);
    if (next >= lockAt) {
      this.iceNightLocked = true;
      this.iceNightTransitionAlpha = 1;
      return 1;
    }

    return next;
  }

  initAmbientBubbles() {
    if (this.levelData?.world !== "water") return;
    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const w = this.isMobileView() ? this.camera.viewWidth : vw;
    const h = this.isMobileView() ? this.camera.viewHeight : vh;
    const left = this.camera.x;
    const top = this.camera.y;
    const count = this.reducedEffectsMode
      ? Math.max(4, Math.floor(w / 220))
      : Math.max(14, Math.floor(w / 88));
    for (let i = 0; i < count; i += 1) {
      this.ambientBubbles.push({
        // World-space positions so bubbles do not follow camera/hero.
        x: left + Math.random() * (w + 40) - 20,
        y: top + Math.random() * h,
        r: randomRange(2.4, 8.6),
        speed: randomRange(18, 52),
        sway: randomRange(0.7, 2.2),
        phase: randomRange(0, Math.PI * 2),
        alpha: randomRange(0.22, 0.62),
      });
    }
  }

  updateHeroMouthBubbles(dt) {
    if (this.levelData?.world !== "water") return;
    if (!this.player || this.player.dead || !this.player.inWater) return;

    this.heroMouthBubbleTimer -= dt;
    if (this.heroMouthBubbleTimer > 0) return;

    const speedX = Math.abs(this.player.vx || 0);
    const speedY = Math.abs(this.player.vy || 0);
    const isSwimStrokeLike = this.player.vy < -2.1 || speedX > 1.9;
    const isSlowSwim = speedX < 0.38 && speedY < 0.72;
    const isRestingOnFloor =
      this.player.onGround && speedX < 0.25 && speedY < 0.45;

    if (isRestingOnFloor && Math.random() < 0.82) {
      this.heroMouthBubbleTimer = randomRange(0.46, 0.95);
      return;
    }
    if (isSlowSwim && Math.random() < 0.65) {
      this.heroMouthBubbleTimer = randomRange(0.32, 0.68);
      return;
    }

    const nextBubbleDelay = isSwimStrokeLike
      ? randomRange(0.12, 0.24)
      : randomRange(
          HERO_MOUTH_BUBBLE_MIN_INTERVAL_SEC,
          HERO_MOUTH_BUBBLE_MAX_INTERVAL_SEC,
        );
    this.heroMouthBubbleTimer = this.reducedEffectsMode
      ? nextBubbleDelay * 1.85
      : nextBubbleDelay;

    let activeHeroBubbles = 0;
    for (const bubble of this.ambientBubbles) {
      if (bubble.source === "heroMouth") activeHeroBubbles += 1;
    }
    const heroBubbleLimit = this.reducedEffectsMode
      ? 2
      : HERO_MOUTH_BUBBLE_MAX_ACTIVE;
    if (activeHeroBubbles >= heroBubbleLimit) return;

    const facing = this.player.facing >= 0 ? 1 : -1;
    const mouthX =
      this.player.x + this.player.w * (facing > 0 ? 0.66 : 0.34) + facing * 2;
    const mouthY =
      this.player.y + this.player.h * 0.33 + randomRange(-1.5, 2.4);
    const spawnCount = this.reducedEffectsMode
      ? 1
      : isSwimStrokeLike && Math.random() < 0.3
        ? 2
        : 1;
    for (let i = 0; i < spawnCount; i += 1) {
      if (activeHeroBubbles >= heroBubbleLimit) break;
      activeHeroBubbles += 1;
      this.ambientBubbles.push({
        source: "heroMouth",
        x: mouthX + randomRange(-2.4, 2.4),
        y: mouthY + randomRange(-2, 2),
        r: randomRange(1.5, 3.6),
        speed: randomRange(34, 62),
        sway: randomRange(0.8, 2.6),
        phase: randomRange(0, Math.PI * 2),
        alpha: randomRange(0.46, 0.82),
        life: randomRange(0.62, 1.1),
      });
    }
  }

  updateAmbientBubbles(dt) {
    if (this.levelData?.world !== "water") return;
    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const w = this.isMobileView() ? this.camera.viewWidth : vw;
    const h = this.isMobileView() ? this.camera.viewHeight : vh;
    const left = this.camera.x;
    const right = left + w;
    const top = this.camera.y;
    const bottom = top + h;
    this.ambientBubbleSpawnTimer -= dt;

    if (
      this.ambientBubbleSpawnTimer <= 0 &&
      this.ambientBubbles.length < this.maxAmbientBubbles
    ) {
      this.ambientBubbleSpawnTimer = this.reducedEffectsMode
        ? randomRange(0.34, 0.72)
        : randomRange(0.08, 0.24);
      this.ambientBubbles.push({
        x: randomRange(left - 24, right + 24),
        // Spawn from the bottom of current camera view in world space.
        y: bottom + randomRange(4, 28),
        r: randomRange(2.2, 6.4),
        speed: randomRange(20, 58),
        sway: randomRange(0.8, 2.4),
        phase: randomRange(0, Math.PI * 2),
        alpha: randomRange(0.2, 0.58),
      });
    }

    compactInPlace(this.ambientBubbles, (b) => {
      b.y -= b.speed * dt;
      b.phase += dt * b.sway;
      b.x += Math.sin(b.phase) * (10 * dt);

      if (b.source === "heroMouth") {
        b.life = Math.max(0, Number(b.life || 0) - dt);
        b.alpha = Math.max(0, b.alpha - dt * 0.58);
        if (b.life <= 0 || b.alpha <= 0.02) return false;
        if (b.y < top - 36) return false;
        return true;
      }

      if (b.y < top - 40) return false;
      if (b.x < left - 80 || b.x > right + 80) return false;
      return true;
    });
  }

  drawAmbientBubbles() {
    if (this.levelData?.world !== "water") return;
    const ctx = this.ctx;
    for (const b of this.ambientBubbles) {
      if (b.source === "heroMouth") continue;
      const sx = b.x - this.camera.x;
      const sy = b.y - this.camera.y;
      this.drawWaterBubbleSprite(ctx, sx, sy, b.r, b.alpha, false);
    }
  }

  drawHeroMouthBubbles() {
    if (this.levelData?.world !== "water") return;
    const ctx = this.ctx;
    for (const b of this.ambientBubbles) {
      if (b.source !== "heroMouth") continue;
      const sx = b.x - this.camera.x;
      const sy = b.y - this.camera.y;
      const alpha = Math.min(0.98, b.alpha || 0);
      this.drawWaterBubbleSprite(ctx, sx, sy, b.r, alpha, true);
    }
  }

  drawWaterBubbleSprite(ctx, x, y, radius, alpha = 0.4, heroMouth = false) {
    const r = Math.max(1, Number(radius) || 1);
    const a = clamp(Number(alpha) || 0, 0.06, 1);
    const glow = heroMouth ? a * 0.44 : a * 0.28;
    const rim = heroMouth ? a * 0.92 : a * 0.74;

    const fill = ctx.createRadialGradient(
      x - r * 0.24,
      y - r * 0.28,
      Math.max(0.8, r * 0.12),
      x,
      y,
      r,
    );
    fill.addColorStop(0, `rgba(255,255,255,${glow})`);
    fill.addColorStop(0.32, `rgba(202,240,255,${a * 0.16})`);
    fill.addColorStop(0.72, `rgba(168,225,255,${a * 0.08})`);
    fill.addColorStop(1, `rgba(150,215,255,${a * 0.03})`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(236,250,255,${rim})`;
    ctx.lineWidth = Math.max(0.9, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, r - ctx.lineWidth * 0.5), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${heroMouth ? a * 0.9 : a * 0.72})`;
    ctx.lineWidth = Math.max(0.75, r * 0.11);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(
      x - r * 0.16,
      y - r * 0.18,
      Math.max(0.6, r * 0.38),
      Math.PI * 1.08,
      Math.PI * 1.55,
    );
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${heroMouth ? a * 0.82 : a * 0.62})`;
    ctx.beginPath();
    ctx.arc(
      x - r * 0.28,
      y - r * 0.3,
      Math.max(0.45, r * 0.12),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  initAmbientSnow() {
    if (this.levelData?.world !== "ice") return;
    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const w = this.isMobileView() ? this.camera.viewWidth : vw;
    const h = this.isMobileView() ? this.camera.viewHeight : vh;
    const left = this.camera.x;
    const top = this.camera.y;
    const count = this.reducedEffectsMode
      ? Math.max(6, Math.floor((w * h) / 56000))
      : Math.max(30, Math.floor((w * h) / 12000));
    for (let i = 0; i < count; i += 1) {
      this.ambientSnowflakes.push({
        // World-space positions so snow does NOT follow the hero.
        x: left + Math.random() * (w + 40) - 20,
        y: top + Math.random() * h,
        len: randomRange(2, 5),
        speed: randomRange(20, 58),
        alpha: randomRange(0.4, 0.9),
        rot: randomRange(0, Math.PI * 2),
        rotSpeed: randomRange(-0.8, 0.8),
      });
    }
  }

  updateAmbientSnow(dt) {
    if (this.levelData?.world !== "ice") return;
    const vw = this.canvas._logicalWidth ?? this.canvas.width;
    const vh = this.canvas._logicalHeight ?? this.canvas.height;
    const w = this.isMobileView() ? this.camera.viewWidth : vw;
    const h = this.isMobileView() ? this.camera.viewHeight : vh;
    const left = this.camera.x;
    const right = left + w;
    const top = this.camera.y;
    const bottom = top + h;
    this.ambientSnowSpawnTimer -= dt;
    if (
      this.ambientSnowSpawnTimer <= 0 &&
      this.ambientSnowflakes.length < this.maxAmbientSnowflakes
    ) {
      this.ambientSnowSpawnTimer = this.reducedEffectsMode
        ? randomRange(0.28, 0.62)
        : randomRange(0.05, 0.18);
      this.ambientSnowflakes.push({
        x: randomRange(left - 20, right + 20),
        // Spawn slightly above the top of the current view so flakes fall in.
        y: top - randomRange(4, 24),
        len: randomRange(2, 4.5),
        speed: randomRange(22, 65),
        alpha: randomRange(0.35, 0.85),
        rot: randomRange(0, Math.PI * 2),
        rotSpeed: randomRange(-0.8, 0.8),
      });
    }
    compactInPlace(this.ambientSnowflakes, (s) => {
      s.y += s.speed * dt;
      s.rot += (s.rotSpeed || 0) * dt;
      // Vertical-only fall; cull flakes far below or far from the view in world space.
      if (s.y > bottom + 40) return false;
      if (s.x < left - 80 || s.x > right + 80) return false;
      return true;
    });
  }

  drawAmbientSnow() {
    if (this.levelData?.world !== "ice") return;
    const ctx = this.ctx;
    const viewW = this.camera.viewWidth;
    const viewH = this.camera.viewHeight;
    for (const s of this.ambientSnowflakes) {
      const x = s.x - this.camera.x;
      const y = s.y - this.camera.y;
      // Skip flakes well outside the current view.
      if (x < -80 || x > viewW + 80 || y < -80 || y > viewH + 80) continue;
      const len = s.len ?? 2.5;
      const rot = s.rot ?? 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(220,238,255,${s.alpha})`;
      ctx.lineWidth = Math.max(0.8, len * 0.35);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(len, 0);
      ctx.moveTo(0, -len);
      ctx.lineTo(0, len);
      const d = len * 0.7;
      ctx.moveTo(-d, -d);
      ctx.lineTo(d, d);
      ctx.moveTo(d, -d);
      ctx.lineTo(-d, d);
      ctx.stroke();
      ctx.restore();
    }
  }

  // drawHud() {
  //   const ctx = this.ctx;
  //   const hudW = this.canvas.width;
  //   ctx.fillStyle = "rgba(16,22,30,0.78)";
  //   ctx.fillRect(0, 0, hudW, 78);

  //   ctx.fillStyle = "#eaf2ff";
  //   ctx.font = "600 20px 'Trebuchet MS', sans-serif";
  //   ctx.textAlign = "left";
  //   const heroText = `Hero: ${this.player.name}`;
  //   ctx.fillText(heroText, 20, 30);
  //   const powerText = "Power: THROW";
  //   const powerX = 20 + ctx.measureText(heroText).width + 28;
  //   ctx.fillText(powerText, powerX, 30);

  //   const hearts = Math.ceil(this.player.hp / 100);
  //   const maxHearts = this.player.maxHearts;
  //   const axoText = `AxoCoin: ${this.runAxoCoins}`;
  //   const rightPad = 168;
  //   const gap = 28;

  //   ctx.textAlign = "right";
  //   const axoX = hudW - rightPad;
  //   const axoTextW = ctx.measureText(axoText).width;
  //   const axoIcon = getImage(UI_IMAGES.axocoin);
  //   const showAxoIcon = hasRenderableImage(axoIcon);
  //   const axoIconSize = 26;
  //   const axoBlockWidth = axoTextW + (showAxoIcon ? axoIconSize + 8 : 0);
  //   ctx.fillText(axoText, axoX, 30);
  //   if (showAxoIcon) {
  //     const iconX = axoX - axoTextW - 8 - axoIconSize;
  //     ctx.drawImage(axoIcon, iconX, 6, axoIconSize, axoIconSize);
  //   }

  //   const heartsRightX = axoX - axoBlockWidth - gap;
  //   this.drawHudHearts(heartsRightX, 30, hearts, maxHearts);

  //   const y = 56;
  //   const ringX = hudW - 112;
  //   const throwKeyHint = this.input?.getActionHint?.("skill") || "SPACE";
  //   const ringLabel = throwKeyHint.startsWith("SPACE")
  //     ? "SP"
  //     : (throwKeyHint.split(" / ")[0] || "T").slice(0, 2);
  //   this.drawCooldownRing(
  //     ringX,
  //     y,
  //     ringLabel,
  //     this.player.skillCooldown,
  //     this.getThrowCooldown(),
  //   );
  //   ctx.fillStyle = "#fff";
  //   ctx.font = "700 13px 'Trebuchet MS', sans-serif";
  //   ctx.textAlign = "left";
  //   ctx.fillText("THROW", ringX + 30, y + 6);
  //   ctx.font = "600 12px 'Trebuchet MS', sans-serif";
  //   ctx.fillText(throwKeyHint, ringX + 44, y + 28);

  //   const elemColor = ELEMENT_COLOR[this.currentElement] || "#ffffff";
  //   const elemSymbol = ELEMENT_SYMBOL[this.currentElement] || "?";
  //   ctx.fillStyle = elemColor;
  //   ctx.font = "700 16px 'Trebuchet MS', sans-serif";
  //   ctx.fillText(
  //     `Element: ${elemSymbol} ${this.currentElement.toUpperCase()}`,
  //     20,
  //     58,
  //   );

  //   const coreLabel = this.permanentElementCore
  //     ? `${ELEMENT_SYMBOL[this.permanentElementCore] || "*"} ${String(this.permanentElementCore).toUpperCase()} CORE`
  //     : "NO CORE";
  //   ctx.fillStyle = this.permanentElementCore
  //     ? ELEMENT_COLOR[this.permanentElementCore] || "#a8b8c8"
  //     : "#a8b8c8";
  //   ctx.font = "700 12px 'Trebuchet MS', sans-serif";
  //   ctx.fillText(
  //     `Core: ${coreLabel}${this.veteranModeEnabled ? " | VETERAN" : ""}`,
  //     20,
  //     74,
  //   );

  //   ctx.fillStyle = "#c8d8ea";
  //   ctx.font = "500 12px 'Trebuchet MS', sans-serif";
  //   ctx.fillText("Single power mode active", 220, 58);
  //   ctx.fillText("ESC Pause | R Restart", 220, 72);
  //   if (this.killCombo >= 2) {
  //     ctx.fillStyle = "#ffdd9a";
  //     ctx.font = "700 13px 'Trebuchet MS', sans-serif";
  //     ctx.fillText(
  //       `Combat Flow x${this.killCombo}`,
  //       this.canvas.width / 2 + 130,
  //       56,
  //     );
  //   }

  //   if (this.powerNotice?.life > 0) {
  //     const alpha = clamp(
  //       this.powerNotice.life / this.powerNotice.maxLife,
  //       0,
  //       1,
  //     );
  //     ctx.fillStyle = `rgba(8,14,24,${0.38 + 0.2 * alpha})`;
  //     ctx.fillRect(this.canvas.width / 2 - 330, 82, 660, 26);
  //     ctx.fillStyle = `rgba(233,246,255,${0.75 + 0.25 * alpha})`;
  //     ctx.font = "600 14px 'Trebuchet MS', sans-serif";
  //     ctx.fillText(this.powerNotice.text, this.canvas.width / 2 - 320, 100);
  //   }
  // }
  drawHud() {
    const ctx = this.ctx;
    const w = this.canvas._logicalWidth ?? this.canvas.width;
    const pillH = this.hudPillHeight();
    const mobile = this.isMobileView();

    const HUD_H = mobile ? 52 : 56;
    const topOverlay = this.getTopOverlayMetrics();
    const topOverlayBottom = topOverlay?.bottom || 0;
    const topOverlayGap = mobile ? 8 : 10;
    const keepHudBelowTopOverlay =
      mobile && topOverlayBottom > 0 && !this.shouldInlineHudWithTopOverlay();
    const topHudClearance = keepHudBelowTopOverlay
      ? topOverlayBottom + topOverlayGap
      : 0;
    const y = Math.max(HUD_H / 2, topHudClearance + pillH * 0.5);
    const gap = mobile ? 5 : 10;
    const leftX = mobile ? 6 : 14;
    const rightPad = mobile ? 8 : 14;

    const world = this.levelData?.world || "ice";
    const isBrightLevel = world === "beach" || world === "water";
    this._hudContrast = isBrightLevel ? "bright" : "default";

    const worldName = getLevelDisplayName(
      this.levelId,
      this.levelData?.name || this.levelData?.world || "level",
    ).toUpperCase();
    const levelLabel = worldName;

    const heroName = this.player?.name || "Hero";
    const heroDisplayName =
      mobile && heroName.length > 6 ? heroName.slice(0, 6) : heroName;
    const heroIdKey = String(this.heroId || "")
      .trim()
      .toLowerCase();
    const heroNameKey = String(heroName || "")
      .trim()
      .toLowerCase();
    const namedPortrait = HERO_PORTRAITS[heroNameKey];
    const sameNameAndId = heroNameKey === heroIdKey;
    const idPortrait =
      HERO_PORTRAITS[this.heroId] || HERO_PORTRAITS[heroIdKey] || null;
    const heroPortraitPath =
      namedPortrait || (sameNameAndId ? idPortrait : null);
    const heroPortrait = heroPortraitPath ? getImage(heroPortraitPath) : null;

    const heroMinW = mobile ? 48 : 150;
    const levelMinW = mobile ? 40 : 110;
    const axoMinW = mobile ? 44 : 86;

    const hearts = Math.ceil(this.player.hp / 100);
    const maxHearts = this.player.maxHearts;
    const heartSpacing = mobile ? 22 : 26;
    const heartsBlockW = maxHearts * heartSpacing + (mobile ? 4 : 6);

    const axoIcon = getImage(UI_IMAGES.axocoin);
    const showAxoIcon = hasRenderableImage(axoIcon);
    const axoText = `${this.getDisplayedAxoCoins()}`;
    const axoIconW = showAxoIcon ? (mobile ? 24 : 22) : 0;
    const axoW =
      Math.max(
        axoMinW,
        this.measurePillWidth(axoText, { bold: true, minW: axoMinW }),
      ) + axoIconW;

    let contentRight = w - rightPad;
    if (topOverlay && !keepHudBelowTopOverlay) {
      contentRight = Math.min(contentRight, topOverlay.left - topOverlayGap);
    }

    const heartsRightX = contentRight - 6;
    const axoX = heartsRightX - heartsBlockW - (mobile ? 6 : 10) - axoW;
    const rightContentLeft = axoX - (mobile ? 6 : 10);

    const heroW = this.drawHudPill(leftX, y, heroDisplayName, {
      minW: heroMinW,
      accent: "rgba(145,225,255,0.06)",
      rightIcon: mobile ? null : heroPortrait,
    });

    const levelX = leftX + heroW + gap;
    if (levelX + levelMinW <= rightContentLeft - gap) {
      this.drawHudPill(levelX, y, levelLabel, {
        minW: levelMinW,
        accent: "rgba(145,225,255,0.06)",
      });
    }

    this.pauseButtonRect = null;
    this.musicButtonRect = null;

    this.drawHudHeartsCompact(
      heartsRightX - heartsBlockW,
      y,
      hearts,
      maxHearts,
    );

    this.drawHudPill(axoX, y, axoText, {
      minW: axoMinW,
      leftIcon: showAxoIcon ? axoIcon : null,
      accent: "rgba(145,225,255,0.06)",
    });
  }

  getTopOverlayMetrics() {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return null;
    }
    const topRow = document.getElementById("gameplayTopRow");
    if (!topRow) return null;
    const style = window.getComputedStyle(topRow);
    if (style.display === "none" || style.visibility === "hidden") return null;

    const rect = topRow.getBoundingClientRect();
    if (!Number.isFinite(rect?.bottom) || rect.height <= 0) return null;

    const canvasRect = this.canvas?.getBoundingClientRect?.();
    const logicalW = this.canvas._logicalWidth ?? this.canvas.width;
    const logicalH = this.canvas._logicalHeight ?? this.canvas.height;
    if (
      !canvasRect ||
      !Number.isFinite(canvasRect.width) ||
      !Number.isFinite(canvasRect.height) ||
      canvasRect.width <= 0 ||
      canvasRect.height <= 0
    ) {
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    }

    const sx = logicalW / canvasRect.width;
    const sy = logicalH / canvasRect.height;
    const left = (rect.left - canvasRect.left) * sx;
    const right = (rect.right - canvasRect.left) * sx;
    const top = (rect.top - canvasRect.top) * sy;
    const bottom = (rect.bottom - canvasRect.top) * sy;

    return {
      left,
      right,
      top,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  getTopOverlayBottom() {
    return this.getTopOverlayMetrics()?.bottom || 0;
  }

  hasTopTouchButtons() {
    return this.getTopOverlayBottom() > 0;
  }

  isMusicEnabled() {
    if (!this.audio) return true;
    if (typeof this.audio.isAudioEnabled === "function") {
      return this.audio.isAudioEnabled();
    }
    if (typeof this.audio.isMusicEnabled === "function") {
      return this.audio.isMusicEnabled();
    }
    return Number(this.audio.music) > 0.001 || Number(this.audio.sfx) > 0.001;
  }

  toggleMusicButton() {
    if (!this.audio) return true;
    if (typeof this.audio.toggleAudioEnabled === "function") {
      this.audio.toggleAudioEnabled();
    } else if (typeof this.audio.toggleMusicEnabled === "function") {
      this.audio.toggleMusicEnabled();
    } else {
      const enabled = this.isMusicEnabled();
      if (enabled) {
        this.audio._lastMusicLevel =
          Number(this.audio.music) || CONST.AUDIO.MusicDefault;
        this.audio._lastSfxLevel =
          Number(this.audio.sfx) || CONST.AUDIO.SfxDefault;
        this.audio.music = 0;
        this.audio.sfx = 0;
      } else {
        this.audio.music =
          this.audio._lastMusicLevel > 0
            ? this.audio._lastMusicLevel
            : CONST.AUDIO.MusicDefault;
        this.audio.sfx =
          this.audio._lastSfxLevel > 0
            ? this.audio._lastSfxLevel
            : CONST.AUDIO.SfxDefault;
      }
      if (this.audio.currentTrack) {
        this.audio.currentTrack.muted = enabled;
        this.audio.currentTrack.volume = this.audio.master * this.audio.music;
        if (!enabled && this.audio.currentTrack.paused) {
          this.audio.currentTrack.play().catch(() => {});
        }
      }
    }
    this.playSfx("uiClick");
    return this.isMusicEnabled();
  }

  measurePillWidth(text, opts = {}) {
    const ctx = this.ctx;
    const { bold = false, minW = 80 } = opts;
    const fs = this.hudFontSize();
    ctx.font = `${bold ? "700" : "600"} ${fs}px 'Trebuchet MS', sans-serif`;
    const padX = this.isMobileView() ? 12 : 14;
    const tw = ctx.measureText(String(text)).width;
    return Math.max(minW, Math.ceil(tw + padX * 2));
  }

  // drawHudPill(x, y, text, opts = {}) {
  //   const ctx = this.ctx;
  //   const {
  //     minW = 90,
  //     h = 34,
  //     radius = 14,
  //     accent = "rgba(145,225,255,0.16)",
  //     bg = "rgba(18,28,40,0.78)",
  //     stroke = "rgba(170,220,255,0.12)",
  //     textColor = "#f6fbff",
  //     bold = false,
  //     centerText = false,
  //     leftIcon = null,
  //   } = opts;

  //   ctx.font = `${bold ? "700" : "600"} 14px 'Trebuchet MS', sans-serif`;

  //   const padX = 14;
  //   const iconSize = leftIcon ? 18 : 0;
  //   const iconGap = leftIcon ? 8 : 0;

  //   const textW = ctx.measureText(String(text)).width;
  //   const w = Math.max(minW, Math.ceil(textW + padX * 2 + iconSize + iconGap));

  //   const rx = x;
  //   const ry = y - h / 2;

  //   // main pill
  //   ctx.fillStyle = bg;
  //   this.roundRect(ctx, rx, ry, w, h, radius);
  //   ctx.fill();

  //   // accent glow
  //   ctx.fillStyle = accent;
  //   this.roundRect(ctx, rx + 1, ry + 1, w - 2, h - 2, radius - 1);
  //   ctx.fill();

  //   // stroke
  //   ctx.strokeStyle = stroke;
  //   ctx.lineWidth = 2;
  //   this.roundRect(ctx, rx + 1, ry + 1, w - 2, h - 2, radius - 1);
  //   ctx.stroke();

  //   // icon
  //   let contentX = rx + padX;
  //   if (leftIcon && hasRenderableImage(leftIcon)) {
  //     ctx.drawImage(leftIcon, contentX, y - iconSize / 2, iconSize, iconSize);
  //     contentX += iconSize + iconGap;
  //   }

  //   // text
  //   ctx.fillStyle = textColor;
  //   if (centerText) {
  //     ctx.textAlign = "center";
  //     ctx.fillText(String(text), rx + w / 2, y);
  //     ctx.textAlign = "left";
  //   } else {
  //     ctx.textAlign = "left";
  //     ctx.fillText(String(text), contentX, y);
  //   }

  //   return w;
  // }

  drawHudPill(x, y, text, opts = {}) {
    const ctx = this.ctx;
    const h = this.hudPillHeight();
    const fs = this.hudFontSize();
    const padX = this.isMobileView() ? 12 : 14;
    const bright = this._hudContrast === "bright";
    const {
      minW = 90,
      radius = 16,

      bg = bright
        ? "rgba(104, 68, 38, 0.28)"
        : "rgba(78, 51, 29, 0.34)",
      stroke = bright
        ? "rgba(255, 233, 198, 0.5)"
        : "rgba(233, 198, 144, 0.3)",
      accent = bright
        ? "rgba(255, 235, 203, 0.08)"
        : "rgba(248, 222, 180, 0.06)",

      textColor = bright ? "#fff8ec" : "#fff0da",
      bold = true,

      centerText = false,
      leftIcon = null,
      rightIcon = null,
    } = opts;

    const iconSize =
      leftIcon || rightIcon ? (this.isMobileView() ? 16 : 18) : 0;
    const iconGap = leftIcon || rightIcon ? 8 : 0;

    ctx.save();

    // Font
    ctx.font = `${bold ? "700" : "600"} ${fs}px 'Trebuchet MS', sans-serif`;

    // Measure final width
    const t = String(text ?? "");
    const textW = ctx.measureText(t).width;
    const leftIconSpace = leftIcon ? iconSize + iconGap : 0;
    const rightIconSpace = rightIcon ? iconGap + iconSize : 0;
    const pillW = Math.max(
      minW,
      Math.ceil(padX * 2 + leftIconSpace + textW + rightIconSpace),
    );

    const rx = x;
    const ry = y - h / 2;

    // Background
    ctx.fillStyle = bg;
    this.roundRect(ctx, rx, ry, pillW, h, radius);
    ctx.fill();

    // Accent inner wash
    ctx.fillStyle = accent;
    this.roundRect(ctx, rx + 1, ry + 1, pillW - 2, h - 2, radius - 1);
    ctx.fill();

    // Border
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    this.roundRect(ctx, rx + 1, ry + 1, pillW - 2, h - 2, radius - 1);
    ctx.stroke();

    // Ensure proper centering
    ctx.textBaseline = "middle";

    // Icon
    let contentX = rx + padX;
    if (leftIcon && hasRenderableImage(leftIcon)) {
      ctx.drawImage(leftIcon, contentX, y - iconSize / 2, iconSize, iconSize);
      contentX += iconSize + iconGap;
    }

    // Text
    ctx.fillStyle = textColor;
    if (bright) {
      ctx.shadowColor = "rgba(77, 45, 18, 0.55)";
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = this.shadowBlurValue(2);
    }
    if (centerText) {
      ctx.textAlign = "center";
      ctx.fillText(t, rx + pillW / 2, y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(t, contentX, y);
    }
    if (bright) {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    if (rightIcon && hasRenderableImage(rightIcon)) {
      const rightX = rx + pillW - padX - iconSize;
      ctx.drawImage(rightIcon, rightX, y - iconSize / 2, iconSize, iconSize);
    }

    ctx.restore();
    return pillW;
  }

  drawHudHeartsCompact(x, y, hearts, maxHearts) {
    const ctx = this.ctx;
    const lifeImg = getImage(UI_IMAGES.hearts);
    const mobile = this.isMobileView();
    const size = mobile ? 20 : 22;
    const spacing = mobile ? 22 : 26;

    if (hasRenderableImage(lifeImg)) {
      const iconY = y - size / 2;
      ctx.save();
      for (let i = 0; i < maxHearts; i += 1) {
        ctx.globalAlpha = i < hearts ? 1 : 0.22;
        ctx.drawImage(lifeImg, x + i * spacing, iconY, size, size);
      }
      ctx.restore();
      return;
    }

    // Fallback unicode
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = `700 ${mobile ? 16 : 18}px 'Trebuchet MS', sans-serif`;
    for (let i = 0; i < maxHearts; i += 1) {
      ctx.fillStyle = i < hearts ? "#ff6b7a" : "rgba(255,255,255,0.18)";
      ctx.fillText("\u2665", x + i * spacing, y + 1);
    }
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    const radius = Math.max(2, Math.min(r || 0, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  drawCooldownRing(x, y, label, cdLeft, cdMax) {
    const ctx = this.ctx;
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${this.hudFontSize()}px 'Trebuchet MS', sans-serif`;
    ctx.fillText(label, x - 3, y + 4);
    ctx.strokeStyle = "#31445c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    const ratio = cdMax <= 0 ? 1 : clamp(1 - cdLeft / cdMax, 0, 1);
    ctx.strokeStyle = "#7fe2ff";
    ctx.beginPath();
    ctx.arc(x, y, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }

  drawHudHearts(rightX, y, hearts, maxHearts) {
    const ctx = this.ctx;
    const lifeImg = getImage(UI_IMAGES.hearts);
    const size = 32;
    const spacing = 34;
    const startX = rightX - maxHearts * spacing;

    if (hasRenderableImage(lifeImg)) {
      const iconY = y - 27;
      ctx.save();
      for (let i = 0; i < maxHearts; i += 1) {
        ctx.globalAlpha = i < hearts ? 1 : 0.24;
        ctx.drawImage(lifeImg, startX + i * spacing, iconY, size, size);
      }
      ctx.restore();
      return;
    }

    ctx.textAlign = "left";
    ctx.font = `700 ${size}px 'Trebuchet MS', sans-serif`;
    for (let i = 0; i < maxHearts; i += 1) {
      ctx.fillStyle = i < hearts ? "#ff6b7a" : "rgba(255,255,255,0.22)";
      ctx.fillText("\u2665", startX + i * spacing, y);
    }
  }

  getThrowCooldown() {
    return 0.58;
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    const cw = this.canvas._logicalWidth ?? this.canvas.width;
    const ch = this.canvas._logicalHeight ?? this.canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;
    const mobile = this.isMobileView();
    const panelBorder = "rgba(228, 182, 112, 0.42)";
    const iconColor = "#fff0da";

    // Warm vignette overlay
    const overlayGradient = ctx.createLinearGradient(0, 0, 0, ch);
    overlayGradient.addColorStop(0, "rgba(44,25,12,0.56)");
    overlayGradient.addColorStop(1, "rgba(18,10,6,0.72)");
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, cw, ch);

    // Panel dimensions – smaller on mobile/tablet to match smaller text
    const panelW = mobile ? Math.min(300, cw - 32) : 380;
    const panelH = mobile ? 168 : 200;
    const radius = mobile ? 14 : 16;
    const px = cx - panelW / 2;
    const py = cy - panelH / 2;

    // Panel shadow
    ctx.save();
    ctx.shadowColor = "rgba(48,26,9,0.42)";
    ctx.shadowBlur = this.shadowBlurValue(mobile ? 20 : 28);
    ctx.shadowOffsetY = mobile ? 6 : 8;
    ctx.fillStyle = "rgba(44,28,17,0.95)";
    this.roundRect(ctx, px, py, panelW, panelH, radius);
    ctx.fill();
    ctx.restore();

    // Panel fill
    const panelFill = ctx.createLinearGradient(px, py, px, py + panelH);
    panelFill.addColorStop(0, "rgba(96,61,31,0.96)");
    panelFill.addColorStop(0.48, "rgba(63,39,22,0.97)");
    panelFill.addColorStop(1, "rgba(34,21,12,0.98)");
    ctx.fillStyle = panelFill;
    this.roundRect(ctx, px, py, panelW, panelH, radius);
    ctx.fill();

    // Border
    ctx.strokeStyle = panelBorder;
    ctx.lineWidth = 1;
    this.roundRect(ctx, px, py, panelW, panelH, radius);
    ctx.stroke();

    // Top accent line
    const accentPad = mobile ? 36 : 48;
    const accentY = py + (mobile ? 44 : 52);
    const g = ctx.createLinearGradient(
      px + accentPad,
      0,
      px + panelW - accentPad,
      0,
    );
    g.addColorStop(0, "rgba(235,188,118,0)");
    g.addColorStop(0.5, "rgba(245,210,158,0.5)");
    g.addColorStop(1, "rgba(235,188,118,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + accentPad, accentY);
    ctx.lineTo(px + panelW - accentPad, accentY);
    ctx.stroke();

    // Title – scaled for mobile/tablet
    const titleFont = mobile ? 28 : 44;
    ctx.fillStyle = "#fff3df";
    ctx.font = `700 ${titleFont}px Consolas, Menlo, Monaco, 'Courier New', monospace`;
    const titleText = "PAUSED";
    ctx.fillText(
      titleText,
      cx - ctx.measureText(titleText).width / 2,
      cy - (mobile ? 28 : 38),
    );

    // Play, Restart, and Exit (main menu) icon buttons side by side – compact size
    const btnSize = mobile ? 52 : 44;
    const btnGap = mobile ? 12 : 14;
    const totalW = btnSize * 3 + btnGap * 2;
    const by = cy + (mobile ? 20 : 20);
    const playX = cx - totalW / 2;
    const restartX = playX + btnSize + btnGap;
    const exitX = restartX + btnSize + btnGap;
    const half = btnSize / 2;
    const hitPad = mobile ? 14 : 6;
    const playRect = {
      x: playX - hitPad,
      y: by - half - hitPad,
      w: btnSize + hitPad * 2,
      h: btnSize + hitPad * 2,
    };
    const restartRect = {
      x: restartX - hitPad,
      y: by - half - hitPad,
      w: btnSize + hitPad * 2,
      h: btnSize + hitPad * 2,
    };
    const exitRect = {
      x: exitX - hitPad,
      y: by - half - hitPad,
      w: btnSize + hitPad * 2,
      h: btnSize + hitPad * 2,
    };
    const pointer = this.input?.pointer;
    const mx = pointer?.x ?? -1;
    const my = pointer?.y ?? -1;
    const inRect = (rect) =>
      rect &&
      mx >= rect.x &&
      mx <= rect.x + rect.w &&
      my >= rect.y &&
      my <= rect.y + rect.h;
    const hoverPlay = inRect(playRect);
    const hoverRestart = inRect(restartRect);
    const hoverExit = inRect(exitRect);
    if (this.canvas && this.canvas.style) {
      this.canvas.style.cursor =
        hoverPlay || hoverRestart || hoverExit ? "pointer" : "default";
    }

    const drawPlayIcon = (bx, byCenter, size) => {
      const s = size * 0.36;
      const cxIcon = bx + half;
      ctx.beginPath();
      ctx.moveTo(cxIcon - s * 0.5, byCenter - s);
      ctx.lineTo(cxIcon - s * 0.5, byCenter + s);
      ctx.lineTo(cxIcon + s * 0.9, byCenter);
      ctx.closePath();
      ctx.fill();
    };

    const drawRestartIcon = (bx, byCenter, size) => {
      const r = size * 0.26;
      const cxIcon = bx + half;
      const cyIcon = byCenter;
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cxIcon, cyIcon, r, 0.4 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
      const endAngle = 1.85 * Math.PI;
      const ax = cxIcon + r * Math.cos(endAngle);
      const ay = cyIcon + r * Math.sin(endAngle);
      const ah = size * 0.14;
      const dx = Math.cos(endAngle + 0.5);
      const dy = Math.sin(endAngle + 0.5);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - dx * ah - dy * ah * 0.4, ay - dy * ah + dx * ah * 0.4);
      ctx.lineTo(ax - dx * ah * 0.3, ay - dy * ah * 0.3);
      ctx.closePath();
      ctx.fill();
    };

    const drawExitIcon = (bx, byCenter, size) => {
      const s = size * 0.3;
      const cxIcon = bx + half;
      const lw = Math.max(1.5, size * 0.08);
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const left = cxIcon - s * 0.5;
      const right = cxIcon + s * 0.55;
      const top = byCenter - s * 0.7;
      const bottom = byCenter + s * 0.7;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.stroke();
      const arrowY = byCenter;
      const arrowStart = cxIcon - s * 0.15;
      const arrowEnd = left - s * 0.35;
      ctx.beginPath();
      ctx.moveTo(arrowStart, arrowY);
      ctx.lineTo(arrowEnd, arrowY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowEnd, arrowY);
      ctx.lineTo(arrowEnd + s * 0.35, arrowY - s * 0.3);
      ctx.lineTo(arrowEnd + s * 0.35, arrowY + s * 0.3);
      ctx.closePath();
      ctx.fill();
    };

    [playX, restartX, exitX].forEach((bx, i) => {
      const byTop = by - half;
      const isHovered =
        (i === 0 && hoverPlay) ||
        (i === 1 && hoverRestart) ||
        (i === 2 && hoverExit);
      ctx.save();
      this.roundRect(ctx, bx, byTop, btnSize, btnSize, half);
      ctx.clip();
      const buttonFill = ctx.createLinearGradient(0, byTop, 0, byTop + btnSize);
      buttonFill.addColorStop(
        0,
        isHovered ? "rgba(222,155,84,0.98)" : "rgba(194,132,72,0.92)",
      );
      buttonFill.addColorStop(
        1,
        isHovered ? "rgba(144,87,42,0.98)" : "rgba(120,74,38,0.96)",
      );
      ctx.fillStyle = buttonFill;
      ctx.fillRect(bx, byTop, btnSize, btnSize);
      ctx.fillStyle = isHovered
        ? "rgba(255,244,220,0.22)"
        : "rgba(255,238,207,0.14)";
      this.roundRect(
        ctx,
        bx + 2,
        byTop + 2,
        btnSize - 4,
        btnSize - 4,
        half - 2,
      );
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = isHovered
        ? "rgba(255,229,183,0.96)"
        : "rgba(245,211,157,0.72)";
      ctx.lineWidth = 2;
      this.roundRect(ctx, bx, byTop, btnSize, btnSize, half);
      ctx.stroke();
      ctx.fillStyle = isHovered ? "#fff8ef" : iconColor;
      ctx.strokeStyle = isHovered ? "#fff8ef" : iconColor;
      if (i === 0) drawPlayIcon(bx, by, btnSize);
      else if (i === 1) drawRestartIcon(bx, by, btnSize);
      else drawExitIcon(bx, by, btnSize);
    });

    this.pausePlayButtonRect = playRect;
    this.pauseRestartButtonRect = restartRect;
    this.pauseExitButtonRect = exitRect;
  }

  drawRespawnOverlay() {
    const ctx = this.ctx;
    const cw = this.canvas._logicalWidth ?? this.canvas.width;
    const ch = this.canvas._logicalHeight ?? this.canvas.height;
    const mobile = this.isMobileView();
    ctx.fillStyle = "rgba(30,0,0,0.4)";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#fff";

    const heartsLeft = Math.max(0, this.player?.currentHearts || 0);
    const maxHearts = Math.max(
      heartsLeft,
      this.player?.maxHearts || FIXED_HERO_HEARTS,
    );
    const line =
      heartsLeft > 0
        ? `Heart lost. Respawning... (${heartsLeft} left)`
        : "No hearts left. Game over.";

    // On mobile: position message higher, smaller text
    const centerY = mobile ? ch * 0.38 : ch / 2;
    const mainFont = mobile ? 22 : 34;
    const heartSize = mobile ? 30 : 42;
    const heartSpacing = mobile ? 34 : 46;

    ctx.font = `700 ${mainFont}px 'Trebuchet MS', sans-serif`;
    const textW = ctx.measureText(line).width;
    ctx.fillText(line, (cw - textW) / 2, centerY - 8);

    const lifeImg = getImage(UI_IMAGES.hearts);
    if (hasRenderableImage(lifeImg)) {
      const totalW = maxHearts * heartSpacing;
      const startX = (cw - totalW) / 2;
      const iconY = centerY + 12;
      ctx.save();
      for (let i = 0; i < maxHearts; i += 1) {
        ctx.globalAlpha = i < heartsLeft ? 1 : 0.22;
        ctx.drawImage(
          lifeImg,
          startX + i * heartSpacing,
          iconY,
          heartSize,
          heartSize,
        );
      }
      ctx.restore();
    } else {
      const filled = "\u2665".repeat(heartsLeft);
      const empty = "\u2661".repeat(Math.max(0, maxHearts - heartsLeft));
      const heartsLine = `${filled}${empty}`;
      ctx.font = `700 ${mobile ? 28 : 44}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = "#ff7786";
      const heartsW = ctx.measureText(heartsLine).width;
      ctx.fillText(
        heartsLine,
        (cw - heartsW) / 2,
        centerY + (mobile ? 44 : 38),
      );
    }
  }

  getDisplayedAxoCoins() {
    return Math.max(0, this.displayCoinCarry + this.getRunAxoCoins());
  }

  setCampaignRunCoinCarry(value) {
    this.displayCoinCarry = Math.max(0, Math.floor(Number(value) || 0));
  }

  getProfileTotalAxoCoins() {
    return Math.max(0, Math.floor(Number(this.profile?.coinsTotal || 0)));
  }

  getRunAxoCoins() {
    return Math.max(0, Math.floor(Number(this.runAxoCoins || 0)));
  }

  drawGameOverOverlay() {
    const ctx = this.ctx;
    const cw = this.canvas._logicalWidth ?? this.canvas.width;
    const ch = this.canvas._logicalHeight ?? this.canvas.height;
    const mobile = this.isMobileView();
    const cx = cw / 2;
    const theme = {
      bgA: "rgba(55,34,16,0.22)",
      bgB: "rgba(16,22,30,0.44)",
      fxPink: "rgba(255, 213, 160, 0.16)",
      fxViolet: "rgba(124, 93, 56, 0.14)",
      fxOrange: "rgba(255, 177, 82, 0.24)",
      shape: "rgba(248, 224, 177, 0.16)",
      titleMain: "#fff9ee",
      titleShadow: "#6e3f22",
      titleAccent: "#e5b27f",
      statBg: "rgba(52, 35, 25, 0.72)",
      statBorder: "rgba(231, 197, 141, 0.3)",
      statValue: "#fff1dc",
      statLabel: "#e2c39c",
      playAgain: "rgba(255, 220, 190, 0.98)",
      retryA: "#f8edd9",
      retryB: "#dfc29a",
      retryText: "#5e371d",
      menuA: "rgba(121, 77, 39, 0.94)",
      menuB: "rgba(83, 50, 24, 0.94)",
      menuText: "#fff1dc",
    };

    const stats = this.gameOverStats || {
      runAxoCoins: this.getDisplayedAxoCoins(),
      highestAxoCoins: this.getProfileTotalAxoCoins(),
      enemies: Math.max(0, Math.floor(this.enemiesDefeated || 0)),
    };

    const blurPx = this.shouldUseExpensiveCanvasEffects() ? 12 : 7;
    const gameOverBgUrl =
      "https://ik.imagekit.io/6rsuaxauw/axo%20quest%20main%20menu/axo%20quest%20banner%201%201%201.webp?updatedAt=1778170517895";
    if (
      !this._gameOverMenuBgImage ||
      this._gameOverMenuBgImage.src !== gameOverBgUrl
    ) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.src = gameOverBgUrl;
      this._gameOverMenuBgImage = img;
    }
    const bgImg =
      this._gameOverMenuBgImage?.complete &&
      this._gameOverMenuBgImage?.naturalWidth > 0
        ? this._gameOverMenuBgImage
        : getImage(gameOverBgUrl) || getImage(UI_IMAGES.gameOverBg);
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.save();
      const bleed = blurPx * 2;
      ctx.filter = `blur(${blurPx}px)`;
      const iw = bgImg.naturalWidth;
      const ih = bgImg.naturalHeight;
      const scale = Math.max((cw + bleed * 2) / iw, (ch + bleed * 2) / ih);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const dx = (cw - drawW) * 0.5;
      const dy = (ch - drawH) * 0.5;
      ctx.drawImage(bgImg, dx, dy, drawW, drawH);
      ctx.filter = "none";
      ctx.restore();
    }

    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, theme.bgA);
    bg.addColorStop(1, theme.bgB);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    const pinkGlow = ctx.createRadialGradient(
      cw * 0.5,
      ch * 0.46,
      24,
      cw * 0.5,
      ch * 0.46,
      Math.max(cw, ch) * 0.62,
    );
    pinkGlow.addColorStop(0, theme.fxPink);
    pinkGlow.addColorStop(1, "rgba(90,100,120,0)");
    ctx.fillStyle = pinkGlow;
    ctx.fillRect(0, 0, cw, ch);

    const orangeGlow = ctx.createRadialGradient(
      cw * 0.62,
      ch * 0.5,
      20,
      cw * 0.62,
      ch * 0.5,
      Math.max(cw, ch) * 0.35,
    );
    orangeGlow.addColorStop(0, theme.fxOrange);
    orangeGlow.addColorStop(1, "rgba(140,145,155,0)");
    ctx.fillStyle = orangeGlow;
    ctx.fill();

    const nowSec =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) *
      0.001;
    ctx.textAlign = "center";

    const titleY = ch * (mobile ? 0.36 : 0.4);
    const titlePulse = 1 + Math.sin(nowSec * 3.1) * 0.018;
    const titleFloat = Math.sin(nowSec * 2.4) * (mobile ? 1.8 : 2.8);
    const glitchX = Math.sin(nowSec * 18) * (mobile ? 0.9 : 1.5);
    let titleSize = mobile ? 62 : 116;
    ctx.font = `900 ${titleSize}px 'Trebuchet MS', sans-serif`;
    while (titleSize > 40 && ctx.measureText("GAME OVER").width > cw * 0.78) {
      titleSize -= 2;
      ctx.font = `900 ${titleSize}px 'Trebuchet MS', sans-serif`;
    }
    ctx.save();
    ctx.translate(cx, titleY + titleFloat);
    ctx.scale(titlePulse, titlePulse);
    ctx.translate(-cx, -titleY);
    ctx.font = `900 ${titleSize}px 'Trebuchet MS', sans-serif`;
    ctx.fillStyle = theme.titleShadow;
    ctx.fillText(
      "GAME OVER",
      cx + (mobile ? 3 : 5) + glitchX * 0.55,
      titleY + (mobile ? 2 : 4),
    );
    ctx.fillStyle = theme.titleAccent;
    ctx.fillText(
      "GAME OVER",
      cx + (mobile ? 1 : 2) + glitchX * 0.35,
      titleY + (mobile ? 1 : 2),
    );
    ctx.fillStyle = theme.titleMain;
    ctx.shadowColor = "rgba(255, 175, 94, 0.78)";
    ctx.shadowBlur = this.shadowBlurValue(mobile ? 20 : 30);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText("GAME OVER", cx, titleY);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.restore();

    const statY = titleY + (mobile ? 34 : 48);
    const statCardW = mobile ? 144 : 212;
    const statCardH = mobile ? 58 : 72;
    const statGap = mobile ? 12 : 18;
    const statX1 = cx - statGap / 2 - statCardW;
    const statX2 = cx + statGap / 2;
    const drawStatCard = (x, value, label, iconKind) => {
      this.roundRect(ctx, x, statY, statCardW, statCardH, 14);
      ctx.fillStyle = theme.statBg;
      ctx.fill();
      ctx.strokeStyle = theme.statBorder;
      ctx.lineWidth = 2;
      this.roundRect(ctx, x + 1, statY + 1, statCardW - 2, statCardH - 2, 13);
      ctx.stroke();

      const iconSize = mobile ? 16 : 20;
      const rowY = statY + statCardH * 0.43;
      const labelY = statY + statCardH - (mobile ? 10 : 12);
      const valueText = String(value);
      ctx.font = `700 ${mobile ? 20 : 28}px 'Trebuchet MS', sans-serif`;
      const valueW = ctx.measureText(valueText).width;
      const iconGap = mobile ? 6 : 8;
      const rowW = iconSize + iconGap + valueW;
      const rowX = x + (statCardW - rowW) * 0.5;
      const iconX = rowX;
      const iconY = rowY - iconSize * 0.5;
      const valueX = iconX + iconSize + iconGap;

      if (iconKind === "coin") {
        const axoIcon = getImage(UI_IMAGES.axocoin);
        if (hasRenderableImage(axoIcon)) {
          ctx.drawImage(axoIcon, iconX, iconY, iconSize, iconSize);
        } else {
          ctx.fillStyle = "#ffd48a";
          ctx.beginPath();
          ctx.arc(
            iconX + iconSize * 0.5,
            iconY + iconSize * 0.5,
            iconSize * 0.45,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      } else {
        const ex = iconX + iconSize * 0.5;
        const ey = iconY + iconSize * 0.5;
        const r = iconSize * 0.44;
        ctx.strokeStyle = "rgba(180,210,240,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.9, ey);
        ctx.lineTo(ex + r * 0.9, ey);
        ctx.moveTo(ex, ey - r * 0.9);
        ctx.lineTo(ex, ey + r * 0.9);
        ctx.stroke();
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = theme.statValue;
      ctx.font = `700 ${mobile ? 20 : 28}px 'Trebuchet MS', sans-serif`;
      ctx.fillText(valueText, valueX, rowY + (mobile ? 1 : 1));
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = theme.statLabel;
      ctx.font = `700 ${mobile ? 10 : 12}px 'Trebuchet MS', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, x + statCardW * 0.5, labelY);
      ctx.textAlign = "left";
    };
    drawStatCard(statX1, stats.runAxoCoins, "COLLECTED COINS", "coin");
    drawStatCard(statX2, stats.highestAxoCoins, "BEST COINS", "coin");

    ctx.textAlign = "center";
    ctx.fillStyle = theme.playAgain;
    ctx.font = `800 ${mobile ? 22 : 32}px 'Trebuchet MS', sans-serif`;
    const playAgainY = statY + statCardH + (mobile ? 34 : 48);
    ctx.fillText("PLAY AGAIN?", cx, playAgainY);

    const btnY = playAgainY + (mobile ? 18 : 24);
    const retryW = mobile ? 122 : 162;
    const menuW = mobile ? 166 : 212;
    const btnH = mobile ? 38 : 44;
    const btnGap = mobile ? 10 : 12;
    const totalW = retryW + menuW + btnGap;
    const retryX = cx - totalW / 2;
    const menuX = retryX + retryW + btnGap;
    const hitPadX = mobile ? 10 : 8;
    const hitPadY = mobile ? 10 : 8;

    const retryRect = {
      x: retryX - hitPadX,
      y: btnY - hitPadY,
      w: retryW + hitPadX * 2,
      h: btnH + hitPadY * 2,
    };
    const menuRect = {
      x: menuX - hitPadX,
      y: btnY - hitPadY,
      w: menuW + hitPadX * 2,
      h: btnH + hitPadY * 2,
    };
    const p = this.input?.pointer;
    const mx = p?.x ?? -1;
    const my = p?.y ?? -1;
    const inRect = (r) =>
      r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    const hoverRetry = inRect(retryRect);
    const hoverMenu = inRect(menuRect);
    if (this.canvas && this.canvas.style) {
      this.canvas.style.cursor =
        hoverRetry || hoverMenu ? "pointer" : "default";
    }

    const retryGrad = ctx.createLinearGradient(retryX, 0, retryX + retryW, 0);
    if (hoverRetry) {
      retryGrad.addColorStop(0, "#fff5e5");
      retryGrad.addColorStop(1, "#ead1ab");
    } else {
      retryGrad.addColorStop(0, theme.retryA);
      retryGrad.addColorStop(1, theme.retryB);
    }
    ctx.fillStyle = retryGrad;
    this.roundRect(ctx, retryX, btnY, retryW, btnH, btnH / 2);
    ctx.fill();
    ctx.strokeStyle = hoverRetry
      ? "rgba(255, 250, 238, 0.72)"
      : "rgba(255, 236, 206, 0.38)";
    ctx.lineWidth = 2;
    this.roundRect(
      ctx,
      retryX + 1,
      btnY + 1,
      retryW - 2,
      btnH - 2,
      btnH / 2 - 1,
    );
    ctx.stroke();

    const menuGrad = ctx.createLinearGradient(menuX, 0, menuX + menuW, 0);
    if (hoverMenu) {
      menuGrad.addColorStop(0, "rgba(145, 94, 49, 0.98)");
      menuGrad.addColorStop(1, "rgba(101, 61, 29, 0.98)");
    } else {
      menuGrad.addColorStop(0, theme.menuA);
      menuGrad.addColorStop(1, theme.menuB);
    }
    ctx.fillStyle = menuGrad;
    this.roundRect(ctx, menuX, btnY, menuW, btnH, btnH / 2);
    ctx.fill();
    ctx.strokeStyle = hoverMenu
      ? "rgba(255, 228, 176, 0.78)"
      : "rgba(239, 191, 119, 0.48)";
    this.roundRect(ctx, menuX + 1, btnY + 1, menuW - 2, btnH - 2, btnH / 2 - 1);
    ctx.stroke();

    ctx.fillStyle = theme.retryText;
    ctx.font = `700 ${mobile ? 20 : 24}px 'Trebuchet MS', sans-serif`;
    ctx.fillText("RETRY", retryX + retryW / 2, btnY + btnH * 0.67);
    ctx.fillStyle = theme.menuText;
    ctx.font = `700 ${mobile ? 16 : 21}px 'Trebuchet MS', sans-serif`;
    ctx.fillText("MAIN MENU", menuX + menuW / 2, btnY + btnH * 0.67);

    ctx.textAlign = "left";

    this.gameOverRetryButtonRect = {
      x: retryX - hitPadX,
      y: btnY - hitPadY,
      w: retryW + hitPadX * 2,
      h: btnH + hitPadY * 2,
    };
    this.gameOverMenuButtonRect = {
      x: menuX - hitPadX,
      y: btnY - hitPadY,
      w: menuW + hitPadX * 2,
      h: btnH + hitPadY * 2,
    };
  }

  drawBossIntroOverlay() {
    const ctx = this.ctx;
    const cw = this.canvas._logicalWidth ?? this.canvas.width;
    const ch = this.canvas._logicalHeight ?? this.canvas.height;
    const mobile = this.isMobileView();
    const alpha = clamp(this.bossIntroTimer / BOSS_ENTRY_UI_DURATION_SEC, 0, 1);
    const panelW = Math.min(680, cw - (mobile ? 24 : 80));
    const panelX = (cw - panelW) / 2;
    const panelH = mobile ? 88 : 96;
    const panelY = mobile ? Math.min(80, ch * 0.22) : 120;
    const radius = mobile ? 18 : 20;
    const theme = this.getBossIntroTheme();

    const overlayGradient = ctx.createLinearGradient(0, 78, 0, ch);
    overlayGradient.addColorStop(0, theme.overlayTop(alpha));
    overlayGradient.addColorStop(1, theme.overlayBottom(alpha));
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 78, cw, ch - 78);

    ctx.save();
    ctx.shadowColor = theme.shadow;
    ctx.shadowBlur = this.shadowBlurValue(mobile ? 18 : 26);
    ctx.shadowOffsetY = mobile ? 6 : 8;
    ctx.fillStyle = theme.shadowFill;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
    ctx.fill();
    ctx.restore();

    const panelFill = ctx.createLinearGradient(
      panelX,
      panelY,
      panelX,
      panelY + panelH,
    );
    panelFill.addColorStop(0, theme.panelTop);
    panelFill.addColorStop(0.48, theme.panelMid);
    panelFill.addColorStop(1, theme.panelBottom);
    ctx.fillStyle = panelFill;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
    ctx.fill();

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = mobile ? 2 : 3;
    this.roundRect(ctx, panelX + 1.5, panelY + 1.5, panelW - 3, panelH - 3, radius - 1);
    ctx.stroke();

    const titleFont = mobile ? 18 : 26;
    const bossFont = mobile ? 22 : 34;
    ctx.textAlign = "center";
    ctx.fillStyle = theme.title;
    ctx.font = `700 ${titleFont}px 'Trebuchet MS', sans-serif`;
    ctx.fillText("BOSS AREA", cw / 2, panelY + (mobile ? 32 : 38));
    ctx.font = `700 ${bossFont}px 'Trebuchet MS', sans-serif`;
    ctx.fillStyle = theme.notice;
    ctx.fillText(
      this.bossIntroTitle || BOSS_ENTRY_NOTICE_TEXT,
      cw / 2,
      panelY + (mobile ? 64 : 76),
    );
    ctx.textAlign = "left";
  }

  getBossIntroTheme() {
    return {
      overlayTop: (alpha) => `rgba(82,52,18,${0.3 + 0.18 * alpha})`,
      overlayBottom: (alpha) => `rgba(24,14,8,${0.62 + 0.2 * alpha})`,
      shadow: "rgba(74,38,8,0.42)",
      shadowFill: "rgba(53,31,15,0.94)",
      panelTop: "rgba(145,98,48,0.96)",
      panelMid: "rgba(102,64,28,0.97)",
      panelBottom: "rgba(56,32,14,0.98)",
      border: "rgba(245,211,152,0.84)",
      accent: "rgba(255,224,157,0.96)",
      title: "rgba(255,244,225,0.96)",
      notice: "rgba(255,216,116,0.98)",
    };
  }

  // drawLevelClearOverlay() {
  //   const ctx = this.ctx;
  //   const cw = this.canvas._logicalWidth ?? this.canvas.width;
  //   const ch = this.canvas._logicalHeight ?? this.canvas.height;
  //   const mobile = this.isMobileView();
  //   const progress = clamp(
  //     1 - this.levelClearTimer / LEVEL_CLEAR_TRANSITION_SEC,
  //     0,
  //     1,
  //   );
  //   const eased = 1 - Math.pow(1 - progress, 2.4);
  //   const panelW = Math.min(700, cw - (mobile ? 24 : 92));
  //   const panelH = mobile ? 100 : 118;
  //   const targetY = mobile ? ch * 0.28 : ch * 0.31;
  //   const startY = targetY - 30;
  //   const panelY = startY + 30 * eased;
  //   const panelX = (cw - panelW) / 2;

  //   ctx.fillStyle = `rgba(6,10,16,${0.3 + 0.24 * progress})`;
  //   ctx.fillRect(0, 78, cw, ch - 78);

  //   ctx.fillStyle = `rgba(14,34,58,${0.72 + 0.2 * progress})`;
  //   ctx.fillRect(panelX, panelY, panelW, panelH);
  //   ctx.strokeStyle = `rgba(176,232,255,${0.72 + 0.24 * progress})`;
  //   ctx.lineWidth = mobile ? 2 : 3;
  //   ctx.strokeRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);

  //   const winFont = mobile ? 22 : 34;
  //   const nextFont = mobile ? 15 : 24;
  //   ctx.textAlign = "center";
  //   ctx.fillStyle = `rgba(240,248,255,${0.88 + 0.12 * progress})`;
  //   ctx.font = `700 ${winFont}px 'Trebuchet MS', sans-serif`;
  //   ctx.fillText(
  //     `YOU WIN! LEVEL ${this.levelId}`,
  //     cw / 2,
  //     panelY + (mobile ? 38 : 46),
  //   );

  //   ctx.font = `700 ${nextFont}px 'Trebuchet MS', sans-serif`;
  //   ctx.fillStyle = `rgba(255,213,130,${0.88 + 0.12 * progress})`;
  //   ctx.fillText("NEXT LEVEL STARTING...", cw / 2, panelY + (mobile ? 68 : 84));

  //   const barW = panelW - (mobile ? 40 : 58);
  //   const barH = mobile ? 5 : 7;
  //   const barX = panelX + (mobile ? 20 : 29);
  //   const barY = panelY + panelH - (mobile ? 12 : 14);
  //   ctx.fillStyle = "rgba(255,255,255,0.16)";
  //   ctx.fillRect(barX, barY, barW, barH);
  //   ctx.fillStyle = "rgba(132,225,255,0.92)";
  //   ctx.fillRect(barX, barY, barW * progress, barH);
  //   ctx.textAlign = "left";
  // }

  drawZone(zone) {
    const ctx = this.ctx;
    const alpha = Math.min(0.45, (zone.life / zone.maxLife) * 0.45);
    ctx.fillStyle = `rgba(${zone.rgb},${alpha})`;
    ctx.beginPath();
    ctx.arc(
      zone.x - this.camera.x,
      zone.y - this.camera.y,
      zone.radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  drawTelegraph(t) {
    const ctx = this.ctx;
    ctx.strokeStyle = t.color;
    ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x - this.camera.x, t.y - this.camera.y, t.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawHeroProjectile(proj) {
    const ctx = this.ctx;
    const x = proj.x - this.camera.x;
    const y = proj.y - this.camera.y;
    const shuriken = getImage(UI_IMAGES.throwShuriken);

    if (shuriken) {
      const size = Math.max(22, proj.radius * 2.6);
      const heading = Math.atan2(proj.vy || 0, proj.vx || 1);
      const spin = (proj.traveled || 0) * 0.18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading + spin);
      ctx.drawImage(shuriken, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    const innerRadius = Math.max(3, proj.radius - 1);

    ctx.fillStyle = colorWithAlpha(proj.color, 0.88);
    ctx.beginPath();
    ctx.arc(x, y, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha(proj.color, 0.98);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawBossProjectile(proj) {
    const ctx = this.ctx;
    const x = proj.x - this.camera.x;
    const y = proj.y - this.camera.y;
    const innerRadius = Math.max(3, proj.radius - 1);
    const isBeam = proj.kind === "beam";
    const sprite =
      typeof proj.spritePath === "string" ? getImage(proj.spritePath) : null;

    if (isBeam && !hasRenderableImage(sprite)) {
      const velocity = Math.hypot(proj.vx || 0, proj.vy || 0) || 1;
      const nx = (proj.vx || 0) / velocity;
      const ny = (proj.vy || 0) / velocity;
      const maxTail = Math.max(
        proj.radius * 4,
        Number.isFinite(proj.trailLength) ? proj.trailLength : 64,
      );
      const distFromOrigin =
        Number.isFinite(proj.originX) && Number.isFinite(proj.originY)
          ? Math.max(
              0,
              (proj.x - proj.originX) * nx + (proj.y - proj.originY) * ny,
            )
          : maxTail;
      const tail = Math.min(maxTail, distFromOrigin);
      const tailX = x - nx * tail;
      const tailY = y - ny * tail;

      ctx.strokeStyle = colorWithAlpha(proj.color, 0.36);
      ctx.lineWidth = Math.max(8, proj.radius * 1.25);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.strokeStyle = colorWithAlpha("#d8f6ff", 0.9);
      ctx.lineWidth = Math.max(3, proj.radius * 0.44);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    if (hasRenderableImage(sprite)) {
      const baseSize = Math.max(14, proj.radius * 2);
      const spriteScale =
        Number.isFinite(proj.spriteScale) && proj.spriteScale > 0
          ? proj.spriteScale
          : 1;
      const size = baseSize * spriteScale;
      const heading = Math.atan2(proj.vy || 0, proj.vx || 1);
      const spinRate = Number.isFinite(proj.spinRate) ? proj.spinRate : 0.03;
      const spin = (proj.traveled || 0) * spinRate;
      const frameCount = Math.max(1, Number(proj.spriteFrameCount) || 1);
      const frameFps = Math.max(1, Number(proj.spriteFps) || 8);
      const frameNowSec =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) *
        0.001;
      const spawnTimeSec = Number(proj.spawnTimeSec);
      const animElapsedSec = Number.isFinite(spawnTimeSec)
        ? Math.max(0, frameNowSec - spawnTimeSec)
        : frameNowSec;
      const animFrame = Math.floor(animElapsedSec * frameFps);
      const frameIndex =
        frameCount <= 1
          ? 0
          : proj.spriteLoop === false
            ? Math.min(frameCount - 1, animFrame)
            : animFrame % frameCount;
      const frameW = sprite.width / frameCount;
      const sx = frameIndex * frameW;
      const frameAspect = sprite.height / Math.max(1, frameW);
      const drawW = size;
      const drawH = size * frameAspect;
      // Ground skulls should sit on the floor line using sprite bottom, not sprite center.
      const drawY =
        proj.groundSkull && Number.isFinite(proj.floorY)
          ? proj.floorY - this.camera.y - drawH * 0.5
          : y;
      const orientToVelocity = proj.orientToVelocity !== false;
      ctx.save();
      ctx.translate(x, drawY);
      if (proj.groundSkull) {
        // Ground skull should visually turn around when it reverses chase direction.
        const groundFacing = Math.sign(proj.vx || 0);
        // Sprite sheet default direction is opposite, so mirror when moving right.
        if (groundFacing > 0) {
          ctx.scale(-1, 1);
        }
      } else if (!orientToVelocity) {
        if ((proj.vx || 0) < 0) {
          ctx.scale(-1, 1);
        }
      } else {
        ctx.rotate(heading + spin);
      }
      ctx.drawImage(
        sprite,
        sx,
        0,
        frameW,
        sprite.height,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH,
      );
      ctx.restore();
      return;
    }

    const fallbackY =
      proj.groundSkull && Number.isFinite(proj.floorY)
        ? proj.floorY - this.camera.y - proj.radius
        : y;
    if (proj.kind === "orb" && this.shouldUseExpensiveCanvasEffects()) {
      const glowRadius = proj.radius * 2.2;
      const glow = ctx.createRadialGradient(
        x,
        fallbackY,
        Math.max(2, proj.radius * 0.35),
        x,
        fallbackY,
        glowRadius,
      );
      glow.addColorStop(0, colorWithAlpha(proj.color, 0.56));
      glow.addColorStop(1, colorWithAlpha(proj.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, fallbackY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = colorWithAlpha(proj.color, 0.9);
    ctx.beginPath();
    ctx.arc(x, fallbackY, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha("#ffebcc", 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, fallbackY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawBossGate() {
    // Arena lock still works via collision bounds; visual red boundary is intentionally hidden.
  }

  updateZoneEffects(dt) {
    compactInPlace(this.zoneEffects, (zone) => {
      zone.life -= dt;
      zone.tick -= dt;
      if (zone.tick <= 0) {
        zone.tick = 0.4;
        const d = distance(this.player.center, zone);
        if (d <= zone.radius) {
          this.player.takeDamage(zone.damage, this);
        }
      }
      return zone.life > 0;
    });
  }

  applyObjectHazards() {
    if (!this.player || this.player.dead) return;
    const hazards = Array.isArray(this.cactusHazards) ? this.cactusHazards : [];
    if (hazards.length === 0) return;

    const heroBounds = this.player.bounds;
    for (const hz of hazards) {
      if (!hz) continue;
      if (rectsOverlap({ x: hz.x, y: hz.y, w: hz.w, h: hz.h }, heroBounds)) {
        this.player.takeDamage(HEART_DAMAGE, this, {
          knockbackX: -this.player.facing * 3,
          knockbackY: -2,
        });
        break;
      }
    }
  }

  handlePlayerEnemyContacts() {
    if (!this.player || this.player.dead) return;

    const player = this.player;
    const playerBounds = player.bounds;
    const isWaterLevel = this.levelData?.world === "water";

    let stompedSkull = null;
    for (const proj of this.bossProjectiles) {
      if (!proj || proj.destroyed || !proj.groundSkull) continue;
      const skullRadius = Math.max(8, Number(proj.radius) || 10);
      const skullBounds = {
        x: proj.x - skullRadius,
        y: proj.y - skullRadius,
        w: skullRadius * 2,
        h: skullRadius * 2,
      };
      if (
        !this.isPlayerHeadStomp(proj, {
          respawnAssist: false,
          targetBounds: skullBounds,
        })
      )
        continue;
      stompedSkull = proj;
      break;
    }

    if (stompedSkull) {
      // Requested behavior: jump-on-skull should destroy the skull instantly.
      stompedSkull.destroyed = true;
      this.createTelegraph(
        stompedSkull.x,
        stompedSkull.y,
        Math.max(16, (Number(stompedSkull.radius) || 10) + 8),
        "rgba(255,198,126,0.88)",
        0.14,
      );
      player.vy = -9.8;
      player.onGround = false;
      player.invincibility = Math.max(player.invincibility, 0.16);
      return;
    }

    let stompTarget = null;
    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const enemyBodyBounds = this.getCombatBodyBounds(enemy, {
        isBoss: false,
      });
      if (
        !this.isPlayerHeadStomp(enemy, {
          respawnAssist: true,
          targetBounds: enemyBodyBounds,
        })
      )
        continue;
      stompTarget = enemy;
      break;
    }

    if (stompTarget) {
      if (isWaterLevel) {
        // Water-world rule: stomping regular enemies hurts hero.
        const push =
          Math.sign(player.center.x - stompTarget.center.x) ||
          player.facing ||
          1;
        player.takeDamage(HEART_DAMAGE, this, {
          knockbackX: push * 2.8,
          knockbackY: -2.1,
        });
        return;
      }
      stompTarget.takeDamage(stompTarget.hp + 9999, this, { direct: true });
      player.vy = -9.8;
      player.onGround = false;
      // Stomp should not also trigger contact damage in the same overlap window.
      player.invincibility = Math.max(player.invincibility, 0.2);
      return;
    }

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const enemyBodyBounds = this.getCombatBodyBounds(enemy, {
        isBoss: false,
      });
      const touchingEnemyBody = rectsOverlap(playerBounds, enemyBodyBounds);
      if (!touchingEnemyBody) continue;
      const push =
        Math.sign(player.center.x - enemy.center.x) || player.facing || 1;
      player.takeDamage(HEART_DAMAGE, this, {
        knockbackX: push * 2.6,
        knockbackY: -2,
      });
      if (player.dead) return;
      // One contact damage event per frame is enough.
      break;
    }

    const bossIsBeachBodyHazard =
      this.levelData?.world === "beach" && this.boss.type === "sandBoss";
    if (
      this.boss.active &&
      !this.boss.dead &&
      (this.boss.engaged || bossIsBeachBodyHazard)
    ) {
      const bossBodyBounds = this.getCombatBodyBounds(this.boss, {
        isBoss: true,
      });
      const stompedBoss = this.isPlayerHeadStomp(this.boss, {
        respawnAssist: false,
        targetBounds: bossBodyBounds,
      });
      const touchingBossBody = rectsOverlap(playerBounds, bossBodyBounds);
      if (stompedBoss || touchingBossBody) {
        if (stompedBoss) {
          const stompDamage = this.applyElementDamage(
            BOSS_STOMP_DAMAGE,
            this.currentElement,
            this.boss.type,
          );
          const damageApplied = this.boss.takeDamage(stompDamage, this, {
            direct: true,
          });
          // Count stomp-chain only when stomp damage actually lands.
          if (
            (damageApplied ||
              (this.levelData?.world === "water" &&
                this.boss.type === "crabBoss")) &&
            typeof this.boss.registerHeadStomp === "function"
          ) {
            this.boss.registerHeadStomp(this, player);
          }
          if (damageApplied) {
            player.onDealDamageToBoss?.(stompDamage);
          }
          player.vy = -10.4;
          player.onGround = false;
          player.invincibility = Math.max(player.invincibility, 0.2);
        } else {
          const push =
            Math.sign(player.center.x - this.boss.center.x) ||
            player.facing ||
            1;
          player.takeDamage(HEART_DAMAGE, this, {
            knockbackX: push * 3.1,
            knockbackY: -2.2,
          });
        }
      }
    }
  }

  drawCoinPickupText(entry) {
    if (!entry) return;
    const ctx = this.ctx;
    const alpha = clamp(entry.life / entry.maxLife, 0, 1);
    const x = entry.x - this.camera.x;
    const y = entry.y - this.camera.y;
    const rgb = String(entry.rgb || "255,206,56");
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "700 20px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.fillText(entry.text, x, y);
  }

  isPlayerHeadStomp(target, options = {}) {
    if (!target) return false;
    const player = this.player;
    const prevBottom = player.prevY + player.h;
    const currBottom = player.y + player.h;
    const prevCenterY = player.prevY + player.h * 0.5;
    const targetBounds =
      options.targetBounds ||
      this.getCombatBodyBounds(target, { isBoss: Boolean(options.isBoss) });
    const targetTop = targetBounds.y;
    const targetH = targetBounds.h;
    const respawnAssist = options.respawnAssist !== false;
    const respawnDropActive = respawnAssist && player.respawnDropTimer > 0;

    const footLeft = player.x + 2;
    const footRight = player.x + player.w - 2;
    const bodyLeft = targetBounds.x + 2;
    const bodyRight = targetBounds.x + targetBounds.w - 2;
    const overlapWidth =
      Math.min(footRight, bodyRight) - Math.max(footLeft, bodyLeft);
    const minFootOverlap = Math.max(
      4,
      Math.min(player.w, targetBounds.w) * 0.12,
    );
    const hasFootOverlap = overlapWidth >= minFootOverlap;

    const topBandRatio = respawnDropActive ? 0.85 : 0.75;
    const topBandBottom = targetTop + targetH * topBandRatio;
    const wasAboveMargin = respawnDropActive ? targetH * 0.9 : 32;
    const wasAboveTop = prevBottom <= targetTop + wasAboveMargin;
    const enteredTopBand =
      currBottom >= targetTop - 6 && currBottom <= topBandBottom;
    const crossedTopMargin = respawnDropActive ? 20 : 18;
    const crossedTop =
      prevBottom <= targetTop + crossedTopMargin && currBottom >= targetTop - 4;
    const descending = player.vy >= -0.12 && player.y >= player.prevY - 1.2;
    const fromAboveRatio = respawnDropActive ? 0.88 : 0.78;
    const fromAbove = prevCenterY <= targetTop + targetH * fromAboveRatio;

    return (
      hasFootOverlap &&
      descending &&
      fromAbove &&
      wasAboveTop &&
      (enteredTopBand || crossedTop)
    );
  }

  getCombatBodyBounds(target, options = {}) {
    const isBoss = Boolean(options.isBoss);
    const xInset = isBoss
      ? Math.min(16, target.w * 0.16)
      : Math.min(12, target.w * 0.2);
    const topInset = isBoss
      ? Math.min(18, target.h * 0.16)
      : Math.min(10, target.h * 0.16);
    const bottomInset = isBoss
      ? Math.min(12, target.h * 0.1)
      : Math.min(8, target.h * 0.1);

    const width = Math.max(8, target.w - xInset * 2);
    const height = Math.max(12, target.h - topInset - bottomInset);
    return {
      x: target.x + xInset,
      y: target.y + topInset,
      w: width,
      h: height,
    };
  }

  updateHeroProjectiles(dt) {
    if (this.heroProjectiles.length === 0) return;
    const frameScale = dt * 60;

    compactInPlace(this.heroProjectiles, (proj) => {
      proj.life -= dt;

      const dx = proj.vx * frameScale;
      const dy = proj.vy * frameScale;
      proj.x += dx;
      proj.y += dy;
      proj.traveled += Math.hypot(dx, dy);

      const expired = proj.life <= 0 || proj.traveled >= proj.range;
      const blocked = false;
      const meltedIce = this.tryMeltIceTileAtProjectile(proj);
      const brokeBrick = this.tryBreakBrickTileAtProjectile(proj);
      const hitTarget = this.findHeroProjectileTarget(proj);

      if (proj.impactRadius > 0) {
        if (expired || blocked || hitTarget || meltedIce || brokeBrick) {
          this.explodeHeroProjectile(proj);
          return false;
        }
        return true;
      }

      if (meltedIce || brokeBrick) {
        return false;
      }

      if (hitTarget) {
        this.applyHeroProjectileHit(proj, hitTarget);
        return false;
      }

      if (expired || blocked) {
        this.createTelegraph(
          proj.x,
          proj.y,
          Math.max(14, proj.radius + 5),
          colorWithAlpha(proj.color, 0.65),
          0.12,
        );
        return false;
      }

      return true;
    });
  }

  tryMeltIceTileAtProjectile(proj) {
    if (!proj || proj.sourceElement !== ELEMENT.FIRE || !this.map) return false;
    const radius = Math.max(2, proj.radius * 0.7);
    const samples = [
      [proj.x, proj.y],
      [proj.x - radius, proj.y],
      [proj.x + radius, proj.y],
      [proj.x, proj.y - radius],
      [proj.x, proj.y + radius],
    ];

    for (const [sx, sy] of samples) {
      const tx = Math.floor(sx / CONST.GAME.TILE);
      const ty = Math.floor(sy / CONST.GAME.TILE);
      if (this.map.getTile(tx, ty) !== TILE.ICE) continue;
      this.map.setTile(tx, ty, TILE.EMPTY);
      this.createTelegraph(
        tx * CONST.GAME.TILE + CONST.GAME.TILE * 0.5,
        ty * CONST.GAME.TILE + CONST.GAME.TILE * 0.5,
        20,
        "rgba(255,160,90,0.92)",
        0.16,
      );
      return true;
    }

    return false;
  }

  tryBreakBrickTileAtProjectile(proj) {
    if (!proj || !this.map) return false;
    if (this.levelData?.world === "water") return false;
    const radius = Math.max(2, proj.radius * 0.7);
    const samples = [
      [proj.x, proj.y],
      [proj.x - radius, proj.y],
      [proj.x + radius, proj.y],
      [proj.x, proj.y - radius],
      [proj.x, proj.y + radius],
    ];

    for (const [sx, sy] of samples) {
      const tx = Math.floor(sx / CONST.GAME.TILE);
      const ty = Math.floor(sy / CONST.GAME.TILE);
      const before = this.map.getTile(tx, ty);
      if (before !== TILE.BRICK && before !== TILE.GIFT_BOX) continue;
      this.onBrickHit(tx, ty, before);
      const after = this.map.getTile(tx, ty);
      if (after !== before) return true;
    }

    return false;
  }

  isProjectileBlocked(proj) {
    const r = Math.max(2, proj.radius * 0.7);
    const samplePoints = [
      [proj.x, proj.y],
      [proj.x - r, proj.y],
      [proj.x + r, proj.y],
      [proj.x, proj.y - r],
      [proj.x, proj.y + r],
    ];

    for (const [sx, sy] of samplePoints) {
      const tile = this.map.getTileAtPixel(sx, sy);
      if (
        tile === TILE.SOLID ||
        tile === TILE.ICE ||
        tile === TILE.BRICK ||
        tile === TILE.GIFT_BOX
      ) {
        return true;
      }
    }

    return false;
  }

  updateBossProjectiles(dt) {
    if (this.bossProjectiles.length === 0) return;
    const frameScale = dt * 60;

    compactInPlace(this.bossProjectiles, (proj) => {
      if (proj.destroyed) {
        if (!proj.silentImpact) {
          this.createTelegraph(
            proj.x,
            proj.y,
            Math.max(16, proj.radius + 6),
            colorWithAlpha(proj.color, 0.8),
            0.14,
          );
        }
        return false;
      }

      if (proj.groundSkull) {
        const targetX = this.player?.center?.x ?? proj.x;
        const chaseDir =
          Math.sign(targetX - proj.x) || Math.sign(proj.vx || 1) || 1;
        proj.vx = chaseDir * Math.max(0.2, Number(proj.groundSpeed) || 1);
        proj.vy = 0;
        if (Number.isFinite(proj.floorY)) {
          const offset = Number.isFinite(proj.groundYOffset)
            ? proj.groundYOffset
            : proj.radius;
          proj.y = proj.floorY - Math.max(0, offset);
        }
      }

      proj.life -= dt;

      const dx = proj.vx * frameScale;
      const dy = proj.vy * frameScale;
      proj.x += dx;
      proj.y += dy;
      proj.traveled += Math.hypot(dx, dy);

      if (proj.groundSkull && Number.isFinite(proj.floorY)) {
        const offset = Number.isFinite(proj.groundYOffset)
          ? proj.groundYOffset
          : proj.radius;
        proj.y = proj.floorY - Math.max(0, offset);
      }

      const expired = proj.groundSkull
        ? proj.life <= 0
        : proj.life <= 0 || proj.traveled >= proj.range;
      const blocked =
        proj.groundSkull || proj.ignoreTerrain
          ? false
          : this.isProjectileBlocked(proj);
      const playerRadius = Math.max(this.player.w, this.player.h) * 0.3;
      const headHit =
        distance(proj, this.player.center) <= proj.radius + playerRadius;
      let beamHit = false;
      if (proj.kind === "beam") {
        const velocity = Math.hypot(proj.vx || 0, proj.vy || 0) || 1;
        const nx = (proj.vx || 0) / velocity;
        const ny = (proj.vy || 0) / velocity;
        const maxTail = Math.max(
          proj.radius * 4,
          Number.isFinite(proj.trailLength) ? proj.trailLength : 64,
        );
        const distFromOrigin =
          Number.isFinite(proj.originX) && Number.isFinite(proj.originY)
            ? Math.max(
                0,
                (proj.x - proj.originX) * nx + (proj.y - proj.originY) * ny,
              )
            : maxTail;
        const tail = Math.min(maxTail, distFromOrigin);
        const x1 = proj.x - nx * tail;
        const y1 = proj.y - ny * tail;
        const x2 = proj.x;
        const y2 = proj.y;
        const beamDist = pointToSegmentDistance(
          this.player.center.x,
          this.player.center.y,
          x1,
          y1,
          x2,
          y2,
        );
        beamHit = beamDist <= proj.radius + playerRadius * 0.7;
      }
      const hitPlayer = headHit || beamHit;

      if (hitPlayer) {
        this.player.takeDamage(proj.damage, this, {
          knockbackX: Math.sign(proj.vx || this.boss.facing || 1) * 2.8,
          knockbackY: -2,
        });
        if (!proj.silentImpact) {
          this.createTelegraph(
            proj.x,
            proj.y,
            Math.max(20, proj.radius * 1.8),
            colorWithAlpha(proj.color, 0.85),
            0.18,
          );
        }
        return false;
      }

      if (expired || blocked) {
        if (!proj.silentImpact) {
          this.createTelegraph(
            proj.x,
            proj.y,
            Math.max(16, proj.radius + 4),
            colorWithAlpha(proj.color, 0.7),
            0.14,
          );
        }
        return false;
      }

      return true;
    });
  }

  findHeroProjectileTarget(proj) {
    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const enemyRadius = Math.max(enemy.w, enemy.h) * 0.3;
      if (distance(proj, enemy.center) <= proj.radius + enemyRadius) {
        return { kind: "enemy", entity: enemy };
      }
    }

    for (const bossProj of this.bossProjectiles) {
      if (!bossProj || bossProj.destroyed) continue;
      if (
        !Number.isFinite(bossProj.hitsToDestroy) ||
        bossProj.hitsToDestroy <= 0
      )
        continue;
      const hitRadius = Math.max(8, Number(bossProj.radius) || 10);
      if (distance(proj, bossProj) <= proj.radius + hitRadius) {
        return { kind: "bossProjectile", projectile: bossProj };
      }
    }

    if (this.boss.active && this.boss.engaged && !this.boss.dead) {
      const bossRadius = Math.max(this.boss.w, this.boss.h) * 0.34;
      if (distance(proj, this.boss.center) <= proj.radius + bossRadius) {
        return { kind: "boss", entity: this.boss };
      }
    }

    return null;
  }

  applyHeroProjectileHit(proj, target) {
    const sourceElement = proj.sourceElement;

    if (target.kind === "bossProjectile") {
      const skull = target.projectile;
      skull.hitsToDestroy = Math.max(0, (Number(skull.hitsToDestroy) || 1) - 1);
      this.createTelegraph(
        skull.x,
        skull.y,
        Math.max(12, (Number(skull.radius) || 8) + 4),
        "rgba(255,198,126,0.88)",
        0.12,
      );
      if (skull.hitsToDestroy <= 0) {
        skull.destroyed = true;
      }
      this.applyOnHitAttunementBonus(sourceElement, proj.effects);
      return;
    }

    if (target.kind === "boss") {
      const finalDamage = this.applyElementDamage(
        proj.damage,
        sourceElement,
        target.entity.type,
      );
      const bossEffects = this.applyBossCoreResistance(
        sourceElement,
        proj.effects,
      );
      const damageApplied = target.entity.takeDamage(
        finalDamage,
        this,
        bossEffects,
      );
      if (damageApplied) {
        proj.source?.onDealDamageToBoss?.(finalDamage);
        this.applyOnHitAttunementBonus(sourceElement, proj.effects);
      }
    } else {
      const finalDamage = this.applyElementDamage(
        proj.damage,
        sourceElement,
        target.entity.type,
      );
      target.entity.takeDamage(finalDamage, this, proj.effects);
      this.applyOnHitAttunementBonus(sourceElement, proj.effects);
    }
  }

  explodeHeroProjectile(proj) {
    const impact = { x: proj.x, y: proj.y };
    if (proj.impactDamage > 0) {
      this.damageEnemiesInRadius(
        impact,
        proj.impactRadius,
        proj.impactDamage,
        proj.source,
        proj.impactOptions,
      );
    }
    if (proj.impactFreezeSec > 0) {
      this.freezeEnemiesInRadius(
        impact,
        proj.impactRadius,
        proj.impactFreezeSec,
      );
    }
  }

  /** Returns the pixel Y of the top of the first solid/one-way tile at (x, py) or below. */
  getSurfaceYAtX(map, x, fromPy) {
    if (!map || typeof map.getTileAtPixel !== "function") return null;
    const t = map.tileSize || CONST.GAME.TILE;
    const levelBottom = (map.height || 0) * t;
    const SOLID_LIKE = new Set([
      TILE.SOLID,
      TILE.ICE,
      TILE.BRICK,
      TILE.GIFT_BOX,
      TILE.ONE_WAY,
    ]);
    for (
      let py = fromPy;
      py <= levelBottom + t;
      py += Math.max(1, Math.floor(t / 2))
    ) {
      const tile = map.getTileAtPixel(x, py);
      if (SOLID_LIKE.has(tile)) {
        const ty = Math.floor(py / t);
        return ty * t;
      }
    }
    return levelBottom;
  }

  getEntitySurfaceYAtX(map, x, fromPy, width) {
    const entityWidth = Math.max(8, Number(width) || 0);
    const inset = Math.max(6, Math.min(18, Math.round(entityWidth * 0.14)));
    const sampleXs = [
      x + inset,
      x + entityWidth * 0.5,
      x + Math.max(inset, entityWidth - inset),
    ];
    let bestSurfaceY = null;

    for (const sampleX of sampleXs) {
      const surfaceY = this.getSurfaceYAtX(map, sampleX, fromPy);
      if (!Number.isFinite(surfaceY)) continue;
      bestSurfaceY =
        bestSurfaceY == null ? surfaceY : Math.min(bestSurfaceY, surfaceY);
    }

    return bestSurfaceY;
  }

  rectOverlapsSolidLike(x, y, w, h) {
    if (!this.map) return false;
    const tileSize = this.map.tileSize || CONST.GAME.TILE;
    const minTx = Math.floor(x / tileSize);
    const maxTx = Math.floor((x + w - 1) / tileSize);
    const minTy = Math.floor(y / tileSize);
    const maxTy = Math.floor((y + h - 1) / tileSize);

    for (let ty = minTy; ty <= maxTy; ty += 1) {
      for (let tx = minTx; tx <= maxTx; tx += 1) {
        const tile = this.map.getTile(tx, ty);
        if (!CHECKPOINT_SAFE_GROUND.has(tile)) continue;
        return true;
      }
    }

    return false;
  }

  resolveWaterEnemySpawnY(enemy, preferredY) {
    if (!enemy || !this.map) return preferredY;

    const minY = CONST.GAME.TILE * 1.15;
    let maxSafeY =
      this.levelData.sizeTiles.h * CONST.GAME.TILE -
      enemy.h -
      CONST.GAME.TILE * 1.9;
    const surfaceY = this.getEntitySurfaceYAtX(
      this.map,
      enemy.x,
      preferredY + enemy.h * 0.35,
      enemy.w,
    );
    if (Number.isFinite(surfaceY)) {
      maxSafeY = Math.min(maxSafeY, surfaceY - 68 - enemy.h);
    }
    maxSafeY = Math.max(minY, maxSafeY);

    const baselineY = clamp(preferredY, minY, maxSafeY);
    const liftStep = Math.max(2, Math.floor(CONST.GAME.TILE * 0.08));
    const maxLift = Math.max(CONST.GAME.TILE * 6, enemy.h + 96);

    for (let offset = 0; offset <= maxLift; offset += liftStep) {
      const candidateY = Math.max(minY, baselineY - offset);
      if (!this.rectOverlapsSolidLike(enemy.x, candidateY, enemy.w, enemy.h)) {
        return candidateY;
      }
    }

    return baselineY;
  }

  resolveWaterEnemySpawnPlacement(enemy) {
    if (!enemy || !this.map) {
      return { x: enemy?.x ?? 0, y: enemy?.y ?? 0 };
    }

    const tileSize = this.map.tileSize || CONST.GAME.TILE;
    const minX = 0;
    const maxX = Math.max(0, this.map.width * tileSize - enemy.w);
    const preferredX = clamp(enemy.x, minX, maxX);
    const preferredY = enemy.y;
    const searchStep = Math.max(12, Math.floor(tileSize * 0.5));
    const maxRange = Math.max(tileSize * 5, enemy.w * 2);
    const offsets = [0];
    for (let d = searchStep; d <= maxRange; d += searchStep) {
      offsets.push(d, -d);
    }

    for (const offset of offsets) {
      const candidateX = clamp(preferredX + offset, minX, maxX);
      const candidateEnemy = { ...enemy, x: candidateX };
      const candidateY = this.resolveWaterEnemySpawnY(
        candidateEnemy,
        preferredY,
      );
      if (
        !this.rectOverlapsSolidLike(candidateX, candidateY, enemy.w, enemy.h)
      ) {
        return { x: candidateX, y: candidateY };
      }
    }

    return {
      x: preferredX,
      y: this.resolveWaterEnemySpawnY({ ...enemy, x: preferredX }, preferredY),
    };
  }

  getWaterCheckpointAnchorY(fallbackY) {
    if (!this.player || !this.map) return fallbackY;
    const sampleX = this.player.x + this.player.w * 0.5;
    const sampleStartY = this.player.y + this.player.h * 0.5;
    const surfaceY = this.getSurfaceYAtX(this.map, sampleX, sampleStartY);
    if (!Number.isFinite(surfaceY)) return fallbackY;
    return surfaceY - this.player.h;
  }

  resolveGroundEnemySpawnY(enemy, preferredY) {
    if (!enemy || !this.map) return preferredY;
    const scanStartY = preferredY + Math.max(8, enemy.h * 0.3);
    const surfaceY = this.getEntitySurfaceYAtX(
      this.map,
      enemy.x,
      scanStartY,
      enemy.w,
    );
    if (!Number.isFinite(surfaceY)) return preferredY;
    return surfaceY - enemy.h;
  }

  spawnEnemy(type, x, y, flags = {}) {
    const forceSpawnDuringArenaLock = flags.forceSpawnDuringArenaLock === true;
    if (this.levelData?.world === "water" && this.arenaLocked) return null;
    if (this.arenaLocked && !forceSpawnDuringArenaLock) return null;
    if (this.enemyPool.countActive() >= this.levelEnemyCap) return null;
    const enemyTypeKey = normalizeEnemyCode(type);
    if (!enemyTypeKey || !ENEMIES[enemyTypeKey]) {
      this.warnEnemyConfigOnce(
        `spawn-unknown:${enemyTypeKey || type || "missing"}`,
        `Skipping runtime spawn for unknown enemy type "${enemyTypeKey || type || "missing"}".`,
        { type, x, y },
      );
      return null;
    }
    const enemy = this.enemyPool.acquire();
    const enemyTypeLowerKey = enemyTypeKey.toLowerCase();
    const runtimeEnemyConfig =
      this.currentLevelEnemyConfigByType?.[enemyTypeKey] ||
      this.currentLevelEnemyConfigByType?.[enemyTypeLowerKey] ||
      null;
    const initialFacing =
      this.levelData?.world === "grave" && enemyTypeKey === "red" ? -1 : null;
    const forceFlyRightToLeft =
      this.levelData?.world === "grave" && enemyTypeKey === "red";
    enemy.reset(enemyTypeKey || type, x, y, {
      ...flags,
      runtimeEnemyConfig,
      initialFacing,
      forceFlyRightToLeft,
    });
    if (
      this.levelData?.world !== "water" &&
      typeof enemy.isFlyingType === "function" &&
      !enemy.isFlyingType()
    ) {
      const groundedY = this.resolveGroundEnemySpawnY(enemy, enemy.y);
      enemy.y = groundedY;
      enemy.spawnY = groundedY;
      enemy.hoverBaseY = groundedY;
    }
    if (
      this.levelData?.world === "water" &&
      typeof enemy.isSwimmingType === "function" &&
      enemy.isSwimmingType()
    ) {
      const tunedSpawn = this.resolveWaterEnemySpawnPlacement(enemy);
      enemy.x = tunedSpawn.x;
      enemy.y = tunedSpawn.y;
      enemy.spawnX = tunedSpawn.x;
      enemy.spawnY = tunedSpawn.y;
      enemy.hoverBaseY = tunedSpawn.y;
      enemy.swimLaneY = tunedSpawn.y;
      enemy.onGround = false;
    }
    return enemy;
  }

  spawnCoin(x, y, value = 1, kind = "axo", life = 0, options = null) {
    const coin = this.coinPool.acquire();
    coin.reset(x, y, value, kind, life, options);
    return coin;
  }

  awardAxoCoins(amount) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (safeAmount <= 0) return 0;
    const remaining = Math.max(0, this.levelCoinCap - this.runAxoCoins);
    const gain = Math.min(safeAmount, remaining);
    if (gain <= 0) return 0;
    this.runAxoCoins += gain;
    this.runCoins = this.runAxoCoins;
    if (typeof this.onAxoCoinsCollected === "function") {
      this.onAxoCoinsCollected(gain);
    }
    return gain;
  }

  collectCoin(coin) {
    if (coin?.kind === "heart") {
      this.collectHeartPickup(coin);
      return;
    }

    coin.active = false;
    this.collectedCoinCount += Math.max(1, Math.floor(Number(coin.value || 1)));
    const valuePerPickup = Math.max(
      1,
      toNonNegativeInt(this.levelCoinValue, DEFAULT_COLLECTIBLE_AXO_VALUE),
    );
    const gain = this.awardAxoCoins((coin.value || 1) * valuePerPickup);
    if (gain > 0) {
      this.coinPickupTexts.push({
        x: coin.x + coin.w * 0.5 - 10,
        y: coin.y - 8,
        text: `+${gain}`,
        life: 0.7,
        maxLife: 0.7,
      });
    }
    this.playSfx("coin");
    const particleBurstCount = this.getCosmeticBurstCount(8, 0.25, 2);
    for (let i = 0; i < particleBurstCount; i += 1) {
      const p = this.particlePool.acquire();
      const color = "rgba(120,235,255,ALPHA)";
      p.reset(coin.x + coin.w * 0.5, coin.y + coin.h * 0.5, color);
    }
  }

  collectHeartPickup(coin) {
    if (!coin) return;
    coin.active = false;
    const previousHp = Math.max(0, Number(this.player?.hp) || 0);
    this.player.hp = Math.min(this.player.maxHp, previousHp + HEART_DAMAGE);
    const restoredHp = Math.max(0, this.player.hp - previousHp);
    this.coinPickupTexts.push({
      x: coin.x + coin.w * 0.5 - 18,
      y: coin.y - 8,
      text: restoredHp > 0 ? "+1 HP" : "HP MAX",
      life: 0.85,
      maxLife: 0.85,
      rgb: "255,126,156",
    });
    this.createTelegraph(
      coin.x + coin.w * 0.5,
      coin.y + coin.h * 0.5,
      34,
      "rgba(255,120,140,0.92)",
      0.45,
    );
    this.playSfx("coin");
    this.showPowerNotice(
      restoredHp > 0 ? "Hidden Heart Restored 1 HP" : "Hidden Heart Collected",
      1.5,
    );
    const particleBurstCount = this.getCosmeticBurstCount(8, 0.25, 2);
    for (let i = 0; i < particleBurstCount; i += 1) {
      const p = this.particlePool.acquire();
      p.reset(
        coin.x + coin.w * 0.5,
        coin.y + coin.h * 0.5,
        "rgba(255,132,156,ALPHA)",
      );
    }
  }

  spawnCoinBurst(x, y, count, kind = "axo", value = 1, life = 0) {
    if (!this.dynamicCoinDrops) return;
    for (let i = 0; i < count; i += 1) {
      const c = this.coinPool.acquire();
      c.reset(
        x + randomRange(-26, 26),
        y + randomRange(-26, 26),
        value,
        kind,
        life,
      );
    }
  }

  onBrickHit(tx, ty, tileId = null) {
    const tile = tileId ?? this.map.getTile(tx, ty);
    if (!isBreakableRewardTile(tile)) return;

    // Keep water boss-arena architecture stable during head-hit collisions.
    if (
      this.levelData?.world === "water" &&
      this.isTileInsideBossArena(tx, ty)
    ) {
      return;
    }

    if (!this.map.useRewardTile(tx, ty)) return;
    const x = tx * CONST.GAME.TILE + 22;
    const y = ty * CONST.GAME.TILE - 14;

    if (tile === TILE.BRICK || tile === TILE.GIFT_BOX) {
      this.updateBrickPuzzle(tx, ty);
    }

    const heartKey = `${tx},${ty}`;
    if (this.hiddenHeartBrickKeys.has(heartKey)) {
      this.hiddenHeartBrickKeys.delete(heartKey);
      this.spawnHiddenHeartPickup(tx, ty);
    }

    // Break the hit box tile (brick or ice) on upward head-hit.
    this.map.setTile(tx, ty, TILE.EMPTY);
    if (Array.isArray(this.levelData?.tiles?.[ty])) {
      this.levelData.tiles[ty][tx] = TILE.EMPTY;
    }
    if (tile === TILE.ICE) {
      this.createTelegraph(x, y, 30, "rgba(180,235,255,0.92)", 0.22);
    }

    // No AxoCoin reward from breaking boxes.
  }

  addAxoCoinsWithPopup(amount, worldX, worldY) {
    const gain = this.awardAxoCoins(amount);
    if (gain <= 0) return;
    this.coinPickupTexts.push({
      x: worldX - 10,
      y: worldY - 8,
      text: `+${gain}`,
      life: 0.9,
      maxLife: 0.9,
    });
    this.playSfx("coin");
  }

  onEnemyKilled(enemy) {
    this.enemiesDefeated += 1;
    if (enemy?.challengeTag === "ice_rebirth_child") {
      if (this.iceRebirthChildrenRemaining > 0) {
        this.iceRebirthChildrenRemaining = Math.max(
          0,
          this.iceRebirthChildrenRemaining - 1,
        );
        if (this.iceRebirthChildrenRemaining <= 0) {
          this.onBossDefeated();
        }
      }
      return;
    }

    const enemyCode = normalizeEnemyCode(enemy?.type);
    if (enemyCode) {
      const nextCount =
        Math.max(0, Math.floor(Number(this.enemyKills[enemyCode] || 0))) + 1;
      this.enemyKills[enemyCode] = nextCount;
    }
    const darkBoost = this.player.getCoreUltKillMultiplier(this);
    if (enemy.cfg.miniBoss) {
      this.player.gainUlt(CONST.ULT.Gain.MiniBossKill * darkBoost);
    } else if (enemy.cfg.elite) {
      this.player.gainUlt(CONST.ULT.Gain.EliteKill * darkBoost);
    } else {
      this.player.gainUlt(CONST.ULT.Gain.BasicKill * darkBoost);
    }

    this.killCombo = this.comboTimer > 0 ? this.killCombo + 1 : 1;
    this.comboTimer = 4.2;
    if (this.killCombo >= 3) {
      const comboUltBonus = Math.min(6, this.killCombo - 1);
      this.player.gainUlt(comboUltBonus);
    }

    const runtimeReward = this.getRuntimeEnemyReward(enemy.type);
    const axoPerKill =
      runtimeReward != null ? runtimeReward : (enemy.cfg?.coins ?? 50);
    this.addAxoCoinsWithPopup(axoPerKill, enemy.center.x, enemy.y);

    this.handleCombatChallengeKill(enemy);
  }

  onPlayerDeath() {
    this.restarting = true;
    this.respawnPending = true;
    this.respawnTimer = this.respawnDelaySec;
    this.killCombo = 0;
    this.comboTimer = 0;
    this.playSfx("heroDeath");
  }

  handleDeathRespawn(dt) {
    if (!this.respawnPending) {
      this.restarting = true;
      this.respawnPending = true;
      this.respawnTimer = this.respawnDelaySec;
    }

    this.respawnTimer = Math.max(0, this.respawnTimer - dt);
    if (this.respawnTimer > 0) return;

    if (this.player.currentHearts <= 0) {
      this.enterGameOver();
      return;
    }

    this.respawnPlayerFromSky();
  }

  respawnPlayerFromSky() {
    const start = this.levelData?.playerStart || { x: 2, y: 2 };
    const checkpoint = this.checkpointPx || {
      x: toPx(start.x),
      y: toPx(start.y),
    };
    const remainingHp = Math.max(HEART_DAMAGE, this.player.hp);
    const maxHearts = this.player.maxHearts;
    let spawnX = checkpoint.x;
    let spawnY = Math.max(0, checkpoint.y - toPx(11));
    const useWaterRespawn = this.isWaterSwimEnabled();

    if (this.arenaLocked && this.arenaRectPx) {
      const minX = this.arenaRectPx.x + 8;
      const maxX = this.arenaRectPx.x + this.arenaRectPx.w - this.player.w - 8;
      spawnX = clamp(spawnX, minX, Math.max(minX, maxX));
      spawnY = Math.max(this.arenaRectPx.y + 8, spawnY);
    }

    if (useWaterRespawn) {
      const safeRespawn = this.findSafeWaterRespawnPosition(
        spawnX,
        checkpoint.y,
      );
      spawnX = safeRespawn.x;
      spawnY = safeRespawn.y;
    } else {
      const safeRespawn = this.findSafeRespawnPosition(spawnX, checkpoint.y);
      spawnX = safeRespawn.x;
      spawnY = Math.max(0, safeRespawn.y - toPx(11));
      if (this.arenaLocked && this.arenaRectPx) {
        spawnY = Math.max(this.arenaRectPx.y + 8, spawnY);
      }
    }

    this.player.resetAt(spawnX, spawnY, maxHearts);
    this.player.hp = remainingHp;
    this.player.vy = useWaterRespawn ? 0 : 0.7;
    this.player.respawnDropTimer = useWaterRespawn
      ? 0
      : RESPAWN_DROP_DURATION_SEC;
    this.player.onGround = false;
    this.player.inWater = useWaterRespawn;
    this.player.state = useWaterRespawn ? "Idle" : "Fall";
    this.player.invincibility = Math.max(
      this.player.invincibility,
      RESPAWN_BRIEF_PROTECTION_SEC,
    );
    this.createTelegraph(
      this.player.center.x,
      this.player.center.y - 20,
      34,
      "rgba(220,245,255,0.92)",
      0.22,
    );
    this.createTelegraph(
      this.player.center.x,
      this.player.center.y - 20,
      54,
      "rgba(255,245,190,0.85)",
      0.34,
    );
    this.restarting = false;
    this.respawnPending = false;
    this.respawnTimer = 0;
  }

  findSafeWaterRespawnPosition(preferredX, preferredY) {
    if (!this.map || !this.player) {
      return { x: preferredX, y: Math.max(0, preferredY) };
    }

    const tileSize = this.map.tileSize || CONST.GAME.TILE;
    const levelWidthPx = Math.max(
      tileSize,
      (this.levelData?.sizeTiles?.w || this.map.width || 0) * tileSize,
    );
    const levelHeightPx = Math.max(
      tileSize,
      (this.levelData?.sizeTiles?.h || this.map.height || 0) * tileSize,
    );
    let minX = 0;
    let maxX = Math.max(minX, levelWidthPx - this.player.w);
    if (this.arenaLocked && this.arenaRectPx) {
      minX = this.arenaRectPx.x + 8;
      maxX = this.arenaRectPx.x + this.arenaRectPx.w - this.player.w - 8;
    }
    maxX = Math.max(minX, maxX);

    const minY = tileSize * 0.5;
    const maxY = Math.max(minY, levelHeightPx - this.player.h - 4);
    const baseY = clamp(preferredY, minY, maxY);
    const searchStep = Math.max(16, Math.floor(tileSize * 0.5));
    const maxXRange = Math.max(maxX - minX, 0);
    const maxYRange = Math.max(maxY - minY, 0);
    const xOffsets = [0];
    const yOffsets = [0];

    for (let d = searchStep; d <= maxXRange; d += searchStep) {
      xOffsets.push(d, -d);
    }
    for (let d = searchStep; d <= maxYRange; d += searchStep) {
      yOffsets.push(-d, d);
    }

    for (const xOffset of xOffsets) {
      const candidateX = clamp(preferredX + xOffset, minX, maxX);
      for (const yOffset of yOffsets) {
        const candidateY = clamp(baseY + yOffset, minY, maxY);
        if (this.isWaterRespawnSpotSafe(candidateX, candidateY)) {
          return { x: candidateX, y: candidateY };
        }
      }
    }

    return {
      x: clamp(preferredX, minX, maxX),
      y: baseY,
    };
  }

  isWaterRespawnSpotSafe(x, y) {
    if (!this.map || !this.player) return true;
    const insetX = 4;
    const insetY = 3;
    const testRect = {
      x: x + insetX,
      y: y + insetY,
      w: Math.max(1, this.player.w - insetX * 2),
      h: Math.max(1, this.player.h - insetY * 2),
    };

    if (
      this.rectOverlapsSolidLike(testRect.x, testRect.y, testRect.w, testRect.h)
    ) {
      return false;
    }

    const tileSize = this.map.tileSize || CONST.GAME.TILE;
    const minTx = Math.floor(testRect.x / tileSize);
    const maxTx = Math.floor((testRect.x + testRect.w - 1) / tileSize);
    const minTy = Math.floor(testRect.y / tileSize);
    const maxTy = Math.floor((testRect.y + testRect.h - 1) / tileSize);
    for (let ty = minTy; ty <= maxTy; ty += 1) {
      for (let tx = minTx; tx <= maxTx; tx += 1) {
        const tile = this.map.getTile(tx, ty);
        if (
          tile === TILE.SPIKES ||
          tile === TILE.BARBED_WIRE ||
          tile === TILE.POISON
        ) {
          return false;
        }
      }
    }

    const safetyMargin = 18;
    const safeRect = {
      x: x - safetyMargin,
      y: y - safetyMargin,
      w: this.player.w + safetyMargin * 2,
      h: this.player.h + safetyMargin * 2,
    };
    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      if (rectsOverlap(safeRect, enemy.bounds)) return false;
    }
    if (
      this.boss?.active &&
      !this.boss.dead &&
      rectsOverlap(safeRect, this.boss.bounds)
    ) {
      return false;
    }

    return true;
  }

  enterGameOver() {
    if (this.gameOverActive) return;
    this.reportRunEnd(false, "lose");
    this.gameOverActive = true;
    if (typeof this.onGameOverEnter === "function") {
      this.onGameOverEnter();
    }
    this.showPause = false;
    this.restarting = false;
    this.respawnPending = false;
    this.respawnTimer = 0;
    this.gameOverStats = {
      runAxoCoins: this.getDisplayedAxoCoins(),
      highestAxoCoins: this.getProfileTotalAxoCoins(),
      enemies: Math.max(0, Math.floor(this.enemiesDefeated || 0)),
    };
    this.gameOverRetryButtonRect = null;
    this.gameOverMenuButtonRect = null;
  }

  retryAfterGameOver() {
    this.gameOverActive = false;
    if (typeof this.onGameOverRetry === "function") {
      this.onGameOverRetry();
      return;
    }
    this.startingHearts = FIXED_HERO_HEARTS;
    this.resetRunState();
  }

  exitAfterGameOver() {
    this.gameOverActive = false;
    if (typeof this.onExitToMap === "function") {
      this.onExitToMap();
    }
  }

  handleGameOverInput() {
    if (this.input.consume("confirm") || this.input.consume("restart")) {
      this.retryAfterGameOver();
      return;
    }
    if (this.input.consume("back") || this.input.consume("pause")) {
      this.exitAfterGameOver();
      return;
    }

    const p = this.input?.pointer;
    if (!p || !p.clicked) return;
    const mx = p.x;
    const my = p.y;
    const inRect = (rect) =>
      rect &&
      mx >= rect.x &&
      mx <= rect.x + rect.w &&
      my >= rect.y &&
      my <= rect.y + rect.h;

    if (inRect(this.gameOverRetryButtonRect)) {
      this.retryAfterGameOver();
      return;
    }
    if (inRect(this.gameOverMenuButtonRect)) {
      this.exitAfterGameOver();
    }
  }

  onRespawnLanding(player) {
    if (!player) return;
    const footX = player.center.x;
    const footY = player.y + player.h - 4;
    this.createTelegraph(footX, footY, 24, "rgba(255,255,210,0.95)", 0.16);
    this.createTelegraph(footX, footY, 42, "rgba(170,220,255,0.82)", 0.24);
  }

  findSafeRespawnPosition(preferredX, preferredY) {
    const safeAtCheckpoint = this.findSafeRespawnX(preferredX, preferredY);
    if (safeAtCheckpoint != null) {
      return { x: safeAtCheckpoint, y: preferredY };
    }

    const start = this.levelData?.playerStart || { x: 2, y: 2 };
    const startX = toPx(start.x);
    const startY = toPx(start.y);
    const safeAtStart = this.findSafeRespawnX(startX, startY);
    if (safeAtStart != null) {
      return { x: safeAtStart, y: startY };
    }

    // Last-resort fallback when no position passes strict safety checks.
    return {
      x: clamp(
        preferredX,
        0,
        Math.max(
          0,
          this.levelData.sizeTiles.w * CONST.GAME.TILE - this.player.w,
        ),
      ),
      y: preferredY,
    };
  }

  findSafeRespawnX(preferredX, landingY) {
    const cw = this.canvas._logicalWidth ?? this.canvas.width;
    const worldWidthPx = Math.max(
      cw,
      (this.levelData?.sizeTiles?.w || 0) * CONST.GAME.TILE,
    );
    let minX = 0;
    let maxX = Math.max(minX, worldWidthPx - this.player.w);
    if (this.arenaLocked && this.arenaRectPx) {
      minX = this.arenaRectPx.x + 8;
      maxX = this.arenaRectPx.x + this.arenaRectPx.w - this.player.w - 8;
    }
    maxX = Math.max(minX, maxX);

    const searchStep = Math.max(16, Math.floor(CONST.GAME.TILE * 0.5));
    const maxRange = Math.max(maxX - minX, 0);
    const offsets = [0];
    for (let d = searchStep; d <= maxRange; d += searchStep) {
      offsets.push(d, -d);
    }

    for (const offset of offsets) {
      const candidateX = clamp(preferredX + offset, minX, maxX);
      if (this.isRespawnLandingSpotSafe(candidateX, landingY)) {
        return candidateX;
      }
    }

    return null;
  }

  isRespawnLandingSpotSafe(x, y) {
    if (!this.map || !this.player) return true;

    const footY = y + this.player.h + 2;
    const leftX = x + 4;
    const rightX = x + this.player.w - 4;
    const centerX = x + this.player.w * 0.5;
    const supportTiles = [
      this.map.getTileAtPixel(leftX, footY),
      this.map.getTileAtPixel(centerX, footY),
      this.map.getTileAtPixel(rightX, footY),
    ];
    const hasSafeGround = supportTiles.some((tile) =>
      CHECKPOINT_SAFE_GROUND.has(tile),
    );
    if (!hasSafeGround) return false;

    const sampleY = [y + this.player.h - 2, y + this.player.h * 0.5];
    for (const sample of sampleY) {
      const tiles = [
        this.map.getTileAtPixel(leftX, sample),
        this.map.getTileAtPixel(centerX, sample),
        this.map.getTileAtPixel(rightX, sample),
      ];
      if (tiles.some((tile) => CHECKPOINT_HAZARDS.has(tile))) {
        return false;
      }
    }

    const safetyMargin = 18;
    const verticalRange = toPx(5);
    const safeRect = {
      x: x - safetyMargin,
      y: y - verticalRange,
      w: this.player.w + safetyMargin * 2,
      h: this.player.h + verticalRange * 2,
    };

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      if (rectsOverlap(safeRect, enemy.bounds)) {
        return false;
      }
    }

    if (
      this.boss?.active &&
      !this.boss.dead &&
      rectsOverlap(safeRect, this.boss.bounds)
    ) {
      return false;
    }

    return true;
  }

  resetCheckpointToStart() {
    const start = this.levelData?.playerStart || { x: 2, y: 2 };
    this.checkpointPx = { x: toPx(start.x), y: toPx(start.y) };
  }

  getCheckpointStepPxForCurrentLevel() {
    if (this.levelData?.world === "water") {
      return toPx(Math.max(3, CHECKPOINT_STEP_TILES - 2));
    }
    return toPx(CHECKPOINT_STEP_TILES);
  }

  updateWaterAutoCheckpoint() {
    if (!this.player || this.player.dead || !this.player.inWater || !this.map)
      return;

    const start = this.levelData?.playerStart || { x: 2, y: 2 };
    const fallbackY = Number.isFinite(this.checkpointPx?.y)
      ? this.checkpointPx.y
      : toPx(start.y);
    const anchorY = this.getWaterCheckpointAnchorY(fallbackY);

    if (!this.checkpointPx) {
      this.checkpointPx = { x: this.player.x, y: anchorY };
      return;
    }

    const stepPx = Math.max(toPx(3), Math.round(this.checkpointStepPx * 0.85));
    if (this.player.x <= this.checkpointPx.x + stepPx) return;
    this.checkpointPx = { x: this.player.x, y: anchorY };
  }

  updateAutoCheckpoint() {
    if (!this.player || this.player.dead || !this.map) return;
    if (this.isWaterSwimEnabled() && this.player.inWater) {
      this.updateWaterAutoCheckpoint();
      return;
    }
    if (!this.player.onGround) return;
    if (!this.isCheckpointCandidateSafe()) return;
    if (!this.checkpointPx) {
      this.checkpointPx = { x: this.player.x, y: this.player.y };
      return;
    }
    if (this.player.x <= this.checkpointPx.x + this.checkpointStepPx) return;
    this.checkpointPx = { x: this.player.x, y: this.player.y };
  }

  isCheckpointCandidateSafe() {
    const p = this.player;
    const map = this.map;
    const footY = p.y + p.h + 2;
    const leftX = p.x + 4;
    const rightX = p.x + p.w - 4;
    const centerX = p.x + p.w * 0.5;
    const supportTiles = [
      map.getTileAtPixel(leftX, footY),
      map.getTileAtPixel(centerX, footY),
      map.getTileAtPixel(rightX, footY),
    ];
    const hasSafeGround = supportTiles.some((tile) =>
      CHECKPOINT_SAFE_GROUND.has(tile),
    );
    if (!hasSafeGround) return false;

    const sampleY = [p.y + p.h - 2, p.y + p.h * 0.5];
    for (const y of sampleY) {
      const tiles = [
        map.getTileAtPixel(leftX, y),
        map.getTileAtPixel(centerX, y),
        map.getTileAtPixel(rightX, y),
      ];
      if (tiles.some((tile) => CHECKPOINT_HAZARDS.has(tile))) {
        return false;
      }
    }

    return true;
  }

  onIceRebirthChildrenSpawned(count) {
    const total = Math.max(0, Math.floor(Number(count) || 0));
    this.iceRebirthChildrenRemaining = total;
    this.bossDefeated = false;
    this.levelClearPending = false;
    this.levelClearTimer = 0;
    this.levelClearPayload = null;
    if (total > 0) {
      this.showPowerNotice(
        "Defeat all rebirth children to clear the level.",
        2.6,
      );
    } else {
      this.onBossDefeated();
    }
  }

  onBossDefeated() {
    if (this.bossDefeated) return;
    this.bossDefeated = true;
    this.iceRebirthChildrenRemaining = 0;
    this.arenaLocked = false;
    this.bossIntroTimer = 0;
    const configuredBossReward = toNonNegativeInt(this.levelBossReward, 0);
    const bossCoins =
      configuredBossReward > 0
        ? configuredBossReward
        : (BOSS_AXO_COINS[this.boss?.type] ?? 800);
    this.addAxoCoinsWithPopup(bossCoins, this.boss.center.x, this.boss.y);
    this.playSfx("stageComplete");
    if (this.levelId >= FINAL_LEVEL_ID) {
      this.playSfx("victory");
      this.showPowerNotice("Boss defeated! Final reward unlocked.", 2.4);
    }
    this.camera.setWorldBounds(
      0,
      0,
      this.levelData.sizeTiles.w * CONST.GAME.TILE,
      this.levelData.sizeTiles.h * CONST.GAME.TILE,
    );
    this.finalLevelChest = null;
  }

  spawnFinalLevelChest() {
    if (this.levelId < FINAL_LEVEL_ID || !this.boss) return;
    const chestW = 96;
    const chestH = 96;
    const centerX =
      Number(this.boss?.center?.x) || Number(this.player?.center?.x) || toPx(6);
    const bottomY = Math.max(
      chestH,
      Number(this.boss?.y || 0) + Number(this.boss?.h || chestH),
    );
    const chestX = centerX - chestW * 0.5;
    const chestY = bottomY - chestH;
    this.finalLevelChest = {
      x: chestX,
      y: chestY,
      w: chestW,
      h: chestH,
      active: true,
      opened: false,
      openedTimer: 0,
      openedHoldSec: FINAL_LEVEL_CHEST_OPEN_HOLD_SEC,
    };
    this.showPowerNotice("Boss defeated! Touch the chest.", 2.4);
  }

  updateFinalLevelChestState(dt = 0) {
    if (
      this.levelId < FINAL_LEVEL_ID ||
      !this.finalLevelChest ||
      !this.finalLevelChest.active
    ) {
      return;
    }
    if (this.finalLevelChest.opened) {
      this.finalLevelChest.openedTimer = Math.max(
        0,
        (Number(this.finalLevelChest.openedTimer) || 0) - (Number(dt) || 0),
      );
      return;
    }
    if (!this.player) return;
    const chestBounds = {
      x: this.finalLevelChest.x,
      y: this.finalLevelChest.y,
      w: this.finalLevelChest.w,
      h: this.finalLevelChest.h,
    };
    if (!rectsOverlap(chestBounds, this.player.bounds)) return;
    this.finalLevelChest.opened = true;
    this.finalLevelChest.openedTimer = Math.max(
      0,
      Number(this.finalLevelChest.openedHoldSec) ||
        FINAL_LEVEL_CHEST_OPEN_HOLD_SEC,
    );
    this.addAxoCoinsWithPopup(
      FINAL_LEVEL_CHEST_REWARD_AXO,
      this.finalLevelChest.x + this.finalLevelChest.w * 0.5,
      this.finalLevelChest.y,
    );
    this.showPowerNotice(
      `Chest opened! +${FINAL_LEVEL_CHEST_REWARD_AXO} coins`,
      2.2,
    );
  }

  drawFinalLevelChest() {
    if (!this.finalLevelChest || !this.finalLevelChest.active) return;
    const spritePath = this.finalLevelChest.opened
      ? FINAL_LEVEL_CHEST_OPEN_IMAGE
      : FINAL_LEVEL_CHEST_LOCKED_IMAGE;
    const state = this.getObjectSprite(spritePath);
    if (!state || state.failed || !hasRenderableImage(state.image)) return;
    const image = state.image;
    const naturalW = Math.max(
      1,
      Number(image.naturalWidth || image.width || this.finalLevelChest.w),
    );
    const naturalH = Math.max(
      1,
      Number(image.naturalHeight || image.height || this.finalLevelChest.h),
    );
    let srcX = 0;
    let srcY = 0;
    let srcW = naturalW;
    let srcH = naturalH;
    const holdSec = Math.max(
      0.001,
      Number(this.finalLevelChest.openedHoldSec) ||
        FINAL_LEVEL_CHEST_OPEN_HOLD_SEC,
    );
    const openedTimer = Math.max(
      0,
      Number(this.finalLevelChest.openedTimer) || 0,
    );
    const openProgress = this.finalLevelChest.opened
      ? Math.max(0, Math.min(1, 1 - openedTimer / holdSec))
      : 0;
    const scale = this.finalLevelChest.opened
      ? 1 + (FINAL_LEVEL_CHEST_OPEN_SCALE - 1) * openProgress
      : 1;
    if (this.finalLevelChest.opened) {
      const frameCount = Math.max(1, FINAL_LEVEL_CHEST_OPEN_FRAME_COUNT);
      const frameStep = naturalW / frameCount;
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(openProgress * frameCount),
      );
      const frameStart = Math.round(frameIndex * frameStep);
      const frameEnd = Math.round((frameIndex + 1) * frameStep);
      srcX = frameStart;
      srcW = Math.max(1, frameEnd - frameStart);
      srcH = naturalH;
    }
    // Keep original frame ratio while scaling by configured chest height.
    const baseH = this.finalLevelChest.h;
    const baseW = (srcW / Math.max(1, srcH)) * baseH;
    const drawW = baseW * scale;
    const drawH = baseH * scale;
    const x = this.finalLevelChest.x - (drawW - baseW) * 0.5 - this.camera.x;
    const y = this.finalLevelChest.y - (drawH - baseH) - this.camera.y;
    this.ctx.drawImage(image, srcX, srcY, srcW, srcH, x, y, drawW, drawH);
  }

  getArenaCollisionBounds() {
    if (this.arenaLocked && this.arenaRectPx) {
      return {
        x: this.arenaRectPx.x,
        y: this.arenaRectPx.y,
        w: this.arenaRectPx.w,
        h: this.arenaRectPx.h,
      };
    }

    return null;
  }

  handleBossArenaLock() {
    if (!this.arenaRectPx || this.bossDefeated || this.arenaLocked) return;

    const triggerRect = {
      x: this.arenaRectPx.x,
      y: this.arenaRectPx.y,
      w: this.arenaRectPx.w,
      h: this.arenaRectPx.h,
    };
    const playerBounds = this.player?.bounds || null;
    if (!playerBounds) return;
    const isWaterLevel = this.levelData?.world === "water";
    const playerCenterX = playerBounds.x + playerBounds.w * 0.5;
    const crossedArenaStartX = playerCenterX >= triggerRect.x;
    const reachedWaterBossTrigger = isWaterLevel
      ? crossedArenaStartX
      : rectsOverlap(playerBounds, triggerRect);

    if (reachedWaterBossTrigger) {
      this.arenaLocked = true;
      const worldHeightPx = this.levelData.sizeTiles.h * CONST.GAME.TILE;
      this.camera.setWorldBounds(
        triggerRect.x,
        0,
        triggerRect.w,
        worldHeightPx,
      );
      this.clearEnemiesForBossArena();
      this.bossIntroTitle = BOSS_ENTRY_NOTICE_TEXT;
      this.bossIntroTimer = BOSS_ENTRY_UI_DURATION_SEC;
      if (this.boss?.type === "necroKing") {
        this.playBossEntryMusic("graveBossEntry");
      }
      if (this.boss.active) {
        if (
          this.levelData?.world === "water" &&
          this.boss.type === "crabBoss"
        ) {
          this.placeCrabBossForArenaStart();
        }
        if (
          this.levelData?.world === "beach" &&
          this.boss.type === "sandBoss"
        ) {
          this.placeSandBossOnFloor();
        }
        // Boss trigger logic: entering arena starts boss AI/combat states.
        this.boss.engaged = true;
        if (this.boss.type === "crabBoss") {
          this.boss.openingBeamPending = true;
          this.boss.attackCd = 0;
        }
      }
    }

    if (!this.arenaLocked) {
      this.camera.setWorldBounds(
        0,
        0,
        this.levelData.sizeTiles.w * CONST.GAME.TILE,
        this.levelData.sizeTiles.h * CONST.GAME.TILE,
      );
    }
  }

  isRectOverlappingBossSolidTiles(rect) {
    if (!rect || !this.map) return false;
    const tileSize = CONST.GAME.TILE;
    const minTx = Math.floor(rect.x / tileSize);
    const maxTx = Math.floor((rect.x + rect.w - 1) / tileSize);
    const minTy = Math.floor(rect.y / tileSize);
    const maxTy = Math.floor((rect.y + rect.h - 1) / tileSize);

    for (let ty = minTy; ty <= maxTy; ty += 1) {
      for (let tx = minTx; tx <= maxTx; tx += 1) {
        const tile = this.map.getTile(tx, ty);
        if (!BOSS_SOLID_TILES.has(tile)) continue;
        const tileRect = {
          x: tx * tileSize,
          y: ty * tileSize,
          w: tileSize,
          h: tileSize,
        };
        if (rectsOverlap(rect, tileRect)) return true;
      }
    }
    return false;
  }

  placeCrabBossForArenaStart() {
    if (!this.boss?.active || this.boss.type !== "crabBoss") return;
    if (!this.arenaRectPx) return;

    const arena = this.arenaRectPx;
    const tileSize = CONST.GAME.TILE;
    const pad = 8;
    const minX = arena.x + pad;
    const maxX = Math.max(minX, arena.x + arena.w - this.boss.w - pad);
    const minY = arena.y + pad;
    // Keep some water gap above floor so boss does not appear embedded.
    const maxY = Math.max(
      minY,
      arena.y + arena.h - this.boss.h - tileSize * 1.2,
    );

    this.boss.x = clamp(this.boss.x, minX, maxX);

    let placed = false;
    const stepY = Math.max(4, Math.floor(tileSize / 3));
    for (let y = minY; y <= maxY; y += stepY) {
      const probe = { x: this.boss.x, y, w: this.boss.w, h: this.boss.h };
      if (!this.isRectOverlappingBossSolidTiles(probe)) {
        this.boss.y = y;
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.boss.y = minY;
    }

    this.boss.vx = 0;
    this.boss.vy = 0;
    this.boss.seaSwimTargetX = this.boss.x;
    this.boss.seaSwimTargetY = this.boss.y;
    this.boss.seaSwimRetargetTimer = 0;
  }

  /** Place sand boss on arena floor so it starts and stays on the ground. */
  placeSandBossOnFloor() {
    if (!this.boss?.active || this.boss.type !== "sandBoss") return;
    if (!this.arenaRectPx) return;

    const arena = this.arenaRectPx;
    const tileSize = CONST.GAME.TILE;
    const pad = 8;
    const minX = arena.x + pad;
    const maxX = Math.max(minX, arena.x + arena.w - this.boss.w - pad);
    // Floor: bottom of arena so boss feet sit on the ground.
    const floorY = arena.y + arena.h - this.boss.h;
    const minY = arena.y + pad;
    const maxY = Math.max(minY, floorY - Math.floor(tileSize * 0.25));

    this.boss.x = clamp(this.boss.x, minX, maxX);

    let placed = false;
    const stepY = Math.max(4, Math.floor(tileSize / 3));
    for (let y = maxY; y >= minY; y -= stepY) {
      const probe = { x: this.boss.x, y, w: this.boss.w, h: this.boss.h };
      if (!this.isRectOverlappingBossSolidTiles(probe)) {
        this.boss.y = y;
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.boss.y = Math.max(minY, floorY - tileSize);
    }

    this.boss.vx = 0;
    this.boss.vy = 0;
  }

  clearEnemiesForBossArena() {
    if (!this.arenaRectPx) return;
    if (this.levelData?.world === "water") {
      // Water boss section should be boss-only.
      for (const enemy of this.enemyPool.items) {
        enemy.active = false;
      }
      return;
    }
    const arena = this.arenaRectPx;
    for (const enemy of this.enemyPool.items) {
      if (!enemy.active) continue;
      const overlapsArena = rectsOverlap(enemy.bounds, arena);
      if (!overlapsArena) {
        enemy.active = false;
      }
    }
  }

  rollCoreRewardElement() {
    // Fire core is rare; otherwise reward the world element.
    if (Math.random() < 0.12) {
      return ELEMENT.FIRE;
    }
    return this.currentElement;
  }

  isVeteranMode() {
    return Boolean(this.veteranModeEnabled);
  }

  getEnemyAttackCooldownMultiplier() {
    return this.isVeteranMode() ? 0.92 : 1;
  }

  getEnemyProjectileSpeedMultiplier() {
    return this.isVeteranMode() ? 1.08 : 1;
  }

  isCorePassiveSuppressed(category) {
    return this.activeRelicCategories.has(category);
  }

  setRelicCategoryActive(category, active = true) {
    if (!category) return;
    if (active) {
      this.activeRelicCategories.add(category);
    } else {
      this.activeRelicCategories.delete(category);
    }
  }

  tileRectFromTiles(tx, ty, w = 1, h = 1) {
    return {
      x: toPx(tx),
      y: toPx(ty),
      w: toPx(w),
      h: toPx(h),
    };
  }

  designCoinLayout(rawRunCoins, rawAxoCoins) {
    const runCoins = (rawRunCoins || []).map((c) => ({
      x: c.x,
      y: c.y,
      value: c.value || 1,
    }));
    runCoins.sort((a, b) => a.x - b.x || a.y - b.y);

    const cappedRun = this.staggerRunCoins(
      runCoins.slice(0, this.levelCoinCap),
    );
    const axoBase = (Array.isArray(rawAxoCoins) ? rawAxoCoins : []).map(
      (c) => ({ x: c.x, y: c.y, value: c.value || 15 }),
    );

    if (!ENABLE_AUTO_GENERATED_SPAWNS) {
      return {
        initialRun: cappedRun,
        reservedRun: [],
        initialAxo: axoBase,
        reservedAxo: [],
      };
    }

    const startY = Number(
      this.levelData?.playerStart?.y || this.levelData?.sizeTiles?.h - 4,
    );
    const challengeCandidates = [];
    const easyCandidates = [];
    for (const coin of cappedRun) {
      const requiresSkill =
        this.isHazardNearTile(coin.x, coin.y) || coin.y <= startY - 2;
      if (requiresSkill) {
        challengeCandidates.push(coin);
      } else {
        easyCandidates.push(coin);
      }
    }
    const reservedAxo = axoBase.slice(0, 3);
    const startCoinBudget = Math.min(
      12,
      Math.max(6, Math.floor(this.levelCoinCap * 0.12)),
    );
    const initialRun = [];
    const priority = [...challengeCandidates, ...easyCandidates];
    const stride = Math.max(
      1,
      Math.floor(priority.length / Math.max(1, startCoinBudget)),
    );
    for (
      let i = 0;
      i < priority.length && initialRun.length < startCoinBudget;
      i += stride
    ) {
      initialRun.push(priority[i]);
    }
    const used = new Set(initialRun.map((c) => `${c.x},${c.y}`));
    const reservedRun = cappedRun.filter((c) => !used.has(`${c.x},${c.y}`));

    return {
      initialRun,
      reservedRun,
      initialAxo: [],
      reservedAxo,
    };
  }

  isHazardNearTile(tx, ty) {
    const around = [
      this.map.getTile(tx, ty),
      this.map.getTile(tx, ty + 1),
      this.map.getTile(tx - 1, ty + 1),
      this.map.getTile(tx + 1, ty + 1),
    ];
    return around.some(
      (t) =>
        t === TILE.SPIKES ||
        t === TILE.BARBED_WIRE ||
        t === TILE.POISON ||
        t === TILE.WATER,
    );
  }

  isEnemySpawnInWaterOrSpikes(entry) {
    if (!entry || !this.map) return false;
    const tx = Math.floor(entry.x);
    const ty = Math.floor(entry.y);
    const hazards = new Set([TILE.SPIKES, TILE.BARBED_WIRE, TILE.POISON]);
    if (this.levelData?.world !== "water") {
      hazards.add(TILE.WATER);
    }
    const sampleOffsets = [
      [0, 0],
      [0, 1],
      [-1, 1],
      [1, 1],
      [0, 2],
      [-1, 2],
      [1, 2],
      [-2, 2],
      [2, 2],
      [0, 3],
    ];
    return sampleOffsets.some(([dx, dy]) =>
      hazards.has(this.map.getTile(tx + dx, ty + dy)),
    );
  }

  staggerRunCoins(runCoins) {
    if (!Array.isArray(runCoins) || runCoins.length === 0) return [];

    const out = [];
    const occupied = new Set();
    let segment = [];

    const flushSegment = () => {
      if (segment.length === 0) return;
      const shouldStagger = segment.length >= 3;
      const normalPattern = [0, -1, 0, 1];
      const challengePattern = [-1, 0, -1, 1];

      for (let i = 0; i < segment.length; i += 1) {
        const coin = segment[i];
        const pattern =
          this.isHazardNearTile(coin.x, coin.y) ||
          this.isCoinNearJump(coin.x, coin.y)
            ? challengePattern
            : normalPattern;
        const offset = shouldStagger ? pattern[i % pattern.length] : 0;
        const y = this.pickCoinYTile(coin.x, coin.y, offset, occupied);
        out.push({ ...coin, y });
        occupied.add(`${coin.x},${y}`);
      }

      segment = [];
    };

    for (const coin of runCoins) {
      if (segment.length === 0) {
        segment.push(coin);
        continue;
      }

      const prev = segment[segment.length - 1];
      const isSameRow = prev.y === coin.y;
      const isContinuous = coin.x - prev.x <= 2;
      if (isSameRow && isContinuous) {
        segment.push(coin);
      } else {
        flushSegment();
        segment.push(coin);
      }
    }
    flushSegment();

    return out;
  }

  isCoinNearJump(tx, ty) {
    const supportLeft = this.hasSupportBelow(tx - 1, ty);
    const supportCenter = this.hasSupportBelow(tx, ty);
    const supportRight = this.hasSupportBelow(tx + 1, ty);
    const supportCount =
      Number(supportLeft) + Number(supportCenter) + Number(supportRight);
    return supportCount <= 1 || supportLeft !== supportRight;
  }

  hasSupportBelow(tx, ty) {
    for (let dy = 1; dy <= 4; dy += 1) {
      const tile = this.map.getTile(tx, ty + dy);
      if (CHECKPOINT_SAFE_GROUND.has(tile)) return true;
      if (CHECKPOINT_HAZARDS.has(tile)) return false;
    }
    return false;
  }

  pickCoinYTile(tx, baseY, preferredOffset, occupied) {
    const preferredY = baseY + preferredOffset;
    const candidates = [
      preferredY,
      baseY - 1,
      baseY + 1,
      baseY,
      baseY - 2,
      baseY + 2,
    ];
    for (const y of candidates) {
      if (!this.isCoinTileOpen(tx, y)) continue;
      if (occupied.has(`${tx},${y}`)) continue;
      return y;
    }
    return baseY;
  }

  isCoinTileOpen(tx, ty) {
    if (!Number.isFinite(tx) || !Number.isFinite(ty)) return false;
    if (ty <= 0 || ty >= this.map.height - 1) return false;
    const tile = this.map.getTile(tx, ty);
    return tile === TILE.EMPTY;
  }

  findBrickTiles() {
    const out = [];
    for (let ty = 0; ty < this.map.height; ty += 1) {
      for (let tx = 0; tx < this.map.width; tx += 1) {
        const tile = this.map.getTile(tx, ty);
        if (tile === TILE.BRICK || tile === TILE.GIFT_BOX) {
          out.push({ x: tx, y: ty });
        }
      }
    }
    out.sort((a, b) => a.x - b.x || a.y - b.y);
    return out;
  }

  resolveHiddenHeartPopDirection(tx, ty) {
    const candidates = [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];
    for (const candidate of candidates) {
      const tile = this.map.getTile(tx + candidate.dx, ty + candidate.dy);
      if (isHiddenHeartExitTile(tile)) return candidate;
    }
    return { dx: 0, dy: -1 };
  }

  spawnHiddenHeartPickup(tx, ty) {
    const tileX = tx * CONST.GAME.TILE;
    const tileY = ty * CONST.GAME.TILE;
    const baseX = tileX + (CONST.GAME.TILE - HIDDEN_HEART_PICKUP_SIZE) * 0.5;
    const baseY = tileY + (CONST.GAME.TILE - HIDDEN_HEART_PICKUP_SIZE) * 0.5;
    const direction = this.resolveHiddenHeartPopDirection(tx, ty);
    const targetX = baseX + direction.dx * HIDDEN_HEART_POP_OUT_DISTANCE_PX;
    const targetY = baseY + direction.dy * HIDDEN_HEART_POP_OUT_DISTANCE_PX;
    this.spawnCoin(baseX, baseY, 1, "heart", 0, {
      originX: baseX,
      originY: baseY,
      targetX,
      targetY,
      emergeDuration: HIDDEN_HEART_POP_OUT_DURATION_SEC,
      collectibleOnSpawn: false,
      w: HIDDEN_HEART_PICKUP_SIZE,
      h: HIDDEN_HEART_PICKUP_SIZE,
    });
    this.createTelegraph(
      tileX + CONST.GAME.TILE * 0.5,
      tileY + CONST.GAME.TILE * 0.5,
      28,
      "rgba(255,120,140,0.95)",
      0.35,
    );
  }

  setupHiddenHeartBricks() {
    this.hiddenHeartBrickKeys.clear();
    const entries = Array.isArray(this.levelData?.hiddenHeartBricks)
      ? this.levelData.hiddenHeartBricks
      : [];
    for (const entry of entries) {
      const tx = toNonNegativeInt(entry?.x, -1);
      const ty = toNonNegativeInt(entry?.y, -1);
      if (!this.map?.inBounds(tx, ty)) continue;
      const tile = this.map.getTile(tx, ty);
      if (!isBreakableRewardTile(tile)) continue;
      this.hiddenHeartBrickKeys.add(`${tx},${ty}`);
    }
  }

  setupAdventureObjectives() {
    if (!ENABLE_AUTO_GENERATED_SPAWNS) {
      this.timedCoinRooms = [];
      this.combatChallenges = [];
      this.secretRoutes = [];
      this.brickPuzzle = null;
      this.highRiskSpawned = false;
      return;
    }

    const worldW = this.levelData.sizeTiles.w;
    const worldH = this.levelData.sizeTiles.h;
    const baseY = Math.max(2, worldH - 6);

    const timedStarts = [0.22, 0.56];
    this.timedCoinRooms = timedStarts.map((ratio, idx) => {
      const startTx = Math.floor(worldW * ratio);
      const endTx = Math.min(worldW - 4, startTx + 8);
      return {
        id: `timed-${idx + 1}`,
        started: false,
        completed: false,
        failed: false,
        timer: 0,
        durationSec: idx === 0 ? 8 : 6.5,
        startRect: this.tileRectFromTiles(startTx, baseY, 3, 3),
        endRect: this.tileRectFromTiles(endTx, Math.max(2, baseY - 3), 3, 3),
      };
    });

    const combatStarts = [0.34, 0.63, 0.84];
    this.combatChallenges = combatStarts.map((ratio, idx) => {
      const cx = Math.floor(worldW * ratio);
      return {
        id: `combat-${idx + 1}`,
        idx,
        started: false,
        active: false,
        completed: false,
        remaining: 0,
        triggerRect: this.tileRectFromTiles(cx, baseY, 3, 3),
        lockRect: this.tileRectFromTiles(
          Math.max(1, cx - 4),
          Math.max(0, baseY - 2),
          10,
          6,
        ),
        killsRequired: 3 + idx,
      };
    });

    const secretDefs = [0.16, 0.74];
    this.secretRoutes = secretDefs.map((ratio, idx) => {
      const tx = Math.floor(worldW * ratio);
      const ty = Math.max(2, this.levelData.playerStart.y - 4 - idx);
      return {
        id: `secret-${idx + 1}`,
        found: false,
        triggerRect: this.tileRectFromTiles(tx, ty, 2, 2),
      };
    });

    const bricks = this.findBrickTiles();
    if (bricks.length >= 2) {
      this.brickPuzzle = {
        sequence: bricks.slice(0, Math.min(3, bricks.length)),
        progress: 0,
        solved: false,
      };
    }

    if (!this.highRiskSpawned && this.dynamicCoinDrops) {
      const arenaX = this.arenaRectPx ? this.arenaRectPx.x : toPx(worldW - 18);
      const riskX = arenaX - toPx(4);
      const riskY = toPx(Math.max(2, worldH - 7));
      const riskCount = this.consumeReservedRunCoins(12);
      if (riskCount > 0) {
        this.spawnCoinBurst(riskX, riskY, riskCount, "axo", 1);
      }
      const axoReward = this.consumeReservedAxoCoins(1);
      if (axoReward.length > 0) {
        this.spawnCoin(riskX + 16, riskY - 28, axoReward[0].value, "axo");
      }
      this.highRiskSpawned = true;
    }
  }

  consumeReservedRunCoins(count) {
    if (count <= 0) return 0;
    const taken = Math.min(count, this.reservedRunCoinSpawns.length);
    this.reservedRunCoinSpawns.splice(0, taken);
    return taken;
  }

  consumeReservedAxoCoins(count) {
    if (count <= 0) return [];
    return this.reservedAxoCoinSpawns.splice(0, count);
  }

  spawnObjectiveReward(x, y, runCount, axoCount = 0) {
    if (!ENABLE_AUTO_GENERATED_SPAWNS) return;

    const actualRun = this.consumeReservedRunCoins(Math.min(runCount, 4));
    if (actualRun > 0) {
      for (let i = 0; i < actualRun; i += 1) {
        const angle = actualRun <= 1 ? 0 : (i / actualRun) * Math.PI * 2;
        const radius = 16 + (i % 5) * 5;
        this.spawnCoin(
          x + Math.cos(angle) * radius + randomRange(-5, 5),
          y + Math.sin(angle) * radius + randomRange(-5, 5),
          1,
          "axo",
        );
      }
    }

    const axo = this.consumeReservedAxoCoins(axoCount);
    for (const item of axo) {
      this.spawnCoin(
        x + randomRange(-20, 20),
        y + randomRange(-18, 18),
        item.value || 15,
        "axo",
      );
    }
  }

  updateAdventureObjectives(dt) {
    if (!ENABLE_AUTO_GENERATED_SPAWNS) return;

    this.updateTimedCoinRooms(dt);
    this.updateCombatChallenges(dt);

    for (const route of this.secretRoutes) {
      if (route.found) continue;
      if (!rectsOverlap(this.player.bounds, route.triggerRect)) continue;
      route.found = true;
      const cx = route.triggerRect.x + route.triggerRect.w * 0.5;
      const cy = route.triggerRect.y + route.triggerRect.h * 0.5;
      this.spawnObjectiveReward(cx, cy, 14, 1);
      this.createTelegraph(cx, cy, 42, "rgba(180,255,210,0.95)", 0.5);
      this.grantNextPower("Secret Route", cx, cy);
      this.awardRelicSeal("Secret Route", cx, cy);
    }

    if (!this.activeCombatChallenge && !this.arenaLocked) {
      for (const challenge of this.combatChallenges) {
        if (challenge.started || challenge.completed) continue;
        if (!rectsOverlap(this.player.bounds, challenge.triggerRect)) continue;
        this.activateCombatChallenge(challenge);
        break;
      }
    }
  }

  updateCombatChallenges(dt) {
    if (!this.activeCombatChallenge?.active) return;

    const challenge = this.activeCombatChallenge;
    challenge.timeLeft = Math.max(0, (challenge.timeLeft || 0) - dt);

    const centerX = challenge.lockRect.x + challenge.lockRect.w * 0.5;
    const farFromZone = Math.abs(this.player.center.x - centerX) > toPx(11);
    if (farFromZone || challenge.timeLeft <= 0) {
      challenge.active = false;
      challenge.failed = true;
      this.activeCombatChallenge = null;
    }
  }

  updateTimedCoinRooms(dt) {
    for (const room of this.timedCoinRooms) {
      if (room.completed || room.failed) continue;

      if (!room.started && rectsOverlap(this.player.bounds, room.startRect)) {
        room.started = true;
        room.timer = room.durationSec;

        const sx = room.startRect.x + room.startRect.w * 0.5;
        const sy = room.startRect.y + 12;
        const ex = room.endRect.x + room.endRect.w * 0.5;
        const ey = room.endRect.y + 12;
        const points = this.consumeReservedRunCoins(8);
        for (let i = 0; i < points; i += 1) {
          const t = points <= 1 ? 0 : i / (points - 1);
          const px = sx + (ex - sx) * t + randomRange(-8, 8);
          const py = sy + (ey - sy) * t + Math.sin(t * Math.PI) * -36;
          this.spawnCoin(px, py, 1, "axo", room.durationSec);
        }
        this.createTelegraph(sx, sy, 34, "rgba(255,255,180,0.95)", 0.45);
      }

      if (!room.started) continue;

      room.timer = Math.max(0, room.timer - dt);
      if (rectsOverlap(this.player.bounds, room.endRect)) {
        room.started = false;
        room.completed = true;
        const cx = room.endRect.x + room.endRect.w * 0.5;
        const cy = room.endRect.y + room.endRect.h * 0.5;
        this.spawnObjectiveReward(cx, cy, 12, 1);
        this.createTelegraph(cx, cy, 48, "rgba(255,220,120,0.95)", 0.55);
        this.grantNextPower("Timed Trial", cx, cy);
        this.awardRelicSeal("Timed Trial", cx, cy);
        continue;
      }

      if (room.timer <= 0) {
        room.started = false;
        room.failed = true;
      }
    }
  }

  activateCombatChallenge(challenge) {
    if (!ENABLE_AUTO_GENERATED_SPAWNS) return;

    challenge.started = true;
    challenge.active = true;
    challenge.failed = false;
    challenge.timeLeft = 20;
    challenge.remaining = 0;
    this.activeCombatChallenge = challenge;

    const enemyTypes = LEVEL_ASSETS[this.levelId]?.enemies || ["iceSlime"];
    const centerX = challenge.lockRect.x + challenge.lockRect.w * 0.5;
    const spawnY = challenge.lockRect.y + challenge.lockRect.h - 54;

    for (let i = 0; i < challenge.killsRequired; i += 1) {
      const type = enemyTypes[i % enemyTypes.length];
      const ex = centerX + randomRange(-130, 130);
      const enemy = this.spawnEnemy(type, ex, spawnY, {
        challengeTag: challenge.id,
      });
      if (enemy) {
        challenge.remaining += 1;
      }
    }

    this.createTelegraph(
      centerX,
      spawnY - 20,
      120,
      "rgba(255,120,120,0.9)",
      0.6,
    );

    if (challenge.remaining <= 0) {
      this.completeCombatChallenge(challenge);
    }
  }

  handleCombatChallengeKill(enemy) {
    if (!enemy.challengeTag || !this.activeCombatChallenge) return;
    if (enemy.challengeTag !== this.activeCombatChallenge.id) return;

    this.activeCombatChallenge.remaining = Math.max(
      0,
      this.activeCombatChallenge.remaining - 1,
    );
    if (this.activeCombatChallenge.remaining === 0) {
      this.completeCombatChallenge(this.activeCombatChallenge);
    }
  }

  completeCombatChallenge(challenge) {
    challenge.active = false;
    challenge.completed = true;

    const cx = challenge.lockRect.x + challenge.lockRect.w * 0.5;
    const cy = challenge.lockRect.y + challenge.lockRect.h * 0.5;
    const axoCount = challenge.idx === 2 ? 1 : 0;
    this.spawnObjectiveReward(cx, cy, 14 + challenge.idx * 2, axoCount);
    this.createTelegraph(cx, cy, 58, "rgba(255,170,170,0.9)", 0.6);
    this.grantNextPower(`Combat Trial ${challenge.idx + 1}`, cx, cy);
    this.awardRelicSeal(`Combat Trial ${challenge.idx + 1}`, cx, cy);

    this.activeCombatChallenge = null;
  }

  updateBrickPuzzle(tx, ty) {
    if (!this.brickPuzzle || this.brickPuzzle.solved) return;
    const expected = this.brickPuzzle.sequence[this.brickPuzzle.progress];
    const matches = expected && expected.x === tx && expected.y === ty;

    if (matches) {
      this.brickPuzzle.progress += 1;
    } else {
      this.brickPuzzle.progress = 0;
      const first = this.brickPuzzle.sequence[0];
      if (first && first.x === tx && first.y === ty) {
        this.brickPuzzle.progress = 1;
      }
    }

    if (this.brickPuzzle.progress >= this.brickPuzzle.sequence.length) {
      this.brickPuzzle.solved = true;
      const bx = tx * CONST.GAME.TILE + 20;
      const by = ty * CONST.GAME.TILE - 18;
      this.spawnObjectiveReward(bx, by, 16, 1);
      this.createTelegraph(bx, by, 56, "rgba(170,255,170,0.95)", 0.7);
      this.grantNextPower("Puzzle", bx, by);
      this.awardRelicSeal("Puzzle", bx, by);
    }
  }

  playSfx(name) {
    const path = SFX[name];
    if (!path) return;
    const node = getAudio(path);
    if (!node) return;
    // Jump MP3 has an audible leading gap; skip it for responsive jump feel.
    const startOffsetSec = name === "jump" ? 0.1 : 0;
    this.audio.playSfx(node, startOffsetSec);
  }

  playBossEntryMusic(name) {
    const path = SFX[name];
    if (!path) return;
    let node = getAudio(path);
    if (!node) {
      // Fallback when preload missed/failed this music file.
      node = configureAudioElement(new Audio(`/${path}`));
    }
    configureAudioElement(node);
    node.pause();
    node.currentTime = 0;
    if (typeof this.audio?.crossfadeTo === "function") {
      // Switch from stage BGM into boss entry track.
      this.audio.crossfadeTo(node, 0.08);
      return;
    }
    node.loop = true;
    node.volume = this.audio.master * this.audio.music;
    node.muted = !this.audio.isAudioEnabled();
    node.play().catch(() => {});
  }

  /**
   * @param {boolean} bossDefeated
   * @param {"win"|"lose"|"quit"} [resultOverride] - lose = game over; quit = left level / forfeit
   */
  reportRunEnd(bossDefeated = false, resultOverride = "lose") {
    if (this.runEndReported) return;
    const runCoins = this.getRunAxoCoins();
    if (runCoins <= 0) return;
    if (typeof this.onRunEnd !== "function") return;
    const result =
      bossDefeated === true
        ? "win"
        : resultOverride === "quit"
          ? "quit"
          : "lose";
    this.runEndReported = true;
    this.onRunEnd({
      levelId: this.levelId,
      heroId: this.heroId,
      runCoins,
      time: Math.floor(this.levelRunTime),
      result,
      bossDefeated: bossDefeated === true,
      collectedCoinCount: this.collectedCoinCount,
      enemyKills: { ...this.enemyKills },
      heartsRemaining: this.player?.currentHearts || 0,
      coreClaim: this.coreClaimThisRun,
    });
  }

  showPowerNotice(text, durationSec = 2.4) {
    this.powerNotice = {
      text,
      life: durationSec,
      maxLife: durationSec,
    };
  }

  awardRelicSeal(source, x = null, y = null) {
    void source;
    void x;
    void y;
    return false;
  }

  notifyPowerLocked(powerKey) {
    if (this.powerHintCooldown > 0) return;
    const label = POWER_LABEL[powerKey] || String(powerKey || "Power");
    this.showPowerNotice(`${label} is locked.`, 2.2);
    this.powerHintCooldown = 1.2;
  }

  grantNextPower(source, x = null, y = null) {
    void source;
    void x;
    void y;
    return null;
  }

  buildElementEffects(sourceElement, source, options = {}) {
    const effects = { ...(options || {}) };
    const isAbilityHit = !!effects.isAbilityHit;
    const isBasicAttack = !!effects.isBasicAttack;
    const fireCoreActive =
      this.player.permanentCore === ELEMENT.FIRE &&
      this.player.isCorePassiveActive(this, "damage");

    if (
      sourceElement === ELEMENT.FIRE &&
      (isBasicAttack || isAbilityHit) &&
      fireCoreActive
    ) {
      const fireCore = getCorePassiveValue(ELEMENT.FIRE);
      effects.burnSec = fireCore.burnSec || 2;
      effects.burnDps = fireCore.burnDps || 1;
    }
    if (sourceElement === ELEMENT.ICE && isAbilityHit) {
      effects.slowSec = 0.5;
      effects.slowFactor = 0.72;
    }
    if (sourceElement === ELEMENT.SAND && isAbilityHit) {
      effects.staggerSec = 0.12;
    }
    if (sourceElement === ELEMENT.WATER && isAbilityHit && effects.projectile) {
      effects.pushbackX = source.facing * 1.1;
    }
    if (sourceElement === ELEMENT.DARK && isAbilityHit) {
      effects.ultOnHitPercent = 1;
    }

    return effects;
  }

  applyElementDamage(baseDamage, sourceElement, targetType) {
    const targetElement = getEntityElement(targetType, ELEMENT.DARK);
    const mult = getElementMultiplier(sourceElement, targetElement);
    const isBossTarget = BOSS_DAMAGE_TYPES.has(String(targetType || ""));
    const bossMult = isBossTarget ? HERO_BOSS_DAMAGE_MULTIPLIER : 1;
    return baseDamage * mult * bossMult;
  }

  applyOnHitAttunementBonus(sourceElement, effects) {
    if (sourceElement === ELEMENT.DARK && effects.ultOnHitPercent) {
      this.player.gainUlt(effects.ultOnHitPercent);
    }
  }

  applyBossCoreResistance(sourceElement, effects) {
    if (!effects || !this.permanentElementCore) return effects;
    if (sourceElement !== this.permanentElementCore) return effects;

    const adjusted = { ...effects };

    if (adjusted.slowSec) {
      adjusted.slowSec *= 0.6;
    }
    if (adjusted.freezeSec) {
      adjusted.freezeSec *= 0.6;
    }
    if (adjusted.staggerSec) {
      adjusted.staggerSec *= 0.6;
    }
    if (adjusted.burnSec) {
      adjusted.burnSec *= 0.6;
    }
    if (adjusted.burnDps) {
      adjusted.burnDps *= 0.7;
    }
    if (typeof adjusted.slowFactor === "number") {
      const slowStrength = 1 - adjusted.slowFactor;
      adjusted.slowFactor = 1 - slowStrength * 0.7;
    }

    return adjusted;
  }

  damageEnemiesInArc(player, damage, reach, options = {}) {
    const source = player.center;
    const facing = player.facing;
    const sourceElement = player.currentElement;
    const elementEffects = this.buildElementEffects(
      sourceElement,
      player,
      options,
    );

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const d = distance(source, enemy.center);
      const sameDir =
        facing > 0 ? enemy.center.x >= source.x : enemy.center.x <= source.x;
      if (d <= reach && sameDir) {
        const finalDamage = this.applyElementDamage(
          damage,
          sourceElement,
          enemy.type,
        );
        enemy.takeDamage(finalDamage, this, elementEffects);
        this.applyOnHitAttunementBonus(sourceElement, elementEffects);
      }
    }

    if (this.boss.active && this.boss.engaged && !this.boss.dead) {
      const d = distance(source, this.boss.center);
      const sameDir =
        facing > 0
          ? this.boss.center.x >= source.x
          : this.boss.center.x <= source.x;
      if (d <= reach + 30 && sameDir) {
        const finalDamage = this.applyElementDamage(
          damage,
          sourceElement,
          this.boss.type,
        );
        const bossEffects = this.applyBossCoreResistance(
          sourceElement,
          elementEffects,
        );
        const damageApplied = this.boss.takeDamage(
          finalDamage,
          this,
          bossEffects,
        );
        if (damageApplied) {
          player.onDealDamageToBoss(finalDamage);
          this.applyOnHitAttunementBonus(sourceElement, elementEffects);
        }
      }
    }
  }

  damageEnemiesInRadius(center, radius, damage, source, effects = {}) {
    const sourceElement = source?.currentElement || this.currentElement;
    const elementEffects = this.buildElementEffects(
      sourceElement,
      source || this.player,
      effects,
    );

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const d = distance(center, enemy.center);
      if (d <= radius) {
        const finalDamage = this.applyElementDamage(
          damage,
          sourceElement,
          enemy.type,
        );
        enemy.takeDamage(finalDamage, this, elementEffects);
        this.applyOnHitAttunementBonus(sourceElement, elementEffects);
      }
    }

    if (this.boss.active && this.boss.engaged && !this.boss.dead) {
      const d = distance(center, this.boss.center);
      if (d <= radius) {
        const finalDamage = this.applyElementDamage(
          damage,
          sourceElement,
          this.boss.type,
        );
        const bossEffects = this.applyBossCoreResistance(
          sourceElement,
          elementEffects,
        );
        const damageApplied = this.boss.takeDamage(
          finalDamage,
          this,
          bossEffects,
        );
        if (damageApplied) {
          this.player.onDealDamageToBoss(finalDamage);
          this.applyOnHitAttunementBonus(sourceElement, elementEffects);
        }
      }
    }
  }

  damageEnemiesInAABB(rect, damage, source, options = {}) {
    const sourceElement = source?.currentElement || this.currentElement;
    const elementEffects = this.buildElementEffects(
      sourceElement,
      source || this.player,
      options,
    );

    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      if (rectsOverlap(rect, enemy.bounds)) {
        const finalDamage = this.applyElementDamage(
          damage,
          sourceElement,
          enemy.type,
        );
        enemy.takeDamage(finalDamage, this, elementEffects);
        this.applyOnHitAttunementBonus(sourceElement, elementEffects);
      }
    }

    if (
      this.boss.active &&
      this.boss.engaged &&
      !this.boss.dead &&
      rectsOverlap(rect, this.boss.bounds)
    ) {
      const finalDamage = this.applyElementDamage(
        damage,
        sourceElement,
        this.boss.type,
      );
      const bossEffects = this.applyBossCoreResistance(
        sourceElement,
        elementEffects,
      );
      const damageApplied = this.boss.takeDamage(
        finalDamage,
        this,
        bossEffects,
      );
      if (damageApplied) {
        this.player.onDealDamageToBoss(finalDamage);
        this.applyOnHitAttunementBonus(sourceElement, elementEffects);
      }
    }
  }

  castHeroSkill(player, damage, range, options = {}) {
    this.launchHeroProjectile(player, damage, range, options);
  }

  launchHeroProjectile(source, damage, range, options = {}) {
    if (!source) return;
    const sourceElement = source.currentElement || this.currentElement;
    const {
      speed = 9.5,
      radius = 12,
      color = ELEMENT_COLOR[sourceElement] || "#95e3ff",
      dirX: inputDirX,
      dirY: inputDirY,
      life = null,
      impactRadius = 0,
      impactDamage = damage,
      impactFreezeSec = 0,
      ...effectOptions
    } = options || {};

    let dirX = Number.isFinite(inputDirX) ? inputDirX : source.facing;
    let dirY = Number.isFinite(inputDirY) ? inputDirY : 0;
    const norm = Math.hypot(dirX, dirY) || 1;
    dirX /= norm;
    dirY /= norm;

    const spawnOffset = Math.max(source.w, source.h) * 0.45;
    const projectileRange = Number.isFinite(range) ? range : 420;
    const projectileLife = Number.isFinite(life)
      ? life
      : Math.max(0.2, projectileRange / (Math.abs(speed) * 60) + 0.1);
    const effectPayload = { ...effectOptions };
    const builtEffects = this.buildElementEffects(
      sourceElement,
      source,
      effectPayload,
    );

    this.heroProjectiles.push({
      x: source.center.x + dirX * spawnOffset,
      y: source.center.y + dirY * spawnOffset,
      vx: dirX * speed,
      vy: dirY * speed,
      radius,
      range: projectileRange,
      life: projectileLife,
      traveled: 0,
      damage,
      source,
      sourceElement,
      effects: builtEffects,
      impactRadius: Math.max(0, impactRadius),
      impactDamage,
      impactFreezeSec: Math.max(0, impactFreezeSec),
      impactOptions: effectPayload,
      color,
    });
  }

  launchBossProjectile(source, options = {}) {
    if (!source || !this.player) return;
    const {
      speed = 6.2,
      radius = 12,
      damage = 20,
      range = 520,
      life = null,
      color = "#98deff",
      dirX: inputDirX,
      dirY: inputDirY,
      kind = "orb",
      trailLength = 0,
      spawnX,
      spawnY,
      targetX,
      targetY,
      spritePath: optionSpritePath,
      spriteScale: optionSpriteScale,
      spriteFrameCount: optionSpriteFrameCount,
      spriteFps: optionSpriteFps,
      spriteLoop: optionSpriteLoop,
      forceNoSprite = false,
      spinRate = null,
      groundSkull = false,
      floorY = null,
      groundYOffset = null,
      chasePlayer = false,
      hitsToDestroy = null,
      ignoreTerrain = false,
      silentImpact = false,
      orientToVelocity = true,
    } = options || {};
    const spawnOffset = Math.max(source.w, source.h) * 0.38;
    const hasManualSpawn = Number.isFinite(spawnX) && Number.isFinite(spawnY);
    const useCrabBeamHandAnchor =
      !hasManualSpawn && source?.type === "crabBoss" && kind === "beam";
    let startX = hasManualSpawn ? spawnX : source.center.x;
    let startY = hasManualSpawn ? spawnY : source.center.y;
    if (useCrabBeamHandAnchor) {
      const drawOffsetY = Number(source.drawOffsetY) || 0;
      startX =
        source.x + source.w * 0.5 + (source.facing || 1) * source.w * 0.32;
      startY = source.y + drawOffsetY + source.h * 0.38;
    }

    const hasInputDirection =
      Number.isFinite(inputDirX) || Number.isFinite(inputDirY);
    const manualDir = normalizeDirection(
      Number.isFinite(inputDirX) ? inputDirX : 0,
      Number.isFinite(inputDirY) ? inputDirY : 0,
      source.facing || 1,
    );
    const targetPoint =
      Number.isFinite(targetX) && Number.isFinite(targetY)
        ? { x: targetX, y: targetY }
        : this.player.center;
    const aimedDir = directionToTarget(
      { x: startX, y: startY },
      targetPoint,
      source.facing || 1,
    );
    const direction = hasInputDirection ? manualDir : aimedDir;

    if (!hasManualSpawn && !useCrabBeamHandAnchor) {
      startX = source.center.x + direction.x * spawnOffset;
      startY = source.center.y + direction.y * spawnOffset;
    }

    const projectileLife = Number.isFinite(life)
      ? life
      : Math.max(0.25, range / (Math.abs(speed) * 60) + 0.15);
    const projectileSpriteConfig = BOSS_PROJECTILE_SPRITES[source?.type];
    const defaultSpritePath =
      typeof projectileSpriteConfig === "string"
        ? projectileSpriteConfig
        : projectileSpriteConfig?.path;
    const defaultSpriteScale = Number(projectileSpriteConfig?.scale);
    const defaultSpriteFrameCount = Number(projectileSpriteConfig?.frameCount);
    const defaultSpriteFps = Number(projectileSpriteConfig?.fps);
    const defaultSpriteLoop =
      typeof projectileSpriteConfig?.loop === "boolean"
        ? projectileSpriteConfig.loop
        : true;
    const spritePath =
      forceNoSprite && kind === "orb"
        ? null
        : typeof optionSpritePath === "string"
          ? optionSpritePath
          : typeof defaultSpritePath === "string"
            ? defaultSpritePath
            : null;
    const spriteScale = Number.isFinite(optionSpriteScale)
      ? optionSpriteScale
      : Number.isFinite(defaultSpriteScale)
        ? defaultSpriteScale
        : 1;
    const spriteFrameCount = Number.isFinite(optionSpriteFrameCount)
      ? optionSpriteFrameCount
      : Number.isFinite(defaultSpriteFrameCount)
        ? defaultSpriteFrameCount
        : 1;
    const spriteFps = Number.isFinite(optionSpriteFps)
      ? optionSpriteFps
      : Number.isFinite(defaultSpriteFps)
        ? defaultSpriteFps
        : 8;
    const spriteLoop =
      typeof optionSpriteLoop === "boolean"
        ? optionSpriteLoop
        : defaultSpriteLoop;
    const nowSec =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) *
      0.001;

    this.bossProjectiles.push({
      x: startX,
      y: startY,
      originX: startX,
      originY: startY,
      vx: direction.x * speed,
      vy: direction.y * speed,
      radius,
      damage,
      range,
      life: projectileLife,
      traveled: 0,
      color,
      kind,
      trailLength,
      spritePath,
      spriteScale,
      spriteFrameCount,
      spriteFps,
      spriteLoop,
      spawnTimeSec: nowSec,
      spinRate: Number.isFinite(spinRate) ? spinRate : null,
      groundSkull: Boolean(groundSkull),
      floorY: Number.isFinite(floorY) ? floorY : null,
      groundYOffset: Number.isFinite(groundYOffset)
        ? Math.max(0, groundYOffset)
        : null,
      chasePlayer: Boolean(chasePlayer),
      hitsToDestroy: Number.isFinite(hitsToDestroy)
        ? Math.max(1, Math.round(hitsToDestroy))
        : null,
      ignoreTerrain: Boolean(ignoreTerrain),
      silentImpact: Boolean(silentImpact),
      orientToVelocity: orientToVelocity !== false,
      destroyed: false,
      groundSpeed: Math.max(0.2, Math.abs(speed)),
    });
  }

  freezeEnemiesInRadius(center, radius, freezeSec) {
    for (const enemy of this.enemyPool.items) {
      if (!enemy.active || enemy.state === "Death") continue;
      const d = distance(center, enemy.center);
      if (d <= radius) {
        enemy.freezeTimer = Math.max(enemy.freezeTimer, freezeSec);
      }
    }
  }

  damagePlayerIfInRadius(center, radius, damage) {
    const d = distance(center, this.player.center);
    if (d <= radius) {
      this.player.takeDamage(damage, this, {
        knockbackX: this.boss.facing * 2.5,
        knockbackY: -2,
      });
    }
  }

  damagePlayerIfInLine(from, to, damage) {
    const p = this.player.center;
    const dist = pointToSegmentDistance(p.x, p.y, from.x, from.y, to.x, to.y);
    if (dist <= 34) {
      this.player.takeDamage(damage, this, {
        knockbackX: this.boss.facing * 3,
        knockbackY: -2.2,
      });
    }
  }

  spawnBossMinion(bossType, x, y) {
    if (!ENABLE_AUTO_GENERATED_SPAWNS) return;

    const map = {
      iceTitan: LEVEL_ASSETS[3]?.enemies || [
        "plague",
        "red",
        "spiked",
        "golden",
        "grin",
      ],
      crabBoss: LEVEL_ASSETS[2]?.enemies || [
        "fishScout",
        "coralHydra",
        "coralShooter",
        "eliteWaterGuard",
        "jellyBomber",
      ],
      necroKing: LEVEL_ASSETS[4]?.enemies || [
        "plague",
        "red",
        "spiked",
        "golden",
        "grin",
      ],
      sandBoss: LEVEL_ASSETS[1]?.enemies || [
        "plague",
        "red",
        "spiked",
        "golden",
        "grin",
      ],
    };
    const pool = map[bossType] || ["golden"];
    const type = pool[Math.floor(Math.random() * pool.length)];
    this.spawnEnemy(type, x + randomRange(-80, 80), y, { isBossMinion: true });
  }

  createZoneDamage(x, y, radius, damage, duration) {
    const zone = {
      x,
      y,
      radius,
      damage,
      life: duration,
      maxLife: duration,
      tick: 0.15,
      rgb: "255,95,95",
    };
    this.zoneEffects.push(zone);
  }

  createTelegraph(x, y, radius, color, life = 0.3) {
    if (this.reducedEffectsMode && this.telegraphs.length >= 10) {
      this.telegraphs.shift();
    }
    this.telegraphs.push({ x, y, radius, color, life, maxLife: life });
  }
}

function fallbackDesignCoinLayout(map, levelData, rawRunCoins, rawAxoCoins) {
  const runCoins = (rawRunCoins || []).map((c) => ({
    x: c.x,
    y: c.y,
    value: c.value || 1,
  }));
  const LEVEL_COIN_CAP = 100;
  const cappedRun = runCoins.slice(0, LEVEL_COIN_CAP);
  const startY = Number(
    levelData?.playerStart?.y || levelData?.sizeTiles?.h - 4,
  );
  const isHazardNear = (tx, ty) => {
    if (!map) return false;
    const around = [
      map.getTile(tx, ty),
      map.getTile(tx, ty + 1),
      map.getTile(tx - 1, ty + 1),
      map.getTile(tx + 1, ty + 1),
    ];
    return around.some(
      (t) =>
        t === TILE.SPIKES ||
        t === TILE.BARBED_WIRE ||
        t === TILE.POISON ||
        t === TILE.WATER,
    );
  };
  const challenge = [];
  const easy = [];
  for (const coin of cappedRun) {
    const requiresSkill = isHazardNear(coin.x, coin.y) || coin.y <= startY - 2;
    if (requiresSkill) challenge.push(coin);
    else easy.push(coin);
  }
  const initialAxo = (Array.isArray(rawAxoCoins) ? rawAxoCoins : [])
    .slice(0, 3)
    .map((c) => ({ x: c.x, y: c.y, value: c.value || 15 }));
  const startCoinBudget = 10;
  const initialRun = [];
  const priority = [...challenge, ...easy];
  const stride = Math.max(
    1,
    Math.floor(priority.length / Math.max(1, startCoinBudget)),
  );
  for (
    let i = 0;
    i < priority.length && initialRun.length < startCoinBudget;
    i += stride
  ) {
    initialRun.push(priority[i]);
  }
  const used = new Set(initialRun.map((c) => `${c.x},${c.y}`));
  const reservedRun = cappedRun.filter((c) => !used.has(`${c.x},${c.y}`));

  return {
    initialRun,
    reservedRun,
    initialAxo: [],
    reservedAxo: initialAxo,
  };
}

function formatBossTitle(type) {
  return String(type || "Boss")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toUpperCase();
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function colorWithAlpha(hex, alpha) {
  const raw = String(hex || "").replace("#", "");
  if (raw.length !== 6) return `rgba(149,227,255,${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function normalizeAssetPathForMatch(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .toLowerCase();
}

function collectWorldTileSpritePaths(worldName) {
  const key = String(worldName || "ice").toLowerCase();
  const worldVisual = WORLD_VISUALS[key] || WORLD_VISUALS.ice;
  const paths = new Set();
  const addPath = (path) => {
    const normalized = normalizeAssetPathForMatch(path);
    if (normalized) paths.add(normalized);
  };
  Object.values(worldVisual?.tileTextures || {}).forEach(addPath);
  Object.values(worldVisual?.variants || {}).forEach(addPath);
  return paths;
}

function toPublicAssetPath(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const normalizedPath = src.replace(/^\/+/, "");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  // Relative to the page URL so the game works from any subdirectory.
  return normalizedPath;
}

function toAssetCacheKey(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) {
    try {
      return new URL(src).pathname.replace(/^\/+/, "");
    } catch {
      return src;
    }
  }
  return src.replace(/^\/+/, "");
}

function hasRenderableImage(img) {
  return Boolean(img && img.width > 2 && img.height > 2);
}
