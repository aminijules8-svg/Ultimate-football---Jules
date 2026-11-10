#!/usr/bin/env python3
"""Skin textures for every tone (Phase C; textures.py runs it after the player build has written masks.json):
  skin_detail.webp  tone-neutral detail: pores, creases and soft shading, from the MakeHuman (CC0) photos with their own
                    colour and lighting divided out, averaged over three people so no one's blemishes repeat;
  skin_mask_a.png   R redness (knees, elbows, knuckles), G veins, B fine body hair, A nails;
  skin_mask_b.png   R palms, G lips.
The runtime (src/render3d/skintone.js) colours them from a melanin value, so one set serves every tone.
Tested by test_skin_gen.py."""
import os, sys, json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024


def raster(tris, size=SIZE, blur=0):
    """UV triangles [u0,v0,u1,v1,u2,v2(,w0,w1,w2)] -> float32 [size, size] in 0..1 (image rows run down = v up, as the
    runtime's canvas painting); a triangle is filled with the mean of its corner weights, the blur smooths the steps."""
    im = Image.new('L', (size, size), 0); dr = ImageDraw.Draw(im)
    for t in tris:
        w = (t[6] + t[7] + t[8]) / 3 if len(t) >= 9 else 1.0
        if w > 0:
            dr.polygon([(t[0] * size, (1 - t[1]) * size), (t[2] * size, (1 - t[3]) * size), (t[4] * size, (1 - t[5]) * size)], fill=int(round(255 * min(1.0, w))))
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, dtype=np.float32) / 255


def detail_from(images, size=SIZE, radius=None):
    """Grey images (arrays or PIL) -> uint8 detail: each image divided by its own blurred self (colour, tone and broad
    lighting go, pores and creases stay), averaged, 128 = neutral."""
    radius = radius or max(4, size // 42)
    acc = None
    for im in images:
        im = im if isinstance(im, Image.Image) else Image.fromarray(np.asarray(im, np.uint8))
        im = im.convert('L').resize((size, size), Image.LANCZOS)
        L = np.asarray(im, np.float32) + 4.0
        B = np.asarray(im.filter(ImageFilter.GaussianBlur(radius)), np.float32) + 4.0
        acc = L / B if acc is None else acc + L / B
    hp = acc / len(images)
    return np.clip(np.round(hp * 128), 40, 230).astype(np.uint8)


def _strokes(region, seed, count, steps, step_len, width, persist, threshold):
    h, w = region.shape; rnd = random.Random(seed)
    im = Image.new('L', (w, h), 0); dr = ImageDraw.Draw(im)
    ys, xs = np.nonzero(region > threshold)
    if not len(xs):
        return np.zeros_like(region)
    for _ in range(count):
        k = rnd.randrange(len(xs)); x, y = float(xs[k]), float(ys[k]); a = rnd.uniform(0, 2 * math.pi)
        level = int(255 * min(1.0, region[int(y), int(x)]) * rnd.uniform(0.6, 1.0))
        for _ in range(steps):
            a += rnd.gauss(0, 1 - persist); nx, ny = x + math.cos(a) * step_len, y + math.sin(a) * step_len
            if not (0 <= nx < w and 0 <= ny < h) or region[int(ny), int(nx)] <= threshold:
                break
            dr.line([(x, y), (nx, ny)], fill=level, width=width); x, y = nx, ny
    return np.asarray(im.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255 * (region > threshold)


def veins(region, seed=1):
    """Faint winding vein lines inside the region (long, smooth, a couple of pixels wide)."""
    n = max(2, int(region.sum() / 2500))
    return _strokes(region, seed, n, steps=60, step_len=2.0, width=2, persist=0.92, threshold=0.25)


def hair(region, seed=2):
    """Fine body hair: many short strokes inside the region, denser where the region is stronger."""
    n = max(10, int(region.sum() / 9))
    return _strokes(region, seed, n, steps=3, step_len=2.2, width=1, persist=0.85, threshold=0.2) * 0.85


def build(masks, photos, size=SIZE, seed=7):
    """masks.json dict + MakeHuman photo paths -> (detail L, mask A RGBA, mask B RGBA) as PIL images."""
    det = detail_from([Image.open(p) for p in photos], size)
    red = np.maximum.reduce([raster(masks.get(k, []), size, blur=size / 170) for k in ('knee', 'elbow', 'knuckle')])
    vein = veins(raster(masks.get('vein', []), size, blur=size / 256), seed) * 0.9
    hr = hair(raster(masks.get('hair', []), size, blur=size / 256), seed + 1)
    nail = raster(masks.get('nail', []), size, blur=size / 600)
    palm = raster(masks.get('palm', []), size, blur=size / 200)
    lips = raster(masks.get('lips', []), size, blur=size / 300)
    to8 = lambda a: np.clip(np.round(a * 255), 0, 255).astype(np.uint8)
    A = np.dstack([to8(red), to8(vein), to8(hr), to8(nail)])
    B = np.dstack([to8(palm), to8(lips), np.zeros((size, size), np.uint8), np.full((size, size), 255, np.uint8)])
    return Image.fromarray(det, 'L'), Image.fromarray(A, 'RGBA'), Image.fromarray(B, 'RGBA')


def main():
    OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'models', 'tex')
    D = os.path.expanduser('~/.config/blender/4.3/extensions/.user/user_default/mpfb/data/skins')
    photos = [os.path.join(D, 'young_african_male', 'young_darkskinned_male_diffuse.png'), os.path.join(D, 'young_asian_male', 'young_lightskinned_male_diffuse3.png'),
              os.path.join(D, 'young_caucasian_male', 'young_lightskinned_male_diffuse.png')]
    masks = json.load(open(os.path.join(OUT, 'masks.json')))
    det, A, B = build(masks, photos)
    det.save(os.path.join(OUT, 'skin_detail.webp'), quality=88)
    A.save(os.path.join(OUT, 'skin_mask_a.png'), optimize=True); B.save(os.path.join(OUT, 'skin_mask_b.png'), optimize=True)
    print('skin_gen:', {k: len(masks.get(k, [])) for k in ('knee', 'elbow', 'knuckle', 'nail', 'palm', 'vein', 'hair', 'lips')},
          {f: os.path.getsize(os.path.join(OUT, f)) for f in ('skin_detail.webp', 'skin_mask_a.png', 'skin_mask_b.png')})


if __name__ == '__main__':
    main()
