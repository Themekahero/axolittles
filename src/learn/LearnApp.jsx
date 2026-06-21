// Axolittles — Learn & Play app shell.
// Ported from the original Kids-Learning Babel-in-browser app (app.jsx) into a
// real ES-module React component. Owns the tightly-coupled learning state
// (progress / current world / lesson index / sticker unlocks) and renders one
// immersive screen at a time inside a responsive, scaled 1280x800 "stage".
// External sections (Games / Adventure / Axo Rhymes / Shop / Parents) are
// delegated to top-level routes via the injected `onNavigate` callback.
import React from "react";
import AxoData from "./data";
import AxoAudio from "./audio";
import { Scenery, BottomNav, SectionTopBar, Icon, StarIcon, StickerGlyph, CharFace, isStickerUnlocked, totalStars, levelFor } from "./ui";
import { HomeScreen, LearnScreen, VoicePicker } from "./screens/HomeHub";
import { LessonScreen, CelebrateScreen } from "./screens/LessonScreen";
import { ChallengeGame } from "./screens/ChallengeGame";
import { WorldHub } from "./screens/WorldHub";
import { RewardsScreen, StickerUnlock } from "./screens/RewardsScreen";
import { VideoRoom } from "./screens/VideoRoom";
import { ParentalGate } from "./screens/ParentsDashboard";
import { safeGet, safeSet, safeSetJSON } from "./safeStorage";
import "./learn.css";

// localStorage keys — shared with ParentsDashboard.
const PROGRESS_KEY = "axolittles-progress";
const VOICE_KEY = "axolittles-voice";
const GOAL_KEY = "axolittles-goal";
const SETTINGS_KEY = "axolittles-settings";
const NAV_KEY = "axolittles-nav"; // session-only: remember the current screen on refresh

const DEFAULT_SETTINGS = {
  showHints: true,
  mascotOn: true,
  musicOn: false,
  playLimitMin: 0,
  requirePurchaseApproval: true,
  difficulty: "player", // explorer (2-3) | player (3-4) | challenger (4-5)
};

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

function dateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// Apply one earned star: bump today's daily count + streak.
function applyStar(p) {
  const today = dateStr(0);
  const daily =
    p.daily && p.daily.date === today
      ? { ...p.daily }
      : { date: today, stars: 0 };
  daily.stars += 1;
  const everHitDaily = p.everHitDaily || daily.stars >= AxoData.dailyGoal;
  let streak = p.streak ? { ...p.streak } : { count: 0, lastDate: null };
  if (streak.lastDate !== today) {
    streak.count = streak.lastDate === dateStr(-1) ? (streak.count || 0) + 1 : 1;
    streak.lastDate = today;
  }
  return { ...p, daily, everHitDaily, streak };
}

// Scale the fixed 1280x800 stage to fit the viewport (responsive letterbox).
function useStageScale() {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    function fit() {
      setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 800));
    }
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);
  return scale;
}

