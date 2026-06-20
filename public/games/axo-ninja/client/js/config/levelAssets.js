export const LEVEL_ASSETS = {
  1: {
    name: "Coral Cove",
    world: "beach",
    difficultyMultiplier: 1.4,
    sizeTiles: { w: 340, h: 16 },
    parallax: [
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/bg/webp/layer0_trqxxb.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/bg/webp/layer4_zicpq0.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/bg/webp/layer1_gmc6fb.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/bg/webp/layer2_pxl5bo.webp",
"https://ik.imagekit.io/6rsuaxauw/axo-quest/new_mfhwqd.webp",
      
    ],
    music:
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/bg-song_rhrnll.m4a",
    boss: "sandBoss",
    enemies: ["plague", "red", "spiked", "golden", "grin"],
  },

  2: {
    name: "Blue Depths",
    world: "water",
    difficultyMultiplier: 1.2,
    sizeTiles: { w: 360, h: 14 },
    parallax: [
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/bg/webp/layer0_c1lx3d.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/bg/webp/layer1_wuafxi.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/bg/webp/LAYER3_vjtzus.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/bg/webp/layer4_eevvft.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/bg/webp/layer5_jhmsaf.webp",
    ],
    music:
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/bg-song_rhrnll.m4a",
    boss: "crabBoss",
    enemies: ["fishScout", "coralHydra", "coralShooter", "eliteWaterGuard", "jellyBomber"],
  },

  3: {
    name: "Ice Peak",
    world: "ice",
    difficultyMultiplier: 1.6,
    sizeTiles: { w: 340, h: 15 },
    parallax: [
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/bg/webp/layer0_keiv9e.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/bg/webp/layer1_ymj85y.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/bg/webp/layer2_dx5kqx.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/bg/webp/layer3_hlpwp7.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/bg/webp/layer4_jotfnr.webp",
    ],
    music:
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/bg-song_rhrnll.m4a",
    boss: "iceTitan",
    enemies: ["plague", "red", "spiked", "golden", "grin"],
  },

  4: {
    name: "Shadow Hollow",
    world: "grave",
    difficultyMultiplier: 1.9,
    sizeTiles: { w: 440, h: 17 },
    parallax: [
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/bg/webp/layer0_m2slsn.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/bg/webp/layer1_irzkai.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/bg/webp/layer2_dz32ua.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/bg/webp/layer3_hgiv6y.webp",
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/bg/webp/layer4_as8v2e.webp",
    ],
    music:
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/music/bg-song_rhrnll.m4a",
    boss: "necroKing",
    enemies: ["plague", "red", "spiked", "golden", "grin"],
  },
};

export function getLevelDisplayName(levelId, fallback = "") {
  const levelKey = Number(levelId);
  const preferred = LEVEL_ASSETS[levelKey]?.name;
  const raw = String(preferred || fallback || "").trim();
  return raw || `Level ${levelKey || "?"}`;
}
