// SVG kit and crest renders for the HTML menus. Kit designs mirror drawShirt() in game.js
// (DSG order: Solid, Stripes, Hoops, Halves, Sash, Chevrons, Pinstripes, Checkers, Chest band,
// Gradient, Dots, Diagonals); crest shapes mirror the create-a-club options.
import { flagSVG } from '../world/nations.js';
import { drawPattern } from '../render3d/character.js';
import { sponsorSVG } from '../world/sponsors.js';
const patCache = new Map();
/** The kit pattern painted once by drawPattern (the same code as the 3D kit), as a data URL for the SVG shirt. */
function patternURL(c1, c2, d) {
  const key = c1 + c2 + d; if (patCache.has(key)) return patCache.get(key);
  let url = '';
  try { const c = document.createElement('canvas'); c.width = c.height = 128; drawPattern(c.getContext('2d'), 128, 128, c1, c2, d); url = c.toDataURL('image/png'); } catch (e) { url = ''; }
  if (patCache.size > 200) patCache.delete(patCache.keys().next().value); patCache.set(key, url); return url;
}
let uid = 0;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lum = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0.5; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
export const inkOn = c => lum(c) > 0.6 ? '#0d1410' : '#ffffff';

const SHIRT = 'M62 22 L84 13 Q100 27 116 13 L138 22 L184 50 L168 90 L148 80 L150 190 L50 190 L52 80 L32 90 L16 50 Z';

function pattern(d, c2, id) {
  const r = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  let s = '';
  if (d === 1) for (let x = 20; x < 200; x += 40) s += r(x, 0, 20, 200);
  else if (d === 2) for (let y = 30; y < 200; y += 36) s += r(0, y, 200, 18);
  else if (d === 3) s += r(100, 0, 100, 200);
  else if (d === 4) s += '<polygon points="40,10 80,10 190,170 190,200 160,200 40,40"/>';
  else if (d === 5) for (let y = 40; y < 200; y += 38) s += `<polygon points="0,${y} 100,${y + 26} 200,${y} 200,${y + 12} 100,${y + 38} 0,${y + 12}"/>`;
  else if (d === 6) for (let x = 10; x < 200; x += 12) s += r(x, 0, 2.5, 200);
  else if (d === 7) for (let x = 0; x < 200; x += 25) for (let y = 0; y < 200; y += 25) if (((x + y) / 25) & 1) s += r(x, y, 25, 25);
  else if (d === 8) s += r(0, 62, 200, 34);
  else if (d === 9) return `<rect width="200" height="200" fill="url(#g${id})"/>`;
  else if (d === 10) for (let x = 25; x < 200; x += 25) for (let y = 25; y < 200; y += 25) s += `<circle cx="${x}" cy="${y}" r="4.5"/>`;
  else if (d === 11) for (let x = -200; x < 200; x += 40) s += `<polygon points="${x},0 ${x + 20},0 ${x + 220},200 ${x + 200},200"/>`;
  return s ? `<g fill="${c2}">${s}</g>` : '';
}

