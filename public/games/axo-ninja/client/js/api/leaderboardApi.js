// Offline build: there is no online leaderboard. The menu shows local
// best-run records instead (built in main.js from the local save).
export async function getLevelLeaderboard() {
  return { levels: [] };
}

export async function getAxoLeaderboard() {
  return { top: [] };
}

export async function getHeroAxoLeaderboard() {
  return { top: [] };
}

export async function submitLeaderboardScore() {
  return { ok: true };
}
