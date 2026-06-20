// Generates a branded 1200x630 Open Graph card (public/og-image.png) from the
// Axo mascot + brand colours, using sharp's SVG rasteriser. Run: node _build/make-og.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Inline the mascot's vector content (strip its outer <svg> wrapper).
const logo = readFileSync(join(root, "public/axo-logo.svg"), "utf8");
const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
// logo viewBox is 0 0 219 150
const S = 2.15;
const mascotW = 219 * S;
const mascotX = 1200 - mascotW - 55;
const mascotY = (630 - 150 * S) / 2 + 4;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c8edff"/>
      <stop offset="0.55" stop-color="#a5dcff"/>
      <stop offset="1" stop-color="#bdeccf"/>
    </linearGradient>
    <radialGradient id="sun" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="#fff7c2"/>
      <stop offset="0.6" stop-color="#ffd23f"/>
      <stop offset="1" stop-color="#ffb703"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="135" cy="120" r="74" fill="url(#sun)" opacity="0.95"/>
  <g fill="#ffffff" opacity="0.92">
    <ellipse cx="980" cy="90" rx="90" ry="30"/>
    <ellipse cx="1030" cy="70" rx="46" ry="30"/>
    <ellipse cx="300" cy="540" rx="80" ry="26"/>
  </g>
  <g fill="#ffffff" opacity="0.5">
    <path d="M0 560 C 240 610 480 610 720 580 C 960 552 1200 552 1200 580 L1200 630 L0 630 Z"/>
  </g>
  <text x="84" y="150" font-family="'Trebuchet MS','DejaVu Sans',sans-serif" font-size="38" font-weight="700" fill="#08a8c9" letter-spacing="3">🐾 AXOLITTLES</text>
  <text x="80" y="295" font-family="'Trebuchet MS','DejaVu Sans',sans-serif" font-size="110" font-weight="800" fill="#3b2f5e">Learn.</text>
  <text x="80" y="410" font-family="'Trebuchet MS','DejaVu Sans',sans-serif" font-size="110" font-weight="800" fill="#38bdf8">Play.</text>
  <text x="320" y="410" font-family="'Trebuchet MS','DejaVu Sans',sans-serif" font-size="110" font-weight="800" fill="#ff6fb5">Giggle.</text>
  <text x="84" y="492" font-family="'Trebuchet MS','DejaVu Sans',sans-serif" font-size="36" font-weight="600" fill="#2f4858">Shop · Learn · Play · Sing</text>
  <g transform="translate(${mascotX.toFixed(1)}, ${mascotY.toFixed(1)}) scale(${S})">${inner}</g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(root, "public/og-image.png"));
const meta = await sharp(join(root, "public/og-image.png")).metadata();
console.log("og-image.png written:", meta.width + "x" + meta.height, Math.round((meta.size || 0) / 1024) + "KB");
