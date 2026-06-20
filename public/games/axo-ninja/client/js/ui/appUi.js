import { HERO_PORTRAITS } from "../core/assets.js";
import { LEVEL_ASSETS, getLevelDisplayName } from "../config/levelAssets.js";
import { BOSSES } from "../config/bosses.js";
import { HEROES } from "../config/heroes.js";

function toPublicAssetPath(path) {
  const src = String(path || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const normalizedPath = src.replace(/^\/+/, "");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return `/${normalizedPath}`;
}

function humanizeLabel(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getBossDisplayName(bossName, bossCode) {
  const explicitName = String(bossName || "").trim();
  if (explicitName) return explicitName;

  const rawCode = String(bossCode || "").trim();
  if (!rawCode) return "-";

  const normalizedCode =
    {
      gravewitch: "necroKing",
    }[rawCode.toLowerCase()] || rawCode;

  return BOSSES[normalizedCode]?.name || humanizeLabel(rawCode);
}

/* Island centers as percentage points (x,y = 0–100) on the route map image.
 * A = Beach dock (right edge of tropical island)
 * B = Middle water center (between islands)
 * C = Ice cabin path (left edge of ice island)
 * D = Graveyard entrance (right‑side graveyard gate)
 *
 * Order: Beach (1 / A) → Water (2 / B) → Ice Island (3 / C) → Graveyard (4 / D).
 */
const ROUTE_STAGE_POSITIONS = [
  // Centers for 4 horizontal stages in the viewport (0–100% of visible route area).
  { x: 25, y: 55 }, // Level 1
  { x: 50, y: 55 }, // Level 2
  { x: 75, y: 55 }, // Level 3
  { x: 95, y: 55 }, // Level 4 – slightly toward right edge
];
/* Optional curved paths between islands. Empty = straight line center-to-center. */
const ROUTE_SEGMENT_WAYPOINTS = {};

// Horizontal level strip artwork – each panel is a connected stage.
const ROUTE_LEVEL_IMAGES = [
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/level-change-bg/new1/beach.webp",
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/level-change-bg/new1/water.webp",
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/level-change-bg/new1/ice.webp",
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/level-change-bg/new1/graveyard.webp",
];

// Hero route-map animations: idle when standing, run when traveling.
const ROUTE_HERO_IDLE_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/IDLE-ezgif.com-optimize_y9rbb6.gif";
const ROUTE_HERO_RUN_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/run-ezgif.com-optimize_1_w4wn1u.gif";

const ROUTE_RUNNER_IMAGES = {
  ninja: {
    idle: ROUTE_HERO_IDLE_IMAGE,
    run: ROUTE_HERO_RUN_IMAGE,
  },
};

const FINAL_REWARD_CHEST_LOCKED_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/chest_locked_1_pfkprz.webp";
const FINAL_REWARD_CHEST_OPEN_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/cherst_opening_1_rkgbjw.webp";
const FUTURE_LEVELS_BG_IMAGE =
  "https://ik.imagekit.io/6rsuaxauw/last%20image%201.webp?updatedAt=1778663920167";

function formatWholeNumber(value) {
  const safeValue = Math.max(0, Math.floor(Number(value) || 0));
  return safeValue.toLocaleString("en-US");
}

function getRouteStagePosition(index) {
  return (
    ROUTE_STAGE_POSITIONS[index] || {
      x: 14 + index * 22,
      y: index % 2 === 0 ? 70 : 26,
    }
  );
}

function getRouteTravelPoints(originIndex, targetIndex) {
  const start = getRouteStagePosition(originIndex);
  const end = getRouteStagePosition(targetIndex);
  if (originIndex === targetIndex) return [start];

  const forwardKey = `${originIndex}-${targetIndex}`;
  const reverseKey = `${targetIndex}-${originIndex}`;
  if (ROUTE_SEGMENT_WAYPOINTS[forwardKey]) {
    return [start, ...ROUTE_SEGMENT_WAYPOINTS[forwardKey], end];
  }
  if (ROUTE_SEGMENT_WAYPOINTS[reverseKey]) {
    return [start, ...[...ROUTE_SEGMENT_WAYPOINTS[reverseKey]].reverse(), end];
  }
  return [start, end];
}

function toRoutePixelPoint(point, stageRect) {
  return {
    x: stageRect.width * (point.x / 100),
    y: stageRect.height * (point.y / 100),
  };
}

function dedupeRoutePoints(points) {
  const out = [];
  let last = null;
  for (const p of points) {
    if (!p || typeof p.x !== "number" || typeof p.y !== "number") continue;
    if (last !== null && last.x === p.x && last.y === p.y) continue;
    out.push(p);
    last = p;
  }
  return out;
}

function buildRouteTravelMetrics(points) {
  const safePoints = Array.isArray(points) ? points.filter(Boolean) : [];
  if (safePoints.length <= 1) {
    return { points: safePoints, segments: [], totalLength: 0 };
  }

  const segments = [];
  let totalLength = 0;
  for (let index = 1; index < safePoints.length; index += 1) {
    const start = safePoints[index - 1];
    const end = safePoints[index];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length < 0.001) continue;
    segments.push({
      start,
      end,
      length,
      offset: totalLength,
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    });
    totalLength += length;
  }

  return { points: safePoints, segments, totalLength };
}

function getRouteTravelSample(metrics, progress) {
  const points = metrics?.points || [];
  const segments = metrics?.segments || [];
  if (points.length === 0) return { x: 0, y: 0, angle: 0 };
  if (segments.length === 0 || metrics.totalLength <= 0) {
    const point = points[0];
    return { x: point.x, y: point.y, angle: 0 };
  }

  const targetDistance =
    Math.max(0, Math.min(1, progress)) * Math.max(0, metrics.totalLength);

  for (const segment of segments) {
    const segmentEnd = segment.offset + segment.length;
    if (targetDistance <= segmentEnd) {
      const localProgress =
        segment.length > 0
          ? (targetDistance - segment.offset) / segment.length
          : 0;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * localProgress,
        y: segment.start.y + (segment.end.y - segment.start.y) * localProgress,
        angle: segment.angle,
      };
    }
  }

  const lastSegment = segments[segments.length - 1];
  return {
    x: lastSegment.end.x,
    y: lastSegment.end.y,
    angle: lastSegment.angle,
  };
}

function easeInOutSine(progress) {
  return 0.5 - Math.cos(Math.max(0, Math.min(1, progress)) * Math.PI) / 2;
}

function normalizeToastMessage(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const heroMatch = raw.match(/^Guest mode uses (.+) by default\.?$/i);
  if (heroMatch) {
    return `${heroMatch[1]} is selected by default.`;
  }

  const exactReplacements = {
    "Left guest mode.": "Adventure session ended.",
  };

  return exactReplacements[raw] || raw;
}

export class AppUI {
  constructor(root) {
    this.root = root;
    this.touchControlCleanup = null;
    this.routeMapCleanup = null;
    this.gameplayAudioStateSetter = null;
    this.activeLeaderboardHeroId = "ninja";
    this.hide();
  }

  clear() {
    this.cleanupTouchControls();
    this.cleanupRouteMapUi();
    this.root.innerHTML = "";
  }

  show() {
    this.root.style.display = "block";
    this.root.style.pointerEvents = "auto";
  }

  hide() {
    this.root.style.display = "none";
    this.root.style.pointerEvents = "auto";
    this.clear();
  }

  loading(errorText = "") {
    this.show();
    this.root.innerHTML = `
      <div class="screen loading-screen">
        <img
          src="https://ik.imagekit.io/6rsuaxauw/axo-quest/loader.gif"
          alt="Loading..."
          class="loading-gif"
        />
        ${errorText ? `<div class="loading-error">${errorText}</div>` : ""}
      </div>
    `;
  }

