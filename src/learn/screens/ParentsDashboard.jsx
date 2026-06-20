// Axolittles — Parents Control dashboard.
// A NET-NEW grown-up-facing dashboard (readable, not toddler-styled, but on-brand:
// Fredoka + soft rounded cards from learn.css). Rendered by the /parents route
// inside a wrapping <div class="axo-learn"> as a normal flowing responsive page
// (NOT the fixed 1280x800 stage). Reads/writes the same localStorage keys as the
// learning app so settings stay in sync.
import React from "react";
import AxoData from "../data";
import AxoAudio from "../audio";
import {
  Icon,
  StarIcon,
  CharFace,
  StickerGlyph,
  totalStars,
  lessonsDone,
  worldComplete,
  levelFor,
  isStickerUnlocked,
} from "../ui";
import { DIFFICULTY_OPTIONS } from "../challengeData";
import { safeSet, safeSetJSON } from "../safeStorage";
import "../learn.css";
import "./parents.css";

// localStorage keys — shared with LearnApp.
const PROGRESS_KEY = "axolittles-progress";
const VOICE_KEY = "axolittles-voice";
const GOAL_KEY = "axolittles-goal";
const SETTINGS_KEY = "axolittles-settings";

const DEFAULT_SETTINGS = {
  showHints: true,
  mascotOn: true,
  musicOn: false,
  playLimitMin: 0,
  requirePurchaseApproval: true,
  difficulty: "player",
};

const AXO_LOGO_SRC = "/axo-logo.svg";
const PLAY_LIMIT_OPTIONS = [0, 15, 30, 45, 60];

/* ── Safe loaders ─────────────────────────────────────────────────────────── */
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { completed: {} };
  } catch {
    return { completed: {} };
  }
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadGoal() {
  const saved = Number(localStorage.getItem(GOAL_KEY));
  if (saved >= 3 && saved <= 15) return saved;
  return AxoData.dailyGoal;
}

function loadVoice() {
  return localStorage.getItem(VOICE_KEY) || "axo";
}

/* ── Parental-gate code generator ─────────────────────────────────────────────
   A real adult check: a 4-digit code shown ONLY as written-out words (e.g.
   "four · seven · two · nine"). A non-reader can't read the words; a grown-up
   types the digits. No on-screen digits, no press-and-hold bypass. Deterministic
   counter so there's no Math.random at import time; the code rotates per attempt.
   Digits are 1-9 (never 0) so there's no leading-zero ambiguity. */
const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const GATE_DIGITS = [4, 7, 2, 9, 5, 1, 8, 3, 6, 2, 9, 4, 7, 5, 3, 8];
let GATE_SEED = 5;
function nextCode() {
  const s = GATE_SEED;
  GATE_SEED += 3;
  const digits = [0, 1, 2, 3].map((k) => GATE_DIGITS[(s + k * 4) % GATE_DIGITS.length]);
  return {
    value: digits.join(""),
    words: digits.map((d) => NUM_WORDS[d]).join("  ·  "),
    spoken: digits.map((d) => NUM_WORDS[d]).join(", "),
  };
}

/* ── Parental gate ────────────────────────────────────────────────────────────
   Renders before the dashboard. Type-the-spelled-out-code challenge. */
