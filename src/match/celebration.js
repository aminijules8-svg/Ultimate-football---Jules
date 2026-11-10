// The celebration director (Phase B): a goal's context -> a plan (who runs where, which move, who joins when, how the
// opponents react), and plan + time -> what each player does. Pure and deterministic from the seed, so the host can send
// the plan to an online guest and both screens play the same scene. Positions are pitch metres (x along the length,
// attacking direction `field.dir`), times are seconds since the goal.

export const MOVES = {
  celebrate_cheer: { clip: 'celebrate_cheer', moods: ['humble', 'fiery'], dur: 2.6 },
  celebrate_knee_slide: { clip: 'celebrate_knee_slide', moods: ['showman'], dur: 3.0 },
  celebrate_point_sky: { clip: 'celebrate_point_sky', moods: ['humble'], dur: 2.4 },
  celebrate_dance: { clip: 'celebrate_dance', moods: ['showman'], dur: 3.2 },
  celebrate_fists: { clip: 'celebrate_fists', moods: ['fiery'], dur: 2.4 },
  celebrate_salute: { clip: 'celebrate_salute', moods: ['humble'], dur: 2.2 },
  celebrate_shush: { clip: 'celebrate_shush', moods: ['showman'], dur: 2.4 },
  celebrate_heart: { clip: 'celebrate_heart', moods: ['humble'], dur: 2.4 },
  celebrate_jumpspin: { clip: 'celebrate_jumpspin', moods: ['showman'], dur: 2.2, skill: 60 },
  celebrate_backflip: { clip: 'celebrate_backflip', moods: ['showman'], dur: 2.0, skill: 80 },
  celebrate_spin: { clip: 'celebrate_spin', moods: ['showman'], dur: 2.0 },
  celebrate_ear: { clip: 'celebrate_ear', moods: ['showman'], dur: 2.4 },
  celebrate_badge_kiss: { clip: 'celebrate_badge_kiss', moods: ['humble'], dur: 2.6 },
  celebrate_angry: { clip: 'celebrate_angry', moods: ['fiery'], dur: 2.4 },
  celebrate_jump: { clip: 'celebrate_jump', moods: ['fiery'], dur: 2.0 },
};
// keys 1-8 during a goal (pad A/B/X/Y for 5-8), in the order the old CELS list used
export const KEY_MOVES = ['celebrate_cheer', 'celebrate_knee_slide', 'celebrate_point_sky', 'celebrate_dance', 'celebrate_fists', 'celebrate_salute', 'celebrate_shush', 'celebrate_heart'];
const ROLE_CLIP = { hug: 'hug', five: 'hand_slap', jump: 'celebrate_jump' };
// joiners in arrival order: 'hug' wraps around the scorer (inner ring), 'five' slaps hands with another 'five' (pairs on the
// outer ring), 'jump' jumps beside the group; the first joiner always hugs so the scorer has someone to hold
const ROLES = { showman: ['hug', 'jump', 'five', 'five', 'jump', 'hug'], humble: ['hug', 'hug', 'five', 'five', 'hug', 'hug'], fiery: ['hug', 'jump', 'hug', 'five', 'five', 'jump'] };
const SPRINT = 7, JOIN_SPEED = 7.5, MAX_RUN = 26, REACT_RANGE = 25;
// standing distances (m, body centre to centre): a hugger to the scorer (hands on the shoulders must be in reach), the two
// players of a high five, a jumper to the scorer
export const HUG_GAP = 0.45, FIVE_GAP = 0.84, JUMP_RING = 1.35, FIVE_RING = 1.6;
// a knee slide covers the last SLIDE metres of the run on the knees (the game slides the body; at 7 m/s it takes ~1 s)
export const SLIDE = 3.5;

