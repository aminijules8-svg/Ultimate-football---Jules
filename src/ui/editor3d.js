// Live 3D player preview for the creators / Edit Pro screens: one Character in a small three.js scene,
// drag to rotate, wheel / buttons to zoom, camera presets (face, body, back, boots). update(look) rebuilds
// the character from the current editor values.
import * as THREE from 'three';
import { characterAssets, Character, makeKitTexture } from '../render3d/character.js';

const VIEWS = { face: { y: 1.6, d: 1.45, a: 0 }, body: { y: 0.88, d: 4.7, a: 0 }, back: { y: 1.25, d: 2.6, a: Math.PI }, boots: { y: 0.18, d: 1.25, a: 0.5 } };

export function createPreview(container, { view = 'body' } = {}) {
  const canvas = document.createElement('canvas'); canvas.className = 'ed3d-canvas'; container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x2f3d2f, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(2.5, 5, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc4ff, 1.4); rim.position.set(-3, 3, -3); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
  let ch = null, yaw = 0.35, v = VIEWS[view], zoom = 1, raf = 0, dead = false, t = 0, last = performance.now();
  const place = () => { const d = v.d * zoom, a = yaw + v.a; cam.position.set(Math.sin(a) * d, v.y + (view === 'boots' ? 0.25 : 0.12), Math.cos(a) * d); cam.lookAt(0, v.y, 0); };
  const resize = () => { const w = container.clientWidth || 300, h = container.clientHeight || 400; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  // drag to rotate, wheel to zoom
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag) { yaw = drag.yaw + (e.clientX - drag.x) * 0.012; place(); } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(1.8, Math.max(0.55, zoom * (e.deltaY > 0 ? 1.08 : 0.92))); place(); }, { passive: false });
  const loop = () => {
    if (dead) return; raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (ch) ch.update([0, 0, 0, 1, 0, 0, 0, 0, 0, 9], { dt, ball: [0, 3, 0.2] });  // idle, facing the camera side (+Z)
    renderer.render(scene, cam);
  };
  const api = {
    async update(look) {
      await characterAssets.load(); if (dead) return;
      if (ch) { scene.remove(ch.group); ch.dispose(); }
      const kit = makeKitTexture({ c1: look.c1 || '#1d4ed8', c2: look.c2 || '#ffffff', design: look.design || 0, socks: look.socks || look.c1 || '#1d4ed8', skin: look.skin || '#8d5524', boots: look.boots || ['#111827', '#f8fafc'], bootStyle: look.bootStyle || 0, boot: look.boot || null, number: look.number ?? 10, name: (look.name || '').split(' ').pop(), sponsor: look.sponsor || '', badge: look.letter ? { bg: '#fff', fg: look.c1 || '#1d4ed8', letter: look.letter, img: look.crestImg || null } : null });
      ch = new Character({ kit, skinColor: look.skin || '#8d5524', seed: look.seed || 0, hairStyle: look.hair ?? 1, hairColor: look.hairColor || '#14100c', body: look.body || { h: .5, w: .5, wing: .5 }, beard: look.beard | 0, face: look.face || null, acc: look.acc || null, gloves: look.gloves || null, lod: 0, phase: 0 });
      ch.group.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(ch.group);
    },
    setView(name) { view = name; v = VIEWS[name] || VIEWS.body; yaw = name === 'boots' ? 0.6 : 0.35; zoom = 1; place(); },
    dispose() { dead = true; cancelAnimationFrame(raf); if (ch) ch.dispose(); renderer.dispose(); canvas.remove(); },
  };
  resize(); place(); new ResizeObserver(resize).observe(container); loop();
  return api;
}
