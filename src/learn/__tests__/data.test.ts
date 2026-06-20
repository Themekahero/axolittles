import { describe, it, expect } from "vitest";
import AxoData from "../data";

// The data module is plain JS; describe the slice we assert against so the
// tests are typed without converting data.js itself.
interface Lesson {
  slug: string;
  word: string;
  voice: string;
}
interface World {
  id: string;
  title: string;
  lessons: Lesson[];
}
interface Sticker {
  id: string;
  label: string;
  rule: { type: string; n?: number; id?: string };
}

const data = AxoData as unknown as {
  worlds: World[];
  worldMap: Record<string, World>;
  stickers: Sticker[];
};

describe("learn data — worlds", () => {
  it("ships the expected worlds, each with a unique id", () => {
    const ids = data.worlds.map((w) => w.id);
    expect(ids.length).toBeGreaterThanOrEqual(11);
    expect(new Set(ids).size).toBe(ids.length); // no duplicate ids
    for (const core of ["abc", "numbers", "colors", "fruits", "animals", "shapes", "vehicles", "planets"]) {
      expect(ids, `missing core world "${core}"`).toContain(core);
    }
  });

  it("every world has a title and at least one lesson", () => {
    for (const w of data.worlds) {
      expect(w.title, `${w.id}: title`).toBeTruthy();
      expect(w.lessons.length, `${w.id}: lessons`).toBeGreaterThan(0);
    }
  });

  it("every lesson has a non-empty slug, word, and spoken line", () => {
    for (const w of data.worlds) {
      for (const l of w.lessons) {
        expect(l.slug, `${w.id}: a lesson is missing its slug`).toBeTruthy();
        expect(l.word, `${w.id}/${l.slug}: word`).toBeTruthy();
        expect(typeof l.voice === "string" && l.voice.length > 0, `${w.id}/${l.slug}: voice line`).toBe(true);
      }
    }
  });

  it("lesson slugs are unique within each world", () => {
    for (const w of data.worlds) {
      const slugs = w.lessons.map((l) => l.slug);
      expect(new Set(slugs).size, `${w.id} has duplicate lesson slugs`).toBe(slugs.length);
    }
  });
});

describe("learn data — worldMap", () => {
  it("mirrors the worlds array exactly (same ids, same objects)", () => {
    const ids = data.worlds.map((w) => w.id).sort();
    expect(Object.keys(data.worldMap).sort()).toEqual(ids);
    for (const w of data.worlds) {
      expect(data.worldMap[w.id], `worldMap["${w.id}"] is not the world object`).toBe(w);
    }
  });
});

describe("learn data — stickers", () => {
  it("have unique ids", () => {
    const ids = data.stickers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every world-completion sticker points at a real world", () => {
    const worldIds = new Set(data.worlds.map((w) => w.id));
    for (const s of data.stickers) {
      if (s.rule?.type === "world") {
        expect(worldIds.has(s.rule.id as string), `sticker "${s.id}" → unknown world "${s.rule.id}"`).toBe(true);
      }
    }
  });
});