function rng(seed) {  // mulberry32
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clampIn = (v, lim) => Math.max(-lim, Math.min(lim, v));
const r2 = v => Math.round(v * 100) / 100;

/** Goal context -> plan, or null when nobody celebrates (own goal). See tests/celebration.test.mjs for the rules. */
export function planCelebration(ctx) {
  if (ctx.ownGoal) return null;
  const R = rng(ctx.seed * 2654435761 + 97), { HW, HH, dir } = ctx.field, sc = ctx.scorer;
  const us = ctx.score[ctx.team], them = ctx.score[1 - ctx.team];
  let mood = ['showman', 'humble', 'fiery'][Math.floor(R() * 3)];
  if (us === them) mood = 'fiery';                                  // equaliser
  if ((ctx.minute >= 85 && us - them === 1) || (ctx.final && us > them)) mood = 'showman';  // late winner / final winner
  let move;
  if (ctx.pick != null && KEY_MOVES[ctx.pick]) move = KEY_MOVES[ctx.pick];
  else {
    const pool = Object.keys(MOVES).filter(m => MOVES[m].moods.includes(mood) && (sc.skill ?? 50) >= (MOVES[m].skill || 0));
    move = pool[Math.floor(R() * pool.length)];
  }
  if (ctx.shootout) {  // a penalty in a shoot-out: a quick fist pump on the spot
    return { seed: ctx.seed, mood: 'fiery', move: ctx.pick != null && KEY_MOVES[ctx.pick] ? move : 'celebrate_fists', dur: 3, run: { x: r2(sc.x), y: r2(sc.y) },
      runEnd: 0.2, moveEnd: 2.6, walkStart: 3, back: { x: r2(sc.x), y: r2(sc.y) }, scorer: sc.i, joiners: [], reactions: [] };
  }
  // run-off: toward the corner flag on the attacked side, at most MAX_RUN metres, always inside the pitch
  const cx = dir * (HW - 3), cy = Math.sign(sc.y || 1) * (HH - 4), dx = cx - sc.x, dy = cy - sc.y, dist = Math.hypot(dx, dy);
  const flag = [dir * HW, Math.sign(sc.y || 1) * HH], closer = Math.hypot(sc.x - flag[0], sc.y - flag[1]) <= Math.hypot(cx - flag[0], cy - flag[1]);
  const k = closer ? 0 : dist > MAX_RUN ? MAX_RUN / dist : 1;  // already by the flag: celebrate there
  const run = { x: r2(clampIn(sc.x + dx * k, HW - 1.5)), y: r2(clampIn(sc.y + dy * k, HH - 1.5)) };
  const runLen = Math.hypot(run.x - sc.x, run.y - sc.y), slide = move === 'celebrate_knee_slide' && runLen > 2 * SLIDE ? SLIDE : 0;
  const runEnd = r2(Math.max(0.4, (runLen - slide) / SPRINT + 0.4));  // a knee slide starts SLIDE metres short of the spot
  const moveEnd = r2(runEnd + MOVES[move].dur);
  // teammates: nearest first, 3-6 of them, arriving one after another
  const near = [...ctx.mates].sort((a, b) => Math.hypot(a.x - run.x, a.y - run.y) - Math.hypot(b.x - run.x, b.y - run.y));
  const n = Math.min(near.length, 3 + Math.floor(R() * 4)), joiners = [], roles = ROLES[mood].slice(0, n);
  if (roles.filter(r => r === 'five').length % 2) roles[roles.lastIndexOf('five')] = 'hug';  // high fives need two
  // angles round the scorer already used: the hug ring and the outer ring (jumpers, high-five pairs) are kept apart
  const inner = [], outer = [], gap = (a, list) => Math.min(9, ...list.map(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))));
  const spot = (a0, sep, list) => {  // the nearest free angle to a0 (steps of 20 deg either way); a full ring: the widest gap
    let best = a0, bestGap = -1;
    for (let k = 0; k < 18; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35, g = gap(a, list); if (g >= sep) { best = a; break; } if (g > bestGap) { bestGap = g; best = a; } }
    list.push(best); return best;
  };
  const at2 = (a, rad) => ({ x: r2(run.x + Math.cos(a) * rad), y: r2(run.y + Math.sin(a) * rad) });
  let prev = runEnd + 0.1, waiting = null;
  for (let j = 0; j < n; j++) {
    const m = near[j], travel = Math.hypot(m.x - run.x, m.y - run.y) / JOIN_SPEED, at = r2(Math.max(prev + 0.35, runEnd + 0.5 + 0.45 * j, travel + 0.2));
    const role = roles[j], from = Math.atan2(m.y - run.y, m.x - run.x) + (R() - 0.5) * 0.3;  // stop on the side they come from
    const J = { i: m.i, at, start: r2(Math.max(0, at - travel)), role, slot: null, partner: null };
    if (role === 'hug') { J.slot = at2(spot(from, 1.25, inner), HUG_GAP); J.partner = sc.i; }  // 72 deg apart: shoulder to shoulder round the scorer
    else if (role === 'jump') J.slot = at2(spot(from, 0.7, outer), JUMP_RING);
    else if (!waiting) { waiting = J; J.mid = spot(from, 0.9, outer); }  // first of a high-five pair: the pair stands around this angle
    else {  // second of the pair: both slots either side of the pair's centre, facing each other
      const a = waiting.mid, c = at2(a, FIVE_RING), tx = -Math.sin(a) * FIVE_GAP / 2, ty = Math.cos(a) * FIVE_GAP / 2;
      waiting.slot = { x: r2(c.x - tx), y: r2(c.y - ty) }; J.slot = { x: r2(c.x + tx), y: r2(c.y + ty) };
      waiting.partner = J.i; J.partner = waiting.i; delete waiting.mid; waiting = null;
    }
    joiners.push(J);
    prev = at;
  }
  const walkStart = r2(Math.max(moveEnd, (joiners.length ? joiners[joiners.length - 1].at : runEnd) + 2.4));
  let dur = Math.min(14, Math.max(8, walkStart + 2.5));
  if (ctx.final && us > them) dur = Math.min(14, Math.max(dur, 12));
  const back = { x: r2(run.x - dir * 12), y: r2(run.y * 0.6) };
  // opponents: the keeper and the two nearest outfield players within range
  const reactions = [], gk = ctx.opps.find(o => o.role === 'GK');
  if (gk) reactions.push({ i: gk.i, clip: 'react_upset', at: 0.4 });
  ctx.opps.filter(o => o.role !== 'GK').map(o => [o, Math.hypot(o.x - sc.x, o.y - sc.y)]).filter(([, d]) => d < REACT_RANGE)
    .sort((a, b) => a[1] - b[1]).slice(0, 2).forEach(([o], j) => reactions.push({ i: o.i, clip: j ? 'react_complain' : 'react_sad', at: 0.6 + 0.3 * j }));
  const wings = R() < 0.6;  // drawn last so it leaves the other choices as they were
  return { seed: ctx.seed, mood, move, dur: r2(dur), run, runEnd, moveEnd, walkStart, back, scorer: sc.i, joiners, reactions, slide, wings, from: { x: r2(sc.x), y: r2(sc.y) } };
}

