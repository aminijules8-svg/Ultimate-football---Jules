# tools/blender/test_facing.py — run: blender -b --python tools/blender/test_facing.py
# A capture whose actor stands facing +X must come out facing -Y (the rig's forward) when the build turns the source
# by -90 degrees. Turning the source object before the Retargeter reads its rest pose cancels out (the rest frames
# turn with the motion), so R.make_turned reads the rest pose first and turns afterwards.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector, Quaternion
import retarget as R

T = 'mixamorig:'
bpy.ops.wm.read_factory_settings(use_empty=True)

def make_rig(name):
    bpy.ops.object.armature_add(enter_editmode=True)
    ob = bpy.context.object; ob.name = name; eb = ob.data.edit_bones
    root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
    for side, sx in (('Left', 1), ('Right', -1)):  # rest pose faces -Y: left hip at +X
        lh = eb.new(T + side + 'UpLeg'); lh.head = (0.1 * sx, 0, 1); lh.tail = (0.1 * sx, 0, 0.5); lh.parent = root
        ft = eb.new(T + side + 'Foot'); ft.head = (0.1 * sx, 0, 0.08); ft.tail = (0.1 * sx, -0.12, 0.02); ft.parent = lh
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob

def forward(ob):
    w = ob.matrix_world; r = (w @ ob.pose.bones[T + 'RightUpLeg'].head) - (w @ ob.pose.bones[T + 'LeftUpLeg'].head); r.z = 0
    return Vector((0, 0, 1)).cross(r).normalized()

src, tgt = make_rig('src'), make_rig('tgt')
hb = src.pose.bones[T + 'Hips']; hb.rotation_mode = 'QUATERNION'
rest = (src.matrix_world @ hb.bone.matrix_local).to_3x3()
yaw = Quaternion((0, 0, 1), math.radians(90)).to_matrix()  # the actor turned to face +X
hb.rotation_quaternion = (rest.inverted() @ yaw @ rest).to_quaternion()
bpy.context.view_layer.update()
print('source forward', tuple(round(x, 2) for x in forward(src)))

rt = R.make_turned(src, tgt, R.map_identity(tgt), T + 'Hips', T + 'Hips', turn=math.radians(-90), arm_fix=False)
rt.src_stand = 1.0
basis, _ = rt.sample(1)
for b, (q, loc) in basis.items():
    p = tgt.pose.bones[b]; p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = q
bpy.context.view_layer.update()
f = forward(tgt)
ok = f.y < -0.99
print('target forward', tuple(round(x, 2) for x in f), 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
