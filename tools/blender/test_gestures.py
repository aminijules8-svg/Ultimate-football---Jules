# tools/blender/test_gestures.py — run: blender -b --python tools/blender/test_gestures.py
# A gesture is a real captured body with the arms steered by IK toward targets that ride on a body bone: after baking,
# the wrist sits on the target (within 1 cm) through the hold, each arm is untouched before its own start, the IK
# constraints are gone, and bones the gesture does not use keep the base motion.
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Quaternion, Vector
import gestures as G

T = 'mixamorig:'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 30
bpy.ops.object.armature_add(enter_editmode=True)
arm = bpy.context.object; eb = arm.data.edit_bones
hips = eb[0]; hips.name = T + 'Hips'; hips.head = (0, 0, 1.0); hips.tail = (0, 0, 1.1)
sp = eb.new(T + 'Spine2'); sp.head = (0, 0, 1.1); sp.tail = (0, 0, 1.45); sp.parent = hips
hd = eb.new(T + 'Head'); hd.head = (0, 0, 1.55); hd.tail = (0, 0, 1.75); hd.parent = sp
for side, sx in (('Left', 1), ('Right', -1)):
    a = eb.new(T + side + 'Arm'); a.head = (0.18 * sx, 0, 1.42); a.tail = (0.38 * sx, 0, 1.22); a.parent = sp
    f = eb.new(T + side + 'ForeArm'); f.head = a.tail; f.tail = (0.55 * sx, 0, 1.03); f.parent = a; f.use_connect = True
    h = eb.new(T + side + 'Hand'); h.head = f.tail; h.tail = (0.62 * sx, 0, 0.96); h.parent = f; h.use_connect = True
    for fn, dy in (('Index1', -0.03), ('Pinky1', 0.03)):  # finger roots: index toward the front, as on the real rig
        fb = eb.new(T + side + 'Hand' + fn); fb.head = (0.62 * sx, dy, 0.96); fb.tail = (0.66 * sx, dy, 0.92); fb.parent = eb[T + side + 'Hand']
bpy.ops.object.mode_set(mode='OBJECT')

# base motion: the hips sway sideways and the head turns (the targets must follow the bone that carries them)
act = bpy.data.actions.new('base'); arm.animation_data_create(); arm.animation_data.action = act
hb = arm.pose.bones[T + 'Hips']
base_hand = {sd: arm.pose.bones[T + sd + 'Hand'].matrix.to_3x3().copy() for sd in ('Left', 'Right')}  # rest (no keys yet)
for f, x in ((1, 0.0), (30, 0.05), (60, 0.0)):
    hb.location = (x, 0, 0); hb.keyframe_insert('location', frame=f)
hh = arm.pose.bones[T + 'Head']; hh.rotation_mode = 'QUATERNION'
for f, ang in ((1, 0.0), (30, 0.8), (60, 0.8)):
    hh.rotation_quaternion = Quaternion((0, 0, 1), ang); hh.keyframe_insert('rotation_quaternion', frame=f)

# right hand to the mouth (rides on the Head); left hand to the chest (rides on Spine2, offset measured from the head's
# rest position) starting later than the right
MOUTH = (-0.02, -0.16, -0.08); CHEST = (0.04, -0.2, -0.3)
# hands: the right one's fingers point up with the palm to its left (rides on the turning head), the left one's palm on
# the chest with the fingers up and across
AIM_R, PALM_R, AIM_L, PALM_L = (0, 0, 1), (1, 0, 0), (-0.45, 0, 0.9), (0, 1, 0)
spec = {'arms': [{'side': 'Right', 'anchor': 'Head', 'offset': MOUTH, 'hand': {'aim': AIM_R, 'palm': PALM_R}},
                 {'side': 'Left', 'anchor': 'Spine2', 'ref': 'Head', 'offset': CHEST, 'in': (16, 24), 'hand': {'aim': AIM_L, 'palm': PALM_L}}],
        'in': (10, 20), 'out': None, 'fingers': None}
