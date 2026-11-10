# tools/blender/test_armmath.py — run: python3 tools/blender/test_armmath.py
import math
import armmath as M

def close(a, b, tol=1e-6):
    return abs(a - b) <= tol

def test_elbow_straight_and_right_angle():
    assert close(M.elbow_flex((0, 0, 0), (1, 0, 0), (2, 0, 0)), 0.0)
    assert close(M.elbow_flex((0, 0, 0), (1, 0, 0), (1, 1, 0)), 90.0)

def test_hang_down_and_horizontal():
    assert close(M.hang((0, 0, 1), (0, 0, 0)), 0.0)
    assert close(M.hang((0, 0, 1), (1, 0, 1)), 90.0)

def test_body_frame_and_hand_local():
    right, fwd, up = M.body_frame((-0.1, 0, 1), (0.1, 0, 1))
    assert right == (1.0, 0.0, 0.0) and up == (0.0, 0.0, 1.0)
    assert close(fwd[1], 1.0)  # Z-up: a body whose right hip is at +X faces +Y (forward = up x right)
    x, y, z = M.hand_local((0, 0, 1), (right, fwd, up), (0.3, -0.6, 1.0), 0.6)
    assert close(x, 0.5) and close(y, -1.0) and close(z, 0.0)

def test_palm_local_is_unit_and_in_hips_frame():
    fr = M.body_frame((-0.1, 0, 1), (0.1, 0, 1))
    p = M.palm_local(fr, (0, 0, 1), (0, 0, 0.5))  # pinky straight below the index root
    assert close(p[2], -1.0)

def test_summarise_reports_worst_errors():
    src = [{'elbow': {'L': 30, 'R': 40}, 'hand': {'L': (0, 0, 0), 'R': (0, 0, 0)}, 'hang': {'L': 5, 'R': 5}, 'palm': {'L': (1, 0, 0), 'R': None}}]
    tgt = [{'elbow': {'L': 36, 'R': 41}, 'hand': {'L': (0.03, 0.04, 0), 'R': (0, 0, 0)}, 'hang': {'L': 12, 'R': 4}, 'palm': {'L': (0, 1, 0), 'R': (1, 0, 0)}}]
    s = M.summarise(src, tgt)
    assert close(s['elbow_err_max'], 6.0) and close(s['hand_err_max'], 0.05) and close(s['hang_tgt_max'], 12.0)
    assert close(s['palm_err_max'], 90.0)

def test_elbow_out_measures_sideways_flare():
    fr = M.body_frame((-0.1, 0, 1), (0.1, 0, 1))   # right = +X
    assert close(M.elbow_out((0.2, 0, 1.5), (0.2, 0, 1.2), fr, 0.6), 0.0)    # elbow straight below the shoulder
    assert close(M.elbow_out((0.2, 0, 1.5), (0.35, 0, 1.25), fr, 0.6), 0.25)  # elbow 15 cm out to the side

def test_yaw_and_summary_extras():
    fr = M.body_frame((0, -0.1, 1), (0, 0.1, 1))     # right = +Y: turned 90 deg from +X
    assert close(M.yaw_deg(fr), 90.0)
    row = lambda yaw, out: {'elbow': {'L': 0, 'R': 0}, 'hand': {'L': (0, 0, 0), 'R': (0, 0, 0)}, 'hang': {'L': 0, 'R': 0}, 'yaw': yaw, 'out': {'L': out, 'R': 0.1}}
    s = M.summarise([row(0, 0.2), row(10, 0.2)], [row(0, 0.2), row(30, 0.4)])
    assert close(s['yaw_range'], 30.0) and close(s['elbow_out_max'], 0.4)

def test_yaw_range_wraps_around_180():
    row = lambda yaw: {'elbow': {'L': 0, 'R': 0}, 'hand': {'L': (0, 0, 0), 'R': (0, 0, 0)}, 'hang': {'L': 0, 'R': 0}, 'yaw': yaw}
    s = M.summarise([row(0), row(0)], [row(179.0), row(-179.0)])
    assert close(s['yaw_range'], 2.0)

def test_facing_error_against_minus_y():
    assert close(M.facing_err(M.body_frame((0.1, 0, 1), (-0.1, 0, 1))), 0.0)    # right hip at -X -> facing -Y (the rigs' forward)
    assert close(M.facing_err(M.body_frame((-0.1, 0, 1), (0.1, 0, 1))), 180.0)  # right hip at +X -> facing +Y, turned around
    assert close(M.facing_err(M.body_frame((0, -0.1, 1), (0, 0.1, 1))), 90.0)   # turned a quarter

def test_foot_slide_counts_only_planted_feet():
    # left foot planted (low) but drifting 3 mm per frame; right foot in the air moving fast
    rows = [{'feet': {'L': (0.003 * f, 0.0, 0.02), 'R': (0.1 * f, 0.0, 0.30)}} for f in range(10)]
    s = M.foot_slide(rows)
    assert abs(s - 3.0) < 1e-6, s
    assert M.foot_slide([{'feet': {'L': (0, 0, 0.5), 'R': (0, 0, 0.5)}}] * 3) == 0.0

if __name__ == '__main__':
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith('test_'):
            try:
                f(); print('PASS', n)
            except Exception as e:
                fails += 1; print('FAIL', n, repr(e))
    raise SystemExit(1 if fails else 0)
