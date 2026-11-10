// tests/kitwear.test.mjs — where grass and mud land on the kit atlas, how stains build up, and how sweat grows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROWS_V, stainStamps, StainLog, sweatLevel, SWEAT_ZONES, sideU } from '../src/render3d/kitwear.js';

const inRow = (s, row) => s.v - s.rv >= ROWS_V[row][0] - 1e-9 && s.v + s.rv <= ROWS_V[row][1] + 1e-9;

test('a slide marks the shorts, the sock and the shirt hem on the side that touches the ground', () => {
  for (const side of ['left', 'right']) {
    const st = stainStamps('slide', side, 1);
    assert.ok(st.some(s => s.part === 'shorts' && inRow(s, 'shorts')), 'shorts');
    assert.ok(st.some(s => s.part === 'socks' && inRow(s, 'socks')), 'sock');
    for (const s of st.filter(q => q.part === 'shorts' || q.part === 'torso')) {
      const du = Math.min(Math.abs(s.u - sideU(side)), 1 - Math.abs(s.u - sideU(side)));
      assert.ok(du < 0.12, `${side} slide stains its own side (u ${s.u} vs ${sideU(side)})`);
    }
  }
  assert.ok(Math.abs(sideU('left') - sideU('right')) > 0.4, 'left and right are on opposite sides');
});

test('a keeper dive marks the shirt side and the sleeve; a fall marks the back', () => {
  const dive = stainStamps('dive', 'right', 2);
  assert.ok(dive.some(s => s.part === 'torso' && inRow(s, 'torso')) && dive.some(s => s.part === 'sleeves' && inRow(s, 'sleeves')));
  const fall = stainStamps('fall', 'left', 3);
  assert.ok(fall.every(s => s.part !== 'torso' || Math.abs(s.u - sideU('back')) < 0.15), 'the back of the shirt');
});

test('stains build up but never cover the kit: repeated slides in one place converge', () => {
  const log = new StainLog();
  let last = 0;
  for (let i = 0; i < 60; i++) { const a = log.add(stainStamps('slide', 'left', i)); last = log.coverage('shorts:left'); assert.ok(a.every(s => s.a >= 0)); }
  assert.ok(last <= 0.8, `coverage capped (${last})`);
  const fresh = new StainLog(); fresh.add(stainStamps('slide', 'left', 0));
  assert.ok(fresh.coverage('shorts:left') > 0.15, 'one slide shows');
  const late = log.add(stainStamps('slide', 'left', 99));
  assert.ok(late.every(s => s.a < 0.02), 'nothing more to add once capped');
});

test('sweat grows with minutes and running, and stays below soaked', () => {
  let prev = -1;
  for (let m = 0; m <= 120; m += 10) { const s = sweatLevel(m, 0.5); assert.ok(s >= prev); prev = s; }
  assert.equal(sweatLevel(0, 1), 0);
  assert.ok(sweatLevel(45, 1) > sweatLevel(45, 0.2), 'more running, more sweat');
  assert.ok(sweatLevel(500, 1) <= 0.9);
  assert.ok(SWEAT_ZONES.length >= 3 && SWEAT_ZONES.every(z => inRow(z, 'torso')), 'chest, back and armpits on the shirt');
});
