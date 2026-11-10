path = '/home/julesamini30/ultimate-football/tools/blender/build_player_mh.py'
with open(path, 'r') as f:
    code = f.read()

code = code.replace("sys.path.insert(0, \"/home/julesamini30/.config/blender/4.3/extensions/.user/user_default\")", "sys.path.insert(0, \"/home/julesamini30/.config/blender/3.4/extensions/.user/user_default\")")
code = code.replace("if bpy.app.version < (4, 2, 0):", "if False:")

with open(path, 'w') as f:
    f.write(code)
print("Patched build_player_mh.py")
