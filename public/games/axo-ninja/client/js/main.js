import { CONST } from "./config/constants.js";
import {
  getBootAssetPaths,
  getLevelAssetPaths,
  preloadPaths,
  SFX,
} from "./core/assets.js";
import { InputManager } from "./core/input.js";
import { AudioManager } from "./core/audio.js";
import { GameLoop } from "./core/gameLoop.js";
import {
  guestLogin,
  setToken,
  getToken,
  getProfile,
  getGameConfig,
  completeRun,
  claimCore,
  patchProgress,
} from "./api/index.js";
import { AppUI } from "./ui/appUi.js";
import { GameplayScene } from "./systems/gameplayScene.js";
import { ATTUNEMENT_OPTION, ELEMENT } from "./config/elements.js";
import { HEROES } from "./config/heroes.js";
import {
  getFallbackLevelConfig,
  getFallbackLevelConfigById,
} from "./config/levelFallbacks.js";
import { getDprCapForViewportClass, isIOSDevice } from "./utils/platform.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
canvas.tabIndex = 0;
let lastCanvasTapAt = 0;
const WARMABLE_SFX_PATHS = new Set(Object.values(SFX).filter(Boolean));
const BOOT_ASSET_PATHS = getBootAssetPaths();
const BOOT_AUDIO_PATHS = extractWarmSfxPaths(BOOT_ASSET_PATHS);

installBrowserGuards();

function installBrowserGuards() {
  window.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );
}

function extractWarmSfxPaths(paths = []) {
  return [
    ...new Set(
      (paths || [])
        .map((path) => String(path || "").trim())
        .filter((path) => WARMABLE_SFX_PATHS.has(path)),
    ),
  ];
}

function canvasCoordsFromClient(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const w = canvas._logicalWidth ?? canvas.width;
  const h = canvas._logicalHeight ?? canvas.height;
  const scaleX = w / r.width;
  const scaleY = h / r.height;
  return {
    x: (clientX - r.left) * scaleX,
    y: (clientY - r.top) * scaleY,
  };
}

function canvasCoords(e) {
  return canvasCoordsFromClient(e.clientX, e.clientY);
}

function registerCanvasTapFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return false;
  }
  primeInteractiveAudio();
  const { x, y } = canvasCoordsFromClient(clientX, clientY);
  input.setPointerClick(x, y);
  canvas.focus();
  lastCanvasTapAt =
    typeof performance !== "undefined" && Number.isFinite(performance.now())
      ? performance.now()
      : Date.now();
  return true;
}

function registerCanvasTap(e) {
  registerCanvasTapFromClient(e.clientX, e.clientY);
}

canvas.addEventListener("click", (e) => {
  const now =
    typeof performance !== "undefined" && Number.isFinite(performance.now())
      ? performance.now()
      : Date.now();
  if (now - lastCanvasTapAt < 220) {
    canvas.focus();
    return;
  }
  registerCanvasTap(e);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    e.preventDefault();
  }
  registerCanvasTap(e);
});
canvas.addEventListener("pointermove", (e) => {
  const { x, y } = canvasCoords(e);
  input.setPointerPosition(x, y);
});
canvas.addEventListener("pointerleave", () => {
  input.setPointerPosition(-1, -1);
});
window.addEventListener(
  "pointerup",
  (e) => {
    if (!scene?.gameOverActive && !scene?.showPause) return;
    if (e.target === canvas) return;
    const handled = registerCanvasTapFromClient(e.clientX, e.clientY);
    if (handled && e.cancelable) e.preventDefault();
  },
  true,
);
window.addEventListener(
  "touchend",
  (e) => {
    if (!scene?.gameOverActive && !scene?.showPause) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const handled = registerCanvasTapFromClient(touch.clientX, touch.clientY);
    if (handled && e.cancelable) e.preventDefault();
  },
  { capture: true, passive: false },
);

const uiRoot = document.getElementById("uiRoot");
const input = new InputManager();
const audio = new AudioManager();
const ui = new AppUI(uiRoot);

function primeInteractiveAudio(paths = BOOT_AUDIO_PATHS) {
  if (!audio) return;
  void audio.ensureUnlocked?.();
  void audio.warmSfx?.(extractWarmSfxPaths(paths));
}

uiRoot.addEventListener(
  "pointerup",
  () => {
    primeInteractiveAudio();
  },
  true,
);

const GUEST_PROFILE_KEY = "axo_guest_profile";
const GUEST_PROFILE_SESSION_KEY = "axo_guest_profile_session";
const GUEST_ID_STORAGE_KEY = "axo_guest_id";
const AUTH_TOKEN_STORAGE_KEY = "axo_ninja_session";
const PLAYER_META_PREFIX = "axo_player_meta_";
const TOTAL_LEVELS = 4;
const FINAL_CHEST_REWARD_AXO = 8000;
const FIXED_CAMPAIGN_HEARTS = 5; // fallback when hero config not loaded
const LEVEL_COMPLETE_AUTO_CONTINUE_MS = 3 * 1000;
const PROGRESS_AUTOSAVE_DELAY_MS = 900;
const PROGRESS_RETRY_DELAY_MS = 4000;
const DEFAULT_LEVEL_ORDER = [1, 2, 3, 4];
const HERO_CODE_ALIAS = {
  axolittle: "ninja",
};

const state = {
  screen: "boot",
  profile: null,
  authMode: null, // "player" | null
  levelConfigById: {},
  levelOrder: [...DEFAULT_LEVEL_ORDER],
  heroConfigByCode: {},
  heroConfigById: {},
  heroCodes: [],
  selectedHero: "ninja",
  selectedHeroDbId: null,
  selectedLevel: DEFAULT_LEVEL_ORDER[0],
  currentLevel: DEFAULT_LEVEL_ORDER[0],
  campaignHearts: FIXED_CAMPAIGN_HEARTS,
  campaignCoinBase: 0,
  campaignRunCoins: 0,
  finalChestContext: null,
  levelCompletePayload: null,
  pendingRebindAction: null,
  previousScreen: null,
  previousMenuOptions: null,
  lastMainMenuOptions: {},
  // In-memory per-level manifest cache to avoid duplicate network fetches
  // during gameplay scene restarts (e.g. game over retry).
  loadedManifestByLevelId: Object.create(null),
  pendingManifestRequests: Object.create(null),
};

let scene = null;
let rebindKeyListener = null;
let routeMapAutoContinueTimer = null;
let progressAutosaveTimer = null;
let progressRetryTimer = null;
let progressSaveInFlight = false;
let progressSaveQueued = false;
let runSyncRetryTimer = null;
let runSyncInFlight = false;
const pendingRunSyncQueue = [];

input.setSettingsChangeHandler(handleInputSettingsChanged);

