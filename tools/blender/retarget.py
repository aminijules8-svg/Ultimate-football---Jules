# World-space animation retargeting onto the MakeHuman (MPFB "mixamo" rig) footballer.
# Imported by the build scripts that run inside Blender. Sources: Quaternius UAL (rigify DEF- bones),
# CMU BVH (cgspeed naming), Mixamo FBX (same bone names as the target) and any rig mapped by a {target: source} dict.
#
# For every mapped bone the source's world-space rotation change since its rest pose is applied to the
# target, after first swinging the target's rest direction onto the source's (A-pose vs T-pose fix):
#   W_t(f) = W_s(f) · Rs_rest⁻¹ · A · Rt_rest,   A = rotation taking target rest dir to source rest dir.
import bpy
from mathutils import Matrix, Quaternion, Vector

T = 'mixamorig:'
SIDES = (('Left', 'L', 'l'), ('Right', 'R', 'r'))
import math, re
# Fingers never come from the source (sources are fists or straight): every clip gets the same relaxed hand,
# a gentle curl per phalanx about the bone's local X. FINGER_SIGN flips the curl direction if a build shows them bending backward.
FINGER_SIGN = 1.0
FINGER_CURL = {'Thumb': (8, 10, 6), 'Index': (14, 18, 10), 'Middle': (16, 20, 11), 'Ring': (18, 22, 12), 'Pinky': (20, 24, 13)}
_FRE = re.compile(r'Hand(Thumb|Index|Middle|Ring|Pinky)(\d)$')
def relaxed_finger(name):
    m = _FRE.search(name)
    if not m:
        return None
    deg = FINGER_CURL[m.group(1)][int(m.group(2)) - 1]
    return Quaternion((1.0, 0.0, 0.0), FINGER_SIGN * math.radians(deg))

def _lr(fn):
    m = {}
    for side, s, s2 in SIDES:
        m.update(fn(side, s, s2))
    return m

MAP_CMU = {T + 'Hips': 'Hips', T + 'Spine': 'LowerBack', T + 'Spine1': 'Spine', T + 'Spine2': 'Spine1', T + 'Neck': 'Neck', T + 'Head': 'Head',
           **_lr(lambda S, s, s2: {T + S + 'Shoulder': S + 'Shoulder', T + S + 'Arm': S + 'Arm', T + S + 'ForeArm': S + 'ForeArm', T + S + 'Hand': S + 'Hand',
                                    # no finger roots mapped: CMU's thumb joint does not match the model's (a thumb->index palm proxy
                                    # read 150-177 deg off and broke the elbow planes), so CMU arms align by direction only
                                    T + S + 'UpLeg': S + 'UpLeg', T + S + 'Leg': S + 'Leg', T + S + 'Foot': S + 'Foot', T + S + 'ToeBase': S + 'ToeBase'})}
MAP_UAL = {T + 'Hips': 'DEF-hips', T + 'Spine': 'DEF-spine.001', T + 'Spine1': 'DEF-spine.002', T + 'Spine2': 'DEF-spine.003', T + 'Neck': 'DEF-neck', T + 'Head': 'DEF-head',
           **_lr(lambda S, s, s2: {T + S + 'Shoulder': 'DEF-shoulder.' + s, T + S + 'Arm': 'DEF-upper_arm.' + s, T + S + 'ForeArm': 'DEF-forearm.' + s, T + S + 'Hand': 'DEF-hand.' + s,
                                    T + S + 'UpLeg': 'DEF-thigh.' + s, T + S + 'Leg': 'DEF-shin.' + s, T + S + 'Foot': 'DEF-foot.' + s, T + S + 'ToeBase': 'DEF-toe.' + s,
                                    **{T + S + 'Hand' + f + str(i): 'DEF-f_' + f.lower() + '.0' + str(i) + '.' + s for f in ('Index', 'Middle', 'Ring', 'Pinky') for i in (1, 2, 3)},
                                    **{T + S + 'HandThumb' + str(i): 'DEF-thumb.0' + str(i) + '.' + s for i in (1, 2, 3)}})}


def _rot(m):
    return m.to_3x3().normalized()


def _order(arm):
    out = []
    def walk(b):
        out.append(b)
        for c in b.children:
            walk(c)
    for b in arm.data.bones:
        if b.parent is None:
            walk(b)
    return out


ARM_CHAIN = ('Arm', 'ForeArm', 'Hand')

PALM_PAIRS = (('HandIndex1', 'HandPinky1'), ('HandThumb1', 'HandIndex1'))  # across the palm (thumb->index only for rigs whose thumb roots match)


def _has(arm, names, side, pair):
    return all((n := names.get(T + side + b)) is not None and n in arm.data.bones for b in pair)


def palm_pair(src, src_names, tgt, tgt_names, side):
    """The first finger-root pair both rigs have (index->pinky, else thumb->index), or None."""
    return next((p for p in PALM_PAIRS if _has(src, src_names, side, p) and _has(tgt, tgt_names, side, p)), None)


