// Offline build: no server, so system endpoints are inert stubs.
export async function authorizeEditor() {
  return { ok: false };
}

export async function getHealth() {
  return { ok: true, mode: "offline" };
}

export async function getRuntimeConfigScript() {
  return "";
}
