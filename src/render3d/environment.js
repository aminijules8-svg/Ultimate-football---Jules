// Phase 2: lighting presets, colour management, pitch material, ball, nets, rain, sky dome,
// contact shadows and (optional) ambient occlusion for the 3D match view.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const HW = 52.5, HH = 34;
export const WEATHER_NAMES = ['Day', 'Overcast', 'Sunset', 'Evening', 'Night', 'Rain'];
export const isRain = wx => wx === 5;
export const isDark = wx => wx >= 3;
/** old 4-entry weather index (Clear/Evening/Night/Rain) -> new index */
export const migrateWeather = old => [0, 3, 4, 5][old] ?? 0;

// Lighting presets. Intensities are physical (three >= r155): sun in "lux-ish" units, points in candela.
const PRESETS = [
  { name: 'Day', sky: 0x7fb8ef, horizon: 0xcfe3f5, fog: [160, 560], sun: { col: 0xfff2dc, i: 2.9, dir: [0.5, 0.78, 0.38] }, hemi: { sky: 0xbfd8ff, ground: 0x3d6b3a, i: 0.42 }, amb: 0.16, exposure: 0.95, flood: 0, wet: 0 },
  { name: 'Overcast', sky: 0x8f9bab, horizon: 0xc9d0d8, fog: [120, 420], sun: { col: 0xe4ebf2, i: 1.1, dir: [0.15, 0.95, 0.1] }, hemi: { sky: 0xc8d0d8, ground: 0x44604a, i: 0.62 }, amb: 0.3, exposure: 0.9, flood: 0, wet: 0.15 },
  { name: 'Sunset', sky: 0x4a5a8a, horizon: 0xf2a65a, fog: [140, 480], sun: { col: 0xffb26b, i: 2.2, dir: [0.9, 0.3, 0.35] }, hemi: { sky: 0xffcf9a, ground: 0x3a4a3a, i: 0.3 }, amb: 0.12, exposure: 0.95, flood: 0.35, wet: 0 },
  { name: 'Evening', sky: 0x1c2744, horizon: 0x5a6a8a, fog: [120, 420], sun: { col: 0xe8eeff, i: 1.2, dir: [0.35, 0.9, 0.25] }, hemi: { sky: 0x3a4a6a, ground: 0x203a28, i: 0.16 }, amb: 0.06, exposure: 0.95, flood: 1, wet: 0 },
  { name: 'Night', sky: 0x060a1c, horizon: 0x1a2440, fog: [110, 380], sun: { col: 0xdce6ff, i: 0.95, dir: [0.25, 0.92, 0.2] }, hemi: { sky: 0x1a2340, ground: 0x12221a, i: 0.09 }, amb: 0.04, exposure: 0.92, flood: 1, wet: 0 },
  { name: 'Rain', sky: 0x5f6b7a, horizon: 0x9aa5b1, fog: [90, 300], sun: { col: 0xd8e0e8, i: 0.85, dir: [0.1, 0.95, 0.15] }, hemi: { sky: 0xa0aab6, ground: 0x3a5040, i: 0.5 }, amb: 0.26, exposure: 0.85, flood: 0.5, wet: 1 },
];

const tex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d'); draw(k, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = opts.aniso || 8; if (opts.repeat) t.repeat.set(...opts.repeat);
  return t;
};
// value noise helpers for procedural textures (deterministic)
function noise2(seed) {
  const r = i => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), h = (a, b) => r(a * 57 + b * 131);
    return (h(xi, yi) * (1 - sx) + h(xi + 1, yi) * sx) * (1 - sy) + (h(xi, yi + 1) * (1 - sx) + h(xi + 1, yi + 1) * sx) * sy; };
}
/** height canvas -> tangent-space normal map canvas texture */
function normalFromHeight(size, heightFn, strength = 2) {
  return tex(size, size, (k, w, h) => {
    const img = k.createImageData(w, h); const d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const hl = heightFn((x - 1 + w) % w, y), hr = heightFn((x + 1) % w, y), hu = heightFn(x, (y - 1 + h) % h), hd = heightFn(x, (y + 1) % h);
      let nx = (hl - hr) * strength, ny = (hu - hd) * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * w + x) * 4; d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    k.putImageData(img, 0, 0);
  }, { data: true });
}

