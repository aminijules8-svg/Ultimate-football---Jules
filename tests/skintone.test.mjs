// tests/skintone.test.mjs — one skin model for every tone: melanin -> albedo, an old skinColor -> melanin, and the
// per-pixel composition of the tone-neutral detail and region masks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { skinAlbedo, toneFromColor, composePixel, composeSkin, toSRGB } from '../src/render3d/skintone.js';

const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const hue = c => { const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; let h = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); h *= 60; return h < 0 ? h + 360 : h; };
const sat = c => { const mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
const hex = c => '#' + toSRGB(c).map(v => v.toString(16).padStart(2, '0')).join('');

test('darker with more melanin, and always a skin hue (orange-red, never grey or green)', () => {
  let prev = 2;
  for (let m = 0; m <= 1.0001; m += 0.05) {
    const c = skinAlbedo(m), L = lum(c);
    assert.ok(L < prev, `m ${m.toFixed(2)}: luminance ${L} not below ${prev}`); prev = L;
    assert.ok(hue(c) >= 8 && hue(c) <= 40, `m ${m.toFixed(2)}: hue ${hue(c)}`); assert.ok(sat(c) > 0.18, `m ${m.toFixed(2)}: saturation ${sat(c)}`);
  }
  assert.ok(lum(skinAlbedo(0)) > 8 * lum(skinAlbedo(1)), 'covers fair to very dark');
});

test('an old skinColor maps back to the melanin that makes it', () => {
  for (let m = 0; m <= 1.0001; m += 0.1) {
    const t = toneFromColor(hex(skinAlbedo(m)));
    assert.ok(Math.abs(t.m - m) < 0.02, `m ${m.toFixed(1)} -> ${t.m}`);
  }
  // the game's existing palette keeps its light-to-dark order
  const SK = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#a0522d', '#8d5524', '#5c3a21', '#3b2417'];
  const ms = SK.map(c => toneFromColor(c).m);
  for (let i = 1; i < ms.length; i++) assert.ok(ms[i] >= ms[i - 1] - 0.02, `${SK[i]} (${ms[i]}) after ${SK[i - 1]} (${ms[i - 1]})`);
  assert.ok(ms.every(v => v >= 0 && v <= 1));
});

test('redness reads as red on light skin and still shows, not grey, on dark skin', () => {
  for (const m of [0.05, 0.5, 0.95]) {
    const base = composePixel(m, 0.5, 128, [0, 0, 0, 0], [0, 0, 0, 0]), red = composePixel(m, 0.5, 128, [255, 0, 0, 0], [0, 0, 0, 0]);
    assert.ok(red[0] / red[1] > base[0] / base[1] * 1.08, `m ${m}: redder (${(red[0] / red[1]).toFixed(2)} vs ${(base[0] / base[1]).toFixed(2)})`);
    assert.ok(sat(red) >= sat(base), `m ${m}: not greyer`);
  }
});

test('detail (pores, creases) stays visible on the darkest tone', () => {
  const ratio = m => lum(composePixel(m, 0.5, 156, [0, 0, 0, 0], [0, 0, 0, 0])) / lum(composePixel(m, 0.5, 100, [0, 0, 0, 0], [0, 0, 0, 0]));
  assert.ok(Math.log(ratio(0.95)) >= 0.5 * Math.log(ratio(0.05)), `dark ${ratio(0.95).toFixed(2)} vs light ${ratio(0.05).toFixed(2)}`);
  assert.ok(ratio(0.05) > 1.2, 'detail shows at all');
});

test('palms are lighter than the back of the hand on dark skin, about the same on light skin; nails are lighter', () => {
  const back = m => lum(composePixel(m, 0.5, 128, [0, 0, 0, 0], [0, 0, 0, 0])), palm = m => lum(composePixel(m, 0.5, 128, [0, 0, 0, 0], [255, 0, 0, 0]));
  assert.ok(palm(0.9) > 1.6 * back(0.9), `dark palm ${palm(0.9)} vs ${back(0.9)}`);
  assert.ok(palm(0.05) < 1.15 * back(0.05), 'light palm about the same');
  const nail = lum(composePixel(0.7, 0.5, 128, [0, 0, 0, 255], [0, 0, 0, 0]));
  assert.ok(nail > back(0.7) * 1.3, 'nails lighter');
});

test('the fast whole-texture pass matches the per-pixel model', () => {
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = 400, det = new Uint8Array(n), A = new Uint8Array(n * 4), B = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { det[i] = 60 + rnd() * 140; for (let k = 0; k < 4; k++) { A[i * 4 + k] = rnd() < 0.4 ? rnd() * 255 : 0; B[i * 4 + k] = k < 2 && rnd() < 0.3 ? rnd() * 255 : 0; } }
  for (const m of [0.1, 0.55, 0.9]) {
    const out = composeSkin(m, 0.5, det, A, B);
    for (let i = 0; i < n; i++) {
      const want = toSRGB(composePixel(m, 0.5, det[i], [...A.slice(i * 4, i * 4 + 4)], [...B.slice(i * 4, i * 4 + 4)]));
      for (let k = 0; k < 3; k++) assert.ok(Math.abs(out[i * 4 + k] - want[k]) <= 2, `m ${m} texel ${i} ch ${k}: ${out[i * 4 + k]} vs ${want[k]}`);
    }
  }
});

test('golden and olive undertones survive the round trip from an old skinColor', () => {
  for (const c of ['#e0ac69', '#f1c27d', '#c68642', '#8d5524', '#ffdbac']) {
    const t = toneFromColor(c), back = skinAlbedo(t.m, t.h, t.y), n = parseInt(c.slice(1), 16);
    const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    assert.ok(Math.abs(hue(back) - hue(lin)) < 6, `${c}: hue ${hue(back).toFixed(1)} vs ${hue(lin).toFixed(1)}`);
    if (t.m > 0.001) assert.ok(Math.abs(Math.log(lum(back) / lum(lin))) < 0.15, `${c}: lightness`);
    else assert.ok(lum(back) < lum(lin), `${c}: lighter than real skin gets, so the fairest tone`);
  }
  assert.ok(toneFromColor('#e0ac69').y > 0.6, 'golden reads as a yellow undertone');
});
