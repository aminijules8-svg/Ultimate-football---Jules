// Live 3D preview for the stadium editor: the real buildStadium() around a striped pitch, slow orbit,
// drag to turn, wheel to zoom. show(preset) rebuilds (low seat / crowd density keeps it quick).
import * as THREE from 'three';
import { buildStadium, HW, HH } from '../render3d/stadium.js';

function pitchTexture() {
  const c = document.createElement('canvas'); c.width = 1050; c.height = 680; const k = c.getContext('2d');
  for (let i = 0; i < 14; i++) { k.fillStyle = i % 2 ? '#2f8a3a' : '#38a046'; k.fillRect(i * 75, 0, 75, 680); }
  k.strokeStyle = 'rgba(255,255,255,.9)'; k.lineWidth = 5;
  k.strokeRect(10, 10, 1030, 660); k.beginPath(); k.moveTo(525, 10); k.lineTo(525, 670); k.stroke();
  k.beginPath(); k.arc(525, 340, 91, 0, 7); k.stroke();
  for (const x of [10, 875]) { k.strokeRect(x, 138, 165, 404); k.strokeRect(x === 10 ? 10 : 985, 248, 55, 184); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createStadiumPreview(container) {
  const canvas = document.createElement('canvas'); canvas.className = 'ed3d-canvas'; container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ec7ef); scene.fog = new THREE.Fog(0x9ec7ef, 260, 520);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x3a4a3a, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(60, 120, 40); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x3d6b3a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 6, HH * 2 + 6), new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95 })); pitch.rotation.x = -Math.PI / 2; scene.add(pitch);
  const cam = new THREE.PerspectiveCamera(38, 1, 1, 900);
  let yaw = 0.7, zoom = 1, st = null, raf = 0, dead = false, last = performance.now(), drag = null, idle = 0;
  const place = () => { const r = 150 * zoom; cam.position.set(Math.sin(yaw) * r, 38 + 30 * zoom, Math.cos(yaw) * r); cam.lookAt(0, 6, 0); };
  const resize = () => { const w = container.clientWidth || 400, h = container.clientHeight || 300; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag) { yaw = drag.yaw - (e.clientX - drag.x) * 0.008; idle = 0; place(); } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(1.6, Math.max(0.45, zoom * (e.deltaY > 0 ? 1.08 : 0.92))); place(); }, { passive: false });
  const loop = () => {
    if (dead) return; raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag && (idle += dt) > 2) { yaw += dt * 0.12; place(); }
    if (st) st.update(dt, 0.25, 0);
    renderer.render(scene, cam);
  };
  let tm = 0;
  const api = {
    show(preset) { clearTimeout(tm); tm = setTimeout(() => { if (dead) return; if (st) st.dispose(); st = buildStadium(scene, preset, { gq: 0, crowd: 0.3, seats: 0.5 }); }, 120); },
    dispose() { dead = true; clearTimeout(tm); cancelAnimationFrame(raf); if (st) st.dispose(); renderer.dispose(); canvas.remove(); },
  };
  resize(); place(); new ResizeObserver(resize).observe(container); loop();
  return api;
}
