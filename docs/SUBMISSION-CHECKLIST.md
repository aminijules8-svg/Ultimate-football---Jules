# Submission checklist — before sending the game to any portal

Written after Empire City Tycoon was rejected by CrazyGames (2026-10-08) for "overall quality does not
yet meet the expectations of our platform". That build passed the technical checks and failed on
quality: a generic look, a slow first minute, and it was only ever checked with headless screenshots.
Nobody had played it cold. Everything below exists to stop that happening again.

**Rule: nothing gets submitted until every box in sections 1–3 is ticked by a human on the real
laptop. Headless captures and `simdiff` do not count for those sections.**

## 1. Cold playtest (the gate)

- [ ] At least 2 people who have never seen the game play it with no help for 5 minutes. Watch them
      and say nothing. Write down every moment they look confused, bored or stuck.
- [ ] Each of them gets from the main menu to kicking the ball in under 20 seconds.
- [ ] Each of them takes a shot within the first minute without being told the key.
- [ ] At the end, they want another match without being asked. If not, find out why before going on.
- [ ] The owner plays 3 full matches (one per difficulty) and 1 local 2-player match, start to final
      whistle, and lists anything that felt bad. Every item is fixed or consciously accepted.

## 2. Performance on the real machine

- [ ] 3D quick match on the Crostini VM at AUTO holds a steady frame rate (record it in
      `docs/perf-baseline.md`). No hitches on goals, replays or cutscenes.
- [ ] First load to the main menu in under ~10 s on a normal connection; nothing blocks on a large
      download before the menu appears.
- [ ] A full match with no memory growth that ends in a crash or slowdown.

## 3. The first 10 seconds look and feel good

Reviewers and players decide almost immediately.

- [ ] The first frame of a match looks like a finished game: lighting, crowd, kits, no placeholder art.
- [ ] Players move like people: no foot sliding, T-poses or snapping at the broadcast camera distance.
- [ ] The ball is not glued to the foot; touches, passes and shots have weight.
- [ ] Every kick, save and goal has sound; the crowd reacts.
- [ ] Controls are shown on screen (or one tap away) the first time someone plays.

## 4. Stability

- [ ] No `PAGEERROR`/console errors through a whole match, half-time, extra time and penalties.
- [ ] Every set piece works (corner, free kick, penalty, throw-in, goal kick) in 2D and 3D.
- [ ] Every menu screen leads somewhere and back; the end-of-match screen returns to the menu.
- [ ] Old saves load; a fresh browser profile (no saves) works too.

## 5. Browser and portal basics

Check the portal's own requirements page on the day you submit; the list below is the usual ground.

- [ ] Runs inside an iframe from a relative base path (no absolute `/...` URLs).
- [ ] Space, arrow keys and Tab do not scroll or move focus away from the game.
- [ ] Pauses and mutes when the tab is hidden; there is a mute button.
- [ ] No external links, no own ads, no "play on another site" branding.
- [ ] Portal SDK wired in: loading/gameplay start-stop events, saves through the SDK where required,
      ads only at natural breaks (half-time, after the match), never mid-play.
- [ ] Download size within the portal's limit.

## 6. Legal

- [ ] No real club names, crests, kits, player names or league brands that could read as licensed
      (check `src/world/names.js`; generic country leagues are fine, real trademarks are not).
- [ ] `docs/CREDITS.md` lists every asset and licence (MakeHuman CC0, Quaternius CC0, CMU mocap
      acknowledgement, fonts).

## 7. Store page

- [ ] The preview video is the best 15–20 s of real gameplay: a skill move, a shot, a goal, a
      celebration. No menus.
- [ ] Screenshots are real in-match frames at a normal quality setting, not cherry-picked staged
      shots that the game doesn't look like when played.
- [ ] The name is free on the portal before making the covers.
