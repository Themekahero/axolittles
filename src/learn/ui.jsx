// AxoLearn v2 — shared UI: icons, character faces, scenery, celebration
import React from "react";
import AxoData from "./data";
import AxoAudio from "./audio";
import "./game-frame.css"; // shared bottom-nav styling (same bar as the games/adventure frame)
const { useState, useEffect, useRef, useMemo } = React;

/* ── Icons (UI glyphs only) ─────────────────────────────────────────────── */
function Icon({ name, fill = "currentColor" }) {
  const paths = {
    home: "M12 3 2.5 11h2.7v8.5h5.3v-5.6h3v5.6h5.3V11h2.7L12 3z",
    star: "M12 2.2 14.8 8.4 21.5 9.1 16.5 13.6 17.9 20.2 12 16.8 6.1 20.2 7.5 13.6 2.5 9.1 9.2 8.4 12 2.2z",
    speaker: "M4 9.5v5h3.6L13 19V5L7.6 9.5H4zm12.2 2.5c0-1.6-.9-3-2.2-3.7v7.4c1.3-.7 2.2-2.1 2.2-3.7zm-2.2-7v2.1c2.4.8 4.1 3 4.1 4.9s-1.7 4.1-4.1 4.9v2.1c3.5-.9 6.1-3.8 6.1-7s-2.6-6.1-6.1-7z",
    play: "M8 5.5v13l11-6.5L8 5.5z",
    pause: "M7 5h3.6v14H7V5zm6.4 0H17v14h-3.6V5z",
    arrowLeft: "M15.5 4.5 8 12l7.5 7.5 2-2L12 12l5.5-5.5-2-2z",
    arrowRight: "M8.5 4.5 16 12l-7.5 7.5-2-2L12 12 6.5 6.5l2-2z",
    check: "M9.6 16.6 5 12l-1.8 1.8 6.4 6.4L21 8.8 19.2 7l-9.6 9.6z",
    close: "M6 4.6 4.6 6 10.6 12 4.6 18 6 19.4 12 13.4 18 19.4 19.4 18 13.4 12 19.4 6 18 4.6 12 10.6 6 4.6z",
    gear: "M12 8.4A3.6 3.6 0 1 0 12 15.6 3.6 3.6 0 0 0 12 8.4zm8.9 5.4.1-1.8-2.2-1.1a7 7 0 0 0-.7-1.6l.8-2.3-1.3-1.3-2.3.8a7 7 0 0 0-1.6-.7L12.6 3.6h-1.8L9.7 5.8a7 7 0 0 0-1.6.7l-2.3-.8-1.3 1.3.8 2.3a7 7 0 0 0-.7 1.6l-2.2 1.1v1.8l2.2 1.1c.2.6.4 1.1.7 1.6l-.8 2.3 1.3 1.3 2.3-.8c.5.3 1 .5 1.6.7l1.1 2.2h1.8l1.1-2.2a7 7 0 0 0 1.6-.7l2.3.8 1.3-1.3-.8-2.3c.3-.5.5-1 .7-1.6l2.2-1.1z",
    trophy: "M6 3h12v2h3v3c0 2.4-1.8 4.4-4.2 4.9A6 6 0 0 1 13 16.7V19h3v2H8v-2h3v-2.3a6 6 0 0 1-3.8-3.8C4.8 12.4 3 10.4 3 8V5h3V3zm-1 4v1c0 1.2.7 2.2 1.7 2.7A9 9 0 0 1 6 8V7H5zm14 0h-1v1c0 .9-.2 1.8-.7 2.7 1-.5 1.7-1.5 1.7-2.7V7z",
    music: "M9 3v10.6a3.5 3.5 0 1 0 2 3.2V7h7V3H9z",
    gamepad: "M7 8h10a5 5 0 0 1 5 5 4 4 0 0 1-7.2 2.4l-.5-.6a1.6 1.6 0 0 0-1.3-.6h-1.9c-.5 0-1 .2-1.3.6l-.5.6A4 4 0 0 1 2 13a5 5 0 0 1 5-5zm-1.4 2.6v1.4H4.2v1.6h1.4v1.4h1.6v-1.4h1.4v-1.6H7.2v-1.4H5.6zM15.5 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm2.5 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
    bag: "M7 7V6a5 5 0 0 1 10 0v1h3l1 14H3L4 7h3zm2 0h6V6a3 3 0 0 0-6 0v1zM7 9H5.8l-.7 10h13.8l-.7-10H17v2h-2V9H9v2H7V9z",
    lock: "M6 10V8a6 6 0 0 1 12 0v2h1.5v11h-15V10H6zm2 0h8V8a4 4 0 0 0-8 0v2zm4 4a1.6 1.6 0 0 0-.8 3v2.2h1.6V17a1.6 1.6 0 0 0-.8-3z",
    book: "M12 5.2C10.6 4 8.6 3.4 6.5 3.4c-1.3 0-2.6.2-3.5.7v14.4c.9-.4 2.2-.7 3.5-.7 2.1 0 4.1.6 5.5 1.8 1.4-1.2 3.4-1.8 5.5-1.8 1.3 0 2.6.2 3.5.7V4.1c-.9-.4-2.2-.7-3.5-.7-2.1 0-4.1.6-5.5 1.8zm0 2.3v10c1.5-.8 3.4-1.2 5.5-1.2.9 0 1.7.1 2.5.3V5.5c-.8-.2-1.6-.3-2.5-.3-2.2 0-4.2.7-5.5 2.3z",
  };
  return (
    <svg viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d={paths[name] || paths.star}></path>
    </svg>
  );
}

