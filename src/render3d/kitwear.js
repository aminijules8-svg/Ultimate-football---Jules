// Kit wear over a match (Phase C): grass and mud where a player slides, dives or falls, and sweat that grows with the
// minutes and the running. Pure maths over the kit atlas layout (src/render3d/character.js ROWS, built by
// tools/blender/build_player_mh.py kit_uv: v from the bottom; torso and shorts wrap round the body with the front at
// u .25, the player's right side at .5, the back at .75 and the left side at 0/1). Character paints the result into its
// own kit texture. Tested by tests/kitwear.test.mjs.

export const ROWS_V = { torso: [0.5, 1], sleeves: [0.4, 0.5], shorts: [0.25, 0.4], socks: [0.15, 0.25] };
const SIDE_U = { front: 0.25, right: 0.5, back: 0.75, left: 0 };
/** u of a side of the body on the torso and shorts rows. */
export const sideU = side => SIDE_U[side] ?? 0.25;

function rng(seed) { let a = (seed * 2654435761 + 1013904223) >>> 0 || 1; return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296; }
const wrap = u => ((u % 1) + 1) % 1;

/** Where a contact marks the kit: kind 'slide' (side = the hip and leg on the ground), 'dive' (the side landed on) or
 *  'fall' (on the back). -> [{ part, key, u, v, ru, rv, a }], a = how strongly this contact marks (0..1). */
export function stainStamps(kind, side, seed = 0) {
  const R = rng(seed), j = s => (R() - 0.5) * s, out = [], add = (part, key, u, v, ru, rv, a) => out.push({ part, key: part + ':' + key, u: wrap(u + j(0.03)), v: v + j(0.01), ru, rv, a });
  if (kind === 'slide') {
    add('shorts', side, sideU(side), 0.295, 0.07, 0.035, 0.35);
    add('socks', side, side === 'left' ? 0 : 0.5, 0.188, 0.08, 0.022, 0.4);  // the outside of the sock low down (both socks share the row)
    add('torso', side, sideU(side), 0.56, 0.05, 0.04, 0.2);
  } else if (kind === 'dive') {
    add('torso', side, sideU(side), 0.72, 0.08, 0.12, 0.35);
    add('sleeves', side, 0.5, 0.45, 0.15, 0.035, 0.3);
    add('shorts', side, sideU(side), 0.33, 0.06, 0.04, 0.25);
  } else {  // fall
    add('torso', 'back', sideU('back'), 0.7, 0.1, 0.12, 0.25);
    add('shorts', 'back', sideU('back'), 0.33, 0.08, 0.04, 0.25);
  }
  return out;
}

/** Stain coverage per patch: each contact adds a share of what is still clean, up to CAP, so a muddy match never turns
 *  the kit brown. add() returns the stamps with `a` = the alpha actually left to paint. */
export class StainLog {
  constructor(cap = 0.8) { this.cap = cap; this.c = {}; }
  coverage(key) { return this.c[key] || 0; }
  add(stamps) {
    return stamps.map(s => { const c = this.coverage(s.key), a = Math.max(0, (this.cap - c) * s.a); this.c[s.key] = c + a; return { ...s, a }; });
  }
}

/** Sweat (0 dry .. 0.9 soaked through) after `minutes` of play with a workload `run` (0 walking .. 1 always sprinting). */
export function sweatLevel(minutes, run = 0.5) {
  return 0.9 * (1 - Math.exp(-(Math.max(0, minutes) / 45) * (0.5 + Math.max(0, Math.min(1, run)))));
}

/** Where sweat shows first on the shirt: chest, upper back and both armpits. */
export const SWEAT_ZONES = [
  { u: 0.25, v: 0.8, ru: 0.06, rv: 0.08 }, { u: 0.75, v: 0.78, ru: 0.08, rv: 0.12 },
  { u: 0.02, v: 0.9, ru: 0.035, rv: 0.04 }, { u: 0.5, v: 0.9, ru: 0.035, rv: 0.04 }];
