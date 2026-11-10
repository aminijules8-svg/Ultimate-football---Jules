import bpy
import os
import sys

# Load the player model
model_path = "/home/julesamini30/ultimate-football/public/models/player.glb"
if not os.path.exists(model_path):
    print(f"Error: {model_path} not found")
    sys.exit(1)

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import the model
bpy.ops.import_scene.gltf(filepath=model_path)

# Find the character object
character = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        character = obj
        break

if not character:
    print("Error: No mesh found in GLB")
    sys.exit(1)

# Setup rendering
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.image_settings.file_format = 'PNG'

# Setup lighting
bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
sun = bpy.context.active_object
sun.data.energy = 5.0

bpy.ops.object.light_add(type='SUN', location=(-5, 5, 10))
sun2 = bpy.context.active_object
sun2.data.energy = 2.0

# Setup camera
bpy.ops.object.camera_add(location=(0, -5, 1.0), rotation=(1.5708, 0, 0))
camera = bpy.context.active_object
scene.camera = camera

# Ensure character is centered
character.location = (0, 0, 0)

# Function to render a view
def render_view(filename, location, rotation):
    camera.location = location
    camera.rotation_euler = rotation
    scene.render.filepath = f"/home/julesamini30/ultimate-football/docs/character/{filename}"
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {filename}")

# Create docs/character directory
os.makedirs("/home/julesamini30/ultimate-football/docs/character", exist_ok=True)

# Render Front View
render_view("front_ronaldo.png", (0, -4, 0.9), (1.5708, 0, 0))

# Render Side View
render_view("side_ronaldo.png", (4, 0, 0.9), (1.5708, 0, 1.5708))

print("Ronaldo renders complete.")