function normalizeLevelConfigById(levels) {
  const toNonNegativeInt = (value, fallback = 0) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return fallback;
    return Math.floor(n);
  };

  const normalizeBossCode = (value) => {
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
  };

  const normalizeEnemyList = (value) => {
    if (!Array.isArray(value)) return [];
    const enemies = [];
    for (const entry of value) {
      const enemyCode = String(entry?.enemyCode || "").trim();
      if (!enemyCode) continue;
      enemies.push({
        enemyCode,
        enemyName: String(entry?.enemyName || enemyCode).trim() || enemyCode,
        hp: toNonNegativeInt(entry?.hp, 0),
        damage: toNonNegativeInt(entry?.damage, 0),
        count: toNonNegativeInt(entry?.count, 0),
        reward: toNonNegativeInt(entry?.reward, 0),
        active: entry?.active !== false,
      });
    }
    return enemies;
  };

  const toNumberMap = (value) => {
    if (!value || typeof value !== "object") return {};
    const out = {};
    for (const [key, raw] of Object.entries(value)) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) out[key] = n;
    }
    return out;
  };

  const buildEnemyListFromMaps = (enemyTypeMaxCount, enemyRewards) => {
    const out = [];
    for (const [enemyCode, rawCount] of Object.entries(
      enemyTypeMaxCount || {},
    )) {
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
  };

  const byId = getFallbackLevelConfigById();
  if (!Array.isArray(levels)) return byId;

  for (const level of levels) {
    const id = Number(level?.levelId);
    if (!Number.isFinite(id) || id < 1) continue;
    const fallbackLevel = getFallbackLevelConfig(id);
    const enemyRewards = {
      ...fallbackLevel.enemyRewards,
      ...toNumberMap(level?.enemyRewards),
    };
    const enemyTypeMaxCount = {
      ...fallbackLevel.enemyTypeMaxCount,
      ...toNumberMap(level?.enemyTypeMaxCount),
    };
    const enemies = normalizeEnemyList(level?.enemies);
    const resolvedEnemies =
      enemies.length > 0
        ? enemies
        : buildEnemyListFromMaps(enemyTypeMaxCount, enemyRewards);
    const enemiesByCode = {};
    for (const entry of resolvedEnemies) {
      enemiesByCode[entry.enemyCode] = entry;
    }
    byId[id] = {
      isFallback: false,
      levelId: id,
      levelName: String(
        level?.levelName || fallbackLevel.levelName || "",
      ).trim(),
      bossName: String(level?.bossName || fallbackLevel.bossName || "").trim(),
      bossCode: normalizeBossCode(level?.bossCode || fallbackLevel.bossCode),
      bossHp: toNonNegativeInt(level?.bossHp, fallbackLevel.bossHp),
      bossDamage: toNonNegativeInt(level?.bossDamage, fallbackLevel.bossDamage),
      maxTotalCoins: toNonNegativeInt(
        level?.maxTotalCoins,
        fallbackLevel.maxTotalCoins,
      ),
      maxCollectibleCoins: toNonNegativeInt(
        level?.maxCollectibleCoins,
        fallbackLevel.maxCollectibleCoins,
      ),
      coinValue: toNonNegativeInt(level?.coinValue, fallbackLevel.coinValue),
      bossReward: toNonNegativeInt(level?.bossReward, fallbackLevel.bossReward),
      enemyMaxCount: toNonNegativeInt(
        level?.enemyMaxCount,
        fallbackLevel.enemyMaxCount,
      ),
      enemyRewards,
      enemyTypeMaxCount,
      enemies: resolvedEnemies,
      enemiesByCode,
      active:
        level?.active === undefined
          ? Boolean(fallbackLevel.active)
          : Boolean(level.active),
    };
  }

  return byId;
}

function normalizeHeroConfig(heroes) {
  const byCode = {};
  const byId = {};
  const heroCodes = [];

  if (!Array.isArray(heroes)) {
    return { byCode, byId, heroCodes };
  }

  for (const hero of heroes) {
    const rawCode = String(hero?.heroCode || "")
      .trim()
      .toLowerCase();
    const heroCode = HERO_CODE_ALIAS[rawCode] || rawCode;
    if (!heroCode) continue;

    const heroId = String(hero?._id || "").trim();
    const normalized = {
      _id: heroId || null,
      heroCode,
      heroName: String(hero?.heroName || heroCode).trim() || heroCode,
      maxHearts: Math.max(1, Math.floor(Number(hero?.maxHearts || 1))),
      damage: Math.max(1, Math.floor(Number(hero?.damage || 1))),
      active: hero?.active !== false,
    };

    byCode[heroCode] = normalized;
    if (heroId) {
      byId[heroId] = normalized;
    }
    if (!heroCodes.includes(heroCode)) {
      heroCodes.push(heroCode);
    }
  }

  return { byCode, byId, heroCodes };
}

function getDefaultHeroCode() {
  if (Array.isArray(state.heroCodes) && state.heroCodes.length > 0) {
    return state.heroCodes[0];
  }
  if (state.heroConfigByCode?.ninja) return "ninja";
  return "ninja";
}

function resolveHeroCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const aliased = HERO_CODE_ALIAS[lower] || lower;
  if (state.heroConfigByCode?.[aliased]) return aliased;

  const byId = state.heroConfigById?.[raw];
  if (byId?.heroCode) return byId.heroCode;

  return null;
}

function resolveHeroDbIdByCode(heroCode) {
  const code = resolveHeroCode(heroCode);
  if (!code) return null;
  return state.heroConfigByCode?.[code]?._id || null;
}

function ensureSelectedHeroIsValid() {
  const resolved = resolveHeroCode(state.selectedHero);
  state.selectedHero = resolved || getDefaultHeroCode();
  state.selectedHeroDbId = resolveHeroDbIdByCode(state.selectedHero);
}

function syncSelectedHeroFromProfile(profile) {
  const resolved = resolveHeroCode(profile?.selectedHeroId);
  if (resolved) {
    state.selectedHero = resolved;
    state.selectedHeroDbId = resolveHeroDbIdByCode(resolved);
    return;
  }
  ensureSelectedHeroIsValid();
}

function getHeroDisplayName(heroCode = state.selectedHero) {
  const code = resolveHeroCode(heroCode) || getDefaultHeroCode();
  return (
    state.heroConfigByCode?.[code]?.heroName ||
    HEROES?.[code]?.name ||
    String(code || "Hero")
  );
}

/** Max campaign hearts from selected hero's maxHearts in API config, or fallback. */
function getCampaignMaxHearts() {
  const code = resolveHeroCode(state.selectedHero) || getDefaultHeroCode();
  const fromHero = state.heroConfigByCode?.[code]?.maxHearts;
  const n = Number(fromHero);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return FIXED_CAMPAIGN_HEARTS;
}

function getProfileHeroMaxHearts(heroCode = "ninja") {
  const code = resolveHeroCode(heroCode) || "ninja";
  const runtimeMax = Number(state.heroConfigByCode?.[code]?.maxHearts);
  if (Number.isFinite(runtimeMax) && runtimeMax >= 1) {
    return Math.floor(runtimeMax);
  }
  const staticMax = Number(HEROES?.[code]?.maxHearts ?? HEROES?.[code]?.hearts);
  if (Number.isFinite(staticMax) && staticMax >= 1) {
    return Math.floor(staticMax);
  }
  return FIXED_CAMPAIGN_HEARTS;
}

function isProfileVeteranModeEnabled(profile) {
  if (!profile || typeof profile !== "object") return false;
  return Boolean(profile.veteranModeEnabled || profile.permanentElementCore);
}

async function loadPublicGameConfig() {
  try {
    const config = await getGameConfig();
    const normalizedHeroes = normalizeHeroConfig(config?.heroes);
    state.heroConfigByCode = normalizedHeroes.byCode;
    state.heroConfigById = normalizedHeroes.byId;
    state.heroCodes = normalizedHeroes.heroCodes;
    state.levelConfigById = normalizeLevelConfigById(config?.levels);
    const levelsArray = Array.isArray(config?.levels) ? config.levels : [];
    state.levelOrder =
      levelsArray.length > 0
        ? levelsArray
            .map((l) => Number(l?.levelId))
            .filter((id) => Number.isFinite(id) && id >= 1)
        : [...DEFAULT_LEVEL_ORDER];
    if (state.levelOrder.length === 0)
      state.levelOrder = [...DEFAULT_LEVEL_ORDER];
    ensureSelectedHeroIsValid();
    state.campaignHearts = getCampaignMaxHearts();
  } catch {
    state.heroConfigByCode = {};
    state.heroConfigById = {};
    state.heroCodes = [];
    state.levelConfigById = getFallbackLevelConfigById();
    state.levelOrder = [...DEFAULT_LEVEL_ORDER];
    state.selectedHero = "ninja";
    state.selectedHeroDbId = null;
  }
}

function disposeScene() {
  if (scene && typeof scene.dispose === "function") {
    scene.dispose();
  }
  scene = null;
}

function stopBackgroundMusic() {
  if (!audio) return;
  if (typeof audio.stopMusic === "function") {
    audio.stopMusic();
    return;
  }
  if (!audio.currentTrack) return;
  audio.currentTrack.pause();
  audio.currentTrack.currentTime = 0;
  audio.currentTrack = null;
}

const loop = new GameLoop(update, draw);