export default function LearnApp({ onNavigate = () => {}, initialScreen = "home" }) {
  const scale = useStageScale();

  // Restore where the child was on a refresh (session only). Scoped by
  // initialScreen so a fresh /rhymes etc. doesn't inherit a saved /learn state.
  const savedNav = React.useMemo(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(NAV_KEY) || "null");
      return s && s.initialScreen === initialScreen ? s : null;
    } catch {
      return null;
    }
  }, [initialScreen]);
  const [screen, setScreen] = React.useState(savedNav?.screen || initialScreen); // home | learn | lesson | celebrate | worldhub | findit | challenge | rewards | videos
  const [worldId, setWorldId] = React.useState(savedNav?.worldId || "abc");
  const [lessonIndex, setLessonIndex] = React.useState(savedNav?.lessonIndex ?? 0);
  const [progress, setProgress] = React.useState(loadProgress);
  // Settings are snapshotted once at mount (difficulty, hints, mascot, music,
  // play limit, purchase gate). /parents is a full route swap, so editing them
  // there unmounts+remounts this app and the new values take effect on return.
  // If /parents ever becomes an in-place overlay, re-read settings on change.
  const [settings] = React.useState(loadSettings);
  const [characterId, setCharacterId] = React.useState(
    () => localStorage.getItem(VOICE_KEY) || "axo",
  );
  const [showVoices, setShowVoices] = React.useState(false);
  const [newSticker, setNewSticker] = React.useState(null);
  const unlockedRef = React.useRef(null);

  const [breakTime, setBreakTime] = React.useState(false);
  const [shopGate, setShopGate] = React.useState(false);
  const [hideRotate, setHideRotate] = React.useState(false);
  const musicRef = React.useRef(null);

  function startMusic() {
    if (settings.musicOn && musicRef.current) {
      musicRef.current.volume = 0.22;
      musicRef.current.play().catch(() => {});
    }
  }

  // Audio (TTS + pre-recorded clips) needs a user gesture to start on mobile /
  // iOS. Instead of a "tap to start" gate, unlock on the FIRST interaction
  // anywhere in the app — same effect, no blocking page.
  React.useEffect(() => {
    let primed = false;
    function prime() {
      if (primed) return;
      primed = true;
      AxoAudio.unlock();
      startMusic();
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    }
    window.addEventListener("pointerdown", prime);
    window.addEventListener("keydown", prime);
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Screen-time: count play minutes; show a gentle break overlay
  // when the parent-set limit is reached. (settings.playLimitMin === 0 = off.)
  React.useEffect(() => {
    if (!settings.playLimitMin) return undefined;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - startedAt >= settings.playLimitMin * 60000) {
        AxoAudio.stopSpeaking();
        if (musicRef.current) musicRef.current.pause();
        setBreakTime(true);
        window.clearInterval(id);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [breakTime, settings.playLimitMin]);

  // Shop entry from a kid zone — gate it when a grown-up requires approval.
  function openShop() {
    AxoAudio.stopSpeaking();
    if (settings.requirePurchaseApproval) {
      setShopGate(true);
    } else {
      onNavigate("/shop");
    }
  }

  // Keep AxoData.dailyGoal in sync with the saved goal (applyStar + Trophies read it).
  React.useEffect(() => {
    const saved = Number(safeGet(GOAL_KEY));
    if (saved >= 3 && saved <= 15) AxoData.dailyGoal = saved;
  }, []);

  // Remember the current screen/world/lesson so a page refresh restores it
  // instead of dumping the child back at the Learn home.
  React.useEffect(() => {
    try {
      sessionStorage.setItem(NAV_KEY, JSON.stringify({ initialScreen, screen, worldId, lessonIndex }));
    } catch { /* ignore */ }
  }, [initialScreen, screen, worldId, lessonIndex]);

  const world = AxoData.worldMap[worldId] ?? AxoData.worlds[0];

  // Detect newly-unlocked stickers from any source and celebrate them.
  React.useEffect(() => {
    const cur = AxoData.stickers
      .filter((s) => isStickerUnlocked(s, progress))
      .map((s) => s.id);
    if (unlockedRef.current === null) {
      unlockedRef.current = new Set(cur);
      return;
    }
    const fresh = cur.filter((id) => !unlockedRef.current.has(id));
    cur.forEach((id) => unlockedRef.current.add(id));
    if (fresh.length) {
      const s = AxoData.stickers.find((x) => x.id === fresh[0]);
      AxoAudio.stopSpeaking(); // cut any lesson line so the sticker announcement is clear
      setNewSticker(s);
      AxoAudio.playTone("celebrate");
      AxoAudio.speak(`You earned the ${s.label} sticker!`, { characterId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  React.useEffect(() => {
    safeSetJSON(PROGRESS_KEY, progress);
  }, [progress]);

  React.useEffect(() => {
    AxoAudio.setCharacter(characterId);
    safeSet(VOICE_KEY, characterId);
  }, [characterId]);

  // Stop any speech when the immersive app unmounts (route change).
  React.useEffect(() => () => AxoAudio.stopSpeaking(), []);

  function award(wid, slug) {
    setProgress((p) => {
      const already = p.completed?.[wid]?.[slug];
      let next = {
        ...p,
        completed: {
          ...p.completed,
          [wid]: { ...(p.completed?.[wid] ?? {}), [slug]: true },
        },
      };
      if (!already) next = applyStar(next);
      return next;
    });
  }

  function recordQuizWin() {
    setProgress((p) => ({ ...p, quizWins: (p.quizWins ?? 0) + 1 }));
  }

  // Mark a ramp level (findit | challenge) cleared for the current world. Kept
  // in a separate `levels` namespace so the lesson-based star/sticker logic is
  // untouched.
  function completeLevel(which) {
    setProgress((p) => ({
      ...p,
      levels: {
        ...(p.levels ?? {}),
        [worldId]: { ...(p.levels?.[worldId] ?? {}), [which]: true },
      },
    }));
  }

  // Open a world's level-select hub (the 3-step ramp).
  function openWorld(id) {
    AxoAudio.playTone("pop");
    setWorldId(id);
    setScreen("worldhub");
  }

  // Jump into the tap-to-learn lessons at the first unfinished item.
  function openLesson() {
    const w = AxoData.worldMap[worldId];
    const doneMap = progress.completed?.[w.id] ?? {};
    const firstNew = w.lessons.findIndex((l) => !doneMap[l.slug]);
    AxoAudio.playTone("pop");
    setLessonIndex(firstNew >= 0 ? firstNew : 0);
    setScreen("lesson");
  }

  function pickVoice(id) {
    setCharacterId(id);
    const c = AxoAudio.characters.find((x) => x.id === id);
    AxoAudio.setCharacter(id);
    AxoAudio.playTone("chime");
    AxoAudio.speak(c.sample, { characterId: id });
  }

  // Shared bottom-nav handlers (Home / Learn / Axo Rhymes are in-app screens;
  // Games / Adventure / Shop / Settings route out via the site router).
  const bottomNav = {
    onHome: () => { AxoAudio.stopSpeaking(); AxoAudio.playTone("pop"); setScreen("home"); },
    onLearn: () => { AxoAudio.stopSpeaking(); AxoAudio.playTone("pop"); setScreen("learn"); },
    onRhymes: () => { AxoAudio.stopSpeaking(); AxoAudio.playTone("pop"); setScreen("videos"); },
    onGames: () => { AxoAudio.stopSpeaking(); onNavigate("/games"); },
    onAdventure: () => { AxoAudio.stopSpeaking(); onNavigate("/adventure"); },
    onShop: openShop,
    onSettings: () => { AxoAudio.stopSpeaking(); onNavigate("/parents"); },
  };

  // The bottom nav is rendered once at the shell level (outside the scaled
  // stage) so it stays 1:1 and full-width — identical to the games/adventure
  // bar. It shows only on the hub-style screens; `active` highlights the pill.
  const navActive = { home: "home", learn: "learn", worldhub: "learn", videos: "videos", rewards: "trophies" }[screen];

  // The top bar is also rendered once at the shell level (outside the scaled
  // stage), so all five sections' top menus match the games/adventure bar
  // exactly. Each hub screen supplies its own title / Home button / right slot.
  const char = AxoAudio.getCharacter(characterId);
  const stars = totalStars(progress);
  const level = levelFor(stars);
  const streak = progress.streak?.count ?? 0;
  let topBar = null;
  if (screen === "home") {
    topBar = (
      <SectionTopBar className="app-top-bar" title="Axolittles">
        <button className="stat-cluster" onClick={() => { AxoAudio.playTone("chime"); setScreen("rewards"); }} aria-label="My Trophies">
          <span className="mini-stat" style={{ "--c": "#f59e0b" }}><StarIcon />{stars}</span>
          <span className="mini-stat" style={{ "--c": "#ef4444" }}><span className="mini-ico"><StickerGlyph name="fire" /></span>{streak}</span>
          <span className="mini-stat" style={{ "--c": "#7c3aed" }}><span className="mini-ico"><StickerGlyph name="trophy" /></span>Lv {level}</span>
        </button>
        <button className="btn3d voice-btn" onClick={() => setShowVoices(true)} aria-label="Choose your teacher voice">
          <CharFace kind={char.kind} />
          <span className="listen-tag">Voice</span>
        </button>
        <button className="btn3d btn-round top-gear" onClick={() => { AxoAudio.playTone("pop"); AxoAudio.stopSpeaking(); onNavigate("/parents"); }} aria-label="Grown-ups">
          <Icon name="gear" fill="#3b2f5e" />
        </button>
      </SectionTopBar>
    );
  } else if (screen === "learn") {
    topBar = <SectionTopBar className="app-top-bar" onHome={() => { AxoAudio.stopSpeaking(); setScreen("home"); }} title="Learn" />;
  } else if (screen === "videos") {
    topBar = <SectionTopBar className="app-top-bar" onHome={() => { AxoAudio.stopSpeaking(); setScreen("home"); }} title="Axo Rhymes" />;
  } else if (screen === "worldhub") {
    topBar = <SectionTopBar className="app-top-bar" onHome={() => { AxoAudio.stopSpeaking(); setScreen("learn"); }} title={world.title} />;
  } else if (screen === "rewards") {
    topBar = <SectionTopBar className="app-top-bar" onHome={() => { AxoAudio.stopSpeaking(); setScreen("home"); }} title="Trophies" />;
  }

  // Theme: hub + world-grid use the default day sky; worlds bring their own.
  const onHubScreen =
    screen === "home" || screen === "rewards" || screen === "learn" || screen === "videos";
  const themeVars = onHubScreen
    ? { "--sky": "#7dd3fc", "--sky-high": "#bae6fd", "--ground": "#86efac", "--accent": "#2563eb" }
    : {
        "--sky": world.sky,
        "--sky-high": `color-mix(in oklab, ${world.sky} 60%, white 40%)`,
        "--ground": world.ground,
        "--accent": world.accent,
      };
  const night = !onHubScreen && world.night;

  return (
    <div
      className="axo-learn axo-learn--immersive"
      style={{ ...themeVars, "--object-scale": 1 }}
      data-screen-label={["lesson", "worldhub", "findit", "challenge"].includes(screen) ? world.title : screen}
    >
      {topBar}

      <div className="stage-wrap">
        <div className="stage" style={{ transform: `scale(${scale})`, "--stage-scale": scale }}>
          <Scenery night={night} />

          {screen === "home" ? (
            <HomeScreen
              progress={progress}
              characterId={characterId}
              onOpenVideos={() => { AxoAudio.playTone("pop"); setScreen("videos"); }}
              onOpenRewards={() => { AxoAudio.playTone("pop"); setScreen("rewards"); }}
              onOpenGames={() => { AxoAudio.playTone("pop"); AxoAudio.stopSpeaking(); onNavigate("/games"); }}
              onOpenAdventure={() => { AxoAudio.playTone("pop"); AxoAudio.stopSpeaking(); onNavigate("/adventure"); }}
              onOpenLearn={() => { AxoAudio.playTone("pop"); setScreen("learn"); }}
              onOpenShop={openShop}
            />
          ) : null}

          {screen === "learn" ? (
            <LearnScreen
              progress={progress}
              onOpenWorld={openWorld}
              onOpenVideos={() => { AxoAudio.playTone("pop"); setScreen("videos"); }}
            />
          ) : null}

          {screen === "rewards" ? (
            <RewardsScreen
              progress={progress}
              characterId={characterId}
            />
          ) : null}

          {screen === "videos" ? (
            <VideoRoom />
          ) : null}

          {screen === "lesson" ? (
            <LessonScreen
              key={worldId}
              world={world}
              index={lessonIndex}
              progress={progress}
              characterId={characterId}
              objectScale={1}
              showHints={settings.showHints}
              mascotOn={settings.mascotOn}
              paused={!!newSticker || showVoices || breakTime || shopGate}
              onAward={award}
              onNavigate={setLessonIndex}
              onHome={() => { AxoAudio.stopSpeaking(); setScreen("worldhub"); }}
              onQuiz={() => { AxoAudio.stopSpeaking(); setScreen("findit"); }}
              onFinishedWorld={() => setScreen("celebrate")}
            />
          ) : null}

          {screen === "celebrate" ? (
            <CelebrateScreen
              world={world}
              characterId={characterId}
              onHome={() => setScreen("worldhub")}
              onReplay={() => { AxoAudio.stopSpeaking(); setLessonIndex(0); setScreen("lesson"); }}
              onPlayGame={() => { AxoAudio.stopSpeaking(); setScreen("findit"); }}
            />
          ) : null}

          {screen === "worldhub" ? (
            <WorldHub
              world={world}
              progress={progress}
              onLearn={openLesson}
              onFindIt={() => { AxoAudio.stopSpeaking(); setScreen("findit"); }}
              onChallenge={() => { AxoAudio.stopSpeaking(); setScreen("challenge"); }}
            />
          ) : null}

          {screen === "findit" ? (
            <ChallengeGame
              key={worldId + "-findit"}
              world={world}
              level="findit"
              characterId={characterId}
              profile={settings.difficulty}
              mascotOn={settings.mascotOn}
              onWin={recordQuizWin}
              onComplete={() => { completeLevel("findit"); AxoAudio.stopSpeaking(); setScreen("worldhub"); }}
              onHome={() => { AxoAudio.stopSpeaking(); setScreen("worldhub"); }}
            />
          ) : null}

          {screen === "challenge" ? (
            <ChallengeGame
              key={worldId + "-challenge"}
              world={world}
              level="challenge"
              characterId={characterId}
              profile={settings.difficulty}
              mascotOn={settings.mascotOn}
              onWin={recordQuizWin}
              onComplete={() => { completeLevel("challenge"); AxoAudio.stopSpeaking(); setScreen("worldhub"); }}
              onHome={() => { AxoAudio.stopSpeaking(); setScreen("worldhub"); }}
            />
          ) : null}

          {showVoices ? (
            <VoicePicker
              characterId={characterId}
              onPick={pickVoice}
              onClose={() => setShowVoices(false)}
            />
          ) : null}

          {newSticker ? (
            <StickerUnlock
              sticker={newSticker}
              onClose={() => setNewSticker(null)}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom nav — lives outside the scaled stage so it renders 1:1 and full
          width, exactly like the games/adventure frame. */}
      {navActive ? <BottomNav nav={bottomNav} active={navActive} /> : null}

      {/* Soft background music — only plays when a grown-up enabled it. */}
      <audio ref={musicRef} src="/bg-song.mp3" loop preload="none" />

      {/* Rotate hint: the stage is biggest in landscape. Shown only on portrait
          phones; auto-hides when rotated, with a "play anyway" escape. */}
      {!hideRotate ? (
        <div className="axo-rotate-hint">
          <div className="axo-rotate-hint__inner">
            <img className="axo-rotate-hint__logo" src="/axo-logo.svg" alt="" />
            <span className="axo-rotate-hint__icon" aria-hidden="true">📱 ↻</span>
            <p>Turn your device sideways to play with Axo!</p>
            <button className="axo-rotate-hint__skip" onClick={() => setHideRotate(true)}>
              Play this way anyway
            </button>
          </div>
        </div>
      ) : null}

      {/* Screen-time break overlay (parent-set limit reached). */}
      {breakTime ? (
        <div className="axo-break">
          <div className="axo-break__card" role="dialog" aria-modal="true" aria-label="Time for a break">

            <img src="/axo-logo.svg" alt="" className="axo-break__logo" />
            <h2>Time for a break! 🌙</h2>
            <p>Axo needs a little rest. Come back and play again soon!</p>
            <div className="axo-break__btns">
              <button className="btn3d btn-accent" onClick={() => onNavigate("/")}>All done</button>
              <button className="btn3d" onClick={() => { setBreakTime(false); startMusic(); }}>5 more minutes</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grown-up gate before opening the shop (when required). */}
      {shopGate ? (
        <div className="parents-control axo-shop-gate">
          <ParentalGate
            onUnlock={() => { setShopGate(false); onNavigate("/shop"); }}
            onExit={() => setShopGate(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
