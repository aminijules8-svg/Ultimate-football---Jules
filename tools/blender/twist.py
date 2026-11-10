# Twist bones for the upper arms and forearms (imported by build_player_mh.py; tested by test_twist.py).
# Linear-blend skinning pinches a limb where all its roll happens at one joint (a "sweet wrapper" wrist or shoulder);
# two twist bones per segment take part of the roll so it spreads along the limb.
import math
import bpy
from mathutils import Quaternion, Vector

T = 'mixamorig:'


def add_twist_bones(arm, body):
    """Two twist bones per upper arm and forearm. Each vertex weighted to a segment hands part of that weight to the
    twist bone nearest along the segment (triangular falloff), so twist spreads along the limb instead of at one joint."""
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones
    made = []  # (twist name, segment name, peak t)
    for side in ('Left', 'Right'):
        for seg in ('Arm', 'ForeArm'):
            par = eb[T + side + seg]
            for k, (t0, t1) in enumerate(((0.2, 0.5), (0.55, 0.85)), 1):
                b = eb.new(T + side + seg + 'Twist' + str(k)); b.head = par.head.lerp(par.tail, t0); b.tail = par.head.lerp(par.tail, t1)
                b.roll = par.roll; b.parent = par; b.use_deform = True; made.append((b.name, par.name, (t0 + t1) / 2))
    bpy.ops.object.mode_set(mode='OBJECT')
    tri = lambda t, m: max(0.0, 1.0 - abs(t - m) / 0.33)
    for name, seg, m in made:
        body.vertex_groups.new(name=name)
    for name, seg, m in made:
        g, tg = body.vertex_groups[seg], body.vertex_groups[name]
        bone = arm.data.bones[seg]; a = arm.matrix_world @ bone.head_local; b = arm.matrix_world @ bone.tail_local; ab = b - a
        for v in body.data.vertices:
            w = next((x.weight for x in v.groups if x.group == g.index), None)  # g.weight() logs an error per unweighted vertex
            if w is None:
                continue
            t = max(0.0, min(1.0, (body.matrix_world @ v.co - a).dot(ab) / max(1e-9, ab.length_squared)))
            share = 0.5 * tri(t, m)
            if share > 0:
                tg.add([v.index], w * share, 'REPLACE'); g.add([v.index], w * (1 - share), 'REPLACE')
    return [n for n, *_ in made]


def bake_twist(arm, act):
    """Forearm twist bones take 1/3 and 2/3 of the hand's roll (no pinched wrists); upper-arm twist bones counter-rotate
    2/3 and 1/3 of the upper arm's own roll (no pinched shoulders). Roll = the swing-twist split about the bone's Y axis."""
    if (T + 'LeftForeArmTwist1') not in arm.pose.bones:
        return
    n = int(act.frame_range[1]); arm.animation_data.action = act
    def roll(q):
        axis_y = q.to_matrix() @ Vector((0, 1, 0))
        tw = Vector((0, 1, 0)).rotation_difference(axis_y).inverted() @ q
        return 2 * math.atan2(tw.y, tw.w)
    for side in ('Left', 'Right'):
        for seg, src_bone, fracs in (('ForeArm', 'Hand', (1 / 3, 2 / 3)), ('Arm', 'Arm', (-2 / 3, -1 / 3))):
            sb = arm.pose.bones[T + side + src_bone]; rolls = []
            for f in range(1, n + 1):
                bpy.context.scene.frame_set(f); rolls.append(roll(sb.rotation_quaternion))
            for k, frac in zip((1, 2), fracs):
                pb = arm.pose.bones[T + side + seg + 'Twist' + str(k)]; pb.rotation_mode = 'QUATERNION'
                path = f'pose.bones["{pb.name}"].rotation_quaternion'
                for c in range(4):
                    old = act.fcurves.find(path, index=c)  # the retargeter already keyed this bone (identity): replace it
                    if old:
                        act.fcurves.remove(old)
                    fc = act.fcurves.new(path, index=c, action_group=pb.name); fc.keyframe_points.add(n); flat = []
                    for i, r in enumerate(rolls):
                        flat += [i + 1, Quaternion((0, 1, 0), r * frac)[c]]
                    fc.keyframe_points.foreach_set('co', flat); fc.update()
