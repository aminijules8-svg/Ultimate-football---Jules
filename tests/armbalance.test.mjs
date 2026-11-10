// The arm on the outside of a cut lifts away from the body; the inside arm stays as animated.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Character } from '../src/render3d/character.js';

test('turning toward +X lifts the right (outside) arm outward and leaves the left arm', () => {
  const model = new THREE.Group(), B = {};
  const mk = (name, parent, pos) => { const b = new THREE.Bone(); b.name = name; b.position.set(...pos); parent.add(b); B[name] = b; return b; };
  const hips = mk('Hips', model, [0, 1, 0]);
  const la = mk('LeftArm', hips, [0.2, 0.5, 0]), ra = mk('RightArm', hips, [-0.2, 0.5, 0]);  // facing +Z: left side is +X
  mk('LeftForeArm', la, [0, -0.3, 0]); mk('RightForeArm', ra, [0, -0.3, 0]);
  const me = { bones: B, model, lean: 0.2, fwPrev: null };
  const elbow = n => { model.updateMatrixWorld(true); return B[n].getWorldPosition(new THREE.Vector3()); };
  const before = { L: elbow('LeftForeArm'), R: elbow('RightForeArm') };
  for (let i = 0; i <= 8; i++) {  // facing turns a little toward +X each frame; arms restored to the animated pose first
    la.quaternion.identity(); ra.quaternion.identity();
    const a = i * 0.05; Character.prototype.armBalance.call(me, [0, 0, Math.sin(a), Math.cos(a)]);
  }
  const after = { L: elbow('LeftForeArm'), R: elbow('RightForeArm') };
  assert.ok(after.L.distanceTo(before.L) < 1e-6, 'inside arm moved');
  assert.ok(after.R.x < before.R.x - 0.03, `outside elbow x ${before.R.x.toFixed(3)} -> ${after.R.x.toFixed(3)}`);
  assert.ok(after.R.y > before.R.y, 'outside elbow should rise');
});
