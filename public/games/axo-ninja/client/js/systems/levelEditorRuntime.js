import { CONST } from "../config/constants.js";
import { LEVEL_ASSETS } from "../config/levelAssets.js";
import {
  toSafeInt,
  cloneEntity,
  tilesToChunks,
  normalizeTiles,
  sanitizeEntityList,
  normalizeObjectEntries,
  normalizeEnemyEntries,
  normalizeLevelName,
  normalizeLevelData,
  normalizeHiddenHeartBricks,
  isHiddenHeartHostTileId,
  sanitizeHiddenHeartBricks,
} from "./levelNormalization.js";
import { TILE } from "../config/tileIds.js";
import { WORLD_VISUALS } from "../config/worldVisuals.js";
import { ENEMIES } from "../config/enemies.js";
import {
  FALLBACK_BOSS_REWARDS,
  getFallbackCoinValue,
} from "../config/levelFallbacks.js";
import { ENEMY_SPRITES, UI_IMAGES, getImage } from "../core/assets.js";
import { TileMap } from "../core/tilemap.js";
import { clamp } from "../utils/math.js";

const HISTORY_LIMIT = 100;
const AUTOSAVE_INTERVAL_SEC = 10;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const PANEL_WIDTH = 300;
const PANEL_MARGIN = 12;
const MINIMAP_W = 220;
const MINIMAP_H = 130;
const CAMERA_PAN_SPEED = 920;
const EDITOR_BRICK_AXO_REWARD = 0;
const EDITOR_DEFAULT_ENEMY_AXO_REWARD = 50;

const TAB_KEY_TO_LAYER = {
  q: "tiles",
  w: "objects",
  e: "enemies",
  r: "spawn",
};

const LAYER_TABS = [
  { key: "tiles", label: "Tiles" },
  { key: "objects", label: "Objects" },
  { key: "enemies", label: "Enemies" },
  { key: "spawn", label: "Spawn" },
];

const SPAWN_TOOL_PLAYER_START = "playerStart";
const SPAWN_TOOL_HIDDEN_HEART = "hiddenHeart";

const SPAWN_TOOLS = [
  {
    type: SPAWN_TOOL_PLAYER_START,
    name: "player start",
    description: "move player spawn",
  },
  {
    type: SPAWN_TOOL_HIDDEN_HEART,
    name: "hidden heart",
    description: "place on brick / gift / ice",
  },
];

const TILE_LABEL = {
  [TILE.EMPTY]: "empty",
  [TILE.SOLID]: "solid",
  [TILE.ONE_WAY]: "one_way",
  [TILE.SPIKES]: "spikes",
  [TILE.ICE]: "ice",
  [TILE.WATER]: "water",
  [TILE.POISON]: "poison",
  [TILE.BRICK]: "brick",
  [TILE.GIFT_BOX]: "gift_box",
  [TILE.BARBED_WIRE]: "barbed_wire",
};

