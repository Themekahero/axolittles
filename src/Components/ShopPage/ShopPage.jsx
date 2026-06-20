import { useEffect, useRef, useState } from "react";
import TypingHeading from "../TypingHeading/TypingHeading";
import useMouseParallax from "../../hooks/useMouseParallax";
import Section2 from "../Section2/Section2";
import PlayLearnHub from "../PlayLearnHub/PlayLearnHub";
import "./ShopPage.css";

const sectionCards = [
  {
    id: "merchandise",
    eyebrow: "Wear the wave",
    title: "Hoodies",
    description:
      "Signature hoodies and other Axo merch drops built around the same clean blue palette already used across the site.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150942/ChatGPT_Image_Mar_17_2026_06_03_10_AM_u6blkp_mtptcg.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151222/ChatGPT_Image_Mar_17_2026_06_03_11_AM-1_qil8d5_o815ul.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151245/ChatGPT_Image_Mar_17_2026_06_03_10_AM-1_uz3gt7_x8zl1x.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151285/ChatGPT_Image_Mar_17_2026_06_03_10_AM-3_dargns_geqgtj.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151307/Gemini_Generated_Image_yld095yld095yld0_1_ehlli5_lsv0io.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151373/Gemini_Generated_Image_yld095yld095yld0_3_rlkxfm_tjy4xx.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151396/Gemini_Generated_Image_yld095yld095yld0_2_qsdxoj_fdzgux.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151448/Gemini_Generated_Image_hmpwdshmpwdshmpw_syxlgz_gnmobn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151476/Gemini_Generated_Image_7o8vp37o8vp37o8v_2_tx5zpv_llut1t.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151505/Gemini_Generated_Image_cfhqaocfhqaocfhq_uav8wv_lmqgae.webp",
      // "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151528/Design_a_luxury_202603191059_1_rgy8a5_p3c0qc.webp",
      // "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151559/Design_a_luxury_202603191059_ylokjl_wljequ.webp",
    ],
    tone: "sky",
    wide: true,
    categorySlug: "kidswear",
  },
  {
    id: "toys",
    eyebrow: "Play shelf",
    title: "Toys",
    description:
      "Soft figures, display collectibles, and desk toys designed to bring the Axo crew off-screen and into real life.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151028/Use_the_provided_202603191136_nar3y8_bsg92k.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151638/Create_a_luxury_202603191142_ldigqg_hnd3h5.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151722/Use_the_provided_202603191136_1_ob0i6h_pliygt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151746/Gemini_Generated_Image_jgup7hjgup7hjgup_og0euq_mjj7bw.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151767/the_angel_ring_202603201531_rnacx0_mlngrb.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151790/ChatGPT_Image_Mar_17_2026_06_03_14_AM_xfjb6f_cvp6jt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151813/ChatGPT_Image_Mar_17_2026_06_03_08_AM_uhikyr_worruh.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151835/ChatGPT_Image_Mar_17_2026_06_03_08_AM-3_gkeuix_xxta5f.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151859/ChatGPT_Image_Mar_17_2026_06_03_08_AM-2_xyw4yq_acqvvq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151882/ChatGPT_Image_Mar_17_2026_06_03_08_AM-1_uckz7u_fzhw3w.webp",
    ],
    tone: "sun",
    categorySlug: "water-toys",
  },
  // {
  //   id: "sketch-books",
  //   eyebrow: "Creative corner",
  //   title: "Sketch Books",
  //   description:
  //     "Art-ready sketch books with playful Axo covers, thicker pages, and a premium feel made for doodles, ideas, and classroom creativity.",
  //   cta: "Coming Soon",
  //   images: [
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773299234/storybooks_h652gs.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409312/1773_stksby.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409312/2055_lcr24e.webp",
  //   ],
  //   tone: "pearl",
  // },
  {
    id: "story-books",
    eyebrow: "Bedtime mode",
    title: "Story Books",
    description:
      "Colorful picture books and short adventures that make the world more accessible for younger readers and families.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151940/Design_a_premium_202603191152_nbwdax_wzyxzh_yhu11x.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151963/Create_a_luxury_202603191154_pvcuq4_1_m8b0i6_f6ct3j.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151987/Create_a_luxury_202603191154_1_m7ad6i_euruz7.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152031/ChatGPT_Image_Mar_17_2026_06_21_19_AM_o4hzc4_lsvw2s.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152063/Design_a_premium_202603191152_1_kxvjua_enkhbs.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152083/ChatGPT_Image_Mar_17_2026_06_21_19_AM-2_s98nb0_qugjfc.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152118/ChatGPT_Image_Mar_17_2026_06_21_19_AM-3_agpgub_hdngji.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152184/ChatGPT_Image_Mar_17_2026_06_21_19_AM-4_ewjhhd_qy6h8m.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152211/ChatGPT_Image_Mar_17_2026_06_21_19_AM-1_tqswg8_jznqbo.jpg",
    ],
    tone: "mint",
    categorySlug: "story-books",
  },
  // {
  //   id: "activity-books",
  //   eyebrow: "Learn and play",
  //   title: "Activity Books",
  //   description:
  //     "Interactive Axo activity books filled with coloring, tracing, puzzles, and playful tasks that keep the brand world active beyond the screen.",
  //   cta: "Coming Soon",
  //   images: [
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773299234/storybooks_h652gs.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409312/2055_lcr24e.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409312/1773_stksby.webp",
  //   ],
  //   tone: "mint",
  // },
  // {
  //   id: "bubble-bath-toy-set",
  //   eyebrow: "Playful bath-time",
  //   title: "Axo Bubble Bath Toy Set",
  //   description:
  //     "A playful bath-time set made for kids, with soft axo-inspired toys that turn everyday routines into part of the Axo universe.",
  //   cta: "Coming Soon",
  //   images: [
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773299232/bubblebathtoysets_j29ein.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409311/2562_yp2pxf.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409311/8616_hqfyay.webp",
  //   ],
  //   tone: "pearl",
  //   wide: true,
  // },
  {
    id: "stickers",
    eyebrow: "Collectible fun",
    title: "Sticker Packs",
    description:
      "Glossy sticker sheets and die-cut mini packs featuring Axo characters, icons, bubbles, and bright little details kids can collect and swap.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152250/Gemini_Generated_Image_1upeuf1upeuf1upe_2_zcttlt_albux8.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152274/Gemini_Generated_Image_dq78bkdq78bkdq78_wwhlyn_cy1afl.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152328/A_set_of_axolittles_without_tail_diecut_stickers_s_delpmaspu_vzssqn_shoiac.jpg",
    ],
    tone: "sun",
    categorySlug: "accessories",
  },
  {
    id: "bottle-tiffin-set",
    eyebrow: "School essentials",
    title: "Bottle / Tiffin Set",
    description:
      "Matching lunch and hydration sets designed for school days with coordinated Axo prints, practical compartments, and cheerful everyday appeal.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151010/Create_a_premium_202603201601_trnpio_xpklay.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152434/Design_a_modern__202603201556_vm5xvy_olbusp.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152461/Design_a_modern__202603201558_1_tei7w5_xe8bpe.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152481/Gemini_Generated_Image_z7bxipz7bxipz7bx_2_fnj0ox_nw4elf.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152502/Minimalist_branded_tiffin_202603201559_vqnz1e_ncvbzl.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152524/1_3_fawkfg_k3ifa2.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152552/1_1_jgcr7d_ivuwsa.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152573/Gemini_Generated_Image_d5op9zd5op9zd5op_y3sndx_nsvzif.jpg",
    ],
    tone: "blush",
    categorySlug: "school-essentials",
  },
  {
    id: "school-bags",
    eyebrow: "Carry the crew",
    title: "School Bags",
    description:
      "School bags and mini backpacks with bold Axo fronts, roomy compartments, and fun premium details made for daily adventure.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152798/Gemini_Generated_Image_5s5jkd5s5jkd5s5j_sifxlo_sb3vcn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152824/Gemini_Generated_Image_vxvkj2vxvkj2vxvk_i7b5jp_bmnve1.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152857/ChatGPT_Image_Mar_17_2026_06_50_29_AM_gc0pcu_zeyf55.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152882/Gemini_Generated_Image_bptvq0bptvq0bptv_jydjms_dp0560.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152909/Gemini_Generated_Image_z7bxipz7bxipz7bx_1_ht8msk_uiqjic.jpg",
    ],
    tone: "sky",
    categorySlug: "school-essentials",
  },
  {
    id: "wallpapers",
    eyebrow: "Room decor",
    title: "Wallpapers",
    description:
      "Playful Axo wall wallpapers designed to brighten kids’ rooms, nurseries, and creative spaces with soft colors, cheerful characters, and a cozy storybook feel.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151101/want_a_full_202603191201_jschjx_imz1tt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152993/Gemini_Generated_Image_lxy4eulxy4eulxy4_qmfugx_xmfnnu.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153016/Gemini_Generated_Image_omo54vomo54vomo5_n7p3wu_eyy6gw.jpg",
    ],
    tone: "pearl",
    layout: "stack",
    categorySlug: "accessories",
  },
  {
    id: "keychains",
    eyebrow: "Pocket merch",
    title: "Keychains",
    description:
      "Cute Axo keychains made for bags, pencil cases, and zippers, with collectible character charm designs and bright glossy finishes.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151051/Design_a_premium_202603191114_sjxjgc_ekjoqh.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153065/Gemini_Generated_Image_q1ptx2q1ptx2q1pt_ff6nez_dsagte.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153096/Design_a_soft_202603191123_meckja_nm9wyb.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153118/Design_a_premium_202603191105_qlezdn_y7fhxe.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153142/remove_the_glow_202603191119_ohz2kr_bgwwrc.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153164/Create_a_soft_202603191125_ihkeu2_s5o3mf.webp",
    ],
    tone: "sun",
    categorySlug: "accessories",
  },
  {
    id: "plushies",
    eyebrow: "Cuddle shelf",
    title: "Plushies",
    description:
      "Soft Axo plushies with collectible personalities, cozy materials, and display-worthy styling that make them perfect for gifting and bedtime.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153223/Design_a_premium_202603191128_waulyt_wnqiqn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153250/Design_a_premium_202603191138_glyn45_ve5ing.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150967/A_premium_toy_product_shot_of_baby_axo_plush_an_ad_delpmaspu_yrtpwl_bil3ex.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153296/ChatGPT_Image_Mar_17_2026_06_03_34_AM_vpuiqj_cebfa7.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153344/ChatGPT_Image_Mar_17_2026_06_03_37_AM_uy8jzv_iggjbg.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101845_dwn5cd.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153374/Create_a_premium__202604101841_xmfbau_kicdof.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086373/Create_a_premium__202604101836_yrcxyt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086372/Create_a_premium__202604101850_cjnun9.webp",
    ],
    tone: "mint",
    wide: true,
    categorySlug: "plush-toys",
  },
  // {
  //   id: "plastic-toys",
  //   eyebrow: "Action ready",
  //   title: "Plastic Toys",
  //   description:
  //     "Durable Axo plastic toys and mini figures built for energetic play, display setups, and collectible lineup moments.",
  //   cta: "Coming Soon",
  //   images: [
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773299234/toys_tjcl0b.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409311/2562_yp2pxf.webp",
  //     "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773409311/8616_hqfyay.webp",
  //   ],
  //   tone: "sky",
  // },
  {
    id: "water-bottles",
    eyebrow: "Hydration time",
    title: "Water Bottles",
    description:
      "Reusable Axo water bottles with playful character styling, school-friendly sizes, and a colorful everyday merch look.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153442/Design_a_premium_202603191051_krru9g_j0mykz.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153468/Design_a_premium_202603191052_r7nxpr_ci5zks.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153510/Design_a_high-end_202603191054_rg5fxh_cvoxcq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153570/A_set_of_three_cute_axolittleswithout_tail_water_b_delpmaspu_h382hk_ivbkz1.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153599/ChatGPT_Image_Mar_17_2026_06_37_21_AM_1_hskoty_brkcxv.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153625/Create_a_luxury_202603191042_ssopea_pmuvfo.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153649/Gemini_Generated_Image_dq78bkdq78bkdq78_1_1_n2dken_rzvsuw.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153676/Gemini_Generated_Image_lm5a3hlm5a3hlm5a_m1b6fd_jq5kca.jpg",
    ],
    tone: "pearl",
    categorySlug: "school-essentials",
  },
  {
    id: "pencil-pouches",
    eyebrow: "Desk companions",
    title: "Pencil Pouches",
    description:
      "Soft zip pencil pouches and standing organizers with Axo artwork, practical storage, and a polished school-shelf presentation.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153715/A_premium_pencil_202603181849_eanouz_g4j1ca.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153740/A_premium_pencil_202603181851_prrdjx_opucgj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153766/A_premium_axolittles_pencil_pouch_in_the_same_cute_delpmaspu_ziorte_zonn6z.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153792/A_premium_axolittles_pencil_pouch_in_the_same_cute_delpmaspu_1_vj87hn_nbiigz.webp",
    ],
    tone: "sun",
    categorySlug: "school-essentials",
  },
  {
    id: "night-suit",
    eyebrow: "Bedtime comfort",
    title: "Axo Night Suit",
    description:
      "A cute and cozy Axo-themed night suit for kids, inspired by soft pastel tones, playful ocean details, and lovable character design to make bedtime feel warm, calm, and part of the Axo world.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776155942/keep_the_axo_202603191030_f2mhjf_dgy1iv.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776155978/Design_a_premium_202603191027_1_wuhsa3_ebr1xj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160196/Design_a_premium_202603191027_qzjbsa_jw0e57.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160221/ChatGPT_Image_Mar_17_2026_06_03_13_AM-1_g7sxah_kmb408.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160264/ChatGPT_Image_Mar_17_2026_06_03_13_AM-2_ozsaiv_tesvgw.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160292/ChatGPT_Image_Mar_17_2026_06_03_13_AM-3_i1mecu_k9fbnn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160322/Use_the_provided_202603191040_nckpg4_yjx1l1.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160361/Create_a_premium_202603191036_stuwey_vdxm3w.webp",

      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160386/remove_the_big_202603191033_ldyzbx_zpeyha.jpg",
    ],
    tone: "pearl",
    categorySlug: "kidswear",
  },
  {
    id: "axo-baby-essentials",
    eyebrow: "Soft newborn comfort",
    title: "Axo Baby Essentials Set",
    description:
      "A thoughtfully designed Axo-themed baby collection that brings together everyday comfort and care. Featuring cozy clothing sets, a gentle sleep-ready crib setup, and a smooth, travel-friendly stroller, each piece is crafted to feel soft, safe, and soothing for newborns—perfect for daily moments, restful sleep, and on-the-go ease.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101823_cukgqy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151079/dont_change_anything_202603181728_wzoeau_u6pfnf.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160480/Take_these_face_202603181728_ttjqsa_z2sgnx.webp",
      "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773839156/axo%20merch/new%20merch/baby%20cloth%27/Take_these_face_202603181728_1_jodcoq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101827_1_wdzzwx.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_2_dhp0rx.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160928/ChatGPT_Image_Mar_17_2026_06_03_04_AM-1_txw5b1_nmk48t.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160457/ChatGPT_Image_Mar_17_2026_06_03_04_AM_vcuua2_oxtqhq.webp",
      "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773732481/axo%20merch/baby%20cloths/ChatGPT_Image_Mar_17_2026_06_03_04_AM-2_h4rnjn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160905/ChatGPT_Image_Mar_17_2026_06_03_04_AM-3_qhxp1u_buirge.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_wmp1uo.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160713/Create_a_premium__202604101834_1_wlpsso_nhtgbn.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_1_z9nute.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101834_2_mscywy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160974/Take_these_face_202603181728_2_lebscp_yn34ra.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101827_2_l6w857.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162203/Create_a_premium__202604101827_xq5ont_oj3bgf.jpg",
    ],
    tone: "blush",
    layout: "stack",
    categorySlug: "kidswear",
  },
  {
    id: "mugs",
    eyebrow: "Sip with Axo",
    title: "Mugs",
    description:
      "Cute Axo mugs made for cozy milk, cocoa, and everyday sips, with playful character artwork and a clean collectible finish.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162768/Gemini_Generated_Image_bfh7p2bfh7p2bfh7_xoycue_efetgj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162795/A_premium_ceramic_202603181726_anwlxq_epdpkt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162818/A_premium_ceramic_202603181727_xdxiao_brbg0k.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162845/A_premium_mug_202603181726_fdg2m9_ipqa0i.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162868/A_premium_ceramic_202603181726_1_ouo1r2_wc4ntw.jpg",
    ],
    tone: "sky",
    categorySlug: "accessories",
  },
  {
    id: "baby-hoodies",
    eyebrow: "Tiny Axo style",
    title: "Baby Hoodies",
    description:
      "Soft baby hoodies with adorable Axo character prints, gentle fabrics, and cozy comfort designed for everyday cuteness.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161815/A_tiny_baby_202603181730_ri9csq_awhgcp.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161839/Gemini_Generated_Image_2gsqey2gsqey2gsq_nya7qa_xgr1ew.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161865/Gemini_Generated_Image_646fht646fht646f_tnzvc3_jfs1ii.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161885/A_tiny_baby_202603181730_1_de7pm6_ufocdm.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161905/Gemini_Generated_Image_xk10lgxk10lgxk10_weoo1b_u7siwc.webp",
    ],
    tone: "pearl",
    layout: "stack",
    categorySlug: "kidswear",
  },
  {
    id: "tracksuits",
    eyebrow: "Playtime fit",
    title: "Tracksuits",
    description:
      "Comfy Axo tracksuits for active little ones, featuring playful matching sets, soft materials, and a fun premium character look.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161941/Take_these_face_202603181728_3_f8rbvb_yaygwp.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161960/Take_these_face_202603181729_1_cyotbj_pmzbft.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161978/Take_these_face_202603181729_z4xcly_vrfqo2.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161998/Take_these_face_202603181729_2_ncv52k_1_wccdrx_k3ns0f.jpg",
    ],
    tone: "sun",
    categorySlug: "kidswear",
  },
  {
    id: "baby-feeding-kit",
    eyebrow: "Little mealtime",
    title: "Baby Feeding Kit",
    description:
      "A cute Axo baby feeding kit with bowls, plates, spoons, and cups, designed to make mealtime fun, safe, and full of character.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162103/A_premium_baby_202603181652_egrugd_sktmpd.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162134/A_premium_axolittles-shaped_202603181656_qpt0hq_jutltu.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162160/A_premium_baby_202603181656_ujxavc_vgji6q.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_1_z9nute.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162181/A_premium_baby_202603181657_fdvao5_oqbsoj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162224/A_premium_baby_202603181658_zzhlyu_ttxwfj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_wmp1uo.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162288/A_premium_ceramic_202603181655_xs8bgn_imnajq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162312/Baby_silicone_feeding_202603181644_1_no0ph7_pro8p8.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162203/Create_a_premium__202604101827_xq5ont_oj3bgf.jpg",
    ],
    tone: "mint",
    wide: true,
    categorySlug: "school-essentials",
  },
  {
    id: "tshirts",
    eyebrow: "Everyday Axo wear",
    title: "Tshirts",
    description:
      "Easy everyday Axo T-shirts with lovable character graphics, soft fabric, and a cheerful style made for playful wardrobes.",
    cta: "Coming Soon",
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162347/Take_these_face_202603181730_lveatp_o4eff6.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162369/Take_these_face_202603181729_5_joneke_omrznu.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162388/Take_these_face_202603181730_1_s4t5sz_ixzsjy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162409/Take_these_face_202603181729_4_iq18rj_gosuvp.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162429/Take_these_face_202603181730_2_khztol_dueemq.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162447/Take_these_face_202603181729_3_b8s27l_ad3hr0.webp",
    ],
    tone: "blush",
    categorySlug: "kidswear",
  },
];

