// Crash-safe localStorage. Safari Private Browsing and quota-exceeded both throw
// on setItem; an unguarded write (e.g. every star earned) would otherwise blow
// up the app mid-lesson. These helpers degrade to a no-op / fallback instead.
export function safeGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false; // private mode / quota — progress just isn't persisted
  }
}

export function safeGetJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key, value) {
  return safeSet(key, JSON.stringify(value));
}
