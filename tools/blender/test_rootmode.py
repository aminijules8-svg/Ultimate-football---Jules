# tools/blender/test_rootmode.py — run: blender -b --python tools/blender/test_rootmode.py
# root='relative' keeps a capture's travel but starts it where the player stands: the first baked frame has no
# horizontal offset, and a source that walks 1 m keeps a 1 m (scaled) offset by the last frame.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import retarget as R

T = 'mixamorig:'
bpy.ops.wm.read_factory_settings(use_empty=True)

def make_rig(name):
    bpy.ops.object.armature_add(enter_editmode=True)
    ob = bpy.context.object; ob.name = name; eb = ob.data.edit_bones
    root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
    for side, sx in (('Left', 1), ('Right', -1)):
        lh = eb.new(T + side + 'UpLeg'); lh.head = (0.1 * sx, 0, 1); lh.tail = (0.1 * sx, 0, 0.5); lh.parent = root
        ft = eb.new(T + side + 'Foot'); ft.head = (0.1 * sx, 0, 0.08); ft.tail = (0.1 * sx, -0.12, 0.02); ft.parent = lh
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob

src, tgt = make_rig('src'), make_rig('tgt')
src.location = (3.0, 2.0, 0.0)            # the actor starts away from the capture origin
hb = src.pose.bones[T + 'Hips']
hb.location = (0, 0, 0); hb.keyframe_insert('location', frame=1)
hb.location = (0, 0, -1.0); hb.keyframe_insert('location', frame=11)   # bone-local -Z here: walks 1 m along world -Y? (checked below)
bpy.context.view_layer.update()
rt = R.Retargeter(src, tgt, R.map_identity(tgt), T + 'Hips', T + 'Hips', inplace=False, root='relative')
act = R.bake(rt, 'walk', [1.0, 6.0, 11.0])
tgt.animation_data.action = act
def hip_xy(f):
    bpy.context.scene.frame_set(f); p = tgt.matrix_world @ tgt.pose.bones[T + 'Hips'].head; return p.x, p.y
x0, y0 = hip_xy(1); x1, y1 = hip_xy(3)
bpy.context.scene.frame_set(1); s0 = src.matrix_world @ hb.head; bpy.context.scene.frame_set(11); s1 = src.matrix_world @ hb.head
src_travel = math.hypot(s1.x - s0.x, s1.y - s0.y)
ok = abs(x0) < 1e-4 and abs(y0) < 1e-4 and abs(math.hypot(x1, y1) - src_travel * rt.scale) < 1e-3 and src_travel > 0.5
print('first frame', round(x0, 4), round(y0, 4), 'last', round(x1, 3), round(y1, 3), 'source travel', round(src_travel, 3), 'scale', round(rt.scale, 3), 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