/** The scorer's move picked by key k at time t: during the run it replaces the planned move; later the scorer does it
 *  there and then. Team-mates and opponents keep their timeline; the end moves out if the move needs it (at most 14 s).
 *  Returns a new plan (the old one is not changed); an unknown key returns the plan as it is. */
export function pickMove(plan, k, t) {
  const move = KEY_MOVES[k]; if (!move || !plan) return plan;
  let runEnd = plan.runEnd, slide = 0;
  if (t < plan.runEnd && plan.from) {  // still running: the run is timed for the new move (a knee slide starts SLIDE metres short)
    const runLen = Math.hypot(plan.run.x - plan.from.x, plan.run.y - plan.from.y);
    slide = move === 'celebrate_knee_slide' && runLen > 2 * SLIDE ? SLIDE : 0;
    runEnd = r2(Math.max(t, 0.4, (runLen - slide) / SPRINT + 0.4));
  }
  const at = Math.max(t, runEnd), moveEnd = r2(at + MOVES[move].dur), walkStart = r2(Math.max(plan.walkStart, moveEnd));
  return { ...plan, move, pickK: k, slide, runEnd, moveAt: t > runEnd ? r2(at) : undefined, moveEnd, walkStart, dur: r2(Math.min(14, Math.max(plan.dur, walkStart + 2.5))) };
}

