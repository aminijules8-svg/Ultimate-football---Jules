// Two-bone IK shared by the legs (foot locking, kick reach) and the arms (celebration contact: hands on a team-mate's
// shoulders, a high five). Works on posed three.js bones in world space; tested by tests/reach.test.mjs.
import * as THREE from 'three';

const _u = new THREE.Vector3(), _p = new THREE.Vector3(), _k2 = new THREE.Vector3(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _k3 = new THREE.Vector3(), _a3 = new THREE.Vector3();
const _qf = new THREE.Quaternion(), _qd = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qp = new THREE.Quaternion();
const _r1 = new THREE.Vector3(), _r2 = new THREE.Vector3(), _r3 = new THREE.Vector3(), _rt = new THREE.Vector3();

/** Rotate `bone` in world space so the direction `from` (from the bone's head) becomes `to`. */
export function aimBone(bone, from, to) {
  if (from.lengthSq() < 1e-8 || to.lengthSq() < 1e-8) return;
  _qd.setFromUnitVectors(from.normalize(), to.normalize());
  bone.getWorldQuaternion(_qw); _qw.premultiply(_qd); bone.parent.getWorldQuaternion(_qp); bone.quaternion.copy(_qp.invert().multiply(_qw));
}

/** Analytic two-bone IK: move the end joint (ankle / wrist) to `tgt` with the middle joint staying in its current bend
 *  plane; the end bone keeps its world orientation. hip/knee/ank are the chain's current world joint positions. */
export function twoBone(up, lg, ft, hip, knee, ank, tgt) {
  const L1 = hip.distanceTo(knee), L2 = knee.distanceTo(ank); if (L1 < 1e-4 || L2 < 1e-4) return;
  ft.getWorldQuaternion(_qf);
  _u.subVectors(tgt, hip); let D = _u.length(); if (D < 1e-4) return; _u.divideScalar(D);
  D = Math.max(Math.abs(L1 - L2) + 1e-3, Math.min(L1 + L2 - 1e-3, D));
  _p.subVectors(knee, hip); _p.addScaledVector(_u, -_p.dot(_u)); if (_p.lengthSq() < 1e-6) _p.set(0, 0, 1).addScaledVector(_u, -_u.z); _p.normalize();
  const ca = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
  _k2.copy(hip).addScaledVector(_u, L1 * ca).addScaledVector(_p, L1 * sa);
  aimBone(up, _v1.subVectors(knee, hip), _v2.subVectors(_k2, hip)); up.updateWorldMatrix(false, true);
  lg.getWorldPosition(_k3); ft.getWorldPosition(_a3);
  aimBone(lg, _v1.subVectors(_a3, _k3), _v2.subVectors(tgt, _k3)); lg.updateWorldMatrix(false, true);
  lg.getWorldQuaternion(_qp); ft.quaternion.copy(_qp.invert().multiply(_qf)); ft.updateWorldMatrix(false, true);
}

/** Pull the wrist of an arm chain (upper arm, forearm, hand) toward `tgt` by weight w (0..1). Returns the wrist's
 *  distance to `tgt` afterwards (at w = 1: 0 when in reach, else how far short the straight arm stays). */
export function reachHand(arm, fore, hand, tgt, w = 1) {
  arm.updateWorldMatrix(true, true);
  arm.getWorldPosition(_r1); fore.getWorldPosition(_r2); hand.getWorldPosition(_r3);
  if (w > 0) { _rt.copy(_r3).lerp(tgt, Math.min(1, w)); twoBone(arm, fore, hand, _r1, _r2, _r3, _rt); hand.getWorldPosition(_r3); }
  return _r3.distanceTo(tgt);
}

/** Where a wrist goes on a team-mate's shoulder joint `shoulder` when hugging from `me` (my body position): `past` metres
 *  beyond the joint toward the team-mate's back and `up` above it (defaults: on top of the shoulder; under the arms is
 *  past -0.04, up -0.16: on the sides, under the arms). */
export function shoulderTarget(shoulder, me, out, past = 0.05, up = 0.06) {
  _v1.set(shoulder.x - me.x, 0, shoulder.z - me.z); if (_v1.lengthSq() > 1e-8) _v1.normalize();
  return out.copy(shoulder).addScaledVector(_v1, past).setY(shoulder.y + up);
}

/** The slap point of a high five between the slapping arms' shoulder joints a and b: half way, at head height (where the
 *  captured slap is). Symmetric, so both players aim at the same point. */
export function fivePoint(a, b, out) {
  return out.addVectors(a, b).multiplyScalar(0.5).setY(Math.max(a.y, b.y) + 0.32);
}
