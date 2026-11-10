// The celebration director: goal context -> plan; plan + time -> what each player does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { planCelebration, celebrationAt, pickMove, MOVES, KEY_MOVES, HUG_GAP, FIVE_GAP, SLIDE } from '../src/match/celebration.js';

const field = { HW: 52.5, HH: 34, dir: 1 };   // the scoring team attacks +x
const mates = n => Array.from({ length: n }, (_, k) => ({ i: 10 + k, x: 20 + k * 3, y: -10 + k * 2 }));
const opps = [{ i: 30, x: 51, y: 0, role: 'GK' }, { i: 31, x: 44, y: 4, role: 'CB' }, { i: 32, x: 42, y: -6, role: 'CB' }, { i: 33, x: 10, y: 0, role: 'CM' }];
const base = (o = {}) => ({ seed: 7, minute: 30, score: [1, 0], team: 0, ownGoal: false, final: false, shootout: false, pick: null,
  field, scorer: { i: 9, x: 44, y: 6, skill: 70 }, mates: mates(8), opps, ...o });

test('the same goal gives the same plan', () => {
  assert.deepEqual(planCelebration(base()), planCelebration(base()));
});

test('an own goal gets no celebration', () => {
  assert.equal(planCelebration(base({ ownGoal: true })), null);
});

test('a celebration lasts 8 to 14 seconds; a shoot-out penalty is short', () => {
  for (let s = 0; s < 40; s++) {
    const p = planCelebration(base({ seed: s }));
    assert.ok(p.dur >= 8 && p.dur <= 14, `seed ${s}: ${p.dur}`);
  }
  const so = planCelebration(base({ shootout: true }));
  assert.ok(so.dur <= 3.5, `shoot-out ${so.dur}`);
});

test('mood follows the moment: an equaliser is fiery, a late winner is a showman, a final winner is the longest', () => {
  assert.equal(planCelebration(base({ score: [1, 1], minute: 60 })).mood, 'fiery');
  assert.equal(planCelebration(base({ score: [2, 1], minute: 88 })).mood, 'showman');
  const fin = planCelebration(base({ score: [2, 1], minute: 88, final: true }));
  const ord = planCelebration(base({ score: [2, 1], minute: 40 }));
  assert.ok(fin.dur >= ord.dur && fin.dur >= 12, `final ${fin.dur} vs ${ord.dur}`);
});

test('keys 1-8 pick the move', () => {
  for (let k = 0; k < 8; k++) assert.equal(planCelebration(base({ pick: k })).move, KEY_MOVES[k]);
  for (const m of KEY_MOVES) assert.ok(MOVES[m], `${m} is a known move`);
});

test('the run-off target stays inside the pitch and heads for the corner on the attacking side', () => {
  for (const sc of [{ i: 9, x: 52, y: 33.5 }, { i: 9, x: 51, y: -33 }, { i: 9, x: 20, y: 0 }, { i: 9, x: -40, y: 10 }]) {
    const p = planCelebration(base({ scorer: { ...sc, skill: 70 } }));
    assert.ok(Math.abs(p.run.x) <= field.HW - 1 && Math.abs(p.run.y) <= field.HH - 1, JSON.stringify(p.run));
    const corner = [field.dir * field.HW, Math.sign(sc.y || 1) * field.HH];
    assert.ok(Math.hypot(p.run.x - corner[0], p.run.y - corner[1]) <= Math.hypot(sc.x - corner[0], sc.y - corner[1]) + 2, 'heads for the attacking corner (or stays within 2 m of where it already is)');
    assert.ok(Math.hypot(p.run.x - sc.x, p.run.y - sc.y) <= 30, 'short run');
  }
});

test('three to six teammates join, nearest first, arriving one after another', () => {
  const p = planCelebration(base());
  assert.ok(p.joiners.length >= 3 && p.joiners.length <= 6, `${p.joiners.length} joiners`);
  const d = j => { const m = mates(8).find(q => q.i === j.i); return Math.hypot(m.x - p.run.x, m.y - p.run.y); };
  for (let k = 1; k < p.joiners.length; k++) {
    assert.ok(d(p.joiners[k]) >= d(p.joiners[k - 1]) - 1e-9, 'nearest first');
    assert.ok(p.joiners[k].at > p.joiners[k - 1].at, 'staggered');
  }
});

test('few teammates: joiners never exceed who is there', () => {
  const p = planCelebration(base({ mates: mates(2) }));
  assert.equal(p.joiners.length, 2);
  assert.deepEqual(planCelebration(base({ mates: [] })).joiners, []);
});

