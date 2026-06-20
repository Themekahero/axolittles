# Axolittles — Kids Shop · Learn · Play

A unified kids brand platform that blends the **AxoFam storefront** (rebranded to
Axolittles) with the **Kids Learning Platform** design + features, the
**Axo‑Ninja adventure game**, and a net‑new **Parents Control** dashboard.

Built on **Vite 7 + React 19 + React Router 7** (single SPA). The original shop
data and commerce pages are preserved verbatim; the learning experience was
ported from a no‑build Babel‑in‑browser prototype into real ES‑module React
components; the two arcade games run as self‑contained static bundles in iframes.

```bash
npm install
npm run dev      # http://localhost:5173 (or the --port you pass)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Routes

| Path | What it is | Source of truth |
|---|---|---|
| `/` | **Playful kids-brand homepage** — hero + "Pick your adventure" cards + featured products + real song thumbnails + worlds + CTA | `Components/KidsHome/` |
| `/shop` `/category/:slug` `/product/:slug` `/search` | The full catalogue — **110 products, 8 categories, 18 types** (kept intact) | `catalogue/catalogueData.js` |
| `/learn` | Immersive learning app — 11 worlds, tap‑to‑learn lessons w/ TTS, FindIt quiz, Trophies | `learn/LearnApp.jsx` + `learn/screens/*` |
| `/games` | 12‑game arcade (Balloon Pop, Animal Match, Memory Pairs, …) | iframe → `public/games/axo-arcade/` |
| `/adventure` | **Axo Adventure** — 4‑world ninja‑run platformer | iframe → `public/games/axo-ninja/` |
| `/rhymes` | Axo Rhymes — real songs from the official YouTube channel (rel=0, same-channel only) | `learn/screens/VideoRoom.jsx` |
| `/parents` | **Parents Control** dashboard (gate → progress, goals, screen‑time, voice, purchase gating) | `learn/screens/ParentsDashboard.jsx` |
| `/about` `/contact` `/faqs` `/privacy-policy` `/terms-of-service` | Storefront content + legal | unchanged from AxoFam |

The kids routes (`/learn`, `/games`, `/adventure`, `/rhymes`, `/parents`) render
full‑screen without the site nav/footer for an immersive feel. The nav is slimmed
to **Shop** + **Play & Learn**; dead/coming‑soon sections (cart, wishlist,
collections, blog, axo‑studio, axo‑game, etc.) were removed and now 404.
Axo Rhymes pulls the **Axo Rhymes** channel (`UC4H2mCujSLwz3H9It75-S4A`): 15 RSS
songs as cards + a "Play all" that streams the uploads playlist; all embeds use
`youtube-nocookie` + `rel=0` so only Axo Rhymes videos are ever recommended.

## Architecture notes

- **Shop preserved verbatim.** `catalogue/catalogueData.js` (categories, product
  groups, bundle `imageNumbers`, Cloudinary image URLs, slugs/ids) is untouched —
  slugs and ids are load‑bearing for `/product/:slug` links.
- **Learning ported to native React.** `learn/data.js`, `learn/audio.js` (Web
  Speech voices + WebAudio tones) and `learn/ui.jsx` (the SVG art library +
  reward/streak/sticker engine) are ES modules. Screens live under
  `learn/screens/`. The immersive 1280×800 "stage" is scaled responsively by
  `LearnApp` (`.axo-learn--immersive`).
- **Scoped styling.** All learning CSS lives under `.axo-learn` (`learn/learn.css`,
  `screens/parents.css`) so it never leaks into the storefront/Bootstrap styles.
- **Games embedded as static bundles.** `public/games/axo-arcade/` (vanilla HTML)
  and `public/games/axo-ninja/` (vanilla ES‑module canvas engine) are served as‑is
  and embedded via `learn/GameFrame.jsx`, which listens for each game's exit
  `postMessage` to return to `/learn`.
- **Shared progress.** `LearnApp` and `ParentsDashboard` read/write the same
  `localStorage` keys: `axolittles-progress`, `axolittles-voice`,
  `axolittles-goal`, `axolittles-settings`.
- **Branding.** Brand is "Axolittles" throughout; the navbar/footer/favicon use the
  Axo mascot (`public/axo-logo.svg`). The blog/admin still defaults to the original
  backend (`VITE_BLOG_API_URL`, default `axofamserver.onrender.com`) — set the env
  var to repoint it.

## Known follow‑ups (not blockers)

1. **Axo‑Ninja CDN assets.** The ninja game streams ~369 art/audio files from
   `ik.imagekit.io`; it needs internet to run. For an offline‑robust install,
   mirror those assets into `public/games/axo-ninja/assets/` and rewrite the URLs
   (concentrated in the 3 `manifest.json` files, `config/*.js`, `assets.js`,
   `styles.css`).
2. **Social `og:image`.** Currently points at `axolittles.com/axo-logo.svg`
   (SVG); replace with a proper branded raster (PNG/JPG) before launch — some
   platforms don't render SVG share images.
3. **Screen‑time limit** in Parents Control is display‑only (a friendly reminder),
   not an enforced lock — wire enforcement if desired.
4. **Shop is browse‑only.** Cart/checkout/track‑order were removed (no payment
   provider was ever wired); the catalogue is a beautiful browsable showcase with
   "Coming soon" product CTAs. Wire a cart + payments when inventory is ready.
