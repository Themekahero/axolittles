import { creditRun } from "./localSave.js";

// Offline build: finishing a run credits coins straight into the local save.
export async function completeRun(payload) {
  return creditRun(payload);
}
