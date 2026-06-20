const heroImages = {
  hoodies:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150942/ChatGPT_Image_Mar_17_2026_06_03_10_AM_u6blkp_mtptcg.jpg",
  plushies:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150967/A_premium_toy_product_shot_of_baby_axo_plush_an_ad_delpmaspu_yrtpwl_bil3ex.jpg",
  storyBooks:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151940/Design_a_premium_202603191152_nbwdax_wzyxzh_yhu11x.jpg",
  school:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151010/Create_a_premium_202603201601_trnpio_xpklay.webp",
  waterToys:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151028/Use_the_provided_202603191136_nar3y8_bsg92k.webp",
  accessories:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151051/Design_a_premium_202603191114_sjxjgc_ekjoqh.webp",
  baby: "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151079/dont_change_anything_202603181728_wzoeau_u6pfnf.webp",
  decor:
    "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151101/want_a_full_202603191201_jschjx_imz1tt.webp",
};

export const catalogueCategories = [
  {
    slug: "kidswear",
    title: "Kidswear",
    eyebrow: "Everyday Axo style",
    tone: "sky",
    heroImage: heroImages.hoodies,
    blurb:
      "Soft layers, playful prints, and easy outfits made for school mornings, cozy evenings, and everyday fun.",
  },
  {
    slug: "plush-toys",
    title: "Plush Toys",
    eyebrow: "Cuddle shelf",
    tone: "mint",
    heroImage: heroImages.plushies,
    blurb:
      "Squishy companions and display-friendly plush picks made for hugs, naps, and little gift moments.",
  },
  {
    slug: "story-books",
    title: "Story Books",
    eyebrow: "Bedtime mode",
    tone: "pearl",
    heroImage: heroImages.storyBooks,
    blurb:
      "Gentle adventures and colorful picture books for bedtime reading, quiet corners, and growing imaginations.",
  },
  {
    slug: "school-essentials",
    title: "School Essentials",
    eyebrow: "School-ready",
    tone: "sun",
    heroImage: heroImages.school,
    blurb:
      "Bags, bottles, lunch sets, and desk extras with cheerful Axo styling made for everyday routines.",
  },
  {
    slug: "water-toys",
    title: "Water Toys",
    eyebrow: "Splash time",
    tone: "sun",
    heroImage: heroImages.waterToys,
    blurb:
      "Bright and playful water-friendly toys that bring the Axo world into bath time, pool days, and sunny play.",
  },
  {
    slug: "accessories",
    title: "Accessories",
    eyebrow: "Little extras",
    tone: "blush",
    heroImage: heroImages.accessories,
    blurb:
      "Sticker packs, keychains, mugs, and cheerful little add-ons that make everyday items feel more fun.",
  },
  {
    slug: "baby-essentials",
    title: "Baby Essentials",
    eyebrow: "Soft newborn comfort",
    tone: "blush",
    heroImage: heroImages.baby,
    blurb:
      "Gentle baby pieces and mealtime sets designed to feel cozy, comforting, and sweet from day one.",
  },
  {
    slug: "room-decor",
    title: "Room Decor",
    eyebrow: "Room decor",
    tone: "pearl",
    heroImage: heroImages.decor,
    blurb:
      "Decor details for playful bedrooms, reading corners, and cozy family spaces with soft storybook charm.",
  },
];

