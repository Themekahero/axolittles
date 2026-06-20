# Axolittles — image assets needed for "more lessons per world"

These are the **image-based** Learn worlds. Each new item needs one cut-out PNG.
The SVG-drawn worlds (Shapes, Weather, Body, Vehicles) and Colors are being
expanded in code — no art needed there.

## Art spec (match the existing lessons)
- **Format:** PNG with a **transparent background** (cut-out, like the current
  fruit/animal images — no scene, no drop shadow baked in).
- **Style:** the same soft **3D-cartoon** look as the current renders
  (e.g. the existing `fun-3d-cartoon-black-labrador`, watermelon, carrot).
- **Framing:** single subject, centered, roughly **square** (≈600×600 or larger),
  generous transparent padding so nothing is clipped.
- **Tone:** friendly, rounded, bright — appealing to ages 2–5.

## Where + how to upload (your Cloudinary: `duqxzvxru`)
Upload each file with its **Public ID** set to `axolittles/<world>/<slug>`
(folder + slug exactly as listed). Example: the cow → Public ID
`axolittles/animals/cow`. I'll then load it from:
`https://res.cloudinary.com/duqxzvxru/image/upload/axolittles/<world>/<slug>.png`

When a world's set is uploaded, just tell me "animals done" (etc.) and I'll wire
them in + auto-generate the spoken name + a verified riddle for each.

---

## 🍓 Fruits  (`world = fruits`)  — 5 new
| slug | shows | note |
|------|-------|------|
| `peach` | Peach | round, soft, fuzzy orange-pink |
| `pear` | Pear | green, bell/teardrop shape |
| `coconut` | Coconut | brown hairy shell, maybe a white split |
| `plum` | Plum | small round deep-purple |
| `raspberry` | Raspberry | small bumpy red cluster |

## 🦁 Animals  (`world = animals`)  — 7 new
| slug | shows | note |
|------|-------|------|
| `cow` | Cow | black-and-white spots |
| `pig` | Pig | pink, curly tail, snout |
| `duck` | Duck | yellow, orange bill |
| `bear` | Bear | brown, friendly |
| `frog` | Frog | green, big eyes |
| `penguin` | Penguin | black-and-white, orange feet |
| `zebra` | Zebra | black-and-white stripes |

## 🥕 Vegetables  (`world = vegetables`)  — 5 new
| slug | shows | note |
|------|-------|------|
| `peas` | Peas | green pod, peas showing |
| `cucumber` | Cucumber | long shiny green |
| `lettuce` | Lettuce | round leafy green head |
| `mushroom` | Mushroom | white stem, rounded cap |
| `garlic` | Garlic | white bulb |

---

### Optional later — Planets → "Space" expansion
The Planets world is photo-style planet renders. If you want to grow it into a
broader **Space** world, these would fit (same cut-out style): `sun`, `moon`,
`comet`, `rocket`, `astronaut`, `shooting-star`. Tell me if you want this and
I'll rename the world + wire them.

> Note: the **current** lesson images live on a different Cloudinary cloud
> (`dbtsrjssc`). New ones on your `duqxzvxru` cloud are fine — just use the
> Public IDs above and I'll point the new items at that cloud.
