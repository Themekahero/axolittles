# Axo Ninja

A 4-level canvas action-platformer. **Fully static** — no server, no
database, no accounts, no external links. Progress (coins, best runs,
unlocks, key bindings) is saved in the player's browser via localStorage.

## Folder layout

```
index.html      <- game entry point (open this)
client/         <- game code, styles, level data
assets/         <- sprite/tile manifests + menu art
```

## Hosting

Upload the whole folder to any static host (Netlify, GitHub Pages, S3,
or a plain web server directory). All paths are **relative**, so it works
at the site root or in any subdirectory, e.g.
`https://kids-site.example/games/axo-ninja/`.

The only requirement: serve it over HTTP(S) — opening `index.html` from
the file system won't work because the game uses ES modules.

Note: most art and audio loads from the ik.imagekit.io CDN (same as the
original game), so players need an internet connection.

## Embedding in a website

The game is landscape and fills its viewport. Embed with an iframe:

```html
<iframe
  src="/games/axo-ninja/index.html"
  style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 12px;"
  allow="fullscreen"
  title="Axo Ninja"
></iframe>
```

Use a URL ending in `/index.html` (or a path with a trailing slash) so the
game's relative asset paths resolve correctly.

## Renaming to "Axo Adventure" (or anything else)

The name appears in exactly two places:

1. `index.html` — the `<title>` tag.
2. `client/js/ui/appUi.js` — the `portal-menu-logo-text` span
   (`AXO NINJA`) and the `aria-label="Axo Ninja main menu"`.

## What was removed vs. the original Axo Quest

- All server/API code — replaced by a localStorage save
  (`client/js/api/localSave.js`, key `axo_ninja_save_v1`).
- Online leaderboard — the menu's records button now shows the player's
  own best coins/time per level.
- Social links (X / YouTube / Discord) and all external links.
- All currency branding ("AxoCoin" → "coins"); no web3/airdrop anything.
- The in-game level editor stays dormant (it required a dev server).

To reset a save while testing: in the browser console run
`localStorage.removeItem("axo_ninja_save_v1")` and reload.

## Notes

- Hero sprites ship locally (`assets/sprites/hero/`). The rest of the art,
  audio, and tiles still load from the ik.imagekit.io CDN; if you want the
  game to be fully self-hosted, those URLs (in `client/js/core/assets.js`,
  `client/js/config/*.js`, `client/styles.css`, and `assets/*/manifest.json`)
  would need the same treatment.
- The save is per-browser localStorage. If the game is open in two tabs at
  once, the last tab to save wins (coins and records are merge-guarded and
  only ever grow, so nothing is lost — but avoid two tabs playing at once).
