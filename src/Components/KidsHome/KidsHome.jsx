// Axolittles homepage — a lively, toddler-first kids-brand landing that leads
// with play (learn / games / adventure / songs) and folds the shop in as one
// happy destination among many. Replaces the old AxoFam storefront homepage.
import { Link } from "react-router-dom";
import {
  catalogueProducts,
  getCategoryBySlug,
} from "../../catalogue/catalogueData";
import AxoData from "../../learn/data";
import "./KidsHome.css";

const LOGO = "/axo-logo.svg";

const EXPLORE = [
  { to: "/learn", emoji: "🔤", title: "Learn", sub: "11 playful worlds", bg: "#38bdf8", sh: "#1d8fd1" },
  { to: "/games", emoji: "🎈", title: "Games", sub: "12 tiny games", bg: "#34c98a", sh: "#1f9e6e" },
  { to: "/adventure", emoji: "🥷", title: "Adventure", sub: "Axo's ninja run", bg: "#ff6fb5", sh: "#db3d8f" },
  { to: "/rhymes", emoji: "🎵", title: "Axo Rhymes", sub: "Sing along", bg: "#ff8a5c", sh: "#e0673a" },
  { to: "/shop", emoji: "🧸", title: "Shop", sub: "Toys & merch", bg: "#b794f6", sh: "#8b5cf6" },
  { to: "/parents", emoji: "🛡️", title: "Parents", sub: "Grown-up controls", bg: "#4f9ef0", sh: "#2c6fc4" },
];

// A few real products from the catalogue, picked across categories for variety.
const FEATURED_CATEGORIES = [
  "plush-toys",
  "kidswear",
  "story-books",
  "school-essentials",
  "accessories",
];
const featured = FEATURED_CATEGORIES.map((cat) =>
  catalogueProducts.find((p) => p.category === cat && p.images?.length),
).filter(Boolean);

const songs = AxoData.videoTopics.flatMap((t) => t.videos).slice(0, 5);
const worlds = AxoData.worlds.slice(0, 6);

