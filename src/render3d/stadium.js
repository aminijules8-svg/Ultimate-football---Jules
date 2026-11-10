// Phase 3: parametric stadium (instanced seats, stepped tiers, roofs, tunnel, gantry, floodlights),
// instanced impostor crowd with a shader-driven state machine, animated ad boards, flags and dugouts.
import * as THREE from 'three';

export const HW = 52.5, HH = 34;

/** Stadium presets. Clubs point at one via stadiumFor(clubIndex). */
export const STADIUMS = [
  { id: 'lion-park', name: 'Lion Park', tiers: [{ rows: 14, rake: 0.42 }, { rows: 12, rake: 0.5 }], seat: ['#1d4ed8', '#1d4ed8', '#f8fafc', '#1d4ed8'], pattern: 'blocks', roof: 'cantilever', roofColor: '#4b5563', corners: 'open', capacity: 1.0, concrete: '#8a8f98', letters: 'LIONS', style: 'four-stand' },
  { id: 'umuhire-arena', name: 'Umuhire Arena', tiers: [{ rows: 12, rake: 0.4 }, { rows: 12, rake: 0.48 }, { rows: 10, rake: 0.55 }], seat: ['#0f766e', '#0f766e', '#99f6e4', '#0f766e'], pattern: 'waves', roof: 'ring', roofColor: '#e5e7eb', corners: 'filled', capacity: 1.0, style: 'multi-tier', concrete: '#9aa0a8', letters: 'UMUHIRE' },
  { id: 'capital-dome', name: 'Capital Dome', tiers: [{ rows: 16, rake: 0.45 }, { rows: 14, rake: 0.52 }], seat: ['#b91c1c', '#f8fafc', '#b91c1c', '#111827'], pattern: 'stripes', roof: 'ring', roofColor: '#374151', corners: 'filled', capacity: 1.0, concrete: '#6b7280', letters: 'CAPITAL', style: 'arena' },
  { id: 'red-valley', name: 'Red Valley Ground', tiers: [{ rows: 12, rake: 0.38 }], seat: ['#dc2626', '#dc2626', '#fbbf24', '#dc2626'], pattern: 'blocks', roof: 'main-only', roofColor: '#7f1d1d', corners: 'open', capacity: 0.85, concrete: '#94a3b8', letters: 'VALLEY', style: 'compact' },
  { id: 'horizon', name: 'Horizon Stadium', tiers: [{ rows: 13, rake: 0.42 }, { rows: 15, rake: 0.5 }], seat: ['#0369a1', '#38bdf8', '#0369a1', '#e0f2fe'], pattern: 'gradient', roof: 'cantilever', roofColor: '#cbd5e1', corners: 'filled', capacity: 1.0, concrete: '#a1a1aa', letters: 'HORIZON', style: 'oval' },
  { id: 'eastland', name: 'Eastland Park', tiers: [{ rows: 10, rake: 0.36 }, { rows: 10, rake: 0.46 }], seat: ['#15803d', '#15803d', '#fef08a', '#15803d'], pattern: 'blocks', roof: 'main-only', roofColor: '#14532d', corners: 'open', capacity: 0.9, concrete: '#8b8f96', letters: 'EASTLAND', style: 'bowl' },
];
/** Architectural styles (Phase 18): stand layout, corner treatment, roof, floodlight placement, screens, tunnel side.
 *  A style sets the shape; the preset keeps its colours, tiers (within the style's limits) and capacity. */