const productGroups = [
  {
    id: "axo-hoodies",
    title: "Hoodies",
    category: "kidswear",
    tone: "sky",
    description:
      "Cozy Axo hoodies in playful colors and soft finishes, made for cool-weather outings, school days, and snuggly layering.",
    tags: ["hoodie", "kidswear", "cozy"],
    bundles: [
      {
        id: "hoodies-01-04",
        title: "Hoodies Set 01-04",
        imageNumbers: [1, 2, 3, 4],
      },
      {
        id: "hoodies-05-07",
        title: "Hoodies Set 05-07",
        imageNumbers: [5, 6, 7],
      },
      {
        id: "hoodies-08-09",
        title: "Hoodies Set 08-09",
        imageNumbers: [8, 9],
      },
    ],
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
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151528/Design_a_luxury_202603191059_1_rgy8a5_p3c0qc.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151559/Design_a_luxury_202603191059_ylokjl_wljequ.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151581/Gemini_Generated_Image_f9xvflf9xvflf9xv_2_s2wndt_lr1kxp.jpg",
    ],
  },
  {
    id: "axo-water-toys",
    title: "Toys",
    category: "water-toys",
    tone: "sun",
    description:
      "Playful Axo toys made for splashy fun, bath-time smiles, and bright little moments during indoor or outdoor play.",
    tags: ["toys", "water", "playtime"],
    bundles: [
      {
        id: "toys-07-10",
        title: "Toys Set 07-10",
        imageNumbers: [7, 8, 9, 10],
      },
    ],
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
  },
  {
    id: "axo-story-books",
    title: "Story Books",
    category: "story-books",
    tone: "mint",
    description:
      "Colorful Axo story books filled with gentle adventures, friendly characters, and cozy read-aloud energy for little readers.",
    tags: ["books", "reading", "bedtime"],
    bundles: [
      {
        id: "storybook-carousel",
        title: "Story Books",
        imageNumbers: [4, 6, 7, 8, 9, 10],
      },
      {
        id: "storybook-carousel-1",
        title: "Story Books",
        imageNumbers: [2, 3, 5],
      },
    ],
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
  },
  {
    id: "axo-sticker-packs",
    title: "Sticker Packs",
    category: "accessories",
    tone: "sun",
    description:
      "Bright little sticker packs for notebooks, bottles, art folders, and all the tiny places kids love to decorate.",
    tags: ["stickers", "collectible", "accessories"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152250/Gemini_Generated_Image_1upeuf1upeuf1upe_2_zcttlt_albux8.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152274/Gemini_Generated_Image_dq78bkdq78bkdq78_wwhlyn_cy1afl.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152328/A_set_of_axolittles_without_tail_diecut_stickers_s_delpmaspu_vzssqn_shoiac.jpg",
    ],
  },
  {
    id: "axo-bottle-tiffin-set",
    title: "Bottle / Tiffin Set",
    category: "school-essentials",
    tone: "blush",
    description:
      "A cheerful lunch-and-sip set with coordinated Axo artwork, perfect for packed snacks, school bags, and busy little mornings.",
    tags: ["school", "tiffin", "bottle"],
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
  },
  {
    id: "axo-school-bags",
    title: "School Bags",
    category: "school-essentials",
    tone: "sky",
    description:
      "Roomy school bags with playful Axo styling, built to carry books, snacks, and daily treasures in cheerful style.",
    tags: ["bag", "backpack", "school"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152798/Gemini_Generated_Image_5s5jkd5s5jkd5s5j_sifxlo_sb3vcn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152824/Gemini_Generated_Image_vxvkj2vxvkj2vxvk_i7b5jp_bmnve1.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152857/ChatGPT_Image_Mar_17_2026_06_50_29_AM_gc0pcu_zeyf55.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152882/Gemini_Generated_Image_bptvq0bptvq0bptv_jydjms_dp0560.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152909/Gemini_Generated_Image_z7bxipz7bxipz7bx_1_ht8msk_uiqjic.jpg",
    ],
  },
  {
    id: "axo-wallpapers",
    title: "Wallpapers",
    category: "room-decor",
    tone: "pearl",
    description:
      "Soft room wallpapers with storybook charm and cheerful Axo details, designed to brighten bedrooms, nurseries, and play corners.",
    tags: ["decor", "wallpaper", "room"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151101/want_a_full_202603191201_jschjx_imz1tt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776152993/Gemini_Generated_Image_lxy4eulxy4eulxy4_qmfugx_xmfnnu.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153016/Gemini_Generated_Image_omo54vomo54vomo5_n7p3wu_eyy6gw.jpg",
    ],
  },
  {
    id: "axo-keychains",
    title: "Keychains",
    category: "accessories",
    tone: "sun",
    description:
      "Tiny Axo charms made for backpacks, pouches, and zippers, with colorful finishes that feel fun and collectible.",
    tags: ["keychain", "accessories", "collectible"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151051/Design_a_premium_202603191114_sjxjgc_ekjoqh.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153065/Gemini_Generated_Image_q1ptx2q1ptx2q1pt_ff6nez_dsagte.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153096/Design_a_soft_202603191123_meckja_nm9wyb.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153118/Design_a_premium_202603191105_qlezdn_y7fhxe.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153142/remove_the_glow_202603191119_ohz2kr_bgwwrc.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153164/Create_a_soft_202603191125_ihkeu2_s5o3mf.webp",
    ],
  },
  {
    id: "axo-plushies",
    title: "Plushies",
    category: "plush-toys",
    tone: "mint",
    description:
      "Super-soft Axo plushies with cuddle-ready shapes and sweet little personalities for naps, gifting, and bedtime shelves.",
    tags: ["plush", "soft-toy", "gift"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153223/Design_a_premium_202603191128_waulyt_wnqiqn.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153250/Design_a_premium_202603191138_glyn45_ve5ing.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150967/A_premium_toy_product_shot_of_baby_axo_plush_an_ad_delpmaspu_yrtpwl_bil3ex.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153296/ChatGPT_Image_Mar_17_2026_06_03_34_AM_vpuiqj_cebfa7.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101845_dwn5cd.webp",
      // "https://res.cloudinary.com/dbtsrjssc/image/upload/v1773732493/axo%20merch/plushies/ChatGPT_Image_Mar_17_2026_06_03_55_AM_lrmaoj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153344/ChatGPT_Image_Mar_17_2026_06_03_37_AM_uy8jzv_iggjbg.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153374/Create_a_premium__202604101841_xmfbau_kicdof.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086373/Create_a_premium__202604101836_yrcxyt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086372/Create_a_premium__202604101850_cjnun9.webp",
    ],
  },
  {
    id: "axo-water-bottles",
    title: "Water Bottles",
    category: "school-essentials",
    tone: "pearl",
    description:
      "Reusable water bottles with playful Axo graphics and school-friendly shapes that make staying hydrated feel extra fun.",
    tags: ["bottle", "school", "hydration"],
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
  },
  {
    id: "axo-pencil-pouches",
    title: "Pencil Pouches",
    category: "school-essentials",
    tone: "sun",
    description:
      "Neat little pencil pouches for crayons, markers, and school tools, with soft shapes and playful Axo artwork.",
    tags: ["pouch", "stationery", "school"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153715/A_premium_pencil_202603181849_eanouz_g4j1ca.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153740/A_premium_pencil_202603181851_prrdjx_opucgj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153766/A_premium_axolittles_pencil_pouch_in_the_same_cute_delpmaspu_ziorte_zonn6z.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153792/A_premium_axolittles_pencil_pouch_in_the_same_cute_delpmaspu_1_vj87hn_nbiigz.webp",
    ],
  },
  {
    id: "axo-night-suit",
    title: "Axo Night Suit",
    category: "kidswear",
    tone: "pearl",
    description:
      "A soft bedtime set with dreamy colors and gentle Axo details, made for cozy evenings and sleepy little routines.",
    tags: ["nightwear", "sleep", "kidswear"],
    bundles: [
      {
        id: "night-suit-04-06",
        title: "Night Suit Set 04-06",
        imageNumbers: [4, 5, 6],
      },
    ],
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
  },
  {
    id: "axo-baby-essentials-set",
    title: "Axo Baby Essentials Set",
    category: "baby-essentials",
    tone: "blush",
    description:
      "A gentle baby set with sweet Axo details, soft accessories, and cozy little pieces for cuddly everyday moments.",
    tags: ["baby", "newborn", "essentials"],
    bundles: [
      {
        id: "baby-essentials-02-05-07",
        title: "Baby Essentials Set 02-05-07",
        imageNumbers: [10, 11, 4, 8],
      },
    ],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_2_dhp0rx.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101823_cukgqy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151079/dont_change_anything_202603181728_wzoeau_u6pfnf.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160457/ChatGPT_Image_Mar_17_2026_06_03_04_AM_vcuua2_oxtqhq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160480/Take_these_face_202603181728_ttjqsa_z2sgnx.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160713/Create_a_premium__202604101834_1_wlpsso_nhtgbn.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160528/Take_these_face_202603181728_1_jodcoq_ylgrpp.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160556/ChatGPT_Image_Mar_17_2026_06_03_04_AM-2_h4rnjn_sovz4r.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101827_2_l6w857.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160905/ChatGPT_Image_Mar_17_2026_06_03_04_AM-3_qhxp1u_buirge.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160928/ChatGPT_Image_Mar_17_2026_06_03_04_AM-1_txw5b1_nmk48t.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101834_2_mscywy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776160974/Take_these_face_202603181728_2_lebscp_yn34ra.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086371/Create_a_premium__202604101827_1_wdzzwx.webp",
    ],
  },
  {
    id: "axo-mugs",
    title: "Mugs",
    category: "accessories",
    tone: "sky",
    description:
      "Cute Axo mugs that add a playful touch to cocoa time, milk breaks, and cozy kitchen shelves.",
    tags: ["mug", "drinkware", "accessories"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162768/Gemini_Generated_Image_bfh7p2bfh7p2bfh7_xoycue_efetgj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162795/A_premium_ceramic_202603181726_anwlxq_epdpkt.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162818/A_premium_ceramic_202603181727_xdxiao_brbg0k.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162845/A_premium_mug_202603181726_fdg2m9_ipqa0i.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162868/A_premium_ceramic_202603181726_1_ouo1r2_wc4ntw.jpg",
    ],
  },
  {
    id: "axo-baby-hoodies",
    title: "Baby Hoodies",
    category: "baby-essentials",
    tone: "pearl",
    description:
      "Tiny hoodies with sweet Axo character accents and soft fabrics made to keep little ones cozy and comfy.",
    tags: ["baby", "hoodie", "soft"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161815/A_tiny_baby_202603181730_ri9csq_awhgcp.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161839/Gemini_Generated_Image_2gsqey2gsqey2gsq_nya7qa_xgr1ew.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161865/Gemini_Generated_Image_646fht646fht646f_tnzvc3_jfs1ii.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161885/A_tiny_baby_202603181730_1_de7pm6_ufocdm.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161905/Gemini_Generated_Image_xk10lgxk10lgxk10_weoo1b_u7siwc.webp",
    ],
  },
  {
    id: "axo-tracksuits",
    title: "Tracksuits",
    category: "kidswear",
    tone: "sun",
    description:
      "Comfy matching tracksuits for active kids, with playful Axo styling that feels ready for playdates and park adventures.",
    tags: ["tracksuit", "kidswear", "active"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161941/Take_these_face_202603181728_3_f8rbvb_yaygwp.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161960/Take_these_face_202603181729_1_cyotbj_pmzbft.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161978/Take_these_face_202603181729_z4xcly_vrfqo2.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776161998/Take_these_face_202603181729_2_ncv52k_1_wccdrx_k3ns0f.jpg",
    ],
  },
  {
    id: "axo-baby-feeding-kit",
    title: "Baby Feeding Kit",
    category: "baby-essentials",
    tone: "mint",
    description:
      "A playful feeding set with bowls, cups, and mealtime essentials designed to make everyday baby routines feel bright and easy.",
    tags: ["baby", "feeding", "mealtime"],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162103/A_premium_baby_202603181652_egrugd_sktmpd.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162134/A_premium_axolittles-shaped_202603181656_qpt0hq_jutltu.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162160/A_premium_baby_202603181656_ujxavc_vgji6q.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162181/A_premium_baby_202603181657_fdvao5_oqbsoj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162203/Create_a_premium__202604101827_xq5ont_oj3bgf.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162224/A_premium_baby_202603181658_zzhlyu_ttxwfj.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_wmp1uo.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776086370/Create_a_premium__202604101821_1_z9nute.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162288/A_premium_ceramic_202603181655_xs8bgn_imnajq.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162312/Baby_silicone_feeding_202603181644_1_no0ph7_pro8p8.webp",
    ],
  },
  {
    id: "axo-tshirts",
    title: "Tshirts",
    category: "kidswear",
    tone: "blush",
    description:
      "Easy everyday tees with cheerful Axo graphics, soft fabrics, and playful energy made for little wardrobes.",
    tags: ["tshirt", "kidswear", "everyday"],
    bundles: [
      {
        id: "tshirts-01-02",
        title: "Tshirts Set 01-02",
        imageNumbers: [1, 2],
      },
    ],
    images: [
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162347/Take_these_face_202603181730_lveatp_o4eff6.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162369/Take_these_face_202603181729_5_joneke_omrznu.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162388/Take_these_face_202603181730_1_s4t5sz_ixzsjy.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162409/Take_these_face_202603181729_4_iq18rj_gosuvp.webp",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162429/Take_these_face_202603181730_2_khztol_dueemq.jpg",
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776162447/Take_these_face_202603181729_3_b8s27l_ad3hr0.webp",
    ],
  },
];

