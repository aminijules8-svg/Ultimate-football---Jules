# Identifier glossary for `src/game.js`

The legacy code uses 1–3 letter names. New code uses readable names; legacy names are renamed when a section is extracted into its own module. Until then, this table is the map.

| Legacy | Meaning | Legacy | Meaning |
|---|---|---|---|
| `R` | `Math.random` | `cl(v,a,b)` | clamp |
| `HW`, `HH`, `GH` | half pitch width/height (52.5, 34 m), goal half-width 3.66 | `S`, `dpr` | 2D scale, device pixel ratio |
| `cv`, `g` | 2D canvas + context | `R3`, `scn`, `cam3` | WebGL renderer, scene, camera |
| `CL` | clubs | `FM`, `FN` | formation slots / names |
| `TN`, `DN`, `WN`, `GN` | tactic / difficulty / weather / graphics names | `DSG` | kit design names |
| `KM`, `KM0` | key map / default key map | `GS` | gameplay assist sliders |
| `TM` | the two teams `[home, away]` | `b` | the ball |
| `T.p[i]` | player i of team T | `p.a` | player attributes (pace, pass, shoot, def, drib, dive, hand, reflex, pow) |
| `st` | match state (`menu, intro, play, goal, replay, ht, ft, pens, pause, aim`) | `scr` | menu screen id |
| `mode` | `quick, career, pc, tour, train` | `pre` | pre-match setup (kits, formations, tactics, lineups) |
| `sel` | selected club indices | `diff`, `wx`, `gq` | difficulty, weather, graphics level |
| `gt` | match clock (game seconds) | `dead` | dead-ball timer |
| `ctrl` | human-controlled player | `charge`, `charging` | shot power |
| `SQD`, `getSquad` | cached squads (seeded) | `mk(t,c)` | build team t from club c |
| `kick`, `pass`, `shoot`, `tackle`, `foul`, `setPiece`, `goal` | match actions | `decide`, `gkAI`, `shape` | AI |
| `move`, `ballStep`, `bounds`, `contact` | physics | `update(dt)`, `draw()`, `loop()` | main loop |
| `mkPl3`, `anim3`, `refStep` | 3D player build / animate / referee | `init3D`, `render3D`, `cmode` | 3D scene |
| `cvT`, `M3`, `shirtTex`, `face` | canvas texture, std material, kit texture, face texture | `skb`, `fbt`, `hbt` | skin/fabric/hair bump maps |
| `btn`, `txt`, `box` | 2D UI primitives | `drawMenu`, `drawPause`, `drawIntro`, `bgArt` | 2D screens |
| `career`, `pc`, `tour` | manager career, player career, tournament state | `saveSet`, `loadAll`, `saveCareer` | persistence (`uf_set`, `uf_careers`, `uf_pcs`) |
| `worldSeed`, `mulberry32` | seeded RNG for squads (Phase 0) | `window.__UF` | dev/test hooks (Phase 0) |
| `mkPl3Legacy`, `anim3Legacy` | primitive-built player fallback (used until the glb loads) | `kitFor(T,p)` | per-player kit atlas (cached) |
| `p.act`, `p.actT`, `p.actReq` | last animation action, its time, requested action for the next kick | `b.spKind` | restart type the ball is waiting for (e.g. Throw-in) |
