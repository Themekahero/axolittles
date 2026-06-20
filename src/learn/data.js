// AxoLearn v2 — content data (ported from src/app/data/chapters.js, reorganized)
const AxoData = (function () {
  const letterImages = {
    A: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776851763/41668df0-a686-4d06-8841-d4fb449db35a_tefekp.webp",
    B: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776839160/38305131-1e8b-45ff-b62f-f4ea624700ec_1_o15aka.png",
    C: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777012854/closeup-shot-beautiful-ginger-domestic-kitten-sitting-white-surface-removebg-preview_1_bjc3s7.png",
    D: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776839855/fun-3d-cartoon-black-labrador-retriever-removebg-preview_1_wiojef.png",
    E: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776839989/44p2_1o0n_230629-removebg-preview_1_s5vmmu.png",
    F: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776840033/9416077-removebg-preview_1_wkvyr8.png",
    G: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776840100/3-09-removebg-preview_1_meyxe9.png",
    H: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776930681/agh1_z9cg_230713-removebg-preview_1_pszfjm.png",
    I: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776854494/26-06-removebg-preview_1_osvt1z.png",
    J: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776930787/644e9141-923d-4819-85c2-9b7b16630b05-removebg-preview_1_dunbdb.png",
    K: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776854495/0a0c29fc-b4a4-4101-afae-da8327f9680e_1_ppqvqe.png",
    L: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776854494/3d-animated-cartoon-lion-removebg-preview_1_fyzl2q.png",
    M: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776933337/7kie_3eqe_220610-removebg-preview_1_jrgxo1.png",
    N: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776854708/p8hu_yem7_170313-removebg-preview_1_oquold.png",
    O: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776854708/orange_fruit_1_alyjr6.png",
    P: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776932812/9431727a-5501-4ed9-b87b-7c0a4a3bfd61-removebg-preview_1_n2y9j3.png",
    Q: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776926992/cute-cartoon-princess-wearing-beautiful-dress-removebg-preview_1_qh2eps.png",
    R: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776933519/Rose_Outline_Cartoon_2_1_lgllp1.png",
    S: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776927296/47199423-8001-46bd-95de-de5ff18cfc4b_1_w69qur.png",
    T: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776926210/78135e62-d66a-4961-b32f-1faa5ba079c8-removebg-preview_1_mgnuhr.png",
    U: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776927378/f9565082-ba9a-4eb2-be5f-23d85aa83f52-removebg-preview_1_fm6sve.png",
    V: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776927586/fe88539d-f4ad-4bd2-b2bf-6c79fb8e32cc-removebg-preview_1_axotpm.png",
    W: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776927733/xvtb_4qfc_220505-removebg-preview_1_alkss0.png",
    X: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776928580/ORHG1U0-removebg-preview_1_qnr9da.png",
    Y: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776928484/e1642bcd-924c-4f3b-9240-7325969e0467-removebg-preview_1_zgrjmo.png",
    Z: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776928288/3d-rendering-forest-zebra-removebg-preview_1_gotwh7.png",
  };

  const abcRows = [
    ["A", "Apple"], ["B", "Ball"], ["C", "Cat"], ["D", "Dog"], ["E", "Elephant"],
    ["F", "Fish"], ["G", "Grapes"], ["H", "Horse"], ["I", "Ice Cream"], ["J", "Jester"],
    ["K", "Kite"], ["L", "Lion"], ["M", "Monkey"], ["N", "Nest"], ["O", "Orange"],
    ["P", "Parrot"], ["Q", "Queen"], ["R", "Rose"], ["S", "Sun"], ["T", "Tree"],
    ["U", "Umbrella"], ["V", "Van"], ["W", "Whale"], ["X", "Xylophone"], ["Y", "YoYo"], ["Z", "Zebra"],
  ];
  const abcLessons = abcRows.map(([letter, word], index) => ({
    type: "abc", symbol: letter, word,
    voice: `${letter}... for... ${word}!`,
    image: letterImages[letter], index, slug: letter.toLowerCase(),
  }));

  const numberRows = [
    ["1", "One Orange", "Orange"], ["2", "Two Dogs", "Dog"], ["3", "Three Kites", "Kite"],
    ["4", "Four Ice Creams", "Ice Cream"], ["5", "Five Apples", "Apple"], ["6", "Six Fishes", "Fish"],
    ["7", "Seven Grapes", "Grapes"], ["8", "Eight Trees", "Tree"], ["9", "Nine YoYos", "YoYo"],
    ["10", "Ten Balls", "Ball"],
  ];
  const numberLessons = numberRows.map(([symbol, word, sourceWord], index) => ({
    type: "number", symbol, word, sourceWord, count: Number(symbol),
    voice: `${word}!`,
    image: letterImages[abcRows.find((r) => r[1] === sourceWord)[0]],
    index, slug: symbol,
  }));

  const colorRows = [
    ["Yellow", "#facc15", "Yellow like sunshine!"],
    ["Blue", "#2563eb", "Blue like the sky!"],
    ["Red", "#ef4444", "Red like an apple!"],
    ["Green", "#22c55e", "Green like leaves!"],
    ["Purple", "#8b5cf6", "Purple like grapes!"],
    ["Orange", "#f97316", "Orange like oranges!"],
    ["Pink", "#fb7185", "Pink like a blossom!"],
    ["White", "#f8fafc", "White like a cloud!"],
    ["Black", "#111827", "Black like the night sky!"],
    ["Brown", "#92400e", "Brown like tree bark!"],
    ["Gray", "#94a3b8", "Gray like soft rain clouds!"],
    ["Cyan", "#06b6d4", "Cyan like clear water!"],
    ["Gold", "linear-gradient(135deg, #fde68a, #f59e0b 55%, #fbbf24)", "Gold like shiny treasure!"],
    ["Silver", "linear-gradient(135deg, #f8fafc, #94a3b8 55%, #e2e8f0)", "Silver like a sparkly mirror!"],
  ];
  const colorLessons = colorRows.map(([word, color, voice], index) => ({
    type: "color", symbol: word, word, color, voice, index, slug: word.toLowerCase(),
  }));

  const fruitImages = {
    Apple: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938835/apple-red-mellow-juicy-fresh-ripe-half-cut-isolated-removebg-preview_sggtbj.png",
    Orange: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938836/orange-juicy-ripe-circle-citrus-removebg-preview_tpvstv.png",
    Strawberry: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938835/closeup-shot-fresh-ripe-strawberries-isolated-white-surface-removebg-preview_dvsnri.png",
    Banana: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776945379/18965820-removebg-preview_1_usnyqf.png",
    Grapes: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938835/delicious-bunch-grapes-removebg-preview_g0e8v1.png",
    Watermelon: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938836/green-striped-ripe-watermelon-with-slice-cross-section-isolated-white-background-with-copy-space-text-images-special-kind-berry-sweet-pink-flesh-with-black-seeds-side-view-removebg-preview_b0wkkc.png",
    Mango: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776946309/mango-still-life-removebg-preview-removebg-preview_1_h79kf2.png",
    Pineapple: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776946517/9d2271d9-b6c8-4961-a03d-b964471e66bc__1_-removebg-preview_1_cnwlvb.png",
    Kiwi: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938835/close-up-tasty-kiwi-white-background-removebg-preview_nkgky7.png",
    Cherry: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938835/closeup-shot-red-juicy-cherries-isolated-removebg-preview_uhz8je.png",
    Melon: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938836/japanese-melon-cantaloupe-cantaloupe-seasonal-fruit-health-concept-removebg-preview_jcedoo.png",
    Papaya: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938836/delicious-papaya-removebg-preview_hf2u7x.png",
    "Dragon Fruit": "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938837/view-delicious-dragon-fruit-pitahaya-removebg-preview_lmcfji.png",
    Avocado: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776938836/top-view-bright-fresh-avocados-bucket-with-feijoas-with-half-avocados-isolated-white-surface__1___1_-removebg-preview_dn8kr2.png",
    Lemon: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776946308/1908.i308.003.p.m005.c20.realistic_fruits_set-01-removebg-preview_1_rktxjl.png",
    Blueberries: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776947703/Screenshot_2026-04-23_at_6.04.08_PM-removebg-preview_1_advjhn.png",
    Pomegranate: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776946308/2206.i605.007.P.m005.c33.realistic_pomegranate_set-removebg-preview_1_ralhbc.png",
  };
  const fruitRows = [
    ["Apple", "Crunchy red apple!", "#ef4444"],
    ["Banana", "Sweet yellow banana!", "#facc15"],
    ["Mango", "Juicy sunny mango!", "#f97316"],
    ["Orange", "Round juicy orange!", "#fb923c"],
    ["Grapes", "Tiny popping grapes!", "#7c3aed"],
    ["Strawberry", "Berry sweet strawberry!", "#fb7185"],
    ["Watermelon", "Cool green watermelon!", "#22c55e"],
    ["Pineapple", "Spiky golden pineapple!", "#eab308"],
    ["Pomegranate", "Ruby red pomegranate!", "#be123c"],
    ["Lemon", "Bright sour lemon!", "#fde047"],
    ["Dragon Fruit", "Spotty dragon fruit!", "#ec4899"],
    ["Melon", "Soft sweet melon!", "#a3e635"],
    ["Papaya", "Sunny orange papaya!", "#fb923c"],
    ["Blueberries", "Tiny blue blueberries!", "#2563eb"],
    ["Avocado", "Creamy green avocado!", "#65a30d"],
    ["Cherry", "Shiny red cherry!", "#dc2626"],
    ["Kiwi", "Fuzzy green kiwi!", "#84cc16"],
  ];
  const fruitLessons = fruitRows.map(([word, voice, color], index) => ({
    type: "fruit", symbol: word, word, voice, color,
    image: fruitImages[word], index, slug: word.toLowerCase().replace(/\s+/g, "-"),
  }));

  const animalImages = {
    Cat: letterImages.C, Dog: letterImages.D, Horse: letterImages.H,
    Elephant: letterImages.E, Lion: letterImages.L, Monkey: letterImages.M,
    Rabbit: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1776927150/furry-cute-rabbit-isolated-removebg-preview_1_tqq23t.png",
    Tiger: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777020394/tiger-nature-habitat-tiger-male-walking-head-composition-wildlife-scene-with-danger-animal-hot-summer-rajasthan-india-dry-trees-with-beautiful-indian-tiger-panthera-tigris-removebg-preview_eawvku.png",
    Sheep: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777020394/vertical-shot-sheep-nature-removebg-preview_ea9ieb.png",
    Giraffe: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777020394/beautiful-giraffe-wild-removebg-preview_qxeibi.png",
    Fox: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777020394/close-up-wild-animal-nature-removebg-preview_gtubmk.png",
  };
  const animalRows = [
    ["Cat", "Cat says meow!"], ["Dog", "Dog says woof!"], ["Horse", "Horse says neigh!"],
    ["Elephant", "Elephant says trumpet!"], ["Rabbit", "Rabbit loves to hop!"],
    ["Lion", "Lion gives a big roar!"], ["Monkey", "Monkey loves to swing!"],
    ["Tiger", "Tiger walks with a big growl!"], ["Sheep", "Sheep says baa!"],
    ["Giraffe", "Giraffe stands tall and gentle!"], ["Fox", "Fox is quick and clever!"],
  ];
  const animalLessons = animalRows.map(([word, voice], index) => ({
    type: "animal", symbol: word, word, voice, image: animalImages[word],
    index, slug: word.toLowerCase(),
  }));

  const vegetableImages = {
    Corn: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777026727/37ab1505-c00a-4400-920c-06b176924791-removebg-preview_1_vpysdz.png",
    Onion: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777026727/2202.i305.021.S.m005.c13.realistic_red_onion-removebg-preview_1_v5ayvj.png",
    Cabbage: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777026923/dd99d6c4-482c-4e1a-b839-7700c73da224-removebg-preview_1_hwkn3s.png",
    Carrot: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011740/ripe-carrots-bowl-marble-removebg-preview_nm09sc.png",
    Tomato: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011741/tomato-isolated-removebg-preview_mboyi6.png",
    Pumpkin: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011740/fresh-pumpkin-removebg-preview_s9rkh0.png",
    Broccoli: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011740/front-view-fresh-green-broccoli-plant-from-cabbage-family-dark-background-removebg-preview_awgkdn.png",
    Potato: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011740/fresh-background-potatoes-close-nutrition-removebg-preview_yfxzle.png",
    Cauliflower: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011740/fresh-cauliflower-removebg-preview_vo3dzy.png",
    "Bell Pepper": "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011739/colorful-bell-pepper-removebg-preview_gdczge.png",
    Eggplant: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011739/front-view-aubergines-tree-wood-board-pink-removebg-preview_jf2hqo.png",
    Spinach: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777011739/close-up-photo-fresh-spinach-removebg-preview_gog9tt.png",
  };
  const vegetableRows = [
    ["Carrot", "Carrot is crunchy and bright!"], ["Broccoli", "Broccoli looks like tiny trees!"],
    ["Potato", "Potato grows in the ground!"], ["Corn", "Corn is yellow and sweet!"],
    ["Onion", "Onion has many layers!"], ["Cabbage", "Cabbage has leafy folds!"],
    ["Tomato", "Tomato is juicy and red!"], ["Pumpkin", "Pumpkin is round and bright!"],
    ["Cauliflower", "Cauliflower looks like fluffy clouds!"],
    ["Bell Pepper", "Bell pepper is colorful and crunchy!"],
    ["Eggplant", "Eggplant is shiny and purple!"], ["Spinach", "Spinach is leafy and green!"],
  ];
  const vegetableLessons = vegetableRows.map(([word, voice], index) => ({
    type: "vegetable", symbol: word, word, voice, image: vegetableImages[word],
    index, slug: word.toLowerCase().replace(/\s+/g, "-"),
  }));

  const planetImages = {
    Mercury: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777096940/mercury__1_-removebg-preview_xtua4p.png",
    Venus: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777036849/39632-removebg-preview_1_ogncx6.png",
    Earth: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777036482/3d-rendering-planet-earth__1___1_-removebg-preview_1_1_x7bw6b.png",
    Mars: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777036425/479725-PH5WG9-782__1_-removebg-preview_1_m3zhgz.png",
    Jupiter: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777096940/jupiter__1_-removebg-preview_nwtype.png",
    Saturn: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777036851/17ac2c68-efd2-44d1-a0f2-72f5e3367264-removebg-preview_1_t7swzs.png",
    Uranus: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777096940/uranus-removebg-preview_nae6hp.png",
    Neptune: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777096940/neptune__1_-removebg-preview_m1qryp.png",
    Pluto: "https://res.cloudinary.com/dbtsrjssc/image/upload/v1777096940/pluto__1_-removebg-preview_c2s9gd.png",
  };
  const planetRows = [
    ["Mercury", "Mercury is the closest planet to the Sun!"],
    ["Venus", "Venus shines bright like a glowing pearl!"],
    ["Earth", "Earth is our beautiful blue home!"],
    ["Mars", "Mars is the dusty red planet!"],
    ["Jupiter", "Jupiter is the biggest planet of all!"],
    ["Saturn", "Saturn wears magical shining rings!"],
    ["Uranus", "Uranus spins in a cool tilted dance!"],
    ["Neptune", "Neptune swirls with deep blue storms!"],
    ["Pluto", "Pluto is a tiny dwarf planet far away!"],
  ];
  const planetLessons = planetRows.map(([word, voice], index) => ({
    type: "planet", symbol: word, word, voice, image: planetImages[word],
    index, slug: word.toLowerCase(),
  }));

  // ── Shapes: drawn in-app (no images needed), each with a friendly face ──
  const shapeRows = [
    ["Circle", "Circle! Round like a ball!", "#f43f5e"],
    ["Square", "Square! Four sides, all the same!", "#3b82f6"],
    ["Triangle", "Triangle! One, two, three corners!", "#22c55e"],
    ["Star", "Star! Twinkle twinkle!", "#fbbf24"],
    ["Heart", "Heart! Full of love!", "#ec4899"],
    ["Rectangle", "Rectangle! Like a tall door!", "#8b5cf6"],
    ["Oval", "Oval! Like a little egg!", "#06b6d4"],
    ["Diamond", "Diamond! Sparkly and pointy!", "#f97316"],
    ["Moon", "Moon! It glows at night!", "#fde047"],
    ["Pentagon", "Pentagon! Count them — five corners!", "#14b8a6"],
    ["Hexagon", "Hexagon! Six straight sides!", "#6366f1"],
    ["Arrow", "Arrow! It points the way!", "#ef4444"],
    ["Cross", "Cross! Like a plus sign!", "#22c55e"],
  ];
  const shapeLessons = shapeRows.map(([word, voice, color], index) => ({
    type: "shape", symbol: word, word, voice, color,
    shape: word.toLowerCase(), index, slug: word.toLowerCase(),
  }));

  const weatherRows = [
    ["Sunny", "Sunny! The sun is big and warm!"],
    ["Cloudy", "Cloudy! Fluffy clouds float in the sky!"],
    ["Rainy", "Rainy! Drip drop, here comes the rain!"],
    ["Rainbow", "Rainbow! So many pretty colors!"],
    ["Snowy", "Snowy! Soft white snowflakes fall down!"],
    ["Windy", "Windy! Whoosh, the wind is blowing!"],
    ["Stormy", "Stormy! Boom! Thunder in the clouds!"],
    ["Foggy", "Foggy! Soft grey mist everywhere!"],
    ["Night", "Night! The moon and stars come out!"],
  ];
  const weatherLessons = weatherRows.map(([word, voice], index) => ({
    type: "weather", symbol: word, word, voice,
    shape: word.toLowerCase(), index, slug: word.toLowerCase(),
  }));

  const bodyRows = [
    ["Head", "Head! Shake shake, nod your head!"],
    ["Eyes", "Eyes! I see with my eyes!"],
    ["Ears", "Ears! I hear with my ears!"],
    ["Nose", "Nose! I smell with my nose!"],
    ["Mouth", "Mouth! I eat and talk with my mouth!"],
    ["Hands", "Hands! Clap clap clap!"],
    ["Tummy", "Tummy! My tummy says yum yum!"],
    ["Feet", "Feet! I walk with my feet!"],
  ];
  const bodyLessons = bodyRows.map(([word, voice], index) => ({
    type: "body", symbol: word, word, voice,
    shape: word.toLowerCase(), index, slug: word.toLowerCase(),
  }));

  const vehicleRows = [
    ["Car", "Car! Beep beep!"],
    ["Bus", "Bus! The wheels go round and round!"],
    ["Truck", "Truck! A big truck carries heavy things!"],
    ["Train", "Train! Choo choo!"],
    ["Bicycle", "Bicycle! Ring ring, pedal fast!"],
    ["Boat", "Boat! It sails on the water!"],
    ["Airplane", "Airplane! It flies high in the sky!"],
    ["Helicopter", "Helicopter! Its blades spin round and round!"],
    ["Rocket", "Rocket! Three, two, one, blast off!"],
    ["Fire Truck", "Fire Truck! Whee-oo, off to help!"],
    ["Tractor", "Tractor! It works hard on the farm!"],
    ["Submarine", "Submarine! It dives deep under the sea!"],
    ["Hot Air Balloon", "Hot Air Balloon! Up, up and away!"],
  ];
  const vehicleLessons = vehicleRows.map(([word, voice], index) => ({
    type: "vehicle", symbol: word, word, voice,
    shape: word.toLowerCase().replace(/\s+/g, ""), index,
    slug: word.toLowerCase().replace(/\s+/g, "-"),
  }));

  // World theme: sky = top gradient color, ground = bottom, accent = buttons
  const worlds = [
    {
      id: "abc", title: "ABC Land", lessons: abcLessons,
      cover: letterImages.A, coverSymbol: "Aa",
      sky: "#7dd3fc", ground: "#86efac", accent: "#2563eb", tile: "#38bdf8",
    },
    {
      id: "numbers", title: "Number Park", lessons: numberLessons,
      cover: letterImages.B, coverSymbol: "123",
      sky: "#a7f3d0", ground: "#fde68a", accent: "#059669", tile: "#34d399",
    },
    {
      id: "colors", title: "Color Cove", lessons: colorLessons,
      cover: null, coverSymbol: "rainbow",
      sky: "#fbcfe8", ground: "#ddd6fe", accent: "#db2777", tile: "#f472b6",
    },
    {
      id: "fruits", title: "Fruit Fiesta", lessons: fruitLessons,
      cover: fruitImages.Watermelon, coverSymbol: "", artScale: 1.22,
      sky: "#fef08a", ground: "#bbf7d0", accent: "#ea580c", tile: "#fb923c",
    },
    {
      id: "animals", title: "Animal Safari", lessons: animalLessons,
      cover: animalImages.Lion, coverSymbol: "",
      sky: "#fed7aa", ground: "#fde68a", accent: "#b45309", tile: "#fbbf24",
    },
    {
      id: "vegetables", title: "Veggie Garden", lessons: vegetableLessons,
      cover: vegetableImages.Carrot, coverSymbol: "", artScale: 1.28,
      sky: "#d9f99d", ground: "#a7f3d0", accent: "#16a34a", tile: "#4ade80",
    },
    {
      id: "shapes", title: "Shape Town", lessons: shapeLessons,
      cover: null, coverShape: "star",
      sky: "#c7d2fe", ground: "#fbcfe8", accent: "#4f46e5", tile: "#6366f1",
    },
    {
      id: "weather", title: "Weather Sky", lessons: weatherLessons,
      cover: null, coverShape: "sunny",
      sky: "#93c5fd", ground: "#bfdbfe", accent: "#0369a1", tile: "#60a5fa",
    },
    {
      id: "body", title: "My Body", lessons: bodyLessons,
      cover: null, coverShape: "hands",
      sky: "#fecdd3", ground: "#fef3c7", accent: "#e11d48", tile: "#fb7185",
    },
    {
      id: "vehicles", title: "Wheels & Wings", lessons: vehicleLessons,
      cover: null, coverShape: "rocket",
      sky: "#bae6fd", ground: "#cbd5e1", accent: "#0284c7", tile: "#0ea5e9",
    },
    {
      id: "planets", title: "Planet Sky", lessons: planetLessons, night: true,
      cover: planetImages.Saturn, coverSymbol: "",
      sky: "#312e81", ground: "#1e1b4b", accent: "#8b5cf6", tile: "#818cf8",
    },
  ];

  // ── Song Time: curated video list ──────────────────────────────────────────
  // TODO: swap these YouTube IDs for your own curated picks.
  // Each entry: { yt: "<YouTube video id>", title: "<shown to grown-ups>" }
  // Real songs from the official "Axo Rhymes" YouTube channel
  // (UC4H2mCujSLwz3H9It75-S4A). Grouped for browsing; "Play all" (in the
  // VideoRoom) streams the full uploads playlist so every song — including
  // future uploads — is covered.
  const videoTopics = [
    {
      id: "sing", title: "Sing & Move", color: "#f472b6",
      videos: [
        { yt: "BwufTf6war4", title: "Bumpy Bus Adventure" },
        { yt: "ZTOIyeDsjaA", title: "Good Morning Song" },
        { yt: "rm2Py7RHRFU", title: "Silly Dance Moves" },
        { yt: "kyFl5zXA5eo", title: "Bouncy Bouncy Ball" },
      ],
    },
    {
      id: "learn", title: "Learn with Axo", color: "#38bdf8",
      videos: [
        { yt: "ODt5oeVfkp0", title: "Make Shapes with Play-Doh" },
        { yt: "8ly0Zqgc0m8", title: "Shape Hunt Around the House" },
        { yt: "BRRnXN91rmQ", title: "Yummy Shapes Song" },
        { yt: "l-8-QSvP__E", title: "Body Parts Song" },
        { yt: "yI-GEXECfQI", title: "No More Germs! Hand-Washing Song" },
        { yt: "sE4MD9hFAlI", title: "Puppy Care Song" },
      ],
    },
    {
      id: "animals", title: "Animal Friends", color: "#fbbf24",
      videos: [
        { yt: "7coHfJeU67g", title: "Five Little Frogs" },
        { yt: "hLWsls7yEc8", title: "Moo! Quack! Roar! Guess the Animal" },
        { yt: "8HvaEDT_EIA", title: "Five Little Ducks" },
        { yt: "AUz4pzyna3w", title: "Meet the Farm Animals" },
        { yt: "_Ej7ckvl10E", title: "Five Cheeky Monkeys" },
      ],
    },
  ];

  const objectSounds = {
    Apple: "crunch", Banana: "pop", Ball: "bounce", Cat: "meow", Dog: "bark",
    Elephant: "trumpet", Fish: "bubble", Grapes: "pop", "Ice Cream": "chime",
    Jester: "sparkle", Kite: "whoosh", Lion: "roar", Mango: "crunch", Nest: "chirp",
    Orange: "crunch", Parrot: "chirp", Queen: "sparkle", Rose: "sparkle", Sun: "shine",
    Tree: "rustle", Umbrella: "rain", Van: "beep", Whale: "splash", Xylophone: "notes",
    YoYo: "spin", Zebra: "celebrate", Horse: "neigh", Rabbit: "hop", Tiger: "roar",
    Sheep: "baa", Giraffe: "chime", Fox: "howl", Monkey: "chirp",
    Carrot: "crunch", Broccoli: "rustle", Potato: "bounce", Corn: "pop",
    Onion: "sparkle", Cabbage: "rustle", Tomato: "crunch", Pumpkin: "bounce",
    Cauliflower: "pop", "Bell Pepper": "crunch", Eggplant: "pop", Spinach: "rustle",
    Strawberry: "pop", Watermelon: "crunch", Pineapple: "sparkle", Pomegranate: "pop",
    Lemon: "sparkle", "Dragon Fruit": "sparkle", Melon: "crunch", Papaya: "pop",
    Blueberries: "pop", Avocado: "pop", Cherry: "pop", Kiwi: "pop",
    Circle: "bounce", Square: "pop", Triangle: "notes", Star: "twinkle",
    Heart: "chime", Rectangle: "pop", Oval: "pop", Diamond: "sparkle", Moon: "twinkle",
    Sunny: "shine", Cloudy: "pop", Rainy: "rain", Rainbow: "sparkle",
    Snowy: "twinkle", Windy: "whoosh", Stormy: "roar",
    Head: "pop", Eyes: "twinkle", Ears: "chirp", Nose: "pop", Mouth: "chime",
    Hands: "bounce", Tummy: "pop", Feet: "bounce",
    Car: "beep", Bus: "beep", Truck: "beep", Train: "whoosh", Bicycle: "spin",
    Boat: "splash", Airplane: "whoosh", Helicopter: "whoosh", Rocket: "celebrate",
    Gold: "sparkle", Silver: "sparkle",
    Pentagon: "pop", Hexagon: "pop", Arrow: "whoosh", Cross: "pop",
    Foggy: "whoosh", Night: "twinkle",
    "Fire Truck": "beep", Tractor: "beep", Submarine: "splash", "Hot Air Balloon": "whoosh",
  };

  const teacherAxoVideo =
    "https://res.cloudinary.com/dbtsrjssc/video/upload/v1776863110/axo_tech-Picsart-BackgroundRemover_apqrn4.webm";

  return {
    worlds,
    worldMap: Object.fromEntries(worlds.map((w) => [w.id, w])),
    videoTopics,
    objectSounds,
    teacherAxoVideo,
    // Top-menu external links — swap href for your real URLs.
    // Leave href "" to show a friendly "coming soon" bubble instead of navigating.
    menuLinks: [],
    // Shop — set buyUrl to your real store/product links when ready.
    // Each item's photo is a drag-and-drop slot; drop real product shots on them.
    shopCategories: [
      { id: "toys", label: "Toys", icon: "star" },
      { id: "clothes", label: "Clothes", icon: "bag" },
      { id: "art", label: "Art & School", icon: "book" },
      { id: "home", label: "Home & Sleep", icon: "home" },
    ],
    shopItems: [
      { id: "plush", name: "Axo Plush", price: "$24.99", color: "#fb7185", tag: "Best friend", cat: "toys", buyUrl: "", desc: "A huggable Axo with embroidered eyes and the famous bucket hat. Machine washable, toddler-tough." },
      { id: "puzzle", name: "Chunky Puzzle", price: "$14.99", color: "#38bdf8", tag: "Ages 2+", cat: "toys", buyUrl: "", desc: "Six big wooden pieces with Axo and friends. Perfect for little hands learning shapes." },
      { id: "nightlight", name: "Night Light", price: "$29.99", color: "#818cf8", tag: "Soft glow", cat: "home", buyUrl: "", desc: "Axo glows gently in three warm colors. Tap to change, auto-off after bedtime stories." },
      { id: "hat", name: "Bucket Hat", price: "$14.99", color: "#0ea5e9", tag: "Like Axo's!", cat: "clothes", buyUrl: "", desc: "The very same bucket hat Axo wears. Sun-safe brim, sizes 12m–5y." },
      { id: "tee", name: "Axo T-Shirt", price: "$19.99", color: "#fbbf24", tag: "Soft cotton", cat: "clothes", buyUrl: "", desc: "Ultra-soft organic cotton tee with a big friendly Axo print. Sizes 12m–6y." },
      { id: "hoodie", name: "Axo Hoodie", price: "$29.99", color: "#f472b6", tag: "With gill hood", cat: "clothes", buyUrl: "", desc: "Cozy fleece hoodie — the hood has little pink gills! Zip-free for easy dressing." },
      { id: "stickers", name: "Sticker Pack", price: "$4.99", color: "#a78bfa", tag: "30 stickers", cat: "art", buyUrl: "", desc: "Thirty puffy stickers of Axo, Coco, Bruno and Beep. Repositionable and rip-proof." },
      { id: "coloring", name: "Coloring Book", price: "$9.99", color: "#ec4899", tag: "48 pages", cat: "art", buyUrl: "", desc: "48 pages of letters, numbers and Axo scenes to color. Thick paper, no bleed-through." },
      { id: "crayons", name: "Crayon Set", price: "$7.99", color: "#22c55e", tag: "Washable", cat: "art", buyUrl: "", desc: "Twelve chunky washable crayons in Axolittles colors. Easy-grip for tiny fingers." },
      { id: "backpack", name: "Axo Backpack", price: "$34.99", color: "#4ade80", tag: "Toddler size", cat: "art", buyUrl: "", desc: "A just-right backpack with gill pockets and a name tag inside. Fits snacks and one plush." },
      { id: "bottle", name: "Water Bottle", price: "$12.99", color: "#fb923c", tag: "Spill-proof", cat: "home", buyUrl: "", desc: "Leak-proof straw bottle with easy-clean parts. Axo waves from the side." },
      { id: "lunchbox", name: "Lunch Box", price: "$16.99", color: "#f59e0b", tag: "Easy open", cat: "home", buyUrl: "", desc: "Bento-style box with toddler-easy latches and a little compartment for treats." },
    ],
    dailyGoal: 5,
    // Axo Rhymes — the channel's uploads playlist (UC→UU). Auto-includes every
    // video on the channel, including future uploads.
    rhymesChannel: {
      title: "Axo Rhymes",
      playlist: "UU4H2mCujSLwz3H9It75-S4A",
      url: "https://www.youtube.com/channel/UC4H2mCujSLwz3H9It75-S4A",
    },
    // Sticker collection — unlocked by milestones. icon names resolve in ui.jsx.
    stickers: [
      { id: "first-step", label: "First Step", icon: "shoe", color: "#8b5cf6", hint: "Finish your first lesson", rule: { type: "lessons", n: 1 } },
      { id: "first-star", label: "First Star", icon: "star", color: "#f59e0b", hint: "Earn 5 stars", rule: { type: "stars", n: 5 } },
      { id: "bright-spark", label: "Bright Spark", icon: "bolt", color: "#22c55e", hint: "Earn 30 stars", rule: { type: "stars", n: 30 } },
      { id: "super-star", label: "Super Star", icon: "trophy", color: "#3b82f6", hint: "Earn 80 stars", rule: { type: "stars", n: 80 } },
      { id: "alphabet-hero", label: "Alphabet Hero", icon: "abc", color: "#2563eb", hint: "Finish ABC Land", rule: { type: "world", id: "abc" } },
      { id: "counting-champ", label: "Counting Champ", icon: "hash", color: "#059669", hint: "Finish Number Park", rule: { type: "world", id: "numbers" } },
      { id: "rainbow-walker", label: "Rainbow Walker", icon: "rainbow", color: "#db2777", hint: "Finish Color Cove", rule: { type: "world", id: "colors" } },
      { id: "fruit-friend", label: "Fruit Friend", icon: "apple", color: "#ea580c", hint: "Finish Fruit Fiesta", rule: { type: "world", id: "fruits" } },
      { id: "animal-pal", label: "Animal Pal", icon: "paw", color: "#b45309", hint: "Finish Animal Safari", rule: { type: "world", id: "animals" } },
      { id: "garden-keeper", label: "Garden Keeper", icon: "carrot", color: "#16a34a", hint: "Finish Veggie Garden", rule: { type: "world", id: "vegetables" } },
      { id: "shape-shaper", label: "Shape Shaper", icon: "shapes", color: "#4f46e5", hint: "Finish Shape Town", rule: { type: "world", id: "shapes" } },
      { id: "weather-watcher", label: "Weather Watcher", icon: "sun", color: "#0369a1", hint: "Finish Weather Sky", rule: { type: "world", id: "weather" } },
      { id: "body-smart", label: "Body Smart", icon: "body", color: "#e11d48", hint: "Finish My Body", rule: { type: "world", id: "body" } },
      { id: "speedy-star", label: "Speedy Star", icon: "rocket", color: "#0284c7", hint: "Finish Wheels & Wings", rule: { type: "world", id: "vehicles" } },
      { id: "space-explorer", label: "Space Explorer", icon: "planet", color: "#7c3aed", hint: "Finish Planet Sky", rule: { type: "world", id: "planets" } },
      { id: "quiz-whiz", label: "Quiz Whiz", icon: "medal", color: "#d97706", hint: "Win 10 quiz rounds", rule: { type: "quizWins", n: 10 } },
      { id: "find-it-champ", label: "Find-It Champ", icon: "target", color: "#0ea5e9", hint: "Win Find It in 5 worlds", rule: { type: "findLevels", n: 5 } },
      { id: "challenge-master", label: "Challenge Master", icon: "rocket", color: "#7c3aed", hint: "Beat the Challenge in 5 worlds", rule: { type: "challengeLevels", n: 5 } },
      { id: "daily-hero", label: "Daily Hero", icon: "target", color: "#16a34a", hint: "Hit your daily goal", rule: { type: "daily" } },
      { id: "streak-star", label: "Streak Star", icon: "fire", color: "#ef4444", hint: "Play 3 days in a row", rule: { type: "streak", n: 3 } },
    ],
  };
})();

export { AxoData };
export default AxoData;