function StarIcon({ color = "#fbbf24" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.2 14.8 8.4 21.5 9.1 16.5 13.6 17.9 20.2 12 16.8 6.1 20.2 7.5 13.6 2.5 9.1 9.2 8.4 12 2.2z"
        fill={color} stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round"
      ></path>
    </svg>
  );
}

/* ── Voice character faces — simple friendly icon-level art ─────────────── */
const AXO_LOGO_SRC = "/axo-logo.svg";
function CharFace({ kind, size = 100 }) {
  // The Axo character uses the real brand mascot logo, fully visible.
  if (kind === "axolotl") {
    return (
      <img
        className="char-face axo-logo"
        src={AXO_LOGO_SRC}
        alt=""
        style={{ width: size, height: size, objectFit: "contain" }}
      ></img>
    );
  }
  const faces = {
    axolotl: (
      <g>
        {/* gills */}
        {[-1, 1].map((s) =>
          [0, 1, 2].map((i) => (
            <ellipse key={s + "-" + i} cx={50 + s * (38 + i * 2)} cy={28 + i * 14}
              rx="10" ry="5" fill="#f472b6"
              transform={`rotate(${s * (20 + i * 18)} ${50 + s * 38} ${28 + i * 14})`}></ellipse>
          ))
        )}
        <circle cx="50" cy="50" r="34" fill="#ffd5dc"></circle>
        <circle cx="38" cy="46" r="4.5" fill="#3b2f5e"></circle>
        <circle cx="62" cy="46" r="4.5" fill="#3b2f5e"></circle>
        <circle cx="32" cy="56" r="5" fill="#fda4af" opacity="0.7"></circle>
        <circle cx="68" cy="56" r="5" fill="#fda4af" opacity="0.7"></circle>
        <path d="M40 60 Q50 70 60 60" stroke="#3b2f5e" strokeWidth="3.4" fill="none" strokeLinecap="round"></path>
      </g>
    ),
    bunny: (
      <g>
        <ellipse cx="36" cy="20" rx="9" ry="20" fill="#ede9fe"></ellipse>
        <ellipse cx="64" cy="20" rx="9" ry="20" fill="#ede9fe"></ellipse>
        <ellipse cx="36" cy="22" rx="4.5" ry="13" fill="#c4b5fd"></ellipse>
        <ellipse cx="64" cy="22" rx="4.5" ry="13" fill="#c4b5fd"></ellipse>
        <circle cx="50" cy="56" r="30" fill="#ede9fe"></circle>
        <circle cx="40" cy="52" r="4.5" fill="#3b2f5e"></circle>
        <circle cx="60" cy="52" r="4.5" fill="#3b2f5e"></circle>
        <ellipse cx="50" cy="62" rx="5" ry="4" fill="#a78bfa"></ellipse>
        <path d="M50 66 Q46 72 41 70 M50 66 Q54 72 59 70" stroke="#3b2f5e" strokeWidth="3" fill="none" strokeLinecap="round"></path>
      </g>
    ),
    bear: (
      <g>
        <circle cx="28" cy="30" r="12" fill="#d97706"></circle>
        <circle cx="72" cy="30" r="12" fill="#d97706"></circle>
        <circle cx="28" cy="30" r="6" fill="#fde68a"></circle>
        <circle cx="72" cy="30" r="6" fill="#fde68a"></circle>
        <circle cx="50" cy="54" r="32" fill="#f59e0b"></circle>
        <circle cx="40" cy="48" r="4.5" fill="#3b2f5e"></circle>
        <circle cx="60" cy="48" r="4.5" fill="#3b2f5e"></circle>
        <ellipse cx="50" cy="64" rx="14" ry="11" fill="#fde68a"></ellipse>
        <ellipse cx="50" cy="60" rx="5.5" ry="4.5" fill="#3b2f5e"></ellipse>
        <path d="M44 68 Q50 73 56 68" stroke="#3b2f5e" strokeWidth="3" fill="none" strokeLinecap="round"></path>
      </g>
    ),
    robot: (
      <g>
        <line x1="50" y1="8" x2="50" y2="20" stroke="#64748b" strokeWidth="4"></line>
        <circle cx="50" cy="8" r="6" fill="#f43f5e"></circle>
        <rect x="18" y="20" width="64" height="56" rx="16" fill="#bae6fd"></rect>
        <rect x="26" y="30" width="48" height="26" rx="11" fill="#0c4a6e"></rect>
        <circle cx="40" cy="43" r="6" fill="#7dd3fc"></circle>
        <circle cx="60" cy="43" r="6" fill="#7dd3fc"></circle>
        <rect x="34" y="62" width="32" height="7" rx="3.5" fill="#0ea5e9"></rect>
        <circle cx="14" cy="48" r="6" fill="#7dd3fc"></circle>
        <circle cx="86" cy="48" r="6" fill="#7dd3fc"></circle>
      </g>
    ),
  };
  return (
    <svg className="char-face" viewBox="0 0 100 100" style={{ width: size, height: size }} aria-hidden="true">
      {faces[kind] || faces.axolotl}
    </svg>
  );
}

