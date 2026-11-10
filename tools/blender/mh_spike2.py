# A0 spike part 2: MakeHuman footballer + retargeted UAL jog and CMU kick, rendered.
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from bl_ext.user_default.mpfb.services.humanservice import HumanService
import retarget as R
a = sys.argv[sys.argv.index('--') + 1:]; SRC, OUT = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
info = HumanService._create_default_human_info_dict()
info['phenotype'].update({'gender': 1.0, 'age': 0.5, 'muscle': 0.72, 'weight': 0.45, 'height': 0.62, 'proportions': 0.75, 'race': {'african': 1.0, 'asian': 0.0, 'caucasian': 0.0}})
info.update({'rig': 'mixamo', 'eyes': 'low-poly/low-poly.mhclo', 'eyebrows': 'eyebrow001/eyebrow001.mhclo', 'eyelashes': 'eyelashes01/eyelashes01.mhclo',
             'hair': 'short02/short02.mhclo', 'skin_mhmat': 'young_african_male/young_african_male.mhmat', 'skin_material_type': 'MAKESKIN', 'alternative_materials': {}})
st = HumanService.get_default_deserialization_settings(); st['subdiv_levels'] = 0
HumanService.deserialize_from_dict(info, st)
tgt = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
# --- UAL jog
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, 'ual1.glb'))
ual = next(o for o in bpy.context.selected_objects if o.type == 'ARMATURE') if any(o.type == 'ARMATURE' for o in bpy.context.selected_objects) else [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != tgt][0]
ual.animation_data_create(); print('ACTS', [x.name for x in bpy.data.actions][:8]); ja = next(x for x in bpy.data.actions if x.name.startswith('Jog_Fwd_Loop')); ual.animation_data.action = ja
f0, f1 = map(int, ja.frame_range)
rt = R.Retargeter(ual, tgt, R.MAP_UAL, 'DEF-hips', 'mixamorig:Hips')
jog = R.bake(rt, 'jog', [f0 + i for i in range(f1 - f0 + 1)])
print('JOG frames', f1 - f0 + 1, 'mapped', len(rt.map))
# --- CMU kick
bpy.ops.import_anim.bvh(filepath=os.path.join(SRC, 'cmu', '10_01.bvh'), global_scale=0.056444, rotate_mode='NATIVE', axis_forward='-Z', axis_up='Y')
cmu = bpy.data.objects['10_01']; ca = cmu.animation_data.action; c0, c1 = map(int, ca.frame_range)
sc = bpy.context.scene; best = (0, c0); prev = None
for f in range(c0 + 40, c1 - 80, 2):
    sc.frame_set(f); p = cmu.matrix_world @ cmu.pose.bones['RightFoot'].head
    if prev is not None and 0.3 > (p - prev).length > best[0]: best = ((p - prev).length, f)
    prev = p
fk = best[1]; print('KICK peak frame', fk, 'of', c0, c1)
rt2 = R.Retargeter(cmu, tgt, R.MAP_CMU, 'Hips', 'mixamorig:Hips')
kick = R.bake(rt2, 'kick', [fk - 96 + 4 * i for i in range(int((96 + 72) / 4))])
print('KICK frames', len(kick.fcurves[0].keyframe_points), 'mapped', len(rt2.map))
for o in (ual, cmu): bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.parent is None]: bpy.data.objects.remove(o, do_unlink=True)
# --- render frames
sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = False; sc.render.resolution_x = sc.render.resolution_y = 600
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.25, 0.28, 0.33, 1)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
L = bpy.data.objects.new('l', bpy.data.lights.new('l', 'SUN')); L.data.energy = 3.5; L.rotation_euler = (math.radians(50), 0, math.radians(40)); sc.collection.objects.link(L)
gp = bpy.data.objects.new('g', bpy.data.meshes.new('g')); sc.collection.objects.link(gp)
import bmesh; bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4); bm.to_mesh(gp.data)
def shot(act, frame, yaw, name):
    tgt.animation_data.action = act; sc.frame_set(frame)
    cam.location = (math.sin(math.radians(yaw)) * 4.5, -math.cos(math.radians(yaw)) * 4.5, 1.0); cam.rotation_euler = (math.radians(88), 0, math.radians(yaw))
    sc.render.filepath = os.path.join(OUT, name); bpy.ops.render.render(write_still=True)
n = len(jog.fcurves[0].keyframe_points)
nk = len(kick.fcurves[0].keyframe_points)
for i, fr in enumerate((nk * 6 // 16, nk * 8 // 16, nk * 9 // 16, nk * 10 // 16)): shot(kick, fr, 70, f'kick{i}.png')
