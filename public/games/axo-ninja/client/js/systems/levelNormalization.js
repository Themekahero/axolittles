// Level data normalization shared by gameplay and the level editor.
// Kept separate from levelEditorRuntime.js so normal gameplay does not pull
// in the editor bundle (the runtime is lazy-loaded only in editor mode).
import { TILE } from "../config/tileIds.js";
import { LEVEL_ASSETS, getLevelDisplayName } from "../config/levelAssets.js";
import { clamp } from "../utils/math.js";

export function toSafeInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.floor(num);
}

export function cloneEntity(entry) {
  if (!entry || typeof entry !== "object") return null;
  const out = {
    type: String(entry.type || ""),
    x: toSafeInt(entry.x, 0),
    y: toSafeInt(entry.y, 0),
  };
  if (entry.patrol && typeof entry.patrol === "object") {
    const start = Number(entry.patrol.start);
    const end = Number(entry.patrol.end);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      out.patrol = {
        start: toSafeInt(start, out.x),
        end: toSafeInt(end, out.x),
      };
    }
  }
  return out;
}

function encodeRowRle(row) {
  const out = [];
  if (!Array.isArray(row) || row.length === 0) return out;
  let current = toSafeInt(row[0], TILE.EMPTY);
  let count = 1;
  for (let i = 1; i < row.length; i += 1) {
    const next = toSafeInt(row[i], TILE.EMPTY);
    if (next === current) {
      count += 1;
      continue;
    }
    out.push([current, count]);
    current = next;
    count = 1;
  }
  out.push([current, count]);
  return out;
}

export function tilesToChunks(tiles, sizeTiles) {
  const w = Math.max(1, toSafeInt(sizeTiles?.w, 1));
  const h = Math.max(1, toSafeInt(sizeTiles?.h, 1));
  const rows = Array.from({ length: h }, (_, y) => {
    const src = Array.isArray(tiles?.[y]) ? tiles[y] : [];
    const row = Array.from({ length: w }, (_, x) =>
      toSafeInt(src[x], TILE.EMPTY),
    );
    return encodeRowRle(row);
  });
  return [{ x: 0, y: 0, w, h, rowsRLE: rows }];
}

function expandChunkToTiles(levelData, sizeTiles) {
  const w = Math.max(1, toSafeInt(sizeTiles?.w, 1));
  const h = Math.max(1, toSafeInt(sizeTiles?.h, 1));
  const tiles = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => TILE.EMPTY),
  );
  const chunks = Array.isArray(levelData?.chunks) ? levelData.chunks : [];
  for (const chunk of chunks) {
    const cx = toSafeInt(chunk?.x, 0);
    const cy = toSafeInt(chunk?.y, 0);
    const ch = Math.max(0, toSafeInt(chunk?.h, 0));
    const rowsRLE = Array.isArray(chunk?.rowsRLE) ? chunk.rowsRLE : [];
    for (let row = 0; row < ch; row += 1) {
      const y = cy + row;
      if (y < 0 || y >= h) continue;
      const rle = Array.isArray(rowsRLE[row]) ? rowsRLE[row] : [];
      let xOffset = 0;
      for (const pair of rle) {
        const tileId = toSafeInt(pair?.[0], TILE.EMPTY);
        const count = Math.max(0, toSafeInt(pair?.[1], 0));
        for (let i = 0; i < count; i += 1) {
          const x = cx + xOffset + i;
          if (x < 0 || x >= w) continue;
          tiles[y][x] = tileId;
        }
        xOffset += count;
      }
    }
  }
  return tiles;
}

export function normalizeTiles(rawTiles, sizeTiles, fallbackLevelData) {
  const w = Math.max(1, toSafeInt(sizeTiles?.w, 1));
  const h = Math.max(1, toSafeInt(sizeTiles?.h, 1));
  if (Array.isArray(rawTiles) && rawTiles.length === h) {
    const out = [];
    let valid = true;
    for (let y = 0; y < h; y += 1) {
      const row = rawTiles[y];
      if (!Array.isArray(row) || row.length !== w) {
        valid = false;
        break;
      }
      out.push(row.map((cell) => toSafeInt(cell, TILE.EMPTY)));
    }
    if (valid) return out;
  }
  return expandChunkToTiles(fallbackLevelData, sizeTiles);
}

export function sanitizeEntityList(rawList, sizeTiles, fallbackType = "coin") {
  const w = Math.max(1, toSafeInt(sizeTiles?.w, 1));
  const h = Math.max(1, toSafeInt(sizeTiles?.h, 1));
  const source = Array.isArray(rawList) ? rawList : [];
  const keyed = new Map();
  for (const entry of source) {
    if (!entry || typeof entry !== "object") continue;
    const type = String(entry.type || fallbackType).trim();
    if (!type) continue;
    const x = clamp(toSafeInt(entry.x, 0), 0, w - 1);
    const y = clamp(toSafeInt(entry.y, 0), 0, h - 1);
    const next = { type, x, y };
    if (entry.patrol && typeof entry.patrol === "object") {
      const start = Number(entry.patrol.start);
      const end = Number(entry.patrol.end);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        next.patrol = {
          start: toSafeInt(start, x),
          end: toSafeInt(end, x),
        };
      }
    }
    keyed.set(`${x},${y}`, next);
  }
  return [...keyed.values()];
}

