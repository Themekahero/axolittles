// AxoLearn v2 — Home screen, Learn screen, voice picker
import React from "react";
import { Icon, StarIcon, CharFace, StickerGlyph, ShapeArt, BottomNav, totalStars, levelFor, isStickerUnlocked } from "../ui";
import AxoData from "../data";
import AxoAudio from "../audio";

const AXO_LOGO_SRC = "/axo-logo.svg";

/* The 12-world grid — shared by Home (for now) and the Learn screen */
function WorldGrid({ progress, onOpenWorld, onOpenVideos }) {
  return (
    <div className="home-grid">
      {AxoData.worlds.map((world) => {
        const done = Object.keys(progress.completed?.[world.id] ?? {}).length;
        const total = world.lessons.length;
        return (
          <button
            key={world.id}
            className="world-tile"
            style={{ "--tile": world.tile }}
            onClick={() => onOpenWorld(world.id)}
            aria-label={world.title}
          >
            {world.coverShape ? (
              <span className="tile-art tile-art-svg">
                <ShapeArt kind={world.coverShape} size="100%"></ShapeArt>
              </span>
            ) : world.coverSymbol === "rainbow" ? (
              <span className="tile-art-rainbow"></span>
            ) : (
              <img
                className="tile-art"
                src={world.cover}
                alt=""
                style={world.artScale ? {
                  width: Math.round(132 * world.artScale),
                  height: Math.round(122 * world.artScale),
                  top: -16 - Math.round(122 * (world.artScale - 1)),
                } : null}
              ></img>
            )}
            <span className="tile-name">{world.title}</span>
            <span className="tile-stars">
              {done >= total ? (
                <span className="done-check"><Icon name="check" fill="#16a34a"></Icon></span>
              ) : null}
              <StarIcon></StarIcon>
              {done}/{total}
            </span>
          </button>
        );
      })}

      <button className="world-tile video-tile" style={{ "--tile": "#f87171" }}
        onClick={() => { AxoAudio.playTone("pop"); onOpenVideos(); }} aria-label="Axo Rhymes">
        <span className="tile-art-tv"><span className="tv-play"></span></span>
        <span className="tile-name">Axo Rhymes</span>
        <span className="tile-stars">
          <Icon name="music" fill="#db2777"></Icon>
          Songs
        </span>
      </button>
    </div>
  );
}

/* ── Learn screen: all 12 worlds ─────────────────────────────────── */
function LearnScreen({ progress, onOpenWorld, onOpenVideos, onHome, nav }) {
  return (
    <React.Fragment>
      <button className="btn3d btn-round home-btn" onClick={onHome} aria-label="Go home">
        <Icon name="home" fill="#3b2f5e"></Icon>
      </button>
      <div className="top-bar" style={{ justifyContent: "center" }}>
        <div className="brand">
          <Icon name="book" fill="#fff"></Icon>
          Learn
        </div>
      </div>
      <WorldGrid progress={progress} onOpenWorld={onOpenWorld} onOpenVideos={onOpenVideos}></WorldGrid>
      {nav ? <BottomNav nav={nav} active="learn"></BottomNav> : null}
    </React.Fragment>
  );
}

