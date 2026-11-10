// One skin model for every tone (Phase C): a melanin value (0 fair .. 1 very dark) and a haemoglobin value (0 pale ..
// 1 flushed, 0.5 typical) give the skin's base colour; the tone-neutral detail texture (pores, creases) and the region
// masks from tools/assets/skin_gen.py (redness, veins, body hair, nails; palms, lips) are composed on top. Colours are
// linear RGB 0..1 unless named sRGB. Tested by tests/skintone.test.mjs.

// skin colour by melanin, in CIELAB: fair skin is light and pink-orange, dark skin deep brown with less red and yellow
// (piecewise linear between these anchors; they follow measured skin colorimetry: ITA from about 60 deg to -50 deg)
const ANCHORS = [  // m, L*, a*, b*
  [0.00, 78, 12, 16], [0.25, 66, 14, 21], [0.50, 52, 15, 24], [0.75, 37, 13, 19], [1.00, 23, 9, 12]];

function labAt(m) {
  m = Math.max(0, Math.min(1, m));
  let i = 0; while (i < ANCHORS.length - 2 && m > ANCHORS[i + 1][0]) i++;
  const a = ANCHORS[i], b = ANCHORS[i + 1], t = (m - a[0]) / (b[0] - a[0]);
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
}

function labToLinear([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200, d = 6 / 29;
  const f = t => t > d ? t * t * t : 3 * d * d * (t - 4 / 29);
  const X = 0.95047 * f(fx), Y = f(fy), Z = 1.08883 * f(fz);
  return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z].map(v => Math.max(0, Math.min(1, v)));
}

function linearToLab([r, g, b]) {
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const d = 6 / 29, f = t => t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const toS = v => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
/** linear RGB 0..1 -> sRGB bytes */
export const toSRGB = c => c.map(v => Math.max(0, Math.min(255, toS(Math.max(0, v)))));

/** Base skin colour (linear RGB) for melanin m, haemoglobin h (redness) and undertone y (0 cool .. 1 golden/olive). */
export function skinAlbedo(m, h = 0.5, y = 0.5) {
  const lab = labAt(m); lab[1] += (Math.max(0, Math.min(1, h)) - 0.5) * 10; lab[2] += (Math.max(0, Math.min(1, y)) - 0.5) * 24;
  return labToLinear(lab);
}

/** An existing skin colour ('#rrggbb', e.g. an old save's skinColor) -> { m, h, y }: the melanin that matches its
 *  lightness (colours lighter than real skin get the fairest tone), then the haemoglobin and undertone that explain its
 *  redness and yellowness. */
export function toneFromColor(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16), lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(toLin), [L, a, b] = linearToLab(lin);
  const err = m => (labAt(m)[0] - L) ** 2;
  let best = 0, be = Infinity;
  for (let i = 0; i <= 200; i++) { const m = i / 200, e = err(m); if (e < be) { be = e; best = m; } }
  for (let s = 0.0025; s > 1e-5; s /= 2) for (const m of [best - s, best + s]) if (m >= 0 && m <= 1 && err(m) < be) { be = err(m); best = m; }
  const q = labAt(best), h = Math.max(0, Math.min(1, 0.5 + (a - q[1]) / 10)), y = Math.max(0, Math.min(1, 0.5 + (b - q[2]) / 24));
  return { m: +best.toFixed(4), h: +h.toFixed(3), y: +y.toFixed(3) };
}

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** One texel: melanin m, haemoglobin h, detail byte (128 = neutral), mask A [redness, veins, body hair, nails] and
 *  mask B [palms and soles, lips, -, -] as bytes, undertone y -> linear RGB. */
