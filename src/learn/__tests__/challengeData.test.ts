import { describe, it, expect } from "vitest";
import AxoData from "../data";
import {
  challenges,
  PROFILES,
  DIFFICULTY_OPTIONS,
  profileTuning,
  findUnlockThreshold,
} from "../challengeData";

interface World {
  id: string;
  lessons: { slug: string }[];
}
const worldMap = (AxoData as unknown as { worldMap: Record<string, World> }).worldMap;
const worldIds = Object.keys(worldMap);

interface Challenge {
  mode: string;
  label: string;
  clues?: Record<string, string>;
}
const ch = challenges as unknown as Record<string, Challenge>;

describe("challenge config — coverage", () => {
  it("every world has a challenge config with a label", () => {
    for (const id of worldIds) {
      expect(ch[id], `no challenge config for world "${id}"`).toBeTruthy();
      expect(ch[id].label, `challenge "${id}" has no label`).toBeTruthy();
    }
  });

  it("every challenge maps to a real world", () => {
    for (const id of Object.keys(ch)) {
      expect(worldIds, `challenge "${id}" has no matching world`).toContain(id);
    }
  });

  // The most valuable regression guard: add a lesson without writing its riddle
  // (or rename a slug and leave a stale clue), and this fails loudly.
  it("every clue-world has exactly one riddle per lesson — no gaps, no orphans", () => {
    for (const [id, cfg] of Object.entries(ch)) {
      if (cfg.mode !== "clue") continue;
      const clueKeys = Object.keys(cfg.clues ?? {}).sort();
      const lessonSlugs = worldMap[id].lessons.map((l) => l.slug).sort();
      expect(clueKeys, `clue keys for "${id}" don't match its lesson slugs`).toEqual(lessonSlugs);
    }
  });

  it("riddles are non-empty and unique within their world", () => {
    for (const [id, cfg] of Object.entries(ch)) {
      if (cfg.mode !== "clue") continue;
      const clues = Object.values(cfg.clues ?? {});
      for (const c of clues) {
        expect(typeof c === "string" && c.trim().length >= 8, `weak/empty clue in "${id}": "${c}"`).toBe(true);
      }
      expect(new Set(clues).size, `duplicate riddle text in "${id}"`).toBe(clues.length);
    }
  });
});

describe("difficulty profiles", () => {
  const profiles = PROFILES as unknown as Record<string, { winAt: number; challengeOpts: number; moreMode: boolean }>;

  it("defines explorer / player / challenger with sane tuning", () => {
    for (const key of ["explorer", "player", "challenger"]) {
      const p = profiles[key];
      expect(p, `missing profile "${key}"`).toBeTruthy();
      expect(p.winAt).toBeGreaterThanOrEqual(1);
      expect(p.winAt).toBeLessThanOrEqual(10);
      expect(p.challengeOpts).toBeGreaterThanOrEqual(2);
      expect(p.challengeOpts).toBeLessThanOrEqual(6);
      expect(typeof p.moreMode).toBe("boolean");
    }
  });

  it("DIFFICULTY_OPTIONS line up with the PROFILES keys", () => {
    const optIds = (DIFFICULTY_OPTIONS as unknown as { id: string }[]).map((o) => o.id).sort();
    expect(optIds).toEqual(Object.keys(profiles).sort());
  });

  it("profileTuning falls back to 'player' for an unknown profile", () => {
    expect(profileTuning("nope")).toBe(profiles.player);
    expect(profileTuning("explorer")).toBe(profiles.explorer);
  });
});

describe("findUnlockThreshold", () => {
  it("stays within [3, 8] and never demands more taps than the world (min floor 3)", () => {
    for (let total = 1; total <= 26; total++) {
      const t = findUnlockThreshold(total);
      expect(t, `total=${total}`).toBeGreaterThanOrEqual(3);
      expect(t, `total=${total}`).toBeLessThanOrEqual(8);
      expect(t, `total=${total}`).toBeLessThanOrEqual(Math.max(total, 3));
    }
  });

  it("is non-decreasing as the world grows", () => {
    let prev = 0;
    for (let total = 1; total <= 26; total++) {
      const t = findUnlockThreshold(total);
      expect(t, `total=${total} dipped below ${prev}`).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
});