/* ── Sticker icons — simple white glyphs for the reward badges ──────────── */
function StickerGlyph({ name }) {
  const p = {
    shoe: "M3 7h3l2 4c3 1 6 1.5 11 1.5 1.7 0 2 1 2 2V17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm2 5.5h2M9 13h1.5",
    star: "M12 2.5 14.8 8.6 21.5 9.3 16.5 13.8 17.9 20.4 12 17 6.1 20.4 7.5 13.8 2.5 9.3 9.2 8.6z",
    bolt: "M13 2 4 14h6l-1 8 9-12h-6z",
    trophy: "M6 3h12v2h3v3c0 2.4-1.8 4.4-4.2 4.9A6 6 0 0 1 13 16.7V19h3v2H8v-2h3v-2.3a6 6 0 0 1-3.8-3.8C4.8 12.4 3 10.4 3 8V5h3V3z",
    hash: "M9 3 7.8 9H4v2h3.4l-.8 4H3v2h3.2L5 21h2l1.2-4h4L11 21h2l1.2-4H18v-2h-3.4l.8-4H20V9h-3.2L18 3h-2l-1.2 6h-4L12 3h-2zm.8 8h4l-.8 4h-4z",
    rainbow: "M3 19a9 9 0 0 1 18 0h-2a7 7 0 0 0-14 0H3zm4 0a5 5 0 0 1 10 0h-2a3 3 0 0 0-6 0H7z",
    apple: "M12 7c1-3 3.5-3.5 5-3-0.3 2-2 3-3.5 3.2C16 7 18 9 18 13c0 4-2.5 8-4.5 8-1 0-1.2-.6-2.5-.6S9.5 21 8.5 21C6.5 21 4 17 4 13c0-4 2.5-6 6-5.8C11 7 11.5 7 12 7z",
    paw: "M6 13a2.2 2.2 0 1 1 0-.01zM10 9a2.2 2.2 0 1 1 0-.01zM14 9a2.2 2.2 0 1 1 0-.01zM18 13a2.2 2.2 0 1 1 0-.01zM12 13c2.5 0 4.5 2 4.5 4.2 0 1.5-1.3 2.3-2.8 2.3-.9 0-1-.4-1.7-.4s-.8.4-1.7.4c-1.5 0-2.8-.8-2.8-2.3C7.5 15 9.5 13 12 13z",
    shapes: "M12 2.5 15 8H9zM4 13h6v7H4zm9.5 3.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0z",
    sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5v3m0 14v3M2 12h3m14 0h3M4.5 4.5l2 2m11 11 2 2m0-15-2 2m-11 11-2 2",
    body: "M12 2.5a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM8 9h8l-1.5 6H14v6h-1.5v-5h-1V21H10v-6H9.5z",
    rocket: "M12 2c3 2 5 6 5 10l2 2v2l-3-1-1.5 1.5h-5L12 18l-3 1v-2l2-2c0-4 2-8 5-10zm0 7a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 12 9z",
    planet: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm8.5 4.5c1.5 1.2 2 2.3 1.5 3-.6.9-2.6.8-5.2-.1m-9.6 5.6c-3 1-5.2 1.2-5.8.2-.5-.8.1-2 1.6-3.3",
    medal: "M8 2h8l-2 7H10zM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3 1.2 2.4 2.6.3-1.9 1.8.5 2.6L12 17.9l-2.4 1.2.5-2.6-1.9-1.8 2.6-.3z",
    target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    fire: "M12 2c1 3-1 4.5-1 7 0-1.5-1.5-2.5-1.5-2.5C7 8 6 10.5 6 13a6 6 0 0 0 12 0c0-3-2-5.5-3.5-7.5C14 7 13.5 4.5 12 2z",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={p[name] || p.star} fill="#fff" stroke="#fff" strokeWidth="0.4" strokeLinejoin="round"></path>
    </svg>
  );
}

/* ── Rewards logic ──────────────────────────────────────────────────────── */
function totalStars(progress) {
  return AxoData.worlds.reduce(
    (n, w) => n + Object.keys(progress.completed?.[w.id] ?? {}).length, 0
  );
}
function lessonsDone(progress) {
  return totalStars(progress);
}
function worldComplete(progress, id) {
  const w = AxoData.worldMap[id];
  if (!w) return false;
  return Object.keys(progress.completed?.[id] ?? {}).length >= w.lessons.length;
}
function levelFor(stars) {
  return Math.floor(stars / 20) + 1;
}
// Level progression lives in a SEPARATE namespace (progress.levels) so the
// existing progress.completed map — which drives totalStars, world-tile
// done/total, worldComplete and the world/star stickers — keeps its meaning.
function findLevelsDone(progress) {
  const lv = progress.levels || {};
  return Object.keys(lv).filter((k) => lv[k] && lv[k].findit).length;
}
function challengeLevelsDone(progress) {
  const lv = progress.levels || {};
  return Object.keys(lv).filter((k) => lv[k] && lv[k].challenge).length;
}
function isStickerUnlocked(sticker, progress) {
  const r = sticker.rule;
  if (r.type === "lessons") return lessonsDone(progress) >= r.n;
  if (r.type === "stars") return totalStars(progress) >= r.n;
  if (r.type === "world") return worldComplete(progress, r.id);
  if (r.type === "quizWins") return (progress.quizWins ?? 0) >= r.n;
  if (r.type === "daily") return (progress.everHitDaily ?? false);
  if (r.type === "streak") return (progress.streak?.count ?? 0) >= r.n;
  if (r.type === "findLevels") return findLevelsDone(progress) >= r.n;
  if (r.type === "challengeLevels") return challengeLevelsDone(progress) >= r.n;
  return false;
}

/* ── Scenery ────────────────────────────────────────────────────────────── */
/* ── Shape & weather art — geometric, friendly faces, no images needed ──── */
function ShapeFace({ x = 50, y = 50, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="-10" cy="-4" r="4" fill="#3b2f5e"></circle>
      <circle cx="10" cy="-4" r="4" fill="#3b2f5e"></circle>
      <path d="M-8 6 Q0 14 8 6" stroke="#3b2f5e" strokeWidth="3.2" fill="none" strokeLinecap="round"></path>
    </g>
  );
}

