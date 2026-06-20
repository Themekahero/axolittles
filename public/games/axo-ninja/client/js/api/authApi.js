import { loadProfile, saveProfile } from "./localSave.js";

// Offline build: "login" just opens the local save slot in this browser.
export async function guestLogin() {
  const profile = saveProfile(loadProfile());
  return { token: "local-save", profile };
}