export const STYLES = {
  'four-stand': { name: 'Four-stand ground', desc: 'Four separate stands with open corners, floodlight masts', ends: 'stands', corners: 'open', lights: 'masts', screen: 'end', roof: null },
  arena: { name: 'Modern arena', desc: 'Rectangular bowl, filled corners, one continuous roof with lights on its edge', ends: 'stands', corners: 'filled', lights: 'roof', screen: 'both', roof: 'ring' },
  oval: { name: 'Enclosed oval', desc: 'Angled corner stands close the bowl, continuous roof', ends: 'stands', corners: 'segments', lights: 'roof', screen: 'both', roof: 'ring' },
  bowl: { name: 'Open-air bowl', desc: 'One low tier all the way round, no roof, masts', ends: 'stands', corners: 'segments', lights: 'masts', screen: 'end', roof: 'none', tiersMax: 1 },
  compact: { name: 'Compact two-stand ground', desc: 'Two side stands, low terraces behind the goals', ends: 'terrace', corners: 'open', lights: 'masts', screen: 'none', roof: 'main-only' },
  'multi-tier': { name: 'International multi-tier', desc: 'Three tiers, filled corners, continuous roof, big screens at both ends', ends: 'stands', corners: 'filled', lights: 'roof', screen: 'both', roof: 'ring', tiersMin: 3 },
};
export const STYLE_LIST = Object.entries(STYLES).map(([id, s]) => [id, s.name]);
/** The preset as the style shapes it (roof type, corners, tier count, tunnel side). */
export function styledPreset(P) {
  const S = STYLES[P.style] || STYLES['four-stand'], E = Object.assign({}, P, { style: P.style || 'four-stand', corners: S.corners, lights: S.lights, screen: S.screen, tunnel: P.tunnel || 'south' });
  if (S.roof) E.roof = S.roof;
  let tiers = (P.tiers || []).map(t => Object.assign({}, t));
  if (S.tiersMax && tiers.length > S.tiersMax) tiers = tiers.slice(0, S.tiersMax);
  while (S.tiersMin && tiers.length < S.tiersMin) tiers.push({ rows: 10, rake: Math.min(0.6, (tiers[tiers.length - 1] || { rake: 0.4 }).rake + 0.07) });
  E.tiers = tiers; return E;
}
export const stadiumFor = clubIndex => STADIUMS[[0, 1, 3, 2, 4, 2, 0, 5][clubIndex % 8] % STADIUMS.length];

const tex = (w, h, draw, opts = {}) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d'); draw(k, w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (opts.repeat) t.repeat.set(...opts.repeat); return t; };

// ---------------------------------------------------------------- crowd sprite sheet -------------
// 6 outfits x 8 poses (0-3 seated variants, 4-7 standing/arms-up variants). Each cell 64x128.
let crowdSheet = null;
function crowdSpriteSheet() {
  if (crowdSheet) return crowdSheet;
  const cols = 8, rows = 6, cw = 64, ch = 128;
  const skins = ['#f1c27d', '#c68642', '#8d5524', '#5c3a21', '#e0ac69', '#3b2417'];
  const shirts = ['#1d4ed8', '#dc2626', '#f8fafc', '#111827', '#f59e0b', '#15803d', '#7c3aed', '#0ea5e9', '#e5e7eb', '#9333ea'];
  crowdSheet = tex(cols * cw, rows * ch, (k) => {
    k.clearRect(0, 0, cols * cw, rows * ch);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = c * cw, y0 = r * ch, standing = c >= 4, arms = c >= 6, skin = skins[(r * 3 + c) % skins.length], shirt = shirts[(r * 5 + c * 3) % shirts.length], hair = ['#14100c', '#2b1d12', '#4a3322', '#c9a65a', '#0a0a0a'][(r + c) % 5];
      const cx = x0 + cw / 2, headR = 9 + rnd() * 2, bodyTop = standing ? y0 + 36 : y0 + 52, hipY = standing ? y0 + 92 : y0 + 100;
      // legs (standing) or lap (seated)
      k.fillStyle = '#1f2937'; if (standing) { k.fillRect(cx - 11, hipY, 9, ch - (hipY - y0) - 4); k.fillRect(cx + 2, hipY, 9, ch - (hipY - y0) - 4); } else { k.fillRect(cx - 14, hipY - 6, 28, 16); }
      // torso
      k.fillStyle = shirt; k.beginPath(); k.moveTo(cx - 15, bodyTop + 6); k.lineTo(cx + 15, bodyTop + 6); k.lineTo(cx + 13, hipY); k.lineTo(cx - 13, hipY); k.closePath(); k.fill();
      // arms
      k.strokeStyle = skin; k.lineWidth = 6; k.lineCap = 'round'; k.beginPath();
      if (arms) { k.moveTo(cx - 13, bodyTop + 10); k.lineTo(cx - 22 - rnd() * 4, bodyTop - 26); k.moveTo(cx + 13, bodyTop + 10); k.lineTo(cx + 22 + rnd() * 4, bodyTop - 26); }
      else { k.moveTo(cx - 13, bodyTop + 10); k.lineTo(cx - 17, bodyTop + 40); k.moveTo(cx + 13, bodyTop + 10); k.lineTo(cx + 17, bodyTop + 40); }
      k.stroke();
      // head + hair
      k.fillStyle = skin; k.beginPath(); k.arc(cx, bodyTop - headR + 2, headR, 0, 7); k.fill();
      k.fillStyle = hair; k.beginPath(); k.arc(cx, bodyTop - headR, headR, Math.PI, 0); k.fill();
      // scarf / flag accents occasionally
      if (rnd() < 0.25) { k.fillStyle = shirts[(r * 7 + c) % shirts.length]; k.fillRect(cx - 14, bodyTop + 4, 28, 5); }
    }
  }, { clamp: true });
  crowdSheet.minFilter = THREE.LinearMipmapLinearFilter; crowdSheet.generateMipmaps = true;
  return crowdSheet;
}

