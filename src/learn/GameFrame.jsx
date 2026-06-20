// Reusable themed shell that embeds a self-contained static game (served from
// /public/games/*) in an iframe, with a back-to-site bar and a kid-friendly
// bottom nav for jumping between sections. Listens for the game's exit
// postMessage so the in-game "home" button returns to the site.
import React from "react";
import { useNavigate } from "react-router-dom";
import "./game-frame.css";

// Child-facing in-game nav: only play destinations. Shop & Parents are
// deliberately omitted so a child mid-game can't tap into the catalogue
// or bounce against the grown-ups gate.
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "fa-house", to: "/", pill: "#fb7185" },
  { key: "learn", label: "Learn", icon: "fa-graduation-cap", to: "/learn", pill: "#2563eb" },
  { key: "games", label: "Games", icon: "fa-gamepad", to: "/games", pill: "#22c55e" },
  { key: "adventure", label: "Adventure", icon: "fa-person-running", to: "/adventure", pill: "#ec4899" },
  { key: "videos", label: "Axo Rhymes", icon: "fa-music", to: "/rhymes", pill: "#f97316" },
];

export default function GameFrame({ title, src, exitMessage, hint, activeNav }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!exitMessage) return;
    function onMessage(e) {
      if (e.data === exitMessage) navigate("/");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [exitMessage, navigate]);

  return (
    <div className="game-frame">
      <div className="game-frame__bar">
        <button className="game-frame__back" onClick={() => navigate("/")}>
          <i className="fa-solid fa-house" aria-hidden="true"></i>
          Home
        </button>
        <span className="game-frame__title">
          <img src="/axo-logo.svg" alt="" />
          {title}
        </span>
        <span className="game-frame__spacer" />
        {hint ? <span className="game-frame__hint">{hint}</span> : null}
      </div>

      <div className="game-frame__stage">
        <iframe
          className="game-frame__iframe"
          src={src}
          title={title}
          allow="fullscreen; autoplay; gamepad"
          allowFullScreen
          /* No allow-popups / allow-top-navigation: the game physically cannot
             open external tabs or navigate the parent away (seals the dormant
             window.open escape). same-origin kept so localStorage saves work. */
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-orientation-lock allow-modals"
        />
      </div>

      <nav className="game-frame__nav" aria-label="Axolittles sections">
        {NAV_ITEMS.map((it) => (
          <button
            key={it.key}
            className={"gf-pill" + (activeNav === it.key ? " is-active" : "")}
            style={{ "--pill": it.pill }}
            onClick={() => navigate(it.to)}
            aria-label={it.label}
          >
            <span className="gf-pill__icon">
              <i className={`fa-solid ${it.icon}`} aria-hidden="true"></i>
            </span>
            <span className="gf-pill__label">{it.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