// ---------------------------------------------------------------- pitch --------------------------
export function buildPitch(scn) {
  const W = 2048, H = Math.round(2048 * 80 / 117); const M = W / 117, PX = x => W / 2 + x * M, PY = y => H / 2 + y * M;
  const n1 = noise2(3), n2 = noise2(7);
  const albedo = tex(W, H, (k) => {
    // base + mow stripes with a soft gradient inside each stripe (directional grass)
    k.fillStyle = '#276f31'; k.fillRect(0, 0, W, H);
    for (let i = 0; i < 21; i++) {
      const x0 = PX(-HW + i * 5), w = 5 * M + 1, light = i % 2 === 0;
      const g = k.createLinearGradient(x0, 0, x0 + w, 0);
      if (light) { g.addColorStop(0, '#318a3c'); g.addColorStop(0.5, '#348f3f'); g.addColorStop(1, '#2e8238'); }
      else { g.addColorStop(0, '#256f30'); g.addColorStop(0.5, '#287834'); g.addColorStop(1, '#246a2e'); }
      k.fillStyle = g; k.fillRect(x0, PY(-HH), w, HH * 2 * M);
    }
    // low-frequency colour variation (patches of lusher / drier grass)
    const img = k.getImageData(0, 0, W, H), d = img.data;
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
      const v = (n1(x / 160, y / 160) - 0.5) * 0.16 + (n2(x / 37, y / 37) - 0.5) * 0.10, i = (y * W + x) * 4;
      d[i] = Math.max(0, Math.min(255, d[i] * (1 + v * 0.9))); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * (1 + v))); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * (1 + v * 0.6)));
    }
    k.putImageData(img, 0, 0);
    // fine grain
    for (let i = 0; i < 26000; i++) { k.fillStyle = Math.random() < 0.5 ? 'rgba(0,30,0,.10)' : 'rgba(200,255,160,.07)'; k.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 2 + Math.random() * 6); }
    // wear: goalmouths, penalty spots, centre circle
    const wear = (x, y, rx, ry, a) => { const g = k.createRadialGradient(PX(x), PY(y), 0, PX(x), PY(y), rx * M); g.addColorStop(0, `rgba(120,96,50,${a})`); g.addColorStop(0.6, `rgba(120,110,60,${a * 0.5})`); g.addColorStop(1, 'rgba(120,110,60,0)'); k.fillStyle = g; k.save(); k.translate(PX(x), PY(y)); k.scale(1, ry / rx); k.translate(-PX(x), -PY(y)); k.fillRect(PX(x) - rx * M, PY(y) - ry * M * (rx / ry), rx * M * 2, ry * M * 2 * (rx / ry)); k.restore(); };
    for (const s of [-1, 1]) { wear(s * (HW - 2.5), 0, 6, 5, 0.45); wear(s * (HW - 11), 0, 2.2, 2.2, 0.35); }
    wear(0, 0, 4, 4, 0.22);
    // line markings (0.12 m)
    k.strokeStyle = 'rgba(255,255,255,.96)'; k.fillStyle = '#fff'; k.lineWidth = 0.12 * M; k.lineCap = 'butt';
    k.strokeRect(PX(-HW), PY(-HH), HW * 2 * M, HH * 2 * M);
    k.beginPath(); k.moveTo(PX(0), PY(-HH)); k.lineTo(PX(0), PY(HH)); k.stroke();
    k.beginPath(); k.arc(PX(0), PY(0), 9.15 * M, 0, 7); k.stroke(); k.beginPath(); k.arc(PX(0), PY(0), 0.15 * M, 0, 7); k.fill();
    for (const s of [-1, 1]) {
      k.strokeRect(PX(s > 0 ? HW - 16.5 : -HW), PY(-20.15), 16.5 * M, 40.3 * M); k.strokeRect(PX(s > 0 ? HW - 5.5 : -HW), PY(-9.16), 5.5 * M, 18.32 * M);
      k.beginPath(); k.arc(PX(s * (HW - 11)), PY(0), 9.15 * M, s > 0 ? Math.PI - 0.93 : -0.93, s > 0 ? Math.PI + 0.93 : 0.93); k.stroke();
      k.beginPath(); k.arc(PX(s * (HW - 11)), PY(0), 0.15 * M, 0, 7); k.fill();
      for (const z of [-1, 1]) { k.beginPath(); k.arc(PX(s * HW), PY(z * HH), 1 * M, 0, 7); k.stroke(); }
    }
  }, { clamp: true, aniso: 16 });
  const nz = noise2(11);
  const normal = normalFromHeight(256, (x, y) => nz(x / 6, y / 6) * 0.6 + nz(x / 1.7, y / 1.7) * 0.4 + (Math.sin(x * 1.3 + y * 0.4) * 0.5 + 0.5) * 0.08, 2.2);
  normal.repeat.set(60, 41);
  const rough = tex(256, 256, (k, w, h) => { const img = k.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 200 + (nz(x / 9, y / 9) - 0.5) * 70; const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } k.putImageData(img, 0, 0); }, { data: true, repeat: [30, 20] });
  const material = new THREE.MeshStandardMaterial({ map: albedo, normalMap: normal, normalScale: new THREE.Vector2(0.55, 0.55), roughnessMap: rough, roughness: 1, metalness: 0, envMapIntensity: 0.15 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(117, 80), material); mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true; mesh.name = 'pitch'; scn.add(mesh);
  // surroundings: darker, rougher grass with the same normal detail
  const outTex = tex(512, 512, (k, w, h) => { k.fillStyle = '#245a2c'; k.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { k.fillStyle = Math.random() < 0.5 ? 'rgba(0,25,0,.14)' : 'rgba(150,210,120,.08)'; k.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 2 + Math.random() * 5); } }, { repeat: [6, 6] });
  const out = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: outTex, normalMap: normal, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 1 }));
  out.rotation.x = -Math.PI / 2; out.position.y = -0.03; out.receiveShadow = true; scn.add(out);
  const baseColor = new THREE.Color(0xffffff);
  return { mesh, out, material, setWet(w) { material.roughness = 1 - 0.55 * w; material.color.copy(baseColor).multiplyScalar(1 - 0.22 * w); material.envMapIntensity = 0.15 + 0.6 * w; material.normalScale.setScalar(0.55 - 0.25 * w); } };
}

