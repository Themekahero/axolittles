import { TILE } from "../config/tileIds.js";
import { WORLD_VISUALS } from "../config/worldVisuals.js";

const TILE_COLORS = {
  [TILE.EMPTY]: "rgba(0,0,0,0)",
  [TILE.SOLID]: "#4a6077",
  [TILE.ONE_WAY]: "#6b8fb3",
  [TILE.SPIKES]: "#6d7d89",
  [TILE.BARBED_WIRE]: "#6d7d89",
  [TILE.ICE]: "#8ad7ff",
  [TILE.WATER]: "#2d76d8",
  [TILE.POISON]: "#6b2e7f",
  [TILE.BRICK]: "#b5743b",
  [TILE.GIFT_BOX]: "#b5743b",
};

const SURFACE_DECOR_TILES = new Set([TILE.SOLID, TILE.ICE]);

function isOpenTile(tile) {
  return (
    tile === TILE.EMPTY ||
    tile === TILE.ONE_WAY ||
    tile === TILE.WATER ||
    tile === TILE.POISON
  );
}

function isTopSurfaceOpenTile(tile) {
  // Water above ground should not create a snowy top-cap tile.
  return tile === TILE.EMPTY || tile === TILE.ONE_WAY || tile === TILE.POISON;
}

function hasUsableImage(img) {
  return Boolean(img && img.width > 2 && img.height > 2);
}

// Many world tiles have semi-transparent border pixels. Draw with a tiny
// overdraw so adjacent tiles overlap and no seam/gap is visible.
const TILE_OVERDRAW_PX = 1;
// Beach water/sand boundary often shows a white line; use extra overdraw for beach.
const BEACH_OVERDRAW_PX = 3;
const ICE_SPIKE_HEIGHT_SCALE = 0.88;
const BEACH_SPIKE_HEIGHT_SCALE = 0.9;
const ICE_BARBED_WIRE_HEIGHT_SCALE = 0.8;
const BEACH_BARBED_WIRE_HEIGHT_SCALE = 0.78;

function getFallbackTileColor(tile, world) {
  if ((tile === TILE.SPIKES || tile === TILE.BARBED_WIRE) && world === "ice")
    return "#5f93b4";
  return TILE_COLORS[tile] || "#666";
}

function drawSpikeFallback(ctx, x, y, tileSize, world) {
  const isIceWorld = world === "ice";
  const baseColor = isIceWorld ? "#5f93b4" : "#8d2f2f";
  const tipColor = isIceWorld ? "#d9f4ff" : "#d76f6f";
  const baseHeight = 18;
  const spikeCount = 4;
  const spikeWidth = tileSize / spikeCount;

  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y + baseHeight, tileSize, Math.max(1, tileSize - baseHeight));

  ctx.fillStyle = tipColor;
  for (let i = 0; i < spikeCount; i += 1) {
    const px = x + i * spikeWidth;
    ctx.beginPath();
    ctx.moveTo(px, y + baseHeight);
    ctx.lineTo(px + spikeWidth * 0.5, y);
    ctx.lineTo(px + spikeWidth, y + baseHeight);
    ctx.closePath();
    ctx.fill();
  }
}

