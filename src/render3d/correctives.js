// Pose-space corrective shapes: joint angles -> weights for the corr_* morph targets baked by the Blender build
// (tools/blender/correctives.py). Linear-blend skinning loses volume at bent elbows and knees, raised shoulders and flexed
// hips; these shapes put it back. Each joint is measured exactly the way the bake posed it: the child bone's swing away
// from its bind pose around the bake's own axis, in the parent bone's space. So a baked pose drives its shape at full
// weight, swings in other directions barely count, and the measurement does not care how the body lies in the world.
import * as THREE from 'three';

// degrees beyond the bind pose at which each shape was baked (the bind elbow is already bent ~46 degrees, so the elbow
// keys sit at about 91 and 131 degrees of real flexion)
export const CORRECTIVES = { elbow: [45, 85], knee: [90, 140], shoulder: [90], hip: [90] };
// joint -> [parent, child, grandchild, direction the bake turned the child toward, in model space (glTF: +Y up, +Z forward)]
const JOINTS = {
  elbow: ['Arm', 'ForeArm', 'Hand', [0, 0, 1]],
  knee: ['UpLeg', 'Leg', 'Foot', [0, 0, -1]],
  shoulder: ['Shoulder', 'Arm', 'ForeArm', [0, 1, 0]],
  hip: [null, 'UpLeg', 'Leg', [0, 0, 1]],  // parent: Hips
};
const SIDES = [['Left', 'L'], ['Right', 'R']];

/** angles: { elbow_L: deg, … } -> { corr_elbow_L_45: w, … }; piecewise-linear between the keyed angles, clamped. */
export function correctiveWeights(angles) {
  const out = {};
  for (const [joint, keys] of Object.entries(CORRECTIVES)) for (const [, s] of SIDES) {
    const a = Math.max(0, angles[`${joint}_${s}`] || 0);
    keys.forEach(k => { out[`corr_${joint}_${s}_${k}`] = 0; });
    if (a <= 0) continue;
    if (a <= keys[0]) { out[`corr_${joint}_${s}_${keys[0]}`] = a / keys[0]; continue; }
    let done = false;
    for (let i = 0; i < keys.length - 1; i++) if (a <= keys[i + 1]) {
      const t = (a - keys[i]) / (keys[i + 1] - keys[i]);
      out[`corr_${joint}_${s}_${keys[i]}`] = 1 - t; out[`corr_${joint}_${s}_${keys[i + 1]}`] = t; done = true; break;
    }
    if (!done) out[`corr_${joint}_${s}_${keys[keys.length - 1]}`] = 1;
  }
  return out;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Vector3();

/** Reads the bind pose once (call at construction, before any animation). bones: Character.bones; model: the glTF root. */
export function makeJointRig(B, model) {
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), rig = [];
  for (const [joint, [par, ch, gc, toward]] of Object.entries(JOINTS)) for (const [S, s] of SIDES) {
    const c = B[S + ch], g = B[S + gc], p = par ? B[S + par] : B.Hips;
    if (!c || !g || !p) continue;
    const v0 = g.position.clone().applyQuaternion(c.quaternion).normalize();               // child direction in parent space
    _m.multiplyMatrices(inv, p.matrixWorld); _q.setFromRotationMatrix(_m);                  // parent rotation in model space
    const t = new THREE.Vector3(...toward).applyQuaternion(_q.clone().invert());            // bake direction in parent space
    const k = new THREE.Vector3().crossVectors(v0, t).normalize();                          // the bake's rotation axis
    rig.push({ key: `${joint}_${s}`, c, g, v0, k, w: new THREE.Vector3().crossVectors(k, v0) });  // (v0, w) span the bake plane
  }
  return rig;
}

/** Degrees each joint has turned from its bind pose around its bake axis (never below 0). Local maths only: no world matrices. */
export function jointAngles(rig) {
  const out = {};
  for (const j of rig) {
    _v.copy(j.g.position).applyQuaternion(j.c.quaternion).normalize();
    const x = _v.dot(j.v0), y = _v.dot(j.w);                     // the direction projected into the bake plane
    out[j.key] = Math.max(0, THREE.MathUtils.radToDeg(Math.atan2(y, x)));
  }
  return out;
}

/** Writes the weights into every LOD0 body mesh that has the corr_* targets. */
export function applyCorrectives(meshes, weights) {
  for (const m of meshes) {
    const dict = m.morphTargetDictionary; if (!dict) continue;
    for (const k in weights) { const i = dict[k]; if (i != null) m.morphTargetInfluences[i] = weights[k]; }
  }
}