function ShapeArt({ kind, size = 200 }) {
  const ss = { stroke: "#fff", strokeWidth: 5, strokeLinejoin: "round" };
  const cloudShape = (fill, edge = "#94a3b8") => (
    <g transform="translate(7 -18) scale(0.82)">
      <path d="M25 60 a20 20 1 0 0 0 40 h50 a20 20 1 0 0 9 -38 a35 35 1 0 0 -67 -2 z"
        fill={fill} stroke={edge} strokeWidth="4.5" strokeLinejoin="round"></path>
    </g>
  );
  const art = {
    circle: <g><circle cx="50" cy="50" r="40" fill="#f43f5e" {...ss}></circle><ShapeFace y={52}></ShapeFace></g>,
    square: <g><rect x="12" y="12" width="76" height="76" rx="12" fill="#3b82f6" {...ss}></rect><ShapeFace y={52}></ShapeFace></g>,
    triangle: <g><path d="M50 10 L92 86 L8 86 Z" fill="#22c55e" {...ss}></path><ShapeFace y={64} scale={0.9}></ShapeFace></g>,
    star: <g><path d="M50 6 L61.8 34.2 L92.4 37.2 L69.3 57.6 L76.6 87.4 L50 71.4 L23.4 87.4 L30.7 57.6 L7.6 37.2 L38.2 34.2 Z" fill="#fbbf24" {...ss}></path><ShapeFace y={50} scale={0.85}></ShapeFace></g>,
    heart: <g><path d="M50 88 C20 64 8 44 17 29 C26 14 44 17 50 32 C56 17 74 14 83 29 C92 44 80 64 50 88 Z" fill="#ec4899" {...ss}></path><ShapeFace y={46} scale={0.9}></ShapeFace></g>,
    rectangle: <g><rect x="24" y="8" width="52" height="84" rx="10" fill="#8b5cf6" {...ss}></rect><ShapeFace y={50} scale={0.85}></ShapeFace></g>,
    oval: <g><ellipse cx="50" cy="50" rx="30" ry="42" fill="#06b6d4" {...ss}></ellipse><ShapeFace y={50} scale={0.9}></ShapeFace></g>,
    diamond: <g><path d="M50 6 L90 50 L50 94 L10 50 Z" fill="#f97316" {...ss}></path><ShapeFace y={50} scale={0.85}></ShapeFace></g>,
    moon: <g><path d="M62 8 A 43 43 0 1 0 62 92 A 35 35 0 1 1 62 8 Z" fill="#fde047" {...ss}></path><ShapeFace x={38} y={52} scale={0.8}></ShapeFace></g>,
    sunny: (
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={50 + Math.cos(a) * 33} y1={50 + Math.sin(a) * 33}
            x2={50 + Math.cos(a) * 45} y2={50 + Math.sin(a) * 45}
            stroke="#fbbf24" strokeWidth="7" strokeLinecap="round"></line>;
        })}
        <circle cx="50" cy="50" r="26" fill="#fde047" {...ss}></circle>
        <ShapeFace y={52} scale={0.7}></ShapeFace>
      </g>
    ),
    cloudy: <g>{cloudShape("#f8fafc")}<ShapeFace y={40} scale={0.8}></ShapeFace></g>,
    rainy: (
      <g>
        {cloudShape("#e2e8f0")}
        {[34, 52, 70].map((x, i) => (
          <path key={x} d={`M${x} 70 q7 11 0 16 q-7 -5 0 -16`} fill="#0ea5e9"
            opacity={0.95 - i * 0.1}></path>
        ))}
      </g>
    ),
    rainbow: (
      <g fill="none" strokeLinecap="round">
        <path d="M10 82 A40 40 0 0 1 90 82" stroke="#ef4444" strokeWidth="9"></path>
        <path d="M19 82 A31 31 0 0 1 81 82" stroke="#fbbf24" strokeWidth="9"></path>
        <path d="M28 82 A22 22 0 0 1 72 82" stroke="#22c55e" strokeWidth="9"></path>
        <path d="M37 82 A13 13 0 0 1 63 82" stroke="#3b82f6" strokeWidth="9"></path>
      </g>
    ),
    snowy: (
      <g>
        {cloudShape("#f1f5f9")}
        {[32, 50, 68].map((x, i) => (
          <g key={x} stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round"
            transform={`translate(${x} ${74 + (i % 2) * 9})`}>
            <line x1="-6" y1="0" x2="6" y2="0"></line>
            <line x1="0" y1="-6" x2="0" y2="6"></line>
            <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5"></line>
            <line x1="-4.5" y1="4.5" x2="4.5" y2="-4.5"></line>
          </g>
        ))}
      </g>
    ),
    windy: (
      <g fill="none" stroke="#0ea5e9" strokeWidth="7" strokeLinecap="round">
        <path d="M10 36 H58 a10 10 0 1 0 -10 -17"></path>
        <path d="M8 56 H74 a11 11 0 1 1 -11 19"></path>
        <path d="M16 76 H50 a8 8 0 1 0 -8 -13"></path>
      </g>
    ),
    stormy: (
      <g>
        {cloudShape("#64748b", "#475569")}
        <path d="M54 56 L40 78 H50 L44 96 L68 70 H56 L64 56 Z" fill="#fde047"
          stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"></path>
      </g>
    ),
    // ── Body parts ──
    head: (
      <g>
        <circle cx="50" cy="52" r="34" fill="#fcd9b8" stroke="#c98a5e" strokeWidth="4"></circle>
        <path d="M16 44 a34 30 1 0 1 68 0 q-34 -22 -68 0 z" fill="#8b5a2b" stroke="#6b4423" strokeWidth="3" strokeLinejoin="round"></path>
        <circle cx="40" cy="52" r="4" fill="#3b2f5e"></circle>
        <circle cx="60" cy="52" r="4" fill="#3b2f5e"></circle>
        <circle cx="34" cy="60" r="4.5" fill="#f9a8b4" opacity="0.7"></circle>
        <circle cx="66" cy="60" r="4.5" fill="#f9a8b4" opacity="0.7"></circle>
        <path d="M40 66 Q50 74 60 66" stroke="#b85c5c" strokeWidth="3.4" fill="none" strokeLinecap="round"></path>
      </g>
    ),
    eyes: (
      <g>
        {[32, 68].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="50" rx="19" ry="14" fill="#fff" stroke="#3b2f5e" strokeWidth="4"></ellipse>
            <circle cx={cx} cy="50" r="9" fill="#5b8def"></circle>
            <circle cx={cx} cy="50" r="4.5" fill="#1e293b"></circle>
            <circle cx={cx + 3} cy="47" r="2" fill="#fff"></circle>
            <path d={`M${cx - 17} 38 Q${cx} 30 ${cx + 17} 38`} stroke="#3b2f5e" strokeWidth="4" fill="none" strokeLinecap="round"></path>
          </g>
        ))}
      </g>
    ),
    ears: (
      <g>
        <path d="M38 22 q-26 4 -22 36 q4 26 30 22 q-18 -10 -16 -30 q2 -22 8 -28 z"
          fill="#fcd9b8" stroke="#c98a5e" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M28 42 q10 -6 12 8 q2 12 -8 16" fill="none" stroke="#c98a5e" strokeWidth="3.5" strokeLinecap="round"></path>
        <path d="M62 22 q26 4 22 36 q-4 26 -30 22 q18 -10 16 -30 q-2 -22 -8 -28 z"
          fill="#fcd9b8" stroke="#c98a5e" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M72 42 q-10 -6 -12 8 q-2 12 8 16" fill="none" stroke="#c98a5e" strokeWidth="3.5" strokeLinecap="round"></path>
      </g>
    ),
    nose: (
      <g>
        <path d="M50 14 q-12 26 -18 44 q-2 16 18 16 q20 0 18 -16 q-6 -18 -18 -44 z"
          fill="#fcd9b8" stroke="#c98a5e" strokeWidth="4" strokeLinejoin="round"></path>
        <ellipse cx="40" cy="66" rx="5" ry="7" fill="#b07a52"></ellipse>
        <ellipse cx="60" cy="66" rx="5" ry="7" fill="#b07a52"></ellipse>
      </g>
    ),
    mouth: (
      <g>
        <path d="M14 46 Q50 28 86 46 Q68 84 50 84 Q32 84 14 46 z"
          fill="#e2566f" stroke="#a3344a" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M22 48 Q50 40 78 48" fill="#fff"></path>
        <path d="M22 48 Q50 40 78 48 L78 56 Q50 50 22 56 Z" fill="#fff"></path>
        <path d="M40 70 Q50 80 60 70" fill="#ff8fa3"></path>
      </g>
    ),
    hands: (
      <g>
        {[{ x: 30, s: 1 }, { x: 70, s: -1 }].map(({ x, s }) => (
          <g key={x} transform={`translate(${x} 50) scale(${s} 1)`}>
            <rect x="-14" y="-2" width="28" height="30" rx="12" fill="#fcd9b8" stroke="#c98a5e" strokeWidth="3.5"></rect>
            {[-10, -3.5, 3, 9.5].map((fx, i) => (
              <rect key={i} x={fx - 2.5} y={-26 + (i === 0 || i === 3 ? 6 : 0)} width="5.5" height="30" rx="3"
                fill="#fcd9b8" stroke="#c98a5e" strokeWidth="3"></rect>
            ))}
            <rect x="-22" y="4" width="12" height="7" rx="3.5" fill="#fcd9b8" stroke="#c98a5e" strokeWidth="3"></rect>
          </g>
        ))}
      </g>
    ),
    tummy: (
      <g>
        <rect x="22" y="14" width="56" height="72" rx="26" fill="#fcd9b8" stroke="#c98a5e" strokeWidth="4"></rect>
        <circle cx="50" cy="54" r="5" fill="#c98a5e"></circle>
        <path d="M38 70 Q50 78 62 70" stroke="#c98a5e" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"></path>
      </g>
    ),
    feet: (
      <g>
        {[{ x: 34, s: 1 }, { x: 66, s: -1 }].map(({ x, s }) => (
          <g key={x} transform={`translate(${x} 50) scale(${s} 1)`}>
            <path d="M-10 -26 q-8 0 -8 16 v18 q0 14 16 14 q14 0 14 -10 q0 -8 -8 -10 q-6 -2 -6 -10 v-16 q0 -2 -8 -2 z"
              fill="#fcd9b8" stroke="#c98a5e" strokeWidth="3.5" strokeLinejoin="round"></path>
            {[0, 4, 8, 12, 16].map((ty, i) => (
              <circle key={i} cx={-2 + ty * 0.7} cy={20 - i * 0.5} r={3.4 - i * 0.3} fill="#fcd9b8" stroke="#c98a5e" strokeWidth="2.5"></circle>
            ))}
          </g>
        ))}
      </g>
    ),
    // ── Vehicles ──
    car: (
      <g>
        <path d="M10 64 L18 44 Q22 38 30 38 L70 38 Q78 38 82 44 L90 64 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M30 44 L34 54 H48 V44 Z M52 44 V54 H66 L62 44 Z" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></path>
        <rect x="6" y="60" width="88" height="10" rx="5" fill="#dc2626"></rect>
        <circle cx="30" cy="72" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="30" cy="72" r="4" fill="#cbd5e1"></circle>
        <circle cx="70" cy="72" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="70" cy="72" r="4" fill="#cbd5e1"></circle>
      </g>
    ),
    bus: (
      <g>
        <rect x="10" y="26" width="80" height="46" rx="10" fill="#f59e0b" stroke="#b45309" strokeWidth="4"></rect>
        {[20, 38, 56].map((x) => (
          <rect key={x} x={x} y="34" width="14" height="14" rx="3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        ))}
        <rect x="72" y="34" width="12" height="30" rx="3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        <rect x="10" y="56" width="80" height="8" fill="#ea580c"></rect>
        <circle cx="30" cy="74" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="70" cy="74" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
      </g>
    ),
    truck: (
      <g>
        <rect x="6" y="34" width="50" height="34" rx="6" fill="#22c55e" stroke="#15803d" strokeWidth="4"></rect>
        <path d="M56 44 H74 L88 56 V68 H56 Z" fill="#16a34a" stroke="#15803d" strokeWidth="4" strokeLinejoin="round"></path>
        <rect x="60" y="48" width="16" height="12" rx="2" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        <circle cx="28" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="72" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
      </g>
    ),
    train: (
      <g>
        <rect x="14" y="24" width="48" height="48" rx="10" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="4"></rect>
        <rect x="62" y="40" width="24" height="32" rx="6" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"></rect>
        <rect x="22" y="32" width="32" height="18" rx="4" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        <circle cx="68" cy="34" r="7" fill="#fff" stroke="#cbd5e1" strokeWidth="2"></circle>
        <rect x="10" y="72" width="80" height="6" rx="3" fill="#64748b"></rect>
        <circle cx="30" cy="80" r="7" fill="#1e293b"></circle>
        <circle cx="50" cy="80" r="7" fill="#1e293b"></circle>
        <circle cx="72" cy="80" r="7" fill="#1e293b"></circle>
      </g>
    ),
    bicycle: (
      <g fill="none" stroke="#0ea5e9" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="28" cy="62" r="18"></circle>
        <circle cx="72" cy="62" r="18"></circle>
        <path d="M28 62 L46 62 L60 36 M46 62 L60 62 M72 62 L60 36 M54 36 H68"></path>
        <circle cx="50" cy="62" r="3" fill="#0ea5e9"></circle>
        <path d="M40 34 H52" stroke="#f59e0b"></path>
      </g>
    ),
    boat: (
      <g>
        <path d="M14 56 H86 L76 78 H24 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="4" strokeLinejoin="round"></path>
        <rect x="48" y="18" width="4" height="40" fill="#92400e"></rect>
        <path d="M52 20 L78 50 H52 Z" fill="#fde047" stroke="#eab308" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M48 26 L26 50 H48 Z" fill="#fff" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M10 80 q8 -6 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round"></path>
      </g>
    ),
    airplane: (
      <g>
        <path d="M12 50 Q24 42 80 44 L92 50 L80 56 Q24 58 12 50 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M44 46 L34 22 L42 22 L60 44 Z" fill="#0ea5e9" stroke="#0369a1" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M44 54 L34 78 L42 78 L60 56 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M78 44 L88 34 L90 44 Z" fill="#0ea5e9" stroke="#0369a1" strokeWidth="3" strokeLinejoin="round"></path>
        <circle cx="30" cy="50" r="4" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></circle>
        <circle cx="44" cy="50" r="4" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></circle>
      </g>
    ),
    helicopter: (
      <g>
        <ellipse cx="44" cy="56" rx="30" ry="18" fill="#f59e0b" stroke="#b45309" strokeWidth="4"></ellipse>
        <path d="M70 52 L92 50 L92 62 L70 60 Z" fill="#ea580c" stroke="#b45309" strokeWidth="3" strokeLinejoin="round"></path>
        <circle cx="36" cy="56" r="8" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></circle>
        <rect x="44" y="18" width="4" height="14" fill="#64748b"></rect>
        <rect x="14" y="16" width="64" height="6" rx="3" fill="#475569"></rect>
        <rect x="86" y="48" width="4" height="16" fill="#64748b"></rect>
        <path d="M26 78 H62 M30 74 V82 M58 74 V82" stroke="#475569" strokeWidth="4" strokeLinecap="round"></path>
      </g>
    ),
    rocket: (
      <g>
        <path d="M50 8 Q70 30 70 56 L30 56 Q30 30 50 8 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round"></path>
        <circle cx="50" cy="36" r="9" fill="#38bdf8" stroke="#0284c7" strokeWidth="3"></circle>
        <path d="M30 50 L16 64 L30 60 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M70 50 L84 64 L70 60 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" strokeLinejoin="round"></path>
        <rect x="38" y="56" width="24" height="8" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2"></rect>
        <path d="M42 64 Q50 92 58 64 Z" fill="#fb923c"></path>
        <path d="M46 64 Q50 84 54 64 Z" fill="#fde047"></path>
      </g>
    ),
    // ── More shapes ──
    pentagon: <g><path d="M50 8 L90 38 L74 86 L26 86 L10 38 Z" fill="#14b8a6" {...ss}></path><ShapeFace y={56} scale={0.82}></ShapeFace></g>,
    hexagon: <g><path d="M50 8 L87 29 L87 71 L50 92 L13 71 L13 29 Z" fill="#6366f1" {...ss}></path><ShapeFace y={50} scale={0.82}></ShapeFace></g>,
    arrow: <g><path d="M12 38 H58 V22 L92 50 L58 78 V62 H12 Z" fill="#ef4444" {...ss}></path><ShapeFace x={36} y={50} scale={0.68}></ShapeFace></g>,
    cross: <g><path d="M38 10 H62 V38 H90 V62 H62 V90 H38 V62 H10 V38 H38 Z" fill="#22c55e" {...ss}></path><ShapeFace y={50} scale={0.68}></ShapeFace></g>,
    // ── More weather ──
    foggy: (
      <g fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2">
        <rect x="14" y="26" width="64" height="12" rx="6"></rect>
        <rect x="22" y="44" width="60" height="12" rx="6" opacity="0.85"></rect>
        <rect x="10" y="62" width="66" height="12" rx="6" opacity="0.7"></rect>
        <rect x="20" y="80" width="58" height="12" rx="6" opacity="0.55"></rect>
      </g>
    ),
    night: (
      <g>
        <rect x="8" y="12" width="84" height="76" rx="22" fill="#312e81" stroke="#1e1b4b" strokeWidth="4"></rect>
        <path d="M64 26 A20 20 0 1 0 64 66 A15 15 0 1 1 64 26 Z" fill="#fde047"></path>
        <path d="M28 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#fde047"></path>
        <path d="M31 60 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="#fde047"></path>
        <path d="M22 76 l1.3 3.4 3.4 1.3 -3.4 1.3 -1.3 3.4 -1.3 -3.4 -3.4 -1.3 3.4 -1.3 z" fill="#fde047"></path>
      </g>
    ),
    // ── More vehicles ──
    firetruck: (
      <g>
        <line x1="14" y1="30" x2="58" y2="44" stroke="#cbd5e1" strokeWidth="3.5"></line>
        <rect x="6" y="34" width="58" height="34" rx="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="4"></rect>
        <path d="M64 44 H80 L92 56 V68 H64 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="4" strokeLinejoin="round"></path>
        <rect x="68" y="48" width="14" height="12" rx="2" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        <rect x="10" y="40" width="42" height="8" rx="3" fill="#fca5a5"></rect>
        <circle cx="26" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="72" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
      </g>
    ),
    tractor: (
      <g>
        <rect x="20" y="34" width="34" height="26" rx="5" fill="#22c55e" stroke="#15803d" strokeWidth="4"></rect>
        <rect x="26" y="38" width="22" height="14" rx="3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"></rect>
        <rect x="54" y="44" width="20" height="16" rx="4" fill="#16a34a" stroke="#15803d" strokeWidth="4"></rect>
        <rect x="22" y="22" width="6" height="14" rx="2" fill="#475569"></rect>
        <circle cx="64" cy="70" r="17" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
        <circle cx="64" cy="70" r="6" fill="#cbd5e1"></circle>
        <circle cx="26" cy="76" r="9" fill="#1e293b" stroke="#475569" strokeWidth="3"></circle>
      </g>
    ),
    submarine: (
      <g>
        <ellipse cx="46" cy="56" rx="38" ry="20" fill="#f59e0b" stroke="#b45309" strokeWidth="4"></ellipse>
        <rect x="40" y="28" width="16" height="14" rx="4" fill="#f59e0b" stroke="#b45309" strokeWidth="4"></rect>
        <rect x="46" y="18" width="4" height="12" fill="#64748b"></rect>
        <circle cx="50" cy="17" r="4" fill="#64748b"></circle>
        <circle cx="34" cy="56" r="7" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="3"></circle>
        <circle cx="56" cy="56" r="7" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="3"></circle>
        <path d="M84 50 l11 -6 v24 l-11 -6 z" fill="#ea580c" stroke="#b45309" strokeWidth="3" strokeLinejoin="round"></path>
        <path d="M6 84 q8 -6 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round"></path>
      </g>
    ),
    hotairballoon: (
      <g>
        <path d="M50 10 C26 10 16 30 16 46 C16 60 30 70 38 74 H62 C70 70 84 60 84 46 C84 30 74 10 50 10 Z" fill="#f472b6" stroke="#db2777" strokeWidth="4" strokeLinejoin="round"></path>
        <path d="M50 11 C42 30 42 56 45 74 M50 11 C58 30 58 56 55 74" fill="none" stroke="#db2777" strokeWidth="3"></path>
        <path d="M38 74 L35 84 M62 74 L65 84" stroke="#92400e" strokeWidth="3"></path>
        <rect x="40" y="83" width="20" height="13" rx="3" fill="#a16207" stroke="#78350f" strokeWidth="3"></rect>
      </g>
    ),
  };
  return (
    <svg className="shape-art" viewBox="0 0 100 100"
      style={{ width: size, height: size, overflow: "visible" }} aria-hidden="true">
      {art[kind] || art.circle}
    </svg>
  );
}

function Scenery({ night }) {
  const stars = useMemo(
    () => Array.from({ length: 26 }, () => ({
      left: Math.random() * 100, top: Math.random() * 70,
      delay: Math.random() * 2.4, scale: 0.5 + Math.random(),
    })),
    []
  );
  return (
    <div className="scenery" aria-hidden="true">
      {night ? (
        stars.map((s, i) => (
          <span key={i} className="night-star" style={{
            left: s.left + "%", top: s.top + "%",
            animationDelay: s.delay + "s", transform: `scale(${s.scale})`,
          }}></span>
        ))
      ) : (
        <div className="sun"></div>
      )}
      <div className="cloud c1"></div>
      <div className="cloud c2"></div>
      <div className="cloud c3"></div>
      <div className="hill left"></div>
      <div className="hill right"></div>
    </div>
  );
}

/* ── Mascot (Axo video or character face) ───────────────────────────────── */
function Mascot({ characterId, bubble }) {
  const char = AxoAudio.getCharacter(characterId);
  const [videoFailed, setVideoFailed] = useState(false);
  const useVideo = char.id === "axo" && !videoFailed;
  return (
    <div className="mascot">
      {useVideo ? (
        <video src={AxoData.teacherAxoVideo} autoPlay loop muted playsInline
          onError={() => setVideoFailed(true)}></video>
      ) : (
        <div className="mascot-face"><CharFace kind={char.kind} size={150}></CharFace></div>
      )}
      {bubble ? <div className="speech-bubble">{bubble}</div> : null}
    </div>
  );
}

/* ── Celebration: star burst + confetti ─────────────────────────────────── */
function StarBurst({ tick }) {
  const stars = useMemo(
    () => Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 180 + Math.random() * 160;
      return {
        bx: Math.cos(angle) * dist + "px",
        by: Math.sin(angle) * dist - 60 + "px",
      };
    }),
    [tick]
  );
  if (!tick) return null;
  return (
    <div className="star-burst">
      {stars.map((s, i) => (
        <span key={tick + "-" + i} className="burst-star" style={{ "--bx": s.bx, "--by": s.by }}>
          <StarIcon></StarIcon>
        </span>
      ))}
    </div>
  );
}

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#38bdf8", "#4ade80", "#a78bfa", "#fb923c"];
function Confetti({ count = 60 }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.6,
      duration: 2.6 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotate: Math.random() * 180,
    })),
    [count]
  );
  return (
    <div className="scenery" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{
          left: p.left + "%", background: p.color,
          animationDelay: p.delay + "s", animationDuration: p.duration + "s",
          rotate: p.rotate + "deg",
        }}></span>
      ))}
    </div>
  );
}

