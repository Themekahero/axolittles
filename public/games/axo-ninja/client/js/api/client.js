// Offline build: there is no API server. This module keeps the same exports
// the rest of the game imports, backed by in-memory state instead of HTTP.
const apiState = {
  token: null,
  baseUrl: "",
};

export function setToken(token) {
  apiState.token = token || null;
}

export function getToken() {
  return apiState.token;
}

export function setApiBase(baseUrl) {
  apiState.baseUrl = String(baseUrl || "");
}

export function getApiBase() {
  return apiState.baseUrl;
}

export function apiPath(path) {
  return String(path || "");
}

export async function request() {
  throw new Error("This build runs fully offline - no API requests.");
}
