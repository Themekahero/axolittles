import { TILE } from "../config/tileIds.js";
import { rectsOverlap } from "../utils/math.js";

const SOLID_LIKE = new Set([TILE.SOLID, TILE.BRICK, TILE.GIFT_BOX, TILE.ICE]);
const SPIKE_HIT_HEIGHT = 12;

function tileRect(tx, ty, tileSize) {
  return { x: tx * tileSize, y: ty * tileSize, w: tileSize, h: tileSize };
}

export function resolveEntityMovement(entity, map, dt, options = {}) {
  const frameScale = dt * 60;
  const wasOnGround = entity.onGround;
  entity.prevX = entity.x;
  entity.prevY = entity.y;
  entity.onGround = false;

  entity.x += entity.vx * frameScale;
  resolveHorizontal(entity, map, wasOnGround);

  entity.y += entity.vy * frameScale;
  resolveVertical(
    entity,
    map,
    options.onBrickHeadHit,
    options.blockOneWayFromBelow === true,
  );

  if (options.arenaLock) {
    const left = options.arenaLock.x;
    const right = options.arenaLock.x + options.arenaLock.w;
    if (entity.x < left) {
      entity.x = left;
      entity.vx = 0;
    }
    if (entity.x + entity.w > right) {
      entity.x = right - entity.w;
      entity.vx = 0;
    }
  }

  const touchingTiles = collectTouchingTiles(entity, map);
  return {
    touchingTiles,
    inWater: touchingTiles.has(TILE.WATER),
    inPoison: touchingTiles.has(TILE.POISON),
    touchingSpikes: hasSpikeContact(entity, map),
    onIce: isStandingOnTile(entity, map, TILE.ICE)
  };
}

function resolveHorizontal(entity, map, wasOnGround = false) {
  const tileSize = map.tileSize;
  const minTx = Math.floor(entity.x / tileSize);
  const maxTx = Math.floor((entity.x + entity.w - 1) / tileSize);
  const minTy = Math.floor(entity.y / tileSize);
  const maxTy = Math.floor((entity.y + entity.h - 1) / tileSize);

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const tile = map.getTile(tx, ty);
      if (!SOLID_LIKE.has(tile)) continue;
      const tr = tileRect(tx, ty, tileSize);
      if (!rectsOverlap(entity, tr)) continue;
      if (tryStepUp(entity, map, tr, wasOnGround)) {
        return;
      }
      if (entity.vx > 0) {
        entity.x = tr.x - entity.w;
        entity.vx = 0;
      } else if (entity.vx < 0) {
        entity.x = tr.x + tr.w;
        entity.vx = 0;
      }
    }
  }
}

function tryStepUp(entity, map, tileRectHit, wasOnGround) {
  const maxStep = Math.max(0, Math.floor(Number(entity.stepHeight) || 0));
  if (maxStep <= 0) return false;
  if (!wasOnGround) return false;
  if (entity.vx === 0) return false;

  const targetX = entity.vx > 0
    ? tileRectHit.x - entity.w
    : tileRectHit.x + tileRectHit.w;

  for (let step = 1; step <= maxStep; step += 1) {
    const testRect = {
      x: targetX,
      y: entity.y - step,
      w: entity.w,
      h: entity.h
    };
    if (!collidesSolidLike(testRect, map)) {
      entity.x = targetX;
      entity.y -= step;
      return true;
    }
  }

  return false;
}

function collidesSolidLike(rect, map) {
  const tileSize = map.tileSize;
  const minTx = Math.floor(rect.x / tileSize);
  const maxTx = Math.floor((rect.x + rect.w - 1) / tileSize);
  const minTy = Math.floor(rect.y / tileSize);
  const maxTy = Math.floor((rect.y + rect.h - 1) / tileSize);

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const tile = map.getTile(tx, ty);
      if (!SOLID_LIKE.has(tile)) continue;
      const tr = tileRect(tx, ty, tileSize);
      if (rectsOverlap(rect, tr)) {
        return true;
      }
    }
  }

  return false;
}

