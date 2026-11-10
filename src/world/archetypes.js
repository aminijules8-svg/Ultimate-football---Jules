// 15 footballer body archetypes. Each blends the model's morph targets (slim / heavy / muscular plus the body
// shapes baked in tools/blender/build_player_mh.py BODYM) and sets a default height. The editor's sliders still
// adjust height, build and arm length on top. archFor() picks one for a generated player from position,
// attributes and age so squads vary naturally.
export const ARCH = [
  { n: 'Lean winger', d: 'Tall and slight, narrow waist, agile', h: .72, w: { slim: .5, b_narrow: .4, b_long: .2 } },
  { n: 'Compact playmaker', d: 'Low centre of gravity, lean-muscular core', h: .25, w: { slim: .2, muscular: .2, b_legs: .3 } },
  { n: 'Power target man', d: 'Tall, broad chest and shoulders', h: .82, w: { b_broad: .7, b_vshape: .4, muscular: .3, b_arms: .3 } },
  { n: 'Box-to-box midfielder', d: 'Balanced height, proportional muscle', h: .52, w: { muscular: .25, b_vshape: .3 } },
  { n: 'Defensive anchor', d: 'Stout, broad ribcage, powerful thighs', h: .45, w: { b_broad: .5, b_legs: .6, heavy: .15 } },
  { n: 'Towering centre-back', d: 'Very tall, rangy shoulders, long torso', h: .96, w: { b_long: .6, b_vshape: .3, slim: .15 } },
  { n: 'Stocky centre-back', d: 'Thick neck, wide torso, compact', h: .4, w: { b_broad: .6, b_neck: .6, heavy: .3, b_legs: .4 } },
  { n: 'Athletic sweeper-keeper', d: 'Tall, long limbs, broad span, lean', h: .86, w: { b_long: .4, b_vshape: .4, slim: .2, b_arms: .2 } },
  { n: 'Heavyweight keeper', d: 'Maximum shoulder width, thick frame', h: .9, w: { b_broad: .9, heavy: .35, b_arms: .4, b_neck: .4 } },
  { n: 'Explosive full-back', d: 'Muscular legs and glutes, streamlined top', h: .45, w: { b_legs: .7, b_glutes: .6, b_narrow: .3 } },
  { n: 'Tall deep-lying playmaker', d: 'Rangy, slender torso and arms', h: .8, w: { slim: .4, b_long: .5, b_narrow: .3 } },
  { n: 'Wiry poacher', d: 'Lightweight, narrow chest, quick turns', h: .45, w: { slim: .6, b_narrow: .5 } },
  { n: 'Bulky veteran forward', d: 'Heavier torso and waist, strong', h: .6, w: { heavy: .5, b_belly: .5, b_broad: .3 } },
  { n: 'Slender academy prospect', d: 'Ectomorph, narrow ribcage and limbs', h: .55, w: { slim: .7, b_narrow: .6 } },
  { n: 'Classic mesomorph', d: 'V-taper back, proportional chest and arms', h: .55, w: { b_vshape: .7, muscular: .3, b_arms: .2 } },
];
/** Archetype index for a world player: position first, then attributes and age break ties. */
export function archFor(pos, attrs = {}, age = 25, seed = 0) {
  const a = k => attrs[k] == null ? 60 : attrs[k], r = (seed * 9301 + 49297) % 233280 / 233280;
  if (pos === 'GK') return a('dive') >= 70 && a('pace') >= 55 ? 7 : 8;
  if (pos === 'CB') return a('pace') >= 68 || r < .35 ? 5 : 6;
  if (['RB', 'LB', 'RWB', 'LWB'].includes(pos)) return r < .7 ? 9 : 3;
  if (pos === 'DMF') return a('pass') >= 70 ? 10 : 4;
  if (pos === 'CM') return a('pace') >= 70 ? 3 : a('pass') >= 72 ? 10 : r < .5 ? 1 : 14;
  if (pos === 'CAM') return r < .5 ? 1 : 14;
  if (['RM', 'LM', 'RW', 'LW'].includes(pos)) return r < .6 ? 0 : a('pow') >= 68 ? 14 : 13;
  if (pos === 'CF') return age >= 31 ? 12 : a('pow') >= 70 ? 2 : 14;
  return age >= 31 && a('pow') >= 65 ? 12 : a('pow') >= 72 ? 2 : age <= 20 ? 13 : r < .5 ? 11 : 14;  // ST
}