def _palm(arm, w, side, names, pair):
    """Across-palm vector between the pair's finger roots, in world space."""
    a, b = (names[T + side + n] for n in pair)
    return (w @ arm.data.bones[b].head_local) - (w @ arm.data.bones[a].head_local)

def _frame(direction, secondary):
    """Orthonormal 3x3 with x = bone direction, y = secondary made perpendicular to it."""
    x = direction.normalized(); y = (secondary - x * secondary.dot(x)).normalized(); z = x.cross(y)
    return Matrix((x, y, z)).transposed()


class Retargeter:
    def __init__(self, src, tgt, bone_map, root_src, root_tgt, inplace=True, pre=None, arm_fix=False, align='frame', root='absolute'):
        self.src, self.tgt, self.inplace, self.pre = src, tgt, inplace, pre  # pre(frame): hook run before each sample (e.g. per-frame source rotation)
        self.root_mode, self.hip0 = root, None  # 'relative': keep the travel but start it at the origin (celebrations)
        self.arm_fix = arm_fix  # kept for callers; the CMU-era arm corrections were removed (2026-10-15: they bent arms away from the capture)
        self.map = {t: s for t, s in bone_map.items() if t in tgt.data.bones and s in src.data.bones}
        self.root_src, self.root_tgt = root_src, root_tgt
        self.order = _order(tgt)
        sw, tw = src.matrix_world, tgt.matrix_world
        self.tw_inv = _rot(tw).inverted()
        self.rs = {s: _rot(sw @ src.data.bones[s].matrix_local) for s in self.map.values()}
        self.rt = {t: _rot(tw @ tgt.data.bones[t].matrix_local) for t in self.map}
        self.align = {}
        src_names = {t: s for t, s in self.map.items()}
        tgt_names = {t: t for t in self.map}
        for t, s in self.map.items():
            bs, bt = src.data.bones[s], tgt.data.bones[t]
            ds = (_rot(sw) @ (bs.tail_local - bs.head_local)).normalized()
            dt = (_rot(tw) @ (bt.tail_local - bt.head_local)).normalized()
            A = dt.rotation_difference(ds).to_matrix()
            side = 'Left' if (T + 'Left') in t else 'Right' if (T + 'Right') in t else None
            if align == 'frame' and side and t[len(T) + len(side):] in ARM_CHAIN:
                pair = palm_pair(src, src_names, tgt, tgt_names, side)
                if pair:
                    A = _frame(ds, _palm(src, sw, side, src_names, pair)) @ _frame(dt, _palm(tgt, tw, side, tgt_names, pair)).inverted()
            self.align[t] = A
        # root translation is scaled by leg length; heights are measured from the ground (world z=0).
        # Source rest skeletons may sit anywhere (BVH rest is at the origin), so "standing hip height"
        # = leg length + the lowest foot height seen in the clip (set per bake by measure_ground()).
        self.src_feet = [s for t, s in self.map.items() if t.endswith('Foot')]
        self.tgt_feet = [t for t in self.map if t.endswith('Foot')]
        leg = lambda arm, w, root, feet: (w @ arm.data.bones[root].head_local).z - min((w @ arm.data.bones[f].head_local).z for f in feet)
        self.src_leg = leg(src, sw, root_src, self.src_feet)
        self.tgt_hip0 = tw @ tgt.data.bones[root_tgt].head_local
        self.scale = leg(tgt, tw, root_tgt, self.tgt_feet) / max(1e-6, self.src_leg)
        self.src_stand = None

    def measure_ground(self, frames):
        sc = bpy.context.scene; lo = 1e9; sw = self.src.matrix_world
        for f in frames[::2]:
            sc.frame_set(int(f))
            for b in self.src_feet:
                lo = min(lo, (sw @ self.src.pose.bones[b].head).z)
        self.src_stand = self.src_leg + lo

    def sample(self, frame):
        """Return {bone: (quat basis)} and root location basis for one source frame."""
        sc = bpy.context.scene
        sc.frame_set(int(frame), subframe=frame - int(frame))
        if self.pre:
            self.pre(frame)
        sw = self.src.matrix_world
        want = {}
        for t, s in self.map.items():
            ws = _rot(sw @ self.src.pose.bones[s].matrix)
            want[t] = self.tw_inv @ (ws @ self.rs[s].inverted() @ self.align[t] @ self.rt[t])
        return self._pose(want, sw)

    def _pose(self, want, sw):
        """Target world rotations -> per-bone basis rotations (and the root's location) for one frame."""
        hip = sw @ self.src.pose.bones[self.root_src].head
        tgt = self.tgt
        pose = {}  # armature-space pose rotation per bone (3x3) and head position
        basis = {}
        for b in self.order:
            rest = b.matrix_local
            if b.parent is None:
                prot, ppos = Matrix.Identity(3), Vector()
                local_rest = rest
            else:
                prot, ppos = pose[b.parent.name]
                local_rest = b.parent.matrix_local.inverted() @ rest
            lr_rot = _rot(local_rest)
            base_rot = prot @ lr_rot  # orientation with identity basis
            rf = relaxed_finger(b.name)
            if rf is not None:
                q = rf
            elif b.name in want:
                q = (base_rot.inverted() @ want[b.name]).to_quaternion()
            else:
                q = Quaternion()
            q.normalize()
            rot = base_rot @ q.to_matrix()
            head = (ppos + prot @ local_rest.translation) if b.parent else rest.translation.copy()
            loc = Vector()
            if b.name == self.root_tgt:
                # root: source hip displacement since rest, scaled, expressed in the bone's rest frame
                disp = Vector((hip.x * self.scale, hip.y * self.scale, (hip.z - self.src_stand) * self.scale))
                if self.root_mode == 'relative' and self.hip0 is not None:
                    disp.x -= self.hip0.x * self.scale; disp.y -= self.hip0.y * self.scale
                if self.inplace:
                    disp.x = disp.y = 0.0
                arm_disp = self.tw_inv @ disp
                loc = lr_rot.inverted() @ arm_disp
                head = head + arm_disp
            pose[b.name] = (rot, head)
            basis[b.name] = (q, loc)
        return basis, hip


