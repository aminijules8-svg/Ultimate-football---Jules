// Dev page: /viewer.html?clip=run&t=0.35&hair=2&design=1&body=0.8&cam=front|side|back&speed=5 (&ly=.08&dist=.9&bs=0..3&b1=hex&b2=hex for legacy boots, &boot=0..53 catalogue)
// &strip=6: a contact strip, the same clip at six evenly spaced moments side by side
import { BOOTS } from './world/boots.js';
import * as THREE from 'three';
import { characterAssets, Character, makeKitTexture, actionCode, CELS } from './render3d/character.js';

const q = new URLSearchParams(location.search);
if (q.get('corr') === '0') characterAssets.correctives = false;  // &corr=0: corrective shapes off (before/after checks)
const clip = q.get('clip') || 'idle', t0 = +(q.get('t') || 0.3), hair = +(q.get('hair') || 0), design = +(q.get('design') || 1);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2b3542);
const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 50);
const view = q.get('cam') || 'front', dist = +(q.get('dist') || 3.6);
// the character faces +X; 'front' looks at it from +X, 'back' from -X
const ang = { front: 0.3, side: Math.PI / 2 + 0.1, back: Math.PI - 0.3, three: 0.8 }[view] ?? 0.3;
const ly = +(q.get('ly') || 0.95);  // &ly=0.08&dist=0.9 = boots close-up
cam.position.set(Math.cos(ang) * dist, ly + 0.3 * dist / 3.6 + (ly < 0.5 ? 0.18 : 0), Math.sin(ang) * dist); cam.lookAt(0, ly, 0);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a4a3a, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

