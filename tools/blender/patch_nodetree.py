path = '/home/julesamini30/.config/blender/3.4/extensions/.user/user_default/mpfb/services/nodetreeservice.py'
with open(path, 'r') as f:
    code = f.read()

old = '-> bpy.types.NodeTreeInterfaceSocket | None:'
new = '-> Any:'

code = code.replace(old, new)
code = code.replace('isinstance(item, bpy.types.NodeTreeInterfaceSocket)', 'True')

with open(path, 'w') as f:
    f.write(code)
print("Patched nodetreeservice.py")
