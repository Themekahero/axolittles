import {
  claimPermanentCore,
  loadProfile,
  mergeIntoProfile,
} from "./localSave.js";

// Offline build: progress reads/writes go to localStorage, not a server.
export async function getProfile() {
  return { profile: loadProfile() };
}

export async function putProgress(progress) {
  mergeIntoProfile(progress);
  // No profile in the response: returning one would make the caller re-apply
  // input settings mid-gameplay (clearing held keys) after every autosave.
  return { ok: true };
}

export async function patchProgress(progress) {
  mergeIntoProfile(progress);
  return { ok: true };
}

export async function getGameConfig() {
  // No remote config: the game uses its built-in level/hero settings.
  return { heroes: [], levels: [] };
}

export async function selectHero() {
  return { profile: loadProfile() };
}

export async function getRunHistory() {
  return { runs: [] };
}

export async function claimCore(coreElement) {
  return claimPermanentCore(coreElement);
}

export async function upgradeHealth() {
  return { profile: loadProfile() };
}