function coordHash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export class TileMap {
  constructor(width, height, tileSize, chunks) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.chunks = chunks;
    this.grid = new Uint8Array(width * height);
    this.brickRewardsUsed = new Set();
    // Resolved texture paths are a pure function of the grid (variants only
    // look at distance-1 neighbors), so cache them per tile and invalidate
    // around edits instead of re-resolving every visible tile every frame.
    this.texturePathCache = new Array(width * height);
    this.texturePathCacheVisual = null;
    this.texturePathCacheNoVariants = false;
  }

  static fromLevelData(levelData, tileSize) {
    const map = new TileMap(
      levelData.sizeTiles.w,
      levelData.sizeTiles.h,
      tileSize,
      levelData.chunks || [],
    );
    map.expandChunksToGrid();
    return map;
  }

  expandChunksToGrid() {
    this.grid.fill(0);
    for (const chunk of this.chunks) {
      for (let row = 0; row < chunk.h; row += 1) {
        const rle = chunk.rowsRLE[row] || [];
        let colOffset = 0;
        for (const pair of rle) {
          const tileId = pair[0];
          const count = pair[1];
          for (let i = 0; i < count; i += 1) {
            const tx = chunk.x + colOffset + i;
            const ty = chunk.y + row;
            this.setTile(tx, ty, tileId);
          }
          colOffset += count;
        }
      }
    }
  }

  inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  index(tx, ty) {
    return ty * this.width + tx;
  }

  getTile(tx, ty) {
    if (!this.inBounds(tx, ty)) return TILE.SOLID;
    return this.grid[this.index(tx, ty)];
  }

  setTile(tx, ty, tileId) {
    if (!this.inBounds(tx, ty)) return;
    this.grid[this.index(tx, ty)] = tileId;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (this.inBounds(tx + dx, ty + dy)) {
          this.texturePathCache[this.index(tx + dx, ty + dy)] = undefined;
        }
      }
    }
  }

  getTileAtPixel(px, py) {
    const tx = Math.floor(px / this.tileSize);
    const ty = Math.floor(py / this.tileSize);
    return this.getTile(tx, ty);
  }

  tileToWorld(tx, ty) {
    return { x: tx * this.tileSize, y: ty * this.tileSize };
  }

  useRewardTile(tx, ty) {
    const key = `${tx},${ty}`;
    if (this.brickRewardsUsed.has(key)) return false;
    this.brickRewardsUsed.add(key);
    return true;
  }

  useBrick(tx, ty) {
    return this.useRewardTile(tx, ty);
  }

  draw(ctx, camera, style = {}) {
    const t = this.tileSize;
    const cameraX = Math.round(camera.x);
    const cameraY = Math.round(camera.y);
    const pad = 2;
    const startX = Math.max(0, Math.floor(cameraX / t) - pad);
    const endX = Math.min(
      this.width,
      Math.ceil((cameraX + camera.viewWidth) / t) + pad,
    );
    const startY = Math.max(0, Math.floor(cameraY / t) - pad);
    const endY = Math.min(
      this.height,
      Math.ceil((cameraY + camera.viewHeight) / t) + pad,
    );
    const worldVisual = WORLD_VISUALS[style.world] || null;
    const getImage =
      typeof style.getImage === "function" ? style.getImage : null;
    const canUseWorldVisuals = Boolean(worldVisual && getImage);
    const wavePath = worldVisual?.variants?.waterTop || null;
    const waveTime = performance.now() * 0.003;
    const overdraw = style?.world === "beach" ? BEACH_OVERDRAW_PX : TILE_OVERDRAW_PX;

    for (let ty = startY; ty < endY; ty += 1) {
      for (let tx = startX; tx < endX; tx += 1) {
        const tile = this.getTile(tx, ty);
        if (tile === TILE.EMPTY) continue;
        const x = tx * t - cameraX;
        const y = ty * t - cameraY;
        let drawn = false;

        if (canUseWorldVisuals) {
          const texturePath = this.getCachedTexturePath(
            worldVisual,
            tx,
            ty,
            tile,
            style,
          );
          const texture = texturePath ? getImage(texturePath) : null;
          if (hasUsableImage(texture)) {
            if (
              tile === TILE.WATER &&
              wavePath &&
              texturePath === wavePath
            ) {
              const waveBob = 1 + Math.sin(waveTime + tx * 0.65) * 1.6;
              ctx.save();
              ctx.beginPath();
              // Expand horizontal clip so adjacent water tiles can overlap and hide seams.
              ctx.rect(x - overdraw, y, t + overdraw * 2, t);
              ctx.clip();
              ctx.drawImage(
                texture,
                x - overdraw,
                y + waveBob - overdraw,
                t + overdraw * 2,
                t + overdraw * 2,
              );
              ctx.restore();
            } else {
              const drawX = x - overdraw;
              const drawY = y - overdraw;
              const drawW = t + overdraw * 2;
              const drawH = t + overdraw * 2;

              if (tile === TILE.SPIKES || tile === TILE.BARBED_WIRE) {
                const scale =
                  style?.world === "ice"
                    ? tile === TILE.SPIKES
                      ? ICE_SPIKE_HEIGHT_SCALE
                      : ICE_BARBED_WIRE_HEIGHT_SCALE
                    : style?.world === "beach"
                      ? tile === TILE.SPIKES
                        ? BEACH_SPIKE_HEIGHT_SCALE
                        : BEACH_BARBED_WIRE_HEIGHT_SCALE
                      : 1;
                if (scale < 0.999) {
                  const spikeH = Math.max(1, Math.round(drawH * scale));
                  const spikeY = drawY + (drawH - spikeH);
                  ctx.drawImage(texture, drawX, spikeY, drawW, spikeH);
                } else {
                  ctx.drawImage(texture, drawX, drawY, drawW, drawH);
                }
              } else {
                ctx.drawImage(texture, drawX, drawY, drawW, drawH);
              }
            }
            if (!drawn) drawn = true;
          }
        }

        if (!drawn) {
          ctx.fillStyle = getFallbackTileColor(tile, style.world);
          ctx.fillRect(x, y, t, t);

          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, t - 2, t - 2);

          if (tile === TILE.SPIKES || tile === TILE.BARBED_WIRE) {
            drawSpikeFallback(ctx, x, y, t, style.world);
          }
        }

        if (canUseWorldVisuals) {
          this.drawSurfaceDecoration(
            ctx,
            getImage,
            worldVisual,
            tx,
            ty,
            x,
            y,
            t,
          );
        }
      }
    }
  }

  getCachedTexturePath(worldVisual, tx, ty, tile, style = null) {
    const noVariants = Boolean(style?.disableAutoVariants);
    if (
      this.texturePathCacheVisual !== worldVisual ||
      this.texturePathCacheNoVariants !== noVariants
    ) {
      this.texturePathCache.fill(undefined);
      this.texturePathCacheVisual = worldVisual;
      this.texturePathCacheNoVariants = noVariants;
    }
    const idx = this.index(tx, ty);
    let path = this.texturePathCache[idx];
    if (path === undefined) {
      path = this.resolveTexturePath(worldVisual, tx, ty, tile, style) ?? null;
      this.texturePathCache[idx] = path;
    }
    return path;
  }

  resolveTexturePath(worldVisual, tx, ty, tile, style = null) {
    const tileTextures = worldVisual?.tileTextures || {};
    const variants = worldVisual?.variants || {};
    const fallbackPath = tileTextures[tile] || null;
    if (!fallbackPath) return null;
    if (style?.disableAutoVariants) return fallbackPath;

    if (tile === TILE.SOLID) {
      const above = this.getTile(tx, ty - 1);
      const below = this.getTile(tx, ty + 1);
      const left = this.getTile(tx - 1, ty);
      const right = this.getTile(tx + 1, ty);
      const touchesWater =
        above === TILE.WATER ||
        below === TILE.WATER ||
        left === TILE.WATER ||
        right === TILE.WATER;
      const openAbove = isTopSurfaceOpenTile(above);
      const openBelow = isOpenTile(below);
      const openLeft = isOpenTile(left);
      const openRight = isOpenTile(right);

      // Keep pit walls clean: when solid touches water, avoid snowy top/edge variants.
      if (touchesWater) {
        return fallbackPath;
      }

      // Air/floating platforms only when truly in air (nothing above); otherwise bottom of stack uses solidBottom
      if (openBelow && openAbove && variants.solidFloatingMid) {
        if (openLeft && !openRight && variants.solidFloatingLeft)
          return variants.solidFloatingLeft;
        if (openRight && !openLeft && variants.solidFloatingRight)
          return variants.solidFloatingRight;
        return variants.solidFloatingMid;
      }

      if (openAbove) {
        if (openLeft && !openRight && variants.solidTopLeft)
          return variants.solidTopLeft;
        if (openRight && !openLeft && variants.solidTopRight)
          return variants.solidTopRight;
        if (variants.solidTop) return variants.solidTop;
      }

      if (openBelow && variants.solidBottom) return variants.solidBottom;
      if (openLeft && variants.solidLeft) return variants.solidLeft;
      if (openRight && variants.solidRight) return variants.solidRight;
    }

    if (tile === TILE.ONE_WAY) {
      const leftIsOneWay = this.getTile(tx - 1, ty) === TILE.ONE_WAY;
      const rightIsOneWay = this.getTile(tx + 1, ty) === TILE.ONE_WAY;
      if (!leftIsOneWay && rightIsOneWay && variants.oneWayLeft) {
        return variants.oneWayLeft;
      }
      if (!rightIsOneWay && leftIsOneWay && variants.oneWayRight) {
        return variants.oneWayRight;
      }
    }

    if (tile === TILE.WATER) {
      const above = this.getTile(tx, ty - 1);
      if (above !== TILE.WATER && variants.waterTop) {
        return variants.waterTop;
      }
      const below = this.getTile(tx, ty + 1);
      if (below !== TILE.WATER && variants.waterBottom) {
        return variants.waterBottom;
      }
    }

    if (tile === TILE.POISON) {
      const below = this.getTile(tx, ty + 1);
      if (below !== TILE.POISON && variants.poisonBottom) {
        return variants.poisonBottom;
      }
      const above = this.getTile(tx, ty - 1);
      if (above !== TILE.POISON && variants.poisonTop) {
        return variants.poisonTop;
      }
    }

    return fallbackPath;
  }

  drawSurfaceDecoration(ctx, getImage, worldVisual, tx, ty, x, y, tileSize) {
    const tile = this.getTile(tx, ty);
    if (!SURFACE_DECOR_TILES.has(tile)) return;
    if (!isOpenTile(this.getTile(tx, ty - 1))) return;

    const decorations = worldVisual?.decorations || [];
    if (decorations.length === 0) return;

    const hash = coordHash(tx, ty, 911);
    const deco = decorations[hash % decorations.length];
    const chanceDivisor = Math.max(2, Number(deco.chanceDivisor) || 30);
    if (hash % chanceDivisor !== 0) return;

    if (
      (deco.height || 0) > tileSize + 16 &&
      !isOpenTile(this.getTile(tx, ty - 2))
    ) {
      return;
    }

    const img = getImage(deco.path);
    if (!hasUsableImage(img)) return;

    const drawW = Number(deco.width) || tileSize;
    const drawH = Number(deco.height) || tileSize;
    const lift = Number(deco.lift) || 0;
    const drawX = x + (tileSize - drawW) * 0.5;
    const drawY = y - drawH + lift;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}

export function expandRLERow(rowRLE = []) {
  const row = [];
  rowRLE.forEach(([tileId, count]) => {
    for (let i = 0; i < count; i += 1) row.push(tileId);
  });
  return row;
}
