function normalizeFallbackFacing(facing) {
  return Number(facing) >= 0 ? 1 : -1;
}

export function normalizeDirection(dx, dy, fallbackFacing = 1) {
  const safeDx = Number(dx);
  const safeDy = Number(dy);
  if (Number.isFinite(safeDx) && Number.isFinite(safeDy)) {
    const mag = Math.hypot(safeDx, safeDy);
    if (mag > 0.0001) {
      return { x: safeDx / mag, y: safeDy / mag };
    }
  }
  return { x: normalizeFallbackFacing(fallbackFacing), y: 0 };
}

export function directionToTarget(from, to, fallbackFacing = 1) {
  if (!from || !to) {
    return { x: normalizeFallbackFacing(fallbackFacing), y: 0 };
  }
  const dx = Number(to.x) - Number(from.x);
  const dy = Number(to.y) - Number(from.y);
  return normalizeDirection(dx, dy, fallbackFacing);
}

export function resolveFacingWithDeadzone(
  currentFacing,
  dxToTarget,
  deadZonePx,
  isLocked = false,
) {
  const safeFacing = normalizeFallbackFacing(currentFacing);
  if (isLocked) return safeFacing;
  const safeDx = Number(dxToTarget);
  if (!Number.isFinite(safeDx)) return safeFacing;
  if (Math.abs(safeDx) <= Math.max(0, Number(deadZonePx) || 0)) {
    return safeFacing;
  }
  return safeDx >= 0 ? 1 : -1;
}

export function predictTargetPosition(
  from,
  target,
  targetVelocity = { x: 0, y: 0 },
  projectileSpeed = 0,
  leadFactor = 0.45,
  maxLeadFrames = 26,
) {
  const startX = Number(from?.x);
  const startY = Number(from?.y);
  const targetX = Number(target?.x);
  const targetY = Number(target?.y);
  if (
    !Number.isFinite(startX) ||
    !Number.isFinite(startY) ||
    !Number.isFinite(targetX) ||
    !Number.isFinite(targetY)
  ) {
    return {
      x: Number.isFinite(targetX) ? targetX : 0,
      y: Number.isFinite(targetY) ? targetY : 0,
    };
  }

  const speed = Math.max(0.001, Math.abs(Number(projectileSpeed) || 0));
  const dist = Math.hypot(targetX - startX, targetY - startY);
  const leadScale = Math.max(0, Number(leadFactor) || 0);
  const leadFrames = Math.min(
    Math.max(0, Number(maxLeadFrames) || 0),
    (dist / speed) * leadScale,
  );
  const vx = Number(targetVelocity?.x) || 0;
  const vy = Number(targetVelocity?.y) || 0;
  return {
    x: targetX + vx * leadFrames,
    y: targetY + vy * leadFrames,
  };
}
