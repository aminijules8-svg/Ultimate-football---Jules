# Third-party assets

All clubs, players and sponsors in the game are fictional. The player character is generated from the
openly licensed sources below by `npm run build:player` (sources are downloaded by `tools/assets/fetch.sh`
into the git-ignored `tools/assets/_src/`).

| Asset | Used for | Licence |
|---|---|---|
| [MakeHuman](http://www.makehumancommunity.org/) base mesh, targets, skins, eyes, brows, lashes, hair, `shoes06` via [MPFB2](https://extensions.blender.org/add-ons/mpfb/) 2.0.17 and the MakeHuman system asset pack | body, face, skin textures, hair, boots | CC0 1.0 |
| [Quaternius — Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) (Standard) and Universal Animation Library 2 (Standard) | idle, walk, jog, sprint, sit, slide, fall, get up, celebrations, manager idle | CC0 1.0 |
| [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) via `@fontsource/barlow-condensed` | menu typeface | SIL Open Font License 1.1 |
| [CMU Graphics Lab Motion Capture Database](http://mocap.cs.cmu.edu/) (cgspeed BVH conversion) | soccer kicks (subjects 10/11), run, stops, turns, sidesteps | free to use, including in commercial products |

The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

Goalkeeper dives, the referee's card/whistle and a few celebrations are the project's own procedural clips
(`tools/blender/build_player.py`), retargeted onto the MakeHuman rig.
