"""Build the Ultimate Football rigged character and export it as glTF.

Run headless:  blender -b --python tools/blender/build_player.py -- --out public/models [--preview]

Everything is generated procedurally so the model is reproducible:
  * body mesh from a Skin-modifier skeleton + subdivision (smooth, human proportions, ~7k tris)
  * separate head sphere (face texture), hair caps (6 styles), boots
  * humanoid armature (Mixamo-style names) with computed skin weights
  * UV atlas by region so one 512x512 canvas texture per player carries shirt pattern,
    sponsor, badge, name, number, shorts, socks, skin and boots
  * ~26 animation clips authored as keyframes (locomotion cycles + football actions)
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Quaternion, Matrix

# ----------------------------------------------------------------------------- args
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = 'public/models'
PREVIEW = False
for i, a in enumerate(argv):
    if a == '--out': OUT = argv[i + 1]
    if a == '--preview': PREVIEW = True
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30

# ----------------------------------------------------------------------------- skeleton definition
# Blender: Z up, character faces -Y. Left side = +X.  Units: metres. Height 1.80 m.
J = {  # joint positions
    'hips': (0, 0, 0.98), 'spine': (0, 0, 1.08), 'chest': (0, 0.0, 1.22), 'upperChest': (0, 0, 1.36),
    'neck': (0, 0.01, 1.50), 'head': (0, 0.01, 1.58), 'headTop': (0, 0.0, 1.80),
    'shoulder.L': (0.06, 0.0, 1.46), 'upperArm.L': (0.19, 0.0, 1.45), 'foreArm.L': (0.22, 0.01, 1.17),
    'hand.L': (0.235, 0.03, 0.92), 'handTip.L': (0.24, 0.045, 0.80),
    'thigh.L': (0.095, 0.0, 0.96), 'shin.L': (0.105, 0.0, 0.53), 'foot.L': (0.11, 0.0, 0.085),
    'toe.L': (0.115, -0.13, 0.03), 'toeTip.L': (0.115, -0.21, 0.02),
}
for k in list(J):
    if k.endswith('.L'):
        x, y, z = J[k]; J[k.replace('.L', '.R')] = (-x, y, z)
V = lambda k: Vector(J[k])

# bone: name -> (head joint, tail joint, parent)
BONES = [
    ('Hips', 'hips', 'spine', None),
    ('Spine', 'spine', 'chest', 'Hips'),
    ('Spine1', 'chest', 'upperChest', 'Spine'),
    ('Spine2', 'upperChest', 'neck', 'Spine1'),
    ('Neck', 'neck', 'head', 'Spine2'),
    ('Head', 'head', 'headTop', 'Neck'),
]
for s in ('L', 'R'):
    BONES += [
        (f'Shoulder_{s}', f'shoulder.{s}', f'upperArm.{s}', 'Spine2'),
        (f'UpperArm_{s}', f'upperArm.{s}', f'foreArm.{s}', f'Shoulder_{s}'),
        (f'ForeArm_{s}', f'foreArm.{s}', f'hand.{s}', f'UpperArm_{s}'),
        (f'Hand_{s}', f'hand.{s}', f'handTip.{s}', f'ForeArm_{s}'),
        (f'UpLeg_{s}', f'thigh.{s}', f'shin.{s}', 'Hips'),
        (f'Leg_{s}', f'shin.{s}', f'foot.{s}', f'UpLeg_{s}'),
        (f'Foot_{s}', f'foot.{s}', f'toe.{s}', f'Leg_{s}'),
        (f'ToeBase_{s}', f'toe.{s}', f'toeTip.{s}', f'Foot_{s}'),
    ]

# ----------------------------------------------------------------------------- armature
arm_data = bpy.data.armatures.new('PlayerRig')
arm = bpy.data.objects.new('PlayerRig', arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = {}
for name, h, t, parent in BONES:
    b = arm_data.edit_bones.new(name)
    b.head, b.tail = V(h), V(t)
    d = (b.tail - b.head).normalized()
    # roll: local Z toward -Y (forward) for vertical bones, toward +Z for horizontal ones
    b.align_roll(Vector((0, 0, 1)) if abs(d.z) < 0.6 else Vector((0, -1, 0)))
    if parent: b.parent = eb[parent]; b.use_connect = False
    eb[name] = b
bpy.ops.object.mode_set(mode='OBJECT')
for pb in arm.pose.bones: pb.rotation_mode = 'XYZ'

# ----------------------------------------------------------------------------- body mesh (skin modifier skeleton)
RAD = {  # per-joint skin radii (x, y) in metres
    'hips': (0.15, 0.105), 'spine': (0.135, 0.095), 'chest': (0.16, 0.10), 'upperChest': (0.19, 0.11),
    'neck': (0.055, 0.055), 'head': (0.05, 0.05),
    'shoulder.L': (0.075, 0.075), 'upperArm.L': (0.055, 0.055), 'foreArm.L': (0.042, 0.042),
    'hand.L': (0.04, 0.025), 'handTip.L': (0.03, 0.018),
    'thigh.L': (0.085, 0.085), 'shin.L': (0.06, 0.062), 'foot.L': (0.042, 0.045),
}
for k in list(RAD):
    if k.endswith('.L'): RAD[k.replace('.L', '.R')] = RAD[k]
SKEL_EDGES = [('hips', 'spine'), ('spine', 'chest'), ('chest', 'upperChest'), ('upperChest', 'neck'), ('neck', 'head')]
for s in ('L', 'R'):
    SKEL_EDGES += [('upperChest', f'shoulder.{s}'), (f'shoulder.{s}', f'upperArm.{s}'), (f'upperArm.{s}', f'foreArm.{s}'),
                   (f'foreArm.{s}', f'hand.{s}'), (f'hand.{s}', f'handTip.{s}'),
                   ('hips', f'thigh.{s}'), (f'thigh.{s}', f'shin.{s}'), (f'shin.{s}', f'foot.{s}')]
joints = [k for k in RAD]  # head joint ends the neck; the head itself is a separate mesh
jidx = {k: i for i, k in enumerate(joints)}

bm = bmesh.new()
verts = [bm.verts.new(V(k)) for k in joints]
bm.verts.ensure_lookup_table()
for a, c in SKEL_EDGES:
    bm.edges.new((verts[jidx[a]], verts[jidx[c]]))
body_mesh = bpy.data.meshes.new('Body')
bm.to_mesh(body_mesh); bm.free()
body = bpy.data.objects.new('Body', body_mesh)
scene.collection.objects.link(body)
bpy.context.view_layer.objects.active = body
body.select_set(True)
skin = body.modifiers.new('Skin', 'SKIN')
skin.use_smooth_shade = True
body_mesh.skin_vertices[0].data[jidx['hips']].use_root = True
for k, (rx, ry) in RAD.items():
    sv = body_mesh.skin_vertices[0].data[jidx[k]]
    sv.radius = (rx, ry)
    if k in ('upperArm.L', 'upperArm.R', 'thigh.L', 'thigh.R', 'shoulder.L', 'shoulder.R'): sv.use_loose = True
sub = body.modifiers.new('Subdiv', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
bpy.ops.object.modifier_apply(modifier='Skin')
bpy.ops.object.modifier_apply(modifier='Subdiv')
# relax a little and triangulate later at export; smooth shading
for p in body_mesh.polygons: p.use_smooth = True

# ----------------------------------------------------------------------------- weights (two nearest bone segments)
SEG = {name: (V(h), V(t)) for name, h, t, _ in BONES}
def seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
    return (p - (a + ab * t)).length, t
# bones that can own body vertices (feet/toes handled by boot meshes, head by head mesh)
BODY_BONES = [n for n, *_ in BONES if not n.startswith('Head') and not n.startswith('Neck') or n == 'Neck']
def allowed(p, n):
    side = 1 if n.endswith('_L') else -1 if n.endswith('_R') else 0
    if side and p.x * side < -0.02: return False
    if n.startswith(('UpLeg', 'Leg', 'Foot', 'ToeBase')): return p.z < 1.0
    if n == 'Hips': return 0.84 < p.z < 1.13
    if n.startswith('Spine'): return abs(p.x) < 0.215
    if n == 'Neck': return p.z > 1.43 and abs(p.x) < 0.09
    if n.startswith('Shoulder'): return p.z > 1.32 and abs(p.x) > 0.06
    if n.startswith(('UpperArm', 'ForeArm', 'Hand')): return abs(p.x) > 0.145 and p.z < 1.52
    return True
def assign_weights(obj, candidates, blend=0.08):
    for n in candidates: obj.vertex_groups.new(name=n)
    for v in obj.data.vertices:
        p = obj.matrix_world @ v.co
        ok = [n for n in candidates if allowed(p, n)] or candidates
        ds = sorted(((seg_dist(p, *SEG[n])[0], n) for n in ok))[:2]
        (d0, n0), (d1, n1) = ds[0], ds[1] if len(ds) > 1 else ds[0]
        smooth = lambda t: 0.0 if t <= 0 else 1.0 if t >= 1 else t * t * (3 - 2 * t)
        # joint blends: thigh<->hips across the pelvis, upper arm<->shoulder across the armpit
        if n0.startswith('UpLeg') and p.z > 0.84 and 'Hips' in candidates:
            w = smooth((0.99 - p.z) / 0.13); obj.vertex_groups[n0].add([v.index], w, 'REPLACE'); obj.vertex_groups['Hips'].add([v.index], 1 - w, 'REPLACE'); continue
        if n0.startswith('UpperArm') and abs(p.x) < 0.24 and p.z > 1.3:
            sh = 'Shoulder' + n0[-2:]
            if sh in candidates:
                w = smooth((abs(p.x) - 0.15) / 0.08); obj.vertex_groups[n0].add([v.index], w, 'REPLACE'); obj.vertex_groups[sh].add([v.index], 1 - w, 'REPLACE'); continue
        if d1 - d0 > blend or n0 == n1:
            obj.vertex_groups[n0].add([v.index], 1.0, 'REPLACE')
        else:
            w1 = 0.5 * (1 - (d1 - d0) / blend)
            obj.vertex_groups[n0].add([v.index], 1 - w1, 'REPLACE'); obj.vertex_groups[n1].add([v.index], w1, 'REPLACE')
assign_weights(body, BODY_BONES)

# ----------------------------------------------------------------------------- materials + UV atlas by region
# Atlas rows (v from bottom): boots 0-.10, skin .10-.15, socks .15-.25, shorts .25-.40, sleeves .40-.50, torso .50-1.0
ATLAS = {'boots': (0.0, 0.10), 'skin': (0.10, 0.15), 'socks': (0.15, 0.25), 'shorts': (0.25, 0.40), 'sleeves': (0.40, 0.50), 'torso': (0.50, 1.0)}
mat_body = bpy.data.materials.new('PlayerBody'); mat_body.use_nodes = True
mat_head = bpy.data.materials.new('PlayerHead'); mat_head.use_nodes = True
mat_hair = bpy.data.materials.new('PlayerHair'); mat_hair.use_nodes = True
for m, col, rough in ((mat_body, (0.8, 0.8, 0.8, 1), 0.75), (mat_head, (0.76, 0.57, 0.42, 1), 0.6), (mat_hair, (0.08, 0.06, 0.05, 1), 0.55)):
    bsdf = m.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = col; bsdf.inputs['Roughness'].default_value = rough
body_mesh.materials.append(mat_body)

def dominant_bone(obj, poly):
    acc = {}
    for vi in poly.vertices:
        for g in obj.data.vertices[vi].groups:
            acc[g.group] = acc.get(g.group, 0) + g.weight
    gi = max(acc, key=acc.get); return obj.vertex_groups[gi].name

def region_of(bone, z):
    if bone.startswith(('Foot', 'ToeBase')): return 'boots'
    if bone.startswith('Leg'): return 'socks' if z < 0.44 else 'skin'
    if bone.startswith('UpLeg'): return 'shorts' if z > 0.64 else 'skin'
    if bone.startswith('Hips'): return 'shorts'
    if bone.startswith(('Spine', 'Shoulder')): return 'torso'
    if bone.startswith('UpperArm'): return 'sleeves' if z > 1.30 else 'skin'
    return 'skin'

uv_layer = body_mesh.uv_layers.new(name='UVMap')
def cyl_uv(p, cx, cy, z0, z1, row):
    # cylindrical projection around a vertical axis at (cx,cy): front (-Y) at u=.25, back (+Y) at u=.75
    ang = math.atan2(p.x - cx, -(p.y - cy))  # 0 at front, +pi/2 at +X(left)
    u = (0.25 - ang / (2 * math.pi)) % 1.0
    v0, v1 = ATLAS[row]; v = v0 + (v1 - v0) * max(0.0, min(1.0, (p.z - z0) / (z1 - z0)))
    return u, v
for poly in body_mesh.polygons:
    c = poly.center; bone = dominant_bone(body, poly); reg = region_of(bone, c.z)
    for li in poly.loop_indices:
        p = body_mesh.vertices[body_mesh.loops[li].vertex_index].co
        if reg == 'torso': uv = cyl_uv(p, 0, 0, 0.98, 1.50, 'torso')
        elif reg == 'shorts': uv = cyl_uv(p, 0, 0, 0.64, 1.0, 'shorts')
        elif reg == 'sleeves':
            side = 1 if p.x > 0 else -1; uv = cyl_uv(p, side * 0.19, 0, 1.28, 1.47, 'sleeves')
        elif reg == 'socks':
            side = 1 if p.x > 0 else -1; uv = cyl_uv(p, side * 0.105, 0, 0.08, 0.46, 'socks')
        elif reg == 'boots':
            side = 1 if p.x > 0 else -1; uv = cyl_uv(p, side * 0.11, -0.05, 0.0, 0.12, 'boots')
        else:
            v0, v1 = ATLAS['skin']; uv = (0.5, (v0 + v1) / 2)
        uv_layer.data[li].uv = uv

# ----------------------------------------------------------------------------- head, hair, boots
def add_sphere(name, loc, scale, mat, bone, segs=24, rings=16):
    bm2 = bmesh.new(); bmesh.ops.create_uvsphere(bm2, u_segments=segs, v_segments=rings, radius=1.0)
    me = bpy.data.meshes.new(name); bm2.to_mesh(me); bm2.free()
    ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
    ob.scale = scale; ob.location = loc
    bpy.context.view_layer.update()
    me.transform(Matrix.Translation(loc) @ Matrix.Diagonal((*scale, 1.0))); ob.location = (0, 0, 0); ob.scale = (1, 1, 1)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat)
    vg = ob.vertex_groups.new(name=bone); vg.add([v.index for v in me.vertices], 1.0, 'REPLACE')
    return ob

HEAD_C = Vector((0, 0.005, 1.675)); HEAD_S = (0.095, 0.108, 0.125)
head = add_sphere('Head', HEAD_C, HEAD_S, mat_head, 'Head')
# head UV: spherical, face (-Y) centred at u=.5
uvh = head.data.uv_layers.new(name='UVMap')
for poly in head.data.polygons:
    for li in poly.loop_indices:
        p = head.data.vertices[head.data.loops[li].vertex_index].co - HEAD_C
        n = Vector((p.x / HEAD_S[0], p.y / HEAD_S[1], p.z / HEAD_S[2])).normalized()
        u = 0.5 + math.atan2(n.x, -n.y) / (2 * math.pi); v = 0.5 + math.asin(max(-1, min(1, n.z))) / math.pi
        uvh.data[li].uv = (u % 1.0, v)
# jaw/chin: pull the lower front of the head slightly forward-down for a less egg-like skull
for v in head.data.vertices:
    p = v.co - HEAD_C
    if p.z < -0.02 and p.y < 0: v.co += Vector((0, -0.012, -0.01)) * min(1.0, -p.z / 0.1)
# ears
for s in (1, -1):
    add_sphere(f'Ear_{"L" if s > 0 else "R"}', HEAD_C + Vector((s * 0.098, 0.01, -0.01)), (0.014, 0.022, 0.03), mat_head, 'Head', 10, 8)
# hair styles: caps built from the head sphere, scaled/offset (shown/hidden at runtime)
HAIR = {
    'hair_short': ((1.06, 1.05, 1.03), (0, 0, 0.012), -0.01),
    'hair_buzz': ((1.03, 1.02, 1.02), (0, 0, 0.006), 0.0),
    'hair_afro': ((1.3, 1.28, 1.26), (0, 0, 0.03), -0.06),
    'hair_long': ((1.08, 1.1, 1.05), (0, 0.01, 0.0), -0.09),
    'hair_bun': ((1.05, 1.05, 1.02), (0, 0, 0.01), -0.02),
    'hair_curly': ((1.14, 1.12, 1.12), (0, 0, 0.02), -0.03),
}
for name, (sc, off, zcut) in HAIR.items():
    ob = add_sphere(name, HEAD_C + Vector(off), tuple(HEAD_S[i] * sc[i] for i in range(3)), mat_hair, 'Head', 24, 16)
    bm3 = bmesh.new(); bm3.from_mesh(ob.data)
    cut = [v for v in bm3.verts if (v.co - HEAD_C).z < zcut or ((v.co - HEAD_C).y < -0.03 and (v.co - HEAD_C).z < 0.05)]
    bmesh.ops.delete(bm3, geom=cut, context='VERTS'); bm3.to_mesh(ob.data); bm3.free()
    if name == 'hair_bun':
        add_sphere('hair_bun_knot', HEAD_C + Vector((0, 0.11, 0.07)), (0.035, 0.035, 0.03), mat_hair, 'Head', 12, 8).name = 'hair_bun_knot'
        bpy.data.objects['hair_bun_knot'].parent = None
# boots: boxy-rounded shoe per foot (toe forward -Y)
def add_boot(side):
    s = 1 if side == 'L' else -1
    bm4 = bmesh.new(); bmesh.ops.create_cube(bm4, size=1.0)
    for v in bm4.verts:
        v.co = Vector((v.co.x * 0.085, v.co.y * 0.27, v.co.z * 0.085))
        if v.co.y < 0: v.co.z *= 0.75  # lower toe box
    bmesh.ops.subdivide_edges(bm4, edges=bm4.edges[:], cuts=2, use_grid_fill=True)
    bmesh.ops.smooth_vert(bm4, verts=bm4.verts[:], factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bmesh.ops.smooth_vert(bm4, verts=bm4.verts[:], factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    me = bpy.data.meshes.new(f'Boot_{side}'); bm4.to_mesh(me); bm4.free()
    me.transform(Matrix.Translation(Vector((s * 0.112, -0.06, 0.045))))
    ob = bpy.data.objects.new(f'Boot_{side}', me); scene.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat_body)
    uv = me.uv_layers.new(name='UVMap'); v0, v1 = ATLAS['boots']
    for poly in me.polygons:
        for li in poly.loop_indices:
            p = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = ((p.y + 0.3) / 0.6 * 0.5 + (0.5 if s < 0 else 0), v0 + (v1 - v0) * max(0, min(1, p.z / 0.12)))
    assign_weights(ob, [f'Foot_{side}', f'ToeBase_{side}', f'Leg_{side}'], blend=0.03)
    return ob
add_boot('L'); add_boot('R')

# ----------------------------------------------------------------------------- parent everything to the rig
parts = [o for o in scene.objects if o.type == 'MESH']
for o in parts:
    o.parent = arm
    mod = o.modifiers.new('Armature', 'ARMATURE'); mod.object = arm

# ----------------------------------------------------------------------------- animation authoring
D = math.radians
def side_sign(bone): return 1 if bone.endswith('_L') else -1

class Clip:
    def __init__(self, name, length_s, loop=True):
        self.name, self.frames, self.loop = name, int(round(length_s * 30)), loop
        self.keys = {}  # bone -> list of (frame, (x,y,z) radians)
        self.root = []  # (frame, (x,y,z) metres offset of Hips)
    def key(self, bone, t01, rot):
        self.keys.setdefault(bone, []).append((int(round(t01 * self.frames)), rot))
    def root_key(self, t01, loc):
        self.root.append((int(round(t01 * self.frames)), loc))

def pose(clip, t01, P, root=None):
    """P: dict bone -> (x,y,z) degrees. Unspecified bones are keyed to rest (0) so blends stay clean."""
    for bone in [n for n, *_ in BONES]:
        rot = P.get(bone, (0, 0, 0)); clip.key(bone, t01, tuple(D(a) for a in rot))
    clip.root_key(t01, root or (0, 0, 0))

def locomotion(name, speed, length_s, hip_swing, knee, arm_swing, lean, bob, stride_y=0.0):
    c = Clip(name, length_s)
    N = 8
    for i in range(N + 1):
        t = i / N; ph = t * 2 * math.pi
        swing = math.sin(ph)  # +1: left leg forward
        P = {}
        for s, sign in (('L', 1), ('R', -1)):
            fwd = swing * sign
            P[f'UpLeg_{s}'] = (hip_swing * fwd, 0, 0)
            # knee bends mostly while the leg is behind/lifting: bend when the leg swings forward from behind
            lift = max(0.0, -math.sin(ph + (0 if sign > 0 else math.pi) - 0.9))
            P[f'Leg_{s}'] = (-(knee * lift + knee * 0.15), 0, 0)
            P[f'Foot_{s}'] = (10 * fwd, 0, 0)
            P[f'UpperArm_{s}'] = (-arm_swing * fwd * 0.9, 0, sign * 6)
            P[f'ForeArm_{s}'] = (-(20 + arm_swing * 1.0 - arm_swing * fwd * 0.25), 0, 0)
            P[f'Shoulder_{s}'] = (0, 0, 0)
        P['Spine'] = (lean, 0, -swing * 3); P['Spine1'] = (lean * 0.5, 0, 0); P['Spine2'] = (0, swing * 4, 0)
        P['Head'] = (-lean * 0.8, -swing * 3, 0)
        pose(c, t, P, root=(0, 0, abs(math.sin(ph)) * bob))
    return c

def still(name, P, length_s=2.0, breathe=0.6, root=None):
    c = Clip(name, length_s)
    for i, t in enumerate((0, 0.5, 1.0)):
        Q = dict(P); Q['Spine1'] = (P.get('Spine1', (0, 0, 0))[0] + (breathe if i == 1 else 0), 0, 0)
        pose(c, t, Q, root)
    return c

def action(name, keyframes, length_s, loop=False):
    """keyframes: list of (t01, pose dict, root offset)"""
    c = Clip(name, length_s, loop)
    for t, P, root in keyframes: pose(c, t, P, root)
    return c

IDLE = {'UpperArm_L': (4, 0, 7), 'UpperArm_R': (4, 0, -7), 'ForeArm_L': (-18, 0, 0), 'ForeArm_R': (-18, 0, 0), 'UpLeg_L': (0, 0, 3), 'UpLeg_R': (0, 0, -3), 'Leg_L': (-4, 0, 0), 'Leg_R': (-4, 0, 0)}
READY = {'Spine': (14, 0, 0), 'Spine1': (6, 0, 0), 'Head': (-12, 0, 0), 'UpLeg_L': (28, 0, 8), 'UpLeg_R': (28, 0, -8), 'Leg_L': (-45, 0, 0), 'Leg_R': (-45, 0, 0), 'Foot_L': (14, 0, 0), 'Foot_R': (14, 0, 0),
         'UpperArm_L': (35, 0, 22), 'UpperArm_R': (35, 0, -22), 'ForeArm_L': (-60, 0, 0), 'ForeArm_R': (-60, 0, 0)}

clips = []
clips.append(still('idle', IDLE, 2.4))
clips.append(locomotion('walk', 1.4, 1.1, 22, 38, 20, 2, 0.015))
clips.append(locomotion('jog', 3.5, 0.72, 32, 60, 40, 6, 0.03))
clips.append(locomotion('run', 6.0, 0.6, 42, 85, 55, 10, 0.04))
clips.append(locomotion('sprint', 8.0, 0.52, 52, 105, 70, 16, 0.05))

def kick_clip(name, power, lofted=False, length=0.55):
    # right-footed strike: plant left, swing right. 0..1: backswing, contact at .45, follow-through
    wind = {'UpLeg_R': (-35 * power, 0, -6), 'Leg_R': (-95 * power, 0, 0), 'UpLeg_L': (10, 0, 4), 'Leg_L': (-20, 0, 0),
            'Spine': (12, 0, 10), 'UpperArm_L': (-45, 0, 30), 'UpperArm_R': (30, 0, -20), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-40, 0, 0), 'Head': (-10, 0, 0)}
    contact = {'UpLeg_R': (55 * power + (15 if lofted else 0), 0, -4), 'Leg_R': (-15, 0, 0), 'Foot_R': (-25 if lofted else 10, 0, 0), 'UpLeg_L': (-12, 0, 4), 'Leg_L': (-25, 0, 0),
               'Spine': (-8 if lofted else 6, 0, -12), 'UpperArm_L': (40, 0, 55), 'UpperArm_R': (-35, 0, -25), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-30, 0, 0), 'Head': (-8, 0, 0)}
    follow = {'UpLeg_R': (85 * power, 0, 8), 'Leg_R': (-30, 0, 0), 'UpLeg_L': (-18, 0, 4), 'Leg_L': (-15, 0, 0),
              'Spine': (-14 if lofted else 2, 0, -22), 'UpperArm_L': (20, 0, 70), 'UpperArm_R': (-50, 0, -30), 'ForeArm_L': (-25, 0, 0), 'ForeArm_R': (-35, 0, 0), 'Head': (-6, 0, 0)}
    return action(name, [(0, READY, (0, 0, 0)), (0.3, wind, (0, 0, -0.02)), (0.45, contact, (0, 0, 0.0)), (0.75, follow, (0, 0, 0.02)), (1.0, IDLE, (0, 0, 0))], length)

clips.append(kick_clip('pass_short', 0.5, False, 0.5))
clips.append(kick_clip('pass_long', 0.85, True, 0.65))
clips.append(kick_clip('shot', 1.0, False, 0.7))
clips.append(kick_clip('shot_finesse', 0.7, True, 0.65))

clips.append(action('header', [
    (0, READY, (0, 0, 0)),
    (0.35, {'Spine': (-18, 0, 0), 'Spine1': (-10, 0, 0), 'Head': (-25, 0, 0), 'UpperArm_L': (-30, 0, 40), 'UpperArm_R': (-30, 0, -40), 'ForeArm_L': (-70, 0, 0), 'ForeArm_R': (-70, 0, 0), 'UpLeg_L': (10, 0, 4), 'UpLeg_R': (10, 0, -4), 'Leg_L': (-30, 0, 0), 'Leg_R': (-30, 0, 0)}, (0, 0, 0.12)),
    (0.55, {'Spine': (28, 0, 0), 'Spine1': (14, 0, 0), 'Head': (22, 0, 0), 'UpperArm_L': (20, 0, 30), 'UpperArm_R': (20, 0, -30), 'ForeArm_L': (-60, 0, 0), 'ForeArm_R': (-60, 0, 0), 'UpLeg_L': (-5, 0, 4), 'UpLeg_R': (-5, 0, -4), 'Leg_L': (-10, 0, 0), 'Leg_R': (-10, 0, 0)}, (0, 0, 0.22)),
    (1.0, IDLE, (0, 0, 0))], 0.8))

clips.append(action('tackle_stand', [
    (0, READY, (0, 0, 0)),
    (0.4, {'Spine': (30, 0, -10), 'UpLeg_R': (45, 0, -6), 'Leg_R': (-30, 0, 0), 'UpLeg_L': (-10, 0, 6), 'Leg_L': (-50, 0, 0), 'UpperArm_L': (40, 0, 30), 'UpperArm_R': (-30, 0, -30), 'ForeArm_L': (-50, 0, 0), 'ForeArm_R': (-40, 0, 0), 'Head': (-20, 0, 0)}, (0, 0, -0.08)),
    (1.0, IDLE, (0, 0, 0))], 0.6))

clips.append(action('tackle_slide', [
    (0, READY, (0, 0, 0)),
    (0.3, {'Spine': (35, 0, 0), 'UpLeg_R': (95, 0, -10), 'Leg_R': (-10, 0, 0), 'UpLeg_L': (10, 0, 15), 'Leg_L': (-120, 0, 0), 'UpperArm_L': (-60, 0, 30), 'UpperArm_R': (60, 0, -20), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-30, 0, 0), 'Head': (-20, 0, 0)}, (0, 0, -0.35)),
    (0.6, {'Spine': (20, 0, 0), 'UpLeg_R': (90, 0, -10), 'Leg_R': (-5, 0, 0), 'UpLeg_L': (30, 0, 15), 'Leg_L': (-130, 0, 0), 'UpperArm_L': (-70, 0, 20), 'UpperArm_R': (20, 0, -20), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'Head': (-15, 0, 0)}, (0, 0, -0.55)),
    (0.8, {'Spine': (25, 0, 0), 'UpLeg_R': (60, 0, -10), 'Leg_R': (-60, 0, 0), 'UpLeg_L': (40, 0, 10), 'Leg_L': (-100, 0, 0), 'UpperArm_L': (-40, 0, 30), 'UpperArm_R': (-20, 0, -30), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-40, 0, 0)}, (0, 0, -0.40)),
    (1.0, IDLE, (0, 0, 0))], 1.1))

clips.append(action('throw_in', [
    (0, {'UpperArm_L': (-60, 0, 20), 'UpperArm_R': (-60, 0, -20), 'ForeArm_L': (-90, 0, 0), 'ForeArm_R': (-90, 0, 0), 'UpLeg_L': (8, 0, 4), 'UpLeg_R': (-8, 0, -4)}, (0, 0, 0)),
    (0.35, {'Spine': (-25, 0, 0), 'Spine1': (-12, 0, 0), 'Head': (-15, 0, 0), 'UpperArm_L': (-150, 0, 15), 'UpperArm_R': (-150, 0, -15), 'ForeArm_L': (-110, 0, 0), 'ForeArm_R': (-110, 0, 0), 'UpLeg_L': (15, 0, 4), 'UpLeg_R': (-15, 0, -4), 'Leg_L': (-20, 0, 0)}, (0, 0, 0)),
    (0.6, {'Spine': (30, 0, 0), 'Spine1': (15, 0, 0), 'Head': (10, 0, 0), 'UpperArm_L': (-70, 0, 15), 'UpperArm_R': (-70, 0, -15), 'ForeArm_L': (-10, 0, 0), 'ForeArm_R': (-10, 0, 0), 'UpLeg_L': (25, 0, 4), 'UpLeg_R': (-15, 0, -4), 'Leg_L': (-25, 0, 0)}, (0, 0, 0)),
    (1.0, IDLE, (0, 0, 0))], 1.1))

FALLEN = {'Spine': (10, 0, 0), 'Head': (-20, 0, 0), 'UpperArm_L': (-40, 0, 40), 'UpperArm_R': (20, 0, -30), 'ForeArm_L': (-60, 0, 0), 'ForeArm_R': (-40, 0, 0), 'UpLeg_L': (40, 0, 10), 'UpLeg_R': (10, 0, -10), 'Leg_L': (-70, 0, 0), 'Leg_R': (-30, 0, 0)}
clips.append(action('fall', [(0, READY, (0, 0, 0)), (0.5, dict(FALLEN, Spine=(60, 0, 20)), (0, 0, -0.45)), (1.0, FALLEN, (0, 0, -0.78))], 0.8))
clips.append(action('get_up', [(0, FALLEN, (0, 0, -0.78)), (0.5, {'Spine': (40, 0, 0), 'UpLeg_L': (80, 0, 8), 'Leg_L': (-100, 0, 0), 'UpLeg_R': (30, 0, -8), 'Leg_R': (-110, 0, 0), 'UpperArm_L': (60, 0, 20), 'UpperArm_R': (60, 0, -20), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0)}, (0, 0, -0.45)), (1.0, IDLE, (0, 0, 0))], 1.2))
clips.append(still('lying', FALLEN, 2.0, 0.3, root=(0, 0, -0.78)))

clips.append(action('celebrate_arms', [
    (0, IDLE, (0, 0, 0)),
    (0.3, {'Spine': (-15, 0, 0), 'Head': (-25, 0, 0), 'UpperArm_L': (-160, 0, 25), 'UpperArm_R': (-160, 0, -25), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0), 'UpLeg_L': (-8, 0, 6), 'UpLeg_R': (-8, 0, -6)}, (0, 0, 0.0)),
    (0.5, {'Spine': (-20, 0, 0), 'Head': (-30, 0, 0), 'UpperArm_L': (-170, 0, 35), 'UpperArm_R': (-170, 0, -35), 'ForeArm_L': (-10, 0, 0), 'ForeArm_R': (-10, 0, 0), 'UpLeg_L': (20, 0, 6), 'UpLeg_R': (20, 0, -6), 'Leg_L': (-40, 0, 0), 'Leg_R': (-40, 0, 0)}, (0, 0, 0.25)),
    (0.7, {'Spine': (-15, 0, 0), 'Head': (-25, 0, 0), 'UpperArm_L': (-160, 0, 25), 'UpperArm_R': (-160, 0, -25), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0), 'UpLeg_L': (-8, 0, 6), 'UpLeg_R': (-8, 0, -6)}, (0, 0, 0.0)),
    (1.0, {'Spine': (-10, 0, 0), 'UpperArm_L': (-150, 0, 20), 'UpperArm_R': (-150, 0, -20), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'UpLeg_L': (10, 0, 6), 'UpLeg_R': (10, 0, -6), 'Leg_L': (-20, 0, 0), 'Leg_R': (-20, 0, 0)}, (0, 0, 0.0))], 1.4, loop=True))
clips.append(action('celebrate_knee_slide', [
    (0, {'Spine': (10, 0, 0), 'UpperArm_L': (-100, 0, 60), 'UpperArm_R': (-100, 0, -60), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'UpLeg_L': (40, 0, 6), 'UpLeg_R': (40, 0, -6), 'Leg_L': (-120, 0, 0), 'Leg_R': (-120, 0, 0)}, (0, 0, -0.45)),
    (0.5, {'Spine': (-15, 0, 0), 'Head': (-30, 0, 0), 'UpperArm_L': (-120, 0, 70), 'UpperArm_R': (-120, 0, -70), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0), 'UpLeg_L': (30, 0, 6), 'UpLeg_R': (30, 0, -6), 'Leg_L': (-130, 0, 0), 'Leg_R': (-130, 0, 0)}, (0, 0, -0.48)),
    (1.0, {'Spine': (5, 0, 0), 'UpperArm_L': (-100, 0, 60), 'UpperArm_R': (-100, 0, -60), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'UpLeg_L': (40, 0, 6), 'UpLeg_R': (40, 0, -6), 'Leg_L': (-120, 0, 0), 'Leg_R': (-120, 0, 0)}, (0, 0, -0.45))], 1.6, loop=True))
clips.append(action('celebrate_point', [
    (0, IDLE, (0, 0, 0)),
    (0.4, {'Spine': (-10, 0, -15), 'Head': (-20, -20, 0), 'UpperArm_R': (-165, 0, -10), 'ForeArm_R': (-5, 0, 0), 'UpperArm_L': (10, 0, 15), 'ForeArm_L': (-20, 0, 0), 'UpLeg_L': (8, 0, 6), 'UpLeg_R': (-6, 0, -6)}, (0, 0, 0)),
    (1.0, {'Spine': (-8, 0, -12), 'Head': (-15, -15, 0), 'UpperArm_R': (-160, 0, -12), 'ForeArm_R': (-8, 0, 0), 'UpperArm_L': (10, 0, 15), 'ForeArm_L': (-20, 0, 0), 'UpLeg_L': (8, 0, 6), 'UpLeg_R': (-6, 0, -6)}, (0, 0, 0))], 1.6, loop=True))

GK_READY = {'Spine': (22, 0, 0), 'Spine1': (8, 0, 0), 'Head': (-18, 0, 0), 'UpLeg_L': (35, 0, 14), 'UpLeg_R': (35, 0, -14), 'Leg_L': (-55, 0, 0), 'Leg_R': (-55, 0, 0), 'Foot_L': (18, 0, 0), 'Foot_R': (18, 0, 0),
            'UpperArm_L': (40, 0, 35), 'UpperArm_R': (40, 0, -35), 'ForeArm_L': (-80, 0, 0), 'ForeArm_R': (-80, 0, 0)}
clips.append(still('gk_idle', GK_READY, 2.0, 0.8))
def gk_dive(name, s):
    # s=+1 dive to the keeper's left (+X)
    return action(name, [
        (0, GK_READY, (0, 0, 0)),
        (0.3, {'Spine': (10, 0, -25 * s), 'Spine1': (0, 0, -10 * s), 'Head': (-10, 0, 10 * s), 'UpperArm_L': (-150 if s > 0 else 30, 0, 60 * s), 'UpperArm_R': (-150 if s < 0 else 30, 0, 60 * s), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0),
                'UpLeg_L': (20 - 30 * s, 0, 20), 'UpLeg_R': (20 + 30 * s, 0, -20), 'Leg_L': (-40, 0, 0), 'Leg_R': (-40, 0, 0)}, (0, 0, 0.1)),
        (0.6, {'Spine': (0, 0, -70 * s), 'Spine1': (0, 0, -10 * s), 'Head': (0, 0, 20 * s), 'UpperArm_L': (-170 if s > 0 else 20, 0, 70 * s), 'UpperArm_R': (-170 if s < 0 else 20, 0, 70 * s), 'ForeArm_L': (-10, 0, 0), 'ForeArm_R': (-10, 0, 0),
                'UpLeg_L': (10, 0, 25), 'UpLeg_R': (10, 0, -25), 'Leg_L': (-20, 0, 0), 'Leg_R': (-30, 0, 0)}, (0, 0, -0.3)),
        (1.0, {'Spine': (0, 0, -85 * s), 'Head': (0, 0, 25 * s), 'UpperArm_L': (-160 if s > 0 else 40, 0, 60 * s), 'UpperArm_R': (-160 if s < 0 else 40, 0, 60 * s), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0),
                'UpLeg_L': (30, 0, 15), 'UpLeg_R': (10, 0, -15), 'Leg_L': (-60, 0, 0), 'Leg_R': (-30, 0, 0)}, (0, 0, -0.75))], 0.9)
clips.append(gk_dive('gk_dive_L', 1)); clips.append(gk_dive('gk_dive_R', -1))
clips.append(action('gk_catch', [(0, GK_READY, (0, 0, 0)), (0.4, {'Spine': (5, 0, 0), 'Head': (-15, 0, 0), 'UpperArm_L': (-90, 0, 20), 'UpperArm_R': (-90, 0, -20), 'ForeArm_L': (-60, 0, 0), 'ForeArm_R': (-60, 0, 0), 'UpLeg_L': (15, 0, 10), 'UpLeg_R': (15, 0, -10), 'Leg_L': (-25, 0, 0), 'Leg_R': (-25, 0, 0)}, (0, 0, 0.05)),
                                 (1.0, {'Spine': (20, 0, 0), 'UpperArm_L': (40, 0, 25), 'UpperArm_R': (40, 0, -25), 'ForeArm_L': (-110, 0, 0), 'ForeArm_R': (-110, 0, 0), 'UpLeg_L': (20, 0, 10), 'UpLeg_R': (20, 0, -10), 'Leg_L': (-35, 0, 0), 'Leg_R': (-35, 0, 0)}, (0, 0, 0))], 0.9))

clips.append(action('referee_card', [(0, IDLE, (0, 0, 0)), (0.35, {'UpperArm_R': (-165, 0, -15), 'ForeArm_R': (-10, 0, 0), 'Spine': (-6, 0, 0), 'Head': (-10, 0, 0)}, (0, 0, 0)), (1.0, {'UpperArm_R': (-160, 0, -15), 'ForeArm_R': (-12, 0, 0), 'Spine': (-5, 0, 0), 'Head': (-8, 0, 0)}, (0, 0, 0))], 1.4, loop=True))
clips.append(action('referee_whistle', [(0, IDLE, (0, 0, 0)), (0.4, {'UpperArm_R': (-70, 0, -10), 'ForeArm_R': (-135, 0, 0), 'Head': (-5, 0, 0)}, (0, 0, 0)), (1.0, {'UpperArm_R': (-70, 0, -10), 'ForeArm_R': (-135, 0, 0)}, (0, 0, 0))], 1.0))
clips.append(still('sit', {'UpLeg_L': (85, 0, 8), 'UpLeg_R': (85, 0, -8), 'Leg_L': (-85, 0, 0), 'Leg_R': (-85, 0, 0), 'Spine': (6, 0, 0), 'UpperArm_L': (20, 0, 10), 'UpperArm_R': (20, 0, -10), 'ForeArm_L': (-70, 0, 0), 'ForeArm_R': (-70, 0, 0)}, 2.0, 0.4, root=(0, 0, -0.42)))
clips.append(still('manager_idle', {'UpperArm_L': (10, 0, 10), 'UpperArm_R': (10, 0, -10), 'ForeArm_L': (-120, 0, 0), 'ForeArm_R': (-120, 0, 0), 'Spine': (-3, 0, 0), 'UpLeg_L': (0, 0, 5), 'UpLeg_R': (0, 0, -5)}, 3.0, 0.5))

# ---- clips that rotate the whole body (Hips): slide, dive, fall, lying, get_up (replace earlier drafts)
REDO = {'tackle_slide', 'gk_dive_L', 'gk_dive_R', 'fall', 'lying', 'get_up', 'celebrate_knee_slide'}
clips = [c for c in clips if c.name not in REDO]
clips.append(action('tackle_slide', [
    (0, READY, (0, 0, 0)),
    (0.25, {'Hips': (-30, 0, 0), 'Spine': (20, 0, 0), 'UpLeg_R': (60, 0, -8), 'Leg_R': (-10, 0, 0), 'UpLeg_L': (45, 0, 12), 'Leg_L': (-110, 0, 0), 'UpperArm_L': (-50, 0, 30), 'UpperArm_R': (50, 0, -20), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-30, 0, 0), 'Head': (-15, 0, 0)}, (0, 0, -0.30)),
    (0.55, {'Hips': (-55, 0, 0), 'Spine': (25, 0, 0), 'UpLeg_R': (35, 0, -8), 'Leg_R': (-5, 0, 0), 'UpLeg_L': (65, 0, 15), 'Leg_L': (-125, 0, 0), 'UpperArm_L': (-70, 0, 20), 'UpperArm_R': (30, 0, -20), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'Head': (-20, 0, 0)}, (0, 0, -0.52)),
    (0.8, {'Hips': (-40, 0, 0), 'Spine': (25, 0, 0), 'UpLeg_R': (40, 0, -8), 'Leg_R': (-40, 0, 0), 'UpLeg_L': (55, 0, 10), 'Leg_L': (-110, 0, 0), 'UpperArm_L': (-40, 0, 30), 'UpperArm_R': (-20, 0, -30), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-40, 0, 0)}, (0, 0, -0.42)),
    (1.0, IDLE, (0, 0, 0))], 1.1))
def gk_dive(name, s):
    # s=+1 dive to the keeper's left (+X). Hips roll about the forward axis: negative roll tilts the top toward +X.
    return action(name, [
        (0, GK_READY, (0, 0, 0)),
        (0.3, {'Hips': (0, 0, -35 * s), 'Spine': (5, 0, -10 * s), 'Head': (-10, 0, 10 * s), 'UpperArm_L': (-150 if s > 0 else 40, 0, 40 * s), 'UpperArm_R': (-150 if s < 0 else 40, 0, 40 * s), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0),
                'UpLeg_L': (25, 0, 10), 'UpLeg_R': (25, 0, -10), 'Leg_L': (-40, 0, 0), 'Leg_R': (-40, 0, 0)}, (0, 0, 0.05)),
        (0.6, {'Hips': (0, 0, -75 * s), 'Spine': (0, 0, -8 * s), 'Head': (0, 0, 20 * s), 'UpperArm_L': (-170 if s > 0 else 20, 0, 30 * s), 'UpperArm_R': (-170 if s < 0 else 20, 0, 30 * s), 'ForeArm_L': (-10, 0, 0), 'ForeArm_R': (-10, 0, 0),
                'UpLeg_L': (10, 0, 15), 'UpLeg_R': (10, 0, -15), 'Leg_L': (-15, 0, 0), 'Leg_R': (-25, 0, 0)}, (0, 0, -0.35)),
        (1.0, {'Hips': (0, 0, -85 * s), 'Spine': (0, 0, -5 * s), 'Head': (0, 0, 25 * s), 'UpperArm_L': (-160 if s > 0 else 40, 0, 25 * s), 'UpperArm_R': (-160 if s < 0 else 40, 0, 25 * s), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0),
                'UpLeg_L': (25, 0, 10), 'UpLeg_R': (5, 0, -10), 'Leg_L': (-50, 0, 0), 'Leg_R': (-20, 0, 0)}, (0, 0, -0.66))], 0.9)
clips.append(gk_dive('gk_dive_L', 1)); clips.append(gk_dive('gk_dive_R', -1))
LYING = {'Hips': (-82, 0, 0), 'Spine': (6, 0, 0), 'Head': (25, 0, 0), 'UpperArm_L': (-40, 0, 40), 'UpperArm_R': (20, 0, -30), 'ForeArm_L': (-60, 0, 0), 'ForeArm_R': (-40, 0, 0), 'UpLeg_L': (35, 0, 10), 'UpLeg_R': (10, 0, -10), 'Leg_L': (-60, 0, 0), 'Leg_R': (-25, 0, 0)}
clips.append(action('fall', [(0, READY, (0, 0, 0)), (0.5, {**LYING, 'Hips': (-45, 0, 0), 'Spine': (30, 0, 0)}, (0, 0, -0.45)), (1.0, LYING, (0, 0, -0.84))], 0.8))
clips.append(still('lying', LYING, 2.0, 0.3, root=(0, 0, -0.84)))
clips.append(action('get_up', [(0, LYING, (0, 0, -0.84)), (0.5, {'Hips': (-20, 0, 0), 'Spine': (40, 0, 0), 'UpLeg_L': (80, 0, 8), 'Leg_L': (-100, 0, 0), 'UpLeg_R': (30, 0, -8), 'Leg_R': (-110, 0, 0), 'UpperArm_L': (60, 0, 20), 'UpperArm_R': (60, 0, -20), 'ForeArm_L': (-20, 0, 0), 'ForeArm_R': (-20, 0, 0)}, (0, 0, -0.45)), (1.0, IDLE, (0, 0, 0))], 1.2))
KNEE = {'Hips': (-18, 0, 0), 'Spine': (0, 0, 0), 'UpperArm_L': (-100, 0, 60), 'UpperArm_R': (-100, 0, -60), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0), 'UpLeg_L': (20, 0, 6), 'UpLeg_R': (20, 0, -6), 'Leg_L': (-125, 0, 0), 'Leg_R': (-125, 0, 0)}
clips.append(action('celebrate_knee_slide', [(0, KNEE, (0, 0, -0.46)), (0.5, {**KNEE, 'Spine': (-15, 0, 0), 'Head': (-30, 0, 0), 'UpperArm_L': (-125, 0, 70), 'UpperArm_R': (-125, 0, -70)}, (0, 0, -0.48)), (1.0, KNEE, (0, 0, -0.46))], 1.6, loop=True))

# ---- skill moves, fake shot and shield (right-footed; the game mirrors direction by turning the player)
DRIB = {'Spine': (10, 0, 0), 'Spine1': (4, 0, 0), 'Head': (-8, 0, 0), 'UpLeg_L': (12, 0, 6), 'UpLeg_R': (12, 0, -6), 'Leg_L': (-28, 0, 0), 'Leg_R': (-28, 0, 0),
        'UpperArm_L': (12, 0, 18), 'UpperArm_R': (12, 0, -18), 'ForeArm_L': (-45, 0, 0), 'ForeArm_R': (-45, 0, 0)}
ARMS = {'UpperArm_L': (20, 0, 40), 'UpperArm_R': (10, 0, -45), 'ForeArm_L': (-35, 0, 0), 'ForeArm_R': (-35, 0, 0)}
clips.append(action('skill_stepover', [
    (0, DRIB, (0, 0, 0)),
    (0.3, {**DRIB, **ARMS, 'UpLeg_R': (45, 0, 18), 'Leg_R': (-75, 0, 0), 'Spine': (12, 0, 8), 'UpLeg_L': (6, 0, 6), 'Leg_L': (-30, 0, 0)}, (0.04, 0, 0)),
    (0.52, {**DRIB, **ARMS, 'UpLeg_R': (40, 0, -28), 'Leg_R': (-55, 0, 0), 'Spine': (12, 0, -12), 'UpLeg_L': (4, 0, 8), 'Leg_L': (-35, 0, 0)}, (-0.12, 0, -0.03)),
    (0.72, {**DRIB, **ARMS, 'UpLeg_R': (6, 0, -22), 'Leg_R': (-25, 0, 0), 'UpLeg_L': (16, 0, 12), 'Leg_L': (-42, 0, 0), 'Spine': (15, 0, -16)}, (-0.22, 0, -0.06)),
    (1.0, DRIB, (0, 0, 0))], 0.7))
clips.append(action('skill_dragback', [
    (0, DRIB, (0, 0, 0)),
    (0.28, {**DRIB, 'UpLeg_R': (35, 0, -4), 'Leg_R': (-15, 0, 0), 'Foot_R': (-25, 0, 0), 'Spine': (-4, 0, 0), 'UpLeg_L': (-4, 0, 6), 'Leg_L': (-25, 0, 0)}, (0, 0, -0.02)),
    (0.58, {**DRIB, 'UpLeg_R': (-15, 0, -4), 'Leg_R': (-60, 0, 0), 'Foot_R': (10, 0, 0), 'Spine': (-12, 0, 0), 'Head': (-12, 0, 0), 'UpLeg_L': (8, 0, 6), 'Leg_L': (-35, 0, 0)}, (0, 0, -0.04)),
    (1.0, DRIB, (0, 0, 0))], 0.55))
clips.append(action('skill_roulette', [
    (0, DRIB, (0, 0, 0)),
    (0.25, {**DRIB, **ARMS, 'UpLeg_R': (30, 0, -4), 'Leg_R': (-15, 0, 0), 'Foot_R': (-25, 0, 0), 'Spine': (-6, 0, 0)}, (0, 0, -0.02)),
    (0.5, {**DRIB, **ARMS, 'UpLeg_R': (-10, 0, -8), 'Leg_R': (-50, 0, 0), 'UpLeg_L': (25, 0, 10), 'Leg_L': (-20, 0, 0), 'Foot_L': (-25, 0, 0), 'Spine': (-8, 0, 0)}, (0, 0, -0.04)),
    (0.75, {**DRIB, **ARMS, 'UpLeg_L': (-10, 0, 8), 'Leg_L': (-50, 0, 0), 'UpLeg_R': (15, 0, -6), 'Leg_R': (-30, 0, 0)}, (0, 0, -0.03)),
    (1.0, DRIB, (0, 0, 0))], 0.8))
clips.append(action('skill_ballroll', [
    (0, DRIB, (0, 0, 0)),
    (0.3, {**DRIB, **ARMS, 'UpLeg_R': (30, 0, 12), 'Leg_R': (-20, 0, 0), 'Foot_R': (-25, 0, 0), 'Spine': (6, 0, 8)}, (0.04, 0, -0.02)),
    (0.62, {**DRIB, **ARMS, 'UpLeg_R': (22, 0, -30), 'Leg_R': (-25, 0, 0), 'Foot_R': (-15, 0, 0), 'UpLeg_L': (8, 0, 14), 'Leg_L': (-35, 0, 0), 'Spine': (8, 0, -10)}, (-0.18, 0, -0.04)),
    (1.0, DRIB, (0, 0, 0))], 0.6))
clips.append(action('skill_heelchop', [
    (0, DRIB, (0, 0, 0)),
    (0.35, {**DRIB, **ARMS, 'UpLeg_R': (-22, 0, 26), 'Leg_R': (-80, 0, 0), 'Spine': (16, 0, -10), 'UpLeg_L': (18, 0, 6), 'Leg_L': (-40, 0, 0)}, (0, 0, -0.04)),
    (0.58, {**DRIB, **ARMS, 'UpLeg_R': (-10, 0, 32), 'Leg_R': (-40, 0, 0), 'Spine': (14, 0, -16)}, (0.06, 0, -0.04)),
    (1.0, DRIB, (0, 0, 0))], 0.6))
clips.append(action('skill_flick', [
    (0, DRIB, (0, 0, 0)),
    (0.3, {**DRIB, 'UpLeg_R': (-25, 0, -5), 'Leg_R': (-95, 0, 0), 'Foot_R': (30, 0, 0), 'UpLeg_L': (20, 0, 6), 'Leg_L': (-35, 0, 0)}, (0, 0, -0.02)),
    (0.5, {**DRIB, 'UpLeg_R': (18, 0, -5), 'Leg_R': (-30, 0, 0), 'Foot_R': (-25, 0, 0), 'Spine': (-10, 0, 0), 'Head': (-15, 0, 0)}, (0, 0, 0.05)),
    (1.0, DRIB, (0, 0, 0))], 0.6))
clips.append(action('fake_shot', [
    (0, READY, (0, 0, 0)),
    (0.4, {'UpLeg_R': (-32, 0, -6), 'Leg_R': (-90, 0, 0), 'UpLeg_L': (10, 0, 4), 'Leg_L': (-22, 0, 0), 'Spine': (12, 0, 10), 'UpperArm_L': (-45, 0, 30), 'UpperArm_R': (30, 0, -20), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-40, 0, 0), 'Head': (-10, 0, 0)}, (0, 0, -0.02)),
    (0.62, {**DRIB, 'UpLeg_R': (20, 0, 10), 'Leg_R': (-35, 0, 0), 'Foot_R': (-10, 0, 0), 'Spine': (14, 0, 6), 'UpperArm_L': (10, 0, 40), 'UpperArm_R': (10, 0, -30)}, (0.05, 0, -0.03)),
    (1.0, DRIB, (0, 0, 0))], 0.6))
clips.append(still('shield', {'Spine': (18, 0, 0), 'Spine1': (6, 0, 0), 'Head': (-14, 0, 0), 'UpLeg_L': (26, 0, 16), 'UpLeg_R': (26, 0, -16), 'Leg_L': (-48, 0, 0), 'Leg_R': (-48, 0, 0),
                          'UpperArm_L': (5, 0, 60), 'UpperArm_R': (5, 0, -60), 'ForeArm_L': (-25, 0, 0), 'ForeArm_R': (-25, 0, 0)}, 1.2, 0.6))

# ---- extra celebrations (8 in total with arms / knee slide / point / dance)
clips.append(action('celebrate_fists', [
    (0, IDLE, (0, 0, 0)),
    (0.25, {'Spine': (-12, 0, 0), 'Head': (-20, 0, 0), 'UpperArm_L': (-70, 0, 40), 'UpperArm_R': (-70, 0, -40), 'ForeArm_L': (-120, 0, 0), 'ForeArm_R': (-120, 0, 0), 'UpLeg_L': (20, 0, 8), 'UpLeg_R': (20, 0, -8), 'Leg_L': (-40, 0, 0), 'Leg_R': (-40, 0, 0)}, (0, 0, -0.08)),
    (0.5, {'Spine': (8, 0, 0), 'Head': (-5, 0, 0), 'UpperArm_L': (-20, 0, 30), 'UpperArm_R': (-20, 0, -30), 'ForeArm_L': (-130, 0, 0), 'ForeArm_R': (-130, 0, 0), 'UpLeg_L': (35, 0, 8), 'UpLeg_R': (35, 0, -8), 'Leg_L': (-60, 0, 0), 'Leg_R': (-60, 0, 0)}, (0, 0, -0.14)),
    (0.75, {'Spine': (-12, 0, 0), 'Head': (-20, 0, 0), 'UpperArm_L': (-70, 0, 40), 'UpperArm_R': (-70, 0, -40), 'ForeArm_L': (-120, 0, 0), 'ForeArm_R': (-120, 0, 0), 'UpLeg_L': (20, 0, 8), 'UpLeg_R': (20, 0, -8), 'Leg_L': (-40, 0, 0), 'Leg_R': (-40, 0, 0)}, (0, 0, -0.08)),
    (1.0, {'Spine': (8, 0, 0), 'Head': (-5, 0, 0), 'UpperArm_L': (-20, 0, 30), 'UpperArm_R': (-20, 0, -30), 'ForeArm_L': (-130, 0, 0), 'ForeArm_R': (-130, 0, 0), 'UpLeg_L': (35, 0, 8), 'UpLeg_R': (35, 0, -8), 'Leg_L': (-60, 0, 0), 'Leg_R': (-60, 0, 0)}, (0, 0, -0.14))], 1.0, loop=True))
clips.append(action('celebrate_salute', [
    (0, IDLE, (0, 0, 0)),
    (0.3, {'Spine': (-4, 0, 0), 'Head': (-8, 0, 0), 'UpperArm_R': (-140, -45, 0), 'ForeArm_R': (-110, 0, 0), 'UpperArm_L': (6, 0, 8), 'ForeArm_L': (-10, 0, 0)}, (0, 0, 0)),
    (1.0, {'Spine': (-4, 0, 0), 'Head': (-8, 0, 0), 'UpperArm_R': (-140, -45, 0), 'ForeArm_R': (-112, 0, 0), 'UpperArm_L': (6, 0, 8), 'ForeArm_L': (-10, 0, 0)}, (0, 0, 0))], 1.6, loop=True))
clips.append(action('celebrate_shush', [
    (0, IDLE, (0, 0, 0)),
    (0.3, {'Spine': (6, 0, 6), 'Head': (6, 12, 0), 'UpperArm_R': (-40, 0, -30), 'ForeArm_R': (-150, 0, 0), 'UpperArm_L': (10, 0, 25), 'ForeArm_L': (-25, 0, 0), 'UpLeg_L': (5, 0, 8), 'UpLeg_R': (-5, 0, -8)}, (0, 0, 0)),
    (1.0, {'Spine': (8, 0, 8), 'Head': (8, 14, 0), 'UpperArm_R': (-40, 0, -30), 'ForeArm_R': (-152, 0, 0), 'UpperArm_L': (10, 0, 25), 'ForeArm_L': (-25, 0, 0), 'UpLeg_L': (5, 0, 8), 'UpLeg_R': (-5, 0, -8)}, (0, 0, 0))], 1.6, loop=True))
clips.append(action('celebrate_heart', [
    (0, IDLE, (0, 0, 0)),
    (0.3, {'Spine': (-6, 0, 0), 'Head': (-14, 0, 0), 'UpperArm_L': (-70, 0, 12), 'UpperArm_R': (-70, 0, -12), 'ForeArm_L': (-95, 0, 0), 'ForeArm_R': (-95, 0, 0)}, (0, 0, 0)),
    (1.0, {'Spine': (-8, 0, 0), 'Head': (-16, 0, 0), 'UpperArm_L': (-72, 0, 12), 'UpperArm_R': (-72, 0, -12), 'ForeArm_L': (-96, 0, 0), 'ForeArm_R': (-96, 0, 0)}, (0, 0, 0))], 1.6, loop=True))

# ---- dribble touch (played additively over the run cycle each time the ball is pushed ahead)
clips.append(action('touch_R', [
    (0, IDLE, (0, 0, 0)),
    (0.45, {**IDLE, 'UpLeg_R': (24, 0, -4), 'Leg_R': (-38, 0, 0), 'Foot_R': (18, 0, 0), 'Spine': (4, 0, 4)}, (0, 0, 0)),
    (1.0, IDLE, (0, 0, 0))], 0.3))

# ---- first touches by ball height, a stumble after a heavy touch, keeper variety (low dive, high tip-over)
clips.append(action('trap_chest', [
    (0, READY, (0, 0, 0)),
    (0.3, {'Spine': (-22, 0, 0), 'Spine1': (-10, 0, 0), 'Head': (-14, 0, 0), 'UpperArm_L': (-25, 0, 65), 'UpperArm_R': (-25, 0, -65), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-40, 0, 0), 'UpLeg_L': (14, 0, 8), 'UpLeg_R': (14, 0, -8), 'Leg_L': (-28, 0, 0), 'Leg_R': (-28, 0, 0)}, (0, 0, 0.02)),
    (0.6, {'Spine': (14, 0, 0), 'Spine1': (6, 0, 0), 'Head': (-24, 0, 0), 'UpperArm_L': (10, 0, 45), 'UpperArm_R': (10, 0, -45), 'ForeArm_L': (-35, 0, 0), 'ForeArm_R': (-35, 0, 0), 'UpLeg_L': (28, 0, 8), 'UpLeg_R': (28, 0, -8), 'Leg_L': (-45, 0, 0), 'Leg_R': (-45, 0, 0)}, (0, 0, -0.04)),
    (1.0, DRIB, (0, 0, 0))], 0.7))
clips.append(action('trap_thigh', [
    (0, READY, (0, 0, 0)),
    (0.35, {'Spine': (6, 0, 4), 'Head': (-26, 0, 0), 'UpLeg_R': (78, 0, -10), 'Leg_R': (-70, 0, 0), 'Foot_R': (20, 0, 0), 'UpLeg_L': (4, 0, 6), 'Leg_L': (-16, 0, 0), 'UpperArm_L': (-20, 0, 50), 'UpperArm_R': (-10, 0, -50), 'ForeArm_L': (-40, 0, 0), 'ForeArm_R': (-40, 0, 0)}, (0, 0, -0.01)),
    (0.65, {'Spine': (10, 0, 2), 'Head': (-20, 0, 0), 'UpLeg_R': (30, 0, -8), 'Leg_R': (-30, 0, 0), 'UpLeg_L': (8, 0, 6), 'Leg_L': (-25, 0, 0), 'UpperArm_L': (0, 0, 35), 'UpperArm_R': (0, 0, -35), 'ForeArm_L': (-35, 0, 0), 'ForeArm_R': (-35, 0, 0)}, (0, 0, -0.02)),
    (1.0, DRIB, (0, 0, 0))], 0.6))
clips.append(action('stumble', [
    (0, READY, (0, 0, 0)),
    (0.3, {'Spine': (38, 0, 8), 'Spine1': (10, 0, 0), 'Head': (-20, 0, 0), 'UpLeg_R': (-20, 0, -6), 'Leg_R': (-30, 0, 0), 'UpLeg_L': (55, 0, 10), 'Leg_L': (-20, 0, 0), 'UpperArm_L': (-70, 0, 30), 'UpperArm_R': (-60, 0, -40), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0)}, (0.08, 0, -0.08)),
    (0.6, {'Spine': (30, 0, -8), 'Spine1': (8, 0, 0), 'Head': (-16, 0, 0), 'UpLeg_R': (50, 0, -8), 'Leg_R': (-45, 0, 0), 'UpLeg_L': (-10, 0, 8), 'Leg_L': (-25, 0, 0), 'UpperArm_L': (-40, 0, 55), 'UpperArm_R': (-80, 0, -30), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-35, 0, 0)}, (0.14, 0, -0.1)),
    (1.0, DRIB, (0, 0, 0))], 0.75))
def gk_dive_low(name, s):
    # a low dive: the keeper drops from the crouch and reaches along the ground, far less air than the full dive
    return action(name, [
        (0, GK_READY, (0, 0, 0)),
        (0.3, {'Hips': (0, 0, -40 * s), 'Spine': (18, 0, -8 * s), 'Head': (-14, 0, 12 * s), 'UpperArm_L': (-110 if s > 0 else 50, 0, 30 * s), 'UpperArm_R': (-110 if s < 0 else 50, 0, 30 * s), 'ForeArm_L': (-25, 0, 0), 'ForeArm_R': (-25, 0, 0),
                'UpLeg_L': (45, 0, 12), 'UpLeg_R': (45, 0, -12), 'Leg_L': (-70, 0, 0), 'Leg_R': (-70, 0, 0)}, (0, 0, -0.2)),
        (0.6, {'Hips': (0, 0, -82 * s), 'Spine': (6, 0, -6 * s), 'Head': (0, 0, 20 * s), 'UpperArm_L': (-150 if s > 0 else 30, 0, 20 * s), 'UpperArm_R': (-150 if s < 0 else 30, 0, 20 * s), 'ForeArm_L': (-15, 0, 0), 'ForeArm_R': (-15, 0, 0),
                'UpLeg_L': (30, 0, 15), 'UpLeg_R': (20, 0, -15), 'Leg_L': (-40, 0, 0), 'Leg_R': (-45, 0, 0)}, (0, 0, -0.62)),
        (1.0, {'Hips': (0, 0, -86 * s), 'Spine': (0, 0, -5 * s), 'Head': (0, 0, 25 * s), 'UpperArm_L': (-150 if s > 0 else 40, 0, 20 * s), 'UpperArm_R': (-150 if s < 0 else 40, 0, 20 * s), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0),
                'UpLeg_L': (30, 0, 10), 'UpLeg_R': (10, 0, -10), 'Leg_L': (-55, 0, 0), 'Leg_R': (-25, 0, 0)}, (0, 0, -0.7))], 0.8)
clips.append(gk_dive_low('gk_dive_low_L', 1)); clips.append(gk_dive_low('gk_dive_low_R', -1))
def gk_tip(name, s):
    # a high tip-over: a jump up and across with the near arm stretched
    return action(name, [
        (0, GK_READY, (0, 0, 0)),
        (0.25, {'Hips': (0, 0, -15 * s), 'Spine': (-8, 0, -10 * s), 'Head': (-22, 0, 8 * s), 'UpperArm_L': (-165 if s > 0 else 20, 0, 15 * s), 'UpperArm_R': (-165 if s < 0 else 20, 0, 15 * s), 'ForeArm_L': (-10, 0, 0), 'ForeArm_R': (-10, 0, 0),
                'UpLeg_L': (40, 0, 10), 'UpLeg_R': (40, 0, -10), 'Leg_L': (-60, 0, 0), 'Leg_R': (-60, 0, 0)}, (0, 0, 0.1)),
        (0.5, {'Hips': (0, 0, -45 * s), 'Spine': (-10, 0, -12 * s), 'Head': (-20, 0, 15 * s), 'UpperArm_L': (-175 if s > 0 else 30, 0, 10 * s), 'UpperArm_R': (-175 if s < 0 else 30, 0, 10 * s), 'ForeArm_L': (-5, 0, 0), 'ForeArm_R': (-5, 0, 0),
                'UpLeg_L': (10, 0, 15), 'UpLeg_R': (30, 0, -15), 'Leg_L': (-20, 0, 0), 'Leg_R': (-70, 0, 0)}, (0, 0, 0.2)),
        (1.0, {'Hips': (0, 0, -80 * s), 'Spine': (0, 0, -5 * s), 'Head': (0, 0, 25 * s), 'UpperArm_L': (-160 if s > 0 else 40, 0, 25 * s), 'UpperArm_R': (-160 if s < 0 else 40, 0, 25 * s), 'ForeArm_L': (-30, 0, 0), 'ForeArm_R': (-30, 0, 0),
                'UpLeg_L': (25, 0, 10), 'UpLeg_R': (5, 0, -10), 'Leg_L': (-50, 0, 0), 'Leg_R': (-20, 0, 0)}, (0, 0, -0.66))], 1.0)
clips.append(gk_tip('gk_tip_L', 1)); clips.append(gk_tip('gk_tip_R', -1))

# write clips as actions
bpy.context.view_layer.objects.active = arm
for c in clips:
    act = bpy.data.actions.new(c.name)
    act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    for bone, keys in c.keys.items():
        pb = arm.pose.bones[bone]
        for f, rot in keys:
            pb.rotation_euler = rot; pb.keyframe_insert('rotation_euler', frame=f)
    hips = arm.pose.bones['Hips']
    for f, loc in c.root:
        hips.location = Vector((loc[0], loc[2], -loc[1])); hips.keyframe_insert('location', frame=f)
    for fc in act.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'; kp.easing = 'AUTO'
    act.frame_range = (0, c.frames)
    # push to NLA so every action exports
    tr = arm.animation_data.nla_tracks.new(); tr.name = c.name
    tr.strips.new(c.name, 0, act)
arm.animation_data.action = None

# ----------------------------------------------------------------------------- LOD1 (decimated body)
lod1 = body.copy(); lod1.data = body.data.copy(); lod1.name = 'Body_LOD1'; lod1.data.name = 'Body_LOD1'
scene.collection.objects.link(lod1); lod1.parent = arm
dec = lod1.modifiers.new('Decimate', 'DECIMATE'); dec.ratio = 0.3
bpy.context.view_layer.objects.active = lod1
bpy.ops.object.modifier_apply(modifier='Decimate')
lod1.hide_render = True

tri_count = sum(len(p.vertices) - 2 for o in scene.objects if o.type == 'MESH' for p in o.data.polygons)
print(f'[build_player] meshes={len([o for o in scene.objects if o.type=="MESH"])} tris~{tri_count} clips={len(clips)}')

# ----------------------------------------------------------------------------- export
for o in scene.objects: o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, 'player.glb'), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='NLA_TRACKS', export_frame_range=False, export_force_sampling=True,
    export_optimize_animation_size=True, export_skins=True, export_def_bones=False, export_yup=True,
    export_apply=True, export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE')
print('[build_player] wrote', os.path.join(OUT, 'player.glb'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'player.blend'))

# ----------------------------------------------------------------------------- preview renders (Cycles CPU)
if PREVIEW:
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 24; scene.cycles.device = 'CPU'; scene.cycles.use_denoising = False
    scene.render.resolution_x = 640; scene.render.resolution_y = 720
    cam_data = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cam_data); scene.collection.objects.link(cam)
    cam.location = (1.6, -3.2, 1.3); cam.rotation_euler = (math.radians(80), 0, math.radians(26)); scene.camera = cam
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (math.radians(50), 0, math.radians(30)); scene.collection.objects.link(sun)
    world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.6, 0.7, 0.8, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    plane = bpy.data.objects.new('Ground', bpy.data.meshes.new('Ground')); scene.collection.objects.link(plane)
    bmg = bmesh.new(); bmesh.ops.create_grid(bmg, x_segments=1, y_segments=1, size=4); bmg.to_mesh(plane.data); bmg.free()
    for o in scene.objects:
        if o.name.startswith('hair_') and o.name != 'hair_short': o.hide_render = True
    for cname, frame in (('idle', 10), ('run', 6), ('shot', 14), ('tackle_slide', 18), ('gk_dive_L', 20), ('celebrate_arms', 15)):
        arm.animation_data.action = bpy.data.actions[cname]
        for tr in arm.animation_data.nla_tracks: tr.mute = True
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(OUT, f'preview_{cname}.png')
        bpy.ops.render.render(write_still=True)
        print('[build_player] preview', scene.render.filepath)
