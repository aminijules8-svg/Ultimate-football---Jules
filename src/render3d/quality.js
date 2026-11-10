// Phase 7: graphics presets + AUTO REALISTIC — picks a starting preset from the hardware and then
// scales individual knobs up/down from the measured frame rate, one knob at a time, never abruptly.
export const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'AUTO'];
export const AUTO = 4;

// knob values per preset (index 0..3)
export const PRESETS = [
  { name: 'LOW', ao: false, shadow: 0, blades: 0, crowd: 0.25, seats: 0.25, scale: 0.8, lod: 30, animRate: 2, rain: 600, aa: false },
  { name: 'MEDIUM', ao: false, shadow: 1024, blades: 2500, crowd: 0.5, seats: 0.5, scale: 1, lod: 45, animRate: 1, rain: 1200, aa: true },
  { name: 'HIGH', ao: true, shadow: 2048, blades: 6000, crowd: 1, seats: 1, scale: 1, lod: 60, animRate: 1, rain: 1800, aa: true },
  { name: 'ULTRA', ao: true, shadow: 4096, blades: 12000, crowd: 1, seats: 1, scale: 1.25, lod: 90, animRate: 1, rain: 2600, aa: true },
];
// AUTO ladder: ordered from "cheapest to give up" to "last resort". Each entry is a knob with its ordered values (best → worst).
const LADDER = [
  ['ao', [true, false]],
  ['shadow', [4096, 2048, 1024, 512]],
  ['blades', [12000, 6000, 2500, 0]],
  ['lod', [90, 60, 45, 30]],
  ['animRate', [1, 2]],
  ['scale', [1.25, 1, 0.85, 0.7]],
];

/** Heuristic starting preset from GPU string / cores / memory. */
export function probeHardware(renderer) {
  let gpu = '';
  try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { /* ignore */ }
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4, px = screen.width * screen.height * (devicePixelRatio || 1);
  const soft = /swiftshader|llvmpipe|softpipe|basic render/i.test(gpu), virt = /virgl|virtio|vmware|svga|parallels/i.test(gpu), lowEnd = /intel.*(hd|uhd) ?[4-6]\d\d|mali-[gt]\d|adreno [45]|powervr/i.test(gpu);
  let level = 2; // HIGH
  if (soft) level = 0; else if (virt || lowEnd || cores <= 4 || mem <= 4) level = 1; else if (/rtx|radeon rx|arc a|apple m/i.test(gpu) && px <= 3840 * 2160) level = 3;
  return { gpu, cores, mem, level };
}

/**
 * createQuality(renderer, hooks): hooks apply knob changes to the scene:
 *  { setAO(bool), setShadow(size), setBlades(n), setScale(s), setLod(d), setAnimRate(r) }
 */
export function createQuality(renderer, hooks, saved = {}) {
  const probe = probeHardware(renderer);
  const q = {
    level: saved.level ?? AUTO, probe, knobs: { ...PRESETS[saved.level != null && saved.level < AUTO ? saved.level : probe.level] }, pending: {},
    fps: 60, fpsLow: 0, fpsHigh: 0, lastChange: 0, t: 0, log: [],
    history: [], // {t, knob, value}
    apply(all) {
      const k = this.knobs; hooks.setAO && hooks.setAO(k.ao); hooks.setShadow && hooks.setShadow(k.shadow); hooks.setBlades && hooks.setBlades(k.blades); hooks.setScale && hooks.setScale(k.scale); hooks.setLod && hooks.setLod(k.lod); hooks.setAnimRate && hooks.setAnimRate(k.animRate);
      if (all && hooks.setCrowd) hooks.setCrowd(k.crowd, k.seats);
    },
    setLevel(l) { this.level = l; if (l < AUTO) this.knobs = { ...PRESETS[l] }; else this.knobs = { ...PRESETS[probe.level] }; this.apply(true); },
    /** call once per rendered frame while a match is on screen */
    tick(dt) {
      if (this.level !== AUTO || dt <= 0) return;
      this.t += dt; const f = 1 / dt; this.fps += (f - this.fps) * Math.min(1, dt * 2);
      if (this.fps < 55) { this.fpsLow += dt; this.fpsHigh = 0; } else if (this.fps > 70) { this.fpsHigh += dt; this.fpsLow = 0; } else { this.fpsLow = Math.max(0, this.fpsLow - dt); this.fpsHigh = Math.max(0, this.fpsHigh - dt); }
      if (this.t - this.lastChange < 3) return;
      if (this.fpsLow > 3) { if (this.step(-1)) { this.lastChange = this.t; this.fpsLow = 0; } }
      else if (this.fpsHigh > 20) { if (this.step(+1)) { this.lastChange = this.t; this.fpsHigh = 0; } }
    },
    /** move one knob one notch; dir -1 = cheaper. Returns true if something changed. */
    step(dir) {
      const order = dir < 0 ? LADDER : [...LADDER].reverse();
      for (const [knob, values] of order) {
        const cur = this.knobs[knob], i = values.indexOf(cur); if (i < 0) continue;
        const ni = dir < 0 ? i + 1 : i - 1; if (ni < 0 || ni >= values.length) continue;
        // do not climb above the probed preset's best values when stepping up
        if (dir > 0 && values.indexOf(PRESETS[Math.min(3, probe.level + 1)][knob]) > ni) continue;
        this.knobs[knob] = values[ni]; this.apply(false); this.history.push({ t: Math.round(this.t), knob, value: values[ni], fps: Math.round(this.fps) }); if (this.history.length > 40) this.history.shift();
        return true;
      }
      return false;
    },
    describe() { const k = this.knobs; return `${LEVELS[this.level]}${this.level === AUTO ? ' (' + PRESETS[probe.level].name + ' base)' : ''} · AO ${k.ao ? 'on' : 'off'} · shadows ${k.shadow} · grass ${k.blades} · crowd ${Math.round(k.crowd * 100)}% · scale ${k.scale} · LOD ${k.lod} m · ${Math.round(this.fps)} fps`; },
  };
  return q;
}
