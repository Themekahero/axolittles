// Level-3 "Challenge" configuration for each Learn world.
//
// The 9 "clue" worlds carry spoken riddles written for ages 2-5 and
// adversarially verified (by a multi-agent review) so that EACH clue is
// uniquely true of exactly ONE item in its world — describing only what a
// toddler can SEE in the picture (color, shape, size, parts), never the name
// itself. Because every clue is globally unique within its world, any random
// set of answer choices stays solvable. ABC + Numbers use picture->letter and
// numeral-recognition modes instead of riddles (those are 4-5+ skills, kept
// optional / bonus per the design review).
const challenges = {
  abc: { mode: "letterStart", label: "Letter Detective" },
  numbers: { mode: "number", label: "Number Hunt" },
  colors: {
    mode: "clue", label: "Rainbow Riddles",
    clues: {
      yellow: "I am the bright sunshine and a soft baby chick.",
      blue: "I am the daytime sky way up high.",
      red: "I am a loud fire truck and a stop sign.",
      green: "I am grass and leaves on every tree.",
      purple: "I am juicy grapes and a yummy eggplant.",
      orange: "I am a pointy carrot and a round pumpkin.",
      pink: "I am soft bubblegum and a little piggy.",
      white: "I am fluffy snow and cold milk.",
      black: "I am the dark nighttime and a lump of coal.",
      brown: "I am tree bark and a sweet chocolate bar.",
      gray: "I am a big elephant and a stormy cloud.",
      cyan: "I am a shiny swimming pool, like blue mixed with green.",
      gold: "I am shiny treasure and a king's sparkly crown.",
      silver: "I am a shiny mirror and a sparkly spoon.",
    },
  },
  fruits: {
    mode: "clue", label: "Riddle Orchard",
    clues: {
      apple: "I am round and red with a leaf on top.",
      banana: "I am long and curved, and you peel me.",
      mango: "I am a smooth orange teardrop.",
      orange: "I am a round ball with bumpy orange peel.",
      grapes: "I am a little bunch of purple balls.",
      strawberry: "I am red with tiny seeds and a green hat.",
      watermelon: "I am big with stripes and pink inside.",
      pineapple: "I am spiky with a crown of leaves.",
      pomegranate: "I open up full of tiny red jewels.",
      lemon: "I am a bright yellow oval, very sour.",
      "dragon-fruit": "I am pink and spotty with little green spikes.",
      melon: "I am a round ball with net lines on my skin.",
      papaya: "I am long and orange with black seeds inside.",
      blueberries: "I am a pile of teeny tiny blue balls.",
      avocado: "I am green with one big brown seed inside.",
      cherry: "I am two little red balls on one stem.",
      kiwi: "I am fuzzy brown, bright green inside.",
    },
  },
  animals: {
    mode: "clue", label: "Safari Riddles",
    clues: {
      cat: "I am a soft little kitten and I say meow.",
      dog: "I wag my tail and love to play fetch.",
      horse: "You can ride me as I gallop fast.",
      elephant: "I am big and grey with a long trunk.",
      rabbit: "I have long ears and I hop, hop, hop.",
      lion: "I have a big fuzzy mane around my face.",
      monkey: "I climb up trees and swing by my tail.",
      tiger: "I am orange with black stripes all over.",
      sheep: "I am covered in soft fluffy white wool.",
      giraffe: "I am so tall with a very long neck.",
      fox: "I am a sneaky orange animal with pointy ears and a bushy tail.",
    },
  },
  vegetables: {
    mode: "clue", label: "Garden Riddles",
    clues: {
      carrot: "I am orange and pointy. Rabbits love me!",
      broccoli: "I look like little green trees.",
      potato: "I am brown and lumpy. You dig me up.",
      corn: "I am long and yellow with tiny rows.",
      onion: "I make cooks cry. I have thin papery skin.",
      cabbage: "I am a big round ball of leaves.",
      tomato: "I am a round red ball, soft and juicy inside.",
      pumpkin: "I am big, round, and orange.",
      cauliflower: "I am white and bumpy like a cloud.",
      "bell-pepper": "I am shiny with bumpy sides and a green stem.",
      eggplant: "I am smooth and shiny purple.",
      spinach: "I am a pile of little flat green leaves.",
    },
  },
  shapes: {
    mode: "clue", label: "Shape Detective",
    clues: {
      circle: "I am round and red, like a ball.",
      square: "I am blue, and all four of my sides are equal.",
      triangle: "I am green with three pointy corners.",
      star: "I am yellow and spiky, and I twinkle.",
      heart: "I am pink and I mean I love you.",
      rectangle: "I am purple and tall, like a door.",
      oval: "I am blue and shaped like an egg.",
      diamond: "I am orange and I stand on one pointy tip.",
      moon: "I am a curved shape that glows at night.",
      pentagon: "I have five flat sides — count them!",
      hexagon: "I have six flat sides.",
      arrow: "I point the way you should go.",
      cross: "Two straight bars meet in my middle.",
    },
  },
  weather: {
    mode: "clue", label: "Sky Riddle Time",
    clues: {
      sunny: "I am yellow and bright, with warm rays.",
      cloudy: "I am a soft white puffy cloud with nothing falling down.",
      rainy: "Blue drops fall down from my cloud.",
      rainbow: "I am a big arch of pretty colors.",
      snowy: "White snowflakes float down from my cloud.",
      windy: "I am swirly lines that blow things around.",
      stormy: "A yellow lightning bolt zaps from my cloud.",
      foggy: "I am soft grey mist, hard to see through.",
      night: "A glowing moon and twinkly stars in a dark sky.",
    },
  },
  body: {
    mode: "clue", label: "Body Riddles",
    clues: {
      head: "I sit on top and I can nod.",
      eyes: "I help you see, and I can blink.",
      ears: "I help you hear every little sound.",
      nose: "I smell flowers and yummy food.",
      mouth: "I have teeth and I help you eat.",
      hands: "I have fingers and I can clap.",
      tummy: "Your food goes here, and I can grumble.",
      feet: "I have toes and I help you walk.",
    },
  },
  vehicles: {
    mode: "clue", label: "Riddle Road",
    clues: {
      car: "I have four wheels and a family drives me to the store.",
      bus: "I am long and yellow and carry lots of kids.",
      truck: "I am big and carry heavy loads in my open back.",
      train: "I am very long and ride on shiny rails.",
      bicycle: "I have just two wheels and you push the pedals.",
      boat: "My tall sails catch the wind on the water.",
      airplane: "I have big wings and fly far up high.",
      helicopter: "My spinning blades on top lift me into the air.",
      rocket: "I am pointy and blast up to the stars.",
      "fire-truck": "I am red with a ladder and put out fires.",
      tractor: "I have big back wheels and work on the farm.",
      submarine: "I dive deep underwater with little round windows.",
      "hot-air-balloon": "I am big and puffy and float with a basket.",
    },
  },
  planets: {
    mode: "clue", label: "Mystery Space Riddles",
    clues: {
      mercury: "I am grey with bumpy little holes.",
      venus: "I glow bright and golden like sunshine.",
      earth: "I am blue with green land, our home.",
      mars: "I am the dusty red planet.",
      jupiter: "I am huge with orange swirly stripes.",
      saturn: "I wear big rings around my middle.",
      uranus: "I am a pale greeny-blue ball.",
      neptune: "I am the deepest, darkest blue.",
      pluto: "I am the tiniest, far far away.",
    },
  },
};

