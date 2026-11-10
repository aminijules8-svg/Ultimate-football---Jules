// Boots catalogue: 9 fictional brands × 6 lines = 54 designs, every one painted into the boots row of the kit
// atlas by `paintBoots` (toe at low u, heel at high u, ankle at the top of the row, sole at the bottom; the
// stud patch sits at u < .1, the sock collar at u .83–.865 and the lace/tongue strip at u > .865 — see
// tools/blender/build_player_mh.py kit_uv). `finish` drives roughness / metalness through the kit's ORM map,
// `sole` only changes the painted stud look (the stud geometry is shared). `bootThumb` draws the 2D catalogue card.
const BRANDS = [
  { id: 'velox', n: 'Velox', mark: 'flash', pal: ['#e11d48', '#38bdf8', '#111827', '#f8fafc', '#facc15'] },
  { id: 'kestrel', n: 'Kestrel', mark: 'chevron', pal: ['#1d4ed8', '#f97316', '#0a0a0a', '#f8fafc', '#22c55e'] },
  { id: 'orbita', n: 'Orbita', mark: 'stripe', pal: ['#7c3aed', '#f8fafc', '#111827', '#ec4899', '#14b8a6'] },
  { id: 'nordfeld', n: 'Nordfeld', mark: 'split', pal: ['#0f172a', '#e2e8f0', '#dc2626', '#94a3b8', '#fde047'] },
  { id: 'savann', n: 'Savann', mark: 'wave', pal: ['#16a34a', '#fbbf24', '#1c1917', '#f8fafc', '#c2410c'] },
  { id: 'tempest', n: 'Tempest', mark: 'diag', pal: ['#06b6d4', '#111827', '#f8fafc', '#a3e635', '#f43f5e'] },
  { id: 'lumo', n: 'Lumo', mark: 'speckle', pal: ['#f59e0b', '#111827', '#fdf4ff', '#d946ef', '#0284c7'] },
  { id: 'atlas', n: 'Atlas', mark: 'toe', pal: ['#b91c1c', '#f8fafc', '#1e293b', '#0d9488', '#fcd34d'] },
  { id: 'rook', n: 'Rook', mark: 'check', pal: ['#111827', '#f8fafc', '#ef4444', '#3b82f6', '#a16207'] },
];
// one entry per line: which palette slots become base / accent / sole, the pattern ('mark' = the brand's own), finish, studs
const LINES = [
  { id: 'speed', n: 'Speed', d: 'Lightweight, the brand mark across the upper', c: [0, 1, 2], pattern: 'mark', finish: 'gloss', sole: 'bladed' },
  { id: 'control', n: 'Control', d: 'Textured upper, contrast laces and collar', c: [2, 0, 1], pattern: 'laces', finish: 'matte', sole: 'conical' },
  { id: 'classic', n: 'Classic', d: 'Leather look with the side stripe', c: [3, 2, 2], pattern: 'stripe', finish: 'matte', sole: 'conical' },
  { id: 'power', n: 'Power', d: 'Bold soleplate and a plain upper', c: [0, 4, 1], pattern: 'sole', finish: 'matte', sole: 'mixed' },
  { id: 'night', n: 'Night', d: 'Blackout upper, metallic finish, brand mark in colour', c: [null, 0, null], pattern: 'mark', finish: 'metal', sole: 'bladed' },
  { id: 'flash', n: 'Flash', d: 'Two-colour fade with a white sole', c: [4, 3, null], pattern: 'gradient', finish: 'gloss', sole: 'mixed' },
];
const FINISH = { matte: { rough: .82, metal: 0 }, gloss: { rough: .38, metal: 0 }, metal: { rough: .34, metal: .65 } };
const COLOUR_NAMES = { '#e11d48': 'Crimson', '#38bdf8': 'Sky', '#111827': 'Ink', '#f8fafc': 'White', '#facc15': 'Gold', '#1d4ed8': 'Royal', '#f97316': 'Tangerine', '#0a0a0a': 'Black', '#22c55e': 'Lime', '#7c3aed': 'Violet', '#ec4899': 'Rose', '#14b8a6': 'Teal', '#0f172a': 'Midnight', '#e2e8f0': 'Frost', '#dc2626': 'Red', '#94a3b8': 'Steel', '#fde047': 'Lemon', '#16a34a': 'Green', '#fbbf24': 'Amber', '#c2410c': 'Rust', '#06b6d4': 'Cyan', '#a3e635': 'Volt', '#f43f5e': 'Coral', '#f59e0b': 'Orange', '#fdf4ff': 'Pearl', '#d946ef': 'Magenta', '#0284c7': 'Ocean', '#b91c1c': 'Ruby', '#1e293b': 'Slate', '#0d9488': 'Jade', '#fcd34d': 'Sun', '#ef4444': 'Scarlet', '#3b82f6': 'Blue', '#a16207': 'Bronze', '#0b0b0f': 'Blackout', '#1c1917': 'Charcoal' };

