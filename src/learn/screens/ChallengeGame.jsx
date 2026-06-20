// Axolittles — ChallengeGame: the finite, forgiving, multi-mode quiz that
// powers BOTH ramp levels above "Learn":
//   • Level 2 "Find It"   — recognition: tap the picture/letter/numeral named.
//   • Level 3 "Challenge"  — harder, per world:
//        clue        -> teacher SPEAKS a riddle; child taps the matching picture
//        letterStart -> see a picture, tap the LETTER it starts with
//        number      -> hear a number, tap the matching NUMERAL (count dots help)
//                       + a "which has more?" round for the Challenger profile
//
// Design rules baked in (from the multi-agent pedagogy review for ages 2-5):
//   - No-fail & forgiving: wrong taps never end the game; an assist ladder
//     kicks in (replay clue -> dim to 2 choices -> highlight the answer).
//   - Short, profile-tuned sessions: a grown-up sets Explorer/Player/Challenger,
//     which tunes round length + how many choices appear.
//   - Reward effort: a star bursts on every correct tap; progress is dots.
//   - Never a silent dead-end: a quick warm-up replays a couple of Learn items,
//     the spoken clue lives in its own SR region, and when no voice is available
//     the target itself is shown so EVERY round is solvable without audio.
import React from "react";
import { Icon, StarIcon, ShapeArt, StarBurst } from "../ui";
import AxoAudio from "../audio";
import { challenges, ABC_CHALLENGE_SLUGS, profileTuning } from "../challengeData";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A stable per-option key (lesson items have .slug; "more" groups have .id).
const keyOf = (o) => o.slug || o.id;

// Numerals that look alike — never offered together as choices.
const NUM_TWINS = { "6": "9", "9": "6" };

