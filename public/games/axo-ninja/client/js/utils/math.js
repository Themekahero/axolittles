export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function sign(value) {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

// Filter an array in place (keeps items where keep() returns true) without
// allocating a replacement array. For per-frame culling of short-lived
// effect/projectile lists.
export function compactInPlace(arr, keep) {
  let write = 0;
  for (let i = 0; i < arr.length; i += 1) {
    const item = arr[i];
    if (keep(item)) {
      arr[write] = item;
      write += 1;
    }
  }
  arr.length = write;
  return arr;
}
