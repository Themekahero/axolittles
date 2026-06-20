# Axolittles — Kids Shop · Learn · Play 🪼

A playful kids-brand platform for ages 2–5: a **storefront**, an immersive
**Learn** area (alphabet, numbers, colors, shapes, animals… with a real
difficulty ramp), an **arcade** + a **ninja adventure**, an auto-updating
**Axo Rhymes** video library, and a gated **Parents** dashboard — all in one
Single-Page App.

Built on **Vite 7 + React 19 + React Router 7**. Live at
**https://axolittles.io**.

---

## Quick start

Requires **Node 18+** (uses native `fetch`). Then:

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # eslint
```

> **Running locally is fully functional.** Two things are served from the live
> server in production and therefore fall back gracefully in dev (see
> [Server-side pieces](#server-side-pieces-not-in-this-repo)):
> the **Axo Rhymes** grid shows a built-in song list instead of the full
> auto-synced catalog, and lessons use the browser's built-in **text-to-speech**
> instead of the pre-recorded voice clips. Everything else is identical.

---

## What's where (the map)

| Route | What it is | Code |
|---|---|---|
| `/` | Playful homepage — hero, "Pick your adventure" cards, featured products, song thumbnails | `src/Components/KidsHome/` |
| `/shop` `/category/:slug` `/product/:slug` `/search` | The catalogue — ~110 products, 8 categories (browse-only) | `src/catalogue/` |
| `/learn` | Immersive Learn app — 11 worlds, 3-level ramp, trophies | `src/learn/LearnApp.jsx` + `src/learn/screens/` |
| `/games` | Axo arcade — ~13 tiny games (Piano, Memory Pairs, Where's Axo, Tap & Count…) | iframe → `public/games/axo-arcade/index.html` |
| `/adventure` | Axo-Ninja — canvas platformer | iframe → `public/games/axo-ninja/` |
| `/rhymes` | Axo Rhymes — the channel's full video library | `src/learn/screens/VideoRoom.jsx` |
| `/parents` | Parents dashboard (code gate → progress, goals, screen-time, voice, difficulty) | `src/learn/screens/ParentsDashboard.jsx` |
| `/about` `/contact` `/faqs` `/privacy-policy` `/terms-of-service` | Storefront + legal | `src/pages/`, `src/Components/` |

```
axolittles/
├── index.html                 # SPA entry
├── vite.config.js
├── public/
│   ├── axo-logo.svg           # mascot / favicon
│   ├── games/
│   │   ├── axo-arcade/         # ONE vanilla-JS file with all arcade mini-games
│   │   └── axo-ninja/          # canvas platformer (streams art from a CDN)
│   └── …                       # fonts, og-image, robots.txt, etc.
├── src/
│   ├── App.jsx                 # routes + immersive-vs-storefront shell
│   ├── pages/                  # route components
│   ├── Components/             # storefront UI (Navbar, Footer, KidsHome, AudioControl…)
│   ├── catalogue/              # shop data + catalogue pages
│   ├── brand.css               # design tokens (palette, fonts, focus rings)
│   └── learn/                  # ← the immersive kids app
│       ├── LearnApp.jsx        #   owns screen/world/lesson state, the scaled "stage"
│       ├── data.js             #   all lesson content (worlds, items, voice lines)
│       ├── challengeData.js    #   the Challenge-level riddles + difficulty profiles
│       ├── audio.js            #   voice (clips → TTS fallback) + sound effects
│       ├── ui.jsx              #   SVG art library + reward/sticker engine + BottomNav
│       ├── learn.css           #   all Learn styling (scoped under .axo-learn)
│       ├── GameFrame.jsx       #   iframe shell for the arcade/adventure
│       └── screens/            #   HomeHub, WorldHub, LessonScreen, ChallengeGame,
│                               #   RewardsScreen, VideoRoom, ParentsDashboard
└── _build/                     # deploy + asset-generation scripts (see Deploy)
```

---

## How the Learn area works

Opening a world shows a **3-step ramp** (a level-select `WorldHub`):

1. **Learn** — tap each item, hear its name, earn a star.
2. **Find It** — a short, no-fail recognition quiz ("Find the lion!").
3. **Challenge** — harder, per world: ABC = tap the starting letter, Numbers =
   numeral hunt, and the rest = **spoken riddles** (the teacher describes
   something; the child taps the matching picture).

The ~90 riddles were written + machine-checked to be uniquely solvable within
each world. A grown-up can set a **difficulty profile** (Explorer / Player /
Challenger) in `/parents`, which tunes round length and choice count.

- The whole Learn UI is a fixed **1280×800 "stage"** scaled to fit any screen
  (`LearnApp` + `.axo-learn--immersive`); CSS is scoped under `.axo-learn`.
- Progress lives in `localStorage`: `axolittles-progress`, `-voice`, `-goal`,
  `-settings` (shared between the Learn app and the Parents dashboard).
- Audio unlocks on the first tap (mobile/iOS require a gesture) — no "tap to
  start" gate.

---

## Server-side pieces (not in this repo)

Two things are generated/hosted on the production server, gitignored here, and
**degrade gracefully in dev**:

- **`/rhymes.json`** — the full Axo Rhymes catalog. A cron on the server runs
  `_build/fetch-rhymes.mjs` (YouTube Data API) every few hours and writes it, so
  new uploads appear automatically. `VideoRoom.jsx` fetches it at runtime; if
  missing, it falls back to the built-in list in `src/learn/data.js`.
- **`/audio/`** — pre-recorded voice clips (`manifest.json` + `*.m4a`) generated
  by `_build/gen-audio.mjs` (macOS `say`). `audio.js` **prefers a clip** for the
  exact spoken line and **falls back to browser TTS** when there isn't one. In
  dev there's no `/audio/`, so everything uses TTS.

To generate the audio clips locally (macOS only):
```bash
node _build/gen-audio.mjs        # writes ./audio-clips/ (then host at /audio/)
```

---

## Deploy

Production is a static build behind nginx on a Linux box. The flow:

```bash
npm run build                                   # → dist/
rsync -a dist/ <server>:/tmp/axo-dist/
# on the server, place it WITHOUT clobbering the server-maintained files:
sudo rsync -a --delete --exclude=rhymes.json --exclude=audio \
  /tmp/axo-dist/ /srv/dapp/axolittles/dist/