export default function KidsHome() {
  return (
    <div className="kh">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="kh-hero">
        <span className="kh-sun" aria-hidden="true" />
        <span className="kh-cloud c1" aria-hidden="true" />
        <span className="kh-cloud c2" aria-hidden="true" />
        <span className="kh-float f1" aria-hidden="true">⭐</span>
        <span className="kh-float f2" aria-hidden="true">🎈</span>
        <span className="kh-float f3" aria-hidden="true">🌈</span>
        <div className="kh-hero__inner">
          <div className="kh-hero__copy">
            <span className="kh-eyebrow">🐾 Welcome to the Axolittles world</span>
            <h1 className="kh-hero__title">
              <span className="a">Learn.</span> <span className="b">Play.</span>{" "}
              <span className="c">Giggle.</span>
            </h1>
            <p className="kh-hero__lede">
              A happy little world of learning games, sing-along songs, a ninja
              adventure, and the cuddliest Axo toys — made for tiny hands and big
              imaginations.
            </p>
            <div className="kh-hero__cta">
              <Link to="/learn" className="kh-btn kh-btn--gold">▶ Start Playing</Link>
              <Link to="/shop" className="kh-btn kh-btn--white">🛍 Shop Toys</Link>
            </div>
          </div>
          <div className="kh-hero__art">
            <img className="kh-hero__mascot" src={LOGO} alt="Axo the axolotl mascot" />
          </div>
        </div>
        <svg className="kh-hero__hills" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,48 C240,90 480,90 720,60 C960,30 1200,30 1440,56 L1440,90 L0,90 Z" fill="#fffdf7" />
        </svg>
      </section>

      {/* ── Explore ────────────────────────────────────────────── */}
      <section className="kh-explore">
        <div className="kh-wrap">
          <div className="kh-section-head">
            <h2>Pick your adventure</h2>
            <p>Tap a tile to jump into a world of play.</p>
          </div>
          <div className="kh-explore__grid">
            {EXPLORE.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="kh-card"
                style={{ background: c.bg, "--sh": c.sh }}
              >
                <span className="kh-card__emoji">{c.emoji}</span>
                <span className="kh-card__title">{c.title}</span>
                <span className="kh-card__sub">{c.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop peek ──────────────────────────────────────────── */}
      <section className="kh-shop">
        <div className="kh-wrap">
          <div className="kh-section-head">
            <h2>Fresh from the Axo Shop 🧸</h2>
            <p>Plushies, kidswear, story books and cheerful Axo merch for grown-ups to browse.</p>
          </div>
          <div className="kh-prod-row">
            {featured.map((p) => {
              const cat = getCategoryBySlug(p.category);
              return (
                <Link key={p.slug} to={`/product/${p.slug}`} className="kh-prod">
                  <img className="kh-prod__img" src={p.images[0]} alt={p.title} loading="lazy" />
                  <span className="kh-prod__body">
                    <span className="kh-prod__cat">{cat?.title || "Axo"}</span>
                    <span className="kh-prod__name">{p.baseTitle}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="kh-shop__cta">
            <Link to="/shop" className="kh-btn kh-btn--gold">See all toys &amp; merch →</Link>
          </div>
        </div>
      </section>

      {/* ── Songs ──────────────────────────────────────────────── */}
      <section className="kh-songs">
        <div className="kh-wrap">
          <div className="kh-section-head">
            <h2>Sing along with Axo 🎵</h2>
            <p>Real songs from the Axo Rhymes channel — safe, ad-light, and full of giggles.</p>
          </div>
          <div className="kh-song-row">
            {songs.map((s) => (
              <Link key={s.yt} to="/rhymes" className="kh-song" aria-label={`Watch ${s.title}`}>
                <img src={`https://i.ytimg.com/vi/${s.yt}/hqdefault.jpg`} alt="" loading="lazy" />
                <span className="kh-song__play" />
                <span className="kh-song__label">{s.title}</span>
              </Link>
            ))}
          </div>
          <div className="kh-songs__cta">
            <Link to="/rhymes" className="kh-btn kh-btn--white">Watch all songs →</Link>
          </div>
        </div>
      </section>

      {/* ── Worlds ─────────────────────────────────────────────── */}
      <section className="kh-worlds">
        <div className="kh-wrap">
          <div className="kh-section-head">
            <h2>Eleven worlds to explore 🌈</h2>
            <p>Letters, numbers, colors, animals, shapes, planets and more — one happy tap at a time.</p>
          </div>
          <div className="kh-world-row">
            {worlds.map((w) => (
              <Link
                key={w.id}
                to="/learn"
                className="kh-world"
                style={{ background: `color-mix(in oklab, ${w.tile} 22%, white)` }}
              >
                {w.cover ? (
                  <img className="kh-world__art" src={w.cover} alt="" loading="lazy" />
                ) : (
                  <span className="kh-world__art" style={{ display: "grid", placeItems: "center", fontSize: 30 }}>
                    {w.coverSymbol || "✨"}
                  </span>
                )}
                <span className="kh-world__name">{w.title}</span>
              </Link>
            ))}
          </div>
          <div className="kh-worlds__cta">
            <Link to="/learn" className="kh-btn kh-btn--gold">Explore all worlds →</Link>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section className="kh-cta">
        <span className="kh-cloud c1" aria-hidden="true" />
        <div className="kh-wrap">
          <img className="kh-cta__mascot" src={LOGO} alt="" />
          <h2>Ready to play, friend?</h2>
          <p>Jump in — Axo and the gang are waiting!</p>
          <Link to="/learn" className="kh-btn kh-btn--gold">▶ Start Playing</Link>
          <Link to="/parents" className="kh-cta__parents">Grown-ups → open Parents Control</Link>
        </div>
      </section>
    </div>
  );
}