// ABC "Letter Detective" draws only from letters whose picture is clear and
// whose name maps cleanly enough to its sound for a 3-5yo. Drops the phonics
// traps (X/Y/W/U/Q/J/N/H) and the C/K same-sound clash (keep K, drop C).
const ABC_CHALLENGE_SLUGS = ["a", "b", "d", "e", "f", "g", "i", "k", "l", "m", "o", "p", "r", "s", "t", "v", "z"];

// Per-child difficulty profile (set by a grown-up in the Parents dashboard).
// One ramp can't serve a 2yo and a 5yo, so each profile tunes round length,
// the number of choices, and whether the harder "which has more?" number round
// appears. All profiles stay short and no-fail.
const PROFILES = {
  explorer: { winAt: 3, findBase: 3, findMax: 3, challengeOpts: 3, moreMode: false },
  player: { winAt: 4, findBase: 3, findMax: 4, challengeOpts: 4, moreMode: false },
  challenger: { winAt: 5, findBase: 4, findMax: 4, challengeOpts: 4, moreMode: true },
};
const DIFFICULTY_OPTIONS = [
  { id: "explorer", label: "Explorer", age: "Ages 2-3", note: "Fewest choices, shortest rounds." },
  { id: "player", label: "Player", age: "Ages 3-4", note: "A gentle ramp — the default." },
  { id: "challenger", label: "Challenger", age: "Ages 4-5", note: "More choices and a 'which has more?' round." },
];
function profileTuning(profile) {
  return PROFILES[profile] || PROFILES.player;
}

// Soft gate: Find It opens after only a handful of Learn taps (never the whole
// world, so a 26-item world like ABC can't wall off a 3yo).
function findUnlockThreshold(total) {
  return Math.min(8, Math.max(3, Math.ceil(total * 0.4)));
}

export { challenges, ABC_CHALLENGE_SLUGS, PROFILES, DIFFICULTY_OPTIONS, profileTuning, findUnlockThreshold };
export default challenges;