await characterAssets.load();
const kit = makeKitTexture({ c1: q.get('c1') ? '#' + q.get('c1') : '#1e55c9', c2: q.get('c2') ? '#' + q.get('c2') : '#ffffff', design, socks: '#1e55c9', skin: '#8d5524', boots: [q.get('b1') ? '#' + q.get('b1') : '#111', q.get('b2') ? '#' + q.get('b2') : '#f3f3f3'], bootStyle: +(q.get('bs') || 0), boot: q.has('boot') ? BOOTS[+q.get('boot') % BOOTS.length] : null, number: 10, name: 'SILVA', sponsor: 'KIGALI AIR', badge: { bg: '#fff', fg: '#1e55c9', letter: 'R' } });
const make = () => new Character({ kit, hairStyle: hair, hairColor: '#14100c', skinColor: q.get('skin') ? '#' + q.get('skin') : '#8d5524', seed: +(q.get('seed') || 0), body: { h: q.has('h') ? +q.get('h') : undefined, w: +(q.get('body') || .5), wing: +(q.get('wing') || .5), leg: .5, arch: q.has('arch') ? +q.get('arch') : null }, lod: +(q.get('lod') || 0), detail: q.has('det') ? +q.get('det') : 2, face: q.get('face') ? Object.fromEntries(['nose', 'nosew', 'eyeS', 'brow', 'jaw', 'lip', 'ear'].map((k, i) => [k, +(q.get('face').split(',')[i] ?? .5)])) : null, acc: q.get('acc') ? Object.fromEntries(q.get('acc').split(',').map(x => x.split(':')).map(([k, v]) => [{ b: 'band', w: 'wrist', s: 'sleeve' }[k], '#' + v])) : null, beard: +(q.get('beard') || 0), gloves: q.get('gloves') ? '#' + q.get('gloves') : null, phase: 0 });
const strip = +(q.get('strip') || 0);
const ch = make(); scene.add(ch.group); window.__CH = ch;
const speed = +(q.get('speed') || 0);
const LOCOS = ['idle', 'walk', 'jog', 'run', 'sprint'], isCel = /^(celebrate|hug$|hand_slap$|react_)/.test(clip), gk = clip.startsWith('gk');
const back = clip.endsWith('_back'), shuf = clip.startsWith('shuffle') ? (clip.endsWith('L') ? 1 : -1) : 0, loco = LOCOS.includes(clip) || back || shuf;  // directional loops: drive them through the body-frame velocity
const leftFoot = /^(shot|pass).*_L$/.test(clip), code = loco || isCel || clip === 'tackle_slide' || (gk && clip !== 'gk_catch') ? 0 : actionCode(leftFoot ? clip.slice(0, -2) : clip);
const dur = (characterAssets.clips[clip] || characterAssets.clips.idle).duration;
const ctx = age => ({ dt: 0, ball: [3, 0.5, 0], gk, cel: isCel, celClip: isCel ? clip : null, celVariant: CELS.indexOf(clip), card: clip === 'referee_card', lying: clip === 'lying', sit: clip === 'sit', mgr: clip === 'manager_idle', shield: clip === 'shield', jockey: clip === 'jockey' });
// advance to the requested phase of the clip in small steps (action age is what triggers one-shot clips)
let age = 0;
const dive = /^gk_(dive|tip)/.test(clip);
const dAt = () => [0, 0, 1, 0, speed, clip === 'tackle_slide' ? 1 : 0, dive ? 1 : 0, clip.endsWith('_R') ? -1 : 1, code, age, leftFoot ? 4 : 0, shuf * speed, null, back ? -speed : shuf ? 0 : speed, /low/.test(clip) ? 1 : /tip/.test(clip) ? 2 : 0];
const advance = (c, t) => { const steps = 40, step = (t * dur) / steps; age = 0; c.update(dAt(), { ...ctx(age), dt: 0 }); for (let i = 0; i < steps; i++) { age += step; c.update(dAt(), { ...ctx(age), dt: step }); } };
if (strip) {  // one character per moment, spread across the frame (they face +X, the row runs along Z)
  scene.remove(ch.group); ground.scale.setScalar(strip * 0.9);
  const rx = Math.sin(ang), rz = -Math.cos(ang), gap = 1.9;  // the row runs left to right across the view (time reads left to right)
  const raw = (c, f) => { c.update(dAt(), { ...ctx(0), dt: 0 }); c.mixer.stopAllAction(); const a = c.mixer.clipAction(characterAssets.clips[clip]); a.reset().play(); a.setEffectiveWeight(1); a.time = f * dur; c.mixer.update(0); };  // the clip itself, no runtime layering
  for (let i = 0; i < strip; i++) { const c = make(); raw(c, i / strip); c.group.rotation.y = 0; const o = (i - (strip - 1) / 2) * gap; c.group.position.set(rx * o, 0, rz * o); c.group.updateMatrixWorld(true); scene.add(c.group); }
  const W = strip * gap; cam.fov = 20; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  const D = W / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect) * 1.05;
  cam.position.set(Math.cos(ang) * D, 1.1 + D * 0.06, Math.sin(ang) * D); cam.lookAt(0, 0.9, 0);
} else advance(ch, t0);
// &move=N: run N frames at 60 Hz with the root travelling at `speed` along +X, collecting the planted-foot slide stats
// (window.__SLIDE); &ik=0 measures without the foot lock, &ik=1 with it
if (q.has('move')) {
  characterAssets.ik = q.get('ik') === '0' ? 'measure' : true; characterAssets.slide = { sum: 0, n: 0, max: 0, corr: 0 };
  let x = 0; const n = +q.get('move');
  const fwd = back ? -speed : shuf ? 0 : speed, lat = shuf * speed; let z = 0;  // body-frame velocity -> pitch motion (facing +X: left is -z)
  for (let i = 0; i < n; i++) { x += fwd / 60; z -= lat / 60; ch.update([x, z, 1, 0, speed, 0, 0, 0, 0, 1e9, 0, lat, null, fwd], { ...ctx(i / 60), dt: 1 / 60, ball: [x + 3, .5, z] }); }  // the clip's own context (celebrations included)
  const S = characterAssets.slide; window.__SLIDE = { avgMm: +(S.sum / Math.max(1, S.n) * 1000).toFixed(2), maxMm: +(S.max * 1000).toFixed(1), n: S.n, corrMm: +(S.corr / Math.max(1, S.n) * 1000).toFixed(1), lo: ch.ikS.Left && +ch.ikS.Left.lo.toFixed(3), x: +x.toFixed(2) };
  cam.position.x += x; cam.position.z += z; cam.lookAt(x, ly, z);
}
ch.group.rotation.y = 0; // face +X; camera angles are relative to that
document.getElementById('hud').textContent = strip ? `${clip}  ${dur.toFixed(2)} s` : `${clip} @${t0}  hair=${hair} design=${design}  clips=${Object.keys(characterAssets.clips).length}`;
renderer.render(scene, cam);
window.__VIEWER_READY = true; window.__assets = characterAssets; window.__ch = ch;
if (q.has('spin')) (function loop() { ch.group.rotation.y += 0.01; ch.update(dAt(), { dt: 1 / 60, ball: [3, .5, 0] }); renderer.render(scene, cam); requestAnimationFrame(loop); })();
