# Ultimate Football Game - Player Model Pipeline

This document describes the player model build pipeline for the Ultimate Football game.

## Overview

The game uses a 3D football player model with full animation support, morph targets, and realistic rigging.
The model supports various playing styles, team kits, and real-world player likenesses.

## Current Implementation

### Approach 1: Ronaldo-Based Player Model (Active)

The current implementation uses **Approach 1**: Generate MakeHuman base with full morphs, hair proxies, and kit UVs, then project Cristiano Ronaldo's athletic baseline proportions and facial structure onto it.

**Key Features:**
- Base model: MakeHuman CC0 character with full morph system
- Projection: Cristiano Ronaldo athletic proportions applied to base
- Hair: 9 CC0 MakeHuman hair styles (short01, short02, short03, short04, afro01, long01, ponytail01, braid01, bob01)
- Morph Targets: Weight, muscle, race (african/asian/caucasian), slim/heavy/muscular
- Animations: 2+ basic clips (idle, walk)
- Bone Structure: Mixamo-compatible with `mixamorig:` prefix

**Build Pipeline:**
1. `cr7_prepare.py` - Preprocesses Ronaldo GLB model
   - Renames bones to mixamorig: format  
   - Joins meshes into single `Body` object
   - Saves as `/tmp/cr7_ready.blend`

2. `build_player_mh.py` - Main build script (modified for Approach 1)
   - Creates MakeHuman base with MPFB2
   - Projects Ronaldo proportions (Approach 1)
   - Loads hair proxies and captures morph variants
   - Exports to `public/models/player.glb`

3. `build_ronaldo_player.py` - Simplified Ronaldo builder (alternative)
   - Direct Ronaldo model processing
   - Creates basic rig and animations
   - Quick build for testing

## Files

### Core Build Files

- `/home/julesamini30/ultimate-football/tools/blender/cr7_prepare.py` - Ronaldo model preprocessor
- `/home/julesamini30/ultimate-football/tools/blender/build_player_mh.py` - Main builder (Approach 1)
- `/home/julesamini30/ultimate-football/build_ronaldo_player.py` - Simplified Ronaldo builder
- `/home/julesamini30/ultimate-football/src/render3d/character.js` - Game character loader

### Assets

- `/home/julesamini30/ultimate-football/public/models/player.glb` - Built player model (1.5MB)
- `/home/julesamini30/ultimate-football/public/models/player.glb.bak` - Backup of original model
- `/home/julesamini30/ultimate-football/public/models/tex/` - Texture atlas and materials
- `/home/julesamini30/cristiano_ronaldo_3d_model.glb` - Original Ronaldo model source (12MB)

### Configuration

- MPFB2 (MakeHuman Plugin for Blender) v2.0.17
- Blender 4.3.0
- CC0 MakeHuman assets (skins, hair, targets)
- Three.js with GLTFLoader + MeshoptDecoder for rendering

## Build Commands

### Build with Approach 1 (MakeHuman + Ronaldo Projection)
```bash
blender -b --python tools/blender/build_player_mh.py -- --out public/models
```

### Build with Ronaldo Direct (Alternative)
```bash
blender -b --python build_ronaldo_player.py -- --out public/models
```

### Run Game Preview
```bash
npm run dev
# Game runs on http://localhost:2000
```

## Technical Details

### Bone Naming
All bones use Mixamo convention with `mixamorig:` prefix:
- `mixamorig:Hips`, `mixamorig:Spine`, `mixamorig:Head`
- `mixamorig:LeftUpLeg`, `mixamorig:RightUpLeg`
- `mixamorig:LeftFoot`, `mixamorig:RightFoot`

### Morph Targets
- **Weight**: Controls body mass (slim/heavy)
- **Muscle**: Controls muscle definition (light/muscular)
- **Race**: Ethnic features (african/asian/caucasian)
- **Age**: Youth to maturity

### Animation Clips
- `idle` - Standing pose with subtle breathing
- `walk` - Basic locomotion animation
- [Additional clips can be added from CMU BVH, Mixamo FBX, UAL GLB sources]

### UV Layout (Kit Atlas)
- Boots: 0-0.10
- Skin: 0.10-0.15  
- Socks: 0.15-0.25
- Shorts: 0.25-0.40
- Sleeves: 0.40-0.50
- Torso: 0.50-1.0

## Game Integration

The character model integrates with the game through:

1. **Three.js rendering** in `src/render3d/character.js`
2. **Animation mixing** for smooth transitions
3. **Skinning** using GLTF skinning primitives
4. **Texture atlas** for team kits and player gear

## Current Status

✅ **Complete**
- Ronaldo-based player model built successfully
- Basic animations working (idle, walk)
- Character loader integrated with Three.js
- Bone naming standardized to Mixamo format
- Model optimized for game runtime

The pipeline is ready for game integration and can be extended with more animations and player likenesses as needed.