/* ── Tap hint hand ──────────────────────────────────────────────────────── */
function TapHint() {
  return (
    <div className="tap-hint" aria-hidden="true">
      <span className="hint-ripple"></span>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M10.2 11.3V5.6a1.7 1.7 0 0 1 3.4 0v5l3.9.9c1.2.3 2 1.3 2 2.5 0 .3 0 .5-.1.8l-1 3.6a2.6 2.6 0 0 1-2.5 1.9h-4.2c-.8 0-1.6-.4-2.1-1l-3.8-4.6a1.6 1.6 0 0 1 2.3-2.2l2.1 1.8z"
          fill="#fff" stroke="#3b2f5e" strokeWidth="1.6" strokeLinejoin="round"
        ></path>
      </svg>
    </div>
  );
}

/* ── Progress path ──────────────────────────────────────────────────────── */
function ProgressPath({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress-path">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + "%" }}></div>
      </div>
      <span className="path-star"><StarIcon></StarIcon></span>
      <span className="progress-count">{done}/{total}</span>
    </div>
  );
}

/* Shared kiosk bottom navigation — IDENTICAL to the games/adventure frame's
   bottom bar (same `.game-frame__nav`/`.gf-pill` markup, Font Awesome icons and
   5 sections) so every section shows the exact same bottom menu. `nav` carries
   the handlers; `active` highlights the current pill. (Shop is reached via the
   home tile; the grown-ups gate via the home gear button.) */
