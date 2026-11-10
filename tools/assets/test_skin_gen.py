#!/usr/bin/env python3
# tools/assets/test_skin_gen.py — run: python3 tools/assets/test_skin_gen.py
# The skin generator: UV triangles to region masks, the tone-neutral detail layer, veins and body hair kept inside their
# regions.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import skin_gen as G


def test_raster_fills_the_triangle_and_nothing_else():
    m = G.raster([[0.0, 0.0, 1.0, 0.0, 0.0, 1.0]], size=64)  # lower-left half in UV (v up) = upper-left half... in image rows
    assert m.shape == (64, 64)
    assert m[60, 3] > 0.99, 'inside (u small, v small = bottom of the image)'
    assert m[3, 60] < 0.01, 'outside'


def test_raster_uses_the_corner_weights():
    m = G.raster([[0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5]], size=64)
    assert abs(m[60, 3] - 0.5) < 0.02


def test_detail_is_tone_neutral_and_centred():
    rng = np.random.default_rng(1)
    base = np.linspace(60, 200, 256)[None, :].repeat(256, 0)  # a strong left-to-right shading ramp
    ims = [np.clip(base * f + rng.normal(0, 6, (256, 256)), 0, 255).astype(np.uint8) for f in (0.5, 1.0, 1.2)]  # dark, mid, light people
    d = G.detail_from(ims, size=256)
    assert abs(float(d.mean()) - 128) < 6, d.mean()
    left, right = d[:, 20:60].mean(), d[:, 196:236].mean()
    assert abs(left - right) < 6, ('the large-scale ramp is gone', left, right)
    assert d.std() > 2, 'fine detail kept'


def test_veins_and_hair_stay_in_their_region():
    region = np.zeros((128, 128), np.float32); region[30:90, 40:100] = 1.0
    v = G.veins(region, seed=3); h = G.hair(region, seed=4)
    for name, m in (('veins', v), ('hair', h)):
        assert m[30:90, 40:100].max() > 0.3, f'{name} drawn'
        outside = m.copy(); outside[26:94, 36:104] = 0  # allow the blur to spill a few pixels
        assert outside.max() < 0.05, f'{name} outside its region'


if __name__ == '__main__':
    fails = 0
    for n_, f in sorted(globals().items()):
        if n_.startswith('test_'):
            try:
                f(); print('PASS', n_)
            except Exception as e:
                fails += 1; print('FAIL', n_, repr(e))
    raise SystemExit(1 if fails else 0)