// ---------------------------------------------------------------- grass blades near the camera focus
export function buildGrassBlades(scn, count = 5000) {
  const bladeTex = tex(32, 64, (k, w, h) => { k.clearRect(0, 0, w, h); const g = k.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#2f8a3a'); g.addColorStop(1, '#6fcf62'); k.fillStyle = g; k.beginPath(); k.moveTo(w * 0.35, h); k.lineTo(w * 0.65, h); k.lineTo(w * 0.52, 0); k.closePath(); k.fill(); }, { clamp: true });
  const geo = new THREE.PlaneGeometry(0.09, 0.11); geo.translate(0, 0.055, 0);
  const mat = new THREE.MeshLambertMaterial({ map: bladeTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(geo, mat, count); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'grassBlades';
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const R = 14, cell = Math.sqrt((R * R * 4) / count), seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { seeds[i * 3] = Math.random(); seeds[i * 3 + 1] = Math.random(); seeds[i * 3 + 2] = Math.random(); }
  let lx = 1e9, lz = 1e9;
  scn.add(im);
  return {
    mesh: im,
    update(fx, fz) {
      // snap the blade field to a grid so it doesn't swim when the focus moves
      const gx = Math.round(fx / cell) * cell, gz = Math.round(fz / cell) * cell; if (gx === lx && gz === lz) return; lx = gx; lz = gz;
      const n = Math.round(Math.sqrt(count)); let i = 0;
      for (let a = 0; a < n && i < count; a++) for (let b = 0; b < n && i < count; b++, i++) {
        const x = gx - R + (a + seeds[i * 3]) * (2 * R / n), z = gz - R + (b + seeds[i * 3 + 1]) * (2 * R / n);
        const on = Math.abs(x) < HW && Math.abs(z) < HH; const sc = on ? 0.8 + seeds[i * 3 + 2] * 0.6 : 0;
        p.set(x, 0, z); e.set(0, seeds[i * 3 + 2] * Math.PI, (seeds[i * 3] - 0.5) * 0.3); q.setFromEuler(e); s.set(sc, sc, sc); m.compose(p, q, s); im.setMatrixAt(i, m);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- ball ---------------------------
export const BALL_R = 0.13;
export function buildBall(scn) {
  // 12 "pentagons" at icosahedron vertex directions, drawn into an equirectangular texture
  const t = (1 + Math.sqrt(5)) / 2, V = [[0, 1, t], [0, -1, t], [0, 1, -t], [0, -1, -t], [1, t, 0], [-1, t, 0], [1, -t, 0], [-1, -t, 0], [t, 0, 1], [-t, 0, 1], [t, 0, -1], [-t, 0, -1]].map(v => new THREE.Vector3(...v).normalize());
  const map = tex(512, 256, (k, w, h) => {
    const img = k.createImageData(w, h), d = img.data, dir = new THREE.Vector3();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h, th = u * Math.PI * 2, ph = v * Math.PI; dir.set(-Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      let d0 = 9, d1 = 9; for (const c of V) { const a = dir.angleTo(c); if (a < d0) { d1 = d0; d0 = a; } else if (a < d1) d1 = a; }
      const i = (y * w + x) * 4; const black = d0 < 0.36, seam = Math.abs(d1 - d0) < 0.035 && !black;
      let c = black ? 24 : seam ? 150 : 238; d[i] = d[i + 1] = d[i + 2] = c; d[i + 3] = 255;
    }
    k.putImageData(img, 0, 0);
  }, { clamp: true });
  const nz = noise2(5);
  const normal = normalFromHeight(128, (x, y) => nz(x / 10, y / 10), 0.6); normal.repeat.set(4, 2);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 24), new THREE.MeshStandardMaterial({ map, normalMap: normal, roughness: 0.38, metalness: 0, envMapIntensity: 0.6 }));
  mesh.castShadow = true; mesh.name = 'ball'; scn.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------- goal net -----------------------
export function buildNet(scn, s, GH = 3.66) {
  const netTex = tex(64, 64, (k, w, h) => { k.clearRect(0, 0, w, h); k.strokeStyle = 'rgba(255,255,255,.95)'; k.lineWidth = 2.2; for (let i = 0; i <= 4; i++) { const p = i * 16 + 0.5; k.beginPath(); k.moveTo(p, 0); k.lineTo(p, h); k.moveTo(0, p); k.lineTo(w, p); k.stroke(); } });
  const mat = new THREE.MeshStandardMaterial({ map: netTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9, color: 0xf2f2f2, depthWrite: false });
  const g = new THREE.Group(); const D = 2.0, Hh = 2.44;
  const plane = (w, h, rx, ry, rz, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.set(rx, ry, rz); m.position.set(x, y, z); m.material.map.repeat.set(1, 1); g.add(m); return m; };
  // back (slanted), sides, top: UV repeat via geometry scale of texture coordinates
  const back = plane(GH * 2, Hh, 0, Math.PI / 2, 0, D, Hh / 2, 0);
  const top = plane(D, GH * 2, -Math.PI / 2, 0, Math.PI / 2, D / 2, Hh, 0);
  for (const z of [-GH, GH]) plane(D, Hh, 0, 0, 0, D / 2, Hh / 2, z);
  g.traverse(m => { if (m.isMesh) { const a = m.geometry.attributes.uv; const w = m.geometry.parameters.width, h = m.geometry.parameters.height; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * w / 0.3, a.getY(i) * h / 0.3); a.needsUpdate = true; } });
  g.scale.x = s; g.position.set(s * HW, 0, 0); g.userData.s = s; scn.add(g);
  return g;
}

// ---------------------------------------------------------------- rain ---------------------------
export function buildRain(scn, count = 1800) {
  const spr = tex(16, 64, (k, w, h) => { k.clearRect(0, 0, w, h); const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(200,220,255,0)'); g.addColorStop(0.5, 'rgba(200,220,255,.8)'); g.addColorStop(1, 'rgba(200,220,255,0)'); k.fillStyle = g; k.fillRect(w / 2 - 1.5, 0, 3, h); }, { clamp: true });
  const pos = new Float32Array(count * 3), vel = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - 0.5) * 90; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = (Math.random() - 0.5) * 70; vel[i] = 14 + Math.random() * 8; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: spr, size: 0.9, transparent: true, depthWrite: false, opacity: 0.7, sizeAttenuation: true })); pts.frustumCulled = false; pts.visible = false; scn.add(pts);
  return { mesh: pts, update(fx, fz, dt) { if (!pts.visible) return; for (let i = 0; i < count; i++) { let y = pos[i * 3 + 1] - vel[i] * dt; let x = pos[i * 3] - 2.5 * dt; if (y < 0) { y += 30; x = fx + (Math.random() - 0.5) * 90; pos[i * 3 + 2] = fz + (Math.random() - 0.5) * 70; } pos[i * 3] = x; pos[i * 3 + 1] = y; } geo.attributes.position.needsUpdate = true; } };
}

// ---------------------------------------------------------------- contact shadow blobs -----------
let blobTex = null;
export function blobTexture() {
  return blobTex || (blobTex = tex(128, 128, (k, w, h) => { k.clearRect(0, 0, w, h); const g = k.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.5, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = g; k.fillRect(0, 0, w, h); }, { clamp: true }));
}
export function makeBlob(radius = 0.45) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; return m;
}

// ---------------------------------------------------------------- sky dome -----------------------
function buildSky(scn) {
  const geo = new THREE.SphereGeometry(520, 32, 16); const col = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); mesh.renderOrder = -10; scn.add(mesh);
  const top = new THREE.Color(), hor = new THREE.Color(), c = new THREE.Color();
  return { mesh, set(skyHex, horizonHex) { top.setHex(skyHex); hor.setHex(horizonHex); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = Math.max(0, Math.min(1, p.getY(i) / 520)); c.copy(hor).lerp(top, Math.pow(y, 0.55)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } geo.attributes.color.needsUpdate = true; } };
}

// ---------------------------------------------------------------- environment controller ---------
export function createEnvironment(renderer, scn, cam, { gq = 2, ao = true, shadow = null, blades = null, rain = 1800 } = {}) {
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = gq > 0; renderer.shadowMap.type = THREE.PCFShadowMap;
  const amb = new THREE.AmbientLight(0xffffff, 0.35 * Math.PI);
  const sun = new THREE.DirectionalLight(0xffffff, 3); const shSize = shadow != null ? shadow : (gq > 1 ? 2048 : 1024); sun.castShadow = shSize > 0; sun.shadow.mapSize.set(Math.max(512, shSize), Math.max(512, shSize));
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 2;
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x3d6b3a, 0.85 * Math.PI);
  scn.add(amb, sun, sun.target, hemi);
  const flood = [];
  for (const s of [-1, 1]) for (const z of [-1, 1]) { const l = new THREE.PointLight(0xfff2cc, 0, 220, 2); l.position.set(s * (HW + 10), 32, z * (HH + 8)); scn.add(l); flood.push(l); }
  // image-based lighting for subtle reflections (wet pitch, ball, kits)
  const pmrem = new THREE.PMREMGenerator(renderer); scn.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scn.environmentIntensity = 0.1; pmrem.dispose();
  const sky = buildSky(scn);
  const pitch = buildPitch(scn);
  let bladesN = blades != null ? blades : (gq > 0 ? (gq > 1 ? 6000 : 3000) : 0); let bladesObj = bladesN > 0 ? buildGrassBlades(scn, bladesN) : null;
  const rainObj = buildRain(scn, rain);
  // post: AO at HIGH only
  let composer = null, aoPass = null;
  if (ao && gq >= 2) {
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scn, cam));
    aoPass = new GTAOPass(scn, cam, innerWidth, innerHeight); aoPass.output = GTAOPass.OUTPUT.Default; aoPass.blendIntensity = 0.7;
    aoPass.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1, thickness: 1, scale: 1, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
    aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 12 });
    composer.addPass(aoPass); composer.addPass(new OutputPass());
  }
  const focus = new THREE.Vector3(), sunDir = new THREE.Vector3(0.45, 0.85, 0.35);
  let current = -1;
  const env = {
    amb, sun, hemi, flood, pitch, sky, rain: rainObj, get blades() { return bladesObj; }, composer, PRESETS, WEATHER_NAMES,
    setShadowSize(n) { if (n <= 0) { sun.castShadow = false; renderer.shadowMap.enabled = false; return; } renderer.shadowMap.enabled = true; sun.castShadow = true; if (sun.shadow.mapSize.x !== n) { sun.shadow.mapSize.set(n, n); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } },
    setBlades(n) { if (bladesN === n) return; bladesN = n; if (bladesObj) { scn.remove(bladesObj.mesh); bladesObj.mesh.geometry.dispose(); bladesObj = null; } if (n > 0) bladesObj = buildGrassBlades(scn, n); },
    apply(wx) {
      if (wx === current) return; current = wx; const P = PRESETS[wx] || PRESETS[0];
      scn.background = new THREE.Color(P.sky); scn.fog = new THREE.Fog(P.horizon, P.fog[0], P.fog[1]); sky.set(P.sky, P.horizon);
      sun.color.setHex(P.sun.col); sun.intensity = P.sun.i; sunDir.set(...P.sun.dir).normalize();
      hemi.color.setHex(P.hemi.sky); hemi.groundColor.setHex(P.hemi.ground); hemi.intensity = P.hemi.i * Math.PI; amb.intensity = P.amb * Math.PI;
      renderer.toneMappingExposure = P.exposure; flood.forEach(l => { l.intensity = 2600 * P.flood; });
      scn.environmentIntensity = 0.1 + 0.3 * P.wet + (isDark(wx) ? 0.05 : 0);
      pitch.setWet(P.wet); rainObj.mesh.visible = isRain(wx);
    },
    /** per-frame: shadow camera follows the focus; rain + blades follow too */
    update(fx, fz, dt) {
      focus.set(fx, 0, fz);
      const dist = 90; sun.position.copy(focus).addScaledVector(sunDir, dist); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
      const sc = sun.shadow.camera, R = 34; if (sc.left !== -R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 20; sc.far = 190; sc.updateProjectionMatrix(); }
      rainObj.update(fx, fz, dt); if (bladesObj) bladesObj.update(fx, fz);
    },
    resize(w, h) { if (composer) { composer.setSize(w, h); aoPass && aoPass.setSize(w, h); } },
    render() { if (composer) composer.render(); else renderer.render(scn, cam); },
    setAO(on) { if (aoPass) aoPass.enabled = !!on; },
  };
  return env;
}
