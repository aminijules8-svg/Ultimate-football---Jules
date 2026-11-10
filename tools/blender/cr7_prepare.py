import bpy, bmesh, os, sys
sys.path.append('/home/julesamini30/.config/blender/4.3/extensions/.user/user_default')
import mpfb
mpfb.MPFB_CONTEXTUAL_INFORMATION = {"__package_short__": "mpfb", "__package__": "bl_ext.user_default.mpfb"}
_mpfb_get_preference = mpfb.get_preference
def _build_mpfb_preference(name):
    try:
        return _mpfb_get_preference(name)
    except ValueError:
        return {"mpfb_shelf_label": "MPFB", "mpfb_user_data": None,
                "mpfb_second_root": None, "mh_user_data": None,
                "mh_auto_user_data": None, "mpfb_codechecks": False}.get(name)
mpfb.get_preference = _build_mpfb_preference
_extension_path_user = bpy.utils.extension_path_user
bpy.utils.extension_path_user = lambda package, **kwargs: (
    os.path.dirname(os.path.abspath(mpfb.__file__))
    if package in ("bl_ext.user_default.mpfb", "mpfb") else _extension_path_user(package, **kwargs))
mpfb.register()
from mpfb.entities.objectproperties import GeneralObjectProperties

def log(*a): print("[cr7_prep]", *a)

def prepare():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath='/home/julesamini30/cristiano_ronaldo_3d_model.glb')

    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    bpy.context.view_layer.objects.active = arm

    # Precise bone mapping - check both mixamorig and original naming
    actual_map = {}
    for b in arm.data.bones:
        base = b.name.split('_')[0]
        # Check both original and mixamorig naming conventions
        if base in ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Neck1', 'Neck2', 'Head',
                    'LeftShoulder', 'RightShoulder', 'LeftArm', 'RightArm', 'LeftForeArm',
                    'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg',
                    'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase']:
            # Check if bone already has mixamorig prefix
            if not b.name.startswith('mixamorig:'):
                actual_map[b.name] = 'mixamorig:' + base
        elif 'Hand' in b.name:
            if not b.name.startswith('mixamorig:'):
                actual_map[b.name] = 'mixamorig:' + b.name.split('_')[0]
        # Also handle mixamorig bones already prefixed
        elif b.name.startswith('mixamorig:'):
            # Already in correct format, keep it
            pass

    log("Renaming bones...")
    bpy.ops.object.mode_set(mode='EDIT')
    for old, new in actual_map.items():
        if old in arm.data.edit_bones:
            arm.data.edit_bones[old].name = new
    bpy.ops.object.mode_set(mode='OBJECT')

    # Join meshes into one single Mesh named Body
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    body.name = "Body"
    body.data.name = "Body"
    GeneralObjectProperties.set_value("object_type", "Basemesh", entity_reference=body)

    # Save as intermediate directly in Blender format to preserve names properly
    bpy.ops.wm.save_as_mainfile(filepath='/tmp/cr7_ready.blend')
    log("Saved to /tmp/cr7_ready.blend")

if __name__ == "__main__":
    prepare()