/** Front-on shirt. K = { c, c2, d, sponsor }, crest = { shape, c1, c2, letter } (optional). */
export function kitSVG(K, crest, { sponsor = true } = {}) {
  const id = ++uid, c = K.c || '#888', c2 = K.c2 || '#fff', d = K.d | 0, pos = K.spPos || 'chest';
  const ink = d === 8 || d === 18 ? inkOn(c2) : inkOn(c), spY = d === 8 ? 84 : 112;
  const sp = sponsor && K.sponsor && pos === 'chest' ? `${sponsorSVG(K.sponsor, 42, spY - 10, 14, ink)}<text x="110" y="${spY}" text-anchor="middle" font-size="${K.sponsor.length > 12 ? 10 : 13}" font-weight="800" letter-spacing=".04em" fill="${ink}" stroke="${d === 8 ? c2 : c}" stroke-width="3" paint-order="stroke" stroke-linejoin="round" font-family="system-ui,sans-serif">${esc(K.sponsor.toUpperCase())}</text>`
    : sponsor && K.sponsor && pos === 'sleeve' ? `<text x="30" y="72" text-anchor="middle" font-size="7" font-weight="800" fill="${inkOn(c)}" font-family="system-ui,sans-serif" transform="rotate(-62 30 72)">${esc(K.sponsor.toUpperCase().slice(0, 12))}</text>` : '';
  const collar = K.collar ? `<path d="M84 13 Q100 27 116 13 L119 16 Q100 34 81 16 Z" fill="${K.collar}"/><path d="M62 22 L84 13 L86 17 L66 26 Z M138 22 L116 13 L114 17 L134 26 Z" fill="${K.collar}"/>` : '';
  const cuff = K.cuff ? `<path d="M32 90 L16 50 L22 47 L38 86 Z M168 90 L184 50 L178 47 L162 86 Z" fill="${K.cuff}"/>` : '';
  const pat = patternURL(c, c2, d);
  const badge = crest ? `<g transform="translate(117 50) scale(.15)">${crestBody(crest, id, K.n || '')}</g>` : '';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kit">
<defs><clipPath id="k${id}"><path d="${SHIRT}"/></clipPath>
<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="f${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
<pattern id="m${id}" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="none"/><circle cx="1.5" cy="1.5" r=".55" fill="#000" opacity=".12"/></pattern></defs>
<g clip-path="url(#k${id})"><rect width="200" height="200" fill="${c}"/>${pat ? `<image href="${pat}" x="0" y="0" width="200" height="200" preserveAspectRatio="none" image-rendering="auto"/>` : pattern(d, c2, id)}
<path d="M32 90 L16 50 L26 44 L44 84 Z M168 90 L184 50 L174 44 L156 84 Z" fill="${c2}"/>
<rect width="200" height="200" fill="url(#m${id})"/><rect width="200" height="200" fill="url(#f${id})"/>
<path d="M62 22 Q100 70 138 22" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>${cuff}</g>
<path d="M84 13 Q100 27 116 13 L119 16 Q100 34 81 16 Z" fill="${K.collar || c2}"/>${collar}
<path d="${SHIRT}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5" stroke-linejoin="round"/>${sp}${badge}</svg>`;
}

// ---------------------------------------------------------------------------- crests ------------
// Crest design system: 7 outlines × 11 motifs × 3 borders, two to three colours, a founded-year ribbon and the
// initial as an accent. Every field is explicit on world clubs (`crest.{shape,motif,border,c1,c2,c3,letter,year,seed}`,
// set by the crestV2 pass in game.js); anything missing is derived from the seed so old saves and non-world clubs
// still get a full crest. The same SVG goes to menus, the kit badge (`kitSVG`) and the 3D shirt (crest image).
export const CREST_SHAPES = ['Shield', 'Round', 'Diamond', 'Hexagon', 'Star', 'Pennant', 'Modern mark'];
export const CREST_MOTIFS = ['Initial only', 'Hills', 'Lion', 'Eagle', 'Stars', 'Ball', 'Waves', 'Tree', 'Sun', 'Tower', 'Crown', 'Flag'];
export const strHash = str => { let h = 2166136261; for (const ch of String(str || '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
/** Fills in the fields of a crest from its seed (never mutates the stored crest). */
export function crestFull(cr, name = '') {
  const s = cr.seed ?? strHash(name), out = { ...cr };
  if (out.motif == null) out.motif = 1 + s % 10;
  if (out.border == null) out.border = (s >>> 4) % 3;
  if (out.shape == null) out.shape = (s >>> 6) % 7;
  if (!out.c3) out.c3 = lum(out.c1) > .6 ? '#0d1410' : '#f8fafc';
  if (out.year === undefined) out.year = 1880 + (s >>> 8) % 130;
  return out;
}
const OUTLINES = [
  'M100 8 L182 30 L176 120 Q160 172 100 194 Q40 172 24 120 L18 30 Z',
  'M100 8 A92 92 0 1 1 99.9 8 Z',
  'M100 4 L196 100 L100 196 L4 100 Z',
  'M100 6 L182 53 L182 147 L100 194 L18 147 L18 53 Z',
  'M100 4 L125 72 L196 74 L139 117 L159 188 L100 146 L41 188 L61 117 L4 74 L75 72 Z',
  'M22 12 L178 12 L170 110 L100 192 L30 110 Z',
  'M44 12 H156 Q188 12 188 44 V156 Q188 188 156 188 H44 Q12 188 12 156 V44 Q12 12 44 12 Z',
];
const star = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return d + 'Z'; };
/** Motif drawn in a 200×200 box centred near (100, 92); c = accent colour, c3 = third colour, bg = field colour. */
function motifSVG(m, c, c3, bg) {
  switch (m) {
    case 1: return `<path d="M-10 150 Q50 70 110 150 Z" fill="${c}"/><path d="M60 150 Q130 60 210 150 Z" fill="${c3}" fill-opacity=".9"/><circle cx="62" cy="58" r="16" fill="${c3}"/>`;
    case 2: return `<circle cx="100" cy="92" r="40" fill="${c3}"/><circle cx="100" cy="94" r="27" fill="${c}"/><path d="M78 62 L88 78 L70 82 Z M122 62 L112 78 L130 82 Z" fill="${c}"/><circle cx="90" cy="88" r="3.5" fill="${bg}"/><circle cx="110" cy="88" r="3.5" fill="${bg}"/><path d="M94 100 L106 100 L100 107 Z" fill="${bg}"/><path d="M100 107 V114 M94 118 Q100 122 106 118" stroke="${bg}" stroke-width="2.5" fill="none"/>`;
    case 3: return `<path d="M100 64 L36 92 L72 98 L44 124 L88 114 L100 140 L112 114 L156 124 L128 98 L164 92 Z" fill="${c}"/><circle cx="100" cy="62" r="11" fill="${c}"/><path d="M106 60 L118 64 L106 68 Z" fill="${c3}"/>`;
    case 4: return `<path d="${star(66, 86, 15)}${star(100, 74, 19)}${star(134, 86, 15)}" fill="${c}"/>`;
    case 5: return `<circle cx="100" cy="92" r="38" fill="${c3}" stroke="${c}" stroke-width="4"/><path d="${star(100, 92, 13).replace(/L/g, 'L')}" fill="${c}"/><path d="M100 79 V58 M112 88 L132 76 M108 104 L121 122 M92 104 L79 122 M88 88 L68 76" stroke="${c}" stroke-width="4"/>`;
    case 6: return `<path d="M20 86 Q45 70 70 86 T120 86 T170 86 T220 86 M20 108 Q45 92 70 108 T120 108 T170 108 T220 108 M20 130 Q45 114 70 130 T120 130 T170 130 T220 130" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`;
    case 7: return `<rect x="93" y="118" width="14" height="30" fill="${c3}"/><path d="M100 46 L132 88 L112 88 L138 118 L62 118 L88 88 L68 88 Z" fill="${c}"/>`;
    case 8: return `<circle cx="100" cy="90" r="22" fill="${c}"/><g stroke="${c}" stroke-width="6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<line x1="${(100 + Math.cos(r) * 32).toFixed(1)}" y1="${(90 + Math.sin(r) * 32).toFixed(1)}" x2="${(100 + Math.cos(r) * 46).toFixed(1)}" y2="${(90 + Math.sin(r) * 46).toFixed(1)}"/>`; }).join('')}</g>`;
    case 9: return `<path d="M70 140 V70 H82 V58 H96 V70 H104 V58 H118 V70 H130 V140 Z" fill="${c}"/><path d="M92 140 V116 Q100 108 108 116 V140 Z" fill="${bg}"/><rect x="96" y="80" width="8" height="14" fill="${bg}"/>`;
    case 10: return `<path d="M56 124 L50 70 L78 96 L100 58 L122 96 L150 70 L144 124 Z" fill="${c}"/><rect x="54" y="124" width="92" height="14" fill="${c3}"/><circle cx="50" cy="68" r="5" fill="${c3}"/><circle cx="100" cy="56" r="5" fill="${c3}"/><circle cx="150" cy="68" r="5" fill="${c3}"/>`;
    default: return '';
  }
}
function crestBody(cr, id, name = '') {
  const F = crestFull(cr, name), c1 = F.c1 || '#888', c2 = F.c2 || '#fff', c3 = F.c3, s = F.shape | 0, m = F.motif | 0, outline = OUTLINES[s] || OUTLINES[1];
  const border = F.border === 1 && s !== 4 ? `<path d="${outline}" transform="translate(100 100) scale(.84) translate(-100 -100)" fill="none" stroke="${c2}" stroke-width="5"/>`
    : F.border === 2 && s !== 4 ? `<path d="${outline}" transform="translate(100 100) scale(.86) translate(-100 -100)" fill="none" stroke="${c2}" stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round"/>` : '';
  const clip = `cl${id}`;
  // motif scale and lift per outline (pennants and stars have less room low down)
  const sc = s === 4 ? .55 : s === 5 ? .72 : s === 2 ? .7 : .82, ty = s === 5 ? 74 : s === 4 ? 92 : 90;
  const motif = m === 11 ? `<g clip-path="url(#${clip})">${flagSVG(F.flag || { t: 'v3', c: [c1, c2, c3] })}</g>` : m ? `<g clip-path="url(#${clip})"><g transform="translate(100 ${ty}) scale(${sc}) translate(-100 -92)">${motifSVG(m, c2, c3, c1)}</g></g>` : '';
  const letter = esc((F.letter || name || '?').slice(0, 1));
  const ribbon = m === 11 ? '' : m && F.year && (s === 0 || s === 1 || s === 3 || s === 6) ? `<g clip-path="url(#${clip})"><rect x="0" y="146" width="200" height="30" fill="${c2}"/><text x="100" y="168" text-anchor="middle" font-size="22" font-weight="800" fill="${c1}" font-family="system-ui,sans-serif" letter-spacing="1">${letter} · ${F.year}</text></g>`
    : m ? `<text x="100" y="${s === 5 ? 130 : 158}" text-anchor="middle" font-size="30" font-weight="900" fill="${c2}" font-family="system-ui,sans-serif">${letter}</text>` : '';
  return `<defs><clipPath id="${clip}"><path d="${outline}"/></clipPath></defs><path d="${outline}" fill="${c1}" stroke="${c2}" stroke-width="8" stroke-linejoin="round"/>${border}${motif}${ribbon}
${m ? '' : `<text x="100" y="${s === 4 ? 128 : 134}" text-anchor="middle" font-size="${s === 4 ? 64 : 92}" font-weight="900" fill="${c2}" font-family="system-ui,sans-serif">${letter}</text>`}`;
}

