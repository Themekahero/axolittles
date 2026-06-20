#!/usr/bin/env node
// Generates same-origin audio clips for the core spoken lines, so a device with
// NO usable browser TTS voice (common in iOS in-app browsers / some Android
// WebViews) still hears the lessons. Clips are a FALLBACK — when TTS voices are
// available the app keeps using them (so the 4 character voices still work).
//
// macOS only (uses `say` + `afconvert`). Output: ./audio-clips/*.m4a + manifest.json
// keyed by the EXACT string the app passes to AxoAudio.speak(). Imports the real
// lesson data so the keys can never drift from what the app says.
//
//   node _build/gen-audio.mjs            # writes ./audio-clips/
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import AxoData from "../src/learn/data.js";

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "audio-clips");
const VOICE = process.env.SAY_VOICE || "Samantha";
const RATE = process.env.SAY_RATE || "172";

// djb2 → short hex, for safe stable filenames keyed by the spoken text.
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// Collect the EXACT strings the app speaks (static, enumerable subset).
function collectLines() {
  const set = new Set();
  // Every lesson's spoken line — the core "voice IS the lesson" content.
  for (const w of AxoData.worlds) for (const l of w.lessons) if (l.voice) set.add(l.voice);
  // Counting digits spoken during number lessons.
  for (let n = 1; n <= 9; n++) set.add(String(n));
  // Core feedback + celebration (must match the literals in the components).
  [
    "Yes! Great job!",
    "Good try!",
    "Good try! Just two now.",
    "Here it is! Tap the glowing one.",
    "Here it is! Tap the one with more.",
    "You did it! Hooray!",
    "Let's learn!",
    "Let's play!",
    "Ninja time!",
    "Sing along!",
    "Your trophies!",
    "The shop!",
  ].forEach((s) => set.add(s));
  for (const w of AxoData.worlds) set.add(`Amazing! You finished ${w.title}! Hip hip hooray!`);
  return [...set];
}

(async () => {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const lines = collectLines();
  const manifest = {};
  let i = 0;
  for (const text of lines) {
    const name = hash(text) + ".m4a";
    const aiff = path.join(OUT, "_t.aiff");
    const m4a = path.join(OUT, name);
    await run("say", ["-v", VOICE, "-r", RATE, "-o", aiff, text]);
    await run("afconvert", [aiff, m4a, "-d", "aac", "-f", "m4af"]);
    manifest[text] = name;
    if (++i % 25 === 0) console.log(`  ${i}/${lines.length}…`);
  }
  await rm(path.join(OUT, "_t.aiff"), { force: true });
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify({ voice: VOICE, count: lines.length, clips: manifest }));
  console.log(`Generated ${lines.length} clips + manifest.json -> ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