new = G.add_gesture(arm, act, 'celebrate_test', spec)
arm.animation_data.action = new
sc = bpy.context.scene


def wrist(side, f):
    sc.frame_set(f); return arm.matrix_world @ arm.pose.bones[T + side + 'Hand'].head


def on_bone(bone, rest_point, f):
    """World position at frame f of a point given at rest that rides on `bone`."""
    sc.frame_set(f); b = arm.pose.bones[T + bone]
    return arm.matrix_world @ (b.matrix @ (b.bone.matrix_local.inverted() @ rest_point))


head_rest = Vector((0, 0, 1.55))
mouth = [(wrist('Right', f) - on_bone('Head', head_rest + Vector(MOUTH), f)).length for f in (20, 35, 50, 60)]
chest = [(wrist('Left', f) - on_bone('Spine2', head_rest + Vector(CHEST), f)).length for f in (24, 35, 50, 60)]


def base_wrist(side, f):  # the base action leaves the arms at rest; only the hips sway carries them
    sc.frame_set(f); return arm.matrix_world @ (Vector((0.55 if side == 'Left' else -0.55, 0, 1.03)) + Vector((hb.location.x, 0, 0)))


right_before = max((wrist('Right', f) - base_wrist('Right', f)).length for f in (1, 5, 10))
left_before = max((wrist('Left', f) - base_wrist('Left', f)).length for f in (1, 10, 16))  # the right arm is already moving
import math


def hand_frame(side, f):
    """(finger direction, palm normal) of a hand in world space at frame f (palm from the finger roots, as gestures.py)."""
    sc.frame_set(f); P = arm.pose.bones; h = P[T + side + 'Hand']
    fy = (h.tail - h.head).normalized(); across = P[T + side + 'HandIndex1'].head - P[T + side + 'HandPinky1'].head
    return fy, fy.cross(across).normalized() * (1 if side == 'Left' else -1)


def want(bone, aim, palm, f):
    sc.frame_set(f); b = arm.pose.bones[T + bone]; R = b.matrix.to_3x3() @ b.bone.matrix_local.to_3x3().inverted()
    y = (R @ Vector(aim)).normalized(); n = R @ Vector(palm); return y, (n - n.dot(y) * y).normalized()


deg = lambda u, v: math.degrees(u.angle(v))
orient = []
for side, bone, aim, palm, frames in (('Right', 'Head', AIM_R, PALM_R, (20, 35, 60)), ('Left', 'Spine2', AIM_L, PALM_L, (24, 40, 60))):
    for f in frames:
        (fy, pn), (wy, wn) = hand_frame(side, f), want(bone, aim, palm, f)
        orient.append(max(deg(fy, wy), deg(pn, wn)))
sc.frame_set(12); left_hand_before = deg(arm.pose.bones[T + 'LeftHand'].matrix.to_3x3().to_quaternion() @ Vector((0, 1, 0)), base_hand['Left'].to_quaternion() @ Vector((0, 1, 0)))
print('hand orientation error (deg)', [round(e, 2) for e in orient], 'left hand before its start', round(left_hand_before, 2))
no_constraints = all(len(pb.constraints) == 0 for pb in arm.pose.bones)
hips_kept = abs(new.fcurves.find('pose.bones["mixamorig:Hips"].location', index=0).evaluate(30) - 0.05) < 1e-6
print('mouth hold (mm)', [round(e * 1000, 1) for e in mouth], 'chest hold (mm)', [round(e * 1000, 1) for e in chest])
print('before start (mm): right', round(right_before * 1000, 1), 'left', round(left_before * 1000, 1),
      'constraints gone', no_constraints, 'hips kept', hips_kept, 'logged', list(new['hold_err_mm']))
ok = max(orient) < 3 and left_hand_before < 0.5 and max(mouth + chest) < 0.01 and right_before < 0.002 and left_before < 0.002 and no_constraints and hips_kept
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
