function getNavigatorRef() {
  return typeof navigator !== "undefined" ? navigator : null;
}

export function isIOSDevice() {
  const nav = getNavigatorRef();
  if (!nav) return false;
  const ua = String(nav.userAgent || "");
  const platform = String(nav.platform || "");
  const touchPoints = Number(nav.maxTouchPoints || 0);
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && touchPoints > 1)
  );
}

export function getDprCapForViewportClass(viewportClass) {
  if (isIOSDevice()) {
    return 1;
  }
  if (viewportClass === "mobile") return 2;
  if (viewportClass === "tablet") return 2.5;
  return 3;
}

export function shouldUseReducedEffects() {
  return isIOSDevice();
}
