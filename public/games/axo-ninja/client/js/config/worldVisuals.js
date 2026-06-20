import { TILE } from "./tileIds.js";

export const WORLD_VISUALS = {
  ice: {
    tileTextures: {
      // Base solid should be the inner body tile; top edge is handled by variants.solidTop.
      [TILE.SOLID]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_below_m2g5r9.webp",
      [TILE.ONE_WAY]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_mid_jyhcx3.webp",
      [TILE.SPIKES]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_spikes_dmfhi6.webp",
      [TILE.BARBED_WIRE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/ice_spike_2_e5i9lr.webp",
      [TILE.ICE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/ice_box_ek0qo7.webp",
      [TILE.WATER]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/water_below_xpyqpp.webp",
      [TILE.BRICK]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/box_ipbmif.webp",
      [TILE.BRICK_Box]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/box_vexzd7.webp",
      [TILE.GIFT_BOX]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/box_gift_u5si2m.webp"
    },
    variants: {
      solidTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_mid_u3z7ym.webp",
      solidBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_below_m2g5r9.webp",
      solidLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_left_cth9ft.webp",
      solidRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_right_je58yt.webp",
      solidTopLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_left_cth9ft.webp",
      solidTopRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/floor_right_je58yt.webp",
      oneWayLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_left_cbtwgl.webp",
      oneWayRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/platform_right_r9pmot.webp",
      waterTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/water_up_v69ws2.webp",
      waterBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/water_below_xpyqpp.webp"
    },
    decorations: [
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/gems_ugh2br.webp", width: 86, height: 64, lift: 8, chanceDivisor: 19 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/board_for_start_gco9ox.webp", width: 66, height: 50, lift: 4, chanceDivisor: 41 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/board_before_boss_plo7ix.webp", width: 66, height: 50, lift: 4, chanceDivisor: 39 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/stone_dubacg.webp", width: 76, height: 48, lift: 6, chanceDivisor: 31 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/tree_lsy0pf.webp", width: 72, height: 88, lift: 6, chanceDivisor: 57 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/ice/tileset/webp/snowman_hwbx2z.webp", width: 56, height: 95, lift: 4, chanceDivisor: 53 }
    ]
  },
  water: {
    tileTextures: {
      [TILE.SOLID]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp",
      [TILE.ONE_WAY]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_mid_j6dr52.webp",
      [TILE.SPIKES]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/obstacle_sea_urchin_rdeuyj.webp",
      [TILE.ICE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_mid_fbliif.webp",
      [TILE.WATER]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp",
      [TILE.BRICK]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_mid_fbliif.webp",
      [TILE.GIFT_BOX]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_mid_fbliif.webp"
    },
    variants: {
      solidTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_mid_fbliif.webp",
      solidBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp",
      solidLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_left_wi4gbg.webp",
      solidRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_right_lgxf8n.webp",
      solidTopLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_left_wi4gbg.webp",
      solidTopRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_right_lgxf8n.webp",
      oneWayLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_left_pd0el9.webp",
      oneWayRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/platform_right_boqgt7.webp",
      // waterTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp",
      // waterBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/underwater/tileset/webp/floor_below_fa14dp.webp"
    },
    decorations: []
  },
  beach: {
    tileTextures: {
      [TILE.SOLID]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/sand_mid_gldeth.webp",
      [TILE.ONE_WAY]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/platform_mid_jy3nlj.webp",
      [TILE.SPIKES]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/obstacle-spikes_jcdcih.webp",
      [TILE.ICE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/sand_mid_gldeth.webp",
      [TILE.WATER]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/water-down_bj34f0.webp",
      [TILE.BRICK]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/box_vexzd7.webp",
      [TILE.GIFT_BOX]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/gift_box_mvg2ha.webp",
      [TILE.BARBED_WIRE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/Obstacle-barbed-wire_yorpli.webp"
    },
    variants: {
      solidTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/ground-floor-up_kdpxhi.webp",
      solidBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/sand_mid_gldeth.webp",
      solidLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/ground-floor-down_tznt1t.webp",
      solidRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/sand_top_right_jzzhqp.webp",
      solidTopLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/ground-floor-down_tznt1t.webp",
      solidTopRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/sand_top_right_jzzhqp.webp",
      oneWayLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/platform_left_tn3fca.webp",
      oneWayRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/platform_right_l4ylwp.webp",
      waterTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/water-up_h3awmc.webp",
      waterBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/water-down_bj34f0.webp"
    },
    textureCrops: {
      "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/obstacle-spikes_jcdcih.webp": {
        cropX: 0,
        cropY: 16,
        cropW: 64,
        cropH: 48,
        offsetX: 0,
        offsetY: 0
      }
    },
    decorations: [
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/decorative-seashell1_elvahm.webp", width: 40, height: 28, lift: 3, chanceDivisor: 21 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/decorative-seashell_yrzymk.webp", width: 40, height: 28, lift: 3, chanceDivisor: 23 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/decorative-sand-castle_hwhbst.webp", width: 80, height: 60, lift: 4, chanceDivisor: 31 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/decorative-star_xk1jwl.webp", width: 36, height: 36, lift: 3, chanceDivisor: 29 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/beach/tileset/webp/coconut_tree_afejm0.webp", width: 96, height: 144, lift: 6, chanceDivisor: 41 }
    ]
  },
  grave: {
    tileTextures: {
      [TILE.SOLID]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-down_z6hihw.webp",
      [TILE.ONE_WAY]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_mid_n1ntze.webp",
      [TILE.SPIKES]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_spikes_ykbhza.webp",
      [TILE.ICE]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-down_z6hihw.webp",
      [TILE.WATER]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_bones_iukmpg.webp",
      [TILE.POISON]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/lava_down_tgnurb.webp",
      [TILE.BRICK]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/box_uizbwp.webp",
      [TILE.GIFT_BOX]: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/gift_box_kdsqrx.webp"
    },
    variants: {
      solidTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-mid_wtihti.webp",
      solidBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-down_z6hihw.webp",
      solidLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-left_ftg1k5.webp",
      solidRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground_floor_right_iwunty.webp",
      solidTopLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground-floor-left_ftg1k5.webp",
      solidTopRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/ground_floor_right_iwunty.webp",
      oneWayLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_left_sr7bge.webp",
      oneWayRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_right_jygj1g.webp",
      // Floating (air) SOLID platforms: use platform left/right/mid instead of floor
      solidFloatingLeft: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_left_sr7bge.webp",
      solidFloatingRight: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_right_jygj1g.webp",
      solidFloatingMid: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/platform_mid_n1ntze.webp",
      waterTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_bones_iukmpg.webp",
      waterBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_bones_iukmpg.webp",
      poisonTop: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/lava_up_ppzypg.webp",
      poisonBottom: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/lava_down_tgnurb.webp"
    },
    decorations: [
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/obstacle_skull_f5ljyt.webp", width: 34, height: 34, lift: 2, chanceDivisor: 16 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/decorative-grave_1_wsqowh.webp", width: 48, height: 48, lift: 2, chanceDivisor: 23 },
      { path: "https://ik.imagekit.io/6rsuaxauw/axo-quest/axogame-assets/backgrounds/graveyard/tileset/webp/decorative-grave_wnvzvh.webp", width: 48, height: 48, lift: 2, chanceDivisor: 25 }
    ]
  }
};

export function collectWorldVisualPaths() {
  const paths = new Set();
  Object.values(WORLD_VISUALS).forEach((world) => {
    Object.values(world.tileTextures || {}).forEach((p) => paths.add(p));
    Object.values(world.variants || {}).forEach((p) => paths.add(p));
    (world.decorations || []).forEach((d) => paths.add(d.path));
  });
  return [...paths];
}