sudo systemctl reload nginx
```

Helper scripts live in `_build/` (deploy, gzip, cert issuance, the rhymes/audio
generators). **Always exclude `rhymes.json` and `audio/`** when deploying, or
`--delete` wipes the server-maintained catalog + voice clips.

nginx note: the SPA needs `try_files $uri /index.html;` (no `$uri/`), or `/games`
collides with the static `/games/` dir.

---

## Conventions & gotchas

- **Shop data is load-bearing.** `catalogue/catalogueData.js` slugs/ids back the
  `/product/:slug` links — don't renumber them.
- **Lesson images** are hosted on Cloudinary (cloud `dbtsrjssc`); drawn items
  (shapes, weather, body, vehicles) are inline SVG in `ui.jsx` — those can be
  extended with no new assets. To add fruits/animals/vegetables you need matching
  cut-out PNGs (see `ASSETS_NEEDED.md`).
- **The arcade is one file.** All `/games` mini-games live in
  `public/games/axo-arcade/index.html` (vanilla JS).
- **Axo-Ninja streams art from a CDN** at runtime, so `/adventure` needs internet.

## Known follow-ups

- Mirror the Axo-Ninja CDN art locally for offline robustness.
- Shop is browse-only (no cart/checkout — no payment provider wired).
- More fruit/animal/vegetable lessons are asset-blocked (need PNGs — see
  `ASSETS_NEEDED.md`).
- Pre-recorded clips are synthesized (macOS `say`); swap in human VO for warmth.

See `PRODUCTION_CHECKLIST.md` for the full audit history and what's been fixed.
