# tools/blender/armmath.py — scale-free arm metrics shared by armcheck.py (Blender) and its tests (plain python3).
# Points are (x, y, z) tuples in a Z-up world.
import math

def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    l = math.sqrt(dot(a, a)) or 1.0
    return (a[0] / l, a[1] / l, a[2] / l)
def angle(a, b):
    return math.degrees(math.acos(max(-1.0, min(1.0, dot(norm(a), norm(b))))))

def elbow_flex(shoulder, elbow, wrist):
    """0 = straight arm; 90 = forearm at right angles to the upper arm."""
    return angle(sub(elbow, shoulder), sub(wrist, elbow))

def hang(shoulder, elbow):
    """Angle between the upper arm and straight down."""
    return angle(sub(elbow, shoulder), (0.0, 0.0, -1.0))

def body_frame(l_hip, r_hip):
    """Right, forward, up unit vectors from the hip joints (same construction on any rig)."""
    r = sub(r_hip, l_hip); right = norm((r[0], r[1], 0.0)); up = (0.0, 0.0, 1.0)
    return right, cross(up, right), up  # up x right: a body whose right hip is at -X faces -Y (the rigs' forward)

def hand_local(origin, frame, hand, arm_len):
    """Hand position relative to `origin` (the shoulder joint, so torso proportions cancel out), in the hips frame, in arm lengths."""
    d = sub(hand, origin); right, fwd, up = frame
    return (dot(d, right) / arm_len, dot(d, fwd) / arm_len, dot(d, up) / arm_len)

def palm_local(frame, index_root, pinky_root):
    """Unit across-palm vector (index root -> pinky root) in the hips frame: shows forearm and wrist twist."""
    d = norm(sub(pinky_root, index_root)); right, fwd, up = frame
    return (dot(d, right), dot(d, fwd), dot(d, up))

def elbow_out(shoulder, elbow, frame, arm_len):
    """How far the elbow sits out to the side of its shoulder (either side), in arm lengths: chicken-wing arms read high."""
    return abs(dot(sub(elbow, shoulder), frame[0])) / arm_len

def facing_err(frame):
    """Degrees between the hips' forward axis and -Y (the direction every clip should face)."""
    return angle(frame[1], (0.0, -1.0, 0.0))

def yaw_deg(frame):
    """Heading of the hips' right axis in degrees (for measuring how much a clip turns the body)."""
    r = frame[0]
    return math.degrees(math.atan2(r[1], r[0]))

def foot_slide(rows, planted=0.04):
    """Largest horizontal drift per frame (mm) of a planted foot: within `planted` m of the lowest point either foot
    reaches in the clip, on both frames. Rows carry 'feet': {'L': (x, y, z), 'R': ...} in metres."""
    zs = [r['feet'][s][2] for r in rows if 'feet' in r for s in ('L', 'R')]
    if not zs:
        return 0.0
    low = min(zs) + planted; worst = 0.0
    for side in ('L', 'R'):
        for a, b in zip(rows, rows[1:]):
            pa, pb = a['feet'][side], b['feet'][side]
            if pa[2] <= low and pb[2] <= low:
                worst = max(worst, math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 1000.0)
    return worst

def summarise(src_rows, tgt_rows):
    """Worst and mean errors between per-frame source and target rows."""
    e, h, g, pa = [], [], [], []
    for s, t in zip(src_rows, tgt_rows):
        for side in ('L', 'R'):
            e.append(abs(s['elbow'][side] - t['elbow'][side]))
            h.append(math.dist(s['hand'][side], t['hand'][side]))
            g.append(t['hang'][side])
            ps, pt = s.get('palm', {}).get(side), t.get('palm', {}).get(side)
            if ps is not None and pt is not None:
                pa.append(angle(ps, pt))
    n = max(1, len(e))
    yaws = [t['yaw'] for t in tgt_rows if 'yaw' in t]
    yaws = [((y - yaws[0] + 180.0) % 360.0) - 180.0 for y in yaws]  # relative to the first frame, wrapped to [-180, 180)
    outs = [v for t in tgt_rows for v in t.get('out', {}).values()]
    faces = [t['facing'] for t in tgt_rows if 'facing' in t]
    extra = {'yaw_range': (max(yaws) - min(yaws)) if yaws else 0.0, 'elbow_out_max': max(outs) if outs else 0.0,
             'facing_err_mean': (sum(faces) / len(faces)) if faces else 0.0}
    return {**extra, 'frames': len(tgt_rows), 'elbow_err_max': max(e or [0]), 'elbow_err_mean': sum(e) / n,
            'hand_err_max': max(h or [0]), 'hand_err_mean': sum(h) / n, 'hang_tgt_max': max(g or [0]),
            'palm_err_max': max(pa) if pa else None}
