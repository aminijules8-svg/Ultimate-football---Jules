import bpy, sys, os, subprocess, json, shutil
from pathlib import Path

# Enable MPFB addon
spec = importlib.util.find_spec('mpfb')
if spec:
    mpfb_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mpfb_module)
    mpfb_module.register()
else:
    print('MPFB module not found')
    sys.exit(1)

# Set up user data path
os.environ['MPFB_USER_DATA'] = '/home/julesamini30/.config/blender/4.3/extensions/.user/user_default/mpfb/data'

# Ensure Blender can find the addon directory
bpy.utils.extension_path_user = lambda package, **kwargs: (
    '/home/julesamini30/.config/blender/4.3/extensions/.user/user_default/mpfb'
    if package in ("bl_ext.user_default.mpfb", "mpfb") else bpy.utils.extension_path_user(package, **kwargs))

# Import the build script
import importlib.util
spec = importlib.util.spec_from_file_location('build_player_mh', '/home/julesamini30/ultimate-football/tools/blender/build_player_mh.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Verify output file exists
if os.path.exists('/home/julesamini30/ultimate-football/public/models/player.glb'):
    print('Player GLB created successfully:', os.path.getsize('/home/julesamini30/ultimate-football/public/models/player.glb'), 'bytes')
else:
    print('ERROR: Player GLB not created')