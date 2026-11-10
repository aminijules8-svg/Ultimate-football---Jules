// Rendered head-and-shoulders portraits from the real 3D character (the same model, skin, hair, beard, face
// morphs and build the editors show), for career cards, hub headers and preset thumbnails. One shared offscreen
// renderer; portraits are rendered one at a time, cached by appearance, and kept in localStorage (uf_portraits).
import * as THREE from 'three';
import { characterAssets, Character, makeKitTexture } from './character.js';

const W = 224, H = 256, KEY = 'uf_portraits', MAX = 48;
let R = null, scene = null, cam = null, queue = Promise.resolve(), store = null;
const cache = new Map();

function init() {
  if (R) return;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x3a3a40, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(1.5, 3.2, 2.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cc4ff, 1.7); rim.position.set(-2, 2.6, -2.2); scene.add(rim);
  cam = new THREE.PerspectiveCamera(26, W / H, 0.05, 20); cam.position.set(0.22, 1.58, 1.28); cam.lookAt(0, 1.5, 0);
}
function loadStore() {
  if (store) return store; store = new Map();
  try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const k of Object.keys(o)) store.set(k, o[k]); } catch (e) { /* no storage */ }
  return store;
}
function saveStore() {
  try { while (store.size > MAX) store.delete(store.keys().next().value); localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(store))); } catch (e) { /* quota: portraits are regenerated when missing */ }
}

/** look: { skin, hair, hairColor, beard, face, body, c1, c2, design, seed } → Promise<dataURL|null> */
export function renderPortrait(look) {
  const k = JSON.stringify(look);
  if (cache.has(k)) return cache.get(k);
  const st = loadStore(); if (st.has(k)) { const p = Promise.resolve(st.get(k)); cache.set(k, p); return p; }
  const p = queue.then(async () => {
    await characterAssets.load(); if (!characterAssets.ready) return null; init();
    const kit = makeKitTexture({ c1: look.c1 || '#1d4ed8', c2: look.c2 || '#ffffff', design: look.design || 0, socks: look.c1 || '#1d4ed8', skin: look.skin || '#8d5524', boots: ['#111827', '#f8fafc'], bootStyle: 0, number: null, name: '', sponsor: '', badge: null });
    const ch = new Character({ kit, skinColor: look.skin || '#8d5524', seed: look.seed || 3, hairStyle: look.hair ?? 1, hairColor: look.hairColor || '#14100c', body: look.body || { h: .5, w: .5, wing: .5, leg: .5 }, beard: look.beard | 0, face: look.face || null, detail: 2 });
    scene.add(ch.group);
    for (let i = 0; i < 3; i++) ch.update([0, 0, 0, 1, 0, 0, 0, 0, 0, 9], { dt: 0.016, ball: [0.2, 1.3, 1.55], ik: false });  // face the camera, eyes toward it
    R.render(scene, cam);
    const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, look.c1 || '#1d4ed8'); grad.addColorStop(1, '#0b1220'); g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.22; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.drawImage(R.domElement, 0, 0);
    scene.remove(ch.group); ch.dispose(); if (kit && kit.dispose) kit.dispose();
    const url = out.toDataURL('image/webp', 0.84); st.set(k, url); saveStore(); return url;
  }).catch(e => { console.warn('[portrait]', e); return null; });
  cache.set(k, p); queue = p.then(() => {}, () => {});
  return p;
}
export const portraitCache = { clear() { cache.clear(); store = new Map(); try { localStorage.removeItem(KEY); } catch (e) {} } };