// ---------------------------------------------------------------- stand geometry -----------------
/** Builds one stand along the +Z side centred at origin, length L (x), starting at distance d0 from the pitch centre line (z). Returns group + seat anchors. */
function buildStand(P, L, d0, { tunnel = false, gantry = false } = {}) {
  const g = new THREE.Group(); const anchors = []; // {x, y, z, row, tier}
  const concrete = new THREE.MeshStandardMaterial({ color: P.concrete, roughness: 0.95 });
  let z = d0, y = 0.6, tierIndex = 0;
  const stepD = 0.8, seatW = 0.52;
  for (const tier of P.tiers) {
    // stepped tier as one geometry (tread + riser per row)
    const pos = [], idx = []; const rows = tier.rows, rise = tier.rake * stepD;
    const push = (x, yy, zz) => { pos.push(x, yy, zz); return pos.length / 3 - 1; };
    for (let r = 0; r <= rows; r++) {
      const zr = z + r * stepD, yr = y + r * rise;
      const a = push(-L / 2, yr, zr), b = push(L / 2, yr, zr), c = push(L / 2, yr, zr + stepD), d = push(-L / 2, yr, zr + stepD);
      idx.push(a, b, c, a, c, d); // tread
      const e = push(-L / 2, yr + rise, zr + stepD), f = push(L / 2, yr + rise, zr + stepD);
      idx.push(d, c, f, d, f, e); // riser
    }
    // front wall of the tier
    const w0 = push(-L / 2, 0, z), w1 = push(L / 2, 0, z), w2 = push(L / 2, y, z), w3 = push(-L / 2, y, z); idx.push(w0, w1, w2, w0, w2, w3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, concrete); mesh.receiveShadow = true; mesh.castShadow = false; g.add(mesh);
    // railing at the tier front
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.6, roughness: 0.4 })); rail.position.set(0, y + 1.0, z - 0.05); g.add(rail);
    for (let i = -L / 2; i <= L / 2; i += 4) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), rail.material); post.position.set(i, y + 0.5, z - 0.05); g.add(post); }
    // seat anchors (skip the tunnel mouth and a central aisle)
    const nSeats = Math.floor(L / seatW);
    for (let r = 0; r < rows; r++) for (let i = 0; i < nSeats; i++) {
      const x = -L / 2 + seatW * (i + 0.5);
      if (tunnel && tierIndex === 0 && r < 4 && Math.abs(x) < 3.5) continue;
      if (Math.abs(x) < 0.5 || (Math.abs(Math.abs(x) - L / 4) < 0.5)) continue; // aisles
      anchors.push({ x, y: y + r * rise + rise, z: z + r * stepD + stepD * 0.55, row: r, tier: tierIndex, i });
    }
    // vomitory openings between tiers
    z += rows * stepD; y += rows * rise;
    if (tierIndex < P.tiers.length - 1) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(L, 2.2, 1.6), concrete); wall.position.set(0, y + 1.1, z + 0.8); g.add(wall);
      for (let i = -L / 2 + 8; i < L / 2 - 4; i += 16) { const vom = new THREE.Mesh(new THREE.BoxGeometry(3, 2.0, 1.7), new THREE.MeshStandardMaterial({ color: 0x0b0f14 })); vom.position.set(i, y + 1.0, z + 0.8); g.add(vom); }
      z += 1.6; y += 2.2;
    }
    tierIndex++;
  }
  // back wall + roof
  const back = new THREE.Mesh(new THREE.BoxGeometry(L + 2, y + 3, 1.2), concrete); back.position.set(0, (y + 3) / 2, z + 0.6); g.add(back);
  if (P.roof !== 'none') {
    const depth = z - d0 + 6, roofMat = new THREE.MeshStandardMaterial({ color: P.roofColor, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(L + 2, 0.5, depth), roofMat); roof.position.set(0, y + 6.5, d0 + depth / 2 - 2); roof.rotation.x = -0.08; roof.castShadow = true; g.add(roof);
    for (let i = -L / 2; i <= L / 2; i += L / 6) { const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, y + 7, 8), concrete); pil.position.set(i, (y + 7) / 2, z + 1.4); g.add(pil); }
    // underside lighting strip (emissive) for evening presets
    const strip = new THREE.Mesh(new THREE.BoxGeometry(L, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0xfff6d5, emissive: 0xfff1c0, emissiveIntensity: 1.5 })); strip.position.set(0, y + 6.1, d0 + 1); g.add(strip); g.userData.strip = strip;
    if (P.lights === 'roof') { const lamps = new THREE.Mesh(new THREE.BoxGeometry(L - 4, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 2 })); lamps.position.set(0, y + 6.2, d0 - 1.2); lamps.rotation.x = 0.5; g.add(lamps); g.userData.lamps = [lamps]; }
  }
  if (tunnel) {
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.5), new THREE.MeshStandardMaterial({ color: 0x05070a })); mouth.position.set(0, 1.3, d0 + 1.2); g.add(mouth);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xe5e7eb })); frame.position.set(0, 1.6, d0 - 0.1); g.add(frame);
    // inflatable-style tunnel canopy
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 12, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf3f4f6, side: THREE.DoubleSide })); canopy.rotation.z = Math.PI / 2; canopy.rotation.y = Math.PI / 2; canopy.position.set(0, 0.2, d0 - 2.5); g.add(canopy);
  }
  if (gantry) {
    const plat = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3), concrete); plat.position.set(0, y - 1.5, z - 4); g.add(plat);
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: 0x111827 })); cam.position.set(0, y - 0.9, z - 4.4); g.add(cam);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 3), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.4 })); cab.position.set(0, y - 0.1, z - 1.8); g.add(cab); // press box glass
  }
  return { group: g, anchors, depth: z - d0, height: y };
}