  mainMenu({
    coinsTotal = 0,
    localMode = false,
    onStart,
    onLeaderboard,
    socialLinks = [],
    onSocialOpen,
    leaderboardModalOpen = false,
    leaderboardLoading = false,
    leaderboardError = "",
    leaderboardLevelRows = [],
    leaderboardCoinRows = [],
    leaderboardHeroCoinRows = [],
    heroConfigByCode = {},
    onLeaderboardClose,
    heroModalOpen = false,
    selectedHero = "ninja",
    onHeroSelect,
    onHeroConfirm,
    onHeroBack,
    onSettings,
    onExit,
  }) {
    void onExit;
    void leaderboardCoinRows;
    void leaderboardHeroCoinRows;

    const formatRecordTime = (seconds) => {
      const total = Math.max(0, Math.floor(Number(seconds) || 0));
      if (total <= 0) return "-";
      const mins = Math.floor(total / 60);
      const secs = total % 60;
      return `${mins}:${String(secs).padStart(2, "0")}`;
    };

    const recordRows = Array.isArray(leaderboardLevelRows)
      ? leaderboardLevelRows
      : [];
    const hasAnyRecord = recordRows.some(
      (row) => row?.completed || Number(row?.bestCoins) > 0,
    );
    const recordTableRows = hasAnyRecord
      ? recordRows
          .map((row) => {
            const name = String(row?.levelName || `Level ${row?.levelId}`);
            return `
              <tr>
                <td>${name}</td>
                <td>${Math.max(0, Number(row?.bestCoins) || 0)}</td>
                <td>${formatRecordTime(row?.bestTime)}</td>
                <td>${row?.completed ? "&#11088;" : "-"}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="4">Play a level to set your first record!</td></tr>`;

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth || 0 : 0;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight || 0 : 0;
    const shortSide = Math.min(viewportWidth, viewportHeight);
    const touchLike =
      (typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches) ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
    const showMainMenuSettingsButton = !(
      touchLike &&
      (viewportWidth < 820 || shortSide < 560)
    );

    const apiHeroesByCode =
      heroConfigByCode && typeof heroConfigByCode === "object"
        ? heroConfigByCode
        : {};
    const apiHeroesById = new Map(
      Object.values(apiHeroesByCode)
        .filter((hero) => hero && typeof hero === "object" && hero._id)
        .map((hero) => [String(hero._id), hero]),
    );
    const HERO_CODE_ALIAS = {
      axolittle: "ninja",
      pudge: "flora",
      seal: "jelly",
    };
    const canonicalHeroCode = (value) => {
      const raw = String(value || "")
        .trim()
        .toLowerCase();
      return HERO_CODE_ALIAS[raw] || raw;
    };
    const resolveApiHero = (heroInput) => {
      const raw = String(heroInput || "").trim();
      if (!raw) return null;
      const byCode = apiHeroesByCode[canonicalHeroCode(raw)];
      if (byCode) return byCode;
      const byId = apiHeroesById.get(raw);
      if (byId) return byId;
      return null;
    };
    const heroLabel = (heroInput, fallbackName = "") => {
      const apiHero = resolveApiHero(heroInput);
      if (apiHero?.heroName) return String(apiHero.heroName);
      if (fallbackName) return String(fallbackName);
      return String(HEROES?.[heroInput]?.name || heroInput || "-");
    };
    const heroPortraits = {
      ninja: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axo_ninja_olg2gr.webp",
    };
    const resolveHeroPortrait = (heroId) => {
      const idKey = String(heroId || "")
        .trim()
        .toLowerCase();
      const apiHero = resolveApiHero(heroId);
      const nameKey = String(apiHero?.heroName || HEROES?.[heroId]?.name || "")
        .trim()
        .toLowerCase();
      return (
        heroPortraits[nameKey] ||
        heroPortraits[idKey] ||
        heroPortraits.ninja ||
        ""
      );
    };
    const leaderboardHeroes = (() => {
      const apiCodes = Object.values(apiHeroesByCode)
        .map((hero) => canonicalHeroCode(hero?.heroCode))
        .filter(Boolean);
      if (apiCodes.length > 0) {
        return [...new Set(apiCodes)];
      }
      return ["ninja"];
    })();
    const heroPickCardsByName = [...leaderboardHeroes]
      .map((id) => {
        const selected = selectedHero === id;
        const heroName = heroLabel(id);
        return `
          <button class="hero-pick-card ${selected ? "selected" : ""}" data-hero="${id}">
            <span class="hero-pick-portrait" style="background-image:url('${resolveHeroPortrait(id)}')"></span>
            <span class="hero-pick-name">${heroName || id.toUpperCase()}</span>
          </button>
        `;
      })
      .join("");
    const socialLinksMarkup = (Array.isArray(socialLinks) ? socialLinks : [])
      .filter((entry) => entry?.id && entry?.iconSrc)
      .map((entry) => {
        const id = String(entry.id || "").trim();
        const label = String(entry.label || "Social").trim() || "Social";
        const iconSrc = String(entry.iconSrc || "").trim();
        const hasUrl = Boolean(String(entry.url || "").trim());
        return `
          <button
            type="button"
            class="portal-social-link ${hasUrl ? "" : "is-pending"}"
            data-social-id="${id}"
            aria-label="${hasUrl ? `Open ${label}` : `${label} link coming soon`}"
            title="${hasUrl ? label : `${label} link coming soon`}"
          >
            <img src="${iconSrc}" alt="" aria-hidden="true" />
          </button>
        `;
      })
      .join("");
    const playButtonTitle = localMode
      ? "Resume your local guest adventure"
      : "Start Adventure";

    this.show();
    this.root.innerHTML = `
      <div class="screen portal-menu-screen">
        <div class="menu-fx menu-fx-a"></div>
        <div class="menu-fx menu-fx-b"></div>
        <header class="portal-menu-topbar">
          <div class="portal-menu-status">
            <div class="portal-menu-coin">
              <span class="portal-menu-coin-label">COINS</span>
              <strong>${Number(coinsTotal || 0)}</strong>
            </div>
            ${
              showMainMenuSettingsButton
                ? `
            <button
              id="btn-settings-icon"
              class="portal-menu-settings-btn"
              aria-label="Open settings and controls"
            >
              <i class="fa-solid fa-gear touch-settings-glyph menu-settings-glyph" aria-hidden="true"></i>
            </button>
            `
                : ""
            }
          </div>
        </header>

        <div class="portal-menu-logo" aria-hidden="true">
          <span class="portal-menu-logo-text">AXO NINJA</span>
        </div>
        <div class="portal-menu-stage">
          <section class="portal-banner-menu" aria-label="Axo Ninja main menu">
            <div class="portal-banner-stack">
              <button
                type="button"
                id="btn-start"
                class="menu-banner-hotspot menu-banner-hotspot-play"
                aria-label="${playButtonTitle}"
              ></button>
              <button
                type="button"
                id="btn-leaderboard"
                class="menu-banner-hotspot menu-banner-hotspot-leaderboard"
                aria-label="Open leaderboard"
              ></button>
              <button
                type="button"
                id="btn-rules"
                class="menu-banner-hotspot menu-banner-hotspot-rules"
                aria-label="Open game rules"
              ></button>
            </div>
            <div class="portal-menu-note">
              Progress saves on this device
            </div>
          </section>
        </div>

        ${
          socialLinksMarkup
            ? `
        <div class="portal-menu-socials" aria-label="Social media links">
          ${socialLinksMarkup}
        </div>
        `
            : ""
        }

        <div id="rules-modal" class="menu-modal" aria-hidden="true">
          <div class="menu-modal-card">
            <div class="menu-modal-head">
              <h3>Game Rules</h3>
              <button id="btn-rules-close" class="menu-modal-close" aria-label="Close rules">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
            <div class="menu-modal-content rules-content">
              <div class="rules-panel">
                <div class="leaderboard-table-wrap rules-table-wrap">
                  <table class="leaderboard-table rules-table">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>#1</td>
                        <td>Press Play to start your adventure right away.</td>
                      </tr>
                      <tr>
                        <td>#2</td>
                        <td>Collect coins, survive the stage, and defeat the boss to complete the level.</td>
                      </tr>
                      <tr>
                        <td>#3</td>
                        <td>Use movement, jump, and fire skills wisely to clear hazards and survive each run.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="leaderboard-modal" class="menu-modal ${leaderboardModalOpen ? "open" : ""}" aria-hidden="${leaderboardModalOpen ? "false" : "true"}">
          <div class="menu-modal-card leaderboard-modal-card">
            <div class="menu-modal-head">
              <h3>My Records</h3>
              <button id="btn-leaderboard-close" class="menu-modal-close" aria-label="Close records">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
            <div class="menu-modal-content leaderboard-content">
              ${
                leaderboardLoading
                  ? `<div class="leaderboard-loading">Loading records...</div>`
                  : leaderboardError
                    ? `<div class="leaderboard-error">${leaderboardError}</div>`
                    : `
                      <div class="leaderboard-panel">
                        <div class="leaderboard-table-wrap">
                          <table class="leaderboard-table">
                            <thead>
                              <tr>
                                <th>Level</th>
                                <th>Best Coins</th>
                                <th>Best Time</th>
                                <th>Done</th>
                              </tr>
                            </thead>
                            <tbody>${recordTableRows}</tbody>
                          </table>
                        </div>
                      </div>
                    `
              }
            </div>
          </div>
        </div>

        <div id="hero-modal" class="menu-modal ${heroModalOpen ? "open" : ""}" aria-hidden="${heroModalOpen ? "false" : "true"}">
          <div class="menu-modal-card hero-pick-modal-card">
            <div class="menu-modal-head">
              <h3>Choose Your Hero</h3>
              <button id="btn-hero-close" class="menu-modal-close" aria-label="Close hero picker">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
            <div class="menu-modal-content hero-pick-content">
              <div class="hero-pick-grid">${heroPickCardsByName}</div>
              <div class="hero-pick-actions">
                <button id="btn-hero-prev" class="hero-arrow-btn" aria-label="Back">&#8592;</button>
                <button id="btn-hero-next" class="hero-arrow-btn is-next" aria-label="Continue">&#8594;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.root.querySelector("#btn-start")?.addEventListener("click", onStart);
    this.root
      .querySelector("#btn-leaderboard")
      ?.addEventListener("click", onLeaderboard);
    this.root.querySelectorAll("[data-social-id]").forEach((btn) => {
      btn.addEventListener("click", () =>
        onSocialOpen?.(btn.getAttribute("data-social-id")),
      );
    });
    this.root
      .querySelector("#btn-leaderboard-close")
      ?.addEventListener("click", onLeaderboardClose);
    this.root
      .querySelector("#leaderboard-modal")
      ?.addEventListener("click", (event) => {
        if (event.target?.id === "leaderboard-modal") {
          onLeaderboardClose?.();
        }
      });
    this.root.querySelectorAll(".hero-pick-card").forEach((el) => {
      el.addEventListener("click", () =>
        onHeroSelect?.(el.getAttribute("data-hero")),
      );
    });
    this.root
      .querySelector("#btn-hero-next")
      ?.addEventListener("click", onHeroConfirm);
    this.root
      .querySelector("#btn-hero-prev")
      ?.addEventListener("click", onHeroBack);
    this.root
      .querySelector("#btn-hero-close")
      ?.addEventListener("click", onHeroBack);
    this.root
      .querySelector("#hero-modal")
      ?.addEventListener("click", (event) => {
        if (event.target?.id === "hero-modal") {
          onHeroBack?.();
        }
      });
    this.root.querySelector("#btn-rules")?.addEventListener("click", () => {
      this.root.querySelector("#rules-modal")?.classList.add("open");
    });
    this.root
      .querySelector("#btn-rules-close")
      ?.addEventListener("click", () => {
        this.root.querySelector("#rules-modal")?.classList.remove("open");
      });
    this.root
      .querySelector("#rules-modal")
      ?.addEventListener("click", (event) => {
        if (event.target?.id === "rules-modal") {
          this.root.querySelector("#rules-modal")?.classList.remove("open");
        }
      });
    this.root
      .querySelector("#btn-settings-icon")
      ?.addEventListener("click", onSettings);
  }

  heroSelect({
    selectedHero,
    profile,
    selectedAttunement,
    fireUnlocked,
    onSelectHero,
    onSelectAttunement,
    onConfirm,
    onBack,
  }) {
    void profile;
    void selectedAttunement;
    void fireUnlocked;
    void onSelectAttunement;

    const heroVisuals = {
      ninja: {
        sprite: HERO_PORTRAITS.ninja,
        spriteFrames: 1,
      },
    };

    const cards = [
      "ninja",
      // "flora",
      // "jelly",
    ]
      .map((id) => {
        const hero = HEROES[id];
        const heroNameKey = String(hero?.name || id)
          .trim()
          .toLowerCase();
        const visual =
          heroVisuals[heroNameKey] || heroVisuals[id] || heroVisuals.ninja;
        return `
          <button class="hero-card ${selectedHero === id ? "selected" : ""}" data-hero="${id}">
            <div class="hero-visual">
              <div class="hero-sprite" style="--sheet-url:url('${visual.sprite}'); --frames:${visual.spriteFrames};"></div>
            </div>
            <div class="hero-title">${hero.name}</div>
          </button>
        `;
      })
      .join("");

    const active = HEROES[selectedHero];

    this.show();
    this.root.innerHTML = `
      <div class="screen hero-screen">
        <div class="hero-modal">
          <h2>CHOOSE YOUR HERO</h2>
          <div class="hero-grid">${cards}</div>
          <div class="hero-selected-line">Selected: ${active.name}</div>
          <div class="row-buttons">
            <button id="btn-confirm">CONFIRM</button>
            <button id="btn-back">BACK</button>
          </div>
        </div>
      </div>
    `;

    this.root.querySelectorAll(".hero-card").forEach((el) => {
      el.addEventListener("click", () =>
        onSelectHero(el.getAttribute("data-hero")),
      );
    });
    this.root
      .querySelector("#btn-confirm")
      ?.addEventListener("click", onConfirm);
    this.root.querySelector("#btn-back")?.addEventListener("click", onBack);
  }

  worldMap({
    selectedLevel,
    profile,
    levelConfigById = {},
    onSelectLevel,
    onPlay,
    onBack,
  }) {
    const unlocked = 4;
    const completed = new Set(profile?.levelCompletions || []);

    const rows = [1, 2, 3, 4]
      .map((id) => {
        const asset = LEVEL_ASSETS[id];
        const levelConfig = levelConfigById?.[id] || {};
        const levelLabel = getLevelDisplayName(
          id,
          levelConfig.levelName || asset?.world || `Level ${id}`,
        ).toUpperCase();
        const bossLabel = getBossDisplayName(
          levelConfig.bossName,
          levelConfig.bossCode || asset?.boss,
        );
        const isUnlocked = id <= unlocked;
        const status = completed.has(id)
          ? "DONE"
          : isUnlocked
            ? "OPEN"
            : "LOCKED";
        return `
          <button class="level-row ${selectedLevel === id ? "selected" : ""}" data-level="${id}" ${isUnlocked ? "" : "disabled"}>
            <span>[${id}] ${levelLabel} (Boss: ${bossLabel})</span>
            <span>${status}</span>
          </button>
        `;
      })
      .join("");

    const level = LEVEL_ASSETS[selectedLevel];
    const selectedConfig = levelConfigById?.[selectedLevel] || {};
    const selectedLabel = getLevelDisplayName(
      selectedLevel,
      selectedConfig.levelName || level?.world || `Level ${selectedLevel}`,
    ).toUpperCase();
    const selectedBossLabel = getBossDisplayName(
      selectedConfig.bossName,
      selectedConfig.bossCode || level?.boss,
    );

    this.show();
    this.root.innerHTML = `
      <div class="screen map-screen">
        <h2>WORLD MAP</h2>
        <div class="map-layout">
          <div class="level-list">${rows}</div>
          <div class="level-info">
            <h3>Selected: ${selectedLabel}</h3>
            <div>Difficulty: ${level?.difficultyMultiplier ?? "-"}</div>
            <div>Size: ${level?.sizeTiles?.w ?? "-"} x ${level?.sizeTiles?.h ?? "-"}</div>
            <div>Boss: ${selectedBossLabel}</div>
            <div>Max collectible coins: ${Number(selectedConfig.maxCollectibleCoins || 0)}</div>
            <div>Coin value: ${Number(selectedConfig.coinValue || 0)}</div>
            <div>Boss reward: ${Number(selectedConfig.bossReward || 0)}</div>
            <div>Enemy max count: ${Number(selectedConfig.enemyMaxCount || 0)}</div>
            <div>Hazards: Ice/Water/Poison/Spikes/Bricks by world</div>
            <div>Coins are hard-earned - finish tasks, solve puzzles, then defeat the boss.</div>
            <div>Combat rule: one hero throwable power only.</div>
            <div>Boss gate is open.</div>
          </div>
        </div>
        <div class="row-buttons">
          <button id="btn-play">PLAY</button>
          <button id="btn-back">BACK</button>
        </div>
      </div>
    `;

    this.root.querySelectorAll(".level-row").forEach((el) => {
      el.addEventListener("click", () =>
        onSelectLevel(Number(el.getAttribute("data-level"))),
      );
    });
    this.root.querySelector("#btn-play")?.addEventListener("click", onPlay);
    this.root.querySelector("#btn-back")?.addEventListener("click", onBack);
  }

  routeMap({
    currentLevel = 1,
    levelOrder = [1, 2, 3, 4],
    levelConfigById = {},
    heroConfigByCode = {},
    selectedHero = "ninja",
    autoContinueSeconds = 0,
    onContinue,
    onExit,
    onBack,
    animateFullPath = false,
    transportOnly = false,
  }) {
    this.cleanupRouteMapUi();
    const selectedHeroIdKey = String(selectedHero || "")
      .trim()
      .toLowerCase();
    const selectedHeroConfig = HEROES[selectedHeroIdKey] || {};
    const legacyHeroKey = String(selectedHeroConfig.legacyId || "")
      .trim()
      .toLowerCase();
    const selectedHeroName = String(
      heroConfigByCode?.[selectedHeroIdKey]?.heroName ||
        HEROES?.[selectedHero]?.name ||
        "",
    );
    const heroRunnerSet =
      ROUTE_RUNNER_IMAGES[selectedHeroIdKey] ||
      ROUTE_RUNNER_IMAGES[legacyHeroKey] ||
      ROUTE_RUNNER_IMAGES.ninja;
    const order =
      Array.isArray(levelOrder) && levelOrder.length
        ? levelOrder.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [1, 2, 3, 4];
    const normalizedCurrent = Number(currentLevel) || order[0] || 1;
    const hasContinue = typeof onContinue === "function";
    const hasAutoContinue = hasContinue && Number(autoContinueSeconds) > 0;
    const currentIndex = Math.max(0, order.indexOf(normalizedCurrent));
    let originIndex = currentIndex;
    let targetIndex = hasContinue
      ? Math.min(order.length - 1, currentIndex + 1)
      : currentIndex;
    if (animateFullPath && order.length >= 4) {
      originIndex = 0;
      targetIndex = 3;
    }
    const hasTransition =
      hasContinue && (targetIndex !== originIndex || animateFullPath);
    const exitHandler = onExit || onBack;
    const getRouteLevelLabel = (id) => {
      const asset = LEVEL_ASSETS[id];
      const levelConfig = levelConfigById?.[id] || {};
      const raw = getLevelDisplayName(
        id,
        levelConfig.levelName || asset?.world || "",
      );
      if (!raw) return `Level ${id}`;
      return String(raw).trim();
    };
    const runnerName = selectedHeroName || "Ninja";
    const originLevelId = order[originIndex] || normalizedCurrent;
    const targetLevelId = order[targetIndex] || originLevelId;
    const originLevelLabel = getRouteLevelLabel(originLevelId);
    const targetLevelLabel = getRouteLevelLabel(targetLevelId);
    const allLabels = [0, 1, 2, 3]
      .map((i) => getRouteLevelLabel(order[i] || i + 1))
      .join(" → ");
    const subtitle = animateFullPath
      ? `${runnerName} is moving through ${allLabels} (test).`
      : hasTransition
        ? `${runnerName} is moving slowly from ${originLevelLabel} to ${targetLevelLabel}.`
        : `Current stop: ${originLevelLabel}.`;
    const autoContinueMs = Math.max(0, Number(autoContinueSeconds) || 0) * 1000;
    // Hide all route-map header/footer text and buttons for a clean world-map look.
    const showUI = false;
    const checkpointsHtml = ROUTE_STAGE_POSITIONS.map(
      (p) => `
        <div class="route-cross-marker" style="left:${p.x}%;top:${p.y}%;" aria-hidden="true">
          <span class="route-cross-inner"></span>
        </div>
      `,
    ).join("");

    const initialStripPercent = -100 * originIndex;

    const panelsHtml = ROUTE_LEVEL_IMAGES.map(
      (src, idx) => `
        <div
          class="route-level-panel"
          data-level-panel="${idx + 1}"
          style="flex:0 0 100%;margin-right:0;height:100%;display:flex;justify-content:center;align-items:center;"
        >
          <img
            src="${toPublicAssetPath(src)}"
            alt="Level ${idx + 1} route panel"
            style="width:100%;height:100%;object-fit:cover;border-radius:0;"
            loading="lazy"
          />
        </div>
      `,
    ).join("");

    this.show();
    this.root.innerHTML = `
      <div class="screen route-map-screen ${hasTransition && !transportOnly ? "is-transitioning" : ""} route-map-fullscreen" style="--route-auto-continue-ms:${autoContinueMs}ms;">
        <div class="route-map-layout route-map-layout-planet" style="width:100%;height:100%;display:flex;align-items:stretch;justify-content:center;">
          <div class="route-map-viewport" style="width:100%;height:100%;overflow:hidden;position:relative;">
            <div class="route-atlas-stage" id="routeAtlasStage" style="width:100%;height:100%;position:relative;">
              <div class="route-level-strip" id="routeLevelStrip" style="display:flex;align-items:center;height:100%;transition:transform 600ms ease-out;transform:translateX(${initialStripPercent}%);">
                ${panelsHtml}
              </div>
              ${checkpointsHtml}
              <div class="route-runner ${hasTransition && !transportOnly ? "is-traveling" : "is-idle"}" id="routeTravelRunner" aria-hidden="true">
                <span class="route-runner-shadow"></span>
                <img
                  class="route-runner-image"
                  id="routeRunnerImage"
                  src="${toPublicAssetPath(heroRunnerSet.idle || ROUTE_HERO_IDLE_IMAGE)}"
                  data-idle-src="${toPublicAssetPath(heroRunnerSet.idle || ROUTE_HERO_IDLE_IMAGE)}"
                  data-run-src="${toPublicAssetPath(heroRunnerSet.run || ROUTE_HERO_RUN_IMAGE)}"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    let countdownIntervalId = null;
    let travelFrameId = null;
    this.routeMapCleanup = () => {
      if (countdownIntervalId) {
        window.clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
      if (travelFrameId) {
        window.cancelAnimationFrame(travelFrameId);
        travelFrameId = null;
      }
      this.routeMapCleanup = null;
    };

    const stage = this.root.querySelector("#routeAtlasStage");
    const strip = this.root.querySelector("#routeLevelStrip");
    const travelRunner = this.root.querySelector("#routeTravelRunner");
    const runnerImg = this.root.querySelector("#routeRunnerImage");
    if (stage && travelRunner) {
      const runRouteAnimation = () => {
        const stageRect = stage.getBoundingClientRect();
        const setRunnerPosition = (sample) => {
          travelRunner.style.left = `${sample.x}px`;
          travelRunner.style.top = `${sample.y}px`;
          travelRunner.style.setProperty(
            "--route-travel-rotate",
            `${sample.angle != null ? sample.angle : 0}rad`,
          );
        };

        if (transportOnly && !hasTransition) {
          const islandIndex = currentIndex;
          const pos = getRouteStagePosition(islandIndex);
          const pixel = toRoutePixelPoint(pos, stageRect);
          setRunnerPosition({ x: pixel.x, y: pixel.y, angle: 0 });
          travelRunner.classList.remove("is-traveling");
          travelRunner.classList.add("is-idle");
          // Center the strip so the current level is the main panel,
          // with a small peek of the next level on the right.
          if (strip) {
            const viewportWidth = stageRect.width;
            const panelWidth = viewportWidth * 0.88;
            const baseOffset =
              -currentIndex * panelWidth + (viewportWidth - panelWidth) * 0.5;
            strip.style.transform = `translateX(${baseOffset}px)`;
          }
          return;
        }

        let percentPoints;
        if (animateFullPath && order.length >= 4) {
          const p01 = getRouteTravelPoints(0, 1);
          const p12 = getRouteTravelPoints(1, 2);
          const p23 = getRouteTravelPoints(2, 3);
          percentPoints = dedupeRoutePoints([
            ...p01,
            ...p12.slice(1),
            ...p23.slice(1),
          ]);
        } else {
          percentPoints = getRouteTravelPoints(originIndex, targetIndex);
        }
        const travelPoints = percentPoints.map((point) =>
          toRoutePixelPoint(point, stageRect),
        );
        const travelMetrics = buildRouteTravelMetrics(travelPoints);
        const initialSample = getRouteTravelSample(travelMetrics, 0);
        // Keep hero visually centered horizontally; background panels slide underneath.
        setRunnerPosition({
          ...initialSample,
          x: stageRect.width * 0.5,
        });

        const viewportWidth = stageRect.width;
        // Each panel is full-width; use viewport width so we slide exactly one screen per level.
        const panelWidth = viewportWidth;
        const originStripOffset = -originIndex * panelWidth;
        const targetStripOffset = -targetIndex * panelWidth;

        if (hasTransition) {
          // Start with the strip aligned to the origin level so we travel:
          // 1 -> 2, then 2 -> 3, then 3 -> 4 (not always from 1).
          if (strip) {
            strip.style.transform = `translateX(${originStripOffset}px)`;
          }
          if (runnerImg) {
            const runSrc = runnerImg.getAttribute("data-run-src");
            if (runSrc) runnerImg.src = runSrc;
          }
          const autoContinueMsNum = Math.max(
            0,
            Math.round(Number(autoContinueSeconds) * 1000),
          );
          const useLinearProgress = animateFullPath;
          const maxDuration = autoContinueMsNum
            ? Math.max(3600, autoContinueMsNum - 1000)
            : 6200;
          const baseDuration = animateFullPath
            ? maxDuration
            : Math.min(
                maxDuration,
                Math.round(travelMetrics.totalLength * 10.8),
              );
          // For standard level-to-level travel, keep animation in the 1.5–2s range.
          const travelDuration = animateFullPath
            ? baseDuration
            : Math.max(1500, Math.min(2000, baseDuration || 1800));
          const PAUSE_AT_ISLAND_MS = 1800;
          const segmentTravelMs = animateFullPath
            ? Math.max(800, (travelDuration - 2 * PAUSE_AT_ISLAND_MS) / 3)
            : 0;
          const startTime = performance.now();

          const getProgressWithPauses = (elapsed) => {
            if (!animateFullPath || segmentTravelMs <= 0) {
              return travelDuration > 0
                ? Math.min(1, elapsed / travelDuration)
                : 1;
            }
            const t1 = segmentTravelMs;
            const t2 = t1 + PAUSE_AT_ISLAND_MS;
            const t3 = t2 + segmentTravelMs;
            const t4 = t3 + PAUSE_AT_ISLAND_MS;
            const t5 = t4 + segmentTravelMs;
            if (elapsed <= t1) return (elapsed / t1) * (1 / 3);
            if (elapsed <= t2) return 1 / 3;
            if (elapsed <= t3)
              return 1 / 3 + ((elapsed - t2) / segmentTravelMs) * (1 / 3);
            if (elapsed <= t4) return 2 / 3;
            if (elapsed <= t5)
              return 2 / 3 + ((elapsed - t4) / segmentTravelMs) * (1 / 3);
            return 1;
          };

          const animateRunner = (now) => {
            const elapsed = Math.max(0, now - startTime);
            const rawProgress = animateFullPath
              ? getProgressWithPauses(elapsed)
              : travelDuration > 0
                ? Math.min(1, elapsed / travelDuration)
                : 1;
            const progress = useLinearProgress
              ? rawProgress
              : easeInOutSine(rawProgress);
            const sample = getRouteTravelSample(travelMetrics, progress);
            setRunnerPosition({
              ...sample,
              x: stageRect.width * 0.5,
            });

            if (strip) {
              const stripOffset =
                originStripOffset +
                (targetStripOffset - originStripOffset) * progress;
              strip.style.transform = `translateX(${stripOffset}px)`;
            }

            if (progress < 1) {
              travelFrameId = window.requestAnimationFrame(animateRunner);
              return;
            }

            travelFrameId = null;
            travelRunner.classList.remove("is-traveling");
            travelRunner.classList.add("is-arrived");
            if (runnerImg) {
              const idleSrc = runnerImg.getAttribute("data-idle-src");
              if (idleSrc) runnerImg.src = idleSrc;
            }
          };

          travelFrameId = window.requestAnimationFrame(animateRunner);
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(runRouteAnimation));
    }
  }

  gameplayOverlay({
    input,
    onPauseToggle,
    onSettings,
    onAudioToggle,
    isAudioEnabled,
  } = {}) {
    this.cleanupTouchControls();
    if (!input) {
      this.hide();
      return;
    }
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth || 0 : 0;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight || 0 : 0;
    const shortSide = Math.min(viewportWidth, viewportHeight);
    const supportsTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    const isMobileViewport = viewportWidth < 820 || shortSide < 560;
    const isTabletViewport =
      !isMobileViewport &&
      supportsTouch &&
      viewportWidth <= 1366 &&
      shortSide <= 1024;
    const showTouchControls =
      supportsTouch && (isMobileViewport || isTabletViewport);
    const showGameplaySettingsButton = !showTouchControls;

    this.show();
    this.root.style.pointerEvents = "none";
    const audioOn =
      typeof isAudioEnabled === "function" ? Boolean(isAudioEnabled()) : true;
    const musicIconClass = audioOn ? "fa-music" : "fa-volume-xmark";
    const audioTitle = audioOn ? "Audio On" : "Audio Off";
    const audioLabel = audioOn ? "Mute all audio" : "Enable all audio";

    this.root.innerHTML = `
      <div class="gameplay-overlay-wrap">
        <div class="gameplay-top-row" id="gameplayTopRow">
          <button
            type="button"
            class="touch-music-pill ${audioOn ? "" : "is-muted"}"
            id="touchMusicPill"
            aria-label="${audioLabel}"
            data-tooltip="${audioTitle}"
          >
            <i class="fa-solid ${musicIconClass} touch-music-glyph" aria-hidden="true"></i>
          </button>
          <button type="button" class="touch-esc-pill" id="touchEscPill" aria-label="Pause">ESC</button>
          ${
            showGameplaySettingsButton
              ? `
          <button type="button" class="touch-settings-pill" id="touchSettingsPill" aria-label="Settings and Control Panel" data-tooltip="Settings">
            <i class="fa-solid fa-gear touch-settings-glyph" aria-hidden="true"></i>
          </button>
          `
              : ""
          }
        </div>
        ${
          showTouchControls
            ? `
        <div class="touch-controls touch-controls-pubg" id="touchControls">
          <div class="touch-move touch-panel">
            <div class="touch-move-label">MOVE</div>
            <div class="touch-stick-base" id="touchStickBase">
              <div class="touch-stick-ring"></div>
              <div class="touch-stick-knob" id="touchStickKnob"></div>
            </div>
          </div>
          <div class="touch-action touch-panel">
            <div class="touch-fire-label">ACTION</div>
            <div class="touch-action-row">
              <button type="button" class="touch-btn touch-jump" data-action="jump">JUMP</button>
              <button type="button" class="touch-btn touch-fire" data-action="skill">FIRE</button>
            </div>
          </div>
        </div>
        `
            : ""
        }
      </div>
    `;

    const listeners = [];
    const pressed = new Set();
    const pointerLocks = new Map();
    const isActionStillHeld = (action) =>
      [...pointerLocks.values()].some((value) => value === action);
    const bindHold = (el, action) => {
      if (!el) return;
      const onDown = (e) => {
        e.preventDefault();
        if (el.setPointerCapture && typeof e.pointerId === "number") {
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            // Ignore browsers that fail pointer capture for rapid multi-touch.
          }
        }
        if (typeof e.pointerId === "number") {
          pointerLocks.set(e.pointerId, action);
        }
        input.setVirtualAction(action, true);
        pressed.add(action);
        el.classList.add("is-down");
      };
      const onUp = (e) => {
        e.preventDefault();
        if (typeof e.pointerId === "number") {
          pointerLocks.delete(e.pointerId);
        }
        if (!isActionStillHeld(action)) {
          input.setVirtualAction(action, false);
          pressed.delete(action);
          el.classList.remove("is-down");
        }
      };
      const onCancel = (e) => {
        if (typeof e?.pointerId === "number") {
          pointerLocks.delete(e.pointerId);
        }
        if (!isActionStillHeld(action)) {
          input.setVirtualAction(action, false);
          pressed.delete(action);
          el.classList.remove("is-down");
        }
      };
      const onLeave = (e) => {
        if (e.pointerType !== "mouse") return;
        if (typeof e.pointerId === "number") {
          pointerLocks.delete(e.pointerId);
        }
        onCancel(e);
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onCancel);
      el.addEventListener("pointerleave", onLeave);
      listeners.push(
        [el, "pointerdown", onDown],
        [el, "pointerup", onUp],
        [el, "pointercancel", onCancel],
        [el, "pointerleave", onLeave],
      );
    };

    const stickBase = this.root.querySelector("#touchStickBase");
    const stickKnob = this.root.querySelector("#touchStickKnob");
    // Movement: left/right only. Stick angle (8-way) is for FIRE aim only.
    const joystickActions = ["left", "right"];
    let joystickPointerId = null;

    const setActionState = (action, isDown) => {
      if (isDown) {
        input.setVirtualAction(action, true);
        pressed.add(action);
      } else {
        input.setVirtualAction(action, false);
        pressed.delete(action);
      }
    };

    const applyJoystickActions = (nextActions) => {
      joystickActions.forEach((action) => {
        setActionState(action, nextActions.has(action));
      });
    };

    const resetJoystick = () => {
      applyJoystickActions(new Set());
      if (stickKnob) {
        stickKnob.style.transform = "translate(-50%, -50%)";
      }
      stickBase?.classList.remove("is-active");
    };

    const updateJoystick = (clientX, clientY) => {
      if (!stickBase) return;
      const rect = stickBase.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const maxTravel = rect.width * 0.42;
      const dist = Math.hypot(dx, dy) || 0;
      if (dist > maxTravel) {
        const scale = maxTravel / dist;
        dx *= scale;
        dy *= scale;
      }

      if (stickKnob) {
        stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }

      const dead = rect.width * 0.09;
      const next = new Set();
      const angle = Math.atan2(dy, dx);

      // Run: only straight left or straight right (no diagonal run)
      const straightRight =
        angle >= -Math.PI / 4 && angle <= Math.PI / 4 && dx >= dead;
      const straightLeft =
        (angle >= (3 * Math.PI) / 4 || angle <= -(3 * Math.PI) / 4) &&
        dx <= -dead;
      if (straightLeft) next.add("left");
      if (straightRight) next.add("right");
      applyJoystickActions(next);

      // Aim for FIRE: 8-direction from full stick angle (all directions)
      if (dist > dead && typeof input.setTouchAimDirection === "function") {
        const step = Math.PI / 4;
        const angleSnap = Math.round(angle / step) * step;
        const ax = Math.cos(angleSnap);
        const ay = Math.sin(angleSnap);
        input.setTouchAimDirection(ax, ay);
      }
    };

    if (stickBase) {
      const onStickDown = (e) => {
        e.preventDefault();
        joystickPointerId = e.pointerId;
        if (stickBase.setPointerCapture && typeof e.pointerId === "number") {
          try {
            stickBase.setPointerCapture(e.pointerId);
          } catch {
            // Ignore pointer capture failures.
          }
        }
        stickBase.classList.add("is-active");
        updateJoystick(e.clientX, e.clientY);
      };
      const onStickMove = (e) => {
        if (joystickPointerId !== e.pointerId) return;
        e.preventDefault();
        updateJoystick(e.clientX, e.clientY);
      };
      const onStickEnd = (e) => {
        if (joystickPointerId !== e.pointerId) return;
        joystickPointerId = null;
        resetJoystick();
      };
      const onStickLeave = (e) => {
        if (e.pointerType !== "mouse") return;
        if (joystickPointerId !== e.pointerId) return;
        joystickPointerId = null;
        resetJoystick();
      };

      stickBase.addEventListener("pointerdown", onStickDown);
      stickBase.addEventListener("pointermove", onStickMove);
      stickBase.addEventListener("pointerup", onStickEnd);
      stickBase.addEventListener("pointercancel", onStickEnd);
      stickBase.addEventListener("pointerleave", onStickLeave);
      listeners.push(
        [stickBase, "pointerdown", onStickDown],
        [stickBase, "pointermove", onStickMove],
        [stickBase, "pointerup", onStickEnd],
        [stickBase, "pointercancel", onStickEnd],
        [stickBase, "pointerleave", onStickLeave],
      );
    }

    this.root.querySelectorAll("[data-action]").forEach((el) => {
      bindHold(el, el.getAttribute("data-action"));
    });

    const escPill = this.root.querySelector("#touchEscPill");
    if (escPill && typeof onPauseToggle === "function") {
      const onEscTap = (e) => {
        e.preventDefault();
        onPauseToggle();
      };
      escPill.addEventListener("pointerup", onEscTap);
      listeners.push([escPill, "pointerup", onEscTap]);
    }

    const settingsPill = this.root.querySelector("#touchSettingsPill");
    if (settingsPill && typeof onSettings === "function") {
      const onSettingsTap = (e) => {
        e.preventDefault();
        onSettings();
      };
      settingsPill.addEventListener("pointerup", onSettingsTap);
      listeners.push([settingsPill, "pointerup", onSettingsTap]);
    }

    const musicPill = this.root.querySelector("#touchMusicPill");
    const setMusicPillState = (enabled) => {
      if (!musicPill) return;
      const nextEnabled = Boolean(enabled);
      const icon = musicPill.querySelector(".touch-music-glyph");
      musicPill.classList.toggle("is-muted", !nextEnabled);
      musicPill.setAttribute(
        "aria-label",
        nextEnabled ? "Mute all audio" : "Enable all audio",
      );
      musicPill.setAttribute(
        "data-tooltip",
        nextEnabled ? "Audio On" : "Audio Off",
      );
      if (icon) {
        icon.classList.remove("fa-music", "fa-volume-xmark");
        icon.classList.add(nextEnabled ? "fa-music" : "fa-volume-xmark");
      }
    };
    this.gameplayAudioStateSetter = setMusicPillState;
    setMusicPillState(audioOn);
    if (musicPill && typeof onAudioToggle === "function") {
      const onMusicTap = (e) => {
        e.preventDefault();
        const nextEnabled = onAudioToggle();
        if (typeof nextEnabled === "boolean") {
          setMusicPillState(nextEnabled);
        } else if (typeof isAudioEnabled === "function") {
          setMusicPillState(isAudioEnabled());
        }
      };
      musicPill.addEventListener("pointerup", onMusicTap);
      listeners.push([musicPill, "pointerup", onMusicTap]);
    }

    const touchControlsEl = this.root.querySelector("#touchControls");
    const topRowEl = this.root.querySelector("#gameplayTopRow");
    const updateDeviceClass = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      const h = typeof window !== "undefined" ? window.innerHeight : 0;
      const minSide = Math.min(w || 0, h || 0);
      const touchLike =
        (typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches) ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
      const isMobile = w < 820 || minSide < 560;
      const isTablet = !isMobile && touchLike && w <= 1366 && minSide <= 1024;
      const isLaptop = !isMobile && !isTablet && w < 1560;
      const deviceClass = isMobile
        ? "gameplay-top-row-mobile"
        : isTablet
          ? "gameplay-top-row-tablet"
          : isLaptop
            ? "gameplay-top-row-laptop"
            : "gameplay-top-row-desktop";
      if (topRowEl) {
        topRowEl.classList.remove(
          "gameplay-top-row-mobile",
          "gameplay-top-row-tablet",
          "gameplay-top-row-laptop",
          "gameplay-top-row-desktop",
        );
        topRowEl.classList.add(deviceClass);
      }
      if (touchControlsEl) {
        touchControlsEl.classList.remove(
          "touch-controls-mobile",
          "touch-controls-tablet",
          "touch-controls-laptop",
          "touch-controls-desktop",
        );
        touchControlsEl.classList.add(
          isMobile
            ? "touch-controls-mobile"
            : isTablet
              ? "touch-controls-tablet"
              : isLaptop
                ? "touch-controls-laptop"
                : "touch-controls-desktop",
        );
      }
    };
    updateDeviceClass();
    window.addEventListener("resize", updateDeviceClass);
    listeners.push([window, "resize", updateDeviceClass]);

    this.touchControlCleanup = () => {
      listeners.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
      resetJoystick();
      joystickPointerId = null;
      pressed.forEach((action) => input.setVirtualAction(action, false));
      pressed.clear();
      pointerLocks.clear();
      if (typeof input.clearTouchAim === "function") input.clearTouchAim();
      this.touchControlCleanup = null;
    };
  }

  levelComplete({
    levelId,
    runCoins,
    totalCoins,
    timeSec,
    onNext,
    onBackToMap,
  }) {
    this.show();
    const nextLabel = levelId < 4 ? "NEXT LEVEL" : "CREDITS";
    this.root.innerHTML = `
      <div class="screen card-screen">
        <h2>LEVEL COMPLETE</h2>
        <div class="status-grid">
          <div>Time: ${Math.floor(timeSec)}s</div>
          <div>Victory: YES</div>
          <div>Coins Earned: +${runCoins}</div>
          <div>Total Coins: ${totalCoins}</div>
        </div>
        <div class="row-buttons">
          <button id="btn-next">${nextLabel}</button>
          <button id="btn-map">BACK TO MENU</button>
        </div>
      </div>
    `;

    this.root.querySelector("#btn-next")?.addEventListener("click", onNext);
    this.root.querySelector("#btn-map")?.addEventListener("click", onBackToMap);
  }

  finalChestReward({
    totalLevels = 4,
    totalCoins = 0,
    opened = false,
    onChestOpen,
    onContinue,
  } = {}) {
    this.cleanupTouchControls();
    this.cleanupRouteMapUi();
    this.show();
    const safeTotalLevels = Math.max(1, Math.floor(Number(totalLevels) || 0));
    const safeTotalCoins = Math.max(0, Math.floor(Number(totalCoins) || 0));
    const lockedChestSrc = toPublicAssetPath(FINAL_REWARD_CHEST_LOCKED_IMAGE);
    const openChestSrc = toPublicAssetPath(FINAL_REWARD_CHEST_OPEN_IMAGE);
    const rewardPanelHidden = opened ? "" : "hidden";
    const initialInstruction = opened
      ? "You completed every level. Your final coin treasure is ready."
      : `You cleared all ${safeTotalLevels} levels. Tap the chest to claim your coin bounty.`;
    const initialLabel = opened ? "Treasure Claimed" : "Claim Treasure";
    const chestButtonStateClass = opened ? " is-opened" : "";
    const artClass = opened
      ? "final-chest-art is-sprite-open-static"
      : "final-chest-art";
    const artStyle = opened
      ? `background-image:url('${openChestSrc}')`
      : `background-image:url('${lockedChestSrc}')`;

    this.root.innerHTML = `
      <div
        class="screen final-chest-screen"
        style="--final-chest-bg-image:url('${FUTURE_LEVELS_BG_IMAGE}')"
      >
        <div class="final-chest-bubbles" aria-hidden="true">
          <span class="final-chest-bubble final-chest-bubble-a"></span>
          <span class="final-chest-bubble final-chest-bubble-b"></span>
          <span class="final-chest-bubble final-chest-bubble-c"></span>
          <span class="final-chest-bubble final-chest-bubble-d"></span>
        </div>
        <div class="final-chest-panel">
          <h2>Victory Reward</h2>
          <p class="final-chest-instruction" id="finalChestInstruction">
            ${initialInstruction}
          </p>

          <button
            type="button"
            id="btn-final-chest"
            class="final-chest-button${chestButtonStateClass}"
            aria-label="Open the final reward chest"
          >
            <span class="final-chest-button-glow" aria-hidden="true"></span>
            <span
              id="finalChestArt"
              class="${artClass}"
              data-locked-src="${lockedChestSrc}"
              data-open-src="${openChestSrc}"
              style="${artStyle}"
              aria-hidden="true"
            ></span>
            <span class="final-chest-button-label" id="finalChestLabel">
              ${initialLabel}
            </span>
          </button>

          <div
            id="finalChestRewardPanel"
            class="final-chest-reward-panel"
            ${rewardPanelHidden}
          >
            <div class="final-chest-total-card">
              <span>Total Coins Earned</span>
              <strong>${formatWholeNumber(safeTotalCoins)}</strong>
            </div>
            <button
              type="button"
              id="btn-final-chest-ok"
              class="credits-go-btn final-chest-ok-btn"
            >
              <span
                class="final-chest-ok-spinner"
                aria-hidden="true"
              ></span>
              <span class="final-chest-ok-label">Claim Reward</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const chestButton = this.root.querySelector("#btn-final-chest");
    const chestArt = this.root.querySelector("#finalChestArt");
    const chestLabel = this.root.querySelector("#finalChestLabel");
    const chestInstruction = this.root.querySelector("#finalChestInstruction");
    const rewardPanel = this.root.querySelector("#finalChestRewardPanel");
    const claimRewardButton = this.root.querySelector("#btn-final-chest-ok");
    const claimRewardLabel = this.root.querySelector(".final-chest-ok-label");
    let chestOpened = Boolean(opened);
    let rewardClaimPending = false;

    chestButton?.addEventListener("click", () => {
      if (chestOpened) return;
      chestOpened = true;
      chestButton.classList.add("is-opened");
      if (chestArt instanceof HTMLElement) {
        const openSrc = chestArt.getAttribute("data-open-src") || "";
        if (openSrc) {
          chestArt.style.backgroundImage = `url("${openSrc}")`;
          chestArt.classList.add("is-sprite-open");
        }
      }
      if (chestLabel) {
        chestLabel.textContent = "Treasure Claimed";
      }
      if (chestInstruction) {
        chestInstruction.textContent =
          "You completed every level. Your final coin treasure is ready.";
      }
      if (rewardPanel) {
        rewardPanel.hidden = false;
      }
      if (typeof onChestOpen === "function") {
        onChestOpen();
      }
    });

    claimRewardButton?.addEventListener("click", () => {
      if (rewardClaimPending) return;
      rewardClaimPending = true;
      claimRewardButton.disabled = true;
      claimRewardButton.classList.add("is-loading");
      claimRewardButton.setAttribute("aria-busy", "true");
      if (claimRewardLabel) {
        claimRewardLabel.textContent = "Claiming...";
      }

      window.setTimeout(() => {
        claimRewardButton.classList.remove("is-loading");
        claimRewardButton.classList.add("is-claimed");
        claimRewardButton.setAttribute("aria-busy", "false");
        if (claimRewardLabel) {
          claimRewardLabel.textContent = "Claimed";
        }

        window.setTimeout(() => {
          if (typeof onContinue === "function") {
            onContinue();
          }
        }, 700);
      }, 1600);
    });
  }

  credits({
    totalCoins = 0,
    totalLevels = 4,
    onPlayAgain,
    onBackToMap,
  }) {
    this.cleanupTouchControls();
    this.cleanupRouteMapUi();
    this.show();
    const safeTotalCoins = Math.max(0, Math.floor(Number(totalCoins) || 0));
    const safeTotalLevels = Math.max(1, Math.floor(Number(totalLevels) || 0));
    this.root.innerHTML = `
      <div
        class="screen card-screen credits-screen"
        style="--credits-finish-image:url('${FUTURE_LEVELS_BG_IMAGE}')"
      >
        <div class="credits-finish-shell">
          <div class="credits-finish-content">
            <div class="credits-finish-copy">
              <p class="credits-lead">More levels are coming soon!</p>
            </div>
            <div class="row-buttons credits-actions credits-finish-actions">
              <button type="button" id="btn-play-again" class="credits-go-btn credits-play-again-btn">Play Again</button>
              <button
                type="button"
                id="btn-map"
                class="credits-go-btn credits-back-map-btn"
                aria-label="Back to main menu"
                title="Back to main menu"
              >
                <i class="fa-solid fa-house" aria-hidden="true"></i>
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.root
      .querySelector("#btn-play-again")
      ?.addEventListener("click", onPlayAgain);
    this.root.querySelector("#btn-map")?.addEventListener("click", onBackToMap);
  }

  settings({
    currentControlScheme = "",
    controlOptions = [],
    keyBindings = [],
    pendingAction = null,
    onChangeControlScheme,
    onStartRebind,
    onResetBindings,
    onBack,
  }) {
    const movementActions = ["left", "right", "jump"];
    const fireActions = ["skill"];
    const firePanelActions = [
      "fireUp",
      "fireDown",
      "fireLeft",
      "fireRight",
      "fireUpLeft",
      "fireUpRight",
      "fireDownLeft",
      "fireDownRight",
    ];

    const group = (actions, title, sectionClass = "") => {
      const entries = keyBindings.filter((e) => actions.includes(e.action));
      if (entries.length === 0) return "";
      const rows = entries
        .map(
          (entry) => `
          <div class="bind-row">
            <div class="bind-action">${entry.label}</div>
            <div class="bind-key">${(entry.keys || []).join(" / ") || "-"}</div>
            <button class="bind-change" data-action="${entry.action}" ${pendingAction && pendingAction !== entry.action ? "disabled" : ""}>
              ${pendingAction === entry.action ? "PRESS KEY..." : "CHANGE"}
            </button>
          </div>
        `,
        )
        .join("");
      return `<div class="bind-section ${sectionClass}"><div class="bind-section-title">${title}</div><div class="bind-grid">${rows}</div></div>`;
    };

    const sections =
      group(movementActions, "Movement") +
      // group(aimActions, "Aim") +
      group(fireActions, "Fire") +
      group(firePanelActions, "Fire panel (8-way)", "bind-section-fire-panel");

    const schemeOptions =
      controlOptions.length > 0
        ? `
       
        <div class="hero-meta settings-scheme-desc">${controlOptions.find((o) => o.id === currentControlScheme)?.description || ""}</div>
      `
        : "";

    const isCompactView =
      typeof window !== "undefined" &&
      (window.innerWidth <= 1024 || window.innerHeight <= 700);
    const isLaptopView =
      typeof window !== "undefined" &&
      window.innerWidth > 1024 &&
      window.innerHeight > 700;
    const compactClass = isCompactView ? " settings-screen-compact" : "";
    const laptopClass = isLaptopView ? " settings-screen-laptop" : "";
    const controlCharacterImage =
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/6104798070395571346-removebg-preview_iweuwl.png";

    this.show();
    this.root.innerHTML = `
      <div class="screen card-screen settings-screen settings-screen-war${compactClass}${laptopClass}">

        <div class="settings-scroll">
          <div class="settings-layout">
            <div class="attune-details keybind-panel settings-panel-left">
              <div class="attune-title">CONTROL PANEL</div>
              ${schemeOptions}
              <div class="attune-title keybind-subtitle">KEY BINDINGS</div>
              <div class="keybind-sections">${sections}</div>
              <div class="keybind-hint">Fire = direction keys. Change keys below.</div>
              <div class="hero-meta settings-pending-hint">${pendingAction ? "Press a keyÃ¢â‚¬Â¦ ESC to cancel." : "Tap CHANGE to rebind."}</div>
              <div class="row-buttons settings-actions-row">
                <button id="btn-reset-bind">RESET KEYS</button>
                <button type="button" class="settings-back-btn js-settings-back">BACK</button>
              </div>
            </div>
            <div class="settings-character-stage" aria-hidden="true">
              <div class="settings-character-frame">
                <div class="settings-character-glow"></div>
                <img class="settings-character-image" src="${controlCharacterImage}" alt="" />
              </div>
              <div class="settings-character-caption">AXO CONTROL SPIRIT</div>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button type="button" id="btn-back" class="settings-back-btn">BACK</button>
        </div>
      </div>
    `;

    const schemeSelect = this.root.querySelector("#settings-scheme");
    if (schemeSelect && typeof onChangeControlScheme === "function") {
      schemeSelect.addEventListener("change", () => {
        onChangeControlScheme(schemeSelect.value);
      });
    }
    this.root.querySelectorAll(".bind-change").forEach((el) => {
      el.addEventListener("click", () =>
        onStartRebind?.(el.getAttribute("data-action")),
      );
    });
    this.root
      .querySelector("#btn-reset-bind")
      ?.addEventListener("click", onResetBindings);
    const onBackClick = () => onBack?.();
    this.root
      .querySelector("#btn-back")
      ?.addEventListener("click", onBackClick);
    this.root.querySelectorAll(".js-settings-back").forEach((el) => {
      el.addEventListener("click", onBackClick);
    });
  }

  toast(text, ms = 3000) {
    // Toasts are intentionally disabled for the current UI pass.
    void text;
    void ms;
    return;

    const normalizedText = normalizeToastMessage(text);
    if (!normalizedText) return;

    let container = document.getElementById("axo-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "axo-toast-container";
      container.setAttribute("aria-live", "polite");
      container.className = "toast-container";
      (document.body || this.root).appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "alert");
    toast.textContent = normalizedText;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
      toast.classList.remove("toast-visible");
      setTimeout(() => toast.remove(), 200);
    }, ms);
  }

  cleanupTouchControls() {
    if (typeof this.touchControlCleanup === "function") {
      this.touchControlCleanup();
    }
    this.gameplayAudioStateSetter = null;
  }

  cleanupRouteMapUi() {
    if (typeof this.routeMapCleanup === "function") {
      this.routeMapCleanup();
    }
  }

  setGameplayAudioEnabled(enabled) {
    if (typeof this.gameplayAudioStateSetter === "function") {
      this.gameplayAudioStateSetter(enabled);
    }
  }
}