const formatVariantTitle = (title, index, total) =>
  total > 1 ? `${title} ${String(index + 1).padStart(2, "0")}` : title;

const buildCatalogueProducts = (groups) =>
  groups.flatMap((group) =>
    (() => {
      const bundledNumbers = new Set(
        (group.bundles || []).flatMap((bundle) => bundle.imageNumbers),
      );

      const singleProducts = group.images.flatMap((image, index) => {
        const imageNumber = index + 1;

        if (bundledNumbers.has(imageNumber)) {
          return [];
        }

        return {
          id: `${group.id}-${imageNumber}`,
          slug: `${group.id}-${imageNumber}`,
          title: formatVariantTitle(group.title, index, group.images.length),
          baseTitle: group.title,
          productTypeSlug: group.id,
          category: group.category,
          tone: group.tone,
          images: [image],
          price: 0,
          badges: ["coming soon"],
          description: group.description,
          tags: group.tags,
        };
      });

      const bundledProducts = (group.bundles || []).map((bundle) => ({
        id: `${group.id}-${bundle.id}`,
        slug: `${group.id}-${bundle.id}`,
        title: bundle.title,
        baseTitle: group.title,
        productTypeSlug: group.id,
        category: group.category,
        tone: group.tone,
        images: bundle.imageNumbers.map(
          (imageNumber) => group.images[imageNumber - 1],
        ),
        price: 0,
        badges: ["coming soon"],
        description: group.description,
        tags: group.tags,
      }));

      return [...singleProducts, ...bundledProducts];
    })(),
  );

export const catalogueProducts = buildCatalogueProducts(productGroups);

export const catalogueProductTypes = productGroups.map((group) => ({
  slug: group.id,
  title: group.title,
}));

export const catalogueTones = [
  { value: "sky", label: "Sky" },
  { value: "sun", label: "Sun" },
  { value: "mint", label: "Mint" },
  { value: "pearl", label: "Pearl" },
  { value: "blush", label: "Blush" },
];

export const getCategoryBySlug = (slug) =>
  catalogueCategories.find((c) => c.slug === slug) || null;

export const getProductBySlug = (slug) =>
  catalogueProducts.find((p) => p.slug === slug) || null;
