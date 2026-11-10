# Celebration clips (Phase B): segment finders that pick the part of a long motion capture holding the move, and the
# clip table the build reads. The finders are plain Python over per-frame tracks (tested by test_celebrate.py); the
# build samples the tracks inside Blender and calls them. Frames are source frames; fps 120 for CMU captures.

def _runs(mask):
    """(start, end) of every run of True values; end is exclusive."""
    out, s = [], None
    for i, m in enumerate(mask + [False]):
        if m and s is None:
            s = i
        elif not m and s is not None:
            out.append((s, i)); s = None
    return out


def _pad(f0, f1, pad, n):
    return max(0, f0 - pad), min(n - 1, f1 + pad)


def window_hands_up(hand_l_z, hand_r_z, head_z, fps, min_s=0.4, pad_s=0.5):
    """Longest stretch with both hands above the head, padded either side; None when it never happens."""
    n = len(head_z)
    runs = [r for r in _runs([hand_l_z[f] > head_z[f] + 0.05 and hand_r_z[f] > head_z[f] + 0.05 for f in range(n)]) if r[1] - r[0] >= min_s * fps]
    if not runs:
        return None
    f0, f1 = max(runs, key=lambda r: r[1] - r[0])
    return _pad(f0, f1, int(pad_s * fps), n)


def window_jump(hip_z, fps, rise=0.2, pad_s=0.6):
    """Take-off to landing of the highest jump (hips more than `rise` metres above their standing height)."""
    n = len(hip_z); stand = sorted(hip_z)[n // 2]
    runs = _runs([z > stand + rise for z in hip_z])
    if not runs:
        return None
    f0, f1 = max(runs, key=lambda r: max(hip_z[r[0]:r[1]]))
    return _pad(f0, f1, int(pad_s * fps), n)


def window_spin(yaw_deg, fps, total=300.0, pad_s=0.3):
    """Shortest stretch over which the (unwrapped) heading changes by at least `total` degrees."""
    un = [yaw_deg[0]]
    for y in yaw_deg[1:]:
        d = (y - un[-1] + 180.0) % 360.0 - 180.0
        un.append(un[-1] + d)
    best = None; j = 0
    for i in range(len(un)):
        while j < len(un) and abs(un[j] - un[i]) < total:
            j += 1
        if j >= len(un):
            break
        if best is None or j - i < best[1] - best[0]:
            best = (i, j)
    if best is None:
        return None
    return _pad(best[0], best[1], int(pad_s * fps), len(un))


def window_busiest(speed, fps, length_s):
    """The `length_s` window with the most motion (sum of speeds)."""
    L = min(len(speed), int(length_s * fps)); s = sum(speed[:L]); best = (s, 0)
    for i in range(1, len(speed) - L + 1):
        s += speed[i + L - 1] - speed[i - 1]
        if s > best[0]:
            best = (s, i)
    return best[1], best[1] + L


def window_calmest(speed, fps, length_s):
    """The `length_s` window with the least motion."""
    L = min(len(speed), int(length_s * fps)); s = sum(speed[:L]); best = (s, 0)
    for i in range(1, len(speed) - L + 1):
        s += speed[i + L - 1] - speed[i - 1]
        if s < best[0]:
            best = (s, i)
    return best[1], best[1] + L


CMU_FPS = 120
# name, CMU take, (start s, end s), face: 'all' = face forward by the hips over the whole window, 'start' = by the first
# 0.15 s (spins and flips turn through every heading). Windows were read from per-frame tracks with the finders above:
# hands above the head (56_02 at 20.3 s), jumps (85_01, 83_61, 87_03, 49_02), spins (85_01, 83_61), gesture energy.
CLIPS = [
    # name, take, (start s, end s), face ('all' / 'start': hips facing over the window / its first 0.15 s),
    # root ('relative': keep the actor's own steps from the first frame; 'inplace': no travel — flips and spin-jumps
    # would otherwise leave the body metres away and slide back after)
    ('celebrate_cheer', '79_69', (0.9, 4.6), 'all', 'relative'),       # "very happy": arms thrown up twice
    ('celebrate_happy', '80_43', (0.7, 4.5), 'all', 'relative'),       # "happy": lively gestures
    ('celebrate_fists', '56_02', (20.3, 22.6), 'all', 'relative'),     # "fists up"
    ('celebrate_jumpspin', '85_01', (3.9, 6.7), 'start', 'inplace'),   # jump with a twist
    ('celebrate_spin', '83_61', (1.25, 3.2), 'start', 'relative'),     # hop turning a full circle
    ('celebrate_backflip', '87_03', (0.05, 2.05), 'start', 'inplace'),  # (frame 0 of a CMU take is the T-pose)
    ('celebrate_jump', '49_02', (1.3, 3.6), 'all', 'relative'),        # jumping up and down
    ('celebrate_dance', '141_12', (0.6, 4.6), 'all', 'relative'),      # "dance, twist"
    ('celebrate_angry', '18_10', (2.7, 5.6), 'all', 'relative'),       # "come on!" gestures
    ('hug', '22_05', (0.2, 4.2), 'all', 'inplace'),                    # both hands on a team-mate's shoulders (paired moves stay in
                                                                       # place: the director spaces the pair, its own steps would part them)
    ('hand_slap', '141_28', (0.05, 2.95), 'all', 'inplace'),         # team-mates' high five (CMU 141_22 walks 3.5 m into it)
    ('react_sad', '79_71', (0.7, 6.5), 'all', 'relative'),
    ('react_upset', '79_74', (1.9, 5.5), 'all', 'relative'),           # hands to the head
    ('react_complain', '18_10', (9.5, 12.7), 'all', 'relative'),       # remonstrating (heading steady within ~10 deg here)
]


def windows(t0, t1, start, end, face):
    """(window, forward) in source frames for a take whose action starts at `start` and ends at `end`."""
    w0 = start + t0 * CMU_FPS; w1 = min(end, start + t1 * CMU_FPS)
    return (w0, w1), ((w0, w0 + 0.15 * CMU_FPS) if face == 'start' else (w0, w1))