// ---------------------------------------------------------------- seats + crowd instancing -------
function seatColor(P, a, L) {
  const pal = P.seat.map(c => new THREE.Color(c)), n = pal.length;
  switch (P.pattern) {
    case 'stripes': return pal[Math.floor((a.x + L / 2) / 6) % n];
    case 'waves': return pal[Math.floor((Math.sin(a.x * 0.12) * 3 + a.row * 0.4)) & 1 ? 2 : 0];
    case 'gradient': return pal[Math.min(n - 1, Math.floor(a.row / 5))];
    default: return pal[((Math.floor((a.x + L / 2) / 10) + a.tier) % 2) ? 0 : 2];
  }
}
function placeInstances(scn, stands, P, gq, crowdFrac = null, seatFrac = null) {
  const seatGeo = new THREE.BoxGeometry(0.44, 0.08, 0.42); seatGeo.translate(0, 0.25, 0);
  const backGeo = new THREE.BoxGeometry(0.44, 0.4, 0.06); backGeo.translate(0, 0.45, 0.2);
  // merge seat + backrest into one geometry
  const merged = new THREE.BufferGeometry(); const pos = [], nor = [], idx = [];
  for (const g of [seatGeo, backGeo]) { const base = pos.length / 3; const p = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); } const ii = g.index; for (let i = 0; i < ii.count; i++) idx.push(ii.getX(i) + base); }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); merged.setIndex(idx);
  const all = []; for (const s of stands) for (const a of s.anchors) all.push({ a, s });
  const seatStep = seatFrac != null ? Math.max(1, Math.round(1 / Math.max(0.1, seatFrac))) : (gq >= 2 ? 1 : gq === 1 ? 2 : 4); const seatList = all.filter((_, i) => i % seatStep === 0);
  const seats = new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }), seatList.length);
  seats.castShadow = false; seats.receiveShadow = false; seats.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), e = new THREE.Euler(), sc = new THREE.Vector3(seatStep > 1 ? Math.sqrt(seatStep) : 1, 1, 1), c = new THREE.Color();
  seatList.forEach(({ a, s }, i) => { v.set(a.x, a.y, a.z).applyMatrix4(s.group.matrixWorld); e.set(0, s.yaw, 0); q.setFromEuler(e); m.compose(v, q, sc); seats.setMatrixAt(i, m); seats.setColorAt(i, c.copy(seatColor(s.P, a, s.L))); });
  seats.instanceMatrix.needsUpdate = true; seats.instanceColor.needsUpdate = true; scn.add(seats);
  // crowd impostors: occupy a fraction of seats; shader bob + stand-up controlled by uniforms
  const occ = all.filter(() => Math.random() < P.capacity * 0.88); const crowdStep = crowdFrac != null ? Math.max(1, Math.round(1 / Math.max(0.1, crowdFrac))) : (gq >= 2 ? 1 : gq === 1 ? 2 : 3); const crowdList = occ.filter((_, i) => i % crowdStep === 0);
  const cardGeo = new THREE.PlaneGeometry(0.62, 1.24); cardGeo.translate(0, 0.62, 0);
  const sheet = crowdSpriteSheet();
  const crowdMat = new THREE.MeshLambertMaterial({ map: sheet, alphaTest: 0.5, side: THREE.DoubleSide });
  const uniforms = { uTime: { value: 0 }, uExcite: { value: 0.2 }, uStand: { value: 0 } };
  crowdMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uExcite = uniforms.uExcite; sh.uniforms.uStand = uniforms.uStand;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aCrowd; // phase, outfit row, speed\nvarying vec2 vCell;\nuniform float uTime, uExcite, uStand;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n// cell: pose column from excitement, outfit row from attribute\nfloat standing = step(0.5, uStand + uExcite * 0.6 + sin(aCrowd.x * 7.0) * 0.25);\nfloat col = floor(mod(aCrowd.x * 13.0, 4.0)) + 4.0 * standing;\nif (standing > 0.5 && uExcite > 0.7 && sin(aCrowd.x * 3.0) > 0.0) col = 6.0 + floor(mod(aCrowd.x * 5.0, 2.0));\nvCell = vec2(col, aCrowd.y);\nvMapUv = (vMapUv + vCell) / vec2(8.0, 6.0);')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat bob = sin(uTime * (3.0 + aCrowd.z * 4.0) + aCrowd.x * 20.0) * (0.03 + uExcite * 0.16) * (0.4 + standing);\ntransformed.y += max(0.0, bob) + standing * 0.18;');
  };
  const crowd = new THREE.InstancedMesh(cardGeo, crowdMat, crowdList.length); crowd.frustumCulled = false; crowd.castShadow = false;
  const attr = new Float32Array(crowdList.length * 3);
  crowdList.forEach(({ a, s }, i) => { v.set(a.x, a.y + 0.05, a.z - 0.05).applyMatrix4(s.group.matrixWorld); e.set(0, s.yaw + (Math.random() - 0.5) * 0.3, 0); q.setFromEuler(e); sc.set(0.9 + Math.random() * 0.2, 0.92 + Math.random() * 0.16, 1); m.compose(v, q, sc); crowd.setMatrixAt(i, m); attr[i * 3] = Math.random(); attr[i * 3 + 1] = Math.floor(Math.random() * 6); attr[i * 3 + 2] = Math.random(); });
  cardGeo.setAttribute('aCrowd', new THREE.InstancedBufferAttribute(attr, 3));
  crowd.instanceMatrix.needsUpdate = true; scn.add(crowd);
  return { seats, crowd, uniforms, counts: { seats: seatList.length, crowd: crowdList.length } };
}

