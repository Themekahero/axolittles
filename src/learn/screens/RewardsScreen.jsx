// AxoLearn v2 — Rewards screen: stats, daily goal, sticker collection
import React from "react";
import { StickerGlyph, StarIcon, Icon, Confetti, BottomNav, totalStars, levelFor, isStickerUnlocked } from "../ui";
import AxoData from "../data";
import AxoAudio from "../audio";

function RewardsScreen({ progress, characterId, onHome, nav }) {
  const stars = totalStars(progress);
  const level = levelFor(stars);
  const streak = progress.streak?.count ?? 0;
  const goal = AxoData.dailyGoal;
  const todayStars = progress.daily?.stars ?? 0;
  const goalPct = Math.min(100, Math.round((todayStars / goal) * 100));
  const stickers = AxoData.stickers.map((s) => ({ ...s, unlocked: isStickerUnlocked(s, progress) }));
  const unlockedCount = stickers.filter((s) => s.unlocked).length;

  function sayCharacter() {
    AxoAudio.playTone("chime");
  }

  return (
    <React.Fragment>
      <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Go home">
        <Icon name="home" fill="#3b2f5e"></Icon>
      </button>

      <div className="top-bar" style={{ justifyContent: "center" }}>
        <div className="brand">
          <span className="brand-trophy"><StickerGlyph name="trophy"></StickerGlyph></span>
          My Trophies
        </div>
      </div>

      <div className="rewards-body">
        <div className="stat-row">
          <div className="stat-card" style={{ "--c": "#f59e0b" }}>
            <span className="stat-ico"><StarIcon></StarIcon></span>
            <span className="stat-num">{stars}</span>
            <span className="stat-label">Stars</span>
          </div>
          <div className="stat-card" style={{ "--c": "#ef4444" }}>
            <span className="stat-ico"><StickerGlyph name="fire"></StickerGlyph></span>
            <span className="stat-num">{streak}</span>
            <span className="stat-label">Day streak</span>
          </div>
          <div className="stat-card" style={{ "--c": "#7c3aed" }}>
            <span className="stat-ico"><StickerGlyph name="trophy"></StickerGlyph></span>
            <span className="stat-num">Lv {level}</span>
            <span className="stat-label">Level</span>
          </div>
          <div className="stat-card goal-card" style={{ "--c": "#16a34a" }}>
            <div className="goal-ring" style={{ "--pct": goalPct }}>
              <span>{goalPct}%</span>
            </div>
            <div className="goal-text">
              <span className="stat-num">Daily goal</span>
              <span className="stat-label">{todayStars} / {goal} stars today</span>
            </div>
          </div>
        </div>

        <div className="sticker-head">
          <h2>Trophy stickers</h2>
          <span className="sticker-count">{unlockedCount} of {stickers.length} unlocked</span>
        </div>
        <div className="sticker-grid">
          {stickers.map((s) => (
            <button
              key={s.id}
              className={"sticker" + (s.unlocked ? " unlocked" : " locked")}
              style={{ "--c": s.color }}
              onClick={() => {
                if (s.unlocked) {
                  AxoAudio.playTone("sparkle");
                  AxoAudio.speak(s.label + "!", { characterId });
                } else {
                  AxoAudio.playTone("pop");
                  AxoAudio.speak(s.hint, { characterId });
                }
              }}
              aria-label={s.unlocked ? s.label : "Locked: " + s.hint}
            >
              <span className="sticker-badge">
                {s.unlocked ? <StickerGlyph name={s.icon}></StickerGlyph> : <Icon name="lock"></Icon>}
              </span>
              <span className="sticker-name">{s.unlocked ? s.label : "????"}</span>
            </button>
          ))}
        </div>
      </div>
      {nav ? <BottomNav nav={nav} active="trophies"></BottomNav> : null}
    </React.Fragment>
  );
}

function StickerUnlock({ sticker, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <Confetti count={40}></Confetti>
      <div className="overlay-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-card">
          <span className="unlock-eyebrow">New sticker!</span>
          <span className="sticker-badge big" style={{ "--c": sticker.color }}>
            <StickerGlyph name={sticker.icon}></StickerGlyph>
          </span>
          <h2 className="celebrate-title">{sticker.label}</h2>
          <p className="celebrate-sub">Added to your collection</p>
          <button className="btn3d btn-gold" style={{ fontSize: 30, fontWeight: 700, padding: "14px 40px" }} onClick={onClose}>
            Yay!
          </button>
        </div>
      </div>
    </div>
  );
}

export { RewardsScreen, StickerUnlock };
