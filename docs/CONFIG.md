# Configuration, saves and test hooks

Everything the game remembers lives in the browser. Nothing is sent anywhere except the optional
online friendly (PeerJS broker, see `src/net/peer.js`).

## localStorage keys

| Key | Holds | Written by |
|---|---|---|
| `uf_set` | settings: control scheme, key map, difficulty, weather, graphics (`gq`, `pgq`), volume, `muted`, `voice`, `chants`, `cv` (commentary volume), `cap` (captions), `fb` (favourite boots), stadium choices (`stad`, `cstad`), active league, world seed | `saveSet()` in `src/game.js` |
| `uf_careers` | manager careers (array). Per career: `league, me, mn, face, body, wk, fx, tb, log, news, bud, year, season, res, hist, kitProposal` | `saveCareer()` |
| `uf_pcs` | player careers (array). Per pro: `club, pos, style, idx, nm, face, body, look (bootId…), a, xp, wk, fx, tb, cup, year, season, res, hist` | `savePC()` |
| `uf_tour` | the tournament in progress (`tour` + template id), restored on load | `saveTour()` |
| `uf_portraits` | rendered portrait cache (≤ 48 data URLs) | `src/render3d/portrait.js` |
| `uf_trash` | the last deleted career or pro, restorable for 24 h | `trashPut()` |
| `uf_backup_<key>`, `uf_backup_v`, `uf_backup_t` | raw copies of `uf_set`, `uf_careers`, `uf_pcs`, `uf_tour` taken before the migrations of save version `SAVE_MIG` run | `backupSaves()` at load |
| `uf_backup_world` | size record of the world before the leaguesV3 migration | `initWorld()` |
| `uf_lw` | last result card | match end |

Old single-save keys `uf_career` / `uf_pc` are folded into the arrays on load and removed.

## The world (IndexedDB `ultimate-football` / store `world`)

Generated once from the seed in `uf_set` (`generateWorld`, `src/world/gen.js`) and then edited in place
(transfers, kits, crests, stadiums). One-off migrations run in `initWorld()` and set a flag so they never run twice:

| Flag | Migration |
|---|---|
| `stylesV` | playstyle per player (Phase 8) |
| `leaguesV2` | league renames |
| `stadiumsV2` | stadium per club by reputation |
| `leaguesV3` | six more league countries + nations list + national pools (Phase 16) |
| `regional.v` | regional (CECAFA) clubs, nations, legends |
| `crestV2` | crest design fields per club (Phase 10) |

`clearWorld()` (World editor › Regenerate) deletes it; careers keep their league ids and are rebuilt from the new world.

## Scripts

| Command | What it does |
|---|---|
| `npm run build` | production build to `dist/` |
| `npm run build:player` | Blender + MPFB2 character build (`tools/blender/build_player_mh.py`) → `public/models/player.glb`, clips, masks |
| `node scripts/capture.mjs [--menu] [--2d] [--goal] [--viewer=…] [--eval=…] [--evalplay=…] [--out=dir]` | headless screenshots and hook evaluation |
| `node scripts/simdiff.mjs --n=N` | N simulated matches per difficulty: goals, shots, completion, possession |
| `node scripts/nettest.mjs [--nation]` | two headless browsers through the PeerJS broker |
| `node scripts/acceptance.mjs` | runs every `__UF.test*` hook and prints a pass table (Phase 23) |

## Test hooks (`window.__UF`)

Menu context (world loaded): `testLeagues testPickAny testCrests crestSheet testBoots kitSheet testKitSave testCalendar testPCCal testSeasonRoll testDeleteFlow testTourSetup testTourGroups testNationsPick testNations testWorldCup testMigration testCommentary testAtmosphere testSaveSafety walkthroughs testArch testStyles testHairPersist testPortrait`.
Match context (after `skipIntro`): `testPass testDribble testHeader testMove footBall animSnap stepSim stepDraw foulTest stadiumStyle commentaryLog`.
Helpers: `go(screen) newPro(club) pickAny(side, group, n) simSeason(n) simMatch netHost netJoin netStart netInfo`.
