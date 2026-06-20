// AxoLearn v2 — Lesson screen: one giant thing to tap, giant arrows, no reading needed
import React from "react";
import { Icon, StarIcon, ShapeArt, Mascot, StarBurst, Confetti, TapHint, ProgressPath } from "../ui";
import AxoData from "../data";
import AxoAudio from "../audio";

function LessonScreen({
  world, index, progress, characterId, objectScale, showHints, mascotOn, paused,
  onAward, onNavigate, onHome, onQuiz, onFinishedWorld,
}) {
  const lesson = world.lessons[index];
  const [tapped, setTapped] = React.useState(false);
  const [bounce, setBounce] = React.useState(false);
  const [burstTick, setBurstTick] = React.useState(0);
  const [counted, setCounted] = React.useState(0);
  const [idle, setIdle] = React.useState(false);

  const isNumber = lesson.type === "number";
  const isColor = lesson.type === "color";
  const isShape = ["shape", "weather", "body", "vehicle"].includes(lesson.type);
  const total = world.lessons.length;
  const doneCount = Object.keys(progress.completed?.[world.id] ?? {}).length;
  // This item is "done" once tapped/counted this visit, or already in progress.
  // The Next arrow is gated on it; Previous is always allowed.
  const lessonDone = tapped || !!progress.completed?.[world.id]?.[lesson.slug];

  // Speak the lesson on entry + reset per-lesson state
  React.useEffect(() => {
    setTapped(false);
    setCounted(0);
    setIdle(false);
    if (!paused) AxoAudio.speak(lesson.voice, { characterId });
    const t = setTimeout(() => setIdle(true), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id, index]);

  React.useEffect(() => () => AxoAudio.stopSpeaking(), []);

  function award() {
    onAward(world.id, lesson.slug);
  }

  function celebrate() {
    setBounce(true);
    setBurstTick((t) => t + 1);
    setTimeout(() => setBounce(false), 720);
  }

  function handleObjectTap() {
    if (paused) return;
    setIdle(false);
    setTapped(true);
    celebrate();
    AxoAudio.playTone(AxoData.objectSounds[lesson.word] ?? "pop");
    AxoAudio.speak(lesson.voice, { characterId });
    award();
  }

  function handleCountTap() {
    if (paused || counted >= lesson.count) return;
    const next = counted + 1;
    setIdle(false);
    setCounted(next);
    AxoAudio.playTone(AxoData.objectSounds[lesson.sourceWord] ?? "pop");
    if (next >= lesson.count) {
      setTapped(true);
      celebrate();
      AxoAudio.speak(`${lesson.word}!`, { characterId });
      award();
    } else {
      AxoAudio.speak(String(next), { characterId });
    }
  }

  function goTo(nextIndex) {
    if (paused) return;
    // Gate forward navigation: the child must finish the current item (tap the
    // object / count all images and earn the star) before Next works. Previous
    // (nextIndex < index) is always allowed.
    if (nextIndex > index && !lessonDone) {
      AxoAudio.playTone("bounce");
      AxoAudio.speak("Tap it first!", { characterId });
      return;
    }
    AxoAudio.playTone("pop");
    if (nextIndex >= total) {
      onFinishedWorld();
    } else if (nextIndex >= 0) {
      onNavigate(nextIndex);
    }
  }

  // Number lessons: gentle auto-reveal of first item sound cue
  const countItems = isNumber
    ? Array.from({ length: lesson.count }, (_, i) => i)
    : [];

  return (
    <React.Fragment>
      <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Go home">
        <Icon name="home" fill="#3b2f5e"></Icon>
      </button>

      <button className="btn3d btn-round quiz-btn" onClick={onQuiz} aria-label="Play the quiz">
        <Icon name="medal" fill="#fff"></Icon>
      </button>

      <ProgressPath done={doneCount} total={total}></ProgressPath>

      <div className="lesson-main">
        <div className="symbol-panel">
          {lesson.symbol === lesson.word ? (
            <div className="lesson-word xl" key={lesson.slug}>{lesson.word}</div>
          ) : (
            <React.Fragment>
              <div className={"big-symbol" + (lesson.symbol.length > 2 ? " small" : "")} key={lesson.slug}>
                {lesson.symbol}
              </div>
              <div className="lesson-word">{lesson.word}</div>
            </React.Fragment>
          )}
        </div>

        {isNumber ? (
          <div className={"count-grid" + (lesson.count > 6 ? " dense" : "")}>
            {countItems.map((i) => (
              <button
                key={lesson.slug + "-" + i}
                className={"count-item" + (i < counted ? " counted" : "")}
                onClick={handleCountTap}
                aria-label={"Count " + (i + 1)}
              >
                <img src={lesson.image} alt=""></img>
                {i < counted ? <span className="count-badge">{i + 1}</span> : null}
              </button>
            ))}
            {idle && !tapped && counted === 0 && showHints ? <TapHint></TapHint> : null}
          </div>
        ) : (
          <div className="object-stage">
            <span className="object-ring"></span>
            <button className="object-tap" onClick={handleObjectTap} aria-label={"Tap the " + lesson.word}>
              {isColor ? (
                <span
                  className={"color-blob" + (bounce ? " bouncing" : "")}
                  style={{ background: lesson.color }}
                ></span>
              ) : isShape ? (
                <span className={"shape-obj" + (bounce ? " bouncing" : "")}>
                  <ShapeArt kind={lesson.shape} size="100%"></ShapeArt>
                </span>
              ) : (
                <img
                  className={"object-img" + (bounce ? " bouncing" : "")}
                  src={lesson.image} alt={lesson.word}
                ></img>
              )}
            </button>
            {idle && !tapped && showHints ? <TapHint></TapHint> : null}
          </div>
        )}
      </div>

      <button
        className="btn3d btn-round edge-arrow left"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Previous"
      >
        <Icon name="arrowLeft" fill="#3b2f5e"></Icon>
      </button>
      <button
        className={"btn3d btn-round edge-arrow right" + (lessonDone ? " nudge" : "")}
        onClick={() => goTo(index + 1)}
        disabled={!lessonDone}
        aria-label="Next"
      >
        <Icon name="arrowRight"></Icon>
      </button>

      <div className="lesson-bottom">
        <button
          className="btn3d btn-round"
          onClick={() => { if (paused) return; AxoAudio.playTone("pop"); AxoAudio.speak(lesson.voice, { characterId }); }}
          aria-label="Say it again"
        >
          <Icon name="speaker" fill="#3b2f5e"></Icon>
        </button>
      </div>

      {mascotOn ? <Mascot characterId={characterId} bubble={lesson.voice}></Mascot> : null}
      <StarBurst tick={burstTick}></StarBurst>
    </React.Fragment>
  );
}

/* ── World finished: big celebration ────────────────────────────────────── */
function CelebrateScreen({ world, characterId, onHome, onPlayGame, onReplay }) {
  React.useEffect(() => {
    AxoAudio.playTone("celebrate");
    AxoAudio.speak(`Amazing! You finished ${world.title}! Hip hip hooray!`, { characterId });
    return () => AxoAudio.stopSpeaking();
  }, []);

  return (
    <div className="overlay" style={{ background: "rgba(59,47,94,0.35)" }}>
      <Confetti></Confetti>
      <div className="overlay-card">
        <div className="celebrate-card">
          <span className="trophy">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 3h12v2h3v3c0 2.4-1.8 4.4-4.2 4.9A6 6 0 0 1 13 16.7V19h3v2H8v-2h3v-2.3a6 6 0 0 1-3.8-3.8C4.8 12.4 3 10.4 3 8V5h3V3z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8"></path>
            </svg>
          </span>
          <div className="celebrate-stars">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ animationDelay: i * 200 + "ms" }}>
                <StarIcon></StarIcon>
              </span>
            ))}
          </div>
          <h2 className="celebrate-title">You did it!</h2>
          <p className="celebrate-sub">{world.title} is complete</p>
          <div className="celebrate-actions">
            <button className="btn3d" onClick={onHome}>
              <Icon name="home" fill="#3b2f5e"></Icon>
              Home
            </button>
            <button className="btn3d btn-accent" onClick={onReplay}>
              <Icon name="play" fill="#fff"></Icon>
              Learn Again
            </button>
            <button className="btn3d btn-gold" onClick={onPlayGame}>
              <Icon name="star" fill="#92400e"></Icon>
              Play a game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LessonScreen, CelebrateScreen };