test('the keeper and the nearest defenders react', () => {
  const p = planCelebration(base());
  const who = p.reactions.map(r => r.i);
  assert.ok(who.includes(30), 'keeper reacts'); assert.ok(who.includes(31) && who.includes(32), 'defenders react');
  assert.ok(!who.includes(33), 'a far midfielder does not');
});

test('timeline: the scorer runs, then does the move, then everyone walks back to their half', () => {
  const p = planCelebration(base());
  const pos = () => ({ x: 44, y: 6 });
  const s0 = celebrationAt(p, 0.2, pos).get(9);
  assert.ok(s0.spr && s0.clip === null, 'running first');
  assert.ok(Math.abs(s0.tx - p.run.x) < 1e-9 && Math.abs(s0.ty - p.run.y) < 1e-9);
  const tMove = p.runEnd + 0.2;
  assert.equal(celebrationAt(p, tMove, pos).get(9).clip, MOVES[p.move].clip);
  const end = celebrationAt(p, p.dur - 0.5, pos).get(9);
  assert.equal(end.clip, null); assert.ok(end.tx < p.run.x, 'walking back toward the own half');
  const j = p.joiners[0]; const js = celebrationAt(p, j.at + 0.1, pos).get(j.i);
  assert.ok(js.clip, 'a joiner plays its role once it arrives');
});

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('huggers stand around the scorer within arm\'s reach, nobody inside anybody else', () => {
  for (let s = 0; s < 60; s++) {
    const p = planCelebration(base({ seed: s }));
    const spots = [{ ...p.run, who: 'scorer' }, ...p.joiners.map(j => ({ ...j.slot, who: j.role }))];
    for (const j of p.joiners.filter(q => q.role === 'hug')) {
      assert.ok(Math.abs(dist(j.slot, p.run) - HUG_GAP) < 0.02, `seed ${s}: hugger ${dist(j.slot, p.run)} m from the scorer`);
      assert.equal(j.partner, p.scorer);
    }
    for (let a = 0; a < spots.length; a++) for (let b = a + 1; b < spots.length; b++) {
      const close = (spots[a].who === 'scorer' && spots[b].who === 'hug') ? 0.4 : 0.5;  // a hugger stands closest to the scorer
      assert.ok(dist(spots[a], spots[b]) >= close, `seed ${s}: ${spots[a].who} and ${spots[b].who} ${dist(spots[a], spots[b]).toFixed(2)} m apart`);
    }
    assert.equal(p.joiners[0].role, 'hug', 'the first to arrive hugs the scorer');
  }
});

test('high fives come in pairs that face each other and slap once both are there', () => {
  let pairs = 0;
  for (let s = 0; s < 60; s++) {
    const p = planCelebration(base({ seed: s })), fives = p.joiners.filter(j => j.role === 'five');
    assert.equal(fives.length % 2, 0, `seed ${s}: an odd high five`);
    for (const j of fives) {
      const o = p.joiners.find(q => q.i === j.partner);
      assert.ok(o && o.partner === j.i && o.role === 'five', 'partners point at each other');
      assert.ok(Math.abs(dist(j.slot, o.slot) - FIVE_GAP) < 0.02, `seed ${s}: pair ${dist(j.slot, o.slot)} m apart`);
      const first = Math.min(j.at, o.at), both = Math.max(j.at, o.at), pos = () => ({ x: 0, y: 0 });
      if (both - first > 0.1) assert.equal(celebrationAt(p, (first + both) / 2, pos).get(j.at < o.at ? j.i : o.i).clip, null, 'the first waits');
      const now = celebrationAt(p, both + 0.05, pos).get(j.i);
      assert.equal(now.clip, 'hand_slap'); assert.equal(now.partner, o.i); assert.equal(now.kind, 'five');
      assert.deepEqual(now.look, o.slot, 'faces the partner');
      pairs++;
    }
  }
  assert.ok(pairs > 10, `high fives happen (${pairs / 2} pairs in 60 goals)`);
});

test('the scorer holds the first hugger once he arrives', () => {
  const p = planCelebration(base()), h = p.joiners[0], pos = () => ({ x: 0, y: 0 });
  const t = Math.max(p.moveEnd, h.at) + 0.1;
  if (t < p.walkStart) {
    const s = celebrationAt(p, t, pos).get(p.scorer);
    assert.equal(s.clip, 'hug'); assert.equal(s.partner, h.i); assert.equal(s.kind, 'hold', 'arms around the back, under the hugger\'s'); assert.deepEqual(s.look, h.slot);
  }
  const hj = celebrationAt(p, h.at + 0.1, pos).get(h.i);
  assert.equal(hj.partner, p.scorer); assert.equal(hj.kind, 'hug');
});

