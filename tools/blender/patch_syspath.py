path = '/home/julesamini30/ultimate-football/tools/blender/build_player_mh.py'
with open(path, 'r') as f:
    code = f.read()

code = "import sys\nsys.path.append('/home/julesamini30/.local/lib/python3.11/site-packages')\n" + code
with open(path, 'w') as f:
    f.write(code)
print("Added site-packages to build_player_mh.py")
