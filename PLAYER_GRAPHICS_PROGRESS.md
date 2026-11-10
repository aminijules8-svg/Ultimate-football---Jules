# Player graphics overhaul — progress

Tracks the player-graphics brief (realistic bodies, faces, skin, kits, boots, hair, animation, ball contact, lighting, LOD, variety, quality setting, testing). Updated 2026-10-12.

## How the player is built
- **Model:** `tools/blender/build_player_mh.py` (Blender 4.3 + MPFB2) writes `public/models/player.glb` and `public/models/tex/*`. Run with `npm run build:player` (about 30 s).
  - MakeHuman body (CC0), kit shells, shoes06 boots.
  - Hair cards: 9 styles plus a hair-less "none" variant (keeps brows and lashes).
  - 13 morphs: slim, heavy, muscular, african/asian/caucasian, and 7 face-shape morphs.
  - 62 animation clips (Quaternius UAL, CMU mocap, authored clips): forward / back-pedal / side-step loop sets, running turns, two stops, mirrored kicks, chest and thigh traps, a stumble, low and high keeper dives.
- **Runtime:** `src/render3d/character.js` (`Character`, `characterAssets`, `makeKitTexture`).
- **Check pages:**
  - `viewer.html?clip=…&cam=front|side|back&ly=&dist=&det=&lod=&beard=&gloves=&face=&bs=&b1=&b2=`
  - `node scripts/capture.mjs --viewer="…"`

## Status by brief phase
| # | Area | Status | What is in |
|---|------|--------|-----------|
| 1 | Inspect | done | Pipeline above; root causes logged in `.superpowers/sdd/REALISM/progress.md` |
| 2 | Bodies | done | MakeHuman body, height via scale, slim/heavy/muscular morphs plus nine body-shape morphs blended into 15 footballer archetypes (`src/world/archetypes.js`); base anatomy relaxed (flatter back, chest back, arms forward). World players bring their own build and archetype into matches. |
| 3 | Faces | mostly done | MakeHuman face; 7 face morphs from MPFB targets (nose size/width, eyes, brow, jaw, lips, ears) driven by the Edit Pro sliders and world player face data. Facial hair at 3 levels (stubble / short / full), painted in the hair colour through a baked lower-face UV mask with the lips kept clear. |
| 4 | Skin | done (approximation) | 3 MakeHuman skins tinted to 8 tones. Detail normal map generated at runtime from each skin (Sobel). High/Ultra: soft warm sheen (MeshPhysical) as a cheap subsurface look. |
| 5 | Kits | mostly done | Kit shells with 12 patterns, name/number/badge/sponsor; knit fabric normal map; keeper gloves (hand UV mask); accessories (headband, arm sleeves, wristbands, gloves) from Edit Pro and world players. |
| 6 | Hair / boots | done | 9 hair styles (the over-the-eye fringe asset is retired); hair LODs. Football boots: 6 tapered studs per boot, lace/tongue strip, knit sock-collar, 4 models × 2 colours; ankle skin-bleed fixed. |
| 7 | Animation | mostly done | Stride-matched gait, look-at fix, keeper set/dives, skills, stop clip, additive touches, 8 celebrations. |
| 8 | Ball contact | done | Kick clips start at their contact frame (`clips.json` `_contact`); the ball launches on that tick. |
| 9 | Lighting | unchanged | PBR, blob shadows, AO on High+ (global quality). |
| 10 | LOD | done | Body 14k / 3.9k / 1.6k tris with 8% hysteresis; 900-tri hair LOD at LOD1+; LODs carry the morphs (no build pop). |
| 11 | Variety | done | Match players use their world player's look: skin tone, hairstyle, natural hair colour (dyed colours rare), beard, boots, face shape, body. |
| 12 | Quality | done | Settings → Player detail: Low / Medium / High / Ultra / Auto-realistic. Low = plain materials, near LOD. Medium = normal maps. High/Ultra = skin sheen, further LOD distance. Auto-realistic = one step above the machine's probed base, one down if fps was below 40. |
| 13 | Testing | done (headless) | Capture state logs draw calls, frame and player triangles, and LOD counts (`__UF.gfx`); `__UF.meshesOf(i)`. Viewer parameters for every feature. |

## Measurements (headless SwiftShader, LOW base, broadcast camera)
- **Player triangles per frame:** 182k → about 72k after LOD2 and hair LOD shipped (12–15 of 22 players on LOD2).
- **Draw calls:** about 220.
- **glb:** 3.2 MB (budget 6 MB).
- **fps:** headless fps swings between about 22 and 36 run to run on this VM, so it is not a reliable benchmark. Real-hardware fps must be checked by the owner.

## Known issues
- Sock shell pokes through the boot opening in some poses (small blue patches at the instep).
- The tall shoes06 collar reads as a sock-boot. All 4 boot models share one mesh and differ by texture only, with no per-model shape morphs.
- Eye colour: one iris texture, no per-player eye colour yet. No teeth mesh (MPFB has a teeth asset).
- Hair is flat-shaded cards with no hair normal map. Hair cards can clip the collar on long styles.
- Accessories (headband, arm sleeves, wristbands, gloves) render through skin masks; wristband edges are a little jagged up close. Captain armband is still not rendered.
- Turn clips (CMU 16_51/16_53 with the yaw baked out), two-bone foot locking and mirrored left-foot kicks are in (gap loop rounds 1 and 5, 2026-10-12). Traps by ball height and low/high keeper dives are in (round 6).

## Next steps
1. Owner check on the real laptop: fps at AUTO with Player detail Auto-realistic and Ultra, and a close-up of the replays.
2. Eye colours: tint the iris region of a per-player eye texture copy.
3. Captain armband (needs a left-sleeve-only region in the kit atlas).
4. Teeth from MPFB (`data/teeth`) for celebrations.
5. An upper-body gesture layer (pointing, calling), headers by ball height, left-footed traps.
