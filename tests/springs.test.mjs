// tests/springs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { springStep } from '../src/render3d/springs.js';

test('a critically damped spring reaches the target without overshoot', () => {
  let s = { x: 0, v: 0 }, max = 0;
  for (let i = 0; i < 120; i++) { s = springStep(s, 1, 1 / 60); max = Math.max(max, s.x); }
  assert.ok(Math.abs(s.x - 1) < 0.01); assert.ok(max <= 1.0001);
});
test('a zero dt changes nothing', () => {
  assert.deepEqual(springStep({ x: 0.3, v: 2 }, 1, 0), { x: 0.3, v: 2 });
});

import * as THREE from 'three';
import { SpringSet } from '../src/render3d/springs.js';

test('a held pose is reached even when the mixer stops rewriting the bone', () => {
  const bone = new THREE.Bone();
  const set = new SpringSet({ Arm: bone }, ['Arm'], 0.4, 5);
  set.apply(1 / 60);                                           // settle on the rest pose
  const target = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 1.2);
  bone.quaternion.copy(target);                                // the mixer writes the new pose once, then holds it
  for (let i = 0; i < 180; i++) set.apply(1 / 60);              // three seconds, no further writes from the mixer
  assert.ok(bone.quaternion.angleTo(target) < 0.01, `stuck ${bone.quaternion.angleTo(target).toFixed(3)} rad short`);
});

test('the bone lags behind a sudden change for a moment', () => {
  const bone = new THREE.Bone();
  const set = new SpringSet({ Arm: bone }, ['Arm'], 0.4, 5);
  set.apply(1 / 60);
  const target = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 1.2);
  bone.quaternion.copy(target); set.apply(1 / 60);
  const lag = bone.quaternion.angleTo(target);
  assert.ok(lag > 0.1 && lag < 1.2, `lag ${lag.toFixed(3)}`);
});
