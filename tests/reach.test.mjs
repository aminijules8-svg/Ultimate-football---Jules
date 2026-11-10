// tests/reach.test.mjs — two-bone IK for arms (celebration contact) and legs (foot locking, kick reach).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { twoBone, reachHand, shoulderTarget, fivePoint } from '../src/render3d/reach.js';

function armChain() {  // a right arm hanging out to the side, elbow slightly bent, as in an A-pose
  const root = new THREE.Bone(), up = new THREE.Bone(), fore = new THREE.Bone(), hand = new THREE.Bone();
  root.position.set(0, 1.42, 0); up.position.set(-0.18, 0, 0); fore.position.set(-0.2, -0.2, 0.02); hand.position.set(-0.17, -0.19, 0);
  root.add(up); up.add(fore); fore.add(hand); root.updateMatrixWorld(true);
  return { root, up, fore, hand };
}
const wp = b => b.getWorldPosition(new THREE.Vector3());

test('the hand reaches a target within reach (within 3 cm) and the hand keeps its world orientation', () => {
  const { up, fore, hand } = armChain(), q0 = hand.getWorldQuaternion(new THREE.Quaternion());
  for (const t of [[-0.25, 1.55, 0.35], [-0.05, 1.7, 0.3], [-0.45, 1.2, 0.1]]) {
    const tgt = new THREE.Vector3(...t), gap = reachHand(up, fore, hand, tgt, 1);
    assert.ok(gap < 0.03 && wp(hand).distanceTo(tgt) < 0.03, `target ${t}: hand ${wp(hand).distanceTo(tgt).toFixed(3)} m away`);
    assert.ok(hand.getWorldQuaternion(new THREE.Quaternion()).angleTo(q0) < 1e-3, 'hand orientation kept');
  }
});

test('half weight moves the hand about half way', () => {
  const { up, fore, hand } = armChain(), start = wp(hand), tgt = new THREE.Vector3(-0.2, 1.6, 0.35);
  reachHand(up, fore, hand, tgt, 0.5);
  const moved = wp(hand).distanceTo(start), whole = start.distanceTo(tgt);
  assert.ok(moved > 0.35 * whole && moved < 0.65 * whole, `moved ${moved.toFixed(3)} of ${whole.toFixed(3)}`);
});

test('a target out of reach straightens the arm toward it without breaking the chain', () => {
  const { up, fore, hand } = armChain(), tgt = new THREE.Vector3(-1.5, 1.6, 0.4);
  const gap = reachHand(up, fore, hand, tgt, 1);
  const L = wp(up).distanceTo(wp(fore)) + wp(fore).distanceTo(wp(hand));
  assert.ok(Number.isFinite(gap) && Math.abs(gap - (wp(up).distanceTo(tgt) - L)) < 0.01, `gap ${gap}`);
  for (const b of [up, fore, hand]) assert.ok(b.quaternion.toArray().every(Number.isFinite));
});

test('a shoulder target sits on top of the shoulder, slightly toward the partner\'s back', () => {
  const me = new THREE.Vector3(0, 0, 0), shoulder = new THREE.Vector3(0.2, 1.42, 0.55);
  const t = shoulderTarget(shoulder, me, new THREE.Vector3());
  assert.ok(t.y > shoulder.y + 0.03 && t.y < shoulder.y + 0.1, 'on top');
  assert.ok(t.z > shoulder.z, 'on the far side from me');
});

test('both players of a high five aim at the same point between them, at head height', () => {
  const a = new THREE.Vector3(-0.2, 1.42, 0), b = new THREE.Vector3(0.6, 1.40, 0.1);
  const p = fivePoint(a, b, new THREE.Vector3()), q = fivePoint(b, a, new THREE.Vector3());
  assert.ok(p.distanceTo(q) < 1e-9, 'same point from either side');
  assert.ok(p.y > 1.65 && p.y < 1.9, `height ${p.y}`);
});