export function composePixel(m, h, detail, A, B, y = 0.5) {
  const base = skinAlbedo(m, h, y);
  const d = 1 + (detail / 128 - 1) * (1 + 0.9 * m);  // the same pores and creases show less on dark skin: lift them
  let c = [base[0] * d, base[1] * d, base[2] * d];
  if (B[0]) c = mix(c, skinAlbedo(m * 0.45, h + 0.1, y).map(v => v * d), (B[0] / 255) * m);  // palms and soles: much lighter on dark skin
  if (A[0]) { const r = (A[0] / 255) * (0.4 * (1 - m) + 0.2); c = mix(c, [c[0] * 1.3, c[1] * 0.8, c[2] * 0.8], r); }  // knees, elbows, knuckles, cheeks
  if (A[1]) { const g = (A[1] / 255) * 0.28 * (1 - 0.6 * m); c = mix(c, [c[0] * 0.84, c[1] * 0.92, c[2] * 1.1], g); }  // veins
  if (A[2]) c = mix(c, [c[0] * 0.5, c[1] * 0.48, c[2] * 0.46], (A[2] / 255) * 0.6);  // fine body hair
  if (B[1]) c = mix(c, [c[0] * 1.1 * (1 - 0.25 * m), c[1] * 0.72 * (1 - 0.25 * m), c[2] * 0.76 * (1 - 0.25 * m)], (B[1] / 255) * 0.7);  // lips
  if (A[3]) { const nail = mix(base.map(v => v * 1.35), [0.62, 0.47, 0.42], 0.4); c = mix(c, nail, (A[3] / 255) * 0.85); }  // nails
  return c;
}

/** Whole texture: detail (Uint8 grey, w*h), maskA / maskB (Uint8 RGBA, w*h*4) -> Uint8ClampedArray RGBA (sRGB).
 *  The same maths as composePixel, inlined for speed (about a million texels per tone; tested to match). */
export function composeSkin(m, h, detail, maskA, maskB, out, y = 0.5) {
  const n = detail.length; out = out || new Uint8ClampedArray(n * 4);
  const base = skinAlbedo(m, h, y), palm = skinAlbedo(m * 0.45, h + 0.1, y), boost = 1 + 0.9 * m, rk = 0.4 * (1 - m) + 0.2, vk = 0.28 * (1 - 0.6 * m), lk = 1 - 0.25 * m;
  const nail = mix(base.map(v => v * 1.35), [0.62, 0.47, 0.42], 0.4);
  const enc = new Uint8Array(4096); for (let i = 0; i < 4096; i++) enc[i] = toS(i / 4095);  // linear -> sRGB byte
  const E = v => enc[v <= 0 ? 0 : v >= 1 ? 4095 : (v * 4095 + 0.5) | 0];
  for (let i = 0; i < n; i++) {
    const j = i * 4, d = 1 + (detail[i] / 128 - 1) * boost;
    let r = base[0] * d, g = base[1] * d, b = base[2] * d, t;
    if (maskB[j]) { t = (maskB[j] / 255) * m; r += (palm[0] * d - r) * t; g += (palm[1] * d - g) * t; b += (palm[2] * d - b) * t; }
    if (maskA[j]) { t = (maskA[j] / 255) * rk; r += r * 0.3 * t; g -= g * 0.2 * t; b -= b * 0.2 * t; }
    if (maskA[j + 1]) { t = (maskA[j + 1] / 255) * vk; r -= r * 0.16 * t; g -= g * 0.08 * t; b += b * 0.1 * t; }
    if (maskA[j + 2]) { t = (maskA[j + 2] / 255) * 0.6; r -= r * 0.5 * t; g -= g * 0.52 * t; b -= b * 0.54 * t; }
    if (maskB[j + 1]) { t = (maskB[j + 1] / 255) * 0.7; r += (r * 1.1 * lk - r) * t; g += (g * 0.72 * lk - g) * t; b += (b * 0.76 * lk - b) * t; }
    if (maskA[j + 3]) { t = (maskA[j + 3] / 255) * 0.85; r += (nail[0] - r) * t; g += (nail[1] - g) * t; b += (nail[2] - b) * t; }
    out[j] = E(r); out[j + 1] = E(g); out[j + 2] = E(b); out[j + 3] = 255;
  }
  return out;
}
