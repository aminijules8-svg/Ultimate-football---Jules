// Original drawn menu artwork: procedural canvas scenes painted once per session and cached as data URLs, so the
// menus get a themed hero picture without any downloaded image. Every scene is drawn from simple shapes and
// gradients (stadium bowl at dusk, the view from the tunnel, boots on turf, a trophy on its plinth, training cones,
// a floodlit night, a map of the fictional nations). The CSS layers its own dark gradients on top for text contrast.
const W = 1152, H = 648, cache = new Map();
const rnd = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const lin = (k, x0, y0, x1, y1, stops) => { const g = k.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
const rad = (k, x, y, r0, r1, stops) => { const g = k.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };

function sky(k, top, mid, bottom, horizon = .62) { k.fillStyle = lin(k, 0, 0, 0, H, [[0, top], [horizon * .8, mid], [horizon, bottom]]); k.fillRect(0, 0, W, H); }
function stars(k, R, n, maxY, alpha = .8) { for (let i = 0; i < n; i++) { k.fillStyle = `rgba(255,255,255,${(.3 + R() * .7) * alpha})`; const r = .6 + R() * 1.4; k.beginPath(); k.arc(R() * W, R() * maxY, r, 0, 7); k.fill(); } }
function pitchGround(k, y0, light = '#2f8f3f', dark = '#257a35', stripes = 9) {
  for (let i = 0; i < stripes; i++) { const x0 = (i / stripes) * W, x1 = ((i + 1) / stripes) * W; k.fillStyle = i % 2 ? dark : light; k.beginPath(); k.moveTo(x0, H); k.lineTo(x1, H); k.lineTo(W / 2 + (x1 - W / 2) * .35, y0); k.lineTo(W / 2 + (x0 - W / 2) * .35, y0); k.closePath(); k.fill(); }
  k.strokeStyle = 'rgba(255,255,255,.55)'; k.lineWidth = 2.5; k.beginPath(); k.moveTo(W * .5 - W * .35 * .5, y0); k.lineTo(0, H); k.moveTo(W * .5 + W * .35 * .5, y0); k.lineTo(W, H); k.stroke();
}
function floodlight(k, x, y, h, flip = 1, glow = true) {
  k.fillStyle = '#1b2026'; k.fillRect(x - 3, y, 6, h); k.fillRect(x - 22, y - 10, 44, 16);
  if (glow) { k.fillStyle = rad(k, x, y - 2, 0, 90, [[0, 'rgba(255,250,220,.95)'], [.25, 'rgba(255,250,220,.35)'], [1, 'rgba(255,250,220,0)']]); k.fillRect(x - 90, y - 92, 180, 180); }
  k.fillStyle = 'rgba(255,250,225,.08)'; k.beginPath(); k.moveTo(x - 18, y - 2); k.lineTo(x + 18, y - 2); k.lineTo(x + 260 * flip, H); k.lineTo(x - 180 * flip, H); k.closePath(); k.fill();
}
function crowd(k, R, x0, x1, y0, y1, rows, dens = 1) {
  const cols = ['#d9e3ec', '#1e3a8a', '#dc2626', '#f8fafc', '#111827', '#facc15', '#2563eb', '#7f1d1d'];
  for (let r = 0; r < rows; r++) { const y = y0 + (y1 - y0) * r / rows; for (let x = x0; x < x1; x += 7 / dens) if (R() < .85) { k.fillStyle = cols[(R() * cols.length) | 0]; k.fillRect(x + R() * 3, y + R() * 3, 3, 4); } }
}

const SCENES = {
  /** stadium bowl at dusk, seen from the hill outside: curved roof, lights on, warm sky */
  stadium(k, R) {
    sky(k, '#0b1540', '#4b2a5a', '#f08a3c', .64); stars(k, R, 90, H * .35, .6);
    k.fillStyle = rad(k, W * .78, H * .62, 0, 260, [[0, 'rgba(255,170,90,.55)'], [1, 'rgba(255,170,90,0)']]); k.fillRect(0, 0, W, H);
    // hills
    k.fillStyle = '#1f2a24'; k.beginPath(); k.moveTo(0, H * .72); k.quadraticCurveTo(W * .25, H * .6, W * .5, H * .7); k.quadraticCurveTo(W * .75, H * .78, W, H * .66); k.lineTo(W, H); k.lineTo(0, H); k.fill();
    // bowl: lower tier, roof ring
    const cx = W * .5, cy = H * .66;
    k.fillStyle = '#2a3340'; k.beginPath(); k.ellipse(cx, cy, W * .34, H * .13, 0, 0, Math.PI * 2); k.fill();
    k.fillStyle = '#394556'; k.beginPath(); k.ellipse(cx, cy - 26, W * .36, H * .12, 0, Math.PI, Math.PI * 2); k.lineTo(cx + W * .36, cy); k.ellipse(cx, cy, W * .36, H * .12, 0, 0, Math.PI, true); k.closePath(); k.fill();
    k.fillStyle = lin(k, 0, cy - 120, 0, cy - 20, [[0, '#8e9bb0'], [1, '#55637a']]); k.beginPath(); k.ellipse(cx, cy - 60, W * .37, H * .115, 0, Math.PI, Math.PI * 2); k.ellipse(cx, cy - 60, W * .3, H * .07, 0, Math.PI * 2, Math.PI, true); k.closePath(); k.fill();
    k.fillStyle = rad(k, cx, cy - 40, 0, W * .3, [[0, 'rgba(210,255,200,.9)'], [.5, 'rgba(120,230,120,.35)'], [1, 'rgba(120,230,120,0)']]); k.beginPath(); k.ellipse(cx, cy - 50, W * .3, H * .07, 0, 0, Math.PI * 2); k.fill();
    [-.3, -.1, .1, .3].forEach((f, i) => floodlight(k, cx + W * f, cy - 200 - (i % 2 ? 24 : 0), 150, f < 0 ? 1 : -1));
    // foreground silhouettes: trees and a road
    k.fillStyle = '#121a16'; for (let i = 0; i < 14; i++) { const x = R() * W, y = H * .78 + R() * H * .1, r = 18 + R() * 30; k.beginPath(); k.arc(x, y, r, 0, 7); k.fill(); k.fillRect(x - 3, y, 6, 40); }
    k.fillStyle = lin(k, 0, H * .8, 0, H, [[0, 'rgba(10,16,12,0)'], [1, 'rgba(10,16,12,.9)']]); k.fillRect(0, H * .8, W, H * .2);
  },
  /** the view from the players' tunnel: dark walls framing a bright pitch and a full stand */
  tunnel(k, R) {
    k.fillStyle = '#7fb3ff'; k.fillRect(0, 0, W, H);
    k.fillStyle = lin(k, 0, 0, 0, H * .4, [[0, '#a9cfff'], [1, '#dbeeff']]); k.fillRect(0, 0, W, H * .4);
    // far stand
    k.fillStyle = '#4b5565'; k.fillRect(W * .18, H * .2, W * .64, H * .2); crowd(k, R, W * .18, W * .82, H * .21, H * .38, 14, .9); k.fillStyle = 'rgba(40,50,70,.45)'; k.fillRect(W * .18, H * .2, W * .64, H * .2);
    k.fillStyle = '#1f2630'; k.fillRect(W * .18, H * .38, W * .64, 10);
    pitchGround(k, H * .4, '#3da04c', '#33903f', 11);
    // goal frame + box lines
    k.strokeStyle = '#fff'; k.lineWidth = 3; k.strokeRect(W * .41, H * .33, W * .18, H * .07); k.lineWidth = 2; k.strokeRect(W * .3, H * .4, W * .4, H * .12);
    // tunnel walls and roof in perspective
    k.fillStyle = '#0c1012'; k.beginPath(); k.moveTo(0, 0); k.lineTo(W * .32, 0); k.lineTo(W * .32, H * .12); k.lineTo(W * .16, H * .12); k.lineTo(W * .16, H); k.lineTo(0, H); k.fill();
    k.beginPath(); k.moveTo(W, 0); k.lineTo(W * .68, 0); k.lineTo(W * .68, H * .12); k.lineTo(W * .84, H * .12); k.lineTo(W * .84, H); k.lineTo(W, H); k.fill();
    k.fillStyle = '#14191d'; k.fillRect(W * .16, 0, W * .68, H * .12);
    k.fillStyle = lin(k, W * .16, 0, W * .3, 0, [[0, 'rgba(0,0,0,.75)'], [1, 'rgba(0,0,0,0)']]); k.fillRect(W * .16, H * .12, W * .14, H); k.fillStyle = lin(k, W * .84, 0, W * .7, 0, [[0, 'rgba(0,0,0,.75)'], [1, 'rgba(0,0,0,0)']]); k.fillRect(W * .7, H * .12, W * .14, H);
    k.fillStyle = '#1a2126'; k.fillRect(W * .16, H * .86, W * .68, H * .14);  // tunnel floor edge
    for (let i = 0; i < 6; i++) { k.fillStyle = `rgba(255,255,255,${.06 + i * .02})`; k.fillRect(W * .16, H * .14 + i * 36, W * .68, 2); }
    k.fillStyle = 'rgba(4,10,8,.42)'; k.fillRect(0, 0, W, H);  // keep the shirts in front readable
  },
  /** boots on the turf, low angle, dew on the grass */
  boots(k, R) {
    k.fillStyle = lin(k, 0, 0, 0, H, [[0, '#0f3d1d'], [.5, '#1f7a34'], [1, '#2f9a44']]); k.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { const x = R() * W, y = H * .35 + R() * H * .65, h = 10 + R() * 34 * (y / H); k.strokeStyle = `rgba(${90 + R() * 80 | 0},${170 + R() * 70 | 0},${70 + R() * 60 | 0},.75)`; k.lineWidth = 1 + R() * 1.6; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + (R() - .5) * 14, y - h * .6, x + (R() - .5) * 26, y - h); k.stroke(); }
    const boot = (x, y, s, c1, c2, flip) => { k.save(); k.translate(x, y); k.scale(s * flip, s);
      k.fillStyle = 'rgba(0,0,0,.35)'; k.beginPath(); k.ellipse(0, 18, 150, 20, 0, 0, 7); k.fill();
      k.fillStyle = c1; k.beginPath(); k.moveTo(-150, 10); k.quadraticCurveTo(-160, -30, -110, -40); k.quadraticCurveTo(-40, -50, 10, -90); k.quadraticCurveTo(60, -120, 90, -110); k.lineTo(100, -30); k.quadraticCurveTo(140, -20, 150, 10); k.closePath(); k.fill();
      k.fillStyle = c2; k.beginPath(); k.moveTo(-150, 10); k.lineTo(150, 10); k.lineTo(150, 22); k.lineTo(-150, 22); k.fill();
      k.strokeStyle = c2; k.lineWidth = 9; k.lineCap = 'round'; k.beginPath(); k.moveTo(-120, -10); k.quadraticCurveTo(-10, -70, 80, -75); k.stroke();
      k.strokeStyle = '#f8fafc'; k.lineWidth = 3; for (let i = 0; i < 5; i++) { k.beginPath(); k.moveTo(10 + i * 14, -60 - i * 8); k.lineTo(26 + i * 14, -72 - i * 8); k.stroke(); }
      k.restore(); };
    boot(W * .36, H * .72, 1.25, '#e11d48', '#111827', 1); boot(W * .66, H * .8, 1.35, '#111827', '#38bdf8', -1);
    k.fillStyle = rad(k, W * .5, H * .2, 0, W * .6, [[0, 'rgba(255,255,230,.35)'], [1, 'rgba(255,255,230,0)']]); k.fillRect(0, 0, W, H);
  },
  /** trophy on a plinth, spotlit, confetti */
  trophy(k, R) {
    k.fillStyle = lin(k, 0, 0, 0, H, [[0, '#120a2a'], [1, '#2b1552']]); k.fillRect(0, 0, W, H);
    k.fillStyle = rad(k, W * .5, H * .45, 0, W * .45, [[0, 'rgba(255,220,120,.45)'], [1, 'rgba(255,220,120,0)']]); k.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { k.fillStyle = ['#facc15', '#f8fafc', '#38bdf8', '#f43f5e', '#a3e635'][(R() * 5) | 0]; k.save(); k.translate(R() * W, R() * H); k.rotate(R() * 6); k.fillRect(-5, -2, 10, 4); k.restore(); }
    const cx = W * .5, by = H * .86;
    k.fillStyle = lin(k, 0, by, 0, by + 100, [[0, '#4a4270'], [1, '#2a2546']]); k.fillRect(cx - 160, by, 320, 60); k.fillRect(cx - 190, by + 60, 380, 40); k.fillStyle = 'rgba(255,255,255,.18)'; k.fillRect(cx - 160, by, 320, 4); k.fillRect(cx - 190, by + 60, 380, 4);
    k.fillStyle = lin(k, cx - 60, 0, cx + 60, 0, [[0, '#8a6a12'], [.5, '#ffe28a'], [1, '#a37a1c']]);
    k.fillRect(cx - 50, by - 30, 100, 30); k.fillRect(cx - 16, by - 150, 32, 120);
    k.beginPath(); k.moveTo(cx - 95, by - 400); k.quadraticCurveTo(cx - 110, by - 180, cx, by - 150); k.quadraticCurveTo(cx + 110, by - 180, cx + 95, by - 400); k.closePath(); k.fill();
    k.strokeStyle = '#c99b2b'; k.lineWidth = 16; k.beginPath(); k.arc(cx - 120, by - 330, 60, Math.PI * .5, Math.PI * 1.5); k.stroke(); k.beginPath(); k.arc(cx + 120, by - 330, 60, Math.PI * 1.5, Math.PI * .5); k.stroke();
    k.fillStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.moveTo(cx - 70, by - 390); k.quadraticCurveTo(cx - 80, by - 220, cx - 30, by - 170); k.lineTo(cx - 50, by - 170); k.quadraticCurveTo(cx - 95, by - 230, cx - 88, by - 390); k.fill();
    k.fillStyle = '#5b3f0a'; k.fillRect(cx - 40, by - 24, 80, 10);
  },
  /** training ground: cones, a ball, a bag of balls, morning light */
  cones(k, R) {
    sky(k, '#1d3f73', '#4f86c2', '#8fbbe8', .42); pitchGround(k, H * .42, '#3f9a48', '#368a3f', 13);
    k.fillStyle = 'rgba(255,255,255,.35)'; k.fillRect(0, H * .45, W, 3);
    const cone = (x, y, s) => { k.fillStyle = 'rgba(0,0,0,.25)'; k.beginPath(); k.ellipse(x, y + 4 * s, 26 * s, 8 * s, 0, 0, 7); k.fill(); k.fillStyle = '#ff7a1a'; k.beginPath(); k.moveTo(x - 22 * s, y); k.lineTo(x + 22 * s, y); k.lineTo(x + 6 * s, y - 52 * s); k.lineTo(x - 6 * s, y - 52 * s); k.closePath(); k.fill(); k.fillStyle = '#fff'; k.fillRect(x - 13 * s, y - 28 * s, 26 * s, 6 * s); k.fillStyle = '#c2410c'; k.fillRect(x - 24 * s, y - 3 * s, 48 * s, 6 * s); };
    for (let i = 0; i < 7; i++) cone(W * .2 + i * W * .1, H * .62 + Math.sin(i) * 30 + i * 12, .7 + i * .09);
    const bx = W * .78, by = H * .84; k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(bx, by + 30, 50, 14, 0, 0, 7); k.fill();
    k.fillStyle = rad(k, bx - 14, by - 16, 4, 46, [[0, '#fff'], [1, '#c9ced4']]); k.beginPath(); k.arc(bx, by, 44, 0, 7); k.fill();
    k.fillStyle = '#111'; for (let i = 0; i < 5; i++) { const a = i * 1.257 - .4; k.beginPath(); k.arc(bx + Math.cos(a) * 24, by + Math.sin(a) * 24, 9, 0, 7); k.fill(); } k.beginPath(); k.arc(bx, by, 10, 0, 7); k.fill();
    k.fillStyle = rad(k, W * .85, H * .1, 0, 240, [[0, 'rgba(255,240,200,.5)'], [1, 'rgba(255,240,200,0)']]); k.fillRect(0, 0, W, H * .45);  // low sun
  },
  /** floodlit night match from outside the stand: beams in the mist */
  night(k, R) {
    k.fillStyle = lin(k, 0, 0, 0, H, [[0, '#02040c'], [1, '#0a1626']]); k.fillRect(0, 0, W, H); stars(k, R, 160, H * .5, .9);
    k.fillStyle = '#121a26'; k.beginPath(); k.moveTo(0, H * .66); k.lineTo(W * .12, H * .5); k.lineTo(W * .88, H * .5); k.lineTo(W, H * .66); k.lineTo(W, H); k.lineTo(0, H); k.fill();
    k.fillStyle = '#0d131c'; k.fillRect(W * .12, H * .5, W * .76, H * .5);
    for (let r = 0; r < 7; r++) { k.fillStyle = `rgba(255,236,200,${.05 + r * .012})`; k.fillRect(W * .14, H * .54 + r * 26, W * .72, 4); }
    [.22, .5, .78].forEach(f => floodlight(k, W * f, H * .18, H * .33, f < .5 ? 1 : f > .5 ? -1 : 0));
    k.fillStyle = rad(k, W * .5, H * .62, 0, W * .5, [[0, 'rgba(180,230,200,.35)'], [1, 'rgba(180,230,200,0)']]); k.fillRect(0, 0, W, H);
    k.fillStyle = lin(k, 0, H * .6, 0, H, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(200,220,255,.18)']]); k.fillRect(0, H * .6, W, H * .4);  // mist
  },
  /** map of the fictional football nations: coloured lands on a dark sea with routes between capitals */
  map(k, R) {
    k.fillStyle = lin(k, 0, 0, W, H, [[0, '#06192b'], [1, '#0b2a3d']]); k.fillRect(0, 0, W, H);
    k.strokeStyle = 'rgba(255,255,255,.06)'; k.lineWidth = 1; for (let x = 0; x < W; x += 64) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, H); k.stroke(); } for (let y = 0; y < H; y += 64) { k.beginPath(); k.moveTo(0, y); k.lineTo(W, y); k.stroke(); }
    const lands = [['#00a1de', .18, .5], ['#ce1126', .36, .36], ['#c60b1e', .2, .22], ['#1d4ed8', .5, .2], ['#003f87', .68, .18], ['#74acdf', .3, .72], ['#bc002d', .82, .5], ['#c8102e', .56, .56], ['#ffce00', .72, .72], ['#00843d', .88, .8]];
    const caps = [];
    lands.forEach(([c, fx, fy], i) => { const cx = W * fx, cy = H * fy, Rr = rnd(i * 7 + 1); k.fillStyle = c; k.globalAlpha = .55; k.beginPath(); for (let a = 0; a < 7; a += .25) { const r = 60 + Rr() * 50; const x = cx + Math.cos(a) * r * 1.3, y = cy + Math.sin(a) * r * .8; a ? k.lineTo(x, y) : k.moveTo(x, y); } k.closePath(); k.fill(); k.globalAlpha = 1; caps.push([cx, cy]); });
    k.strokeStyle = 'rgba(255,224,102,.5)'; k.setLineDash([6, 8]); k.lineWidth = 2; for (let i = 0; i < caps.length; i++) { const [a, b] = [caps[i], caps[(i + 3) % caps.length]]; k.beginPath(); k.moveTo(a[0], a[1]); k.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 60, b[0], b[1]); k.stroke(); } k.setLineDash([]);
    caps.forEach(([x, y]) => { k.fillStyle = '#ffe066'; k.beginPath(); k.arc(x, y, 6, 0, 7); k.fill(); k.strokeStyle = 'rgba(255,224,102,.5)'; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 14, 0, 7); k.stroke(); });
    k.fillStyle = '#ffe066'; k.font = "700 20px 'Barlow Condensed', sans-serif"; k.textAlign = 'center';
    [['Rwanda', .18, .5], ['Ghana Coast', .36, .36], ['Iberica', .2, .22], ['Albion', .5, .2], ['Nordland', .68, .18], ['Platania', .3, .72], ['Yamato', .82, .5], ['Saharan Union', .56, .56], ['Rhineland', .72, .72], ['Oceana', .88, .8]].forEach(([n, fx, fy]) => k.fillText(n, W * fx, H * fy - 22));
  },
};
export const ART_SCENES = Object.keys(SCENES);
/** Data URL of a scene (painted on first use). */
export function menuArt(name) {
  const key = SCENES[name] ? name : 'stadium';
  if (cache.has(key)) return cache.get(key);
  let url = '';
  try {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const k = c.getContext('2d');
    SCENES[key](k, rnd(ART_SCENES.indexOf(key) * 1013 + 17));
    url = c.toDataURL('image/jpeg', 0.82);
  } catch (e) { url = ''; }
  cache.set(key, url); return url;
}
/** Which scene each menu screen uses. */
export const ART_OF = { main: 'stadium', quick: 'tunnel', pre: 'tunnel', career: 'map', pc: 'boots', face: 'boots', tour: 'trophy', regional: 'trophy', pick: 'trophy', online: 'night', settings: 'night', ctl: 'night', cust: 'boots', stadiums: 'stadium', train: 'cones', plan: 'map', world: 'map' };
