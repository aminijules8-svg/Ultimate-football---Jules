# Closing the eFootball gap — loop plan (v4, 2026-10-12)

Owner request: "make a plan to overcome the gap and run the plan and repeat the process until there are no gaps except for the player looks and real names".

Out of scope by owner choice: player looks up close, real names, crests and faces (invented names stay; see plan v3's legal section).

## How the loop works
Each round:
1. Re-score every area against eFootball 2026 (table below).
2. Fix the biggest gaps that can be closed with free assets.
3. Verify with numbers, not by feel:
   - `scripts/capture.mjs` (3D and 2D, no PAGEERROR);
   - `scripts/simdiff.mjs` (difficulty curve and match stats);
   - `__UF` test hooks (movement, ball, keeper, online).
4. Commit on `build`, fast-forward `main`, push.
5. Update the scoreboard and start the next round.

The loop stops when every in-scope area is **small** or **equal**.

## Scoreboard
| Area | Start of loop | Now | Target |
|---|---|---|---|
| Ball physics | small–medium | small | small |
| Movement and animation | very large | small (Mixamo pack in; arms and rig fixed 2026-10-15; directed celebrations with contact 2026-10-16) | small |
| Gameplay and AI | medium–large | small | small |
| Controls and feel | medium | medium | small / equal |
| Modes (offline) | small | equal (careers with dates, tournaments with groups, 16 leagues + 46 nations, kit/boot/crest customisation) | equal |
| Online play | none | small | small (1v1 friendlies) |
| Presentation | large | small–medium (commentary v2, atmosphere, menu art, stadium styles) | small |
| Player looks / real names | very large | large (hands, posture, 15 body types fixed; faces unchanged) | out of scope |

## Rounds
### Round 1 — Movement (no downloads needed)
- **Player physics:**
  - turning circle shrinks with speed;
  - a sharp change of direction at speed is a plant-and-cut (brake, then go);
  - facing turns at a limited rate.
- **Directional movement:** off-ball players and defenders face the play while side-stepping and back-pedalling; the attacking team runs forward.
- **New mocap clips (CMU):** back-pedal, side-steps L/R, 90° run cuts L/R. The runtime blends forward, back and side by the direction of travel relative to facing.
- **Foot locking:** two-bone leg IK pins the planted foot, measured as foot slide per frame.

### Round 2 — Gameplay and AI
- Defensive line with a height per tactic, offside trap, a compact block that shifts with the ball.
- Pressing triggers: back-pass, heavy touch, receiver facing his own goal.
- Off-ball runs: in behind, overlaps, checking to the ball, back-post runs on crosses.
- Set-piece routines; walls that jump; advantage play.
- Check: `simdiff` match statistics in real-football ranges (shots, passes, possession).

### Round 3 — Presentation
- Walk-out and line-ups.
- Spoken commentary (free Web Speech voices).
- Club chants generated from club names.
- Multi-angle replays and a full-time highlights package.
- Night floodlights.

### Round 4 — Online 1v1 friendlies
- PeerJS (free broker) with a room code.
- The host runs the match; the guest sends inputs and receives snapshots at 20–30 Hz.
- Check: two-browser test with injected latency.

### Round 5+ — Re-score and repeat
Re-compare every area, then pick the next biggest gaps.

### Optional, needs the owner
About 40 Mixamo clips (free Adobe account) for traps, volleys, chest control and keeper saves. These improve round 1 further but are not required to finish it.

## Log
- **Plan v4 complete (2026-10-13)** — phases 1–23 done and logged in `DEVELOPMENT_PROGRESS.md`; `node scripts/acceptance.mjs` runs 29 checks (all passing). Owner items left: Mixamo clips (`docs/MIXAMO_LIST.md`), laptop fps/feel, listening to the voices and the new atmosphere mix, one real online match.
- **Plan v4 (2026-10-13)** — owner brief: gameplay repair, polish, feature completion. Per-phase detail lives in `DEVELOPMENT_PROGRESS.md`. Phase 2: passes 10/16/25 m in 0.72/1.02/1.33 s, dribbling as real touches (1.4–1.6 touches/s, ball 0.8–1.0 m ahead, sharp turns answered in 0.07 s), cushioned first touch, through-ball receivers run, cross crash fixed. Ball physics → **small**.
- **Round 1 (2026-10-12) — movement.** Plant-and-cut player physics (lateral grip limits the turning circle; sharp cuts brake first): a 90° cut at 7 m/s settles in 0.45 s dropping to 1.7 m/s, a 180° turn in 0.27 s, a 45° adjustment at 4 m/s in 0.25 s without slowing. Defenders and nearby off-ball players face the play and back-pedal or side-step; the body-frame velocity drives forward / back-pedal / side-step loop sets (reversed walk, jog and run as back-pedals; the CMU defensive shuffles as side-steps, named by their measured travel direction). Two-bone foot locking: planted-foot slide per frame 15.4 mm → 0.8 mm at run speed (max 106 → 12 mm), 14.8 → 0.8 mm back-pedalling, 0.3 mm walking (`viewer.html?clip=run&speed=6.3&move=240&ik=1`). Difficulty curve unchanged (simdiff n=4: AI wins 0,0,2,2,4,4,4). Scores: movement very large → **large** (turn clips and ball-contact variety still missing).
- **Round 2 (2026-10-12) — gameplay and AI.** Out of possession the team is a block: a flat back line a tactic-set distance behind the ball (Low block / Defensive deeper, High press up to 12 m past halfway), the midfield screening 9 m in front, everything shifted to the ball side. Pressing triggers (carrier facing his own goal, a back-pass, a heavy touch) add a presser and make them sprint; the next two players sit in the lane to his best option (cover shadows). In possession: runs in behind that stay level with the last defender until the ball is played, overlaps down the line, midfielders checking to the ball to open a lane; the carrier plays through balls to runners, passes on an urge (pressure, a better-placed team-mate, time on the ball, tactic) instead of after 3.5 s, carries when there is room, goes long when nothing is on. AI corners are crossed into the box; the wall jumps at free kicks; the referee plays the advantage. Match clock note: a 90-minute match is about 7 minutes of play, so passes per minute of possession (about 18) already match real football. simdiff n=6: AI wins 0,0,2,4,5,6,6 (clean curve), Regular 1.7:0.7 goals, shots 5.5:3.8, completion 56–68%, possession 47–48%. Scores: gameplay medium–large → **medium** (set-piece routines, player traits and fatigue still to do).
- **Round 3 (2026-10-12) — presentation.** Spoken commentary and a stadium announcer through the browser's built-in voices (`src/audio/voice.js`: ordinary lines are dropped while one is being read, goals and full time interrupt, the announcer reads the scorer and the score 3 s after the goal; off switch in Settings). Club chants generated from the club name (`crowdAudio.chant`: a clapped rhythm and one sung note per syllable, falling on the last) at kick-off, after goals and about once a minute in lulls. Goal replays alternate between two camera sets (behind the goal → side; low behind the play → high behind the goal) and are kept as a highlights package playable from the full-time card. Verified: goal → replay → highlights path and the settings screen headless with no page errors; the voices and chants need the owner's ears. Scores: presentation large → **medium** (walk-out tunnel scene and floodlight shadows still to do).
- **Round 4 (2026-10-12) — online 1v1 friendlies.** Main menu → Online friendly. The host creates a room and gets a 5-letter code; the friend types it in. The link is a WebRTC data channel brokered by the free public PeerJS server (`src/net/peer.js`, no server of our own). The host runs the match and streams the frame it renders plus the match state 20 times a second; the friend is a second human on the host whose key presses arrive over the link (`net_` key codes, same gestures and Simple scheme), and renders the host's frames with 100 ms of interpolation. Clubs, squads, kits, lineups, weather and stadium are sent at kick-off so both sides see the same match even with different saved worlds. A lost connection hands the friend's team to the computer. `scripts/nettest.mjs`: two headless browsers through the real broker — handshake, setup, state mirroring (same clock and score) and a guest key press moving the guest's player on the host: PASSED (2D, about 9 frames/s on this VM; the rate is the host's frame rate, 20/s on a real machine). Scores: online none → **small** (no TURN relay, so strict firewalls can block it; no artificial delay to equalise feel).
- **Round 5 (2026-10-12) — movement again (re-scored as the biggest in-scope gap).** Running-turn clips from CMU (16_51 left, 16_53 right) baked with the hip yaw removed frame by frame (`turn_clip`, Retargeter `pre` hook), so the body keeps facing forward while the legs plant and push and the simulation's own rotation does the turning; played when the facing changes faster than 2.4 rad/s above 3 m/s. A second sudden-stop clip (16_57) alternates with the first. 55 clips. Viewer: `clip=turn_L&t=0.45`. Scores: movement large → **medium–large** (traps by height, keeper dive variety, stumbles and an upper-body gesture layer are what remain; the Mixamo set would cover most of them).
- **Round 6 (2026-10-12) — first touches, stumbles, keeper variety.** Authored clips on the legacy rig (`build_player.py`), retargeted into the MakeHuman model: chest trap and thigh trap chosen by the ball's height when a player takes a pass (above 0.9 m / above 0.45 m, arriving faster than 3 m/s), a stumble on half of all heavy touches, a low dive and a high tip-over for the keeper chosen by the ball's height at the line (below 0.85 m / above 2.05 m; the full dive otherwise). 62 clips. Viewer: `clip=trap_chest`, `trap_thigh`, `stumble`, `gk_dive_low_L`, `gk_tip_R`. Scores: movement medium–large → **medium** (left-footed traps, headers by height, a calling/pointing arm layer and real mocap for all of these would take it further).
- **Round 7 (2026-10-13) — set pieces, traits, fatigue.** Corner routines (near post / far post / central, or short), attackers on six box slots and defenders marking goal-side of an attacker (human corners too). The CPU takes free kicks properly: a wall of 2–4 forms at 9.3 m inside 32 m and holds until the kick, a direct effort inside 31 m when central, otherwise a ball into the box; takers now stand still at a dead ball. Player traits from attributes (pace merchant carries, playmaker passes early and plays more through balls, finisher shoots more, target man holds and shields, wall tackles more, sweeper keeper rushes from further out). Tired players press last and release the ball sooner. `__UF.foulTest(x,y,secs)` steps a CPU free kick synchronously: wall formed, kick at 1.8 s, shot / cross / penalty as expected. simdiff n=4: AI wins 0,0,1,2,3,4,4. Scores: gameplay medium → **small–medium**.
- **Realer players Phase A (2026-10-15) — arms and rig.** Measured every clip against its source (`--armcheck`). The CMU-era arm "fixes" bent Quaternius arms up to 19.5° away from the capture and are gone; arm bones align by full rest frame (palm error 20° → 4°); a build bug that cancelled every per-clip facing turn is fixed; CMU subjects 1–9 now download. New idle (CMU 82_08, arms 9° from vertical instead of 31° flared), new run (CMU 78_12 footballer, elbows tucked 0.10 vs 0.35), run variants near run speed; twist bones in arms and forearms; corrective shapes at elbows, knees, shoulders, hips; follow-through springs; outside arm lifts on cuts. Scores: movement medium → **small–medium** (celebrations and the sprint clip remain).
- **Realer players Phase B (2026-10-16) — celebrations.** A director plans each goal (mood from the moment, run-off to the corner, the move facing the camera, 3–6 team-mates arriving to hug, high-five and jump, opponents reacting, 8–14 s, skippable, same scene online). Moves are CMU captures and IK gestures on captured bodies with palms and fingers aimed; hands land on team-mates within 2 mm on average (≤ 18 mm worst); close pitch-side celebration camera. Scores: movement small–medium → **small**.
