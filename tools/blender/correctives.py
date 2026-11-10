# Pose-space corrective shapes (imported by build_player_mh.py; tested by test_correctives.py).
# Linear-blend skinning loses volume at a bent elbow or knee, a raised shoulder and a flexed hip. For each joint and angle
# the child bone is turned toward its natural direction, Blender's Corrective Smooth (delta mush) restores the volume, and
# the difference is stored in rest space as a shape key corr_<joint>_<L|R>_<degrees beyond rest>. The runtime
# (src/render3d/correctives.js) blends them in from the joint angles.
import math
import bpy
from mathutils import Vector, Matrix, Quaternion
from mathutils.kdtree import KDTree

T = 'mixamorig:'
# joint -> (child bone, degrees beyond rest, world direction the child bone turns toward)
SPEC = {'elbow': ('ForeArm', (45, 85), Vector((0, -1, 0))),    # forearm toward the front; the bind elbow is already ~46 deg bent
        'knee': ('Leg', (90, 140), Vector((0, 1, 0))),         # shin toward the back
        'shoulder': ('Arm', (90,), Vector((0, 0, 1))),          # upper arm raised
        'hip': ('UpLeg', (90,), Vector((0, -1, 0)))}            # thigh forward
# full effect within R of the joint, fading to none at 2R (metres): delta mush also nudges vertices far from the joint
RADIUS = {'elbow': 0.10, 'knee': 0.12, 'shoulder': 0.14, 'hip': 0.16}
DEFAULT = [(j, SPEC[j][0], SPEC[j][1], side) for j in SPEC for side in ('Left', 'Right')]


def _coords(body):
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [ev.matrix_world @ v.co for v in ev.data.vertices]


def _turn(arm, pb, toward, deg):
    """Rotate pose bone pb (parent at rest) about its head so it turns `deg` degrees toward the world direction `toward`."""
    aw = arm.matrix_world.to_3x3()
    rest = aw @ pb.bone.matrix_local.to_3x3()
    d = (aw @ (pb.bone.tail_local - pb.bone.head_local)).normalized()
    axis = d.cross(toward)
    if axis.length < 1e-6:
        axis = Vector((1, 0, 0))
    R = Matrix.Rotation(math.radians(deg), 3, axis.normalized())
    pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (rest.inverted() @ R @ rest).to_quaternion()
    return R.to_quaternion()


def add_correctives(body, arm, joints=None, min_mm=0.3):
    """Adds the corrective shape keys to `body` (skinned to `arm`) and returns their names. The pose is left at rest."""
    joints = joints or DEFAULT
    # skin vertices get the smoothed offsets; kit-shell vertices (open hems that smoothing would pull) copy the offset of the
    # nearest skin vertex so shirt and shorts follow the corrected body. A mesh without a Skin material counts as all skin.
    slots = [s_.material.name if s_.material else '' for s_ in body.material_slots]
    if 'Skin' in slots:
        si = slots.index('Skin'); skin = set()
        for p in body.data.polygons:
            if p.material_index == si:
                skin.update(p.vertices)
    else:
        skin = {v.index for v in body.data.vertices}
    if not body.data.shape_keys:
        body.shape_key_add(name='Basis')
    basis = body.data.shape_keys.key_blocks[0]
    to_local = body.matrix_world.to_3x3().inverted()
    made = []
    for joint, bone, degs, side in joints:
        toward = SPEC[joint][2]
        child = arm.pose.bones[T + side + bone]
        parent = child.parent
        if body.vertex_groups.get(child.name) is None:
            continue
        # bones that turn with the child (it and everything below it, e.g. forearm twist bones and the hand) and bones that
        # stay with the parent (the parent and its other children, e.g. upper-arm twist bones)
        below = {child.name} | {b.name for b in child.children_recursive}
        stay = ({parent.name} | {b.name for b in parent.children_recursive}) - below if parent else set()
        idx_c = {g.index for g in body.vertex_groups if g.name in below}
        idx_p = {g.index for g in body.vertex_groups if g.name in stay}
        joint_at = arm.matrix_world @ child.bone.head_local; r = RADIUS[joint]
        rest_pos = [body.matrix_world @ v.co for v in body.data.vertices]
        for deg in degs:
            Rq = _turn(arm, child, toward, deg)
            bpy.context.view_layer.update()
            plain = _coords(body)
            cs = body.modifiers.new('corr_cs', 'CORRECTIVE_SMOOTH')
            cs.iterations = 8; cs.smooth_type = 'LENGTH_WEIGHTED'; cs.rest_source = 'ORCO'
            bpy.context.view_layer.update()
            smooth = _coords(body)
            body.modifiers.remove(cs)
            key = body.shape_key_add(name=f'corr_{joint}_{side[0]}_{deg}', from_mix=False)
            biggest = 0.0
            posed_d = {}  # skin vertex -> offset in posed space (after falloff)
            for v in body.data.vertices:
                if v.index in skin:
                    fall = max(0.0, min(1.0, 2.0 - (rest_pos[v.index] - joint_at).length / r))
                    posed_d[v.index] = (smooth[v.index] - plain[v.index]) * fall
            tree = KDTree(len(skin))
            for i in skin:
                tree.insert(rest_pos[i], i)
            tree.balance()
            for v in body.data.vertices:
                w = {g.group: g.weight for g in v.groups}
                wc, wp = sum(w.get(i, 0.0) for i in idx_c), sum(w.get(i, 0.0) for i in idx_p)
                if wc + wp < 0.01:
                    continue  # only the two bones meeting at this joint
                d = posed_d[v.index] if v.index in skin else posed_d[tree.find(rest_pos[v.index])[1]]
                if d.length * 1000 < min_mm:
                    continue
                Rv = Quaternion().slerp(Rq, wc / max(1e-6, wc + wp))  # undo the skinned rotation this vertex received
                key.data[v.index].co = basis.data[v.index].co + to_local @ (Rv.inverted() @ d)
                biggest = max(biggest, d.length)
            made.append((key.name, round(biggest * 1000, 2)))
            child.rotation_quaternion = Quaternion()
    bpy.context.view_layer.update()
    return made
