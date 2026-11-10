# Mixamo download list (owner task)

Free with an Adobe account: https://www.mixamo.com — sign in, search each name, press **Download** with these settings:
**Format: FBX Binary · Skin: Without Skin · Frames per second: 30 · Keyframe reduction: none**. Leave "In Place" **unticked**.
Save every file into `tools/assets/_src/mixamo/` (git-ignored). Keep Mixamo's own file names.

Mixamo's licence lets us bake these into the game (they may not be redistributed as raw files, which is why the folder is git-ignored).

## Locomotion and turns
1. Running Turn 45 Left · 2. Running Turn 45 Right · 3. Running Turn 90 Left · 4. Running Turn 90 Right
5. Running Turn 180 Left · 6. Running Turn 180 Right
7. Jog Forward · 8. Jog Forward Fast · 9. Run Forward · 10. Fast Run
11. Running Stop · 12. Jog To Stop · 13. Run To Stop
14. Left Strafe · 15. Right Strafe · 16. Jog Backward · 17. Run Backward
18. Walk Forward · 19. Standing Walk Back

## Ball skills (search "soccer")
20. Soccer Pass · 21. Soccer Kick (shot) · 22. Soccer Header · 23. Soccer Volley Kick · 24. Soccer Trapping
25. Soccer Chest Trap (if listed as "Chest Trap") · 26. Soccer Juggling (optional) · 27. Soccer Tackle · 28. Soccer Dive (goalkeeper)
29. Goalkeeper Catch · 30. Goalkeeper Dive Low Left · 31. Goalkeeper Dive Low Right (if present; otherwise skip)
32. Jump (standing) · 33. Jumping Up

## Reactions
34. Stumble Backwards · 35. Falling Forward · 36. Getting Up · 37. Shoulder Hit Reaction (or "Hit Reaction")

## Celebrations and idle
38. Victory (cheer) · 39. Clapping · 40. Pointing · 41. Looking Around · 42. Breathing Idle

Not every name exists exactly; take the closest match and note any substitution here. When the folder is in place, say so and I'll run the import (`tools/blender/retarget.py` MAP_MIXAMO + `npm run build:player`).

## What arrived (2026-10-14): Mixamo "Soccer Game Pack"

The owner downloaded Mixamo's own **Soccer Game Pack** (54 football animations on X Bot, FBX 7.7, 30 fps, skinless,
root motion) instead of the list above. Unzipped into `tools/assets/_src/mixamo/`. `X Bot.fbx` is FBX 6.1, which
Blender cannot open; it is not needed (we retarget onto our own player). The build (`MIXAMO` in
`tools/blender/build_player_mh.py`) now takes these clips from the pack; anything not in the pack keeps its
CMU / UAL / hand-made source:

| Game clip | Pack file | Replaces |
|---|---|---|
| `idle` | offensive idle | UAL idle |
| `jog`, `jog_back` | jog forward, jog backward | CMU 16_35, reversed jog |
| `shuffle_L`, `shuffle_R` | jog strafe left / right | CMU 78_27 / 78_26 |
| `jog_fl`, `jog_fr`, `jog_bl`, `jog_br` (new) | jog forward / backward diagonal (1, 2) | blend of forward and side loops |
| `gk_side_L`, `gk_side_R` (new) | goalkeeper sidestep (1, 2) | outfield side-steps for keepers |
| `gk_idle` | goalkeeper idle | hand-made |
| `shot` (+ mirrored `shot_L`) | strike foward jog | CMU 10_01 |
| `pass_short` (+ `pass_short_L`) | kick soccerball (2) | CMU 10_02 |
| `header` | header soccerball (the old UAL jump stays as `header_jump` for balls above head height) | UAL Jump_Start |
| `trap_thigh` | kneeing soccerball | hand-made |
| `tackle_slide` | soccer tackle (slide part only) | UAL Slide_Loop |
| `fall`, `lying`, `get_up` | soccer trip, fallen idle, standing up | UAL Death01 / hand-made / UAL LayToIdle |
| `throw_in` | throw in | hand-made |
| `gk_catch`, `gk_catch_low`, `gk_catch_high` (new) | goalkeeper catch (2), catch, catch (4) | hand-made |
| `gk_dive_L`, `gk_dive_R` | goalkeeper diving save, diving save (2) | hand-made |
| `gk_throw`, `gk_punt` (new) | goalkeeper overhand throw, goalkeeper drop kick | the throw-in / long-pass clips |

Not used yet: kick soccerball (left), header (2), kneeing (2), kick up, stall 1-4, receive, scissor kick,
penalty kick, tackles (2) and (3), goalkeeper scoop / body block 1-3 / catch (3) / pass / placing ball / directing /
miss / idle (2), transition. Still missing from the list above: running turns 45/90/180, run-to-stop, sprint and
fast-run variants, chest trap, low keeper dives, stumble and celebrations (CMU / hand-made clips stay for those).