/** plan + seconds since the goal -> Map(player index -> { tx, ty, spr, clip, look, partner?, kind? }); pos(i) gives live
 *  positions. clip null = ordinary locomotion toward (tx, ty); look = a point to face; partner = the player whose body the
 *  hands go to (kind 'hug': on the shoulders, 'hold': on the hugger's sides under his arms, 'five': the shared slap point). Players not in the map carry on as the game decides. */
export function celebrationAt(plan, t, pos) {
  const out = new Map(), look = plan.run;
  const backFor = () => ({ tx: plan.back.x, ty: plan.back.y, spr: false, clip: null, look: null });
  // the scorer
  if (t < plan.runEnd) out.set(plan.scorer, { tx: plan.run.x, ty: plan.run.y, spr: true, clip: null, look: null, carry: !!plan.slide, wings: !!plan.wings });  // carry: no braking into a knee slide; wings: arms spread on the run
  else if (t >= (plan.moveAt ?? plan.runEnd) && t < plan.moveEnd) {  // the move, facing back into the pitch: toward the camera, the crowd behind
    const l = Math.hypot(plan.run.x, plan.run.y) || 1;
    out.set(plan.scorer, { tx: plan.run.x, ty: plan.run.y, spr: false, clip: MOVES[plan.move].clip, look: plan.move === 'celebrate_knee_slide' ? null : { x: r2(plan.run.x * (1 - 6 / l)), y: r2(plan.run.y * (1 - 6 / l)) } });  // (a slide keeps its line)
  }
  else if (t < plan.walkStart) {
    const h = plan.joiners.find(j => j.role === 'hug');
    out.set(plan.scorer, h && t >= h.at ? { tx: plan.run.x, ty: plan.run.y, spr: false, clip: 'hug', look: h.slot, partner: h.i, kind: 'hold' }
      : { tx: plan.run.x, ty: plan.run.y, spr: false, clip: 'celebrate_cheer', look: null });
  }
  else out.set(plan.scorer, backFor());
  // teammates
  for (const j of plan.joiners) {
    if (t >= plan.walkStart) { out.set(j.i, backFor()); continue; }
    if (t < j.start) { const p = pos(j.i); out.set(j.i, { tx: p.x, ty: p.y, spr: false, clip: null, look }); continue; }
    if (t < j.at) { out.set(j.i, { tx: j.slot.x, ty: j.slot.y, spr: true, clip: null, look }); continue; }
    if (j.role === 'five') {  // face the partner; slap once both are there
      const o = plan.joiners.find(q => q.i === j.partner), both = t >= Math.max(j.at, o.at);
      out.set(j.i, { tx: j.slot.x, ty: j.slot.y, spr: false, clip: both ? ROLE_CLIP.five : null, look: o.slot, partner: both ? o.i : null, kind: both ? 'five' : null, since: Math.max(j.at, o.at) });
      continue;
    }
    out.set(j.i, { tx: j.slot.x, ty: j.slot.y, spr: false, clip: ROLE_CLIP[j.role], look, partner: j.role === 'hug' ? plan.scorer : null, kind: j.role === 'hug' ? 'hug' : null });
  }
  // opponents
  for (const r of plan.reactions) {
    const p = pos(r.i);
    out.set(r.i, { tx: p.x, ty: p.y, spr: false, clip: t >= r.at ? r.clip : null, look: null });
  }
  return out;
}
