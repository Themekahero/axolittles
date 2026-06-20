// Axolittles — WorldHub: the level-select shown when a child opens a world.
// Lays out the 3-step ramp (Learn -> Find It -> Challenge) as big friendly
// cards with stars / checkmarks / soft locks. Gates are gentle: locked cards
// are dimmed but still tappable — tapping one speaks a warm nudge instead of
// being a dead wall (per the ages-2-5 design review).
import React from "react";
import { Icon, StarIcon, StickerGlyph, BottomNav } from "../ui";
import AxoAudio from "../audio";
import { challenges, findUnlockThreshold } from "../challengeData";

function LevelCard({ n, color, icon, title, sub, locked, done, onOpen, nudge, count }) {
  return (
    <button
      className={"level-card" + (locked ? " locked" : "") + (done ? " done" : "")}
      style={{ "--lc": color }}
      onClick={() => {
        if (locked) {
          AxoAudio.playTone("pop");
          AxoAudio.speak(nudge);
        } else {
          AxoAudio.playTone("pop");
          onOpen();
        }
      }}
      aria-label={locked ? title + " — locked. " + nudge : title}
    >
      <span className="level-num">{n}</span>
      <span className="level-art">
        {locked ? <Icon name="lock" fill="#fff"></Icon> : <Icon name={icon} fill="#fff"></Icon>}
      </span>
      <span className="level-title">{title}</span>
      <span className="level-sub">{sub}</span>
      <span className="level-status">
        {done ? (
          <span className="level-check"><Icon name="check" fill="#16a34a"></Icon> Done</span>
        ) : locked ? (
          <span className="level-lock"><Icon name="lock" fill="#fff"></Icon></span>
        ) : count ? (
          <span className="level-go"><StarIcon></StarIcon> {count}</span>
        ) : (
          <span className="level-go"><Icon name="play" fill="#fff"></Icon> Play</span>
        )}
      </span>
    </button>
  );
}

function WorldHub({ world, progress, onLearn, onFindIt, onChallenge, onHome, nav }) {
  const cfg = challenges[world.id] || {};
  const total = world.lessons.length;
  const learnDone = Object.keys(progress.completed?.[world.id] ?? {}).length;
  const learnComplete = learnDone >= total;

  const findUnlocked = learnDone >= findUnlockThreshold(total);
  const levels = progress.levels?.[world.id] ?? {};
  const finditDone = !!levels.findit;
  const challengeUnlocked = finditDone;
  const challengeDone = !!levels.challenge;

  React.useEffect(() => {
    const id = setTimeout(() => AxoAudio.speak(`${world.title}! Pick a game.`), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id]);

  return (
    <React.Fragment>
      <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Back to all worlds">
        <Icon name="arrowLeft" fill="#3b2f5e"></Icon>
      </button>

      <div className="top-bar" style={{ justifyContent: "center" }}>
        <div className="brand">{world.title}</div>
      </div>

      <div className="level-grid">
        <LevelCard
          n="1"
          color="#38bdf8"
          icon="book"
          title="Learn"
          sub="Tap &amp; play"
          locked={false}
          done={learnComplete}
          onOpen={onLearn}
          count={`${learnDone}/${total}`}
        />
        <LevelCard
          n="2"
          color="#22c55e"
          icon="target"
          title="Find It"
          sub={findUnlocked ? "Spot it fast!" : "Learn a few first"}
          locked={!findUnlocked}
          done={finditDone}
          onOpen={onFindIt}
          nudge="Tap Learn and play a few more first!"
        />
        <LevelCard
          n="3"
          color="#a78bfa"
          icon="medal"
          title={cfg.label || "Challenge"}
          sub={challengeUnlocked ? "The big one!" : "Win Find It first"}
          locked={!challengeUnlocked}
          done={challengeDone}
          onOpen={onChallenge}
          nudge="Win the Find It game first, then this opens!"
        />
      </div>

      <div className="level-foot">
        <span className="level-foot-pill">
          <StarIcon></StarIcon>
          {learnComplete && finditDone && challengeDone
            ? "All done — you are an Axo star!"
            : "Finish all three to master this world"}
        </span>
      </div>

      {nav ? <BottomNav nav={nav} active="learn"></BottomNav> : null}
    </React.Fragment>
  );
}

export { WorldHub };
export default WorldHub;