// ---------------------------------------------------------------- ad boards, flags, dugouts ------
export const SPONSORS = [['KIGALI AIR', '#0b3d91'], ['MOUNTAIN COFFEE', '#b91c1c'], ['UMUHIRE BANK', '#065f46'], ['LIONS ENERGY', '#92400e'], ['CAPITAL MOTORS', '#4c1d95'], ['NYANZA DAIRY', '#1e40af'], ['AKAGERA TOURS', '#166534'], ['VOLCANO TELECOM', '#9a3412'], ['HORIZON FOODS', '#0f766e'], ['RED VALLEY TYRES', '#7f1d1d']];
function buildAdBoards(scn) {
  const n = SPONSORS.length, t = tex(256 * n, 64, (k) => { SPONSORS.forEach(([name, col], i) => { k.fillStyle = col; k.fillRect(i * 256, 0, 256, 64); k.fillStyle = '#fff'; k.font = 'bold 26px system-ui, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(name, i * 256 + 128, 33); }); });
  t.repeat.set(117 / 8 / n, 1); // one sponsor every 8 m
  const mat = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35, roughness: 0.4 });
  const boards = [];
  for (const s of [-1, 1]) {
    let m = new THREE.Mesh(new THREE.BoxGeometry(117, 1.0, 0.18), mat); m.position.set(0, 0.5, s * (HH + 2.6)); m.rotation.x = s * -0.12; scn.add(m); boards.push(m);
    const t2 = t.clone(); t2.repeat.set(76 / 8 / n, 1); t2.needsUpdate = true;
    m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 76), new THREE.MeshStandardMaterial({ map: t2, emissive: 0xffffff, emissiveMap: t2, emissiveIntensity: 0.35, roughness: 0.4 })); m.position.set(s * (HW + 4.6), 0.5, 0); scn.add(m); boards.push(m);
  }
  return { boards, update(dt) { t.offset.x = (t.offset.x + dt * 0.02) % 1; boards.forEach(b => { if (b.material.map !== t) b.material.map.offset.x = t.offset.x; }); } };
}
function buildFlags(scn, P, standHeight) {
  const g = new THREE.Group(); const mats = [];
  const flagTex = (c1, c2, letter) => tex(128, 80, (k, w, h) => { k.fillStyle = c1; k.fillRect(0, 0, w, h); k.fillStyle = c2; k.fillRect(0, h / 3, w, h / 3); k.fillStyle = '#fff'; k.font = 'bold 44px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(letter, w / 2, h / 2 + 2); }, { clamp: true });
  const uniforms = { uTime: { value: 0 } };
  for (let i = 0; i < 10; i++) {
    const x = -50 + i * 11, mat = new THREE.MeshLambertMaterial({ map: flagTex(P.seat[0], P.seat[2], P.letters[i % P.letters.length]), side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => { sh.uniforms.uTime = uniforms.uTime; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat k = (position.x + 0.8) / 1.6;\ntransformed.z += sin(uTime * 4.0 + k * 6.0 + float(gl_VertexID % 7)) * 0.12 * k;\ntransformed.y += sin(uTime * 3.0 + k * 4.0) * 0.04 * k;'); };
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0, 12, 6), mat); flag.position.set(x + 0.8, standHeight + 7.6, -(HH + 9)); g.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd })); pole.position.set(x, standHeight + 7.4, -(HH + 9)); g.add(pole);
    mats.push(mat);
  }
  scn.add(g); return { group: g, update(dt) { uniforms.uTime.value += dt; } };
}
export function buildDugouts(scn, P) {
  const out = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); const x = s * 15, z = HH + 4.4;
    const back = new THREE.Mesh(new THREE.BoxGeometry(9.5, 2.3, 0.2), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })); back.position.set(0, 1.15, 1.1); g.add(back);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.12, 2.6), new THREE.MeshStandardMaterial({ color: 0x9ec5ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2 })); roof.position.set(0, 2.3, 0.1); g.add(roof);
    for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.3, 2.4), back.material); side.position.set(sx * 4.8, 1.15, 0); g.add(side); }
    const bench = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: P.seat[0] })); bench.position.set(0, 0.46, 0.6); g.add(bench);
    for (let i = 0; i < 8; i++) { const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), bench.material); seat.position.set(-3.85 + i * 1.1, 0.75, 0.9); g.add(seat); }
    // technical area markings (dashed white box on the grass)
    const ta = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.1, 4), new THREE.MeshBasicMaterial({ visible: false })); g.add(ta);
    g.position.set(x, 0, z); scn.add(g);
    out.push({ group: g, x, z, seatPositions: Array.from({ length: 8 }, (_, i) => [x - 3.85 + i * 1.1, z + 0.6]), managerPos: [x - 6 * s, HH + 1.6] });
  }
  return out;
}
function buildFloodlights(scn, standHeight) {
  const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0x8b8f96, metalness: 0.5, roughness: 0.5 });
  for (const s of [-1, 1]) for (const z of [-1, 1]) {
    const x = s * (HW + 16), zz = z * (HH + 14), h = standHeight + 22;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, h, 8), mat); pole.position.set(x, h / 2, zz); g.add(pole);
    const head = new THREE.Group(); head.position.set(x, h + 1, zz); head.lookAt(0, 0, 0);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 0.4), mat); head.add(frame);
    const lamps = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.8, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 2 })); lamps.position.z = 0.3; head.add(lamps);
    g.add(head); g.userData.lamps = (g.userData.lamps || []).concat(lamps);
  }
  scn.add(g); return g;
}

