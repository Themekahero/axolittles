// Local save engine for the offline build. Replaces the old network API:
// the whole game state lives in this browser's localStorage. No requests
// leave the page.
const SAVE_KEY = "axo_ninja_save_v1";

function defaultProfile() {
  return {
    username: "Player",
    displayName: "Player",
    playerId: "local-player",
    playerName: "Player",
    score: 0,
    bestScore: 0,
    coinBalance: 0,
    coinsTotal: 0,
    coins: 0,
    lifetimeCoinsEarned: 0,
    xp: 0,
    level: 1,
    lives: 5,
    currentQuest: "",
    completedQuests: [],
    unlockedCharacters: [],
    unlockedSkins: [],
    selectedHeroId: null,
    unlockedLevel: 4,
    levelCompletions: [],
    bestRunCoinsByLevel: {},
    bestTimeByLevel: {},
    heroStats: {},
    unlockedElements: [],
    selectedAttunement: "",
    permanentElementCore: null,
    veteranModeEnabled: false,
    healthUpgradePurchases: [],
    upgrades: {},
    inventory: {},
    achievements: {},
    settings: {},
    gameState: null,
    attempt: 0,
  };
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function toSafeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

export function loadProfile() {
  let stored = null;
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(SAVE_KEY)
        : null;
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = null;
  }
  const profile = defaultProfile();
  if (stored && typeof stored === "object") {
    Object.assign(profile, stored);
  }
  return profile;
}

export function saveProfile(profile) {
  if (!profile || typeof profile !== "object") return profile;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Storage full or blocked (e.g. private mode) — keep playing in memory.
  }
  return profile;
}

export function mergeIntoProfile(partial) {
  const profile = loadProfile();
  if (partial && typeof partial === "object") {
    const prevCoins = toSafeInt(profile.coinsTotal, 0);
    const prevCompletions = Array.isArray(profile.levelCompletions)
      ? profile.levelCompletions
      : [];
    const prevBestCoins = { ...(profile.bestRunCoinsByLevel || {}) };
    const prevBestTimes = { ...(profile.bestTimeByLevel || {}) };
    const prevCore = profile.permanentElementCore;
    const prevVeteran = Boolean(profile.veteranModeEnabled);
    const prevElements = Array.isArray(profile.unlockedElements)
      ? profile.unlockedElements
      : [];

    for (const [key, value] of Object.entries(partial)) {
      if (value === undefined) continue;
      profile[key] = clone(value);
    }

    // Achievements only ever grow; guard against stale snapshots
    // (e.g. an autosave queued before a run finished, or another tab).
    const nextCoins = Math.max(prevCoins, toSafeInt(profile.coinsTotal, 0));
    profile.coinsTotal = nextCoins;
    profile.coinBalance = nextCoins;
    profile.coins = nextCoins;
    profile.lifetimeCoinsEarned = Math.max(
      nextCoins,
      toSafeInt(profile.lifetimeCoinsEarned, 0),
    );

    profile.levelCompletions = [
      ...new Set(
        [...prevCompletions, ...(Array.isArray(profile.levelCompletions)
          ? profile.levelCompletions
          : []
        )].map((value) => Math.max(1, toSafeInt(value, 1))),
      ),
    ];

    const nextBestCoins = { ...(profile.bestRunCoinsByLevel || {}) };
    for (const [levelId, coins] of Object.entries(prevBestCoins)) {
      nextBestCoins[levelId] = Math.max(
        toSafeInt(coins, 0),
        toSafeInt(nextBestCoins[levelId], 0),
      );
    }
    profile.bestRunCoinsByLevel = nextBestCoins;

    const nextBestTimes = { ...(profile.bestTimeByLevel || {}) };
    for (const [levelId, time] of Object.entries(prevBestTimes)) {
      const prev = toSafeInt(time, 0);
      const next = toSafeInt(nextBestTimes[levelId], 0);
      if (prev > 0 && (next <= 0 || prev < next)) {
        nextBestTimes[levelId] = prev;
      }
    }
    profile.bestTimeByLevel = nextBestTimes;

    if (!profile.permanentElementCore && prevCore) {
      profile.permanentElementCore = prevCore;
    }
    profile.veteranModeEnabled =
      Boolean(profile.veteranModeEnabled) || prevVeteran;
    profile.unlockedElements = [
      ...new Set([
        ...prevElements,
        ...(Array.isArray(profile.unlockedElements)
          ? profile.unlockedElements
          : []),
      ]),
    ];
  }
  return saveProfile(profile);
}

export function creditRun(payload) {
  const profile = loadProfile();
  const source = payload && typeof payload === "object" ? payload : {};
  const bossKilled =
    source.bossKilled === true || source.bossDefeated === true;
  const result =
    String(source.result || (bossKilled ? "win" : "quit")).toLowerCase() ||
    "quit";
  const runCoins = Math.max(0, toSafeInt(source.runCoins, 0));
  const levelId = Math.max(1, toSafeInt(source.levelId, 1));
  const timeSec = Math.max(
    0,
    toSafeInt(source.timeSec ?? source.time ?? source.runTimeSec, 0),
  );

  const total = Math.max(0, toSafeInt(profile.coinsTotal, 0)) + runCoins;
  profile.coinsTotal = total;
  profile.coinBalance = total;
  profile.coins = total;
  profile.lifetimeCoinsEarned =
    Math.max(total, toSafeInt(profile.lifetimeCoinsEarned, 0));
  profile.score = runCoins;
  profile.bestScore = Math.max(toSafeInt(profile.bestScore, 0), runCoins);
  profile.attempt = Math.max(0, toSafeInt(profile.attempt, 0)) + 1;

  if (result === "win") {
    const completions = new Set(
      (Array.isArray(profile.levelCompletions)
        ? profile.levelCompletions
        : []
      ).map((value) => Math.max(1, toSafeInt(value, 1))),
    );
    completions.add(levelId);
    profile.levelCompletions = [...completions];

    const bestCoins =
      profile.bestRunCoinsByLevel && typeof profile.bestRunCoinsByLevel === "object"
        ? profile.bestRunCoinsByLevel
        : {};
    bestCoins[levelId] = Math.max(toSafeInt(bestCoins[levelId], 0), runCoins);
    profile.bestRunCoinsByLevel = bestCoins;

    const bestTimes =
      profile.bestTimeByLevel && typeof profile.bestTimeByLevel === "object"
        ? profile.bestTimeByLevel
        : {};
    const prevTime = toSafeInt(bestTimes[levelId], 0);
    if (timeSec > 0 && (prevTime <= 0 || timeSec < prevTime)) {
      bestTimes[levelId] = timeSec;
    }
    profile.bestTimeByLevel = bestTimes;
  }

  saveProfile(profile);
  return {
    ok: true,
    result,
    runCoins,
    totalCoinBalance: total,
    profile: clone(profile),
  };
}

export function claimPermanentCore(coreElement) {
  const profile = loadProfile();
  const claimed = String(coreElement || "").trim().toLowerCase();
  const isFirstClaim = !profile.permanentElementCore;
  if (claimed && isFirstClaim) {
    profile.permanentElementCore = claimed;
  }
  profile.veteranModeEnabled = true;
  saveProfile(profile);
  return { claimed: Boolean(claimed && isFirstClaim), profile: clone(profile) };
}
