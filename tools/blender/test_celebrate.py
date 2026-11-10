# tools/blender/test_celebrate.py — run: python3 tools/blender/test_celebrate.py
# Segment finders pick the part of a long capture that holds the move (frames in, frames out; fps = 120 for CMU).
import celebrate as C

FPS = 120

def test_hands_up_finds_the_longest_raised_stretch_with_padding():
    n = 1200; head = [1.6] * n
    hl = [1.0] * n; hr = [1.0] * n
    for f in range(300, 420): hl[f] = hr[f] = 1.8          # 1 s raised
    for f in range(700, 940): hl[f] = hr[f] = 1.9          # 2 s raised: the longest
    f0, f1 = C.window_hands_up(hl, hr, head, FPS)
    assert f0 == 700 - 60 and f1 == 940 + 60, (f0, f1)

def test_hands_up_returns_none_when_hands_never_go_up():
    assert C.window_hands_up([1.0] * 500, [1.0] * 500, [1.6] * 500, FPS) is None

def test_jump_window_spans_takeoff_to_landing():
    n = 600; hip = [1.0] * n
    for f in range(240, 330): hip[f] = 1.0 + 0.35 * (1 - abs(f - 285) / 45)   # up and down
    f0, f1 = C.window_jump(hip, FPS)
    assert f0 < 260 and f1 > 310 and f1 - f0 < 260, (f0, f1)

def test_spin_window_is_the_shortest_stretch_turning_a_full_circle():
    n = 800; yaw = [0.0] * n
    for f in range(200, 440): yaw[f] = (f - 200) * 1.5            # 360 deg over 2 s
    for f in range(440, n): yaw[f] = 360.0
    yaw = [((y + 180) % 360) - 180 for y in yaw]                   # wrapped like real data
    f0, f1 = C.window_spin(yaw, FPS, total=300)
    assert 150 <= f0 <= 260 and 380 <= f1 <= 480, (f0, f1)  # the turn plus 0.3 s padding either side

def test_busiest_window_has_the_most_hand_motion():
    n = 1000; speed = [0.1] * n
    for f in range(500, 620): speed[f] = 2.0
    f0, f1 = C.window_busiest(speed, FPS, 1.5)
    assert f0 <= 500 and f1 >= 620 and f1 - f0 == int(1.5 * FPS), (f0, f1)

def test_calmest_window_has_the_least_motion():
    n = 1000; speed = [1.0] * n
    for f in range(100, 500): speed[f] = 0.05
    f0, f1 = C.window_calmest(speed, FPS, 2.0)
    assert f0 >= 100 and f1 <= 500, (f0, f1)

def test_clip_windows_in_frames():
    (w0, w1), fw = C.windows(1.0, 3.0, 1, 10000, 'all')
    assert (w0, w1) == (121.0, 361.0) and fw == (121.0, 361.0)
    (w0, w1), fw = C.windows(1.0, 30.0, 1, 1000, 'start')
    assert w1 == 1000 and fw == (121.0, 139.0)  # clipped to the take; faces by the first 0.15 s
    assert len({n for n, *_ in C.CLIPS}) == len(C.CLIPS), 'clip names are unique'
    assert all(c[3] in ('all', 'start') and c[4] in ('relative', 'inplace') for c in C.CLIPS)
    assert all(c[2][0] > 0 for c in C.CLIPS), 'no window starts on frame 0 (the T-pose calibration frame of a CMU take)'

if __name__ == '__main__':
    fails = 0
    for n_, f in sorted(globals().items()):
        if n_.startswith('test_'):
            try:
                f(); print('PASS', n_)
            except Exception as e:
                fails += 1; print('FAIL', n_, repr(e))
    raise SystemExit(1 if fails else 0)
