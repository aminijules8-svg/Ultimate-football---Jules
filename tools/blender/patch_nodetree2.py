path = '/home/julesamini30/.config/blender/3.4/extensions/.user/user_default/mpfb/services/nodetreeservice.py'
with open(path, 'r') as f:
    code = f.read()

code = "from typing import Any\n" + code
with open(path, 'w') as f:
    f.write(code)
print("Added typing Any import")
