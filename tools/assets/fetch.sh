#!/usr/bin/env bash
# Re-downloads the third-party character assets into tools/assets/_src (git-ignored).
# Licences: MakeHuman/MPFB2 core assets CC0; Quaternius UAL CC0; CMU mocap (cgspeed BVH) free incl. commercial use.
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p _src/cmu; cd _src
get() { [ -s "$1" ] || curl -fsSL -o "$1" "$2"; }
get mpfb-2.0.17.zip "https://extensions.blender.org/download/sha256:4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87/add-on-mpfb-v2.0.17.zip?repository=%2Fapi%2Fv1%2Fextensions%2F&blender_version_min=4.2.0"
get makehuman_system_assets_cc0.zip https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
get ual1.zip https://opengameart.org/sites/default/files/universal_animation_librarystandard.zip
get ual2.zip https://opengameart.org/sites/default/files/universal_animation_library_2standard.zip
CMU="23_03 79_69 80_43 85_01 141_06 83_61 87_03 143_36 56_02 49_02 141_22 141_28 18_10 104_12 60_01 141_12 22_05 22_06 79_71 79_74 82_10 17_01 22_03 09_02 09_03 09_04 09_05 09_07 09_08 09_09 09_10 09_11 78_06 78_12 102_05 102_10 35_17 35_18 16_55 141_01 143_01 104_37 139_10 140_06 140_07 77_02 141_20 82_08 10_01 10_02 10_03 10_04 10_05 10_06 11_01 02_03 16_35 16_36 16_08 16_57 16_41 16_42 16_43 16_44 83_19 83_68 78_24 78_26 78_27 02_04 13_11 85_15 16_51 16_52 16_53 16_54 127_13 127_14 136_25 136_26 76_11 111_01 09_01 09_06 07_01 08_03"
seq() { local s=$((10#$1)); for r in 001-009 010-014 015-019 020-029 030-034 035-039 040-045 046-056 060-075 076-080 081-085 086-094 102-111 113-128 131-135 136-140 141-144; do
  local a=$((10#${r%-*})) b=$((10#${r#*-})); if [ $s -ge $a ] && [ $s -le $b ]; then echo "Sequence-$r"; return; fi; done; }
for c in $CMU; do s=${c%_*}; [ -s cmu/$c.bvh ] && continue
  # the mirror's folder keeps the leading zero (09, not 9)
  get cmu/$c.zip "https://raw.githubusercontent.com/Shriinivas/cmubvh/main/$(seq $s)/$s/Data/$c.zip" || { echo "missing $c"; continue; }
  python3 -c "import zipfile,sys;z=zipfile.ZipFile('cmu/$c.zip');[open('cmu/$c.bvh','wb').write(z.read(n)) for n in z.namelist() if n.endswith('.bvh')]" && rm cmu/$c.zip
done
sha256sum mpfb-2.0.17.zip makehuman_system_assets_cc0.zip ual1.zip ual2.zip > SHA256SUMS
echo done