const BOTTOM_NAV_ITEMS = [
  { key: "home", label: "Home", icon: "fa-house", pill: "#fb7185", handler: "onHome" },
  { key: "learn", label: "Learn", icon: "fa-graduation-cap", pill: "#2563eb", handler: "onLearn" },
  { key: "games", label: "Games", icon: "fa-gamepad", pill: "#22c55e", handler: "onGames" },
  { key: "adventure", label: "Adventure", icon: "fa-person-running", pill: "#ec4899", handler: "onAdventure" },
  { key: "videos", label: "Axo Rhymes", icon: "fa-music", pill: "#f97316", handler: "onRhymes" },
];

function BottomNav({ nav = {}, active }) {
  return (
    <nav className="game-frame__nav app-bottom-nav" aria-label="Axolittles sections">
      {BOTTOM_NAV_ITEMS.map((it) => (
        <button
          key={it.key}
          className={"gf-pill" + (active === it.key ? " is-active" : "")}
          style={{ "--pill": it.pill }}
          onClick={nav[it.handler]}
          aria-label={it.label}
        >
          <span className="gf-pill__icon"><i className={`fa-solid ${it.icon}`} aria-hidden="true"></i></span>
          <span className="gf-pill__label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* Shared section TOP bar — same `.game-frame__bar` chrome as the games/adventure
   frame, so all five sections' top menus look identical. Rendered 1:1 OUTSIDE
   the scaled stage (like BottomNav). `onHome` shows the left Home button;
   `title` sits next to the logo; `children` fill the right slot (Home puts its
   stars/voice/gear there; other sections leave it empty). */
function SectionTopBar({ onHome, homeLabel = "Home", title, className = "", children }) {
  return (
    <div className={"game-frame__bar" + (className ? " " + className : "")} role="banner">
      {onHome ? (
        <button className="game-frame__back" onClick={onHome} aria-label={homeLabel}>
          <i className="fa-solid fa-house" aria-hidden="true"></i>
          {homeLabel}
        </button>
      ) : null}
      <span className="game-frame__title">
        <img src="/axo-logo.svg" alt="" />
        {title}
      </span>
      <span className="game-frame__spacer" />
      {children}
    </div>
  );
}

export { Icon, StarIcon, CharFace, ShapeArt, StickerGlyph, ShapeFace, Scenery, Mascot, StarBurst, Confetti, TapHint, ProgressPath, BottomNav, SectionTopBar, totalStars, lessonsDone, worldComplete, levelFor, isStickerUnlocked, findLevelsDone, challengeLevelsDone };