export function normalizeObjectEntries(level, sizeTiles) {
  if (Array.isArray(level?.objects) && level.objects.length > 0) {
    return sanitizeEntityList(level.objects, sizeTiles, "coin");
  }
  const rawCoins = Array.isArray(level?.coins)
    ? level.coins.map((entry) => ({
        type: "coin",
        x: toSafeInt(entry?.x, 0),
        y: toSafeInt(entry?.y, 0),
      }))
    : [];
  return sanitizeEntityList(rawCoins, sizeTiles, "coin");
}

export function normalizeEnemyEntries(level, sizeTiles) {
  if (Array.isArray(level?.enemies) && level.enemies.length > 0) {
    return sanitizeEntityList(level.enemies, sizeTiles, "iceSlime");
  }
  const merged = [
    ...(Array.isArray(level?.spawns?.enemies) ? level.spawns.enemies : []),
    ...(Array.isArray(level?.spawns?.elites) ? level.spawns.elites : []),
  ];
  if (level?.spawns?.miniBoss) merged.push(level.spawns.miniBoss);
  return sanitizeEntityList(merged, sizeTiles, "iceSlime");
}

export function normalizeLevelName(level, levelId, worldName) {
  const raw = String(level?.name || "").trim();
  if (raw) return raw;
  return getLevelDisplayName(
    levelId,
    `${worldName || "world"}_world_${String(levelId).padStart(2, "0")}`,
  );
}

function ensureSizeTiles(level, levelId) {
  const fallbackW = toSafeInt(LEVEL_ASSETS[levelId]?.sizeTiles?.w, 140);
  const fallbackH = toSafeInt(LEVEL_ASSETS[levelId]?.sizeTiles?.h, 15);
  return {
    w: Math.max(1, toSafeInt(level?.sizeTiles?.w, fallbackW)),
    h: Math.max(1, toSafeInt(level?.sizeTiles?.h, fallbackH)),
  };
}

function normalizePlayerStart(level, sizeTiles) {
  return {
    x: clamp(toSafeInt(level?.playerStart?.x, 2), 0, sizeTiles.w - 1),
    y: clamp(
      toSafeInt(level?.playerStart?.y, sizeTiles.h - 4),
      0,
      sizeTiles.h - 1,
    ),
  };
}

export function normalizeLevelData(rawLevel, levelId) {
  const base = rawLevel && typeof rawLevel === "object" ? rawLevel : {};
  const sizeTiles = ensureSizeTiles(base, levelId);
  const world = String(base.world || LEVEL_ASSETS[levelId]?.world || "ice");
  const id = toSafeInt(base.id, levelId);
  const name = normalizeLevelName(base, id, world);
  const playerStart = normalizePlayerStart(base, sizeTiles);
  const tiles = normalizeTiles(base.tiles, sizeTiles, base);
  const objects = normalizeObjectEntries(base, sizeTiles);
  const enemies = normalizeEnemyEntries(base, sizeTiles);
  const hiddenHeartBricks = normalizeHiddenHeartBricks(
    base.hiddenHeartBricks,
    sizeTiles,
  );
  const timeLimitSec = Math.max(1, toSafeInt(base.timeLimitSec, 420));

  const spawns =
    base.spawns && typeof base.spawns === "object" ? { ...base.spawns } : {};
  spawns.enemies = enemies.map((entry) => cloneEntity(entry));
  if (!Array.isArray(spawns.elites)) spawns.elites = [];
  if (spawns.miniBoss && typeof spawns.miniBoss === "object") {
    spawns.miniBoss = cloneEntity(spawns.miniBoss);
  }
  if (spawns.boss && typeof spawns.boss === "object") {
    spawns.boss = cloneEntity(spawns.boss);
  }

  return {
    ...base,
    id,
    name,
    world,
    timeLimitSec,
    sizeTiles,
    playerStart,
    hiddenHeartBricks,
    tiles,
    chunks: tilesToChunks(tiles, sizeTiles),
    objects,
    enemies,
    coins: objects
      .filter((entry) => entry.type === "coin")
      .map((entry) => ({ x: entry.x, y: entry.y })),
    spawns,
  };
}

export function normalizeHiddenHeartBricks(entries, sizeTiles) {
  if (!Array.isArray(entries)) return [];
  const width = Math.max(0, toSafeInt(sizeTiles?.w, 0));
  const height = Math.max(0, toSafeInt(sizeTiles?.h, 0));
  const seen = new Set();
  const out = [];

  for (const entry of entries) {
    const x = toSafeInt(entry?.x, -1);
    const y = toSafeInt(entry?.y, -1);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ x, y });
  }

  return out;
}

export function isHiddenHeartHostTileId(tileId) {
  return (
    tileId === TILE.BRICK || tileId === TILE.GIFT_BOX || tileId === TILE.ICE
  );
}

export function sanitizeHiddenHeartBricks(entries, tiles, sizeTiles) {
  return normalizeHiddenHeartBricks(entries, sizeTiles).filter((entry) =>
    isHiddenHeartHostTileId(
      toSafeInt(tiles?.[entry.y]?.[entry.x], TILE.EMPTY),
    ),
  );
}