function ChallengeGame({ world, level, characterId, profile, onWin, onComplete, onHome }) {
  const cfg = challenges[world.id] || {};
  const isFindIt = level === "findit";
  const tune = profileTuning(profile);

  // Resolve the activity mode for this world + level.
  const mode = isFindIt
    ? world.id === "numbers"
      ? "number"
      : world.id === "abc"
        ? "abcFind"
        : "find"
    : cfg.mode; // "clue" | "letterStart" | "number"

  const cardKind =
    mode === "letterStart" || mode === "abcFind" ? "letter"
      : mode === "number" ? "number"
        : "picture";

  // Item pool (ABC challenge modes use a curated, toddler-safe letter subset).
  const pool = React.useMemo(() => {
    if (world.id === "abc" && (mode === "letterStart" || mode === "abcFind")) {
      return world.lessons.filter((l) => ABC_CHALLENGE_SLUGS.includes(l.slug));
    }
    return world.lessons;
  }, [world.id, mode]);

  const WIN_AT = tune.winAt;

  const [phase, setPhase] = React.useState("warmup"); // "warmup" | "play"
  const [warmItems] = React.useState(() => shuffle(pool).slice(0, 2));
  const [correct, setCorrect] = React.useState(0);
  const [picks, setPicks] = React.useState(() => makeRound(0));
  const [result, setResult] = React.useState({});
  const [burstTick, setBurstTick] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [dimTo2, setDimTo2] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const [noVoice, setNoVoice] = React.useState(false);
  const lastSayRef = React.useRef(0);
  const lockRef = React.useRef(false); // one answer per round (toddlers double-tap)
  const wrongTimerRef = React.useRef(0);

  function optionCount(done) {
    if (!isFindIt) return Math.min(tune.challengeOpts, pool.length);
    const ramped = tune.findBase + (done >= 2 ? 1 : 0);
    return Math.min(tune.findMax, ramped, pool.length);
  }

  function makeRound(done) {
    // "Which has more?" comparison round — Level-3 Challenge only (Numbers +
    // Challenger), on odd rounds. Never in Find It (kept simple recognition).
    if (!isFindIt && mode === "number" && tune.moreMode && done % 2 === 1) {
      const a = 1 + Math.floor(Math.random() * 5); // smaller group: 1..5
      const b = Math.min(10, a + 3 + Math.floor(Math.random() * 4)); // bigger: a+3..a+6, capped at 10
      const options = shuffle([{ id: "g1", count: a }, { id: "g2", count: b }]);
      return { roundType: "more", options, max: Math.max(a, b) };
    }
    const n = optionCount(done);
    const target = pool[Math.floor(Math.random() * pool.length)];
    let rest = pool.filter((o) => o.slug !== target.slug);
    if (mode === "number" && NUM_TWINS[target.symbol]) {
      rest = rest.filter((o) => o.symbol !== NUM_TWINS[target.symbol]);
    }
    const distractors = shuffle(rest).slice(0, n - 1);
    return { roundType: "normal", options: shuffle([target, ...distractors]), target };
  }

  function promptText(p) {
    if (p.roundType === "more") return "Which one has more?";
    const t = p.target;
    if (mode === "clue") return cfg.clues?.[t.slug] || `Find the ${t.word}!`;
    if (mode === "number") return `Find the number ${t.symbol}!`;
    if (mode === "abcFind") return `Find the letter ${t.symbol}!`;
    if (mode === "letterStart") return `What does ${t.word} start with?`;
    return `Find the ${t.word}!`;
  }

  function spoken(p) {
    if (p.roundType === "more") return "Which one has more?";
    const t = p.target;
    if (mode === "clue") return cfg.clues?.[t.slug] || `Find the ${t.word}!`;
    if (mode === "number") return `Find the number ${t.symbol}!`;
    if (mode === "abcFind") return `Find the letter ${t.symbol}!`;
    if (mode === "letterStart") return `${t.word} starts with ${t.symbol}!`;
    return `Find the ${t.word}!`;
  }

  // The clue speaks into its OWN live region so transient feedback never wipes
  // it. Stamps lastSayRef so the speaker button's debounce also applies to the
  // automatic prompt (a quick tap won't clip the just-started clue).
  function sayPrompt() {
    lastSayRef.current = Date.now();
    AxoAudio.speak(spoken(picks), { characterId, liveId: "axo-live-clue" });
  }
  function replay() {
    const t = Date.now();
    if (t - lastSayRef.current < 420) return;
    sayPrompt();
  }

  // Detect a genuinely silent device (no speech API, or voices that never load)
  // so we can show the picture-match fallback. Polls a few times and only
  // concludes "silent" after the last check still finds no voices — so a late
  // voiceschanged on Chrome desktop doesn't false-positive and trivialize a riddle.
  React.useEffect(() => {
    if (!AxoAudio.hasVoice()) { setNoVoice(true); return undefined; }
    if (AxoAudio.voiceCount() > 0) return undefined;
    let settled = false;
    const timers = [];
    const poll = (ms, last) => timers.push(setTimeout(() => {
      if (settled) return;
      if (AxoAudio.voiceCount() > 0) { settled = true; setNoVoice(false); }
      else if (last) setNoVoice(true);
    }, ms));
    poll(400); poll(1200); poll(2400); poll(3500, true);
    return () => timers.forEach(clearTimeout);
  }, []);

  // Warm-up: replay 1-2 Learn items, then start. Auto-advances; skippable.
  React.useEffect(() => {
    if (phase !== "warmup") return undefined;
    const id = setTimeout(() => {
      AxoAudio.speak("Remember... " + warmItems.map((w) => w.word).join(", ") + "!", { characterId, liveId: "axo-live-clue" });
    }, 350);
    const go = setTimeout(() => setPhase("play"), 2900);
    return () => { clearTimeout(id); clearTimeout(go); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Speak the prompt when a round begins (only once we're playing).
  React.useEffect(() => {
    if (phase !== "play") return undefined;
    const id = setTimeout(sayPrompt, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, phase]);
  React.useEffect(() => () => AxoAudio.stopSpeaking(), []);

  function nextRound(done) {
    lockRef.current = false;
    setResult({});
    setMisses(0);
    setDimTo2(false);
    setHighlight(false);
    setPicks(makeRound(done));
  }

  function answer(option) {
    if (finished || phase !== "play" || lockRef.current) return;
    const isMore = picks.roundType === "more";
    const hit = isMore ? option.count === picks.max : option.slug === picks.target.slug;
    const key = keyOf(option);
    if (hit) {
      lockRef.current = true; // freeze the round so a double-tap can't re-score
      if (wrongTimerRef.current) { clearTimeout(wrongTimerRef.current); wrongTimerRef.current = 0; }
      setResult({ [key]: "right" });
      setBurstTick((t) => t + 1);
      AxoAudio.playTone("success");
      AxoAudio.speak("Yes! Great job!", { characterId });
      if (onWin) onWin();
      const done = correct + 1;
      setCorrect(done);
      if (done >= WIN_AT) {
        setTimeout(() => {
          setFinished(true);
          AxoAudio.playTone("celebrate");
          AxoAudio.speak("You did it! Hooray!", { characterId });
        }, 700);
      } else {
        setTimeout(() => nextRound(done), 1200);
      }
    } else {
      setResult({ [key]: "wrong" });
      AxoAudio.playTone("bounce");
      const m = misses + 1;
      setMisses(m);
      if (m >= 3) {
        setHighlight(true);
        AxoAudio.speak(isMore ? "Here it is! Tap the one with more." : "Here it is! Tap the glowing one.", { characterId });
      } else if (m === 2 && !isMore) {
        setDimTo2(true);
        AxoAudio.speak("Good try! Just two now.", { characterId });
      } else {
        AxoAudio.speak("Good try!", { characterId });
        setTimeout(sayPrompt, 900);
      }
      wrongTimerRef.current = setTimeout(() => setResult({}), 650);
    }
  }

  const targetKey = picks.roundType === "more"
    ? picks.options.find((o) => o.count === picks.max)?.id
    : picks.target?.slug;

  // When dimmed to two, keep the target + the first non-target option.
  const otherKey = picks.options.map(keyOf).find((k) => k !== targetKey);
  const visible = dimTo2 && picks.roundType !== "more"
    ? picks.options.filter((o) => keyOf(o) === targetKey || keyOf(o) === otherKey)
    : picks.options;

  const labelText = isFindIt ? "Find It" : cfg.label;
  const dots = Array.from({ length: WIN_AT }, (_, i) => i < correct);

  // `kind` decouples rendering from the active round (so warm-up / hint items
  // never accidentally render as "more" dot-clusters).
  function renderItem(o, size, kind) {
    if (kind === "more") {
      return (
        <span className="quiz-pips more-pips">
          {Array.from({ length: o.count }, (_, i) => (
            <span key={i} className="pip"></span>
          ))}
        </span>
      );
    }
    if (kind === "letter") return <span className="quiz-letter">{o.symbol}</span>;
    if (kind === "number") {
      return (
        <span className="quiz-num">
          <span className="quiz-numeral">{o.symbol}</span>
          <span className="quiz-pips">
            {Array.from({ length: o.count || 0 }, (_, i) => (
              <span key={i} className="pip"></span>
            ))}
          </span>
        </span>
      );
    }
    if (o.shape) return <ShapeArt kind={o.shape} size={size}></ShapeArt>;
    if (o.color && !o.image) return <span className="color-blob" style={{ background: o.color, width: size, height: size }}></span>;
    return <img src={o.image} alt="" style={size !== 150 ? { width: size, height: size, objectFit: "contain" } : undefined}></img>;
  }

  function cardLabel(o) {
    if (picks.roundType === "more") return o.count + (o.count === 1 ? " thing" : " things");
    if (cardKind === "letter") return "Letter " + o.symbol;
    if (cardKind === "number") return "Number " + o.symbol;
    return o.word;
  }

  // Picture-match fallback: with no voice, show the target itself in the prompt
  // so EVERY normal round (clue/find/number/abcFind) is solvable by matching.
  // letterStart already shows the picture + letter, so it needs no extra hint.
  const showPicHint = noVoice && picks.roundType === "normal" && mode !== "letterStart";

  if (phase === "warmup") {
    return (
      <React.Fragment>
        <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Go back">
          <Icon name="arrowLeft" fill="#3b2f5e"></Icon>
        </button>
        <div id="axo-live-clue" className="sr-only" aria-live="polite" aria-atomic="true"></div>
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Let's remember">
          <div className="overlay-card warmup-card">
            <h2 className="warmup-title">Let's remember!</h2>
            <div className="warmup-items">
              {warmItems.map((w) => (
                <span key={w.slug} className="warmup-mini">{renderItem(w, 110, cardKind)}</span>
              ))}
            </div>
            <button className="btn3d btn-gold warmup-go" onClick={() => { AxoAudio.playTone("pop"); setPhase("play"); }}>
              <Icon name="play" fill="#92400e"></Icon>
              Let's play!
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Go back">
        <Icon name="arrowLeft" fill="#3b2f5e"></Icon>
      </button>

      {/* Clue lives in its own SR region so feedback doesn't clobber it. */}
      <div id="axo-live-clue" className="sr-only" aria-live="polite" aria-atomic="true"></div>

      <div className="challenge-dots" aria-label={`${correct} of ${WIN_AT} done`}>
        {dots.map((on, i) => (
          <span key={i} className={"cdot" + (on ? " on" : "")}>
            {on ? <StarIcon></StarIcon> : null}
          </span>
        ))}
      </div>

      {mode === "letterStart" ? (
        <div className="quiz-prompt quiz-prompt--letter">
          <img className="ls-pic" src={picks.target.image} alt="" />
          <span className="ls-text">starts with</span>
          <span className="ls-letter">{picks.target.symbol}</span>
          <button className="btn3d btn-round" style={{ width: 72, height: 72 }} onClick={replay} aria-label="Hear it again">
            <Icon name="speaker" fill="#3b2f5e"></Icon>
          </button>
        </div>
      ) : (
        <div className={"quiz-prompt" + (mode === "clue" ? " quiz-prompt--clue" : "")}>
          {showPicHint ? <span className="prompt-target">{renderItem(picks.target, 80, cardKind)}</span> : null}
          <span className="quiz-prompt-text">{promptText(picks)}</span>
          <button className="btn3d btn-round" style={{ width: 72, height: 72 }} onClick={replay} aria-label="Hear it again">
            <Icon name="speaker" fill="#3b2f5e"></Icon>
          </button>
        </div>
      )}

      <div className={"quiz-options" + (visible.length >= 4 ? " quiz-options--four" : "") + (picks.roundType === "more" ? " quiz-options--more" : "")}>
        {visible.map((o) => {
          const key = keyOf(o);
          return (
            <button
              key={key}
              className={
                "quiz-card " + (result[key] || "") +
                (highlight && key === targetKey ? " hilite" : "")
              }
              onClick={() => answer(o)}
              aria-label={cardLabel(o)}
            >
              {renderItem(o, 150, picks.roundType === "more" ? "more" : cardKind)}
            </button>
          );
        })}
      </div>

      <StarBurst tick={burstTick}></StarBurst>

      {finished ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Level complete">
          <div className="overlay-card">
            <div className="celebrate-card">
              <div className="celebrate-stars">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ animationDelay: i * 200 + "ms" }}>
                    <StarIcon></StarIcon>
                  </span>
                ))}
              </div>
              <h2 className="celebrate-title">You did it!</h2>
              <p className="celebrate-sub">{labelText} complete</p>
              <button
                className="btn3d btn-gold"
                style={{ fontSize: 30, fontWeight: 700, padding: "14px 40px" }}
                onClick={() => { AxoAudio.playTone("pop"); onComplete(); }}
              >
                Yay!
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </React.Fragment>
  );
}

export { ChallengeGame };
export default ChallengeGame;