const cardLayoutSequence = [
  "copy",
  "media",
  "split",
  "stack",
  "split",
  "media",
];

const ShopPage = ({ onNavigate }) => {
  const [activeSlides, setActiveSlides] = useState(
    Object.fromEntries(sectionCards.map((card) => [card.id, 0])),
  );
  const [lightboxCardId, setLightboxCardId] = useState(null);
  const heroRef = useRef(null);
  const sectionsRef = useRef(null);

  useMouseParallax(heroRef, { strength: 24, easing: 0.12 });
  useMouseParallax(sectionsRef, { strength: 16, easing: 0.12 });

  useEffect(() => {
    const preloaders = [];

    sectionCards.forEach((card) => {
      card.images.forEach((imageUrl) => {
        const image = new window.Image();
        image.decoding = "async";
        image.src = imageUrl;
        preloaders.push(image);
      });
    });

    return () => {
      preloaders.length = 0;
    };
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const cardsWithCarousel = sectionCards.filter(
      (card) => card.images.length > 1,
    );

    const timers = cardsWithCarousel.map((card, index) =>
      window.setInterval(
        () => {
          setActiveSlides((current) => {
            if (lightboxCardId === card.id) {
              return current;
            }

            return {
              ...current,
              [card.id]: (current[card.id] + 1) % card.images.length,
            };
          });
        },
        3200 + (index % 5) * 420,
      ),
    );

    return () => timers.forEach((timer) => window.clearInterval(timer));
  }, [lightboxCardId]);

  useEffect(() => {
    if (!lightboxCardId) {
      return undefined;
    }

    document.body.classList.add("shop-lightbox-open");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxCardId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("shop-lightbox-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxCardId]);

  // const goHome = (event) => {
  //   event.preventDefault();
  //   onNavigate("/axo-web3");
  // };

  const goToCategory = (event, categorySlug) => {
    if (!onNavigate || !categorySlug) {
      return;
    }
    event.preventDefault();
    onNavigate(`/category/${categorySlug}`);
  };

  const goToAboutGame = (event) => {
    if (!onNavigate) {
      return;
    }
    event.preventDefault();
    onNavigate("/axo-game");
  };

  const goToStudio = (event) => {
    if (!onNavigate) {
      return;
    }
    event.preventDefault();
    onNavigate("/axo-studio#home");
  };

  const changeSlide = (cardId, direction, imageCount) => {
    setActiveSlides((current) => ({
      ...current,
      [cardId]: (current[cardId] + direction + imageCount) % imageCount,
    }));
  };

  const lightboxCard = sectionCards.find((card) => card.id === lightboxCardId);
  const lightboxIndex = lightboxCard ? activeSlides[lightboxCard.id] : 0;
  const lightboxImage = lightboxCard
    ? lightboxCard.images[lightboxIndex]
    : null;

  return (
    <div className="shop-page-footeree">
      <div className="shop-page">
        <main className="shop-main">
          <section
            className=" shop-hero parallax-surface shop-hero-page-ht shop-hero-htri"
            ref={heroRef}
          >
            <div className="shop-hero__row">
              <div
                className="shop-hero__copy container shop-copy-ss"
                data-parallax-depth
                style={{ "--depth": 14 }}
              >
                {/* <p className="shop-eyebrow">Axo looks good on you</p> */}
                <TypingHeading
                  as="h1"
                  text="Bring Home the Joy of Axolittles"
                  className="shop-hero__title"
                />
                <p className="shop-hero__text">
                  Toys, clothes, stories, games, songs, and playful surprises
                  made to spark smiles, imagination, and everyday fun.
                </p>
                <div className="shop-hero__actions">
                  <a href="/shop" className="shop-button shop-button--primary">
                    Explore our collection
                  </a>
                  {/* <a
                    href="/axo-web3"
                    className="shop-button shop-button--ghost"
                    onClick={goHome}
                  >
                    Explore studio
                  </a> */}
                </div>
              </div>

              {/* <div className="col-lg-6">
                <div
                  className="shop-hero__visual"
                  data-parallax-depth
                  style={{ "--depth": -10 }}
                >
                  <img
                    src="https://res.cloudinary.com/dbtsrjssc/image/upload/v1773923781/banner_jkufhb.webp"
                    alt="Axo group (updating soon)"
                    loading="eager"
                    decoding="async"
                    className="shop-hero__image"
                  />
                </div>
              </div> */}
            </div>{" "}
            <div
              className="axo-game-section__curve axo-game-section__curve--bottom"
              aria-hidden="true"
            >
              <svg viewBox="0 0 1920 180" preserveAspectRatio="none">
                <path
                  d="M0,180 L0,112 C162,92 307,64 513,64 C759,64 938,132 1206,132 C1490,132 1678,58 1920,36 L1920,180 Z"
                  fill="#ffffff"
                />
                <path
                  d="M0,111 C162,91 307,63 513,63 C759,63 938,131 1206,131 C1490,131 1678,57 1920,35"
                  fill="none"
                  stroke="rgba(166, 151, 214, 0.35)"
                  strokeWidth="4"
                />
              </svg>
            </div>
          </section>
          <Section2 onNavigate={onNavigate} />
          <PlayLearnHub />
          {/* <Section1 /> */}
          <div className="container-fluid pb-5 ">
            <section
              className="shop-sections parallax-surface"
              id="shop-sections"
              ref={sectionsRef}
            >
              <div
                className="shop-sections__intro"
                data-parallax-depth
                style={{ "--depth": 8 }}
              >
                <p className="shop-eyebrow shop-eyebrow--dark">
                  Where toys, stories, and fun come alive.
                </p>
                <TypingHeading
                  as="h2"
                  text="From the world of Axolittles"
                  className="shop-section-title"
                />
                {/* <p className="shop-sections__lede">
                Browse categories like a catalogue, switch between product
                views, and tap any image to open it larger.
              </p> */}
              </div>

              <div className="shop-sections__grid">
                {sectionCards.map((card, index) => {
                  const activeIndex = activeSlides[card.id];
                  const layout =
                    card.layout ||
                    (card.wide
                      ? "split-wide"
                      : cardLayoutSequence[index % cardLayoutSequence.length]);

                  return (
                    <article
                      key={card.id}
                      id={card.id}
                      className={`shop-showcase-card shop-showcase-card--${card.tone} ${
                        card.wide ? "shop-showcase-card--wide" : ""
                      } shop-showcase-card--layout-${layout} ${
                        layout === "media"
                          ? "shop-showcase-card--media-heavy"
                          : ""
                      }`}
                      data-parallax-depth
                      style={{ "--depth": 6 + (index % 3) }}
                    >
                      <div className="shop-showcase-card__media">
                        <button
                          type="button"
                          className="shop-showcase-card__nav shop-showcase-card__nav--prev"
                          onClick={() =>
                            changeSlide(card.id, -1, card.images.length)
                          }
                          aria-label={`Previous ${card.title} image`}
                        >
                          <i className="fa fa-angle-left fa-xs"></i>
                        </button>

                        <div
                          className="shop-showcase-card__image-button"
                          role="button"
                          tabIndex={0}
                          onClick={() => setLightboxCardId(card.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setLightboxCardId(card.id);
                            }
                          }}
                          aria-label={`View ${card.title} image larger`}
                        >
                          <div className="shop-showcase-card__carousel-viewport">
                            <div
                              className="shop-showcase-card__carousel-track"
                              style={{
                                transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
                              }}
                            >
                              {card.images.map((imageUrl, imageIndex) => (
                                <div
                                  key={`${card.id}-slide-${imageIndex}`}
                                  className="shop-showcase-card__carousel-slide"
                                  aria-hidden={imageIndex !== activeIndex}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={
                                      imageIndex === activeIndex
                                        ? card.title
                                        : ""
                                    }
                                    loading={
                                      imageIndex === 0 ? "eager" : "lazy"
                                    }
                                    decoding="async"
                                    draggable={false}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shop-showcase-card__nav shop-showcase-card__nav--next"
                          onClick={() =>
                            changeSlide(card.id, 1, card.images.length)
                          }
                          aria-label={`Next ${card.title} image`}
                        >
                          <i className="fa fa-angle-right fa-xs"></i>
                        </button>

                        <div className="shop-showcase-card__dots">
                          {card.images.map((image, imageIndex) => (
                            <button
                              key={`${card.id}-dot-${imageIndex}`}
                              type="button"
                              className={`shop-showcase-card__dot ${
                                imageIndex === activeIndex ? "is-active" : ""
                              }`}
                              onClick={() =>
                                setActiveSlides((current) => ({
                                  ...current,
                                  [card.id]: imageIndex,
                                }))
                              }
                              aria-label={`${card.title} image ${imageIndex + 1}`}
                            />
                          ))}
                        </div>

                        <span className="shop-showcase-card__zoom-hint">
                          Click image to enlarge
                        </span>

                        {layout === "media" && (
                          <div className="shop-showcase-card__overlay">
                            <p>{card.eyebrow}</p>
                            <h3>{card.title}</h3>
                          </div>
                        )}
                      </div>

                      <div
                        className={`shop-showcase-card__content ${
                          layout === "media"
                            ? "shop-showcase-card__content--hidden"
                            : ""
                        }`}
                      >
                        <div className="shop-showcase-card__meta">
                          <p>{card.eyebrow}</p>
                          <span className="shop-showcase-card__status">
                            {card.cta}
                          </span>
                        </div>
                        <h3>{card.title}</h3>
                        <span className="shop-showcase-card__line"></span>
                        <p className="shop-showcase-card__text">
                          {card.description}
                        </p>
                        {card.categorySlug ? (
                          <a
                            href={`/category/${card.categorySlug}`}
                            className="shop-button shop-button--panel"
                            onClick={(event) =>
                              goToCategory(event, card.categorySlug)
                            }
                          >
                            Shop {card.title}
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
          {/* <HomeGame /> */}{" "}
          <section className="axo-game-section axo-game-section--cream">
            <div className="axo-game-section__curve" aria-hidden="true">
              <svg viewBox="0 0 1920 180" preserveAspectRatio="none">
                <path
                  d="M0,55 C220,88 430,115 705,108 C1015,100 1248,35 1512,35 C1710,35 1820,52 1920,72 L1920,0 L0,0 Z"
                  fill="#ffffff"
                />
                <path
                  d="M0,57 C220,89 430,116 705,109 C1015,101 1248,36 1512,36 C1710,36 1820,53 1920,73"
                  fill="none"
                  stroke="rgba(166, 151, 214, 0.35)"
                  strokeWidth="4"
                />
              </svg>
            </div>

            <div className="axo-game-shell axo-game-section__intro" data-reveal>
              <p className="axo-game-kicker"> AXOLITTLES world</p>
              <h2>
                The shop leads. <br /> The universe sits quietly behind it.
              </h2>
            </div>

            <section className="shop-story-bridge" data-reveal>
              <div className="container">
                <div className="shop-story-bridge__panel">
                  <div className="shop-story-bridge__layout">
                    <div className="shop-story-bridge__copy">
                      <p className="shop-story-bridge__kicker">AXOLITTLES World</p>
                      <h3>
                        Merch gives the world a home. Story and sound give it a
                        pulse.
                      </h3>
                      <p>
                        AXOLITTLES is designed to feel bigger than a storefront. The
                        shop is still the main destination, but behind every
                        drop sits a wider universe of characters, playful
                        adventures, music, motion, and story-led moments that
                        make the collection feel alive.
                      </p>
                      <p>
                        Step into AxoNinja to explore the game world, or open
                        AxoStudio to watch the visual and audio side of the
                        brand unfold.
                      </p>
                      <div className="shop-story-bridge__footer">
                        <a
                          href="/shop"
                          className="shop-button shop-button--primary"
                        >
                          Continue shopping
                        </a>
                      </div>
                    </div>

                    <div className="shop-story-bridge__grid">
                      <article className="shop-story-bridge__card shop-story-bridge__card--ninja">
                        <video
                          className="shop-story-bridge__media"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-label="AxoNinja game preview"
                        >
                          <source
                            src="https://res.cloudinary.com/dbtsrjssc/video/upload/v1774618283/Axoquest-Trim-Trim-ezgif.com-gif-maker_1_qo1rew.mp4"
                            type="video/mp4"
                          />
                        </video>
                        <div
                          className="shop-story-bridge__scrim"
                          aria-hidden="true"
                        />
                        <div className="shop-story-bridge__card-content">
                          <span className="shop-story-bridge__tag">
                            AXONINJA
                          </span>
                          <p className="shop-story-bridge__eyebrow">
                            Game world
                          </p>
                          <h4>Play through the AXOLITTLES universe.</h4>
                          <p>
                            Discover the characters, the motion, and the energy
                            behind the world that inspires the merch.
                          </p>
                          <a
                            href="/axo-game"
                            className="shop-button shop-button--ghost shop-axo-ninja-button"
                            onClick={goToAboutGame}
                          >
                            Explore AxoNinja
                          </a>
                        </div>
                      </article>

                      <article className="shop-story-bridge__card shop-story-bridge__card--studio">
                        <video
                          className="shop-story-bridge__media"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-label="AxoStudio preview"
                        >
                          <source
                            src="https://res.cloudinary.com/dbtsrjssc/video/upload/v1774617384/WhatsAppVideo2026-03-27at1.08.52PM-ezgif.com-gif-maker_vbzem3.mp4"
                            type="video/mp4"
                          />
                        </video>
                        <div
                          className="shop-story-bridge__scrim"
                          aria-hidden="true"
                        />
                        <div className="shop-story-bridge__card-content">
                          <span className="shop-story-bridge__tag">
                            AXO STUDIO
                          </span>
                          <p className="shop-story-bridge__eyebrow">
                            Audio and video
                          </p>
                          <h4>See the motion side of the brand.</h4>
                          <p>
                            Open the studio to explore music, videos, visuals,
                            and creative drops that expand the AXOLITTLES vibe.
                          </p>
                          <a
                            href="/axo-studio#home"
                            className="shop-button shop-button--ghost shop-axo-ninja-button"
                            onClick={goToStudio}
                          >
                            Visit AxoStudio
                          </a>
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* <div
              className="axo-game-section__curve axo-game-section__curve--bottom"
              aria-hidden="true"
            >
              <svg viewBox="0 0 1920 180" preserveAspectRatio="none">
                <path
                  d="M0,180 L0,112 C162,92 307,64 513,64 C759,64 938,132 1206,132 C1490,132 1678,58 1920,36 L1920,180 Z"
                  fill="#ffffff"
                />
                <path
                  d="M0,111 C162,91 307,63 513,63 C759,63 938,131 1206,131 C1490,131 1678,57 1920,35"
                  fill="none"
                  stroke="rgba(166, 151, 214, 0.35)"
                  strokeWidth="4"
                />
              </svg>
            </div> */}
          </section>
        </main>
      </div>
      {lightboxCard && (
        <div
          className="shop-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${lightboxCard.title} image viewer`}
          onClick={() => setLightboxCardId(null)}
        >
          <div
            className="shop-lightbox__dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="shop-lightbox__close"
              onClick={() => setLightboxCardId(null)}
              aria-label="Close image viewer"
            >
              <i className="fa fa-close fa-xs"></i>
            </button>
            <div className="shop-lightbox__header">
              <p>{lightboxCard.eyebrow}</p>
              <h3>{lightboxCard.title}</h3>
            </div>
            <div className="shop-lightbox__media">
              <div
                className="shop-lightbox__backdrop"
                style={{ backgroundImage: `url(${lightboxImage})` }}
                aria-hidden="true"
              ></div>
              <button
                type="button"
                className="shop-showcase-card__nav shop-showcase-card__nav--prev"
                onClick={() =>
                  changeSlide(lightboxCard.id, -1, lightboxCard.images.length)
                }
                aria-label={`Previous ${lightboxCard.title} image`}
              >
                <i className="fa fa-angle-left fa-xs"></i>
              </button>
              <img
                src={lightboxImage}
                alt={lightboxCard.title}
                loading="eager"
                decoding="async"
              />
              <button
                type="button"
                className="shop-showcase-card__nav shop-showcase-card__nav--next"
                onClick={() =>
                  changeSlide(lightboxCard.id, 1, lightboxCard.images.length)
                }
                aria-label={`Next ${lightboxCard.title} image`}
              >
                <i className="fa fa-angle-right fa-xs"></i>
              </button>
            </div>
            <div className="shop-lightbox__thumbs">
              {lightboxCard.images.map((image, imageIndex) => (
                <button
                  key={`${lightboxCard.id}-lightbox-${imageIndex}`}
                  type="button"
                  className={`shop-showcase-card__thumb ${
                    imageIndex === lightboxIndex ? "is-active" : ""
                  }`}
                  onClick={() =>
                    setActiveSlides((current) => ({
                      ...current,
                      [lightboxCard.id]: imageIndex,
                    }))
                  }
                  aria-label={`Select ${lightboxCard.title} image ${imageIndex + 1}`}
                >
                  <img
                    src={image}
                    alt={`${lightboxCard.title} enlarged preview ${imageIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
