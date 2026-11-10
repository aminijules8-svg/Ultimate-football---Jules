// Small follow-through: selected bones trail their animated rotation through a critically damped spring.
import * as THREE from 'three';

/** One axis of a critically damped spring (semi-implicit Euler). freq in Hz; damp 1 = critical. */
export function springStep(s, target, dt, freq = 6, damp = 1) {
  if (dt <= 0) return { x: s.x, v: s.v };
  const w = 2 * Math.PI * freq, k = w * w, c = 2 * damp * w;
  const v = s.v + (k * (target - s.x) - c * s.v) * dt;
  return { x: s.x + v * dt, v };
}

const _q = new THREE.Quaternion();
export class SpringSet {
  /** bones: Character.bones; names: bone keys; amount: how far the lagged pose is blended in (0..1). */
  constructor(bones, names, amount = 0.35, freq = 5) {
    this.items = names.filter(n => bones[n]).map(n => ({ b: bones[n], q: null, v: new THREE.Vector4() }));
    this.amount = amount; this.freq = freq;
  }
  reset() { for (const it of this.items) { it.q = null; it.out = null; } }
  apply(dt) {
    for (const it of this.items) {
      // three's mixer only rewrites a bone when its animated value changes: if the bone still holds what we wrote last
      // frame, the animated pose is the one we saw before, not our lagged output (else a held pose is never reached)
      if (!it.out || !it.b.quaternion.equals(it.out)) (it.anim = it.anim || new THREE.Quaternion()).copy(it.b.quaternion);
      const target = it.anim;
      if (!it.q || dt <= 0 || dt > 0.1) { it.q = target.clone(); it.v.set(0, 0, 0, 0); it.out = null; continue; }
      if (it.q.dot(target) < 0) { it.q.set(-it.q.x, -it.q.y, -it.q.z, -it.q.w); }
      for (const [k, i] of [['x', 0], ['y', 1], ['z', 2], ['w', 3]]) {
        const s = springStep({ x: it.q[k], v: it.v.getComponent(i) }, target[k], dt, this.freq);
        it.q[k] = s.x; it.v.setComponent(i, s.v);
      }
      it.q.normalize();
      _q.copy(target).slerp(it.q, this.amount); it.b.quaternion.copy(_q);
      (it.out = it.out || new THREE.Quaternion()).copy(it.b.quaternion);
    }
  }
}