function resolveVertical(entity, map, onBrickHeadHit, blockOneWayFromBelow = false) {
  const tileSize = map.tileSize;
  const minTx = Math.floor(entity.x / tileSize);
  const maxTx = Math.floor((entity.x + entity.w - 1) / tileSize);
  const minTy = Math.floor(entity.y / tileSize);
  const maxTy = Math.floor((entity.y + entity.h) / tileSize);

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const tile = map.getTile(tx, ty);
      const tr = tileRect(tx, ty, tileSize);
      const isSolidLike = SOLID_LIKE.has(tile);
      const isOneWay = tile === TILE.ONE_WAY;

      if (isOneWay) {
        resolveOneWayVertical(entity, tr, blockOneWayFromBelow);
        continue;
      }

      if (!isSolidLike || !rectsOverlap(entity, tr)) continue;

      if (entity.vy > 0) {
        entity.y = tr.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else if (entity.vy < 0) {
        entity.y = tr.y + tr.h;
        entity.vy = 0;
        const isBreakableHeadTile =
          tile === TILE.BRICK || tile === TILE.GIFT_BOX || tile === TILE.ICE;
        if (isBreakableHeadTile && typeof onBrickHeadHit === "function") {
          onBrickHeadHit(tx, ty, tile);
        }
      }
    }
  }
}

function resolveOneWayVertical(entity, tile, blockOneWayFromBelow = false) {
  const overlapX = entity.x + entity.w - 2 > tile.x && entity.x + 2 < tile.x + tile.w;
  if (!overlapX) return;

  if (entity.vy < 0) {
    if (!blockOneWayFromBelow) return;
    const prevTop = entity.prevY;
    const currTop = entity.y;
    const tileBottom = tile.y + tile.h;
    const crossedBottom = prevTop >= tileBottom - 5 && currTop <= tileBottom + 1;
    if (!crossedBottom) return;
    entity.y = tileBottom;
    entity.vy = 0;
    return;
  }

  const prevBottom = entity.prevY + entity.h;
  const currBottom = entity.y + entity.h;
  const tileTop = tile.y;

  const crossedTop = prevBottom <= tileTop + 5 && currBottom >= tileTop - 1;
  const standingSnap = prevBottom <= tileTop + 2 && currBottom <= tileTop + 6;
  if (!crossedTop && !standingSnap) return;

  entity.y = tileTop - entity.h;
  entity.vy = 0;
  entity.onGround = true;
}

function collectTouchingTiles(entity, map) {
  const tileSize = map.tileSize;
  const minTx = Math.floor(entity.x / tileSize);
  const maxTx = Math.floor((entity.x + entity.w - 1) / tileSize);
  const minTy = Math.floor(entity.y / tileSize);
  const maxTy = Math.floor((entity.y + entity.h - 1) / tileSize);
  const touched = new Set();

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const tile = map.getTile(tx, ty);
      if (tile === TILE.EMPTY) continue;
      const tr = tileRect(tx, ty, tileSize);
      if (rectsOverlap(entity, tr)) touched.add(tile);
    }
  }

  return touched;
}

function isStandingOnTile(entity, map, tileId) {
  const footY = entity.y + entity.h + 1;
  const leftX = entity.x + 2;
  const rightX = entity.x + entity.w - 2;
  return (
    map.getTileAtPixel(leftX, footY) === tileId ||
    map.getTileAtPixel(rightX, footY) === tileId
  );
}

function hasSpikeContact(entity, map) {
  const tileSize = map.tileSize;
  const prevX = Number.isFinite(entity.prevX) ? entity.prevX : entity.x;
  const prevY = Number.isFinite(entity.prevY) ? entity.prevY : entity.y;

  // Sweep previous->current bounds so fast falls cannot skip thin spike hitboxes.
  const sweepMinX = Math.min(prevX, entity.x);
  const sweepMaxX = Math.max(prevX + entity.w, entity.x + entity.w);
  const sweepMinY = Math.min(prevY, entity.y);
  const sweepMaxY = Math.max(prevY + entity.h, entity.y + entity.h);

  const minTx = Math.floor(sweepMinX / tileSize);
  const maxTx = Math.floor((sweepMaxX - 1) / tileSize);
  const minTy = Math.floor(sweepMinY / tileSize);
  const maxTy = Math.floor((sweepMaxY - 1) / tileSize);
  const sweptRect = {
    x: sweepMinX,
    y: sweepMinY,
    w: Math.max(1, sweepMaxX - sweepMinX),
    h: Math.max(1, sweepMaxY - sweepMinY),
  };

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      const t = map.getTile(tx, ty);
      if (t !== TILE.SPIKES && t !== TILE.BARBED_WIRE) continue;
      const tr = tileRect(tx, ty, tileSize);
      const spikeHitbox = {
        x: tr.x + 4,
        y: tr.y,
        w: tr.w - 8,
        h: SPIKE_HIT_HEIGHT
      };
      if (rectsOverlap(entity, spikeHitbox) || rectsOverlap(sweptRect, spikeHitbox)) {
        return true;
      }
    }
  }

  return false;
}
