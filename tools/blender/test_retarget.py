# tools/blender/test_retarget.py — run: blender -b --python tools/blender/test_retarget.py
# Two toy rigs whose rest poses differ in arm direction (T vs A) AND in palm roll: the source's palm faces down,
# the target's faces forward. With the source standing in its rest pose, the retargeted target must show the
# source's palm orientation (across-palm vector along the arm's sideways axis), not keep its own roll.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import retarget as R

T = 'mixamorig:'

def make_rig(name, arm_dir, palm_across, fingers=('HandIndex1', 'HandPinky1')):
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.armature_add(enter_editmode=True)
    ob = bpy.context.object; ob.name = name; eb = ob.data.edit_bones
    root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
    for side, sx in (('Left', 1), ('Right', -1)):
        lh = eb.new(T + side + 'UpLeg'); lh.head = (0.1 * sx, 0, 1); lh.tail = (0.1 * sx, 0, 0.5); lh.parent = root
        ft = eb.new(T + side + 'Foot'); ft.head = (0.1 * sx, 0, 0.08); ft.tail = (0.1 * sx, -0.12, 0.02); ft.parent = lh  # the retargeter measures leg length to the feet
        sh = Vector((0.2 * sx, 0, 1.5)); d = Vector((arm_dir[0] * sx, arm_dir[1], arm_dir[2])).normalized()
        a = eb.new(T + side + 'Arm'); a.head = sh; a.tail = sh + d * 0.3; a.parent = root
        f = eb.new(T + side + 'ForeArm'); f.head = a.tail; f.tail = a.tail + d * 0.3; f.parent = a; f.use_connect = True
        h = eb.new(T + side + 'Hand'); h.head = f.tail; h.tail = f.tail + d * 0.1; h.parent = f; h.use_connect = True
        across = Vector(palm_across) * 0.03
        for fn, sgn in ((fingers[0], -1), (fingers[1], 1)):
            b = eb.new(T + side + fn); b.head = h.tail + across * sgn; b.tail = b.head + d * 0.05; b.parent = h
    bpy.ops.object.mode_set(mode='POSE')
    return ob

def palm(ob, side, fingers=('HandIndex1', 'HandPinky1')):
    w = ob.matrix_world
    p = (w @ ob.pose.bones[T + side + fingers[1]].head) - (w @ ob.pose.bones[T + side + fingers[0]].head)
    return p.normalized()

src = make_rig('src', (1, 0, 0), (0, 0, 1))      # T-pose, across-palm vector vertical (palm facing forward/back)
tgt = make_rig('tgt', (1, 0, -1), (0, 1, 0))     # A-pose, across-palm vector front-back (rolled 90° about the arm)
bpy.context.view_layer.update()

rt = R.Retargeter(src, tgt, R.map_identity(tgt), T + 'Hips', T + 'Hips', align='frame', arm_fix=False)
rt.src_stand = 1.0
basis, _ = rt.sample(1)
for b, (q, loc) in basis.items():
    if 'HandIndex' in b or 'HandPinky' in b:
        continue  # fingers get the relaxed curl; the test reads their roots, which follow the hand
    p = tgt.pose.bones[b]; p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = q
bpy.context.view_layer.update()
err = math.degrees(palm(tgt, 'Left').angle(palm(src, 'Left')))
print('palm error', round(err, 2), 'PASS' if err < 5 else 'FAIL')

# CMU-style source: no pinky, only thumb and index roots; the target has all three. The thumb->index direction
# must line up the same way.
src2 = make_rig('src2', (1, 0, 0), (0, 0, 1), fingers=('HandThumb1', 'HandIndex1'))
tgt2 = make_rig('tgt2', (1, 0, -1), (0, 1, 0), fingers=('HandThumb1', 'HandIndex1'))
bpy.context.view_layer.update()
rt2 = R.Retargeter(src2, tgt2, {b.name: b.name for b in tgt2.data.bones if 'Pinky' not in b.name}, T + 'Hips', T + 'Hips', align='frame', arm_fix=False)
rt2.src_stand = 1.0
basis2, _ = rt2.sample(1)
for b, (q, loc) in basis2.items():
    if 'Hand' in b and b.endswith('1'):
        continue
    p = tgt2.pose.bones[b]; p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = q
bpy.context.view_layer.update()
err2 = math.degrees(palm(tgt2, 'Left', ('HandThumb1', 'HandIndex1')).angle(palm(src2, 'Left', ('HandThumb1', 'HandIndex1'))))
print('thumb-index palm error', round(err2, 2), 'PASS' if err2 < 5 else 'FAIL')
sys.exit(0 if err < 5 and err2 < 5 else 1)