def make_turned(src, tgt, bone_map, root_src, root_tgt, turn=0.0, **kw):
    """Build a Retargeter from the source's unturned rest pose, then turn the source about Z: by `turn` radians, or by
    calling turn(src) when it is a function. Turning first would cancel out (the rest frames would turn with the
    motion), which is why per-clip facing corrections used to do nothing."""
    src.rotation_euler.z = 0.0; bpy.context.view_layer.update()
    rt = Retargeter(src, tgt, bone_map, root_src, root_tgt, **kw)
    if callable(turn):
        turn(src)
    else:
        src.rotation_euler.z = turn
    bpy.context.view_layer.update()
    return rt


def bake(rt, action_name, frames):
    """Sample the source over `frames` (source frame numbers, floats ok) and write a new action on the target."""
    tgt = rt.tgt
    rt.measure_ground(frames)
    if rt.root_mode == 'relative':  # travel is measured from where the clip starts
        bpy.context.scene.frame_set(int(frames[0]), subframe=frames[0] - int(frames[0]))
        if rt.pre:
            rt.pre(frames[0])
        rt.hip0 = (rt.src.matrix_world @ rt.src.pose.bones[rt.root_src].head).copy()
    data = [rt.sample(f) for f in frames]
    act = bpy.data.actions.new(action_name)
    tgt.animation_data_create(); tgt.animation_data.action = act
    for b in rt.order:
        pb = tgt.pose.bones[b.name]; pb.rotation_mode = 'QUATERNION'
        path = f'pose.bones["{b.name}"]'
        qs = [d[0][b.name][0] for d in data]
        for i in range(1, len(qs)):  # keep quaternions on one hemisphere so interpolation is smooth
            if qs[i].dot(qs[i - 1]) < 0:
                qs[i] = -qs[i]
        for c in range(4):
            fc = act.fcurves.new(path + '.rotation_quaternion', index=c, action_group=b.name)
            fc.keyframe_points.add(len(qs)); flat = []
            for i, q in enumerate(qs):
                flat += [i + 1, q[c]]
            fc.keyframe_points.foreach_set('co', flat); fc.update()
        if b.name == rt.root_tgt:
            for c in range(3):
                fc = act.fcurves.new(path + '.location', index=c, action_group=b.name)
                fc.keyframe_points.add(len(data)); flat = []
                for i, d in enumerate(data):
                    v = d[0][b.name][1][c]
                    flat += [i + 1, v]
                fc.keyframe_points.foreach_set('co', flat); fc.update()
    return act

MAP_UAL2 = {T + 'Hips': 'pelvis', T + 'Spine': 'spine_01', T + 'Spine1': 'spine_02', T + 'Spine2': 'spine_03', T + 'Neck': 'neck_01', T + 'Head': 'Head',
            **_lr(lambda S, s, s2: {T + S + 'Shoulder': 'clavicle_' + s2, T + S + 'Arm': 'upperarm_' + s2, T + S + 'ForeArm': 'lowerarm_' + s2, T + S + 'Hand': 'hand_' + s2,
                                     T + S + 'UpLeg': 'thigh_' + s2, T + S + 'Leg': 'calf_' + s2, T + S + 'Foot': 'foot_' + s2, T + S + 'ToeBase': 'ball_' + s2,
                                     **{T + S + 'Hand' + f + str(i): f.lower() + '_0' + str(i) + '_' + s2 for f in ('Index', 'Middle', 'Ring', 'Pinky') for i in (1, 2, 3)},
                                     **{T + S + 'HandThumb' + str(i): 'thumb_0' + str(i) + '_' + s2 for i in (1, 2, 3)}})}


def map_identity(tgt):
    """Mixamo sources use the target's own bone names (mixamorig:*)."""
    return {b.name: b.name for b in tgt.data.bones}