function HomeScreen({ progress, onOpenWorld, onOpenVideos, characterId, onOpenVoices, onOpenParents, onOpenRewards, onOpenGames, onOpenAdventure, onOpenLearn, onOpenShop, nav }) {
  const stars = totalStars(progress);
  const level = levelFor(stars);
  const streak = progress.streak?.count ?? 0;
  const char = AxoAudio.getCharacter(characterId);
  const stickersWon = AxoData.stickers.filter((s) => isStickerUnlocked(s, progress)).length;

  const features = [
    { id: "learn", name: "Learn", count: AxoData.worlds.length + " worlds", color: "#38bdf8", art: "learn", go: onOpenLearn, say: "Let's learn!" },
    { id: "games", name: "Games", count: "12 games", color: "#4ade80", art: "games", go: onOpenGames, say: "Let's play!" },
    { id: "adventure", name: "Adventure", count: "Ninja run!", color: "#f472b6", art: "adventure", go: onOpenAdventure, say: "Ninja time!" },
    { id: "videos", name: "Axo Rhymes", count: "Watch & sing", color: "#fb923c", art: "videos", go: onOpenVideos, say: "Sing along!" },
    { id: "trophies", name: "Trophies", count: stickersWon + " of " + AxoData.stickers.length, color: "#fbbf24", art: "trophies", go: onOpenRewards, say: "Your trophies!" },
    { id: "shop", name: "Shop", count: "Axo goodies", color: "#a78bfa", art: "shop", go: onOpenShop, say: "The shop!" },
  ];

  function openFeature(f) {
    AxoAudio.playTone("pop");
    AxoAudio.speak(f.say, { characterId });
    f.go();
  }

  return (
    <React.Fragment>
      <div className="top-bar">
        <div className="brand">
          <img className="brand-logo" src={AXO_LOGO_SRC} alt=""></img>
          Axolittles
        </div>
        <div className="spacer"></div>
        <button className="stat-cluster" onClick={() => { AxoAudio.playTone("chime"); onOpenRewards(); }} aria-label="My Trophies">
          <span className="mini-stat" style={{ "--c": "#f59e0b" }}>
            <StarIcon></StarIcon>{stars}
          </span>
          <span className="mini-stat" style={{ "--c": "#ef4444" }}>
            <span className="mini-ico"><StickerGlyph name="fire"></StickerGlyph></span>{streak}
          </span>
          <span className="mini-stat" style={{ "--c": "#7c3aed" }}>
            <span className="mini-ico"><StickerGlyph name="trophy"></StickerGlyph></span>Lv {level}
          </span>
        </button>
        <button className="btn3d voice-btn" onClick={onOpenVoices} aria-label="Choose your teacher voice">
          <CharFace kind={char.kind}></CharFace>
          <span className="listen-tag">Voice</span>
        </button>
        <button
          className="btn3d btn-round"
          style={{ width: 64, height: 64 }}
          onClick={() => { AxoAudio.playTone("pop"); onOpenParents(); }}
          aria-label="Grown-ups"
        >
          <Icon name="gear" fill="#3b2f5e"></Icon>
        </button>
      </div>

      <div className="hero-row">
        <div className="hero-left">
          <video className="hero-mascot" src={AxoData.teacherAxoVideo} autoPlay loop muted playsInline></video>
          <h1 className="hero-title">Hi, friend!</h1>
          <p className="hero-sub">Learn, play and sing<br></br>with Axo &amp; pals</p>
          <button className="btn3d btn-gold hero-cta" onClick={() => { AxoAudio.playTone("success"); AxoAudio.speak("Let's learn!", { characterId }); onOpenLearn(); }}>
            <Icon name="play" fill="#92400e"></Icon>
            Start learning
          </button>
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <button key={f.id} className="feature-card" style={{ "--c": f.color }} onClick={() => openFeature(f)} aria-label={f.name}>
              <span className="feature-art">
                {f.art === "learn" ? <span className="fart-letter">Aa</span> : null}
                {f.art === "games" ? <span className="fart-emoji">🎈</span> : null}
                {f.art === "adventure" ? <span className="fart-ninja"><img src={AXO_LOGO_SRC} alt=""></img><span className="ninja-band"></span></span> : null}
                {f.art === "videos" ? <span className="fart-tv"><span className="tv-play"></span></span> : null}
                {f.art === "trophies" ? <span className="fart-icon"><StickerGlyph name="trophy"></StickerGlyph></span> : null}
                {f.art === "shop" ? <span className="fart-icon"><Icon name="bag" fill="#fff"></Icon></span> : null}
              </span>
              <span className="feature-name">{f.name}</span>
              <span className="feature-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav nav={nav} active="home"></BottomNav>
    </React.Fragment>
  );
}

/* ── Voice picker: each teacher character = a different voice ───────────── */
function VoicePicker({ characterId, onPick, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="overlay-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-picker-title"
      >
        <h2 className="overlay-title" id="voice-picker-title">Who will read to you?</h2>
        <div className="voice-grid">
          {AxoAudio.characters.map((c) => (
            <button
              key={c.id}
              className={"voice-card" + (characterId === c.id ? " selected" : "")}
              onClick={() => onPick(c.id)}
              aria-label={"Choose " + c.name}
            >
              <CharFace kind={c.kind} size={120}></CharFace>
              <span className="voice-name" style={{ color: c.color }}>{c.name}</span>
              <span className="voice-check"><Icon name="check"></Icon></span>
            </button>
          ))}
        </div>
        <button className="overlay-close" onClick={onClose} aria-label="Close">
          <Icon name="close"></Icon>
        </button>
      </div>
    </div>
  );
}

export { HomeScreen, LearnScreen, WorldGrid, VoicePicker };
