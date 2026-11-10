# tools/blender/test_twist.py — run: blender -b --python tools/blender/test_twist.py
# A toy arm with a skinned mesh: add_twist_bones must create 8 twist bones and move part of each limb's weight onto
# them without changing any vertex's total weight; bake_twist must key the forearm twist bones with 1/3 and 2/3 of
# the hand's roll and the upper-arm twist bones with -2/3 and -1/3 of the upper arm's own roll.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Quaternion
import twist

T = 'mixamorig:'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.armature_add(enter_editmode=True)
arm = bpy.context.object; eb = arm.data.edit_bones
root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
for side, sx in (('Left', 1), ('Right', -1)):
    a = eb.new(T + side + 'Arm'); a.head = (0.2 * sx, 0, 1.5); a.tail = (0.5 * sx, 0, 1.5); a.parent = root
    f = eb.new(T + side + 'ForeArm'); f.head = a.tail; f.tail = (0.8 * sx, 0, 1.5); f.parent = a; f.use_connect = True
    h = eb.new(T + side + 'Hand'); h.head = f.tail; h.tail = (0.9 * sx, 0, 1.5); h.parent = f; h.use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')

# a line of vertices along both arms, each fully weighted to the segment it lies on
verts = [((x if s > 0 else -x), 0, 1.5) for s in (1, -1) for x in [0.2 + 0.05 * i for i in range(14)]]
me = bpy.data.meshes.new('body'); me.from_pydata(verts, [], []); body = bpy.data.objects.new('Body', me)
bpy.context.scene.collection.objects.link(body)
for side in ('Left', 'Right'):
    for seg in ('Arm', 'ForeArm'):
        body.vertex_groups.new(name=T + side + seg)
for v in body.data.vertices:
    side = 'Left' if v.co.x > 0 else 'Right'; ax = abs(v.co.x)
    body.vertex_groups[T + side + ('Arm' if ax < 0.5 else 'ForeArm')].add([v.index], 1.0, 'REPLACE')

made = twist.add_twist_bones(arm, body)
ok = len(made) == 8 and all(n in arm.data.bones for n in made)
totals = [sum(g.weight for g in v.groups) for v in body.data.vertices]
ok_w = all(abs(t - 1.0) < 1e-5 for t in totals)
moved = sum(1 for v in body.data.vertices if any(body.vertex_groups[g.group].name.endswith(('Twist1', 'Twist2')) and g.weight > 0 for g in v.groups))

# one-frame action: left hand rolled 90 deg about its bone axis (Y), left upper arm rolled 30 deg
act = bpy.data.actions.new('t'); arm.animation_data_create(); arm.animation_data.action = act
for bone, deg in (('LeftHand', 90), ('LeftArm', 30)):
    pb = arm.pose.bones[T + bone]; pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = Quaternion((0, 1, 0), math.radians(deg))
    pb.keyframe_insert('rotation_quaternion', frame=1)
twist.bake_twist(arm, act)
twist.bake_twist(arm, act)  # the retargeter keys every bone, twist bones included: re-keying must replace, not fail
bpy.context.scene.frame_set(1)
roll = lambda n: math.degrees(2 * math.atan2(arm.pose.bones[T + n].rotation_quaternion.y, arm.pose.bones[T + n].rotation_quaternion.w))
got = {n: round(roll(n), 2) for n in ('LeftForeArmTwist1', 'LeftForeArmTwist2', 'LeftArmTwist1', 'LeftArmTwist2')}
want = {'LeftForeArmTwist1': 30.0, 'LeftForeArmTwist2': 60.0, 'LeftArmTwist1': -20.0, 'LeftArmTwist2': -10.0}
ok_k = all(abs(got[k] - want[k]) < 0.1 for k in want)
print('bones', len(made), 'weights sum to 1', ok_w, 'vertices sharing weight', moved, 'twist keys', got)
print('PASS' if ok and ok_w and moved > 0 and ok_k else 'FAIL')
sys.exit(0 if ok and ok_w and moved > 0 and ok_k else 1)