function getViewportClass() {
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

function isMobileDevice() {
  const viewportClass = getViewportClass();
  return viewportClass === "mobile" || viewportClass === "tablet";
}

function updateRotateOverlay() {
  const overlay = document.getElementById("rotate-overlay");
  if (!overlay) return;
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const mobile = isMobileDevice();
  if (mobile && portrait) {
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
  } else {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
  }
}

function updateFullscreenPrompt() {
  const promptEl = document.getElementById("fullscreen-prompt");
  if (!promptEl) return;
  const mobile = isMobileDevice();
  const landscape = window.matchMedia("(orientation: landscape)").matches;
  const inFullscreen = Boolean(document.fullscreenElement);
  if (mobile && landscape && !inFullscreen) {
    promptEl.classList.add("is-visible");
    promptEl.setAttribute("aria-hidden", "false");
  } else {
    promptEl.classList.remove("is-visible");
    promptEl.setAttribute("aria-hidden", "true");
  }
}

function setupFullscreenPrompt() {
  const promptEl = document.getElementById("fullscreen-prompt");
  if (!promptEl) return;
  const onTap = () => {
    requestFullscreenIfMobile();
    promptEl.classList.remove("is-visible");
    promptEl.setAttribute("aria-hidden", "true");
  };
  promptEl.addEventListener("click", onTap);
  document.addEventListener("fullscreenchange", updateFullscreenPrompt);
}

function requestFullscreenIfMobile() {
  if (!isMobileDevice()) return;
  try {
    const doc = document.documentElement;
    if (
      !document.fullscreenElement &&
      typeof doc.requestFullscreen === "function"
    ) {
      doc
        .requestFullscreen()
        .then(() => {
          const orientation = screen.orientation;
          if (orientation && typeof orientation.lock === "function") {
            orientation.lock("landscape").catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch (_) {}
}

function tryLockLandscape() {
  if (!isMobileDevice()) return;
  try {
    if (
      document.fullscreenElement &&
      screen.orientation &&
      typeof screen.orientation.lock === "function"
    ) {
      screen.orientation.lock("landscape").catch(() => {});
    }
  } catch (_) {}
}

function getFirstCampaignLevel() {
  const order =
    state.levelOrder && state.levelOrder.length > 0
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER;
  return order[0];
}

function getNextCampaignLevel(currentLevelId) {
  const order =
    state.levelOrder && state.levelOrder.length > 0
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER;
  const idx = order.indexOf(Number(currentLevelId));
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function clearRouteMapAutoContinueTimer() {
  if (routeMapAutoContinueTimer) {
    window.clearTimeout(routeMapAutoContinueTimer);
    routeMapAutoContinueTimer = null;
  }
}

function sanitizeHearts(value, fallback) {
  const maxHearts = getCampaignMaxHearts();
  const safeFallback = Math.max(
    1,
    Math.min(maxHearts, Number(fallback ?? maxHearts)),
  );
  const num = Number(value);
  if (!Number.isFinite(num)) return safeFallback;
  return Math.max(1, Math.min(maxHearts, Math.floor(num)));
}

function resetCampaignHearts() {
  state.campaignHearts = getCampaignMaxHearts();
}

function resetCampaignProgress() {
  resetCampaignHearts();
  const base = Number(state.profile?.coinsTotal || 0);
  state.campaignCoinBase = Math.max(0, Math.floor(base));
  state.campaignRunCoins = 0;
  state.finalChestContext = null;
  syncActiveSceneCampaignRunCoinCarry();
}

function addCampaignRunCoins(value) {
  const gain = Math.max(0, Math.floor(Number(value) || 0));
  if (gain <= 0) return;
  state.campaignRunCoins = Math.max(
    0,
    Math.floor(Number(state.campaignRunCoins || 0)) + gain,
  );
  syncActiveSceneCampaignRunCoinCarry();
}

function reconcileCampaignRunCoins(optimisticGain, confirmedGain) {
  const optimistic = Math.max(0, Math.floor(Number(optimisticGain) || 0));
  const confirmed = Math.max(0, Math.floor(Number(confirmedGain) || 0));
  if (optimistic === confirmed) return;
  const current = Math.max(0, Math.floor(Number(state.campaignRunCoins || 0)));
  state.campaignRunCoins = Math.max(0, current - optimistic + confirmed);
  syncActiveSceneCampaignRunCoinCarry();
  if (state.screen === "credits") {
    showCredits();
  }
}

function createFinalChestContext() {
  const baseCoins = Math.max(
    0,
    Math.floor(
      Number(state.levelCompletePayload?.runCoins ?? state.campaignRunCoins ?? 0) ||
        0,
    ),
  );
  const context = {
    baseCoins,
    chestCoins: FINAL_CHEST_REWARD_AXO,
    opened: false,
    guestRewardApplied: false,
  };
  state.finalChestContext = context;
  return context;
}

function ensureFinalChestContext({ reset = false } = {}) {
  if (reset || !state.finalChestContext) {
    return createFinalChestContext();
  }
  return state.finalChestContext;
}

function buildFinalChestRewardSummary(context = state.finalChestContext) {
  const baseCoins = Math.max(
    0,
    Math.floor(Number(context?.baseCoins ?? state.campaignRunCoins ?? 0) || 0),
  );
  const defaultChestCoins = Math.max(
    0,
    Math.floor(Number(context?.chestCoins ?? FINAL_CHEST_REWARD_AXO) || 0),
  );
  const currentCampaignCoins = Math.max(
    0,
    Math.floor(Number(state.campaignRunCoins || 0)),
  );
  const totalCoins =
    context?.opened && currentCampaignCoins > baseCoins
      ? currentCampaignCoins
      : baseCoins + defaultChestCoins;
  const chestCoins = Math.max(0, totalCoins - baseCoins);

  return {
    collectedCoins: baseCoins,
    chestCoins,
    totalCoins,
  };
}

function markFinalChestOpened() {
  const context = ensureFinalChestContext();
  if (context.opened) return;

  context.opened = true;
  if (state.authMode === "player") {
    saveProfileMeta();
  }
}

function getFinalCampaignDisplayCoins() {
  if (state.finalChestContext?.opened) {
    return buildFinalChestRewardSummary(state.finalChestContext).totalCoins;
  }
  return Math.max(0, Math.floor(Number(state.campaignRunCoins || 0)));
}

function syncActiveSceneCampaignRunCoinCarry() {
  if (!scene || typeof scene.setCampaignRunCoinCarry !== "function") return;
  scene.setCampaignRunCoinCarry(state.campaignRunCoins);
}

function applyCollectedAxoCoins(gain) {
  const safeGain = Math.max(0, Math.floor(Number(gain) || 0));
  if (safeGain <= 0 || !state.profile) return;
  // Online player totals should only change from server-confirmed responses.
  if (state.authMode !== "player") return;
}

function applyWinHeartRecovery(payload) {
  if (!payload?.bossDefeated) return;
  const maxHearts = getCampaignMaxHearts();
  const heartsRemaining = sanitizeHearts(
    payload.heartsRemaining,
    state.campaignHearts,
  );
  state.campaignHearts =
    heartsRemaining < maxHearts ? heartsRemaining + 1 : heartsRemaining;
}

async function init() {
  state.screen = "loading";
  drawMenuBackdrop();
  ui.loading();
  await preloadPaths(BOOT_ASSET_PATHS);
  await loadPublicGameConfig();
  clearLegacyProgressStorage();

  const savedToken = getStoredToken();
  if (savedToken) {
    setToken(savedToken);
    try {
      await restorePlayerProfile();
    } catch {
      clearPlayerSession();
    }
  }

  if (!state.profile) {
    await ensureGuestSession({ silentFailure: true });
  }

  if (state.profile) {
    normalizeProfile(state.profile);
    applyProfileSettings(state.profile);
    ensureSelectedHeroIsValid();
  }

  updateRotateOverlay();
  updateFullscreenPrompt();
  setupFullscreenPrompt();
  window.addEventListener("orientationchange", () => {
    updateRotateOverlay();
    updateFullscreenPrompt();
  });
  window.addEventListener("keydown", handleKeyboardAudioMute);
  window.addEventListener("resize", () => {
    updateRotateOverlay();
    updateFullscreenPrompt();
  });
  showMainMenu();
  loop.start();
}

function syncGameplayAudioUi() {
  if (typeof ui?.setGameplayAudioEnabled !== "function") return;
  const enabled =
    typeof audio?.isAudioEnabled === "function" ? audio.isAudioEnabled() : true;
  ui.setGameplayAudioEnabled(enabled);
}

function isEditableKeyboardTarget(target) {
  if (!target || typeof target !== "object") return false;
  if (target.isContentEditable) return true;
  const tagName = String(target.tagName || "").toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function resolveAudioMediaKeyCommand(value) {
  switch (String(value || "")) {
    case "AudioVolumeMute":
    case "VolumeMute":
    case "MediaMute":
      return "mute";
    default:
      return "";
  }
}

function handleKeyboardAudioMute(event) {
  const code = String(event?.code || "");
  const key = String(event?.key || "");
  const mediaCommand =
    resolveAudioMediaKeyCommand(code) || resolveAudioMediaKeyCommand(key);
  const isMuteKey = mediaCommand === "mute";
  const isManualMuteKey =
    code === "KeyM" || (!code && key.length === 1 && key.toLowerCase() === "m");
  if ((!isMuteKey && !isManualMuteKey) || event?.repeat) return;
  if (isManualMuteKey && isEditableKeyboardTarget(event?.target)) return;

  primeInteractiveAudio();

  if (typeof audio?.setMuted === "function") {
    if (isMuteKey || isManualMuteKey) {
      audio.toggleMuted();
    }
  } else if (typeof audio?.setAudioEnabled === "function") {
    if (isMuteKey || isManualMuteKey) {
      audio.toggleAudioEnabled();
    }
  } else if (typeof audio?.toggleAudioEnabled === "function") {
    if (isMuteKey || isManualMuteKey) {
      audio.toggleAudioEnabled();
    }
  } else if (scene && typeof scene.toggleMusicButton === "function") {
    if (isMuteKey || isManualMuteKey) {
      scene.toggleMusicButton();
    }
  }

  syncGameplayAudioUi();
  if (event?.cancelable) event.preventDefault();
}

function update(dt) {
  if (state.screen === "gameplay" && scene) {
    scene.update(dt);
    return;
  }

  input.update();
  input.endFrame();
}

function draw() {
  const dpr = canvas._dpr || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  if (state.screen === "gameplay" && scene) {
    scene.draw();
  } else {
    drawMenuBackdrop();
  }
  ctx.restore();
}

let menuBackdropGradient = null;
let menuBackdropGradientH = 0;

function drawMenuBackdrop() {
  const w = canvas._logicalWidth ?? canvas.width;
  const h = canvas._logicalHeight ?? canvas.height;
  if (!menuBackdropGradient || menuBackdropGradientH !== h) {
    menuBackdropGradient = ctx.createLinearGradient(0, 0, 0, h);
    menuBackdropGradient.addColorStop(0, "#1f3247");
    menuBackdropGradient.addColorStop(1, "#17242f");
    menuBackdropGradientH = h;
  }
  ctx.fillStyle = menuBackdropGradient;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 ? "#8ec5ff" : "#f8dfa1";
    ctx.fillRect(
      ((i * 96 + performance.now() * 0.02) % (w + 100)) - 60,
      i * 44,
      130,
      10,
    );
  }
  ctx.globalAlpha = 1;
}

function leaveGuest() {
  clearPlayerSession();
  state.authMode = null;
  state.profile = null;
  ui.toast("Adventure session ended.");
  showMainMenu();
}

function getStoredToken() {
  return (
    (typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null) ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null)
  );
}

function saveStoredToken(token) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

function clearStoredToken() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

function clearPlayerSession() {
  clearStoredToken();
  setToken(null);
  progressSaveQueued = false;
  progressSaveInFlight = false;
  runSyncInFlight = false;
  pendingRunSyncQueue.length = 0;
  if (progressAutosaveTimer) {
    window.clearTimeout(progressAutosaveTimer);
    progressAutosaveTimer = null;
  }
  if (progressRetryTimer) {
    window.clearTimeout(progressRetryTimer);
    progressRetryTimer = null;
  }
  if (runSyncRetryTimer) {
    window.clearTimeout(runSyncRetryTimer);
    runSyncRetryTimer = null;
  }
}

function createGuestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest-${crypto.randomUUID().toLowerCase()}`;
  }
  const random = Math.random().toString(36).slice(2, 12);
  return `guest-${Date.now().toString(36)}-${random}`;
}

function getOrCreateGuestId() {
  if (typeof localStorage === "undefined") {
    return createGuestId();
  }
  const existing = String(localStorage.getItem(GUEST_ID_STORAGE_KEY) || "").trim();
  if (existing) return existing;
  const nextId = createGuestId();
  localStorage.setItem(GUEST_ID_STORAGE_KEY, nextId);
  return nextId;
}

function clearLegacyProgressStorage() {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(GUEST_PROFILE_KEY);
      const keysToRemove = [];
      for (let idx = 0; idx < localStorage.length; idx += 1) {
        const key = String(localStorage.key(idx) || "");
        if (key.startsWith(PLAYER_META_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {}
  }

  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(GUEST_PROFILE_SESSION_KEY);
    } catch {}
  }
}

function cloneProgressValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function buildGameStateSnapshot() {
  return cloneProgressValue({
    screen: state.screen,
    selectedLevel: Number(state.selectedLevel || getFirstCampaignLevel()),
    currentLevel: Number(state.currentLevel || getFirstCampaignLevel()),
    selectedHero: state.selectedHero || getDefaultHeroCode(),
    selectedHeroDbId: state.selectedHeroDbId || null,
    campaignHearts: sanitizeHearts(state.campaignHearts, FIXED_CAMPAIGN_HEARTS),
    campaignCoinBase: Math.max(0, Math.floor(Number(state.campaignCoinBase || 0))),
    campaignRunCoins: Math.max(0, Math.floor(Number(state.campaignRunCoins || 0))),
    finalChestContext: state.finalChestContext || null,
    levelCompletePayload: state.levelCompletePayload || null,
    levelOrder: Array.isArray(state.levelOrder) ? [...state.levelOrder] : [...DEFAULT_LEVEL_ORDER],
  });
}

function buildProgressSnapshot(profile = state.profile) {
  if (!profile || typeof profile !== "object") return null;
  normalizeProfile(profile);

  return cloneProgressValue({
    score: Math.max(0, Math.floor(Number(profile.score || 0))),
    bestScore: Math.max(0, Math.floor(Number(profile.bestScore || profile.score || 0))),
    coinBalance: Math.max(0, Math.floor(Number(profile.coinBalance || 0))),
    coinsTotal: Math.max(0, Math.floor(Number(profile.coinsTotal || 0))),
    coins: Math.max(0, Math.floor(Number(profile.coins || profile.coinsTotal || 0))),
    lifetimeCoinsEarned: Math.max(
      0,
      Math.floor(Number(profile.lifetimeCoinsEarned || profile.coinsTotal || 0)),
    ),
    xp: Math.max(0, Math.floor(Number(profile.xp || 0))),
    level: Math.max(1, Math.floor(Number(profile.level || 1))),
    lives: Math.max(0, Math.floor(Number(profile.lives || getCampaignMaxHearts()))),
    currentQuest: String(profile.currentQuest || "").trim(),
    completedQuests: Array.isArray(profile.completedQuests)
      ? [...new Set(profile.completedQuests.map((entry) => String(entry || "").trim()).filter(Boolean))]
      : [],
    unlockedCharacters: Array.isArray(profile.unlockedCharacters)
      ? [...new Set(profile.unlockedCharacters.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean))]
      : [],
    unlockedSkins: Array.isArray(profile.unlockedSkins)
      ? [...new Set(profile.unlockedSkins.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean))]
      : [],
    selectedHeroId: profile.selectedHeroId || state.selectedHeroDbId || null,
    unlockedLevel: Math.max(1, Math.floor(Number(profile.unlockedLevel || TOTAL_LEVELS))),
    levelCompletions: Array.isArray(profile.levelCompletions)
      ? [...new Set(profile.levelCompletions.map((value) => Math.max(1, Math.floor(Number(value || 1)))))]
      : [],
    bestRunCoinsByLevel:
      profile.bestRunCoinsByLevel && typeof profile.bestRunCoinsByLevel === "object"
        ? { ...profile.bestRunCoinsByLevel }
        : {},
    bestTimeByLevel:
      profile.bestTimeByLevel && typeof profile.bestTimeByLevel === "object"
        ? { ...profile.bestTimeByLevel }
        : {},
    heroStats: profile.heroStats && typeof profile.heroStats === "object" ? { ...profile.heroStats } : {},
    unlockedElements: Array.isArray(profile.unlockedElements)
      ? [...new Set(profile.unlockedElements.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean))]
      : [],
    selectedAttunement: String(profile.selectedAttunement || ATTUNEMENT_OPTION.DEFAULT).trim().toLowerCase(),
    permanentElementCore: profile.permanentElementCore || null,
    veteranModeEnabled: Boolean(profile.veteranModeEnabled || profile.permanentElementCore),
    healthUpgradePurchases: Array.isArray(profile.healthUpgradePurchases)
      ? profile.healthUpgradePurchases.map((entry) => ({
          heroId: String(entry?.heroId || "").trim().toLowerCase() || "ninja",
          levelId: Math.max(1, Math.floor(Number(entry?.levelId || 1))),
          createdAt: entry?.createdAt || new Date().toISOString(),
        }))
      : [],
    upgrades: profile.upgrades && typeof profile.upgrades === "object" ? cloneProgressValue(profile.upgrades) : {},
    inventory: profile.inventory && typeof profile.inventory === "object" ? cloneProgressValue(profile.inventory) : {},
    achievements:
      profile.achievements && typeof profile.achievements === "object"
        ? cloneProgressValue(profile.achievements)
        : {},
    settings: input.getSettingsSnapshot(),
    gameState: buildGameStateSnapshot(),
    attempt: Math.max(0, Math.floor(Number(profile.attempt || 0))),
  });
}

function scheduleProgressSave({ immediate = false } = {}) {
  if (!(state.authMode === "player" && state.profile && getToken())) return;
  progressSaveQueued = true;

  if (progressRetryTimer) {
    window.clearTimeout(progressRetryTimer);
    progressRetryTimer = null;
  }

  if (progressAutosaveTimer) {
    window.clearTimeout(progressAutosaveTimer);
    progressAutosaveTimer = null;
  }

  if (immediate) {
    void flushProgressSave();
    return;
  }

  progressAutosaveTimer = window.setTimeout(() => {
    progressAutosaveTimer = null;
    void flushProgressSave();
  }, PROGRESS_AUTOSAVE_DELAY_MS);
}

async function flushProgressSave() {
  if (progressSaveInFlight || !progressSaveQueued) return;
  if (!(state.authMode === "player" && state.profile && getToken())) return;

  const snapshot = buildProgressSnapshot();
  if (!snapshot) return;

  progressSaveInFlight = true;
  progressSaveQueued = false;

  try {
    const res = await patchProgress(snapshot);
    if (res?.profile) {
      mergeServerProfileIntoState(res.profile);
    }
  } catch {
    progressSaveQueued = true;
    if (!progressRetryTimer) {
      progressRetryTimer = window.setTimeout(() => {
        progressRetryTimer = null;
        void flushProgressSave();
      }, PROGRESS_RETRY_DELAY_MS);
    }
  } finally {
    progressSaveInFlight = false;
  }
}

function saveProfileMeta(options = {}) {
  if (!state.profile) return;
  normalizeProfile(state.profile);
  state.profile.settings = input.getSettingsSnapshot();
  state.profile.gameState = buildGameStateSnapshot();
  scheduleProgressSave(options);
}

function applyProfileSettings(profile) {
  if (!profile || typeof profile !== "object") return;
  input.applySettingsSnapshot(profile.settings || {});
}

function handleInputSettingsChanged(settings) {
  if (!state.profile || state.authMode !== "player") return;
  state.profile.settings = settings;
  saveProfileMeta();
}

async function ensureGuestSession({ silentFailure = false } = {}) {
  if (state.authMode === "player" && state.profile && getToken()) {
    return state.profile;
  }

  try {
    await loginGuestPlayer();
    return state.profile;
  } catch (error) {
    clearPlayerSession();
    state.authMode = null;
    state.profile = null;
    if (!silentFailure) {
      ui.toast("Could not start the adventure. Please reload and try again.");
    }
    return null;
  }
}

function normalizeRunPayloadForRetry(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  return cloneProgressValue({
    ...source,
    clientRunId:
      typeof source.clientRunId === "string" && source.clientRunId.trim()
        ? source.clientRunId.trim()
        : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  });
}

function scheduleRunSyncRetry(delay = PROGRESS_RETRY_DELAY_MS) {
  if (runSyncRetryTimer) return;
  runSyncRetryTimer = window.setTimeout(() => {
    runSyncRetryTimer = null;
    void flushPendingRunSyncs();
  }, delay);
}

function queueRunSync(payload, { notify = true } = {}) {
  const normalized = normalizeRunPayloadForRetry(payload);
  const existingIndex = pendingRunSyncQueue.findIndex(
    (entry) => entry.clientRunId === normalized.clientRunId,
  );
  if (existingIndex >= 0) {
    pendingRunSyncQueue[existingIndex] = normalized;
  } else {
    pendingRunSyncQueue.push(normalized);
  }
  scheduleRunSyncRetry();
  if (notify) {
    ui.toast("Progress sync delayed. Retrying automatically.");
  }
}

async function flushPendingRunSyncs() {
  if (runSyncInFlight || pendingRunSyncQueue.length === 0) return;
  if (!(state.authMode === "player" && getToken())) {
    scheduleRunSyncRetry();
    return;
  }

  runSyncInFlight = true;
  try {
    while (pendingRunSyncQueue.length > 0) {
      const payload = pendingRunSyncQueue[0];
      try {
        const res = await completeRun(payload);
        applyCompleteLevelResult(res);
        pendingRunSyncQueue.shift();
      } catch (error) {
        const status = Number(error?.status || 0);
        if (status >= 400 && status < 500 && status !== 409) {
          pendingRunSyncQueue.shift();
          continue;
        }
        scheduleRunSyncRetry();
        break;
      }
    }
  } finally {
    runSyncInFlight = false;
    if (pendingRunSyncQueue.length > 0) {
      scheduleRunSyncRetry();
    }
  }
}

async function restorePlayerProfile() {
  const res = await getProfile();
  state.authMode = "player";
  mergeServerProfileIntoState(res.profile);
  applyProfileSettings(state.profile);
  void flushPendingRunSyncs();
  return state.profile;
}

async function loginGuestPlayer() {
  const login = await guestLogin({
    guestId: getOrCreateGuestId(),
  });
  setToken(login.token);
  saveStoredToken(login.token);
  state.authMode = "player";
  if (login?.profile) {
    mergeServerProfileIntoState(login.profile);
    applyProfileSettings(state.profile);
    void flushPendingRunSyncs();
    return state.profile;
  }
  return restorePlayerProfile();
}

async function startAdventureFromMenu() {
  if (state.authMode === "player" && state.profile && getToken()) {
    syncSelectedHeroFromProfile(state.profile);
    startPlayerAdventure();
    return;
  }

  const profile = await ensureGuestSession();
  if (!profile) {
    showMainMenu();
    return;
  }

  syncSelectedHeroFromProfile(profile);
  startPlayerAdventure();
}

function showMainMenu(options = {}) {
  clearRouteMapAutoContinueTimer();
  stopBackgroundMusic();
  input.clearAll();
  if (scene) {
    disposeScene();
  }
  state.finalChestContext = null;
  ensureSelectedHeroIsValid();
  const {
    leaderboardModalOpen = false,
    leaderboardLoading = false,
    leaderboardError = "",
    leaderboardLevelRows = [],
    leaderboardCoinRows = [],
    leaderboardHeroCoinRows = [],
    heroModalOpen = false,
    heroSelected = state.selectedHero,
  } = options;
  state.lastMainMenuOptions = {
    leaderboardModalOpen,
    leaderboardLoading,
    leaderboardError,
    leaderboardLevelRows: Array.isArray(leaderboardLevelRows)
      ? [...leaderboardLevelRows]
      : [],
    leaderboardCoinRows: Array.isArray(leaderboardCoinRows)
      ? [...leaderboardCoinRows]
      : [],
    leaderboardHeroCoinRows: Array.isArray(leaderboardHeroCoinRows)
      ? [...leaderboardHeroCoinRows]
      : [],
    heroModalOpen,
    heroSelected,
  };

  state.screen = "mainMenu";
  ui.mainMenu({
    coinsTotal: Number(state.profile?.coinsTotal || 0),
    localMode: false,
    onStart: () => {
      void startAdventureFromMenu();
    },
    onLeaderboard: showLeaderboard,
    socialLinks: CONST.MENU?.SOCIAL_LINKS || [],
    onSocialOpen: openSocialLink,
    leaderboardModalOpen,
    leaderboardLoading,
    leaderboardError,
    leaderboardLevelRows,
    leaderboardCoinRows,
    leaderboardHeroCoinRows,
    heroConfigByCode: state.heroConfigByCode,
    onLeaderboardClose: () => showMainMenu(),
    // Hero chooser is disabled: menu play path auto-selects Ninja.
    // heroModalOpen,
    // selectedHero: heroSelected,
    // onHeroSelect: (_heroId) => {
    //   state.selectedHero = "ninja";
    //   showMainMenu({ heroModalOpen: true, heroSelected: "ninja" });
    // },
    // onHeroConfirm: () => {
    //   state.selectedHero = "ninja";
    //   requestFullscreenIfMobile();
    //   resetCampaignProgress();
    //   startLevel(getFirstCampaignLevel());
    // },
    // onHeroBack: showMainMenu,
    onSettings: () => showSettings("mainMenu"),
    onExit: () => {
      ui.toast("Close the browser tab to exit.");
    },
  });
}

function openExternalUrl(
  url,
  popupBlockedMessage = "Allow popups to open the link.",
) {
  if (typeof window === "undefined") return false;
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return false;

  let targetUrl = "";
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (!/^https?:$/i.test(parsed.protocol)) {
      ui.toast("Only http and https links are supported.");
      return false;
    }
    targetUrl = parsed.toString();
  } catch {
    ui.toast("Link is not valid.");
    return false;
  }

  const popup = window.open(targetUrl, "_blank", "noopener,noreferrer");
  if (!popup) {
    ui.toast(popupBlockedMessage);
    return false;
  }
  return true;
}

function openSocialLink(socialId) {
  const socialLink = (Array.isArray(CONST.MENU?.SOCIAL_LINKS)
    ? CONST.MENU.SOCIAL_LINKS
    : []
  ).find((entry) => entry?.id === socialId);
  const label = String(socialLink?.label || "Social link").trim() || "Social link";
  const url = String(socialLink?.url || "").trim();

  if (!url) {
    ui.toast(`${label} link is not set yet.`);
    return;
  }

  openExternalUrl(url, `Allow popups to open ${label}.`);
}

async function restartCampaignAdventure() {
  if (!state.profile) {
    ui.toast("Start your adventure first.");
    showMainMenu();
    return;
  }

  stopBackgroundMusic();

  if (!getToken()) {
    const profile = await ensureGuestSession();
    if (!profile) {
      showMainMenu();
      return;
    }
  }
  syncSelectedHeroFromProfile(state.profile);

  resetCampaignProgress();
  const firstLevel = getFirstCampaignLevel();
  state.selectedLevel = firstLevel;
  startLevel(firstLevel);
}

function playAgainFromFinalScreen() {
  if (state.profile && state.authMode === "player") {
    void restartCampaignAdventure();
    return;
  }

  void startAsGuest();
}

async function startAsGuest() {
  const profile = await ensureGuestSession();
  if (!profile) {
    showMainMenu();
    return;
  }
  requestFullscreenIfMobile();
  ui.toast("Adventure started.");
  ensureSelectedHeroIsValid();
  resetCampaignProgress();
  const firstLevel = getFirstCampaignLevel();
  state.selectedLevel = firstLevel;
  startLevel(firstLevel);
}

function startPlayerAdventure() {
  if (!(state.authMode === "player" && state.profile && getToken())) {
    ensureSelectedHeroIsValid();
    ui.toast("Start your adventure first.");
    showMainMenu();
    return;
  }

  void restartCampaignAdventure();
  // state.screen = "mainMenu";
  // showMainMenu({ heroModalOpen: true, heroSelected: "ninja" });
}

async function startLevel(levelId) {
  clearRouteMapAutoContinueTimer();
  requestFullscreenIfMobile();
  if (!state.profile) {
    ui.toast("Start your adventure first.");
    showMainMenu();
    return;
  }

  if (!getToken()) {
    const profile = await ensureGuestSession();
    if (!profile) {
      showMainMenu();
      return;
    }
  }
  syncSelectedHeroFromProfile(state.profile);

  const safeLevelId = Math.max(1, Math.min(TOTAL_LEVELS, Number(levelId || 1)));

  // Avoid stale input state leaking from menus/settings into gameplay.
  input.clearAll();
  canvas.focus();

  state.currentLevel = safeLevelId;
  state.screen = "loading";
  ui.loading("Loading level...");
  disposeScene();

  const levelAssetPaths = getLevelAssetPaths({
    levelId: safeLevelId,
    heroId: state.selectedHero,
    bossCode: state.levelConfigById?.[safeLevelId]?.bossCode,
    enemies: state.levelConfigById?.[safeLevelId]?.enemies,
  });
  primeInteractiveAudio(levelAssetPaths);
  await preloadPaths(levelAssetPaths);

  const nextScene = new GameplayScene({
    ctx,
    canvas,
    input,
    audio,
    manifestCacheState: {
      loadedManifestByLevelId: state.loadedManifestByLevelId,
      pendingManifestRequests: state.pendingManifestRequests,
    },
    attunementPreference:
      state.profile?.selectedAttunement || ATTUNEMENT_OPTION.DEFAULT,
    hasFireUnlocked: isFireUnlocked(state.profile),
    permanentElementCore: state.profile?.permanentElementCore || null,
    veteranModeEnabled: isProfileVeteranModeEnabled(state.profile),
    startingHearts: sanitizeHearts(state.campaignHearts),
    campaignCoinBase: state.campaignCoinBase,
    campaignRunCoinCarry: state.campaignRunCoins,
    serverLevelConfigById: state.levelConfigById,
    serverHeroConfigByCode: state.heroConfigByCode,
    onFireUnlock: () => {
      unlockFireAttunement();
    },
    onCoreClaim: (coreElement) => {
      claimPermanentCore(coreElement);
    },
    onAxoCoinsCollected: (gain) => {
      applyCollectedAxoCoins(gain);
    },
    onGameOverEnter: () => {
      ui.hide();
    },
    onGameOverRetry: restartCampaignAdventure,
    onRestartFromStart: restartCampaignAdventure,
    onRunEnd: handleRunEnd,
    onLevelComplete: handleLevelComplete,
    onExitToMap: showMainMenu,
  });

  try {
    await nextScene.start(safeLevelId, state.selectedHero, state.profile);
    input.clearAll();
    canvas.focus();
    scene = nextScene;
    state.screen = "gameplay";
    saveProfileMeta();
    tryLockLandscape();
    ui.gameplayOverlay({
      input,
      onPauseToggle: () => scene?.togglePause?.(),
      onSettings: () => showSettings("gameplay"),
      onAudioToggle: () => scene?.toggleMusicButton?.(),
      isAudioEnabled: () => scene?.isMusicEnabled?.(),
    });
  } catch (error) {
    ui.toast(`Level load failed: ${error?.message || "Unknown error"}`);
    showMainMenu();
  }
}

async function handleLevelComplete(payload) {
  if (state.screen !== "gameplay") return;
  applyWinHeartRecovery(payload);

  const optimisticRunCoins = Math.max(
    0,
    Math.floor(Number(payload?.runCoins) || 0),
  );
  addCampaignRunCoins(optimisticRunCoins);
  state.levelCompletePayload = payload;
  showLevelComplete();

  try {
    const res = await completeRun(payload);
    reconcileCampaignRunCoins(
      optimisticRunCoins,
      res?.runCoins ?? payload?.runCoins,
    );
    applyCompleteLevelResult(res);
    if (res?.message) {
      ui.toast(res.message);
    }
  } catch (error) {
    queueRunSync(payload);
  }
}

async function handleRunEnd(payload) {
  const runCoins = Math.max(0, Math.floor(Number(payload?.runCoins || 0)));
  if (runCoins <= 0) return;

  try {
    const res = await completeRun(payload);
    applyCompleteLevelResult(res);
    showRunResultToast(res?.result || payload?.result || "quit", res?.message);
  } catch (error) {
    queueRunSync(payload);
  }
}

function showRunResultToast(result, message) {
  if (message) {
    ui.toast(message);
    return;
  }
  const normalized = String(result || "").toLowerCase();
  if (normalized === "win") {
    ui.toast("WIN");
    return;
  }
  if (normalized === "quit") {
    ui.toast("Run saved");
    return;
  }
  ui.toast("GAME OVER");
}

function applyCompleteLevelResult(res) {
  if (!res || typeof res !== "object") return;

  if (res.profile && typeof res.profile === "object") {
    mergeServerProfileIntoState(res.profile);
    return;
  }

  const totalCoinBalance = Number(res.totalCoinBalance);
  if (!Number.isFinite(totalCoinBalance) || !state.profile) return;

  normalizeProfile(state.profile);
  const safeTotal = Math.max(0, Math.floor(totalCoinBalance));
  state.profile.coinsTotal = safeTotal;
  state.profile.coinBalance = safeTotal;
  refreshCoinUiIfVisible();
}

function autoAdvanceAfterBossDefeat() {
  const current = state.currentLevel;
  const nextLevel = getNextCampaignLevel(current);
  if (!nextLevel) {
    ui.toast("Victory! All levels complete.");
    showCredits();
    return;
  }
  ui.toast("Victory! Returning to route map.");
  showRouteMap();
}

function showLevelComplete() {
  clearRouteMapAutoContinueTimer();
  disposeScene();
  const levelId = state.currentLevel;
  const nextLevel = getNextCampaignLevel(levelId);
  if (!nextLevel) {
    showFinalChestRewardScreen({ reset: true });
    return;
  }
  state.screen = "routeMap";
  ui.routeMap({
    currentLevel: levelId,
    levelOrder: state.levelOrder?.length
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER,
    levelConfigById: state.levelConfigById,
    heroConfigByCode: state.heroConfigByCode,
    selectedHero: state.selectedHero,
    autoContinueSeconds: LEVEL_COMPLETE_AUTO_CONTINUE_MS / 1000,
    onContinue: () => {
      state.selectedLevel = nextLevel;
      startLevel(nextLevel);
    },
    transportOnly: true,
  });
  routeMapAutoContinueTimer = window.setTimeout(() => {
    routeMapAutoContinueTimer = null;
    if (state.screen !== "routeMap" || state.currentLevel !== levelId) return;
    state.selectedLevel = nextLevel;
    startLevel(nextLevel);
  }, LEVEL_COMPLETE_AUTO_CONTINUE_MS);
}

function showFinalChestRewardScreen({ reset = false } = {}) {
  clearRouteMapAutoContinueTimer();
  disposeScene();
  state.screen = "finalChest";
  saveProfileMeta();
  const context = ensureFinalChestContext({ reset });
  ui.finalChestReward({
    totalLevels: state.levelOrder?.length || TOTAL_LEVELS,
    ...buildFinalChestRewardSummary(context),
    opened: Boolean(context?.opened),
    onChestOpen: () => {
      markFinalChestOpened();
      if (state.finalChestContext?.opened) {
        showFinalChestRewardScreen({ reset: false });
      }
    },
    onContinue: showCredits,
  });
}

function showCredits() {
  clearRouteMapAutoContinueTimer();
  disposeScene();
  state.screen = "credits";
  saveProfileMeta();
  ui.credits({
    totalCoins: getFinalCampaignDisplayCoins(),
    totalLevels: state.levelOrder?.length || TOTAL_LEVELS,
    onPlayAgain: playAgainFromFinalScreen,
    onBackToMap: showMainMenu,
  });
}

function showRouteMap() {
  clearRouteMapAutoContinueTimer();
  disposeScene();
  const current = state.currentLevel || getFirstCampaignLevel();
  state.screen = "routeMap";
  saveProfileMeta();
  ui.routeMap({
    currentLevel: current,
    levelOrder: state.levelOrder?.length
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER,
    levelConfigById: state.levelConfigById,
    heroConfigByCode: state.heroConfigByCode,
    selectedHero: state.selectedHero,
    onBack: showMainMenu,
  });
}

const ROUTE_MAP_TEST_AUTO_CONTINUE_SEC = 48;

function showRouteMapTest() {
  clearRouteMapAutoContinueTimer();
  disposeScene();
  state.screen = "routeMap";
  ui.routeMap({
    currentLevel: getFirstCampaignLevel(),
    levelOrder: state.levelOrder?.length
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER,
    levelConfigById: state.levelConfigById,
    heroConfigByCode: state.heroConfigByCode,
    selectedHero: state.selectedHero,
    autoContinueSeconds: ROUTE_MAP_TEST_AUTO_CONTINUE_SEC,
    animateFullPath: true,
    onContinue: () => {
      showMainMenu();
    },
  });
  routeMapAutoContinueTimer = window.setTimeout(() => {
    routeMapAutoContinueTimer = null;
    if (state.screen !== "routeMap") return;
    showMainMenu();
  }, ROUTE_MAP_TEST_AUTO_CONTINUE_SEC * 1000);
}

function showLeaderboard() {
  // Offline build: the records modal shows this player's own best runs.
  const profile = state.profile || {};
  const bestCoins =
    profile.bestRunCoinsByLevel &&
    typeof profile.bestRunCoinsByLevel === "object"
      ? profile.bestRunCoinsByLevel
      : {};
  const bestTimes =
    profile.bestTimeByLevel && typeof profile.bestTimeByLevel === "object"
      ? profile.bestTimeByLevel
      : {};
  const completions = new Set(
    (Array.isArray(profile.levelCompletions)
      ? profile.levelCompletions
      : []
    ).map((value) => Number(value)),
  );
  const order =
    state.levelOrder && state.levelOrder.length > 0
      ? state.levelOrder
      : DEFAULT_LEVEL_ORDER;
  const rows = order.map((levelId) => ({
    levelId,
    levelName:
      state.levelConfigById?.[levelId]?.levelName || `Level ${levelId}`,
    bestCoins: Math.max(
      0,
      Math.floor(Number(bestCoins[levelId] ?? bestCoins[String(levelId)] ?? 0)),
    ),
    bestTime: Math.max(
      0,
      Math.floor(Number(bestTimes[levelId] ?? bestTimes[String(levelId)] ?? 0)),
    ),
    completed: completions.has(Number(levelId)),
  }));

  state.screen = "mainMenu";
  showMainMenu({ leaderboardModalOpen: true, leaderboardLevelRows: rows });
}

function showSettings(source = null) {
  if (source === true) source = "gameplay";
  if (source === false) source = null;

  if (source === "gameplay") {
    state.previousScreen = "gameplay";
    state.previousMenuOptions = null;
  } else if (source === "mainMenu") {
    state.previousScreen = "mainMenu";
    state.previousMenuOptions = { ...(state.lastMainMenuOptions || {}) };
  } else if (state.screen !== "settings") {
    if (state.screen === "gameplay") {
      state.previousScreen = "gameplay";
      state.previousMenuOptions = null;
    } else {
      state.previousScreen = "mainMenu";
      state.previousMenuOptions = { ...(state.lastMainMenuOptions || {}) };
    }
  }

  state.screen = "settings";
  ui.settings({
    currentControlScheme: input.getControlScheme(),
    controlOptions: input.getControlSchemeOptions(),
    keyBindings: input.getRebindableBindings(),
    pendingAction: state.pendingRebindAction,
    onChangeControlScheme: (schemeId) => {
      if (input.setControlScheme(schemeId)) {
        ui.toast("Control scheme updated.");
      }
      showSettings(false);
    },
    onStartRebind: startRebindAction,
    onResetBindings: () => {
      clearRebindListener();
      state.pendingRebindAction = null;
      input.resetCustomBindings();
      ui.toast("Keys reset to defaults.");
      showSettings(false);
    },
    onBack: () => {
      clearRebindListener();
      state.pendingRebindAction = null;
      const prev = state.previousScreen;
      const prevMenuOptions = state.previousMenuOptions || {};
      state.previousScreen = null;
      state.previousMenuOptions = null;
      if (prev === "gameplay") {
        input.clearAll();
        canvas.focus();
        state.screen = "gameplay";
        ui.gameplayOverlay({
          input,
          onPauseToggle: () => scene?.togglePause?.(),
          onSettings: () => showSettings("gameplay"),
          onAudioToggle: () => scene?.toggleMusicButton?.(),
          isAudioEnabled: () => scene?.isMusicEnabled?.(),
        });
        return;
      }
      showMainMenu(prevMenuOptions);
    },
  });
}

function clearRebindListener() {
  if (!rebindKeyListener) return;
  window.removeEventListener("keydown", rebindKeyListener, true);
  rebindKeyListener = null;
}

function startRebindAction(action) {
  if (!action) return;
  clearRebindListener();
  state.pendingRebindAction = action;
  showSettings();

  rebindKeyListener = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.code === "Escape") {
      state.pendingRebindAction = null;
      clearRebindListener();
      showSettings();
      return;
    }

    const ok = input.setCustomBinding(action, event.code);
    state.pendingRebindAction = null;
    clearRebindListener();
    if (ok) {
      ui.toast(`Bound ${action} to ${event.code}.`);
    } else {
      ui.toast("Key binding failed.");
    }
    showSettings();
  };

  window.addEventListener("keydown", rebindKeyListener, true);
}

function normalizeProfile(profile) {
  if (!profile) return;
  profile.playerId = String(profile.playerId || "")
    .trim()
    .toLowerCase();
  profile.username =
    String(profile.username || profile.playerName || "Guest").trim() || "Guest";
  if (!Array.isArray(profile.unlockedElements)) profile.unlockedElements = [];
  if (!profile.selectedAttunement)
    profile.selectedAttunement = ATTUNEMENT_OPTION.DEFAULT;
  if (typeof profile.permanentElementCore === "undefined")
    profile.permanentElementCore = null;
  if (typeof profile.veteranModeEnabled === "undefined")
    profile.veteranModeEnabled = false;
  if (!Array.isArray(profile.levelCompletions)) profile.levelCompletions = [];
  if (
    !profile.bestRunCoinsByLevel ||
    typeof profile.bestRunCoinsByLevel !== "object"
  )
    profile.bestRunCoinsByLevel = {};
  if (!profile.bestTimeByLevel || typeof profile.bestTimeByLevel !== "object")
    profile.bestTimeByLevel = {};
  if (!profile.heroStats || typeof profile.heroStats !== "object")
    profile.heroStats = {};
  const legacyHeroIdByName = {
    ninja: "axolittle",
    // flora: "pudge",
    // jelly: "seal",
  };
  const defaultHeroStats = {
    ninja: { maxHearts: getProfileHeroMaxHearts("ninja") },
    // flora: { maxHearts: 4 },
    // jelly: { maxHearts: 3 },
  };
  for (const [id, defaults] of Object.entries(defaultHeroStats)) {
    const legacyId = legacyHeroIdByName[id];
    const fromName =
      profile.heroStats[id] && typeof profile.heroStats[id] === "object"
        ? profile.heroStats[id]
        : null;
    const fromLegacy =
      profile.heroStats[legacyId] &&
      typeof profile.heroStats[legacyId] === "object"
        ? profile.heroStats[legacyId]
        : null;
    if (!fromName && !fromLegacy) {
      profile.heroStats[id] = { ...defaults };
    } else {
      profile.heroStats[id] = { ...(fromName || fromLegacy) };
    }
    if (!Number.isFinite(profile.heroStats[id].maxHearts))
      profile.heroStats[id].maxHearts = defaults.maxHearts;
    profile.heroStats[legacyId] = { ...profile.heroStats[id] };
  }
  if (!Number.isFinite(profile.unlockedLevel))
    profile.unlockedLevel = TOTAL_LEVELS;

  const coinBalanceRaw = Number(profile.coinBalance);
  const coinsTotalRaw = Number(profile.coinsTotal);
  const normalizedCoinBalance = Number.isFinite(coinBalanceRaw)
    ? Math.max(0, Math.floor(coinBalanceRaw))
    : 0;
  const normalizedCoinsTotal = Number.isFinite(coinsTotalRaw)
    ? Math.max(0, Math.floor(coinsTotalRaw))
    : normalizedCoinBalance;
  const canonicalCoins = Math.max(normalizedCoinBalance, normalizedCoinsTotal);
  profile.coinBalance = canonicalCoins;
  profile.coinsTotal = canonicalCoins;

  const lifetimeCoinsRaw = Number(profile.lifetimeCoinsEarned);
  profile.lifetimeCoinsEarned = Number.isFinite(lifetimeCoinsRaw)
    ? Math.max(canonicalCoins, Math.floor(lifetimeCoinsRaw))
    : canonicalCoins;

  if (!Array.isArray(profile.healthUpgradePurchases))
    profile.healthUpgradePurchases = [];
  else {
    profile.healthUpgradePurchases = profile.healthUpgradePurchases.map((p) => {
      const heroIdRaw = String(p?.heroId || "")
        .trim()
        .toLowerCase();
      const heroId =
        heroIdRaw === "axolittle"
          ? "ninja"
          : heroIdRaw === "pudge"
            ? "ninja"
            : heroIdRaw === "seal"
              ? "ninja"
              : heroIdRaw;
      return {
        ...p,
        heroId: heroId || "ninja",
      };
    });
  }
}

function mergeServerProfileIntoState(nextProfile) {
  if (!nextProfile || typeof nextProfile !== "object") return;
  normalizeProfile(nextProfile);

  if (!state.profile || typeof state.profile !== "object") {
    state.profile = nextProfile;
    syncSelectedHeroFromProfile(state.profile);
    applyProfileSettings(state.profile);
    if (scene) scene.profile = state.profile;
    refreshCoinUiIfVisible();
    return;
  }

  // Keep object identity stable so active scenes don't hold stale profile refs.
  const target = state.profile;
  normalizeProfile(target);
  const prevCoins = Number(target.coinsTotal || 0);
  const prevLifetime = Number(target.lifetimeCoinsEarned || 0);
  const prevCompletions = Array.isArray(target.levelCompletions)
    ? [...target.levelCompletions]
    : [];

  for (const [key, value] of Object.entries(nextProfile)) {
    target[key] = value;
  }

  normalizeProfile(target);
  target.coinsTotal = Math.max(prevCoins, Number(target.coinsTotal || 0));
  target.coinBalance = target.coinsTotal;
  target.lifetimeCoinsEarned = Math.max(
    prevLifetime,
    Number(target.lifetimeCoinsEarned || 0),
  );
  target.levelCompletions = [
    ...new Set([
      ...prevCompletions,
      ...(Array.isArray(target.levelCompletions)
        ? target.levelCompletions
        : []),
    ]),
  ];

  syncSelectedHeroFromProfile(target);
  applyProfileSettings(target);
  if (scene) scene.profile = target;
  refreshCoinUiIfVisible();
}

function refreshCoinUiIfVisible() {
  if (state.screen === "mainMenu") {
    showMainMenu({ ...(state.lastMainMenuOptions || {}) });
  }
}

function isFireUnlocked(profile) {
  if (!profile) return false;
  normalizeProfile(profile);
  return profile.unlockedElements.includes(ELEMENT.FIRE);
}

function unlockFireAttunement() {
  if (!state.profile) return;
  normalizeProfile(state.profile);
  if (state.profile.unlockedElements.includes(ELEMENT.FIRE)) return;

  state.profile.unlockedElements.push(ELEMENT.FIRE);
  saveProfileMeta();
  ui.toast("Fire Orb acquired. Fire Attunement unlocked permanently.");
}

async function claimPermanentCore(coreElement) {
  if (!state.profile) return;
  normalizeProfile(state.profile);
  const claimed = String(coreElement || "").toLowerCase();
  if (!claimed) return;

  const applyOptimistic = () => {
    if (!state.profile.permanentElementCore) {
      state.profile.permanentElementCore = claimed;
    }
    state.profile.veteranModeEnabled = true;
    if (claimed === ELEMENT.FIRE) {
      unlockFireAttunement();
    } else {
      saveProfileMeta({ immediate: true });
    }
  };

  try {
    applyOptimistic();
    const res = await claimCore(claimed);
    mergeServerProfileIntoState(res.profile);
    ui.toast(
      res.claimed
        ? `Permanent ${claimed.toUpperCase()} Core activated. Veteran Mode enabled.`
        : "Permanent Core already claimed. Veteran Mode is active.",
    );
  } catch (error) {
    saveProfileMeta({ immediate: true });
    ui.toast(`Core sync delayed (${error.message}). Retrying automatically.`);
  }
}

window.addEventListener("resize", scaleCanvasContainer);
scaleCanvasContainer();
applyDeviceClasses();

function applyDeviceClasses() {
  const body = document.body;
  if (!body) return;
  const isIos = isIOSDevice();
  body.classList.toggle("ios-device", isIos);
  body.classList.toggle("ios-performance-mode", isIos);
}

function scaleCanvasContainer() {
  const shell = document.getElementById("game-shell");
  const logicalW = Math.max(1, window.innerWidth);
  const logicalH = Math.max(1, window.innerHeight);
  const viewportClass = getViewportClass();
  const dprCap = getDprCapForViewportClass(viewportClass);
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  shell.style.width = `${logicalW}px`;
  shell.style.height = `${logicalH}px`;

  const backingW = Math.round(logicalW * dpr);
  const backingH = Math.round(logicalH * dpr);
  if (canvas.width !== backingW || canvas.height !== backingH) {
    canvas.width = backingW;
    canvas.height = backingH;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;
    canvas._logicalWidth = logicalW;
    canvas._logicalHeight = logicalH;
    canvas._dpr = dpr;
    if (scene?.camera) {
      scene.camera.viewWidth = logicalW;
      scene.camera.viewHeight = logicalH;
    }
  }
}

init().catch((error) => {
  drawMenuBackdrop();
  ui.loading(`Boot failed: ${error.message}`);
});