export const BOOTS = [];
BRANDS.forEach((b, bi) => LINES.forEach((l, li) => {
  const pick = (i, dflt) => i == null ? dflt : b.pal[i];
  const c1 = pick(l.c[0], '#0b0b0f'), c2 = pick(l.c[1], '#f8fafc'), c3 = pick(l.c[2], li === 4 ? '#1a1a1a' : '#f8fafc');
  BOOTS.push({ id: BOOTS.length, name: `${b.n} ${l.n}`, brand: b.n, brandId: b.id, line: l.id, lineName: l.n, desc: l.d, colours: `${COLOUR_NAMES[c1] || 'Custom'} / ${COLOUR_NAMES[c2] || 'Custom'}`,
    c1, c2, c3, pattern: l.pattern === 'mark' ? b.mark : l.pattern, finish: l.finish, sole: l.sole, fam: colourFamily(c1), seed: bi * 31 + li * 7 });
}));
export const BOOT_BRANDS = BRANDS.map(b => [b.id, b.n]);
export const BOOT_LINES = LINES.map(l => [l.id, l.n]);
export const BOOT_FAMS = ['black', 'white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
export const bootFinish = d => FINISH[d && d.finish] || FINISH.matte;

function hsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) { if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
export function colourFamily(hex) {
  const [h, s, l] = hsl(hex);
  if (l < .16) return 'black'; if (l > .86 && s < .35) return 'white'; if (s < .15) return 'grey';
  if (h < 15 || h >= 345) return 'red'; if (h < 42) return 'orange'; if (h < 68) return 'yellow'; if (h < 170) return 'green'; if (h < 262) return 'blue'; if (h < 300) return 'purple'; return 'pink';
}
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const dist = (a, b) => { const A = rgb(a), B = rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
/** A catalogue design for a world player or an unnamed match player, from any integer seed. */
export const bootFor = seed => { let x = (seed | 0) * 2654435761 >>> 0; x ^= x >>> 13; x = Math.imul(x, 1274126177) >>> 0; return x % BOOTS.length; };
/** Nearest catalogue design to a saved legacy boot (style 0-3 Classic/Speed/Power/Retro + two colours). */
export function nearestBoot(style = 0, c1 = '#111827', c2 = '#f8fafc') {
  const fam = [['stripe', 'laces'], ['flash', 'diag', 'chevron', 'wave', 'speckle'], ['split', 'sole', 'toe', 'check'], ['stripe']][style | 0] || ['stripe'];
  let best = 0, bd = 1e9;
  const score = d => (fam.includes(d.pattern) ? 0 : 90) + dist(d.c1, c1) * 1.6 + dist(d.c2, c2) * .7;
  BOOTS.forEach(d => { const s = score(d); if (s < bd) { bd = s; best = d.id; } });
  return best;
}

// ---------------------------------------------------------------------------- painting -----------
// k: 2D context; A: atlas width; y/h: the boots row; u → x = u*A; t (0 ankle … 1 sole) → y + t*h. The visible upper
// spans u ≈ .12 (toe) … .83 (heel); laces > .865; studs < .1.
const U0 = .12, U1 = .83;
const ux = (A, u) => Math.round(A * u);
function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const PAINT = {
  plain() {},
  stripe(k, A, y, h, d) { k.fillStyle = d.c2; k.fillRect(ux(A, U0), y + h * .40, ux(A, U1) - ux(A, U0), h * .16); },
  diag(k, A, y, h, d) { k.fillStyle = d.c2; for (let i = -2; i < 14; i++) { const x0 = ux(A, U0) + i * 46; k.beginPath(); k.moveTo(x0, y + h); k.lineTo(x0 + 16, y + h); k.lineTo(x0 + 54, y + h * .08); k.lineTo(x0 + 38, y + h * .08); k.closePath(); k.fill(); } },
  split(k, A, y, h, d) { k.fillStyle = d.c2; k.fillRect(ux(A, U0), y, ux(A, .46) - ux(A, U0), h); },
  chevron(k, A, y, h, d) { k.fillStyle = d.c2; for (let i = 0; i < 4; i++) { const x0 = ux(A, .32 + i * .11); k.beginPath(); k.moveTo(x0, y + h * .1); k.lineTo(x0 - 26, y + h * .5); k.lineTo(x0, y + h * .9); k.lineTo(x0 + 16, y + h * .9); k.lineTo(x0 - 10, y + h * .5); k.lineTo(x0 + 16, y + h * .1); k.closePath(); k.fill(); } },
  speckle(k, A, y, h, d) { const R = rnd(d.seed + 3); k.fillStyle = d.c2; for (let i = 0; i < 220; i++) { const x = ux(A, U0) + R() * (ux(A, U1) - ux(A, U0)), yy = y + h * .06 + R() * h * .82, r = 1.2 + R() * 2.6; k.beginPath(); k.arc(x, yy, r, 0, Math.PI * 2); k.fill(); } },
  gradient(k, A, y, h, d) { const g = k.createLinearGradient(ux(A, U0), 0, ux(A, U1), 0); g.addColorStop(0, d.c1); g.addColorStop(.45, d.c1); g.addColorStop(1, d.c2); k.fillStyle = g; k.fillRect(ux(A, U0), y, ux(A, U1) - ux(A, U0), h); },
  toe(k, A, y, h, d) { k.fillStyle = d.c2; k.fillRect(ux(A, U0), y + h * .3, ux(A, .3) - ux(A, U0), h * .7); k.fillRect(ux(A, .74), y, ux(A, U1) - ux(A, .74), h); },
  sole(k, A, y, h, d) { k.fillStyle = d.c3; k.fillRect(0, y + h - 14, A, 14); },
  laces(k, A, y, h, d) { k.fillStyle = d.c2; k.fillRect(ux(A, U0), y, ux(A, U1) - ux(A, U0), h * .14); },
  wave(k, A, y, h, d) { k.fillStyle = d.c2; k.beginPath(); const x0 = ux(A, U0), x1 = ux(A, U1); k.moveTo(x0, y + h * .5); for (let x = x0; x <= x1; x += 6) k.lineTo(x, y + h * (.5 + .16 * Math.sin((x - x0) / 34))); for (let x = x1; x >= x0; x -= 6) k.lineTo(x, y + h * (.68 + .16 * Math.sin((x - x0) / 34))); k.closePath(); k.fill(); },
  flash(k, A, y, h, d) { k.strokeStyle = d.c2; k.lineWidth = h * .17; k.lineCap = 'round'; k.beginPath(); k.moveTo(ux(A, .2), y + h * .62); k.quadraticCurveTo(ux(A, .5), y + h * .95, ux(A, .8), y + h * .18); k.stroke(); },
  check(k, A, y, h, d) { k.fillStyle = d.c2; const s = Math.round(h / 5); for (let j = 0; j < 5; j++) for (let i = 0; i < 9; i++) if ((i + j) % 2 === 0) k.fillRect(ux(A, .28) + i * s, y + j * s, s, s); },
};
export const BOOT_PATTERNS = Object.keys(PAINT);
/** Paints one design into the boots row of a kit atlas (any pattern draws over the base colour). */
export function paintBoots(k, A, y, h, d, full = true) {
  k.save(); k.beginPath(); k.rect(0, y, A, h); k.clip();
  k.fillStyle = d.c1; k.fillRect(0, y, A, h);
  (PAINT[d.pattern] || PAINT.plain)(k, A, y, h, d);
  // soleplate band + studs patch (u < .1): conical = round studs, bladed = short bars, mixed = both
  k.fillStyle = d.pattern === 'sole' ? d.c3 : '#0a0a0a'; k.fillRect(0, y + h - 7, A, 7);
  if (!full) { k.restore(); return; }
  const sg = k.createLinearGradient(8, 0, 44, 0); sg.addColorStop(0, d.finish === 'metal' ? '#2a2a2e' : '#8f969e'); sg.addColorStop(1, d.finish === 'metal' ? '#4a4a50' : '#e9edf1'); k.fillStyle = sg; k.fillRect(0, y, 52, h);
  k.fillStyle = d.c3;
  if (d.sole !== 'bladed') for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { k.beginPath(); k.arc(10 + i * 14, y + 10 + j * 18, 4, 0, Math.PI * 2); k.fill(); }
  if (d.sole !== 'conical') for (let j = 0; j < 4; j++) k.fillRect(6, y + 4 + j * 18 + (d.sole === 'mixed' ? 9 : 0), 38, 3);
  // sock collar patch (u .83–.865): base colour with a knit rib; laces/tongue (u > .865): darker tongue, laces in the accent
  const cx0 = Math.round(A * .83), lx = Math.round(A * .865);
  k.fillStyle = d.pattern === 'laces' ? d.c2 : d.c1; k.fillRect(cx0, y, lx - cx0, h); k.fillStyle = 'rgba(0,0,0,.12)'; for (let j = y; j < y + h; j += 3) k.fillRect(cx0, j, lx - cx0, 1);
  k.fillStyle = d.c1; k.fillRect(lx, y, A - lx, h); k.fillStyle = 'rgba(0,0,0,.28)'; k.fillRect(lx, y, A - lx, h);
  k.strokeStyle = d.pattern === 'laces' || d.line === 'night' ? d.c2 : (colourFamily(d.c1) === 'white' ? '#1f2937' : '#f4f4f4'); k.lineWidth = 2.2;
  for (let j = y + 5; j < y + h - 9; j += 6) { k.beginPath(); k.moveTo(lx + 10, j); k.lineTo(A - 10, j + 3); k.moveTo(lx + 10, j + 3); k.lineTo(A - 10, j); k.stroke(); }
  k.restore();
}

// ---------------------------------------------------------------------------- catalogue card -----
const thumbs = new Map();
/** Side-view boot card (toe left, heel right) painted with the same pattern code. Returns a data URL (cached). */
export function bootThumb(d, W = 168, H = 84) {
  const key = d.id + ':' + W; if (thumbs.has(key)) return thumbs.get(key);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const k = c.getContext('2d');
  const A = W / (U1 - U0), ox = -U0 * A, y = 0, h = H * .92;
  k.save();
  // boot outline: low toe, rising instep, high collar at the heel
  k.beginPath(); k.moveTo(2, H * .9); k.lineTo(W * .33, H * .9); k.lineTo(W * .98, H * .9); k.lineTo(W * .98, H * .3); k.quadraticCurveTo(W * .9, H * .06, W * .72, H * .1); k.quadraticCurveTo(W * .6, H * .12, W * .5, H * .4); k.quadraticCurveTo(W * .3, H * .6, W * .1, H * .62); k.quadraticCurveTo(0, H * .7, 2, H * .9); k.closePath(); k.clip();
  k.translate(ox, 0); paintBoots(k, A, y, h, d, false); k.setTransform(1, 0, 0, 1, 0, 0);
  // laces across the instep + a soft highlight so the card reads as a shoe (still clipped to the outline)
  k.strokeStyle = d.pattern === 'laces' || d.line === 'night' ? d.c2 : (colourFamily(d.c1) === 'white' ? '#1f2937' : '#f4f4f4'); k.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) { const x = W * (.46 + i * .05), yy = H * (.42 - i * .06); k.beginPath(); k.moveTo(x - 5, yy - 3); k.lineTo(x + 5, yy + 3); k.moveTo(x + 5, yy - 3); k.lineTo(x - 5, yy + 3); k.stroke(); }
  const g = k.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); k.fillStyle = g; k.fillRect(0, 0, W, H);
  k.restore();
  const url = c.toDataURL('image/png'); thumbs.set(key, url); return url;
}
