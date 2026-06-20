// Offline build: no telemetry of any kind. These stubs keep the module
// surface identical for any legacy imports; none of them do anything.
export function buildGameplaySignedHeaders() {
  return {};
}

export async function startGameplaySession() {
  return { ok: false };
}

export async function sendGameplayTick() {
  return { ok: false };
}

export async function endGameplaySession() {
  return { ok: false };
}

export async function getSecurityStatus() {
  return { ok: true };
}
