// The blended "kids brand" launcher — surfaces the play + learn world alongside
// the shop on the homepage. Six clay cards link to the top-level destinations.
import { Link } from "react-router-dom";
import "./PlayLearnHub.css";

const CARDS = [
  {
    to: "/learn",
    icon: "fa-solid fa-graduation-cap",
    title: "Learn",
    sub: "11 playful worlds — ABC, numbers, colors & more.",
    accent: "#38bdf8",
    bg: "#eaf8ff",
    shadow: "rgba(8, 116, 145, 0.22)",
  },
  {
    to: "/games",
    icon: "fa-solid fa-gamepad",
    title: "Games",
    sub: "12 tiny tap-and-play games for little hands.",
    accent: "#22c55e",
    bg: "#ecfdf2",
    shadow: "rgba(21, 128, 61, 0.22)",
  },
  {
    to: "/adventure",
    icon: "fa-solid fa-person-running",
    title: "Adventure",
    sub: "Axo's ninja run — four worlds, big jumps, boss fights.",
    accent: "#f472b6",
    bg: "#fff0f7",
    shadow: "rgba(190, 24, 93, 0.2)",
  },
  {
    to: "/rhymes",
    icon: "fa-solid fa-music",
    title: "Axo Rhymes",
    sub: "Sing-along songs and friendly learning videos.",
    accent: "#fb923c",
    bg: "#fff5ea",
    shadow: "rgba(194, 65, 12, 0.2)",
  },
  {
    to: "/shop",
    icon: "fa-solid fa-bag-shopping",
    title: "Shop",
    sub: "Plushies, story books, kidswear and cheerful Axo merch.",
    accent: "#a78bfa",
    bg: "#f4f0ff",
    shadow: "rgba(91, 33, 182, 0.2)",
  },
  {
    to: "/parents",
    icon: "fa-solid fa-shield-heart",
    title: "Parents",
    sub: "Track progress, set daily goals & screen-time controls.",
    accent: "#0ea5e9",
    bg: "#eef6ff",
    shadow: "rgba(3, 105, 161, 0.2)",
  },
];

export default function PlayLearnHub() {
  return (
    <section className="play-hub" id="play-and-learn" aria-labelledby="play-hub-title">
      <div className="play-hub__inner">
        <p className="play-hub__eyebrow" data-reveal>
          One playful world
        </p>
        <h2 className="play-hub__title" id="play-hub-title" data-reveal>
          Learn, Play &amp; <span>Explore</span> with Axo
        </h2>
        <p className="play-hub__lede" data-reveal>
          Axolittles blends a cheerful kids' shop with learning worlds, mini-games,
          a ninja adventure, sing-along rhymes, and grown-up controls — all in one
          friendly place built for curious little ones.
        </p>
        <div className="play-hub__grid">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="play-card"
              data-reveal
              style={{
                "--card-accent": c.accent,
                "--card-bg": c.bg,
                "--card-shadow": c.shadow,
              }}
            >
              <span className="play-card__icon" style={{ background: c.accent }}>
                <i className={c.icon} aria-hidden="true"></i>
              </span>
              <h3 className="play-card__title">{c.title}</h3>
              <p className="play-card__sub">{c.sub}</p>
              <span className="play-card__go">
                Open <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
