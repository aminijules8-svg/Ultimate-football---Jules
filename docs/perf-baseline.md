# Graphics presets and AUTO REALISTIC

`src/render3d/quality.js` owns the presets and the automatic scaler. Settings → Graphics (or the pause menu) cycles **LOW / MEDIUM / HIGH / ULTRA / AUTO**; changes apply live. New installs default to **AUTO**.

| knob | LOW | MEDIUM | HIGH | ULTRA | what it costs |
|---|---|---|---|---|---|
| ambient occlusion (GTAO) | off | off | on | on | one extra full-screen pass + blur |
| shadow map | off | 1024² | 2048² | 4096² | shadow pass size |
| grass blade cards near the ball | 0 | 2 500 | 6 000 | 12 000 | instanced geometry |
| crowd impostors / seats | 25 % | 50 % | 100 % | 100 % | instance counts (rebuilt at kick-off) |
| render scale | 0.8 | 1.0 | 1.0 | 1.25 | pixels shaded |
| player LOD distance | 30 m | 45 m | 60 m | 90 m | full-detail skinned bodies |
| far-player animation rate | every 2nd frame | every frame | every frame | every frame | skeleton updates |
| rain particles | 600 | 1 200 | 1 800 | 2 600 | points |

## How AUTO decides

1. **Probe** (`probeHardware`): reads the WebGL renderer string, CPU cores, `deviceMemory` and screen size. Software renderers (SwiftShader, llvmpipe) start at LOW; virtual GPUs (virgl, VMware), low-end integrated chips, ≤4 cores or ≤4 GB start at MEDIUM; discrete/Apple-silicon GPUs start at ULTRA; everything else HIGH. No benchmark pause at start-up.
2. **Live scaling** (`tick`, only while a match is on screen): a smoothed fps estimate. Below 55 fps for 3 s → step one knob down; above 70 fps for 20 s → step one knob up (never above the probed base + one tier). At most one change every 3 s, so quality never visibly jumps. The ladder, cheapest sacrifice first: AO → shadow size → grass → LOD distance → animation rate → render scale.
3. The current knobs and fps are shown in the pause menu under Graphics (`quality.describe()`), and `window.__UF.quality.history` keeps the last 40 changes for debugging.

## Verifying on the owner's machine (ChromeOS Crostini, virgl, 6 GB)

Headless captures run on SwiftShader, so fps there means nothing. On the real VM:

1. `npm run dev`, open the game, play a quick match in 3D, press **P**: the Graphics line should read `AUTO (MEDIUM base) …` and settle within ~30 s.
2. If it keeps stepping down to `shadows 512 · grass 0 · scale 0.7`, the baseline for this GPU is LOW: set Graphics to LOW explicitly (saves a probe each start) and note it here.
3. Record the settled line below.

| date | machine | settled knobs | fps |
|---|---|---|---|
| (pending) | Crostini VM, virgl (Intel ADL GT2), 8 cores, 6 GB | | |