// ---------------------------------------------------------------- main -------------------------
/** Build a stadium. Returns an object with update(dt, excite, standing) and dispose(). */
export function buildStadium(scn, preset, { gq = 2, crowd = null, seats = null } = {}) {
  const P0 = typeof preset === 'string' ? STADIUMS.find(s => s.id === preset) || STADIUMS[0] : preset || STADIUMS[0], P = styledPreset(P0), S = STYLES[P.style];
  const root = new THREE.Group(); root.name = 'stadium:' + P.id; scn.add(root);
  const stands = [];
  const add = (L, d0, yaw, pos, opts, PP = P) => { const st = buildStand(PP, L, d0, opts); st.group.rotation.y = yaw; st.group.position.copy(pos); st.group.updateMatrixWorld(true); st.yaw = yaw; st.L = L; st.P = PP; root.add(st.group); stands.push(st); return st; };
  // north (main stand, camera side, -z), south (+z), east/west ends; the tunnel sits in the south stand unless the preset says north
  const north = P.tunnel === 'north', O = new THREE.Vector3(0, 0, 0);
  const main = add(117, HH + 7.5, Math.PI, O, { gantry: true, tunnel: north });
  add(117, HH + 7.5, 0, O, { tunnel: !north });
  if (S.ends === 'terrace') { const T = Object.assign({}, P, { tiers: [{ rows: 5, rake: 0.3 }], roof: 'none', lights: 'masts' }); add(80, HW + 7.5, Math.PI / 2, O, {}, T); add(80, HW + 7.5, -Math.PI / 2, O, {}, T); }
  else { add(80, HW + 7.5, Math.PI / 2, O); add(80, HW + 7.5, -Math.PI / 2, O); }
  if (P.corners === 'filled') {
    const concrete = new THREE.MeshStandardMaterial({ color: P.concrete, roughness: 0.95 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(main.depth + 2, main.height + 3, main.depth + 2), concrete); c.position.set(sx * (HW + 7.5 + main.depth / 2), (main.height + 3) / 2, sz * (HH + 7.5 + main.depth / 2)); root.add(c); }
  } else if (P.corners === 'segments') {
    // angled corner stands close the bowl: their front line passes through the corner of the four straight stands
    const d = (HW + 7.5 + HH + 7.5) / Math.SQRT2 + 4;
    for (const yaw of [Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4]) add(34, d, yaw, O, {}, Object.assign({}, P, { roof: P.roof === 'none' ? 'none' : 'ring' }));
  }
  if (S.screen !== 'none') {
    const ends = S.screen === 'both' ? [1, -1] : [1], east = stands[2], sh = east.height + 3;
    for (const sx of ends) { const scr = new THREE.Group(); scr.position.set(sx * (HW + 7.5 + east.depth - 1), sh + 5, 0); scr.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      scr.add(new THREE.Mesh(new THREE.BoxGeometry(18, 9.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4, metalness: 0.5 })));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(16.6, 8.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x1d3a6b, emissiveIntensity: 0.9, roughness: 0.2 })); glass.position.z = 0.5; scr.add(glass);
      for (const px of [-7, 7]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x4b5563 })); leg.position.set(px, -7, 0); scr.add(leg); }
      root.add(scr); }
  }
  const inst = placeInstances(root, stands, P, gq, crowd, seats);
  const ads = buildAdBoards(root);
  const flags = buildFlags(root, P, main.height);
  const dugouts = buildDugouts(root, P);
  const lights = P.lights === 'roof' ? (() => { const g = new THREE.Group(); g.userData.lamps = stands.flatMap(s => s.group.userData.lamps || []); root.add(g); return g; })() : buildFloodlights(root, main.height);
  let t = 0;
  return {
    root, P, stands, dugouts, counts: inst.counts, name: P.name,
    update(dt, excite = 0.2, standing = 0) { t += dt; inst.uniforms.uTime.value = t; inst.uniforms.uExcite.value += (excite - inst.uniforms.uExcite.value) * Math.min(1, dt * 3); inst.uniforms.uStand.value = standing; ads.update(dt); flags.update(dt); },
    setNight(on) { lights.userData.lamps.forEach(l => { l.material.emissiveIntensity = on ? 3 : 0.15; }); stands.forEach(s => { if (s.group.userData.strip) s.group.userData.strip.material.emissiveIntensity = on ? 1.5 : 0; }); },
    dispose() { scn.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); },
  };
}
