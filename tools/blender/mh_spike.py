# A0 spike: build one MakeHuman footballer headless via MPFB2 and export a test glb.
# blender -b --python tools/blender/mh_spike.py -- <out.glb>
import bpy, sys
from bl_ext.user_default.mpfb.services.humanservice import HumanService
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
info = HumanService._create_default_human_info_dict()
info['phenotype'].update({'gender': 1.0, 'age': 0.5, 'muscle': 0.72, 'weight': 0.45, 'height': 0.62, 'proportions': 0.75, 'race': {'african': 1.0, 'asian': 0.0, 'caucasian': 0.0}})
info.update({'rig': 'mixamo', 'eyes': 'low-poly/low-poly.mhclo', 'eyebrows': 'eyebrow001/eyebrow001.mhclo', 'eyelashes': 'eyelashes01/eyelashes01.mhclo',
             'hair': 'short02/short02.mhclo', 'skin_mhmat': 'young_african_male/young_african_male.mhmat', 'skin_material_type': 'MAKESKIN', 'alternative_materials': {}})
st = HumanService.get_default_deserialization_settings(); st['subdiv_levels'] = 0
base = HumanService.deserialize_from_dict(info, st)
for o in bpy.data.objects:
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons) if o.type == 'MESH' else 0
    print('OBJ', o.name, o.type, 'parent', o.parent and o.parent.name, 'tris', tris, 'mods', [m.type for m in getattr(o, 'modifiers', [])])
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
print('BONES', len(arm.data.bones), [b.name for b in arm.data.bones][:70])
zs = [(base.matrix_world @ v.co).z for v in base.data.vertices]; print('HEIGHT', max(zs) - min(zs))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_animations=False)
print('EXPORTED', out)