function ParentalGate({ onUnlock, onExit }) {
  const [code, setCode] = React.useState(nextCode);
  const [entry, setEntry] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onExit(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onExit]);

  function submit(e) {
    e.preventDefault();
    if (entry.trim() === code.value) {
      onUnlock();
    } else {
      setError(true);
      setEntry("");
      setCode(nextCode());
    }
  }

  return (
    <div className="parents-page parents-gate">
      <div
        className="parents-gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parents-gate-title"
      >
        <img className="parents-gate-logo axo-logo" src={AXO_LOGO_SRC} alt="" />
        <h1 className="parents-gate-title" id="parents-gate-title">Grown-ups only</h1>
        <p className="parents-gate-sub">
          Ask a grown-up. Type the numbers below to continue.
        </p>

        <form className="parents-gate-form" onSubmit={submit}>
          <p className="parents-gate-code" aria-hidden="true">{code.words}</p>
          <label className="parents-gate-label" htmlFor="parents-gate-answer">
            Type these numbers:
          </label>
          <div className="parents-gate-input-row">
            <input
              id="parents-gate-answer"
              className="parents-gate-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="off"
              autoFocus
              value={entry}
              onChange={(e) => {
                setEntry(e.target.value.replace(/[^0-9]/g, ""));
                setError(false);
              }}
              aria-label={`Type the numbers: ${code.spoken}`}
              aria-invalid={error}
            />
            <button type="submit" className="btn3d btn-accent parents-gate-go">
              Enter
            </button>
          </div>
          {error ? (
            <p className="parents-gate-error" role="alert">
              That's not quite right — here's a new code. Try again.
            </p>
          ) : null}
        </form>

        <button className="parents-gate-cancel" onClick={onExit}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── A stat card (reuses .stat-card from learn.css) ───────────────────────── */
function StatCard({ icon, glyph, color, num, label }) {
  return (
    <div className="stat-card" style={{ "--c": color }}>
      <span className="stat-ico">
        {glyph ? <StickerGlyph name={glyph} /> : <Icon name={icon} fill="#fff" />}
      </span>
      <span className="stat-num">{num}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ title, hint, children }) {
  return (
    <section className="parents-section">
      <h2 className="parents-section-title">{title}</h2>
      {hint ? <p className="parents-section-hint">{hint}</p> : null}
      {children}
    </section>
  );
}

/* ── A pill toggle (reuses .set-toggle/.knob from learn.css) ───────────────── */
function ToggleRow({ id, label, note, checked, onChange }) {
  return (
    <div className="parents-toggle-row">
      <div className="parents-toggle-text">
        <label htmlFor={id} className="parents-toggle-label">{label}</label>
        {note ? <span className="parents-toggle-note">{note}</span> : null}
      </div>
      <button
        id={id}
        type="button"
        className={"set-toggle" + (checked ? " on" : "")}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className="knob"></span>
      </button>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
function Dashboard({ onExit }) {
  const [progress, setProgress] = React.useState(loadProgress);
  const [settings, setSettings] = React.useState(loadSettings);
  const [goal, setGoal] = React.useState(loadGoal);
  const [voice, setVoice] = React.useState(loadVoice);

  // Persist whenever a setting changes (crash-safe — private mode/quota safe).
  function saveSettings(next) {
    setSettings(next);
    safeSetJSON(SETTINGS_KEY, next);
  }
  function setSetting(key, value) {
    saveSettings({ ...settings, [key]: value });
  }
  function changeGoal(value) {
    const v = Math.max(3, Math.min(15, value));
    setGoal(v);
    safeSet(GOAL_KEY, String(v));
    AxoData.dailyGoal = v;
  }
  function pickVoice(id) {
    setVoice(id);
    safeSet(VOICE_KEY, id);
    AxoAudio.setCharacter(id);
  }
  function resetProgress() {
    if (!window.confirm(
      "Reset all learning progress? This erases every star, streak and trophy. This cannot be undone."
    )) return;
    const cleared = { completed: {} };
    setProgress(cleared);
    safeSetJSON(PROGRESS_KEY, cleared);
  }

  const stars = totalStars(progress);
  const level = levelFor(stars);
  const streak = progress.streak?.count ?? 0;
  const done = lessonsDone(progress);
  const worldsDone = AxoData.worlds.filter((w) => worldComplete(progress, w.id)).length;
  const stickersDone = AxoData.stickers.filter((s) => isStickerUnlocked(s, progress)).length;

  return (
    <div className="parents-page">
      {/* Header */}
      <header className="parents-header">
        <div className="parents-brand">
          <img className="parents-logo axo-logo" src={AXO_LOGO_SRC} alt="" />
          <h1 className="parents-title">Parents Control</h1>
        </div>
        <button className="btn3d btn-accent parents-exit" onClick={onExit}>
          Exit to site
        </button>
      </header>

      <main className="parents-main">
        {/* 2) Progress overview */}
        <Section title="Progress overview">
          <div className="parents-stats">
            <StatCard icon="star" color="#fbbf24" num={stars} label="Total stars" />
            <StatCard icon="trophy" color="#3b82f6" num={level} label="Level" />
            <StatCard glyph="fire" color="#ef4444" num={streak} label="Day streak" />
            <StatCard icon="book" color="#22c55e" num={done} label="Lessons completed" />
            <StatCard
              icon="home"
              color="#8b5cf6"
              num={`${worldsDone} / ${AxoData.worlds.length}`}
              label="Worlds completed"
            />
            <StatCard
              glyph="medal"
              color="#d97706"
              num={`${stickersDone} / ${AxoData.stickers.length}`}
              label="Stickers unlocked"
            />
          </div>
        </Section>

        {/* 3) Per-world progress */}
        <Section title="Per-world progress">
          <div className="parents-worlds set-progress">
            {AxoData.worlds.map((w) => {
              const wdone = Object.keys(progress.completed?.[w.id] ?? {}).length;
              const total = w.lessons.length;
              const pct = total ? Math.round((wdone / total) * 100) : 0;
              return (
                <div key={w.id} className="set-prog-row">
                  <span className="set-prog-name">{w.title}</span>
                  <span className="set-prog-track">
                    <span
                      className="set-prog-fill"
                      style={{ width: pct + "%", background: w.tile }}
                    ></span>
                  </span>
                  <span className="set-prog-count">{wdone}/{total}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 4) Learning controls */}
        <Section title="Learning controls">
          <div className="parents-control-block">
            <span className="parents-field-label" id="parents-difficulty-label">
              Difficulty
            </span>
            <div
              className="parents-difficulty"
              role="radiogroup"
              aria-labelledby="parents-difficulty-label"
              onKeyDown={(e) => {
                const ids = DIFFICULTY_OPTIONS.map((o) => o.id);
                let i = ids.indexOf(settings.difficulty);
                if (e.key === "ArrowRight" || e.key === "ArrowDown") i = (i + 1) % ids.length;
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = (i - 1 + ids.length) % ids.length;
                else return;
                e.preventDefault();
                setSetting("difficulty", ids[i]);
                const btns = e.currentTarget.querySelectorAll(".parents-diff-card");
                if (btns[i]) btns[i].focus();
              }}
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={"parents-diff-card" + (settings.difficulty === d.id ? " on" : "")}
                  onClick={() => setSetting("difficulty", d.id)}
                  role="radio"
                  aria-checked={settings.difficulty === d.id}
                  tabIndex={settings.difficulty === d.id ? 0 : -1}
                  aria-label={`${d.label}, ${d.age}. ${d.note}`}
                >
                  <span className="parents-diff-name">{d.label}</span>
                  <span className="parents-diff-age">{d.age}</span>
                  <span className="parents-diff-note">{d.note}</span>
                </button>
              ))}
            </div>
            <p className="parents-toggle-note">
              Tunes the Find&nbsp;It &amp; Challenge games — number of choices, round length, and a “which has more?” round for older kids. Learn is always the same.
            </p>
          </div>

          <div className="parents-control-block">
            <label className="parents-field-label" htmlFor="parents-goal">
              Daily goal
              <span className="parents-field-value">
                <StarIcon />
                {goal} stars a day
              </span>
            </label>
            <input
              id="parents-goal"
              className="parents-slider"
              type="range"
              min="3"
              max="15"
              step="1"
              value={goal}
              onChange={(e) => changeGoal(Number(e.target.value))}
              aria-label="Daily goal, stars per day"
            />
          </div>

          <div className="parents-control-block">
            <span className="parents-field-label" id="parents-voice-label">
              Teacher voice
            </span>
            <div
              className="set-voices parents-voices"
              role="radiogroup"
              aria-labelledby="parents-voice-label"
            >
              {AxoAudio.characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={"set-voice" + (voice === c.id ? " on" : "")}
                  onClick={() => pickVoice(c.id)}
                  role="radio"
                  aria-checked={voice === c.id}
                  aria-label={"Teacher voice " + c.name}
                >
                  <CharFace kind={c.kind} size={56} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="parents-control-block">
            <ToggleRow
              id="parents-hints"
              label="Tap hints"
              note="Shows a gentle pointing hand on the next thing to tap."
              checked={settings.showHints}
              onChange={(v) => setSetting("showHints", v)}
            />
            <ToggleRow
              id="parents-mascot"
              label="Mascot helper"
              note="Axo (or your chosen friend) appears in lessons to cheer along."
              checked={settings.mascotOn}
              onChange={(v) => setSetting("mascotOn", v)}
            />
            <ToggleRow
              id="parents-music"
              label="Background music"
              note="Soft music plays while your child explores."
              checked={settings.musicOn}
              onChange={(v) => setSetting("musicOn", v)}
            />
          </div>
        </Section>

        {/* 5) Screen time */}
        <Section
          title="Screen time"
          hint="Set a gentle daily play limit. When the limit is reached the app shows a friendly “time for a break” reminder. Note: this reminder is display-only for now — it does not lock the app or stop play."
        >
          <div className="parents-control-block">
            <label className="parents-field-label" htmlFor="parents-playlimit">
              Daily play limit
            </label>
            <select
              id="parents-playlimit"
              className="parents-select"
              value={settings.playLimitMin}
              onChange={(e) => setSetting("playLimitMin", Number(e.target.value))}
            >
              {PLAY_LIMIT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "Off" : `${m} minutes`}
                </option>
              ))}
            </select>
          </div>
        </Section>

        {/* 6) Purchases */}
        <Section title="Purchases">
          <div className="parents-control-block">
            <ToggleRow
              id="parents-purchase"
              label="Require grown-up approval before opening shop links / checkout"
              note="When on, tapping a buy or checkout link asks a grown-up to confirm first."
              checked={settings.requirePurchaseApproval}
              onChange={(v) => setSetting("requirePurchaseApproval", v)}
            />
          </div>
        </Section>

        {/* 7) Danger zone */}
        <Section title="Danger zone">
          <div className="parents-danger">
            <p className="parent-note parents-danger-note">
              This permanently erases all stars, streaks and trophies for this device.
            </p>
            <button className="parent-reset" onClick={resetProgress}>
              Reset all learning progress
            </button>
          </div>
        </Section>
      </main>
    </div>
  );
}

/* ── Public component ─────────────────────────────────────────────────────── */
export default function ParentsDashboard({ onExit = () => {} }) {
  const [unlocked, setUnlocked] = React.useState(false);

  return (
    <div className="axo-learn parents-control">
      {unlocked ? (
        <Dashboard onExit={onExit} />
      ) : (
        <ParentalGate onUnlock={() => setUnlocked(true)} onExit={onExit} />
      )}
    </div>
  );
}

export { ParentsDashboard, ParentalGate };
