path = '/home/julesamini30/.config/blender/3.4/extensions/.user/user_default/mpfb/services/locationservice.py'
with open(path, 'r') as f:
    code = f.read()

old = '''        self._user_home = bpy.utils.extension_path_user(MPFB_CONTEXTUAL_INFORMATION["__package__"])'''
new = '''        try:
            self._user_home = bpy.utils.extension_path_user(MPFB_CONTEXTUAL_INFORMATION["__package__"])
        except AttributeError:
            import os
            self._user_home = os.path.expanduser("~/.config/blender/3.4/extensions/.user/user_default/mpfb")'''

code = code.replace(old, new)
with open(path, 'w') as f:
    f.write(code)
print("Patched locationservice.py")