/** League / competition logo: a roundel in the competition colours with the initials; nations get a star arc, legends a laurel. */
export function leagueLogoSVG(L) {
  const col = L.colors || ['#1d4ed8', '#f8fafc', '#111827'], a = col[0], b = col[1] || '#f8fafc', k = L.kind || 'league';
  const words = String(L.name || '').split(/\s+/).filter(w => w && !/^(league|liga|division|cup|first|super|pro|the|of|de|del|a-league)$/i.test(w));
  const ini = esc(words.map(w => w[0].toUpperCase()).join('').slice(0, 3) || 'L');
  const ink = inkOn(a), deco = k === 'nations' ? `<path d="${[-50, -25, 0, 25, 50].map(dx => star(100 + dx * 1.4, 150 - Math.abs(dx) * .45, 7)).join('')}" fill="${b}"/>`
    : k === 'legends' ? `<path d="M40 70 Q30 130 72 160 M160 70 Q170 130 128 160" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round"/><g fill="${b}">${[80, 100, 120, 140].map(y => `<ellipse cx="${(44 + (y - 80) * .3).toFixed(0)}" cy="${y}" rx="9" ry="5"/><ellipse cx="${(156 - (y - 80) * .3).toFixed(0)}" cy="${y}" rx="9" ry="5"/>`).join('')}</g>`
    : `<circle cx="100" cy="52" r="12" fill="${b}"/><path d="${star(100, 52, 5)}" fill="${a}"/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(L.name)} logo"><circle cx="100" cy="100" r="94" fill="${a}"/><circle cx="100" cy="100" r="86" fill="none" stroke="${b}" stroke-width="5"/><circle cx="100" cy="100" r="74" fill="none" stroke="${b}" stroke-opacity=".35" stroke-width="2"/>${deco}<text x="100" y="${k === 'nations' ? 112 : 120}" text-anchor="middle" font-size="${ini.length > 2 ? 56 : 68}" font-weight="900" fill="${ink}" font-family="'Barlow Condensed',system-ui,sans-serif">${ini}</text></svg>`;
}

/** Club crest; falls back to a circle with the club's first letter for pre-world clubs. */
export function crestSVG(club, { size = null } = {}) {
  const cr = club.crest || { shape: 1, motif: 0, border: 0, c1: club.c, c2: inkOn(club.c) === '#ffffff' ? '#ffffff' : '#0d1410', letter: (club.n || '?')[0], year: null };
  return `<svg viewBox="0 0 200 200"${size ? ` width="${size}" height="${size}"` : ''} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(club.n)} crest">${crestBody(cr, ++uid, club.n || club.name || '')}</svg>`;
}
