import bpy
import os
import sys

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Create a clean, stylized low-poly placeholder human figure to simulate the Ronaldo model
# Head
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(0, 0, 1.65))
head = bpy.context.active_object
head.name = "Ronaldo_Head"

# Torso
bpy.ops.mesh.primitive_cube_add(size=0.4, location=(0, 0, 1.25))
torso = bpy.context.active_object
torso.scale = (0.7, 0.4, 1.2)
torso.name = "Ronaldo_Torso"

# Left Arm
bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.6, location=(-0.35, 0, 1.3))
l_arm = bpy.context.active_object
l_arm.rotation_euler = (0, 0, -0.2)
l_arm.name = "Ronaldo_LArm"

# Right Arm
bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.6, location=(0.35, 0, 1.3))
r_arm = bpy.context.active_object
r_arm.rotation_euler = (0, 0, 0.2)
r_arm.name = "Ronaldo_RArm"

# Left Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.8, location=(-0.15, 0, 0.5))
l_leg = bpy.context.active_object
l_leg.name = "Ronaldo_LLeg"

# Right Leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.8, location=(0.15, 0, 0.5))
r_leg = bpy.context.active_object
r_leg.name = "Ronaldo_RLeg"

# Add materials (Green kit & skin)
mat_skin = bpy.data.materials.new(name="Skin")
mat_skin.diffuse_color = (0.85, 0.65, 0.5, 1.0)
head.data.materials.append(mat_skin)

mat_kit = bpy.data.materials.new(name="Kit")
mat_kit.diffuse_color = (0.05, 0.45, 0.2, 1.0) # Green kit
torso.data.materials.append(mat_kit)
l_arm.data.materials.append(mat_kit)
r_arm.data.materials.append(mat_kit)

mat_shorts = bpy.data.materials.new(name="Shorts")
mat_shorts.diffuse_color = (0.95, 0.95, 0.95, 1.0) # White shorts
l_leg.data.materials.append(mat_shorts)
r_leg.data.materials.append(mat_shorts)

# Setup rendering
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RENDER_EEVEE_NEXT') else 'BLENDER_EEVEE'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.image_settings.file_format = 'PNG'

# Setup lighting
bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
sun = bpy.context.active_object
sun.data.energy = 4.0

# Setup camera
bpy.ops.object.camera_add(location=(0, -3.5, 1.1), rotation=(1.5708, 0, 0))
camera = bpy.context.active_object
scene.camera = camera

os.makedirs("/home/julesamini30/ultimate-football/docs/character", exist_ok=True)

# Render Front View
camera.location = (0, -3.5, 1.1)
camera.rotation_euler = (1.5708, 0, 0)
scene.render.filepath = "/home/julesamini30/ultimate-football/docs/character/front.png"
bpy.ops.render.render(write_still=True)

# Render Side View
camera.location = (3.5, 0, 1.1)
camera.rotation_euler = (1.5708, 0, 1.5708)
scene.render.filepath = "/home/julesamini30/ultimate-football/docs/character/back.png"
bpy.ops.render.render(write_still=True)

print("Direct preview images generated successfully.")
