// The main menu's live stage: your club's home ground at night, floodlights on, and a player in the home kit
// standing on the touchline. One renderer, the real stadium builder and the real character, a slow camera
// drift and a small pointer parallax. Falls back to nothing (the caller keeps the painted art) when WebGL fails.
import * as THREE from 'three';
import { buildStadium, HW, HH } from '../render3d/stadium.js';
import { characterAssets, Character, makeKitTexture } from '../render3d/character.js';

function pitchTexture() {
  const c = document.createElement('canvas'); c.width = 1050; c.height = 680; const k = c.getContext('2d');
  for (let i = 0; i < 14; i++) { k.fillStyle = i % 2 ? '#2a7a33' : '#318c3c'; k.fillRect(i * 75, 0, 75, 680); }
  k.strokeStyle = 'rgba(255,255,255,.92)'; k.lineWidth = 5;
  k.strokeRect(10, 10, 1030, 660); k.beginPath(); k.moveTo(525, 10); k.lineTo(525, 670); k.stroke();
  k.beginPath(); k.arc(525, 340, 91, 0, 7); k.stroke();
  for (const x of [10, 875]) { k.strokeRect(x, 138, 165, 404); k.strokeRect(x === 10 ? 10 : 985, 248, 55, 184); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createMenuScene(container, { still = false } = {}) {
  let renderer;
  const canvas = document.createElement('canvas'); canvas.className = 'mm-scene-canvas'; container.appendChild(canvas);
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { canvas.remove(); return null; }
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x060d16); scene.fog = new THREE.Fog(0x070f18, 90, 260);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x1c2a1c, 1.1));
  const flood = new THREE.DirectionalLight(0xfff3d6, 2.2); flood.position.set(-40, 70, 60); scene.add(flood);
  const flood2 = new THREE.DirectionalLight(0xe6f0ff, 1.2); flood2.position.set(50, 60, -40); scene.add(flood2);
  const key = new THREE.SpotLight(0xfff0d0, 60, 40, 0.5, 0.6, 1.2); key.position.set(16, 12, 30); scene.add(key); scene.add(key.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x1d3b1f, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 6, HH * 2 + 6), new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95 })); pitch.rotation.x = -Math.PI / 2; scene.add(pitch);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.3, 600);
  // player on the near touchline, right of frame; the camera looks past him across the pitch to the far stand
  const C0 = new THREE.Vector3(14.5, 1.6, HH + 4.5), L0 = new THREE.Vector3(-4, 1.25, -14), P = new THREE.Vector3(13.9, 0, HH - 1.6);
  let st = null, ch = null, raf = 0, dead = false, last = performance.now(), t = 0, px = 0, py = 0, tpx = 0, tpy = 0;
  const place = () => {
    const sway = Math.sin(t * 0.22) * 0.5, bob = Math.sin(t * 0.17) * 0.06;
    cam.position.set(C0.x + sway + px * 0.6, C0.y + bob + py * 0.25, C0.z + px * 0.25);
    cam.lookAt(L0.x + px * 1.5, L0.y - py * 0.8, L0.z);
  };
  const resize = () => { const w = container.clientWidth || 800, h = container.clientHeight || 450; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const loop = () => {
    if (dead) return; raf = requestAnimationFrame(loop);
    const now = performance.now(); if (document.hidden || now - last < 31) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!still) t += dt;
    px += (tpx - px) * Math.min(1, dt * 3); py += (tpy - py) * Math.min(1, dt * 3); place();
    if (st) st.update(dt, 0.3, 0);
    if (ch) ch.update([P.x, P.z, 0.3, 0.95, 0, 0, 0, 0, 0, 9], { dt, ball: [C0.x, 1.6, C0.z] });  // idle, turned toward the camera, eyes on it
    renderer.render(scene, cam);
  };
  let gen = 0;
  const api = {
    /** preset: stadium preset; look: the kit / appearance object used by the player previews. */
    async show(preset, look) {
      const my = ++gen;
      if (st) { st.dispose(); st = null; }
      try { st = buildStadium(scene, preset, { gq: 0, crowd: 0.35, seats: 0.5 }); st.setNight(true); } catch (e) { st = null; }
      if (!look) return;
      await characterAssets.load(); if (dead || my !== gen || !characterAssets.ready) return;
      if (ch) { scene.remove(ch.group); ch.dispose(); ch = null; }
      const kit = makeKitTexture({ c1: look.c1 || '#1d4ed8', c2: look.c2 || '#ffffff', design: look.design || 0, socks: look.socks || look.c1 || '#1d4ed8', skin: look.skin || '#8d5524', boots: look.boots || ['#111827', '#f8fafc'], bootStyle: look.bootStyle || 0, boot: look.boot || null, number: look.number ?? 10, name: (look.name || '').split(' ').pop(), sponsor: look.sponsor || '', spPos: look.spPos, collar: look.collar, cuff: look.cuff, badge: look.letter ? { bg: '#fff', fg: look.c1 || '#1d4ed8', letter: look.letter, img: look.crestImg || null } : null });
      ch = new Character({ kit, skinColor: look.skin || '#8d5524', seed: look.seed || 0, hairStyle: look.hair ?? 1, hairColor: look.hairColor || '#14100c', body: look.body || { h: .5, w: .5, wing: .5, leg: .5 }, beard: look.beard | 0, face: look.face || null, acc: look.acc || null, gloves: look.gloves || null, lod: 0, detail: 1, phase: 0 });
      scene.add(ch.group); key.target.position.copy(P).setY(1.1); key.position.set(P.x + 2.5, 7, P.z + 7);
    },
    parallax(x, y) { tpx = Math.max(-1, Math.min(1, x)); tpy = Math.max(-1, Math.min(1, y)); },
    dispose() { dead = true; cancelAnimationFrame(raf); if (st) st.dispose(); if (ch) ch.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} canvas.remove(); },
    get ready() { return !!st; },
    get hasPlayer() { return !!ch; },
  };
  resize(); place(); new ResizeObserver(resize).observe(container); loop();
  return api;
}
