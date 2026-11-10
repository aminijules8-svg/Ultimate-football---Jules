// Fictional kit sponsors: 24 names with a simple logo mark each (ring, bolt, leaf, wave, star, hexagon, drop, peak),
// drawn once for the canvas kit atlas (`sponsorMark`) and once as SVG for the menu shirts (`sponsorSVG`).
export const SPONSORS = ['KIGALI AIR', 'MOUNTAIN COFFEE', 'UMUHIRE BANK', 'LIONS ENERGY', 'CAPITAL MOTORS', 'NYANZA DAIRY', 'AKAGERA TOURS', 'VOLCANO TELECOM', 'HORIZON FOODS', 'RED VALLEY TYRES', 'GOLDCOAST COCOA', 'IBERICA SOLAR', 'ALBION RAIL', 'NORDLAND FJORDS', 'PLATANIA BEEF', 'YAMATO ROBOTICS', 'OASIS WATER', 'RHEIN STAHL', 'PACIFIC PEARL', 'SAVANNA MOBILE', 'BLUE NILE INSURANCE', 'SUMMIT SPORTSWEAR', 'TIRRENA MARE', 'AMAZON VERDE'];
const MARKS = ['ring', 'bolt', 'leaf', 'wave', 'star', 'hex', 'drop', 'peak'];
const hash = s => { let h = 7; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
export const markOf = name => MARKS[hash(name) % MARKS.length];
const star = (cx, cy, r) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return pts; };
const hexp = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos(i * Math.PI / 3) * r, cy + Math.sin(i * Math.PI / 3) * r]);
const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z';

/** Canvas mark centred at (x, y) with radius r in colour c. */
export function sponsorMark(k, name, x, y, r, c) {
  const m = markOf(name); k.save(); k.fillStyle = c; k.strokeStyle = c; k.lineWidth = Math.max(1.5, r * .32); k.lineCap = 'round'; k.lineJoin = 'round';
  if (m === 'ring') { k.beginPath(); k.arc(x, y, r * .8, 0, Math.PI * 2); k.stroke(); k.beginPath(); k.arc(x, y, r * .3, 0, Math.PI * 2); k.fill(); }
  else if (m === 'bolt') { k.beginPath(); k.moveTo(x + r * .2, y - r); k.lineTo(x - r * .6, y + r * .15); k.lineTo(x, y + r * .15); k.lineTo(x - r * .2, y + r); k.lineTo(x + r * .6, y - r * .15); k.lineTo(x, y - r * .15); k.closePath(); k.fill(); }
  else if (m === 'leaf') { k.beginPath(); k.moveTo(x - r, y + r); k.quadraticCurveTo(x - r, y - r, x + r, y - r); k.quadraticCurveTo(x + r, y + r, x - r, y + r); k.fill(); }
  else if (m === 'wave') { k.beginPath(); k.moveTo(x - r, y); k.quadraticCurveTo(x - r * .5, y - r, x, y); k.quadraticCurveTo(x + r * .5, y + r, x + r, y); k.stroke(); }
  else if (m === 'star') { const p = star(x, y, r); k.beginPath(); p.forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b)); k.closePath(); k.fill(); }
  else if (m === 'hex') { const p = hexp(x, y, r * .9); k.beginPath(); p.forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b)); k.closePath(); k.stroke(); }
  else if (m === 'drop') { k.beginPath(); k.moveTo(x, y - r); k.quadraticCurveTo(x + r, y + r * .2, x, y + r); k.quadraticCurveTo(x - r, y + r * .2, x, y - r); k.fill(); }
  else { k.beginPath(); k.moveTo(x - r, y + r * .8); k.lineTo(x - r * .2, y - r); k.lineTo(x + r * .25, y); k.lineTo(x + r * .5, y - r * .4); k.lineTo(x + r, y + r * .8); k.closePath(); k.fill(); }
  k.restore();
}
/** SVG mark in a box of size s at (x, y) top-left. */
export function sponsorSVG(name, x, y, s, c) {
  const m = markOf(name), cx = x + s / 2, cy = y + s / 2, r = s / 2, sw = Math.max(1, s * .16);
  const st = `fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  if (m === 'ring') return `<circle cx="${cx}" cy="${cy}" r="${r * .8}" ${st}/><circle cx="${cx}" cy="${cy}" r="${r * .3}" fill="${c}"/>`;
  if (m === 'bolt') return `<path d="${poly([[cx + r * .2, cy - r], [cx - r * .6, cy + r * .15], [cx, cy + r * .15], [cx - r * .2, cy + r], [cx + r * .6, cy - r * .15], [cx, cy - r * .15]])}" fill="${c}"/>`;
  if (m === 'leaf') return `<path d="M${cx - r} ${cy + r} Q${cx - r} ${cy - r} ${cx + r} ${cy - r} Q${cx + r} ${cy + r} ${cx - r} ${cy + r}Z" fill="${c}"/>`;
  if (m === 'wave') return `<path d="M${cx - r} ${cy} Q${cx - r * .5} ${cy - r} ${cx} ${cy} Q${cx + r * .5} ${cy + r} ${cx + r} ${cy}" ${st}/>`;
  if (m === 'star') return `<path d="${poly(star(cx, cy, r))}" fill="${c}"/>`;
  if (m === 'hex') return `<path d="${poly(hexp(cx, cy, r * .9))}" ${st}/>`;
  if (m === 'drop') return `<path d="M${cx} ${cy - r} Q${cx + r} ${cy + r * .2} ${cx} ${cy + r} Q${cx - r} ${cy + r * .2} ${cx} ${cy - r}Z" fill="${c}"/>`;
  return `<path d="${poly([[cx - r, cy + r * .8], [cx - r * .2, cy - r], [cx + r * .25, cy], [cx + r * .5, cy - r * .4], [cx + r, cy + r * .8]])}" fill="${c}"/>`;
}