test('a move picked during the run replaces the planned one; picked later, the scorer does it there and then', () => {
  const p = planCelebration(base({ seed: 3 })), pos = () => ({ x: 0, y: 0 });
  const early = pickMove(p, 1, p.runEnd / 2);
  assert.equal(early.move, KEY_MOVES[1]); assert.deepEqual(early.joiners, p.joiners, 'team-mates unchanged');
  assert.equal(early.moveEnd, +(early.runEnd + MOVES[KEY_MOVES[1]].dur).toFixed(2));  // (a knee slide also re-times the run)
  assert.equal(celebrationAt(early, early.runEnd + 0.1, pos).get(p.scorer).clip, KEY_MOVES[1]);
  const t = p.moveEnd + 0.5, late = pickMove(p, 5, t);
  assert.equal(celebrationAt(late, t + 0.1, pos).get(p.scorer).clip, KEY_MOVES[5], 'does it now');
  assert.ok(late.walkStart >= late.moveEnd && late.dur >= late.walkStart && late.dur <= 14, 'the timeline still fits');
  assert.equal(p.move, planCelebration(base({ seed: 3 })).move, 'the original plan is not changed');
  assert.equal(pickMove(p, 99, 1), p, 'an unknown key changes nothing');
});

test('a knee slide: the scorer sprints in without braking and the last metres are the slide', () => {
  const ks = planCelebration(base({ pick: 1 })), ch = planCelebration(base({ pick: 0 })), pos = () => ({ x: 44, y: 6 });
  assert.equal(ks.move, 'celebrate_knee_slide'); assert.equal(ks.slide, SLIDE);
  assert.ok(Math.abs((ch.runEnd - ks.runEnd) - SLIDE / 7) < 0.02, `run ends ${ks.runEnd} vs ${ch.runEnd}`);
  const run = celebrationAt(ks, ks.runEnd / 2, pos).get(ks.scorer);
  assert.ok(run.spr && run.carry, 'sprinting, not braking'); assert.ok(!celebrationAt(ch, ch.runEnd / 2, pos).get(ch.scorer).carry);
  const near = planCelebration(base({ pick: 1, scorer: { i: 9, x: 49, y: 29, skill: 70 } }));
  assert.equal(near.slide, 0, 'already by the flag: kneels where he is');
});

test('picking the knee slide during the run sets up the slide; picking something else takes it away', () => {
  const p = planCelebration(base({ pick: 0 })), ks = planCelebration(base({ pick: 1 })), pos = () => ({ x: 44, y: 6 });
  const k = pickMove(p, 1, 0.3);
  assert.equal(k.slide, SLIDE); assert.equal(k.runEnd, ks.runEnd);
  assert.ok(celebrationAt(k, 0.5, pos).get(k.scorer).carry);
  const back = pickMove(ks, 0, 0.3);
  assert.equal(back.slide, 0); assert.equal(back.runEnd, p.runEnd);
  assert.equal(pickMove(ks, 1, ks.runEnd + 1).slide, 0, 'picked once he has stopped: kneels where he is');
});

test('some run-offs are run with the arms spread like wings, decided by the seed', () => {
  const plans = Array.from({ length: 40 }, (_, s) => planCelebration(base({ seed: s }))), pos = () => ({ x: 44, y: 6 });
  const wings = plans.filter(p => p.wings).length;
  assert.ok(wings > 10 && wings < 35, `${wings} of 40`);
  for (const p of plans.slice(0, 6)) {
    assert.equal(!!celebrationAt(p, p.runEnd / 2, pos).get(p.scorer).wings, !!p.wings);
    assert.ok(!celebrationAt(p, p.runEnd + 0.2, pos).get(p.scorer).wings, 'only while running');
  }
  assert.equal(planCelebration(base({ seed: 5 })).wings, planCelebration(base({ seed: 5 })).wings);
});

test('the scorer turns to face the pitch (and the camera) for his move', () => {
  const p = planCelebration(base({ seed: 2 })), pos = () => ({ x: 44, y: 6 });
  const e = celebrationAt(p, p.runEnd + 0.3, pos).get(p.scorer);
  assert.ok(e.look, 'has a point to face');
  const inward = [-p.run.x, -p.run.y], to = [e.look.x - p.run.x, e.look.y - p.run.y];
  const cos = (inward[0] * to[0] + inward[1] * to[1]) / (Math.hypot(...inward) * Math.hypot(...to));
  assert.ok(cos > 0.9, `faces the pitch centre (cos ${cos.toFixed(2)})`);
});
