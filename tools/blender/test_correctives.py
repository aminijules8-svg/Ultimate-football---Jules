# tools/blender/test_correctives.py — run: blender -b --python tools/blender/test_correctives.py
# A tube skinned to a two-bone arm (Arm, ForeArm): add_correctives must create corr_elbow_L_90 whose offsets sit at the
# elbow (vertices near the joint move, the shoulder and wrist ends stay put) and leave the pose at rest afterwards.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector
import correctives

T = 'mixamorig:'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.armature_add(enter_editmode=True)
arm = bpy.context.object; eb = arm.data.edit_bones
root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
a = eb.new(T + 'LeftArm'); a.head = (0.2, 0, 1.5); a.tail = (0.5, 0, 1.5); a.parent = root
f = eb.new(T + 'LeftForeArm'); f.head = a.tail; f.tail = (0.8, 0, 1.5); f.parent = a; f.use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')

me = bpy.data.meshes.new('body'); bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=False, segments=12, radius1=0.04, radius2=0.04, depth=0.6)  # along Z
bm.to_mesh(me); bm.free()
body = bpy.data.objects.new('Body', me); bpy.context.scene.collection.objects.link(body)
for v in me.vertices:  # lay the tube along the arm (X from 0.2 to 0.8, centred on the elbow at 0.5)
    v.co = Vector((0.5 + v.co.z, v.co.x, 1.5 + v.co.y))
bpy.context.view_layer.objects.active = body  # subdivide so the tube has rings along its length
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.subdivide(number_cuts=8); bpy.ops.object.mode_set(mode='OBJECT')
ga, gf = body.vertex_groups.new(name=T + 'LeftArm'), body.vertex_groups.new(name=T + 'LeftForeArm')
for v in body.data.vertices:  # smooth blend across the elbow
    t = max(0.0, min(1.0, (v.co.x - 0.42) / 0.16))
    ga.add([v.index], 1 - t, 'REPLACE'); gf.add([v.index], t, 'REPLACE')
mod = body.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; body.parent = arm

made = correctives.add_correctives(body, arm, joints=[('elbow', 'ForeArm', (90,), 'Left')])
keys = body.data.shape_keys.key_blocks if body.data.shape_keys else {}
ok_key = 'corr_elbow_L_90' in keys
basis = keys['Basis']; k = keys['corr_elbow_L_90'] if ok_key else None
moved = [(basis.data[i].co.x, (k.data[i].co - basis.data[i].co).length) for i in range(len(basis.data))] if ok_key else []
near = max((d for x, d in moved if abs(x - 0.5) < 0.08), default=0.0)
far = max((d for x, d in moved if abs(x - 0.5) > 0.25), default=1.0)
rest = all(pb.rotation_euler.to_quaternion().angle < 1e-6 and pb.rotation_quaternion.angle < 1e-6 for pb in arm.pose.bones)
print('keys', made, 'max offset near elbow', round(near * 1000, 2), 'mm, far', round(far * 1000, 3), 'mm, pose at rest', rest)
ok = ok_key and near > 0.001 and far < 0.0005 and rest
print('PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
