// Corrective shapes: the runtime measures each joint the way the Blender bake posed it — the child bone's swing away from
// its bind pose around the bake's own axis, in the parent bone's space — so a baked pose drives its shape at weight 1
// and swings in other directions (or a body lying down) do not.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { correctiveWeights, jointAngles, makeJointRig, CORRECTIVES } from '../src/render3d/correctives.js';

test('straight joints switch every corrective off', () => {
  const zero = {}; for (const j of Object.keys(CORRECTIVES)) for (const s of ['L', 'R']) zero[`${j}_${s}`] = 0;
  assert.ok(Object.values(correctiveWeights(zero)).every(v => v === 0));
});
test('a keyed angle is that shape at full weight; between keys blends the two', () => {
  assert.equal(correctiveWeights({ elbow_L: 45 }).corr_elbow_L_45, 1);
  const w = correctiveWeights({ elbow_L: 65 });
  assert.ok(Math.abs(w.corr_elbow_L_45 - 0.5) < 1e-9 && Math.abs(w.corr_elbow_L_85 - 0.5) < 1e-9);
});
test('weights stay within 0..1 past the last key', () => {
  const w = correctiveWeights({ knee_R: 170 });
  assert.equal(w.corr_knee_R_140, 1); assert.equal(w.corr_knee_R_90, 0);
});

// A small model-space skeleton in glTF axes (+Y up, +Z forward): hips, left leg, left arm with a bent bind elbow.
function skeleton() {
  const model = new THREE.Group(), B = {};
  const mk = (name, parent, pos) => { const b = new THREE.Bone(); b.name = name; b.position.set(...pos); parent.add(b); B[name] = b; return b; };
  const hips = mk('Hips', model, [0, 1, 0]);
  const up = mk('LeftUpLeg', hips, [0.1, -0.05, 0]); const leg = mk('LeftLeg', up, [0, -0.45, 0]); mk('LeftFoot', leg, [0, -0.42, 0]);
  const sh = mk('LeftShoulder', hips, [0.05, 0.45, 0]); const arm = mk('LeftArm', sh, [0.12, 0, 0]);
  arm.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(-45));      // A-pose: arm 45 deg down
  const fore = mk('LeftForeArm', arm, [0.28, 0, 0]);
  fore.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-46.5));   // bind elbow already bent
  mk('LeftHand', fore, [0.25, 0, 0]);
  model.updateMatrixWorld(true);
  return { model, B };
}
// the bake: turn `bone` by `deg` in model space toward `toward` (model-space direction), about its own head
function bakePose(model, bone, child, deg, toward) {
  model.updateMatrixWorld(true);
  const head = bone.getWorldPosition(new THREE.Vector3()), tail = child.getWorldPosition(new THREE.Vector3());
  const dir = tail.sub(head).normalize(), axis = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(...toward)).normalize();
  const rw = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(deg));
  const pw = bone.parent.getWorldQuaternion(new THREE.Quaternion()), bw = bone.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(pw.invert().multiply(rw).multiply(bw)); model.updateMatrixWorld(true);
}

test('every bake pose reads back as its own angle', () => {
  for (const [joint, bone, child, deg, toward] of [['elbow', 'LeftForeArm', 'LeftHand', 45, [0, 0, 1]], ['elbow', 'LeftForeArm', 'LeftHand', 85, [0, 0, 1]],
    ['knee', 'LeftLeg', 'LeftFoot', 90, [0, 0, -1]], ['knee', 'LeftLeg', 'LeftFoot', 140, [0, 0, -1]],
    ['shoulder', 'LeftArm', 'LeftForeArm', 90, [0, 1, 0]], ['hip', 'LeftUpLeg', 'LeftLeg', 90, [0, 0, 1]]]) {
    const { model, B } = skeleton(); const rig = makeJointRig(B, model);
    bakePose(model, B[bone], B[child], deg, toward);
    const a = jointAngles(rig)[`${joint}_L`];
    assert.ok(Math.abs(a - deg) < 0.5, `${joint} ${deg}: read ${a.toFixed(2)}`);
    assert.ok(Math.abs(correctiveWeights({ [`${joint}_L`]: a })[`corr_${joint}_L_${deg}`] - 1) < 0.02);
  }
});

test('the bind pose reads zero everywhere', () => {
  const { model, B } = skeleton(); const a = jointAngles(makeJointRig(B, model));
  for (const v of Object.values(a)) assert.ok(Math.abs(v) < 1e-6, JSON.stringify(a));
});

test('a forward arm swing does not count as a sideways raise; a body lying down changes nothing', () => {
  const { model, B } = skeleton(); const rig = makeJointRig(B, model);
  bakePose(model, B.LeftArm, B.LeftForeArm, 60, [0, 0, 1]);                       // swing forward 60 deg
  assert.ok(jointAngles(rig).shoulder_L < 12, `forward swing read ${jointAngles(rig).shoulder_L.toFixed(1)}`);
  const { model: m2, B: B2 } = skeleton(); const rig2 = makeJointRig(B2, m2);
  m2.rotation.x = -Math.PI / 2; m2.updateMatrixWorld(true);                       // the whole player lying on his back
  for (const v of Object.values(jointAngles(rig2))) assert.ok(Math.abs(v) < 1e-6);
});
