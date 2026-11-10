#!/usr/bin/env python3
"""Writes public/models/tex/*: MakeHuman (CC0) skins, eyes and a 4x4 hair atlas for player.glb.
Hair-atlas tile order must match build_player_mh.py: 0 brows, 1 lashes, 2.. HAIRS (+ none uses only 0/1).
Hair/brow/lash tiles are stored as neutral grey so the runtime tints them with the player's hair colour."""
import os, json
from PIL import Image, ImageOps, ImageStat
D = os.path.expanduser('~/.config/blender/4.3/extensions/.user/user_default/mpfb/data')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'models', 'tex')
HAIRS = ['short02', 'afro01', 'short04', 'long01', 'ponytail01', 'short03', 'braid01', 'short01', 'bob01']
TEX = {'afro01': 'afro_diffuse.png'}
os.makedirs(OUT, exist_ok=True)
meta = {'skins': {}}
for key, sub, fn in (('african', 'young_african_male', 'young_darkskinned_male_diffuse.png'), ('asian', 'young_asian_male', 'young_lightskinned_male_diffuse3.png'),
                     ('caucasian', 'young_caucasian_male', 'young_lightskinned_male_diffuse.png')):
    im = Image.open(os.path.join(D, 'skins', sub, fn)).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    im.save(os.path.join(OUT, f'skin_{key}.webp'), quality=86)
    # average colour of the face/torso area (centre of the atlas) for runtime tinting toward a skin tone
    meta['skins'][key] = [round(c) for c in ImageStat.Stat(im.crop((300, 300, 724, 724))).mean]
Image.open(os.path.join(D, 'eyes', 'materials', 'brown_eye.png')).convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'eyes.webp'), quality=90)


def grey_tile(path):
    im = Image.open(path).convert('RGBA').resize((512, 512), Image.LANCZOS)
    r, g, b, a = im.split(); L = ImageOps.grayscale(Image.merge('RGB', (r, g, b)))
    st = ImageStat.Stat(L, mask=a.point(lambda x: 255 if x > 128 else 0))
    mean = st.mean[0] if st.count[0] else 128
    L = L.point(lambda x: max(0, min(255, int(x * 180 / max(mean, 1)))))  # normalise so tint colour ~ result
    return Image.merge('RGBA', (L, L, L, a))


atlas = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))
tiles = [os.path.join(D, 'eyebrows', 'eyebrow001', 'eyebrow001.png'), os.path.join(D, 'eyelashes', 'eyelashes01', 'eyelashes01.png')] + \
        [os.path.join(D, 'hair', h, TEX.get(h, h + '_diffuse.png')) for h in HAIRS]
for i, p in enumerate(tiles):
    col, row = i % 4, i // 4  # Blender UV rows count from the bottom
    atlas.paste(grey_tile(p), (col * 512, (3 - row) * 512))
# procedural tiles for the generated styles: 11 rope strands (cornrows, twists, dreads, mohawk), 12 buzz (dots, skin shows
# through), 13 fade (dots thinning toward the bottom), 14 textured crop (dense strands)
import random
rnd = random.Random(11)
def strands(dense):
    im = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); px = im.load()
    for x in range(512):
        for y in range(512):
            n = (math_sin((x * (0.9 if dense else 0.5) + y * 0.08) * 0.35) + 1) * 0.5
            g = int(95 + 110 * n * (0.7 + 0.3 * rnd.random()))
            px[x, y] = (g, g, g, 255)
    return im
def dots(fade):
    im = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); px = im.load()
    for x in range(0, 512, 3):
        for y in range(0, 512, 3):
            keep = 1.0 if not fade else max(0.0, min(1.0, (y - 60) / 300.0))  # PIL y grows downward = lower on the head (UV v flips)
            if rnd.random() < 0.62 * keep + (0.0 if fade else 0.0):
                g = int(120 + 60 * rnd.random())
                for dx in range(2):
                    for dy in range(2):
                        px[min(511, x + dx), min(511, y + dy)] = (g, g, g, 255)
    return im
import math as _m
math_sin = _m.sin
for i, im in ((11, strands(False)), (12, dots(False)), (13, dots(True)), (14, strands(True))):
    col, row = i % 4, i // 4
    atlas.paste(im, (col * 512, (3 - row) * 512))
atlas.save(os.path.join(OUT, 'hair_atlas.webp'), quality=88)
json.dump(meta, open(os.path.join(OUT, 'tex.json'), 'w'))
# one skin set for every tone: tone-neutral detail + region masks (needs masks.json from the build)
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import skin_gen
skin_gen.main()
print('wrote', sorted(os.listdir(OUT)), meta)