const DEFAULT_OBJECT_TYPES = [
  { type: "coin", path: "https://ik.imagekit.io/6rsuaxauw/grok-image-f3ff8b55-c0fe-46fa-a0c7-fdbe20d61c6d%201%203.webp", name: "coin" },
  { type: "heart", path: UI_IMAGES.hearts, name: "heart" },
  {
    type: "boss_flag",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/flags/flag1.webp",
    name: "boss_flag",
  },
  {
    type: "crystal_cluster",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/gems_ugh2br.webp",
    name: "crystal_cluster",
  },
  { type: "crate", path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/box_ipbmif.webp", name: "crate" },
  { type: "rock", path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/stone_dubacg.webp", name: "rock" },
  {type: "beachbox", path:  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/box_vexzd7.webp",name: "beachbox"},

  {
    type: "snowman",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/snowman_hwbx2z.webp",
    name: "snowman",
  },
  { type: "ice_tree", path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/tree_lsy0pf.webp", name: "ice_tree" },
  {
    type: "ice_board_start",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/board_for_start_gco9ox.webp",
    name: "ice_board_start",
  },
  {
    type: "ice_board_boss",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/board_before_boss_plo7ix.webp",
    name: "ice_board_boss",
  },
  {
    type: "ice_floor_below",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_below_m2g5r9.webp",
    name: "ice_floor_below",
  },
  {
    type: "ice_floor_left",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_left_cth9ft.webp",
    name: "ice_floor_left",
  },
  {
    type: "ice_floor_mid",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_mid_u3z7ym.webp",
    name: "ice_floor_mid",
  },
  {
    type: "ice_floor_right",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_right_je58yt.webp",
    name: "ice_floor_right",
  },
  {
    type: "ice_ice_box",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/ice_box_ek0qo7.webp",
    name: "ice_ice_box",
  },
  {
    type: "ice_spike_1",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/ice_spike_1_h87y2a.webp",
    name: "ice_spike_1",
  },
  {
    type: "ice_spike_2",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/ice_spike_2_e5i9lr.webp",
    name: "ice_spike_2",
  },
  {
    type: "ice_floor_spikes",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_spikes_dmfhi6.webp",
    name: "ice_floor_spikes",
  },
  {
    type: "ice_platform_left",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_left_cbtwgl.webp",
    name: "ice_platform_left",
  },
  {
    type: "ice_platform_mid",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_mid_jyhcx3.webp",
    name: "ice_platform_mid",
  },
  {
    type: "ice_platform_right",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_right_r9pmot.webp",
    name: "ice_platform_right",
  },
  {
    type: "ice_water_below",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/water_below_xpyqpp.webp",
    name: "ice_water_below",
  },
  {
    type: "ice_water_up",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/water_up_v69ws2.webp",
    name: "ice_water_up",
  },
  {
    type: "shell",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/decorative-seashell1_elvahm.webp",
    name: "shell",
  },
  {
    type: "beach_coconut_tree",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/coconut_tree_afejm0.webp",
    name: "beach_coconut_tree",
  },
  {
    type: "beach_cactus",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/Cactus_1_zipafv.webp",
    name: "beach_cactus",
  },
  {
    type: "skull",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_skull_f5ljyt.webp",
    name: "skull",
  },
  {
    type: "water_platform_left",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_left_pd0el9.webp",
    name: "water_platform_left",
  },
  {
    type: "water_platform_mid",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_mid_j6dr52.webp",
    name: "water_platform_mid",
  },
  {
    type: "water_platform_right",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_right_boqgt7.webp",
    name: "water_platform_right",
  },
  {
    type: "water_floor_left",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_left_wi4gbg.webp",
    name: "water_floor_left",
  },
  {
    type: "water_floor_mid",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_mid_fbliif.webp",
    name: "water_floor_mid",
  },
  {
    type: "water_floor_right",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_right_lgxf8n.webp",
    name: "water_floor_right",
  },
  {
    type: "water_floor_below",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp",
    name: "water_floor_below",
  },
  {
    type: "water_obstacle_seaurchin",
    path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/obstacle_sea_urchin_rdeuyj.webp",
    name: "water_obstacle_seaurchin",
  },
];

const REQUIRED_WORLD_OBJECTS = {
  beach: [
    {
      type: "beach_cactus",
      file: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/Cactus_1_zipafv.webp",
      name: "beach_cactus",
    },
  ],
};

const KNOWN_WORLD_NAMES = ["ice", "water", "beach", "grave"];
// Enemy palette per world: show all runtime enemies/bosses in every world's editor.
const WORLD_ENEMY_TYPES = {
  ice: [
    "fishScout",
    "jellyBomber",
    "coralShooter",
    "golden",
    "grin",
    "plague",
    "red",
    "eliteWaterGuard",
    "coralHydra",
    "spikedSkull",
    "sandBoss",
    "crabBoss",
    "iceTitan",
    "necroKing",
  ],
  water: [
    "fishScout",
    "jellyBomber",
    "coralShooter",
    "golden",
    "grin",
    "plague",
    "red",
    "eliteWaterGuard",
    "coralHydra",
    "spikedSkull",
    "sandBoss",
    "crabBoss",
    "iceTitan",
    "necroKing",
  ],
  beach: [
    "fishScout",
    "jellyBomber",
    "coralShooter",
    "golden",
    "grin",
    "plague",
    "red",
    "eliteWaterGuard",
    "coralHydra",
    "spikedSkull",
    "sandBoss",
    "crabBoss",
    "iceTitan",
    "necroKing",
  ],
  grave: [
    "fishScout",
    "jellyBomber",
    "coralShooter",
    "golden",
    "grin",
    "plague",
    "red",
    "eliteWaterGuard",
    "coralHydra",
    "spikedSkull",
    "sandBoss",
    "crabBoss",
    "iceTitan",
    "necroKing",
  ],
};
const EDITOR_SESSION_SAVES = new Map();

function isAlwaysIncludedEditorObjectType(type) {
  const key = String(type || "").trim().toLowerCase();
  return (
    key === "coin" ||
    key === "heart" ||
    key === "boss_flag" ||
    key === "beach_cactus" ||
    key === "cactus"
  );
}

function isRectHit(rect, x, y) {
  return (
    rect &&
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

function toPositiveInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

function toEnemyTypeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function pathBasename(path) {
  const clean = String(path || "").replace(/\\/g, "/");
  const idx = clean.lastIndexOf("/");
  return idx >= 0 ? clean.slice(idx + 1) : clean;
}

function toPublicAssetPath(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const normalizedPath = src.replace(/^\/+/, "");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return `/${normalizedPath}`;
}

function resolveManifestFilePath(file, basePath = "/") {
  const src = String(file || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
  return `${basePath}${src}`;
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

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function resolveApiPath(path, apiBase = "") {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const base = normalizeBaseUrl(apiBase);
  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`;
}

function normalizePathForWorldMatch(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .toLowerCase();
}

function detectWorldFromValue(value) {
  const lowered = String(value || "").trim().toLowerCase();
  for (const worldName of KNOWN_WORLD_NAMES) {
    if (lowered.startsWith(`${worldName}_`)) return worldName;
  }
  return "";
}

function detectWorldFromFilePath(path) {
  const normalized = normalizePathForWorldMatch(path);
  const marker = "assets/sprites/world/";
  const start = normalized.indexOf(marker);
  if (start < 0) return "";
  const rest = normalized.slice(start + marker.length);
  const worldName = rest.split("/")[0];
  return KNOWN_WORLD_NAMES.includes(worldName) ? worldName : "";
}

function shouldIncludeAssetForWorld(world, entry = {}) {
  const currentWorld = String(world || "").trim().toLowerCase();
  if (!KNOWN_WORLD_NAMES.includes(currentWorld)) return true;
  if (entry.alwaysInclude) return true;

  const fileWorld = detectWorldFromFilePath(entry.file);
  if (fileWorld) return fileWorld === currentWorld;

  const nameWorld = detectWorldFromValue(entry.name);
  if (nameWorld) return nameWorld === currentWorld;

  const typeWorld = detectWorldFromValue(entry.type);
  if (typeWorld) return typeWorld === currentWorld;

  return true;
}

function dedupeByStableKey(items, makeKey) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const key = String(makeKey(item));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function ensureRequiredWorldObjects(items, worldName) {
  const worldKey = String(worldName || "").toLowerCase();
  const required = REQUIRED_WORLD_OBJECTS[worldKey] || [];
  for (const requiredItem of required) {
    const requiredType = String(requiredItem.type || "").trim();
    const requiredFile = String(requiredItem.file || "").trim();
    if (!requiredType || !requiredFile) continue;
    const exists = items.some((item) => String(item?.type) === requiredType);
    if (exists) continue;
    items.push({
      type: requiredType,
      name: String(requiredItem.name || requiredType),
      path: toPublicAssetPath(requiredFile),
      file: requiredFile,
    });
  }
  return items;
}

function collectWorldTileAssetKeys(worldName) {
  const key = String(worldName || "ice").toLowerCase();
  const worldVisual = WORLD_VISUALS[key] || WORLD_VISUALS.ice;
  const keys = new Set();
  const add = (path) => {
    const normalized = normalizePathForWorldMatch(path);
    if (normalized) keys.add(normalized);
  };
  Object.values(worldVisual?.tileTextures || {}).forEach(add);
  Object.values(worldVisual?.variants || {}).forEach(add);
  return keys;
}

function collectTileManifestAssetKeys(manifest, worldName) {
  const keys = new Set();
  if (!manifest || !Array.isArray(manifest.items)) return keys;
  const basePath = String(manifest.basePath || "/");
  for (const item of manifest.items) {
    const file = String(item?.file || "").trim();
    if (!file) continue;
    if (
      !shouldIncludeAssetForWorld(worldName, {
        file,
        name: item?.name,
      })
    ) {
      continue;
    }
    const fullPath = resolveManifestFilePath(file, basePath);
    const normalized = normalizePathForWorldMatch(fullPath);
    if (normalized) keys.add(normalized);
  }
  return keys;
}

function collectLevelEnemyTypes(level, levelAsset) {
  const allowed = new Set();
  const worldName = String(level?.world || levelAsset?.world || "")
    .trim()
    .toLowerCase();

  const addType = (value) => {
    const type = String(value || "").trim();
    if (type) allowed.add(type);
  };

  const addFromList = (entries) => {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (typeof entry === "string") {
        addType(entry);
      } else if (entry && typeof entry === "object") {
        addType(entry.type);
        addType(entry.enemyCode);
      }
    }
  };

  for (const type of WORLD_ENEMY_TYPES[worldName] || []) {
    addType(type);
  }
  addFromList(levelAsset?.enemies);
  addType(levelAsset?.boss);

  addFromList(level?.enemies);
  addFromList(level?.spawns?.enemies);
  addFromList(level?.spawns?.elites);
  if (level?.spawns?.miniBoss) addFromList([level.spawns.miniBoss]);
  if (level?.spawns?.boss) addFromList([level.spawns.boss]);

  return allowed;
}

function toManifestTileId(value) {
  const id = toSafeInt(value, TILE.EMPTY);
  return id >= 0 ? id : TILE.EMPTY;
}

function getWorldTilePath(worldName, tileId) {
  if (tileId === TILE.EMPTY) return "";
  const worldVisual = WORLD_VISUALS[worldName] || WORLD_VISUALS.ice;
  const tileTextures = worldVisual?.tileTextures || {};
  return String(tileTextures[tileId] || "");
}

function validateRequiredKeys(level) {
  if (!level || typeof level !== "object") return false;
  const required = ["id", "sizeTiles", "playerStart"];
  const hasLayout =
    Object.prototype.hasOwnProperty.call(level, "tiles") ||
    Object.prototype.hasOwnProperty.call(level, "chunks");
  if (!hasLayout) return false;
  return required.every((key) =>
    Object.prototype.hasOwnProperty.call(level, key),
  );
}

function createPlaceholderTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8a2c3b";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "#f5d6de";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 60, 60);
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(56, 56);
  ctx.moveTo(56, 8);
  ctx.lineTo(8, 56);
  ctx.stroke();
  return canvas;
}

function loadJsonManifest(url) {
  return fetch(toPublicAssetPath(url), { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("manifest_missing");
      return response.json();
    })
    .catch(() => null);
}

function makeImageLoader(path, onStateChange) {
  const normalized = toPublicAssetPath(path);
  const preloaded = getImage(toAssetCacheKey(normalized));
  if (preloaded) {
    return { image: preloaded, failed: false };
  }
  const image = new Image();
  const state = { image, failed: false };
  image.onload = () => onStateChange();
  image.onerror = () => {
    state.failed = true;
    onStateChange();
  };
  image.src = normalized;
  return state;
}

export { normalizeLevelData } from "./levelNormalization.js";

function findSpawnTool(toolType) {
  const key = String(toolType || "");
  return SPAWN_TOOLS.find((item) => item.type === key) || null;
}

export class LevelEditorRuntime {
  constructor(scene) {
    this.scene = scene;
    this.keysDown = new Set();
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      tileX: -1,
      tileY: -1,
      inBounds: false,
    };
    this.editorCamera = { x: 0, y: 0, zoom: 1 };
    this.autoSaveTimer = 0;

    this.isMiddlePanning = false;
    this.middlePanLast = { x: 0, y: 0 };

    this.rectTool = {
      active: false,
      layer: "tiles",
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    };

    this.patrolMode = false;
    this.patrolStep = 0;
    this.patrolStartTile = null;
    this.selectedEnemyTile = null;
    this.eraserMode = false;

    this.palette = { tiles: [], objects: [], enemies: [] };
    this.paletteStates = new Map();
    this.placeholderTexture = createPlaceholderTexture();
    this.paletteDirty = true;
    this.paletteCanvas = document.createElement("canvas");
    this.paletteScroll = { tiles: 0, objects: 0, enemies: 0, spawn: 0 };
    this.paletteItemRects = [];
    this.panelRect = null;
    this.listRect = null;
    this.tabRects = [];
    this.eraserButtonRect = null;
    this.minimapRect = null;
    this.importInput = null;

    this.lastWorldForPalette = "";
    this.isPaletteLoading = false;
    this.isPaletteLoaded = false;
    this.checkedDraftRestoreLevelKeys = new Set();
    this.listenersAttached = false;
    this.editorAuthPath = "/api/editor/authorize";
    this.editorDevMode = false;
    this.editorEnabledByEnv = false;
    this.editorAccessGranted = false;
    this.editorAuthPending = false;
    this.refreshEditorRuntimeConfig();

    this.scene.isEditorMode = false;
    this.scene.currentLayer = "tiles";
    this.scene.showGrid = true;
    this.scene.history = [];
    this.scene.redoStack = [];
    this.scene.selectedTileId = TILE.SOLID;
    this.scene.selectedTileBehaviorId = TILE.SOLID;
    this.scene.selectedObjectType = "coin";
    this.scene.selectedEnemyType = "iceSlime";
    this.scene.selectedSpawnTool = SPAWN_TOOL_PLAYER_START;
    this.scene.camera.zoom = 1;

    this.onKeyDown = (e) => this.handleKeyDown(e);
    this.onKeyUp = (e) => this.handleKeyUp(e);
    this.onMouseMove = (e) => this.handleMouseMove(e);
    this.onMouseDown = (e) => this.handleMouseDown(e);
    this.onMouseUp = (e) => this.handleMouseUp(e);
    this.onWheel = (e) => this.handleWheel(e);
    this.onBlur = () => {
      this.keysDown.clear();
      this.rectTool.active = false;
      this.isMiddlePanning = false;
    };
    this.onContextMenu = (e) => {
      if (!this.scene.isEditorMode) return;
      e.preventDefault();
    };

    this.attachListeners();
  }

  attachListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;
    const canvas = this.scene.canvas;
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("blur", this.onBlur);

    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mousedown", this.onMouseDown);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  dispose() {
    if (!this.listenersAttached) return;
    this.listenersAttached = false;
    const canvas = this.scene.canvas;
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("blur", this.onBlur);

    canvas.removeEventListener("mousemove", this.onMouseMove);
    canvas.removeEventListener("mousedown", this.onMouseDown);
    canvas.removeEventListener("wheel", this.onWheel);
    canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  onLevelLoaded() {
    const level = this.scene.levelData;
    if (!level) return;
    if (!Array.isArray(level.tiles)) {
      level.tiles = normalizeTiles(level.tiles, level.sizeTiles, level);
    }
    if (!Array.isArray(level.objects)) {
      level.objects = normalizeObjectEntries(level, level.sizeTiles);
    }
    if (!Array.isArray(level.enemies)) {
      level.enemies = normalizeEnemyEntries(level, level.sizeTiles);
    }
    if (!Array.isArray(level.hiddenHeartBricks)) {
      level.hiddenHeartBricks = normalizeHiddenHeartBricks(
        level.hiddenHeartBricks,
        level.sizeTiles,
      );
    }
    this.scene.currentLayer = "tiles";
    this.scene.selectedTileId = TILE.SOLID;
    this.scene.selectedTileBehaviorId = TILE.SOLID;
    this.scene.selectedObjectType = "coin";
    this.scene.selectedEnemyType = level.enemies?.[0]?.type || "iceSlime";
    this.scene.selectedSpawnTool = SPAWN_TOOL_PLAYER_START;
    this.eraserMode = false;
    this.scene.history = [];
    this.scene.redoStack = [];
    this.lastWorldForPalette = "";
    this.paletteDirty = true;
    this.ensurePalettesLoaded();
  }

  getCanvasLogicalSize() {
    const canvas = this.scene.canvas;
    return {
      w: canvas._logicalWidth ?? canvas.width,
      h: canvas._logicalHeight ?? canvas.height,
    };
  }

  getLevel() {
    return this.scene.levelData;
  }

  getLevelSaveKey(levelId = null) {
    const resolvedId = toSafeInt(
      levelId ?? this.getLevel()?.id ?? this.scene.levelId,
      1,
    );
    return `axo_level_${resolvedId}`;
  }

  readSavedLevelPayload(levelId = null) {
    const key = this.getLevelSaveKey(levelId);
    let raw = null;
    try {
      raw = sessionStorage.getItem(key);
    } catch {}
    if (!raw) {
      raw = EDITOR_SESSION_SAVES.get(key) || null;
    }
    if (!raw) {
      return { ok: false, key, error: "No save found." };
    }
    try {
      const parsed = JSON.parse(raw);
      const validation = this.validateLevelJSON(parsed);
      if (!validation.ok) {
        return { ok: false, key, error: validation.error || "Invalid level JSON." };
      }
      return { ok: true, key, payload: parsed };
    } catch {
      return { ok: false, key, error: "Invalid saved level JSON." };
    }
  }

  restoreSavedDraft({ silent = false, once = false } = {}) {
    const key = this.getLevelSaveKey();
    if (once && this.checkedDraftRestoreLevelKeys.has(key)) return false;
    if (once) this.checkedDraftRestoreLevelKeys.add(key);
    const saved = this.readSavedLevelPayload();
    if (!saved.ok) return false;
    this.applyImportedLevel(saved.payload);
    if (!silent) this.notify(`Loaded ${saved.key}`);
    return true;
  }

  getLevelPixelSize() {
    const level = this.getLevel();
    if (!level?.sizeTiles) return { w: CONST.GAME.W, h: CONST.GAME.H };
    return {
      w: level.sizeTiles.w * CONST.GAME.TILE,
      h: level.sizeTiles.h * CONST.GAME.TILE,
    };
  }

  notify(text, durationSec = 1.8) {
    if (typeof this.scene.showPowerNotice === "function") {
      this.scene.showPowerNotice(String(text), durationSec);
    }
  }

  refreshEditorRuntimeConfig() {
    const env =
      window.__AXO_ENV__ && typeof window.__AXO_ENV__ === "object"
        ? window.__AXO_ENV__
        : {};
    const authPath = String(env.EDITOR_AUTH_PATH || "/api/editor/authorize");
    const apiBase = String(env.API_BASE || "");
    this.editorAuthPath =
      resolveApiPath(authPath, apiBase) || "/api/editor/authorize";
    this.editorDevMode = Boolean(env.EDITOR_DEV_MODE);
    this.editorEnabledByEnv = Boolean(env.EDITOR_ENABLED);
  }

  async authorizeEditorAccess() {
    this.refreshEditorRuntimeConfig();
    if (!this.editorDevMode) {
      this.notify("Editor available only in dev mode.");
      return false;
    }
    if (!this.editorEnabledByEnv) {
      this.notify("Editor locked.");
      return false;
    }
    if (this.editorAccessGranted) return true;
    if (this.editorAuthPending) return false;

    const inputKey = window.prompt("Enter editor key");
    const key = String(inputKey || "").trim();
    if (!key) {
      this.notify("Editor key required.");
      return false;
    }

    this.editorAuthPending = true;
    try {
      const response = await fetch(this.editorAuthPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) {
        this.notify("Invalid editor key.");
        return false;
      }
      const payload = await response.json().catch(() => ({}));
      if (payload?.ok !== true) {
        this.notify("Invalid editor key.");
        return false;
      }
      this.editorAccessGranted = true;
      this.notify("Editor key accepted.");
      return true;
    } catch {
      this.notify("Editor auth failed.");
      return false;
    } finally {
      this.editorAuthPending = false;
    }
  }

  async requestEditorToggle() {
    if (this.scene.isEditorMode) {
      this.setEditorMode(false);
      return;
    }
    const allowed = await this.authorizeEditorAccess();
    if (!allowed) return;
    this.setEditorMode(true);
  }

  syncEditorCameraView() {
    const { w, h } = this.getCanvasLogicalSize();
    const viewW = Math.max(1, w / this.editorCamera.zoom);
    const viewH = Math.max(1, h / this.editorCamera.zoom);
    const levelPx = this.getLevelPixelSize();
    const maxX = Math.max(0, levelPx.w - viewW);
    const maxY = Math.max(0, levelPx.h - viewH);
    this.editorCamera.x = clamp(this.editorCamera.x, 0, maxX);
    this.editorCamera.y = clamp(this.editorCamera.y, 0, maxY);
    this.scene.camera.viewWidth = viewW;
    this.scene.camera.viewHeight = viewH;
    this.scene.camera.x = this.editorCamera.x;
    this.scene.camera.y = this.editorCamera.y;
    this.scene.camera.zoom = this.editorCamera.zoom;
  }

  setCurrentLayer(layer) {
    if (!layer) return;
    this.scene.currentLayer = layer;
    if (layer === "spawn") {
      this.eraserMode = false;
    }
    this.paletteDirty = true;
    if (layer !== "enemies") {
      this.patrolMode = false;
      this.patrolStep = 0;
      this.patrolStartTile = null;
    }
  }

  setEditorMode(enabled) {
    const next = Boolean(enabled);
    if (next === this.scene.isEditorMode) return;
    this.refreshEditorRuntimeConfig();
    if (
      next &&
      (!this.editorDevMode ||
        !this.editorEnabledByEnv ||
        !this.editorAccessGranted)
    ) {
      this.notify("Editor locked.");
      return;
    }
    this.scene.isEditorMode = next;

    if (next) {
      this.scene.showPause = false;
      this.scene.input?.clearAll?.();
      this.syncTilesFromMap();
      this.editorCamera.x = this.scene.camera.x;
      this.editorCamera.y = this.scene.camera.y;
      this.editorCamera.zoom = 1;
      this.scene.camera.zoom = 1;
      this.rectTool.active = false;
      this.eraserMode = false;
      this.autoSaveTimer = 0;
      this.syncEditorCameraView();
      const restoredDraft = this.restoreSavedDraft({ silent: true, once: true });
      if (!restoredDraft) {
        this.ensurePalettesLoaded();
      }
      this.notify("Editor ON (`)");
      return;
    }

    this.keysDown.clear();
    this.rectTool.active = false;
    this.isMiddlePanning = false;
    this.eraserMode = false;
    this.patrolMode = false;
    this.patrolStep = 0;
    this.patrolStartTile = null;
    this.synchronizeDerivedLevelFields();
    this.notify("Editor OFF (`)");
  }

  canvasEventToLogical(event) {
    const canvas = this.scene.canvas;
    const rect = canvas.getBoundingClientRect();
    const { w, h } = this.getCanvasLogicalSize();
    const scaleX = w / Math.max(1, rect.width);
    const scaleY = h / Math.max(1, rect.height);
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  updateMouseState(screenX, screenY) {
    this.mouse.x = screenX;
    this.mouse.y = screenY;
    this.mouse.worldX = this.editorCamera.x + screenX / this.editorCamera.zoom;
    this.mouse.worldY = this.editorCamera.y + screenY / this.editorCamera.zoom;
    this.mouse.tileX = Math.floor(this.mouse.worldX / CONST.GAME.TILE);
    this.mouse.tileY = Math.floor(this.mouse.worldY / CONST.GAME.TILE);
    const level = this.getLevel();
    this.mouse.inBounds =
      Boolean(level) &&
      this.mouse.tileX >= 0 &&
      this.mouse.tileY >= 0 &&
      this.mouse.tileX < level.sizeTiles.w &&
      this.mouse.tileY < level.sizeTiles.h;
  }

  normalizeEditorKey(event) {
    const code = String(event?.code || "");
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3).toLowerCase();
    }
    const rawKey = typeof event?.key === "string" ? event.key : "";
    return rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
  }

  handleKeyDown(e) {
    const key = this.normalizeEditorKey(e);

    // Prevent browser undo conflict
    if (e.ctrlKey && (key === "z" || key === "y")) {
      e.preventDefault();
    }

    // Toggle editor
    if (key === "`") {
      if (!e.repeat) {
        this.requestEditorToggle();
      }
      return;
    }

    if (!this.scene.isEditorMode) return;
    this.keysDown.add(key);

    // Layer switching
    if (!e.repeat && TAB_KEY_TO_LAYER[key]) {
      this.setCurrentLayer(TAB_KEY_TO_LAYER[key]);
    }

    // Undo / Redo
    if (e.ctrlKey && key === "z" && !e.repeat) this.scene.undo();
    if (e.ctrlKey && key === "y" && !e.repeat) this.scene.redo();

    // Save / Load / Export / Import
    if (key === "k" && !e.repeat) {
      e.preventDefault();
      this.saveLevel();
    }
    if (key === "j" && !e.repeat) {
      e.preventDefault();
      this.loadLevel();
    }
    if (key === "x" && !e.repeat) {
      e.preventDefault();
      this.exportLevelJSON();
    }
    if (key === "z" && !e.ctrlKey && !e.repeat) {
      e.preventDefault();
      this.importLevelJSON();
    }

    // Toggle grid
    if (key === "g" && !e.repeat) this.scene.showGrid = !this.scene.showGrid;

    if (key === "t" && !e.repeat) this.togglePatrolMode();
  }

  handleKeyUp(e) {
    if (!this.scene.isEditorMode) return;
    const key = this.normalizeEditorKey(e);
    this.keysDown.delete(key);
  }

  handleMouseMove(event) {
    if (!this.scene.isEditorMode) return;
    const point = this.canvasEventToLogical(event);
    this.updateMouseState(point.x, point.y);
    if (this.isMiddlePanning) {
      const dx = (point.x - this.middlePanLast.x) / this.editorCamera.zoom;
      const dy = (point.y - this.middlePanLast.y) / this.editorCamera.zoom;
      this.editorCamera.x -= dx;
      this.editorCamera.y -= dy;
      this.middlePanLast.x = point.x;
      this.middlePanLast.y = point.y;
      this.syncEditorCameraView();
    }
    if (this.rectTool.active) {
      this.rectTool.endX = this.mouse.tileX;
      this.rectTool.endY = this.mouse.tileY;
    }
  }

  handleMouseDown(event) {
    if (!this.scene.isEditorMode) return;
    const point = this.canvasEventToLogical(event);
    this.updateMouseState(point.x, point.y);

    if (event.button === 1) {
      this.isMiddlePanning = true;
      this.middlePanLast.x = point.x;
      this.middlePanLast.y = point.y;
      event.preventDefault();
      return;
    }

    if (isRectHit(this.panelRect, point.x, point.y)) {
      this.handlePanelClick(point.x, point.y);
      event.preventDefault();
      return;
    }

    if (isRectHit(this.minimapRect, point.x, point.y) && event.button === 0) {
      this.handleMinimapClick(point.x, point.y);
      event.preventDefault();
      return;
    }

    if (!this.mouse.inBounds) return;

    if (event.button === 2) {
      this.removeAtTile(this.mouse.tileX, this.mouse.tileY);
      event.preventDefault();
      return;
    }

    if (event.button !== 0) return;

    if (this.patrolMode && this.scene.currentLayer === "enemies") {
      this.handlePatrolPlacementClick(this.mouse.tileX, this.mouse.tileY);
      event.preventDefault();
      return;
    }

    if (this.eraserMode) {
      if (this.scene.currentLayer === "spawn") {
        this.notify("Use RMB to remove hidden hearts on the spawn layer.");
      } else {
        this.removeAtTile(this.mouse.tileX, this.mouse.tileY);
      }
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      if (this.scene.currentLayer === "spawn") {
        this.notify("Spawn layer places one marker at a time.");
        event.preventDefault();
        return;
      }
      this.rectTool.active = true;
      this.rectTool.layer = this.scene.currentLayer;
      this.rectTool.startX = this.mouse.tileX;
      this.rectTool.startY = this.mouse.tileY;
      this.rectTool.endX = this.mouse.tileX;
      this.rectTool.endY = this.mouse.tileY;
      event.preventDefault();
      return;
    }

    this.placeAtTile(this.mouse.tileX, this.mouse.tileY);
    event.preventDefault();
  }

  handleMouseUp(event) {
    if (!this.scene.isEditorMode) return;
    if (event.button === 1) {
      this.isMiddlePanning = false;
      return;
    }
    if (event.button === 0 && this.rectTool.active) {
      this.applyRectangleTool();
      this.rectTool.active = false;
    }
  }

  handleWheel(event) {
    if (!this.scene.isEditorMode) return;
    const point = this.canvasEventToLogical(event);
    this.updateMouseState(point.x, point.y);
    if (
      isRectHit(this.panelRect, point.x, point.y) &&
      this.scene.currentLayer !== "spawn"
    ) {
      const layer = this.scene.currentLayer;
      const current = Number(this.paletteScroll[layer] || 0);
      this.paletteScroll[layer] = Math.max(0, current + event.deltaY);
      this.paletteDirty = true;
      event.preventDefault();
      return;
    }
    const oldZoom = this.editorCamera.zoom;
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = clamp(oldZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === oldZoom) {
      event.preventDefault();
      return;
    }
    const beforeX = this.editorCamera.x + point.x / oldZoom;
    const beforeY = this.editorCamera.y + point.y / oldZoom;
    this.editorCamera.zoom = newZoom;
    const afterX = this.editorCamera.x + point.x / newZoom;
    const afterY = this.editorCamera.y + point.y / newZoom;
    this.editorCamera.x += beforeX - afterX;
    this.editorCamera.y += beforeY - afterY;
    this.syncEditorCameraView();
    event.preventDefault();
  }

  update(dt) {
    if (!this.scene.isEditorMode) return;
    const left = this.keysDown.has("ArrowLeft") ? 1 : 0;
    const right = this.keysDown.has("ArrowRight") ? 1 : 0;
    const up = this.keysDown.has("ArrowUp") ? 1 : 0;
    const down = this.keysDown.has("ArrowDown") ? 1 : 0;
    const moveX = right - left;
    const moveY = down - up;
    if (moveX !== 0 || moveY !== 0) {
      const speed = (CAMERA_PAN_SPEED * dt) / this.editorCamera.zoom;
      this.editorCamera.x += moveX * speed;
      this.editorCamera.y += moveY * speed;
    }
    this.syncEditorCameraView();
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= AUTOSAVE_INTERVAL_SEC) {
      this.autoSaveTimer = 0;
      this.saveLevel({ silent: true });
    }
  }

  drawWorldOverlays(ctx) {
    if (!this.scene.isEditorMode) return;
    this.drawObjectsOverlay(ctx);
    this.drawEnemiesOverlay(ctx);
    this.drawHiddenHeartOverlay(ctx);
    this.drawPatrolOverlay(ctx);
    if (this.scene.showGrid) this.drawGridOverlay(ctx);
    this.drawGhostPreview(ctx);
    this.drawSpawnMarker(ctx);
  }

  drawScreenOverlays(ctx) {
    if (!this.scene.isEditorMode) return;
    this.drawMinimap(ctx);
    this.drawRewardSummaryCard(ctx);
    this.drawPalettePanel(ctx);
  }

  getEditorApiLimits() {
    const levelConfig =
      this.scene.currentLevelConfig && typeof this.scene.currentLevelConfig === "object"
        ? this.scene.currentLevelConfig
        : {};

    const enemyTargetByType = {};
    if (Array.isArray(levelConfig.enemies)) {
      for (const entry of levelConfig.enemies) {
        const typeKey = toEnemyTypeKey(entry?.enemyCode);
        const count = toPositiveInt(entry?.count);
        if (!typeKey || count <= 0) continue;
        enemyTargetByType[typeKey] = count;
      }
    }

    const enemyTypeMaxByType = {};
    if (
      levelConfig.enemyTypeMaxCount &&
      typeof levelConfig.enemyTypeMaxCount === "object"
    ) {
      for (const [enemyCode, rawMax] of Object.entries(
        levelConfig.enemyTypeMaxCount,
      )) {
        const typeKey = toEnemyTypeKey(enemyCode);
        const max = toPositiveInt(rawMax);
        if (!typeKey || max <= 0) continue;
        enemyTypeMaxByType[typeKey] = max;
      }
    }

    const enemyRewardsByType = {};
    if (
      levelConfig.enemyRewards &&
      typeof levelConfig.enemyRewards === "object"
    ) {
      for (const [enemyCode, rawReward] of Object.entries(
        levelConfig.enemyRewards,
      )) {
        const typeKey = toEnemyTypeKey(enemyCode);
        const reward = toPositiveInt(rawReward);
        if (!typeKey || reward <= 0) continue;
        enemyRewardsByType[typeKey] = reward;
      }
    }

    const fallbackCoinValue = Math.max(
      1,
      toSafeInt(this.scene.levelCoinValue, getFallbackCoinValue(this.scene.levelId)),
    );
    const fallbackEnemyCap = toPositiveInt(this.scene.levelEnemyCap);
    const fallbackMaxTotalCoins = toPositiveInt(this.scene.levelCoinCap);
    const coinValue = Math.max(
      1,
      toPositiveInt(levelConfig.coinValue) || fallbackCoinValue,
    );

    return {
      hasApiConfig:
        Object.keys(levelConfig).length > 0 && levelConfig.isFallback !== true,
      coinCap: toPositiveInt(levelConfig.maxCollectibleCoins),
      enemyCap: toPositiveInt(levelConfig.enemyMaxCount) || fallbackEnemyCap,
      maxTotalCoins: toPositiveInt(levelConfig.maxTotalCoins) || fallbackMaxTotalCoins,
      coinValue,
      enemyTargetByType,
      enemyTypeMaxByType,
      enemyRewardsByType,
    };
  }

  collectEditorUsageCounts() {
    const level = this.getLevel();
    const objects = Array.isArray(level?.objects) ? level.objects : [];
    const enemies = Array.isArray(level?.enemies) ? level.enemies : [];
    const coinCount = objects.reduce((count, entry) => {
      return count + (String(entry?.type || "").trim().toLowerCase() === "coin" ? 1 : 0);
    }, 0);
    const enemyTypeCounts = new Map();
    for (const entry of enemies) {
      const typeKey = toEnemyTypeKey(entry?.type);
      if (!typeKey) continue;
      enemyTypeCounts.set(typeKey, (enemyTypeCounts.get(typeKey) || 0) + 1);
    }
    return {
      coinCount,
      enemyCount: enemies.length,
      enemyTypeCounts,
    };
  }

  getEnemyTypeLimit(typeKey, limits) {
    const byStrictMax = toPositiveInt(limits.enemyTypeMaxByType?.[typeKey]);
    if (byStrictMax > 0) return byStrictMax;
    const byTarget = toPositiveInt(limits.enemyTargetByType?.[typeKey]);
    if (byTarget > 0) return byTarget;
    return 0;
  }

  getEnemyRewardForEditorSummary(type, typeKey, limits) {
    const runtimeReward = Number(this.scene.getRuntimeEnemyReward?.(type));
    if (Number.isFinite(runtimeReward) && runtimeReward >= 0) {
      return Math.floor(runtimeReward);
    }

    const apiReward = Number(limits.enemyRewardsByType?.[typeKey]);
    if (Number.isFinite(apiReward) && apiReward >= 0) {
      return Math.floor(apiReward);
    }

    const localReward = Number(ENEMIES[type]?.coins);
    if (Number.isFinite(localReward) && localReward >= 0) {
      return Math.floor(localReward);
    }

    const matchedEnemyKey = Object.keys(ENEMIES).find(
      (enemyType) => toEnemyTypeKey(enemyType) === typeKey,
    );
    if (matchedEnemyKey) {
      const matchedReward = Number(ENEMIES[matchedEnemyKey]?.coins);
      if (Number.isFinite(matchedReward) && matchedReward >= 0) {
        return Math.floor(matchedReward);
      }
    }

    return EDITOR_DEFAULT_ENEMY_AXO_REWARD;
  }

  formatUsedLimit(used, limit) {
    if (limit > 0) return `${used}/${limit}`;
    return `${used}/--`;
  }

  getEditorRewardSummary() {
    const level = this.getLevel();
    if (!level) {
      return {
        coinCount: 0,
        coinCap: 0,
        coinLeft: 0,
        coinValue: 0,
        coinAxoTotal: 0,
        enemyCount: 0,
        enemyCap: 0,
        enemyLeft: 0,
        enemyTotal: 0,
        enemyLines: [],
        bossType: "none",
        bossTotal: 0,
        boxCount: 0,
        boxTotal: 0,
        maxTotalCoins: 0,
        totalLeft: 0,
        sourceLabel: "LOCAL",
        total: 0,
      };
    }

    const limits = this.getEditorApiLimits();
    const usage = this.collectEditorUsageCounts();
    const objects = Array.isArray(level.objects) ? level.objects : [];
    const placedCoinEntries = objects.filter((entry) => entry?.type === "coin");
    const coinCount = placedCoinEntries.length;
    const coinAxoTotal = coinCount * limits.coinValue;
    const coinLeft =
      limits.coinCap > 0 ? Math.max(0, limits.coinCap - coinCount) : 0;

    const enemies = Array.isArray(level.enemies) ? level.enemies : [];
    const enemyBuckets = new Map();
    let enemyTotal = 0;
    for (const entry of enemies) {
      const type = String(entry?.type || "unknown").trim();
      const typeKey = toEnemyTypeKey(type);
      const reward = this.getEnemyRewardForEditorSummary(type, typeKey, limits);
      enemyTotal += reward;
      const bucket = enemyBuckets.get(typeKey) || {
        label: type || "unknown",
        count: 0,
        rewardEach: reward,
      };
      if (!bucket.label && type) bucket.label = type;
      bucket.count += 1;
      bucket.rewardEach = reward;
      enemyBuckets.set(typeKey, bucket);
    }

    const allEnemyTypes = new Set([
      ...enemyBuckets.keys(),
      ...Object.keys(limits.enemyTargetByType || {}),
      ...Object.keys(limits.enemyTypeMaxByType || {}),
    ]);
    const enemyLines = [...allEnemyTypes]
      .sort((a, b) => a.localeCompare(b))
      .map((typeKey) => {
        const bucket = enemyBuckets.get(typeKey) || {
          label: typeKey || "unknown",
          count: 0,
          rewardEach: this.getEnemyRewardForEditorSummary(
            typeKey,
            typeKey,
            limits,
          ),
        };
        const typeLimit = this.getEnemyTypeLimit(typeKey, limits);
        const usedText = this.formatUsedLimit(bucket.count, typeLimit);
        const overLimit = typeLimit > 0 && bucket.count > typeLimit;
        const subtotal = bucket.count * bucket.rewardEach;
        return `${bucket.label}: ${usedText}${overLimit ? " OVER" : ""} | axo ${subtotal}`;
      });

    let boxCount = 0;
    const tileRows = Array.isArray(level.tiles) ? level.tiles : [];
    for (const row of tileRows) {
      if (!Array.isArray(row)) continue;
      for (const tileId of row) {
        const resolvedTile = toSafeInt(tileId, TILE.EMPTY);
        if (resolvedTile === TILE.BRICK || resolvedTile === TILE.GIFT_BOX)
          boxCount += 1;
      }
    }
    const boxTotal = boxCount * EDITOR_BRICK_AXO_REWARD;

    const bossType = String(level.spawns?.boss?.type || "").trim();
    const configuredBossReward = toPositiveInt(this.scene.levelBossReward);
    const bossTotal =
      configuredBossReward > 0
        ? configuredBossReward
        : Number(FALLBACK_BOSS_REWARDS[bossType] || 0);

    const total = coinAxoTotal + enemyTotal + boxTotal + bossTotal;
    const enemyLeft =
      limits.enemyCap > 0 ? Math.max(0, limits.enemyCap - usage.enemyCount) : 0;
    const totalLeft =
      limits.maxTotalCoins > 0 ? Math.max(0, limits.maxTotalCoins - total) : 0;

    return {
      coinCount,
      coinCap: limits.coinCap,
      coinLeft,
      coinValue: limits.coinValue,
      coinAxoTotal,
      enemyCount: usage.enemyCount,
      enemyCap: limits.enemyCap,
      enemyLeft,
      enemyTotal,
      enemyLines,
      boxCount,
      boxTotal,
      bossType: bossType || "none",
      bossTotal,
      maxTotalCoins: limits.maxTotalCoins,
      totalLeft,
      sourceLabel: limits.hasApiConfig ? "API" : "LOCAL",
      total,
    };
  }

  drawRewardSummaryCard(ctx) {
    const level = this.getLevel();
    if (!level || !this.minimapRect) return;
    const summary = this.getEditorRewardSummary();
    const detailLines = summary.enemyLines.slice(0, 5);
    const hasMoreEnemies = summary.enemyLines.length > detailLines.length;
    const showTotalCap = summary.maxTotalCoins > 0;
    const lineH = 13;
    const bodyLines =
      8 + (showTotalCap ? 1 : 0) + detailLines.length + (hasMoreEnemies ? 1 : 0);
    const cardH = 14 + bodyLines * lineH + 10;
    const cardW = 300;
    const x = PANEL_MARGIN;
    const y = Math.max(PANEL_MARGIN, this.minimapRect.y - cardH - 8);

    ctx.save();
    ctx.fillStyle = "rgba(11,20,31,0.92)";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = "rgba(160,192,220,0.88)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.fillStyle = "#dff2ff";
    ctx.font = "700 12px monospace";
    ctx.fillText("EDITOR LIMITS + AXIO", x + 10, y + 16);

    ctx.font = "11px monospace";
    ctx.fillStyle = "#cce7ff";
    let lineY = y + 32;
    const coinUsedText = this.formatUsedLimit(summary.coinCount, summary.coinCap);
    const enemyUsedText = this.formatUsedLimit(
      summary.enemyCount,
      summary.enemyCap,
    );
    const lines = [
      `Source: ${summary.sourceLabel}`,
      `Coins used: ${coinUsedText}${summary.coinCap > 0 ? ` (${summary.coinLeft} left)` : ""}`,
      `Coin value: ${summary.coinValue} axo each`,
      `Enemies used: ${enemyUsedText}${summary.enemyCap > 0 ? ` (${summary.enemyLeft} left)` : ""}`,
      `Coin axo: ${summary.coinAxoTotal}`,
      `Enemy axo: ${summary.enemyTotal}`,
      `Boss axo: ${summary.bossType} = ${summary.bossTotal}`,
      `TOTAL AXIO: ${summary.total}`,
    ];
    if (showTotalCap) {
      lines.push(`Level max axo: ${summary.maxTotalCoins} (${summary.totalLeft} left)`);
    }
    lines.push("Enemy type usage:");
    for (const line of lines) {
      ctx.fillText(line, x + 10, lineY);
      lineY += lineH;
    }

    ctx.fillStyle = "#9ec7ea";
    if (detailLines.length === 0) {
      ctx.fillText("none", x + 18, lineY);
      lineY += lineH;
    } else {
      for (const detail of detailLines) {
        ctx.fillText(detail, x + 18, lineY);
        lineY += lineH;
      }
    }
    if (hasMoreEnemies) {
      ctx.fillText(`... +${summary.enemyLines.length - detailLines.length} more`, x + 18, lineY);
    }
    ctx.restore();
  }

  worldToScreenX(worldX) {
    return worldX - this.scene.camera.x;
  }

  worldToScreenY(worldY) {
    return worldY - this.scene.camera.y;
  }

  drawEntityPreviewIcon(ctx, imageState, x, y, tileSize, alpha = 1) {
    const drawW = tileSize * 0.72;
    const drawH = tileSize * 0.72;
    const drawX = x + (tileSize - drawW) * 0.5;
    const drawY = y + (tileSize - drawH) * 0.5;
    const texture = imageState?.failed
      ? this.placeholderTexture
      : imageState?.image || this.placeholderTexture;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(texture, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  drawPlayerStartIcon(ctx, x, y, size, alpha = 1) {
    const cx = x + size * 0.5;
    const cy = y + size * 0.5;
    const r = size * 0.22;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffde59";
    ctx.fillStyle = "rgba(255,222,89,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - size * 0.18);
    ctx.lineTo(cx, cy + r + size * 0.18);
    ctx.moveTo(cx - r - size * 0.18, cy);
    ctx.lineTo(cx + r + size * 0.18, cy);
    ctx.stroke();
    ctx.restore();
  }

  drawHeartShape(ctx, x, y, size, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y + size * 0.92);
    ctx.bezierCurveTo(
      x + size * 0.08,
      y + size * 0.6,
      x + size * 0.06,
      y + size * 0.16,
      x + size * 0.32,
      y + size * 0.16,
    );
    ctx.bezierCurveTo(
      x + size * 0.44,
      y + size * 0.16,
      x + size * 0.5,
      y + size * 0.3,
      x + size * 0.5,
      y + size * 0.3,
    );
    ctx.bezierCurveTo(
      x + size * 0.5,
      y + size * 0.3,
      x + size * 0.56,
      y + size * 0.16,
      x + size * 0.68,
      y + size * 0.16,
    );
    ctx.bezierCurveTo(
      x + size * 0.94,
      y + size * 0.16,
      x + size * 0.92,
      y + size * 0.6,
      x + size * 0.5,
      y + size * 0.92,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHiddenHeartIcon(ctx, x, y, size, alpha = 1, { invalid = false } = {}) {
    const pad = Math.max(3, Math.floor(size * 0.12));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = invalid ? "rgba(120,48,56,0.34)" : "rgba(255,108,143,0.18)";
    ctx.strokeStyle = invalid ? "#ff9ca8" : "#ffc0d0";
    ctx.lineWidth = 2;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
    ctx.strokeRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
    this.drawHeartShape(
      ctx,
      x + size * 0.24,
      y + size * 0.2,
      size * 0.52,
      invalid ? "#ffd4da" : "#ff6d94",
    );
    if (invalid) {
      ctx.strokeStyle = "rgba(255,236,236,0.92)";
      ctx.beginPath();
      ctx.moveTo(x + pad + 2, y + pad + 2);
      ctx.lineTo(x + size - pad - 2, y + size - pad - 2);
      ctx.moveTo(x + size - pad - 2, y + pad + 2);
      ctx.lineTo(x + pad + 2, y + size - pad - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGridOverlay(ctx) {
    const level = this.getLevel();
    if (!level) return;
    const tileSize = CONST.GAME.TILE;
    const cam = this.scene.camera;
    const startX = Math.max(0, Math.floor(cam.x / tileSize));
    const endX = Math.min(
      level.sizeTiles.w,
      Math.ceil((cam.x + cam.viewWidth) / tileSize),
    );
    const startY = Math.max(0, Math.floor(cam.y / tileSize));
    const endY = Math.min(
      level.sizeTiles.h,
      Math.ceil((cam.y + cam.viewHeight) / tileSize),
    );

    ctx.save();
    ctx.strokeStyle = "rgba(180,230,255,0.25)";
    ctx.lineWidth = 1;
    for (let tx = startX; tx <= endX; tx += 1) {
      const x = this.worldToScreenX(tx * tileSize);
      ctx.beginPath();
      ctx.moveTo(x, this.worldToScreenY(startY * tileSize));
      ctx.lineTo(x, this.worldToScreenY(endY * tileSize));
      ctx.stroke();
    }
    for (let ty = startY; ty <= endY; ty += 1) {
      const y = this.worldToScreenY(ty * tileSize);
      ctx.beginPath();
      ctx.moveTo(this.worldToScreenX(startX * tileSize), y);
      ctx.lineTo(this.worldToScreenX(endX * tileSize), y);
      ctx.stroke();
    }
    if (this.rectTool.active) {
      const minX = Math.min(this.rectTool.startX, this.rectTool.endX);
      const maxX = Math.max(this.rectTool.startX, this.rectTool.endX);
      const minY = Math.min(this.rectTool.startY, this.rectTool.endY);
      const maxY = Math.max(this.rectTool.startY, this.rectTool.endY);
      const x = this.worldToScreenX(minX * tileSize);
      const y = this.worldToScreenY(minY * tileSize);
      const w = (maxX - minX + 1) * tileSize;
      const h = (maxY - minY + 1) * tileSize;
      ctx.fillStyle = "rgba(70,170,255,0.18)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(70,170,255,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }

  drawSpawnMarker(ctx) {
    const level = this.getLevel();
    if (!level?.playerStart) return;
    const tileSize = CONST.GAME.TILE;
    const x = this.worldToScreenX(level.playerStart.x * tileSize);
    const y = this.worldToScreenY(level.playerStart.y * tileSize);
    this.drawPlayerStartIcon(ctx, x, y, tileSize);
  }

  drawHiddenHeartOverlay(ctx) {
    const level = this.getLevel();
    if (!Array.isArray(level?.hiddenHeartBricks)) return;
    const tileSize = CONST.GAME.TILE;
    for (const entry of level.hiddenHeartBricks) {
      const tx = toSafeInt(entry?.x, -1);
      const ty = toSafeInt(entry?.y, -1);
      if (tx < 0 || ty < 0) continue;
      const x = this.worldToScreenX(tx * tileSize);
      const y = this.worldToScreenY(ty * tileSize);
      this.drawHiddenHeartIcon(ctx, x, y, tileSize, 0.95, {
        invalid: !this.isHiddenHeartHostTile(tx, ty),
      });
    }
  }

  drawObjectsOverlay(ctx) {
    const level = this.getLevel();
    if (!Array.isArray(level?.objects)) return;
    const tileSize = CONST.GAME.TILE;
    for (const entry of level.objects) {
      const x = this.worldToScreenX(entry.x * tileSize);
      const y = this.worldToScreenY(entry.y * tileSize);
      const item = this.findPaletteItem("objects", entry.type);
      const state = item ? this.paletteStates.get(item.path) : null;
      this.drawEntityPreviewIcon(ctx, state, x, y, tileSize, 0.9);
    }
  }

  drawEnemiesOverlay(ctx) {
    const level = this.getLevel();
    if (!Array.isArray(level?.enemies)) return;
    const tileSize = CONST.GAME.TILE;
    for (const entry of level.enemies) {
      const x = this.worldToScreenX(entry.x * tileSize);
      const y = this.worldToScreenY(entry.y * tileSize);
      const item = this.findPaletteItem("enemies", entry.type);
      const state = item ? this.paletteStates.get(item.path) : null;
      this.drawEntityPreviewIcon(ctx, state, x, y, tileSize, 0.92);
      if (
        this.selectedEnemyTile &&
        this.selectedEnemyTile.x === entry.x &&
        this.selectedEnemyTile.y === entry.y
      ) {
        ctx.save();
        ctx.strokeStyle = "#ffd764";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
        ctx.restore();
      }
    }
  }

  drawPatrolOverlay(ctx) {
    const level = this.getLevel();
    if (!Array.isArray(level?.enemies)) return;
    const tileSize = CONST.GAME.TILE;
    ctx.save();
    ctx.strokeStyle = "rgba(255,120,120,0.95)";
    ctx.lineWidth = 3;
    for (const enemy of level.enemies) {
      if (!enemy.patrol) continue;
      const startX = this.worldToScreenX((enemy.patrol.start + 0.5) * tileSize);
      const endX = this.worldToScreenX((enemy.patrol.end + 0.5) * tileSize);
      const y = this.worldToScreenY((enemy.y + 0.5) * tileSize);
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,120,120,0.95)";
      ctx.beginPath();
      ctx.arc(startX, y, 4, 0, Math.PI * 2);
      ctx.arc(endX, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.patrolMode && this.selectedEnemyTile && this.patrolStartTile) {
      const startX = this.worldToScreenX(
        (this.patrolStartTile.x + 0.5) * tileSize,
      );
      const endX = this.worldToScreenX((this.mouse.tileX + 0.5) * tileSize);
      const y = this.worldToScreenY(
        (this.selectedEnemyTile.y + 0.5) * tileSize,
      );
      ctx.strokeStyle = "rgba(255,210,120,0.95)";
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGhostPreview(ctx) {
    if (!this.mouse.inBounds) return;
    if (isRectHit(this.panelRect, this.mouse.x, this.mouse.y)) return;
    if (isRectHit(this.minimapRect, this.mouse.x, this.mouse.y)) return;
    const tileSize = CONST.GAME.TILE;
    const x = this.worldToScreenX(this.mouse.tileX * tileSize);
    const y = this.worldToScreenY(this.mouse.tileY * tileSize);
    if (this.eraserMode && this.scene.currentLayer !== "spawn") {
      const cx = x + tileSize * 0.5;
      const cy = y + tileSize * 0.5;
      ctx.save();
      ctx.strokeStyle = "rgba(255,120,120,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, tileSize - 12, tileSize - 12);
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 10);
      ctx.lineTo(cx + 10, cy + 10);
      ctx.moveTo(cx + 10, cy - 10);
      ctx.lineTo(cx - 10, cy + 10);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (this.scene.currentLayer === "tiles") {
      const item = this.findSelectedTilePaletteItem();
      const state = item ? this.paletteStates.get(item.path) : null;
      this.drawEntityPreviewIcon(ctx, state, x, y, tileSize, 0.6);
      return;
    }
    if (this.scene.currentLayer === "objects") {
      const item = this.findPaletteItem(
        "objects",
        this.scene.selectedObjectType,
      );
      const state = item ? this.paletteStates.get(item.path) : null;
      this.drawEntityPreviewIcon(ctx, state, x, y, tileSize, 0.62);
      return;
    }
    if (this.scene.currentLayer === "enemies") {
      const item = this.findPaletteItem(
        "enemies",
        this.scene.selectedEnemyType,
      );
      const state = item ? this.paletteStates.get(item.path) : null;
      this.drawEntityPreviewIcon(ctx, state, x, y, tileSize, 0.62);
      return;
    }
    if (this.scene.currentLayer === "spawn") {
      const spawnTool = String(
        this.scene.selectedSpawnTool || SPAWN_TOOL_PLAYER_START,
      );
      if (spawnTool === SPAWN_TOOL_HIDDEN_HEART) {
        this.drawHiddenHeartIcon(ctx, x, y, tileSize, 0.72, {
          invalid: !this.isHiddenHeartHostTile(this.mouse.tileX, this.mouse.tileY),
        });
        return;
      }
      this.drawPlayerStartIcon(ctx, x, y, tileSize, 0.72);
    }
  }

  updateUiLayout() {
    const { w, h } = this.getCanvasLogicalSize();
    const panelW = Math.min(PANEL_WIDTH, Math.max(240, w * 0.3));
    const panelH = Math.max(220, h - PANEL_MARGIN * 2);
    const panelX = w - panelW - PANEL_MARGIN;
    const panelY = PANEL_MARGIN;
    this.panelRect = { x: panelX, y: panelY, w: panelW, h: panelH };
    this.listRect = {
      x: panelX + 12,
      y: panelY + 148,
      w: panelW - 24,
      h: Math.max(80, panelH - 286),
    };
    this.minimapRect = {
      x: PANEL_MARGIN,
      y: h - MINIMAP_H - PANEL_MARGIN,
      w: MINIMAP_W,
      h: MINIMAP_H,
    };

    const tabY = panelY + 44;
    const tabH = 28;
    const gap = 6;
    const tabW = Math.floor(
      (panelW - 24 - gap * (LAYER_TABS.length - 1)) / LAYER_TABS.length,
    );
    this.tabRects = LAYER_TABS.map((tab, idx) => ({
      key: tab.key,
      x: panelX + 12 + idx * (tabW + gap),
      y: tabY,
      w: tabW,
      h: tabH,
    }));
    // Bulk clear buttons row (coins / enemies)
    this.clearCoinsButtonRect = {
      x: panelX + 12,
      y: panelY + 72,
      w: Math.floor((panelW - 30) / 2),
      h: 22,
    };
    this.clearEnemiesButtonRect = {
      x: this.clearCoinsButtonRect.x + this.clearCoinsButtonRect.w + 6,
      y: this.clearCoinsButtonRect.y,
      w: this.clearCoinsButtonRect.w,
      h: this.clearCoinsButtonRect.h,
    };
    this.eraserButtonRect = {
      x: panelX + 12,
      y: panelY + 106,
      w: panelW - 24,
      h: 30,
    };
  }

  drawMinimap(ctx) {
    const level = this.getLevel();
    if (!level) return;
    this.updateUiLayout();
    const rect = this.minimapRect;
    const levelPx = this.getLevelPixelSize();
    const scale = Math.min(rect.w / levelPx.w, rect.h / levelPx.h);
    const drawW = levelPx.w * scale;
    const drawH = levelPx.h * scale;
    const drawX = rect.x + (rect.w - drawW) * 0.5;
    const drawY = rect.y + (rect.h - drawH) * 0.5;
    const tilePx = CONST.GAME.TILE * scale;

    ctx.save();
    ctx.fillStyle = "rgba(14,19,27,0.88)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "rgba(160,192,220,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    for (let y = 0; y < level.sizeTiles.h; y += 1) {
      const row = level.tiles[y];
      for (let x = 0; x < level.sizeTiles.w; x += 1) {
        const tileId = toSafeInt(row?.[x], TILE.EMPTY);
        if (tileId === TILE.EMPTY) continue;
        ctx.fillStyle = tileId === TILE.SPIKES ? "#c46767" : "#4f7399";
        ctx.fillRect(drawX + x * tilePx, drawY + y * tilePx, tilePx, tilePx);
      }
    }

    const spawn = level.playerStart || { x: 0, y: 0 };
    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(
      drawX + spawn.x * tilePx,
      drawY + spawn.y * tilePx,
      Math.max(2, tilePx),
      Math.max(2, tilePx),
    );

    if (Array.isArray(level.enemies)) {
      ctx.fillStyle = "#ff7c7c";
      for (const enemy of level.enemies) {
        const ex = drawX + (enemy.x + 0.5) * tilePx;
        const ey = drawY + (enemy.y + 0.5) * tilePx;
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
      }
    }

    if (Array.isArray(level.hiddenHeartBricks)) {
      ctx.fillStyle = "#ff7d9d";
      for (const entry of level.hiddenHeartBricks) {
        const hx = drawX + (toSafeInt(entry?.x, 0) + 0.5) * tilePx;
        const hy = drawY + (toSafeInt(entry?.y, 0) + 0.5) * tilePx;
        ctx.fillRect(hx - 1, hy - 1, 3, 3);
      }
    }

    const cam = this.scene.camera;
    ctx.strokeStyle = "#94f0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      drawX + cam.x * scale,
      drawY + cam.y * scale,
      cam.viewWidth * scale,
      cam.viewHeight * scale,
    );

    ctx.fillStyle = "rgba(210,230,255,0.95)";
    ctx.font = "12px monospace";
    ctx.fillText("MINIMAP", rect.x + 8, rect.y + 14);
    ctx.restore();
  }

  drawPalettePanel(ctx) {
    this.updateUiLayout();
    const rect = this.panelRect;
    if (!rect) return;
    const canvasW = Math.max(1, Math.floor(rect.w));
    const canvasH = Math.max(1, Math.floor(rect.h));
    if (
      this.paletteCanvas.width !== canvasW ||
      this.paletteCanvas.height !== canvasH
    ) {
      this.paletteCanvas.width = canvasW;
      this.paletteCanvas.height = canvasH;
      this.paletteDirty = true;
    }
    if (this.paletteDirty) this.renderPaletteCache();
    ctx.drawImage(this.paletteCanvas, rect.x, rect.y);
  }

  getSelectedItemLabel() {
    if (this.scene.currentLayer === "tiles") {
      const selected = this.findSelectedTilePaletteItem();
      if (selected) return `${selected.name} (#${selected.id})`;
      return `tile:${this.scene.selectedTileId}`;
    }
    if (this.scene.currentLayer === "objects")
      return this.scene.selectedObjectType || "none";
    if (this.scene.currentLayer === "enemies")
      return this.scene.selectedEnemyType || "none";
    return (
      findSpawnTool(this.scene.selectedSpawnTool)?.name ||
      this.scene.selectedSpawnTool ||
      SPAWN_TOOL_PLAYER_START
    );
  }

  getItemsForCurrentLayer() {
    if (this.scene.currentLayer === "tiles") return this.palette.tiles;
    if (this.scene.currentLayer === "objects") return this.palette.objects;
    if (this.scene.currentLayer === "enemies") return this.palette.enemies;
    if (this.scene.currentLayer === "spawn") return SPAWN_TOOLS;
    return [];
  }

  isPaletteItemSelected(item) {
    if (!item) return false;
    if (this.scene.currentLayer === "tiles") {
      const selectedPaletteId = toSafeInt(this.scene.selectedTileId, -1);
      const selectedBehaviorId = toSafeInt(
        this.scene.selectedTileBehaviorId,
        selectedPaletteId,
      );
      return (
        toSafeInt(item.id, -999) === selectedPaletteId &&
        toSafeInt(item.tileId ?? item.id, -999) === selectedBehaviorId
      );
    }
    if (this.scene.currentLayer === "objects") {
      return String(item.type) === String(this.scene.selectedObjectType);
    }
    if (this.scene.currentLayer === "enemies") {
      return String(item.type) === String(this.scene.selectedEnemyType);
    }
    if (this.scene.currentLayer === "spawn") {
      return String(item.type) === String(this.scene.selectedSpawnTool);
    }
    return false;
  }

  renderPaletteCache() {
    const level = this.getLevel();
    const rect = this.panelRect;
    if (!level || !rect) return;
    const pctx = this.paletteCanvas.getContext("2d");
    const w = this.paletteCanvas.width;
    const h = this.paletteCanvas.height;
    pctx.clearRect(0, 0, w, h);

    pctx.fillStyle = "rgba(10,15,22,0.92)";
    pctx.fillRect(0, 0, w, h);
    pctx.strokeStyle = "rgba(173,215,255,0.7)";
    pctx.lineWidth = 2;
    pctx.strokeRect(1, 1, w - 2, h - 2);

    pctx.fillStyle = "#dff2ff";
    pctx.font = "700 16px monospace";
    pctx.fillText("LEVEL EDITOR", 12, 24);
    pctx.font = "12px monospace";
    pctx.fillStyle = "#9ec7ea";
    pctx.fillText(`Layer: ${this.scene.currentLayer}`, 12, 40);
    pctx.fillStyle = "#d7ebff";
    pctx.fillText(`Selected: ${this.getSelectedItemLabel()}`, 12, 92);

    // Bulk actions row
    pctx.font = "11px monospace";
    pctx.fillStyle = "#9ec7ea";
    pctx.fillText("Bulk actions:", 12, 68);

    // Clear coins button
    if (this.clearCoinsButtonRect && this.clearEnemiesButtonRect) {
      const coinsLocal = {
        x: this.clearCoinsButtonRect.x - rect.x,
        y: this.clearCoinsButtonRect.y - rect.y,
        w: this.clearCoinsButtonRect.w,
        h: this.clearCoinsButtonRect.h,
      };
      const enemiesLocal = {
        x: this.clearEnemiesButtonRect.x - rect.x,
        y: this.clearEnemiesButtonRect.y - rect.y,
        w: this.clearEnemiesButtonRect.w,
        h: this.clearEnemiesButtonRect.h,
      };

      pctx.fillStyle = "rgba(42,76,104,0.9)";
      pctx.strokeStyle = "rgba(164,201,230,0.65)";

      pctx.fillRect(coinsLocal.x, coinsLocal.y, coinsLocal.w, coinsLocal.h);
      pctx.strokeRect(coinsLocal.x, coinsLocal.y, coinsLocal.w, coinsLocal.h);
      pctx.fillRect(enemiesLocal.x, enemiesLocal.y, enemiesLocal.w, enemiesLocal.h);
      pctx.strokeRect(enemiesLocal.x, enemiesLocal.y, enemiesLocal.w, enemiesLocal.h);

      pctx.fillStyle = "#eaf6ff";
      pctx.font = "11px monospace";
      pctx.fillText(
        "CLEAR COINS",
        coinsLocal.x + 10,
        coinsLocal.y + Math.floor(coinsLocal.h * 0.65),
      );
      pctx.fillText(
        "CLEAR ENEMIES",
        enemiesLocal.x + 6,
        enemiesLocal.y + Math.floor(enemiesLocal.h * 0.65),
      );
    }

    const eraserLocal = {
      x: this.eraserButtonRect.x - rect.x,
      y: this.eraserButtonRect.y - rect.y,
      w: this.eraserButtonRect.w,
      h: this.eraserButtonRect.h,
    };
    const eraserDisabled = this.scene.currentLayer === "spawn";
    pctx.fillStyle = eraserDisabled
      ? "rgba(74,74,74,0.75)"
      : this.eraserMode
        ? "rgba(176,64,64,0.9)"
        : "rgba(42,76,104,0.9)";
    pctx.fillRect(eraserLocal.x, eraserLocal.y, eraserLocal.w, eraserLocal.h);
    pctx.strokeStyle = eraserDisabled
      ? "rgba(190,190,190,0.35)"
      : this.eraserMode
        ? "#ffd1d1"
        : "rgba(164,201,230,0.65)";
    pctx.strokeRect(eraserLocal.x, eraserLocal.y, eraserLocal.w, eraserLocal.h);
    pctx.fillStyle = eraserDisabled ? "#b9b9b9" : "#eaf6ff";
    pctx.font = "12px monospace";
    if (eraserDisabled) {
      pctx.fillText(
        "ERASER DISABLED (SPAWN LAYER)",
        eraserLocal.x + 8,
        eraserLocal.y + 19,
      );
    } else {
      pctx.fillText(
        this.eraserMode
          ? "ERASER: ON (LMB REMOVE)"
          : "ERASER: OFF (CLICK TO TOGGLE)",
        eraserLocal.x + 8,
        eraserLocal.y + 19,
      );
    }

    for (const tabRect of this.tabRects) {
      const local = {
        x: tabRect.x - rect.x,
        y: tabRect.y - rect.y,
        w: tabRect.w,
        h: tabRect.h,
      };
      const active = this.scene.currentLayer === tabRect.key;
      pctx.fillStyle = active ? "#4f93cc" : "rgba(38,57,77,0.85)";
      pctx.fillRect(local.x, local.y, local.w, local.h);
      pctx.strokeStyle = active ? "#cbe9ff" : "rgba(133,164,192,0.55)";
      pctx.strokeRect(local.x, local.y, local.w, local.h);
      pctx.fillStyle = active ? "#f5fbff" : "#9ec3e2";
      pctx.font = "12px monospace";
      pctx.fillText(tabRect.key.toUpperCase(), local.x + 8, local.y + 18);
    }

    const listLocal = {
      x: this.listRect.x - rect.x,
      y: this.listRect.y - rect.y,
      w: this.listRect.w,
      h: this.listRect.h,
    };
    pctx.fillStyle = "rgba(11,20,31,0.9)";
    pctx.fillRect(listLocal.x, listLocal.y, listLocal.w, listLocal.h);
    pctx.strokeStyle = "rgba(143,178,205,0.35)";
    pctx.strokeRect(listLocal.x, listLocal.y, listLocal.w, listLocal.h);

    const items = this.getItemsForCurrentLayer();
    const scroll = Math.max(
      0,
      Number(this.paletteScroll[this.scene.currentLayer] || 0),
    );
    const itemH = 56;
    const itemGap = 8;
    const contentH = Math.max(0, items.length * (itemH + itemGap) - itemGap);
    const maxScroll = Math.max(0, contentH - listLocal.h);
    this.paletteScroll[this.scene.currentLayer] = clamp(scroll, 0, maxScroll);

    pctx.save();
    pctx.beginPath();
    pctx.rect(listLocal.x, listLocal.y, listLocal.w, listLocal.h);
    pctx.clip();
    this.paletteItemRects = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const y =
        listLocal.y +
        i * (itemH + itemGap) -
        this.paletteScroll[this.scene.currentLayer];
      if (y + itemH < listLocal.y || y > listLocal.y + listLocal.h) continue;
      const x = listLocal.x + 8;
      const cardW = listLocal.w - 16;
      const selected = this.isPaletteItemSelected(item);
      pctx.fillStyle = selected
        ? "rgba(84,141,188,0.82)"
        : "rgba(28,45,63,0.95)";
      pctx.fillRect(x, y, cardW, itemH);
      pctx.strokeStyle = selected ? "#d6eeff" : "rgba(136,168,196,0.44)";
      pctx.strokeRect(x, y, cardW, itemH);

      if (this.scene.currentLayer === "spawn") {
        if (String(item.type) === SPAWN_TOOL_HIDDEN_HEART) {
          this.drawHiddenHeartIcon(pctx, x + 8, y + 8, 40, 0.95);
        } else {
          this.drawPlayerStartIcon(pctx, x + 8, y + 8, 40, 0.95);
        }
      } else {
        const state = this.paletteStates.get(item.path);
        const texture = state?.failed
          ? this.placeholderTexture
          : state?.image || this.placeholderTexture;
        pctx.drawImage(texture, x + 8, y + 8, 40, 40);
      }

      pctx.fillStyle = "#e6f4ff";
      pctx.font = "12px monospace";
      pctx.fillText(item.name || item.type || String(item.id), x + 56, y + 22);
      pctx.fillStyle = "#9dc2e3";
      if (this.scene.currentLayer === "tiles") {
        pctx.fillText(
          `No: ${item.id} | Type: ${toSafeInt(item.tileId ?? item.id, -1)}`,
          x + 56,
          y + 40,
        );
      } else if (this.scene.currentLayer === "spawn") {
        pctx.fillText(item.description || "spawn tool", x + 56, y + 40);
      } else {
        pctx.fillText(`Type: ${item.type}`, x + 56, y + 40);
      }

      this.paletteItemRects.push({
        x: rect.x + x,
        y: rect.y + y,
        w: cardW,
        h: itemH,
        item,
      });
    }
    pctx.restore();

    pctx.fillStyle = "#9bc1e1";
    pctx.font = "11px monospace";
    const hints = [
      "` toggle  | Q/W/E/R layers",
      "LMB place | RMB remove",
      "ERASER button: LMB remove",
      "SHIFT drag rectangle fill",
      "Ctrl+Z undo | Ctrl+Y redo",
      "X export | Z import",
      "K save local | J load local",
      "T patrol mode | G grid",
      "Wheel zoom | Middle drag pan",
    ];
    for (let i = 0; i < hints.length; i += 1) {
      pctx.fillText(hints[i], 12, h - 92 + i * 11);
    }
    this.paletteDirty = false;
  }

  handlePanelClick(x, y) {
    if (this.clearCoinsButtonRect && isRectHit(this.clearCoinsButtonRect, x, y)) {
      const level = this.getLevel();
      if (level) {
        level.coins = [];
        level.objects = Array.isArray(level.objects)
          ? level.objects.filter(
              (entry) =>
                String(entry?.type || "").trim().toLowerCase() !== "coin",
            )
          : [];
        this.notify("All coins removed from level.");
        this.paletteDirty = true;
      }
      return;
    }

    if (
      this.clearEnemiesButtonRect &&
      isRectHit(this.clearEnemiesButtonRect, x, y)
    ) {
      const level = this.getLevel();
      if (level) {
        level.enemies = [];
        if (level.spawns && typeof level.spawns === "object") {
          level.spawns.enemies = [];
          level.spawns.elites = Array.isArray(level.spawns.elites)
            ? level.spawns.elites
            : [];
        }
        this.notify("All enemies removed from level.");
        this.paletteDirty = true;
      }
      return;
    }

    if (isRectHit(this.eraserButtonRect, x, y)) {
      if (this.scene.currentLayer === "spawn") {
        this.notify("Spawn layer uses RMB to remove hidden hearts.");
      } else {
        this.eraserMode = !this.eraserMode;
        this.notify(this.eraserMode ? "Eraser ON" : "Eraser OFF");
      }
      this.paletteDirty = true;
      return;
    }
    for (const tabRect of this.tabRects) {
      if (!isRectHit(tabRect, x, y)) continue;
      this.setCurrentLayer(tabRect.key);
      return;
    }
    for (const entry of this.paletteItemRects) {
      if (!isRectHit(entry, x, y)) continue;
      const item = entry.item;
      if (this.scene.currentLayer === "tiles") {
        this.scene.selectedTileId = toSafeInt(item.id, TILE.SOLID);
        this.scene.selectedTileBehaviorId = toSafeInt(
          item.tileId ?? item.id,
          this.scene.selectedTileId,
        );
      } else if (this.scene.currentLayer === "objects") {
        this.scene.selectedObjectType = String(item.type || "coin");
      } else if (this.scene.currentLayer === "enemies") {
        this.scene.selectedEnemyType = String(item.type || "iceSlime");
      } else if (this.scene.currentLayer === "spawn") {
        this.scene.selectedSpawnTool = String(
          item.type || SPAWN_TOOL_PLAYER_START,
        );
      }
      this.paletteDirty = true;
      return;
    }
  }

  handleMinimapClick(x, y) {
    const level = this.getLevel();
    if (!level) return;
    const rect = this.minimapRect;
    const levelPx = this.getLevelPixelSize();
    const scale = Math.min(rect.w / levelPx.w, rect.h / levelPx.h);
    const drawW = levelPx.w * scale;
    const drawH = levelPx.h * scale;
    const drawX = rect.x + (rect.w - drawW) * 0.5;
    const drawY = rect.y + (rect.h - drawH) * 0.5;
    if (x < drawX || x > drawX + drawW || y < drawY || y > drawY + drawH)
      return;
    const worldX = ((x - drawX) / drawW) * levelPx.w;
    const worldY = ((y - drawY) / drawH) * levelPx.h;
    this.editorCamera.x = worldX - this.scene.camera.viewWidth * 0.5;
    this.editorCamera.y = worldY - this.scene.camera.viewHeight * 0.5;
    this.syncEditorCameraView();
  }

  findPaletteItem(layer, keyValue) {
    const items = this.palette[layer] || [];
    if (layer === "tiles") {
      const id = toSafeInt(keyValue, -1);
      return items.find((item) => toSafeInt(item.id, -999) === id) || null;
    }
    const raw = String(keyValue || "").trim();
    if (!raw) return null;
    const exact = items.find((item) => String(item.type) === raw) || null;
    if (exact || layer !== "objects") return exact;

    const world = String(this.getLevel()?.world || "").toLowerCase();
    if (world && !raw.startsWith(`${world}_`)) {
      const worldPrefixed =
        items.find((item) => String(item.type) === `${world}_${raw}`) || null;
      if (worldPrefixed) return worldPrefixed;
    }

    return (
      items.find((item) => String(item.type).endsWith(`_${raw}`)) || null
    );
  }

  findSelectedTilePaletteItem() {
    const items = this.palette.tiles || [];
    const selectedPaletteId = toSafeInt(this.scene.selectedTileId, -1);
    const selectedBehaviorId = toSafeInt(
      this.scene.selectedTileBehaviorId,
      selectedPaletteId,
    );
    return (
      items.find(
        (item) =>
          toSafeInt(item.id, -999) === selectedPaletteId &&
          toSafeInt(item.tileId ?? item.id, -999) === selectedBehaviorId,
      ) ||
      items.find((item) => toSafeInt(item.id, -999) === selectedPaletteId) ||
      items.find(
        (item) => toSafeInt(item.tileId ?? item.id, -999) === selectedBehaviorId,
      ) ||
      null
    );
  }

  ensureSelectionDefaults() {
    const selectedTile = this.findSelectedTilePaletteItem();
    if (!selectedTile) {
      const firstTile = this.palette.tiles[0] || null;
      this.scene.selectedTileId = toSafeInt(firstTile?.id, TILE.SOLID);
      this.scene.selectedTileBehaviorId = toSafeInt(
        firstTile?.tileId ?? firstTile?.id,
        this.scene.selectedTileId,
      );
    } else {
      this.scene.selectedTileId = toSafeInt(selectedTile.id, TILE.SOLID);
      this.scene.selectedTileBehaviorId = toSafeInt(
        selectedTile.tileId ?? selectedTile.id,
        this.scene.selectedTileId,
      );
    }
    if (!this.findPaletteItem("objects", this.scene.selectedObjectType)) {
      this.scene.selectedObjectType = this.palette.objects[0]?.type ?? "coin";
    }
    if (!this.findPaletteItem("enemies", this.scene.selectedEnemyType)) {
      this.scene.selectedEnemyType =
        this.palette.enemies[0]?.type ?? "iceSlime";
    }
    if (!findSpawnTool(this.scene.selectedSpawnTool)) {
      this.scene.selectedSpawnTool = SPAWN_TOOL_PLAYER_START;
    }
  }

  queuePaletteTextureLoads() {
    const merged = [
      ...this.palette.tiles,
      ...this.palette.objects,
      ...this.palette.enemies,
    ];
    for (const item of merged) {
      const key = item.path || "";
      if (!key || this.paletteStates.has(key)) continue;
      this.paletteStates.set(
        key,
        makeImageLoader(key, () => {
          this.paletteDirty = true;
        }),
      );
    }
  }

  buildTilePalette(manifest, world) {
    if (manifest && Array.isArray(manifest.items)) {
      const basePath = String(manifest.basePath || "/");
      const worldName = String(world || "ice").toLowerCase();
      const mapped = manifest.items
        .map((item, index) => {
          const id = toManifestTileId(item.id ?? index);
          const tileId = toManifestTileId(item.tileId ?? item.id ?? index);
          const file = String(item.file || "").trim();
          const path = toPublicAssetPath(resolveManifestFilePath(file, basePath));
          return {
            id,
            tileId,
            name: String(item.name || TILE_LABEL[id] || `tile_${id}`),
            path,
            file,
          };
        })
        .filter((item) => Number.isFinite(item.id))
        .filter((item) =>
          shouldIncludeAssetForWorld(worldName, {
            file: item.file,
            name: item.name,
            alwaysInclude: item.tileId === TILE.EMPTY,
          }),
        );
      // Keep all variant previews (top/inner/left/right etc.) in Tiles palette.
      return mapped.map(({ file, ...entry }) => entry);
    }
    const ids = [
      TILE.EMPTY,
      TILE.SOLID,
      TILE.ONE_WAY,
      TILE.SPIKES,
      TILE.ICE,
      TILE.WATER,
      TILE.POISON,
      TILE.BRICK,
      TILE.GIFT_BOX,
      TILE.BARBED_WIRE,
    ];
    return ids.map((id) => ({
      id,
      tileId: id,
      name: TILE_LABEL[id] || `tile_${id}`,
      path: toPublicAssetPath(getWorldTilePath(world, id)),
    }));
  }

  buildObjectPalette(manifest, world, tileManifest = null) {
    const worldName = String(world || "ice").toLowerCase();
    const worldTileAssetKeys = collectWorldTileAssetKeys(worldName);
    const manifestTileKeys = collectTileManifestAssetKeys(tileManifest, worldName);
    for (const pathKey of manifestTileKeys) worldTileAssetKeys.add(pathKey);
    const isTileVisualObject = (item) => {
      const objectType = String(item?.type || "");
      if (isAlwaysIncludedEditorObjectType(objectType)) return false;
      const fileKey = normalizePathForWorldMatch(item?.file || item?.path || "");
      return fileKey ? worldTileAssetKeys.has(fileKey) : false;
    };

    if (manifest && Array.isArray(manifest.items)) {
      const basePath = String(manifest.basePath || "/");
      const mapped = manifest.items
        .map((item, index) => {
          const type = String(item.type || `object_${index}`).trim();
          const file = String(item.file || "").trim();
          const path = toPublicAssetPath(resolveManifestFilePath(file, basePath));
          return {
            type,
            name: String(
              item.name || pathBasename(file).replace(/\.png$/i, ""),
            ),
            path,
            file,
          };
        })
        .filter((item) => item.type.length > 0)
        .filter((item) =>
          shouldIncludeAssetForWorld(worldName, {
            file: item.file,
            name: item.name,
            type: item.type,
            alwaysInclude: isAlwaysIncludedEditorObjectType(item.type),
          }),
        );
      const withoutTileVisuals = mapped.filter((item) => !isTileVisualObject(item));
      const seenTypes = new Set(
        withoutTileVisuals.map((item) => String(item.type || "").trim()),
      );
      for (const item of DEFAULT_OBJECT_TYPES) {
        if (!isAlwaysIncludedEditorObjectType(item.type)) continue;
        if (
          !shouldIncludeAssetForWorld(worldName, {
            file: item.path,
            name: item.name,
            type: item.type,
            alwaysInclude: true,
          })
        ) {
          continue;
        }
        const type = String(item.type || "").trim();
        if (!type || seenTypes.has(type)) continue;
        withoutTileVisuals.push({
          type,
          name: String(item.name || type),
          path: toPublicAssetPath(item.path),
        });
        seenTypes.add(type);
      }
      ensureRequiredWorldObjects(withoutTileVisuals, worldName);
      return dedupeByStableKey(
        withoutTileVisuals,
        (item) => `${item.type}|${item.path}`,
      ).map(({ file, ...entry }) => entry);
    }
    const worldDecor = (WORLD_VISUALS[world]?.decorations || []).map(
      (deco) => ({
        type: pathBasename(deco.path).replace(/\.png$/i, ""),
        path: toPublicAssetPath(deco.path),
        name: pathBasename(deco.path).replace(/\.png$/i, ""),
      }),
    );
    const keyed = new Map();
    const worldDefaults = DEFAULT_OBJECT_TYPES.filter((item) =>
      shouldIncludeAssetForWorld(worldName, {
        file: item.path,
        name: item.name,
        type: item.type,
        alwaysInclude: isAlwaysIncludedEditorObjectType(item.type),
      }),
    );
    const filteredDefaults = worldDefaults.filter((item) => !isTileVisualObject(item));
    const mergedItems = ensureRequiredWorldObjects(
      [...filteredDefaults, ...worldDecor],
      worldName,
    );
    for (const item of mergedItems) {
      keyed.set(item.type, item);
    }
    return [...keyed.values()];
  }

  buildEnemyPalette(manifest, allowedEnemyTypes = null) {
    if (manifest && Array.isArray(manifest.items)) {
      const basePath = String(manifest.basePath || "/");
      const mapped = manifest.items
        .map((item, index) => {
          const type = String(item.type || `enemy_${index}`).trim();
          const file = String(item.file || "").trim();
          const path = toPublicAssetPath(resolveManifestFilePath(file, basePath));
          return {
            type,
            name: String(item.name || type),
            path,
          };
        })
        .filter((item) => item.type.length > 0);
      let deduped = dedupeByStableKey(mapped, (item) => item.type);

      // Ensure all allowed enemy types have at least a basic palette entry,
      // even if the manifest is missing them (e.g. "grin" / "golden" etc.).
      if (allowedEnemyTypes && allowedEnemyTypes.size > 0) {
        const missing = [];
        for (const type of allowedEnemyTypes) {
          if (!type) continue;
          const exists = deduped.some((item) => item.type === type);
          if (!exists && ENEMIES[type]) {
            missing.push({
              type,
              name: type,
              path: toPublicAssetPath(ENEMY_SPRITES[type]?.idle || ""),
            });
          }
        }
        if (missing.length > 0) {
          deduped = dedupeByStableKey([...deduped, ...missing], (item) => item.type);
        }
        const filtered = deduped.filter((item) => allowedEnemyTypes.has(item.type));
        if (filtered.length > 0) return filtered;
      }

      // No explicit allowed set; fall back to whatever the manifest (plus
      // any ENEMIES-based additions) produced.
      return deduped;
    }
    const fallback = Object.keys(ENEMIES).map((type) => ({
      type,
      name: type,
      path: toPublicAssetPath(ENEMY_SPRITES[type]?.idle || ""),
    }));
    if (allowedEnemyTypes && allowedEnemyTypes.size > 0) {
      const filtered = fallback.filter((item) =>
        allowedEnemyTypes.has(item.type),
      );
      if (filtered.length > 0) return filtered;
    }
    return fallback;
  }

  ensurePalettesLoaded() {
    const level = this.getLevel();
    const world = String(level?.world || "ice");
    const levelId = toSafeInt(level?.id ?? this.scene.levelId, 0);
    const paletteKey = `${world}:${levelId}`;
    const levelAsset = LEVEL_ASSETS[levelId] || null;
    const allowedEnemyTypes = collectLevelEnemyTypes(level, levelAsset);
    if (Array.isArray(this.scene.currentLevelConfig?.enemies)) {
      for (const entry of this.scene.currentLevelConfig.enemies) {
        const type = String(entry?.enemyCode || "").trim();
        if (type) allowedEnemyTypes.add(type);
      }
    }
    const apiBossCode = String(this.scene.currentLevelConfig?.bossCode || "").trim();
    if (apiBossCode) allowedEnemyTypes.add(apiBossCode);
    if (this.isPaletteLoading) return;
    if (this.isPaletteLoaded && this.lastWorldForPalette === paletteKey) return;
    this.isPaletteLoading = true;
    this.lastWorldForPalette = paletteKey;
    Promise.all([
      loadJsonManifest("/assets/tiles/manifest.json"),
      loadJsonManifest("/assets/objects/manifest.json"),
      loadJsonManifest("/assets/enemies/manifest.json"),
    ])
      .then(([tileManifest, objectManifest, enemyManifest]) => {
        this.palette.tiles = this.buildTilePalette(tileManifest, world);
        this.palette.objects = this.buildObjectPalette(
          objectManifest,
          world,
          tileManifest,
        );
        this.palette.enemies = this.buildEnemyPalette(
          enemyManifest,
          allowedEnemyTypes,
        );
        this.ensureSelectionDefaults();
        this.queuePaletteTextureLoads();
        this.paletteDirty = true;
        this.isPaletteLoaded = true;
      })
      .finally(() => {
        this.isPaletteLoading = false;
      });
  }

  syncTilesFromMap() {
    const level = this.getLevel();
    const map = this.scene.map;
    if (!level || !map || !Array.isArray(level.tiles)) return;
    for (let y = 0; y < level.sizeTiles.h; y += 1) {
      for (let x = 0; x < level.sizeTiles.w; x += 1) {
        level.tiles[y][x] = toSafeInt(map.getTile(x, y), TILE.EMPTY);
      }
    }
  }

  getTileValue(x, y) {
    const level = this.getLevel();
    if (!level) return TILE.EMPTY;
    if (x < 0 || y < 0 || x >= level.sizeTiles.w || y >= level.sizeTiles.h)
      return TILE.EMPTY;
    return toSafeInt(level.tiles?.[y]?.[x], TILE.EMPTY);
  }

  setTileValue(x, y, value) {
    const level = this.getLevel();
    if (!level) return;
    if (x < 0 || y < 0 || x >= level.sizeTiles.w || y >= level.sizeTiles.h)
      return;
    const safeValue = toSafeInt(value, TILE.EMPTY);
    level.tiles[y][x] = safeValue;
    this.scene.map.setTile(x, y, safeValue);
  }

  findEntityIndex(layer, x, y) {
    const level = this.getLevel();
    const list = Array.isArray(level?.[layer]) ? level[layer] : [];
    return list.findIndex((entry) => entry.x === x && entry.y === y);
  }

  getEntityAt(layer, x, y) {
    const level = this.getLevel();
    const list = Array.isArray(level?.[layer]) ? level[layer] : [];
    const idx = list.findIndex((entry) => entry.x === x && entry.y === y);
    if (idx < 0) return null;
    return cloneEntity(list[idx]);
  }

  setEntityAt(layer, x, y, nextEntity) {
    const level = this.getLevel();
    if (!level) return;
    if (!Array.isArray(level[layer])) level[layer] = [];
    const list = level[layer];
    const idx = this.findEntityIndex(layer, x, y);
    if (idx >= 0) list.splice(idx, 1);
    if (nextEntity) {
      const safe = cloneEntity(nextEntity);
      safe.x = x;
      safe.y = y;
      list.push(safe);
    }
    if (layer === "enemies" && !this.getEntityAt("enemies", x, y)) {
      if (
        this.selectedEnemyTile &&
        this.selectedEnemyTile.x === x &&
        this.selectedEnemyTile.y === y
      ) {
        this.selectedEnemyTile = null;
        this.patrolMode = false;
        this.patrolStep = 0;
        this.patrolStartTile = null;
      }
    }
  }

  getHiddenHeartBricks() {
    const level = this.getLevel();
    if (!level) return [];
    if (!Array.isArray(level.hiddenHeartBricks)) level.hiddenHeartBricks = [];
    return level.hiddenHeartBricks;
  }

  findHiddenHeartIndex(x, y) {
    const hiddenHeartBricks = this.getHiddenHeartBricks();
    for (let i = 0; i < hiddenHeartBricks.length; i += 1) {
      const entry = hiddenHeartBricks[i];
      if (
        toSafeInt(entry?.x, -1) === x &&
        toSafeInt(entry?.y, -1) === y
      ) {
        return i;
      }
    }
    return -1;
  }

  hasHiddenHeartAt(x, y) {
    return this.findHiddenHeartIndex(x, y) >= 0;
  }

  setHiddenHeartAt(x, y, enabled) {
    const level = this.getLevel();
    if (!level) return;
    const current = this.getHiddenHeartBricks();
    const next = enabled
      ? [...current, { x, y }]
      : current.filter(
          (entry) =>
            toSafeInt(entry?.x, -1) !== x || toSafeInt(entry?.y, -1) !== y,
        );
    level.hiddenHeartBricks = normalizeHiddenHeartBricks(next, level.sizeTiles);
  }

  isHiddenHeartHostTile(x, y) {
    return isHiddenHeartHostTileId(this.getTileValue(x, y));
  }

  buildSetTileDiff(x, y, nextValue) {
    const previous = this.getTileValue(x, y);
    const next = toSafeInt(nextValue, TILE.EMPTY);
    if (previous === next) return null;
    return { type: "setTile", x, y, previous, new: next };
  }

  buildSetEntityDiff(layer, x, y, nextEntity) {
    const previous = this.getEntityAt(layer, x, y);
    const next = nextEntity ? cloneEntity(nextEntity) : null;
    if (JSON.stringify(previous || null) === JSON.stringify(next || null))
      return null;
    return { type: "setEntity", layer, x, y, previous, new: next };
  }

  buildSetSpawnDiff(x, y) {
    const level = this.getLevel();
    if (!level?.playerStart) return null;
    const previous = {
      x: toSafeInt(level.playerStart.x, 0),
      y: toSafeInt(level.playerStart.y, 0),
    };
    const next = { x, y };
    if (previous.x === next.x && previous.y === next.y) return null;
    return { type: "setSpawn", previous, new: next };
  }

  buildSetHiddenHeartDiff(x, y, enabled) {
    const previous = this.hasHiddenHeartAt(x, y);
    const next = Boolean(enabled);
    if (previous === next) return null;
    return { type: "setHiddenHeart", x, y, previous, new: next };
  }

  applyDiff(diff, mode) {
    if (!diff) return;
    const usePrevious = mode === "undo";
    if (diff.type === "setTile") {
      this.setTileValue(diff.x, diff.y, usePrevious ? diff.previous : diff.new);
      return;
    }
    if (diff.type === "setEntity") {
      this.setEntityAt(
        diff.layer,
        diff.x,
        diff.y,
        usePrevious ? diff.previous : diff.new,
      );
      return;
    }
    if (diff.type === "setSpawn") {
      const value = usePrevious ? diff.previous : diff.new;
      this.scene.levelData.playerStart.x = value.x;
      this.scene.levelData.playerStart.y = value.y;
      return;
    }
    if (diff.type === "setHiddenHeart") {
      this.setHiddenHeartAt(
        diff.x,
        diff.y,
        usePrevious ? diff.previous : diff.new,
      );
    }
  }

  applyAction(action, mode) {
    if (!action) return;
    if (action.type === "batch" && Array.isArray(action.diffs)) {
      const list = mode === "undo" ? [...action.diffs].reverse() : action.diffs;
      for (const diff of list) {
        this.applyDiff(diff, mode);
      }
      return;
    }
    this.applyDiff(action, mode);
  }

  pushHistory(action) {
    if (!action) return;
    this.scene.history.push(action);
    if (this.scene.history.length > HISTORY_LIMIT) {
      this.scene.history.splice(0, this.scene.history.length - HISTORY_LIMIT);
    }
    this.scene.redoStack = [];
  }

  undo() {
    if (!this.scene.isEditorMode) return;
    const action = this.scene.history.pop();
    if (!action) return;
    this.applyAction(action, "undo");
    this.scene.redoStack.push(action);
  }

  redo() {
    if (!this.scene.isEditorMode) return;
    const action = this.scene.redoStack.pop();
    if (!action) return;
    this.applyAction(action, "redo");
    this.scene.history.push(action);
  }

  placeAtTile(x, y) {
    const layer = this.scene.currentLayer;
    const limits = this.getEditorApiLimits();
    const usage = this.collectEditorUsageCounts();
    if (layer === "tiles") {
      const diff = this.buildSetTileDiff(
        x,
        y,
        toSafeInt(this.scene.selectedTileBehaviorId, this.scene.selectedTileId),
      );
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
      return;
    }
    if (layer === "objects") {
      const nextObjectType = String(this.scene.selectedObjectType || "coin")
        .trim()
        .toLowerCase();
      const previousObject = this.getEntityAt("objects", x, y);
      const previousIsCoin =
        String(previousObject?.type || "").trim().toLowerCase() === "coin";
      const nextIsCoin = nextObjectType === "coin";
      const projectedCoinCount =
        usage.coinCount + (nextIsCoin ? 1 : 0) - (previousIsCoin ? 1 : 0);
      if (limits.coinCap > 0 && projectedCoinCount > limits.coinCap) {
        this.notify(`Coin limit reached (${usage.coinCount}/${limits.coinCap}).`);
        return;
      }
      const diff = this.buildSetEntityDiff("objects", x, y, {
        type: this.scene.selectedObjectType || "coin",
        x,
        y,
      });
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
      return;
    }
    if (layer === "enemies") {
      const existing = this.getEntityAt("enemies", x, y);
      if (existing) {
        this.selectedEnemyTile = { x, y };
      }
      const nextEntity = {
        type: this.scene.selectedEnemyType || "iceSlime",
        x,
        y,
      };
      const nextTypeKey = toEnemyTypeKey(nextEntity.type);
      const existingTypeKey = toEnemyTypeKey(existing?.type);
      const projectedEnemyCount = usage.enemyCount + (existing ? 0 : 1);
      if (limits.enemyCap > 0 && projectedEnemyCount > limits.enemyCap) {
        this.notify(`Enemy limit reached (${usage.enemyCount}/${limits.enemyCap}).`);
        return;
      }
      const currentTypeCount = usage.enemyTypeCounts.get(nextTypeKey) || 0;
      const projectedTypeCount =
        currentTypeCount + 1 - (existingTypeKey === nextTypeKey ? 1 : 0);
      const typeLimit = this.getEnemyTypeLimit(nextTypeKey, limits);
      if (typeLimit > 0 && projectedTypeCount > typeLimit) {
        this.notify(
          `${nextEntity.type} limit reached (${currentTypeCount}/${typeLimit}).`,
        );
        return;
      }
      if (existing?.patrol && existing.type === nextEntity.type) {
        nextEntity.patrol = { ...existing.patrol };
      }
      const diff = this.buildSetEntityDiff("enemies", x, y, {
        ...nextEntity,
      });
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.selectedEnemyTile = { x, y };
      this.pushHistory(diff);
      return;
    }
    if (layer === "spawn") {
      const spawnTool = String(
        this.scene.selectedSpawnTool || SPAWN_TOOL_PLAYER_START,
      );
      if (spawnTool === SPAWN_TOOL_HIDDEN_HEART) {
        if (!this.isHiddenHeartHostTile(x, y)) {
          this.notify("Hidden hearts must be placed on brick, gift box, or ice.");
          return;
        }
        const diff = this.buildSetHiddenHeartDiff(x, y, true);
        if (!diff) {
          this.notify("Hidden heart already set there. Use RMB to remove it.");
          return;
        }
        this.applyDiff(diff, "redo");
        this.pushHistory(diff);
        return;
      }
      const diff = this.buildSetSpawnDiff(x, y);
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
    }
  }

  removeAtTile(x, y) {
    const layer = this.scene.currentLayer;
    if (layer === "tiles") {
      const diff = this.buildSetTileDiff(x, y, TILE.EMPTY);
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
      return;
    }
    if (layer === "objects" || layer === "enemies") {
      const diff = this.buildSetEntityDiff(layer, x, y, null);
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
      return;
    }
    if (layer === "spawn") {
      const diff = this.buildSetHiddenHeartDiff(x, y, false);
      if (!diff) return;
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
    }
  }

  applyRectangleTool() {
    const level = this.getLevel();
    if (!level) return;
    const limits = this.getEditorApiLimits();
    const usage = this.collectEditorUsageCounts();
    let projectedCoinCount = usage.coinCount;
    let projectedEnemyCount = usage.enemyCount;
    const projectedEnemyTypeCounts = new Map(usage.enemyTypeCounts);
    let skippedByLimit = 0;
    const minX = clamp(
      Math.min(this.rectTool.startX, this.rectTool.endX),
      0,
      level.sizeTiles.w - 1,
    );
    const maxX = clamp(
      Math.max(this.rectTool.startX, this.rectTool.endX),
      0,
      level.sizeTiles.w - 1,
    );
    const minY = clamp(
      Math.min(this.rectTool.startY, this.rectTool.endY),
      0,
      level.sizeTiles.h - 1,
    );
    const maxY = clamp(
      Math.max(this.rectTool.startY, this.rectTool.endY),
      0,
      level.sizeTiles.h - 1,
    );
    const layer = this.rectTool.layer;
    const diffs = [];

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (layer === "tiles") {
          const diff = this.buildSetTileDiff(
            x,
            y,
            toSafeInt(this.scene.selectedTileBehaviorId, this.scene.selectedTileId),
          );
          if (diff) diffs.push(diff);
        } else if (layer === "objects") {
          const diff = this.buildSetEntityDiff("objects", x, y, {
            type: this.scene.selectedObjectType || "coin",
            x,
            y,
          });
          if (!diff) continue;
          const prevIsCoin =
            String(diff.previous?.type || "").trim().toLowerCase() === "coin";
          const nextIsCoin =
            String(diff.new?.type || "").trim().toLowerCase() === "coin";
          const deltaCoin = (nextIsCoin ? 1 : 0) - (prevIsCoin ? 1 : 0);
          if (
            limits.coinCap > 0 &&
            deltaCoin > 0 &&
            projectedCoinCount + deltaCoin > limits.coinCap
          ) {
            skippedByLimit += 1;
            continue;
          }
          projectedCoinCount += deltaCoin;
          diffs.push(diff);
        } else if (layer === "enemies") {
          const diff = this.buildSetEntityDiff("enemies", x, y, {
            type: this.scene.selectedEnemyType || "iceSlime",
            x,
            y,
          });
          if (!diff) continue;

          const prevTypeKey = toEnemyTypeKey(diff.previous?.type);
          const nextTypeKey = toEnemyTypeKey(diff.new?.type);
          const deltaTotal = diff.previous ? 0 : 1;
          if (
            limits.enemyCap > 0 &&
            deltaTotal > 0 &&
            projectedEnemyCount + deltaTotal > limits.enemyCap
          ) {
            skippedByLimit += 1;
            continue;
          }

          const currentNextTypeCount = projectedEnemyTypeCounts.get(nextTypeKey) || 0;
          const projectedNextTypeCount =
            currentNextTypeCount + 1 - (prevTypeKey === nextTypeKey ? 1 : 0);
          const typeLimit = this.getEnemyTypeLimit(nextTypeKey, limits);
          if (typeLimit > 0 && projectedNextTypeCount > typeLimit) {
            skippedByLimit += 1;
            continue;
          }

          if (prevTypeKey && prevTypeKey !== nextTypeKey) {
            projectedEnemyTypeCounts.set(
              prevTypeKey,
              Math.max(0, (projectedEnemyTypeCounts.get(prevTypeKey) || 0) - 1),
            );
          }
          if (nextTypeKey && prevTypeKey !== nextTypeKey) {
            projectedEnemyTypeCounts.set(
              nextTypeKey,
              (projectedEnemyTypeCounts.get(nextTypeKey) || 0) + 1,
            );
          }
          projectedEnemyCount += deltaTotal;
          diffs.push(diff);
        }
      }
    }
    if (diffs.length === 0) return;
    const action = { type: "batch", diffs };
    this.applyAction(action, "redo");
    this.pushHistory(action);
    if (skippedByLimit > 0) {
      this.notify(`Skipped ${skippedByLimit} placement(s): limit reached.`);
    }
  }

  togglePatrolMode() {
    if (!this.scene.isEditorMode || this.scene.currentLayer !== "enemies")
      return;
    if (!this.selectedEnemyTile) {
      this.notify("Select an enemy tile first.");
      return;
    }
    this.patrolMode = !this.patrolMode;
    this.patrolStep = 0;
    this.patrolStartTile = null;
    this.notify(
      this.patrolMode
        ? "Patrol mode ON: click start then end."
        : "Patrol mode OFF.",
    );
  }

  handlePatrolPlacementClick(tileX, tileY) {
    if (!this.selectedEnemyTile) {
      this.patrolMode = false;
      this.patrolStep = 0;
      return;
    }
    const selected = this.getEntityAt(
      "enemies",
      this.selectedEnemyTile.x,
      this.selectedEnemyTile.y,
    );
    if (!selected) {
      this.patrolMode = false;
      this.patrolStep = 0;
      this.selectedEnemyTile = null;
      this.notify("Selected enemy no longer exists.");
      return;
    }
    if (this.patrolStep === 0) {
      this.patrolStartTile = { x: tileX, y: tileY };
      this.patrolStep = 1;
      return;
    }
    const next = cloneEntity(selected);
    next.patrol = {
      start: toSafeInt(this.patrolStartTile?.x, selected.x),
      end: toSafeInt(tileX, selected.x),
    };
    const diff = this.buildSetEntityDiff(
      "enemies",
      this.selectedEnemyTile.x,
      this.selectedEnemyTile.y,
      next,
    );
    if (diff) {
      this.applyDiff(diff, "redo");
      this.pushHistory(diff);
    }
    this.patrolMode = false;
    this.patrolStep = 0;
    this.patrolStartTile = null;
    this.notify("Patrol updated.");
  }

  buildLevelJSON() {
    const level = this.getLevel();
    if (!level) return null;
    const sizeTiles = {
      w: Math.max(1, toSafeInt(level.sizeTiles?.w, 1)),
      h: Math.max(1, toSafeInt(level.sizeTiles?.h, 1)),
    };
    const tiles = Array.from({ length: sizeTiles.h }, (_, y) =>
      Array.from({ length: sizeTiles.w }, (_, x) =>
        toSafeInt(level.tiles?.[y]?.[x], TILE.EMPTY),
      ),
    );
    const objects = sanitizeEntityList(level.objects, sizeTiles, "coin").map(
      (entry) => ({
        type: entry.type,
        x: entry.x,
        y: entry.y,
      }),
    );
    const enemies = sanitizeEntityList(
      level.enemies,
      sizeTiles,
      "iceSlime",
    ).map((entry) => {
      const out = { type: entry.type, x: entry.x, y: entry.y };
      if (entry.patrol) {
        out.patrol = {
          start: toSafeInt(entry.patrol.start, entry.x),
          end: toSafeInt(entry.patrol.end, entry.x),
        };
      }
      return out;
    });
    const hiddenHeartBricks = sanitizeHiddenHeartBricks(
      level.hiddenHeartBricks,
      tiles,
      sizeTiles,
    );
    return {
      id: toSafeInt(level.id, 1),
      name: String(
        level.name ||
          normalizeLevelName(
            level,
            toSafeInt(level.id, 1),
            level.world || "ice",
          ),
      ),
      sizeTiles,
      playerStart: {
        x: clamp(toSafeInt(level.playerStart?.x, 0), 0, sizeTiles.w - 1),
        y: clamp(toSafeInt(level.playerStart?.y, 0), 0, sizeTiles.h - 1),
      },
      tiles,
      hiddenHeartBricks,
      objects,
      enemies,
    };
  }

  buildCanonicalLevelJSON() {
    const level = this.getLevel();
    if (!level) return null;
    const normalized = normalizeLevelData(level, toSafeInt(level.id, 1));
    const sizeTiles = {
      w: Math.max(1, toSafeInt(normalized.sizeTiles?.w, 1)),
      h: Math.max(1, toSafeInt(normalized.sizeTiles?.h, 1)),
    };
    const cloneSpawnList = (source) =>
      (Array.isArray(source) ? source : [])
        .map((entry) => cloneEntity(entry))
        .filter((entry) => Boolean(entry));
    const chunks = (Array.isArray(normalized.chunks) ? normalized.chunks : [])
      .map((chunk) => ({
        x: toSafeInt(chunk?.x, 0),
        y: toSafeInt(chunk?.y, 0),
        w: Math.max(1, toSafeInt(chunk?.w, 1)),
        h: Math.max(1, toSafeInt(chunk?.h, 1)),
        rowsRLE: (Array.isArray(chunk?.rowsRLE) ? chunk.rowsRLE : []).map(
          (row) =>
            (Array.isArray(row) ? row : []).map((pair) => [
              toSafeInt(pair?.[0], TILE.EMPTY),
              Math.max(0, toSafeInt(pair?.[1], 0)),
            ]),
        ),
      }))
      .filter((chunk) => chunk.w > 0 && chunk.h > 0);

    const payload = {
      id: toSafeInt(normalized.id, 1),
      name: String(
        normalized.name ||
          normalizeLevelName(
            normalized,
            toSafeInt(normalized.id, 1),
            normalized.world || "ice",
          ),
      ),
      world: String(normalized.world || "ice"),
      timeLimitSec: Math.max(1, toSafeInt(normalized.timeLimitSec, 420)),
      sizeTiles,
      playerStart: {
        x: clamp(toSafeInt(normalized.playerStart?.x, 0), 0, sizeTiles.w - 1),
        y: clamp(toSafeInt(normalized.playerStart?.y, 0), 0, sizeTiles.h - 1),
      },
      hiddenHeartBricks: sanitizeHiddenHeartBricks(
        normalized.hiddenHeartBricks,
        normalized.tiles,
        sizeTiles,
      ),
      chunks,
      objects: cloneSpawnList(normalized.objects),
      enemies: cloneSpawnList(normalized.enemies),
      coins: (Array.isArray(normalized.coins) ? normalized.coins : []).map(
        (entry) => ({
          x: toSafeInt(entry?.x, 0),
          y: toSafeInt(entry?.y, 0),
        }),
      ),
      spawns: {
        enemies: cloneSpawnList(normalized.spawns?.enemies),
        elites: cloneSpawnList(normalized.spawns?.elites),
      },
    };

    const miniBoss = cloneEntity(normalized.spawns?.miniBoss);
    if (miniBoss) payload.spawns.miniBoss = miniBoss;
    const boss = cloneEntity(normalized.spawns?.boss);
    if (boss) payload.spawns.boss = boss;

    if (normalized.bossArena && typeof normalized.bossArena === "object") {
      const arenaW = Math.max(1, toSafeInt(normalized.bossArena.w, 1));
      const arenaH = Math.max(1, toSafeInt(normalized.bossArena.h, 1));
      payload.bossArena = {
        x: clamp(toSafeInt(normalized.bossArena.x, 0), 0, sizeTiles.w - 1),
        y: clamp(toSafeInt(normalized.bossArena.y, 0), 0, sizeTiles.h - 1),
        w: clamp(arenaW, 1, sizeTiles.w),
        h: clamp(arenaH, 1, sizeTiles.h),
      };
    }
    return payload;
  }

  validateLevelJSON(levelData) {
    if (!validateRequiredKeys(levelData))
      return { ok: false, error: "Missing required keys." };
    if (typeof levelData.id !== "number" || !Number.isFinite(levelData.id)) {
      return { ok: false, error: "Invalid id." };
    }
    if (
      Object.prototype.hasOwnProperty.call(levelData, "name") &&
      typeof levelData.name !== "string"
    ) {
      return { ok: false, error: "Invalid name." };
    }
    if (
      Object.prototype.hasOwnProperty.call(levelData, "world") &&
      typeof levelData.world !== "string"
    ) {
      return { ok: false, error: "Invalid world." };
    }
    if (
      Object.prototype.hasOwnProperty.call(levelData, "timeLimitSec") &&
      (typeof levelData.timeLimitSec !== "number" ||
        !Number.isFinite(levelData.timeLimitSec))
    ) {
      return { ok: false, error: "Invalid timeLimitSec." };
    }
    if (
      !levelData.sizeTiles ||
      typeof levelData.sizeTiles.w !== "number" ||
      typeof levelData.sizeTiles.h !== "number"
    ) {
      return { ok: false, error: "Invalid sizeTiles." };
    }
    if (
      !levelData.playerStart ||
      typeof levelData.playerStart.x !== "number" ||
      typeof levelData.playerStart.y !== "number"
    ) {
      return { ok: false, error: "Invalid playerStart." };
    }
    const w = Math.max(1, toSafeInt(levelData.sizeTiles.w, 1));
    const h = Math.max(1, toSafeInt(levelData.sizeTiles.h, 1));
    const hasTiles = Array.isArray(levelData.tiles);
    const hasChunks = Array.isArray(levelData.chunks);
    if (!hasTiles && !hasChunks) {
      return { ok: false, error: "Expected tiles or chunks." };
    }
    if (hasTiles) {
      if (levelData.tiles.length !== h) {
        return { ok: false, error: "Invalid tile rows." };
      }
      for (const row of levelData.tiles) {
        if (!Array.isArray(row) || row.length !== w)
          return { ok: false, error: "Invalid tile columns." };
        for (const cell of row) {
          if (typeof cell !== "number" || !Number.isFinite(cell)) {
            return { ok: false, error: "Tile values must be numeric." };
          }
        }
      }
    }
    if (hasChunks) {
      for (const chunk of levelData.chunks) {
        if (!chunk || typeof chunk !== "object") {
          return { ok: false, error: "Invalid chunk entry." };
        }
        for (const key of ["x", "y", "w", "h"]) {
          if (
            typeof chunk[key] !== "number" ||
            !Number.isFinite(chunk[key])
          ) {
            return { ok: false, error: `Invalid chunk.${key}.` };
          }
        }
        if (!Array.isArray(chunk.rowsRLE)) {
          return { ok: false, error: "Invalid chunk rowsRLE." };
        }
        for (const row of chunk.rowsRLE) {
          if (!Array.isArray(row)) {
            return { ok: false, error: "Invalid RLE row." };
          }
          for (const pair of row) {
            if (
              !Array.isArray(pair) ||
              pair.length < 2 ||
              typeof pair[0] !== "number" ||
              typeof pair[1] !== "number" ||
              !Number.isFinite(pair[0]) ||
              !Number.isFinite(pair[1])
            ) {
              return { ok: false, error: "Invalid RLE pair." };
            }
          }
        }
      }
    }
    const entityOk = (entry) =>
      entry &&
      typeof entry.type === "string" &&
      typeof entry.x === "number" &&
      typeof entry.y === "number" &&
      Number.isFinite(entry.x) &&
      Number.isFinite(entry.y);
    if (
      Object.prototype.hasOwnProperty.call(levelData, "objects") &&
      !Array.isArray(levelData.objects)
    ) {
      return { ok: false, error: "objects must be an array." };
    }
    if (
      Array.isArray(levelData.objects) &&
      !levelData.objects.every(entityOk)
    ) {
      return { ok: false, error: "Invalid object entry." };
    }
    if (Object.prototype.hasOwnProperty.call(levelData, "coins")) {
      if (!Array.isArray(levelData.coins)) {
        return { ok: false, error: "coins must be an array." };
      }
      const coinOk = (entry) =>
        entry &&
        typeof entry.x === "number" &&
        typeof entry.y === "number" &&
        Number.isFinite(entry.x) &&
        Number.isFinite(entry.y);
      if (!levelData.coins.every(coinOk)) {
        return { ok: false, error: "Invalid coin entry." };
      }
    }
    if (Object.prototype.hasOwnProperty.call(levelData, "hiddenHeartBricks")) {
      if (!Array.isArray(levelData.hiddenHeartBricks)) {
        return { ok: false, error: "hiddenHeartBricks must be an array." };
      }
      const hiddenHeartOk = (entry) =>
        entry &&
        typeof entry.x === "number" &&
        typeof entry.y === "number" &&
        Number.isFinite(entry.x) &&
        Number.isFinite(entry.y);
      if (!levelData.hiddenHeartBricks.every(hiddenHeartOk)) {
        return { ok: false, error: "Invalid hiddenHeartBricks entry." };
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(levelData, "enemies") &&
      !Array.isArray(levelData.enemies)
    ) {
      return { ok: false, error: "enemies must be an array." };
    }
    const enemyOk = (entry) => {
      if (!entityOk(entry)) return false;
      if (!entry.patrol) return true;
      return (
        typeof entry.patrol === "object" &&
        typeof entry.patrol.start === "number" &&
        typeof entry.patrol.end === "number" &&
        Number.isFinite(entry.patrol.start) &&
        Number.isFinite(entry.patrol.end)
      );
    };
    if (
      Array.isArray(levelData.enemies) &&
      !levelData.enemies.every(enemyOk)
    ) {
      return { ok: false, error: "Invalid enemy entry." };
    }
    if (Object.prototype.hasOwnProperty.call(levelData, "spawns")) {
      if (!levelData.spawns || typeof levelData.spawns !== "object") {
        return { ok: false, error: "Invalid spawns block." };
      }
      const spawns = levelData.spawns;
      if (
        Object.prototype.hasOwnProperty.call(spawns, "enemies") &&
        !Array.isArray(spawns.enemies)
      ) {
        return { ok: false, error: "spawns.enemies must be an array." };
      }
      if (Array.isArray(spawns.enemies) && !spawns.enemies.every(enemyOk)) {
        return { ok: false, error: "Invalid spawns.enemies entry." };
      }
      if (
        Object.prototype.hasOwnProperty.call(spawns, "elites") &&
        !Array.isArray(spawns.elites)
      ) {
        return { ok: false, error: "spawns.elites must be an array." };
      }
      if (Array.isArray(spawns.elites) && !spawns.elites.every(enemyOk)) {
        return { ok: false, error: "Invalid spawns.elites entry." };
      }
      if (spawns.miniBoss && !enemyOk(spawns.miniBoss)) {
        return { ok: false, error: "Invalid spawns.miniBoss entry." };
      }
      if (spawns.boss && !enemyOk(spawns.boss)) {
        return { ok: false, error: "Invalid spawns.boss entry." };
      }
    }
    if (Object.prototype.hasOwnProperty.call(levelData, "bossArena")) {
      const arena = levelData.bossArena;
      if (
        !arena ||
        typeof arena !== "object" ||
        typeof arena.x !== "number" ||
        typeof arena.y !== "number" ||
        typeof arena.w !== "number" ||
        typeof arena.h !== "number" ||
        !Number.isFinite(arena.x) ||
        !Number.isFinite(arena.y) ||
        !Number.isFinite(arena.w) ||
        !Number.isFinite(arena.h)
      ) {
        return { ok: false, error: "Invalid bossArena." };
      }
    }
    return { ok: true, error: "" };
  }

  synchronizeDerivedLevelFields() {
    const level = this.getLevel();
    if (!level) return;
    const built = this.buildLevelJSON();
    if (!built) return;
    level.id = built.id;
    level.name = built.name;
    level.sizeTiles = built.sizeTiles;
    level.playerStart = built.playerStart;
    level.hiddenHeartBricks = built.hiddenHeartBricks.map((entry) => ({
      x: entry.x,
      y: entry.y,
    }));
    level.tiles = built.tiles;
    level.objects = built.objects.map((entry) => ({ ...entry }));
    level.enemies = built.enemies.map((entry) => ({ ...entry }));
    level.chunks = tilesToChunks(level.tiles, level.sizeTiles);
    level.coins = built.objects
      .filter((entry) => entry.type === "coin")
      .map((entry) => ({ x: entry.x, y: entry.y }));
    if (!level.spawns || typeof level.spawns !== "object") level.spawns = {};
    level.spawns.enemies = built.enemies.map((entry) => ({ ...entry }));
    if (!Array.isArray(level.spawns.elites)) level.spawns.elites = [];
  }

  saveLevel({ silent = false } = {}) {
    try {
      this.synchronizeDerivedLevelFields();
      const payload = this.buildLevelJSON();
      if (!payload) return;
      const key = `axo_level_${payload.id}`;
      const serialized = JSON.stringify(payload);
      let savedToSessionStorage = false;
      try {
        sessionStorage.setItem(key, serialized);
        savedToSessionStorage = true;
      } catch {}
      EDITOR_SESSION_SAVES.set(key, serialized);
      if (!silent) {
        this.notify(
          savedToSessionStorage
            ? `Saved ${key} (session)`
            : `Saved ${key} (in-memory only)`,
        );
      }
    } catch {
      if (!silent) this.notify("Save failed.");
    }
  }

  loadLevel() {
    try {
      const saved = this.readSavedLevelPayload();
      if (!saved.ok) {
        if (saved.error === "No save found.") {
          this.notify(`No save found (${saved.key}).`);
        } else {
          this.notify(`Load failed: ${saved.error}`);
        }
        return;
      }
      this.applyImportedLevel(saved.payload);
      this.notify(`Loaded ${saved.key}`);
    } catch {
      this.notify("Load failed.");
    }
  }

  exportLevelJSON() {
    try {
      this.synchronizeDerivedLevelFields();
      const payload = this.buildCanonicalLevelJSON();
      if (!payload) return;
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `level${String(payload.id).padStart(2, "0")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      this.notify("Exported level JSON.");
    } catch {
      this.notify("Export failed.");
    }
  }

  ensureImportInput() {
    if (this.importInput) return this.importInput;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || "{}"));
          const validation = this.validateLevelJSON(parsed);
          if (!validation.ok) {
            this.notify(`Import failed: ${validation.error}`);
            return;
          }
          this.applyImportedLevel(parsed);
          this.notify("Import successful.");
        } catch {
          this.notify("Import failed: invalid JSON.");
        } finally {
          input.value = "";
        }
      };
      reader.onerror = () => {
        this.notify("Import failed: read error.");
        input.value = "";
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    this.importInput = input;
    return input;
  }

  importLevelJSON() {
    try {
      this.ensureImportInput().click();
    } catch {
      this.notify("Import unavailable.");
    }
  }

  applyImportedLevel(rawLevel) {
    const current = this.scene.levelData || {};
    const id = toSafeInt(rawLevel?.id, toSafeInt(current.id, 1));
    const normalized = normalizeLevelData(rawLevel, id);
    normalized.world = String(
      current.world || normalized.world || LEVEL_ASSETS[id]?.world || "ice",
    );
    normalized.timeLimitSec = toSafeInt(
      current.timeLimitSec,
      normalized.timeLimitSec || 420,
    );
    if (current.spawns?.boss && !normalized.spawns?.boss) {
      normalized.spawns.boss = cloneEntity(current.spawns.boss);
    }
    if (current.bossArena && !normalized.bossArena) {
      normalized.bossArena = { ...current.bossArena };
    }

    this.scene.levelData = normalized;
    this.scene.map = TileMap.fromLevelData(
      this.scene.levelData,
      CONST.GAME.TILE,
    );
    this.scene.camera.setWorldBounds(
      0,
      0,
      this.scene.levelData.sizeTiles.w * CONST.GAME.TILE,
      this.scene.levelData.sizeTiles.h * CONST.GAME.TILE,
    );
    this.scene.captureInitialSpawns();
    this.scene.resetRunState();
    this.scene.history = [];
    this.scene.redoStack = [];
    this.patrolMode = false;
    this.patrolStep = 0;
    this.patrolStartTile = null;
    this.selectedEnemyTile = null;
    this.lastWorldForPalette = "";
    this.paletteDirty = true;
    this.ensurePalettesLoaded();
    this.editorCamera.x = this.scene.camera.x;
    this.editorCamera.y = this.scene.camera.y;
    this.editorCamera.zoom = 1;
    this.syncEditorCameraView();
  }
}
