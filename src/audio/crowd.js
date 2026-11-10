// Generated stadium atmosphere: looping crowd murmur that follows match excitement,
// goal roar, referee whistle. No samples required; everything is synthesised in Web Audio.
export const crowdAudio = {
  ctx: null, master: null, bed: null, bedGain: null, filter: null, ready: false, level: 0,
  start(ctx) {
    if (this.ready) return; try {
      const ac = ctx || new AudioContext(); this.ctx = ac;
      this.master = ac.createGain(); this.master.gain.value = 0; this.master.connect(ac.destination);
      // brown-ish noise bed, 4 s loop
      const n = ac.sampleRate * 4, buf = ac.createBuffer(2, n, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } }
      this.bed = ac.createBufferSource(); this.bed.buffer = buf; this.bed.loop = true;
      this.filter = ac.createBiquadFilter(); this.filter.type = 'bandpass'; this.filter.frequency.value = 600; this.filter.Q.value = 0.6;
      this.bedGain = ac.createGain(); this.bedGain.gain.value = 0.6;
      this.bed.connect(this.filter); this.filter.connect(this.bedGain); this.bedGain.connect(this.master); this.bed.start();
      this.ready = true;
    } catch (e) { /* audio unavailable (headless / autoplay policy) */ }
  },
  /** excite 0..1, vol 0..1 */
  update(excite, vol, muted, dt = 0.016) {
    if (!this.ready) return; const target = muted ? 0 : vol * (0.08 + excite * 0.3);
    this.level += (target - this.level) * Math.min(1, dt * 2); this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.1);
    this.filter.frequency.setTargetAtTime(500 + excite * 900, this.ctx.currentTime, 0.3);
  },
  roar(vol = 1) {
    if (!this.ready) return; const ac = this.ctx, t = ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.6); f.frequency.exponentialRampToValueAtTime(700, t + 3.5); f.Q.value = 0.8;
    const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.9 * vol, t + 0.35); g.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t, Math.random() * 2); src.stop(t + 4.6);
  },
  // shaped crowd reactions from the same noise bed: rising "ooh", falling groan, short cheer
  swell(f0, f1, dur, peak, vol = 1) {
    if (!this.ready) return; const ac = this.ctx, t = ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
    const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(peak * vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t, Math.random() * 2); src.stop(t + dur + 0.1);
  },
  ooh(vol = 1) { this.swell(450, 1100, 1.4, 0.55, vol); },
  groan(vol = 1) { this.swell(900, 320, 1.8, 0.5, vol); },
  cheer(vol = 1) { this.swell(600, 1400, 1.1, 0.4, vol); },
  /** Club chant generated from the name: the home end claps a rhythm and sings one note per syllable
   *  (a few detuned saws through a low-pass read as a crowd "oh"), falling on the last syllable. */
  chant(syl = 3, vol = 1, dur = 8) {
    if (!this.ready) return; const ac = this.ctx, t0 = ac.currentTime + 0.05, beat = 60 / 124; syl = Math.max(2, Math.min(5, syl | 0));
    const out = ac.createGain(); out.gain.setValueAtTime(0.001, t0); out.gain.exponentialRampToValueAtTime(0.45 * vol, t0 + 1.2); out.gain.setValueAtTime(0.45 * vol, t0 + dur - 1.5); out.gain.exponentialRampToValueAtTime(0.001, t0 + dur); out.connect(ac.destination);
    const clap = t => { const s = ac.createBufferSource(); s.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9; const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.8, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 3); s.stop(t + 0.16); };
    const sing = (t, len, f0) => { const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.07); g.gain.setValueAtTime(0.1, t + len - 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + len); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 2.2; lp.connect(g); g.connect(out); for (let k = 0; k < 6; k++) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0 * (1 + (k - 2.5) * 0.007); o.connect(lp); o.start(t); o.stop(t + len + 0.05); } };
    const notes = [196, 220, 247, 220, 196], bars = Math.floor(dur / (beat * 4));
    for (let b = 0; b < bars; b++) { const T = t0 + b * beat * 4, step = beat * 4 / Math.max(syl + 1, 4); for (let i = 0; i < syl; i++) { const t = T + i * step; clap(t); sing(t, step * 0.9, notes[i % notes.length] * (i === syl - 1 ? 0.84 : 1)); } clap(T + beat * 3.5); if (syl < 4) clap(T + beat * 3); }
  },
  /** Referee whistle: 'short' (foul, kick-off), 'double' (offside, goal kick), 'long' (half time), 'triple' (full time). A boolean keeps the old call (true = long). */
  whistle(kind = 'short', vol = 0.5) {
    if (!this.ready) return; if (kind === true) kind = 'long'; if (kind === false) kind = 'short';
    const blasts = kind === 'triple' ? [[0, 0.35], [0.45, 0.35], [0.9, 1.0]] : kind === 'double' ? [[0, 0.3], [0.4, 0.3]] : kind === 'long' ? [[0, 1.1]] : [[0, 0.45]];
    for (const [off, d] of blasts) this._blast(this.ctx.currentTime + off, d, vol);
  },
  _blast(t, d, vol) {
    const ac = this.ctx, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = 2900; o2.type = 'square'; o2.frequency.value = 2960; // beating pea-whistle
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.25 * vol, t + 0.03); g.gain.setValueAtTime(0.25 * vol, t + d - 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
    o.connect(g); o2.connect(g); g.connect(lp); lp.connect(ac.destination); o.start(t); o2.start(t); o.stop(t + d); o2.stop(t + d);
  },
  // ---- Phase 20: ball contact, net, anticipation, applause, and the event → sound map with cooldowns ----
  /** Ball contact: a low thump whose pitch, length and click scale with the kick strength (0..1); headers and throws are softer. */
  kick(strength = 0.5, kind = 'pass', vol = 1) {
    if (!this.ready) return; const ac = this.ctx, t = ac.currentTime, k = Math.max(0, Math.min(1, strength)), soft = kind === 'header' || kind === 'throw_in' ? 0.45 : 1;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(70 + k * 60, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.08 + k * 0.08);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime((0.25 + k * 0.55) * soft * vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09 + k * 0.12);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.3);
    const n = ac.createBufferSource(); n.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + k * 1800; f.Q.value = 0.7;
    const ng = ac.createGain(); ng.gain.setValueAtTime(0.001, t); ng.gain.exponentialRampToValueAtTime((0.05 + k * 0.25) * soft * vol, t + 0.004); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + k * 0.03);
    n.connect(f); f.connect(ng); ng.connect(ac.destination); n.start(t, Math.random() * 2); n.stop(t + 0.1);
  },
  /** Net ripple when the ball hits the goal net: a sweeping noise swish and a soft thud. */
  ripple(vol = 1) {
    if (!this.ready) return; const ac = this.ctx, t = ac.currentTime;
    const n = ac.createBufferSource(); n.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    n.connect(f); f.connect(g); g.connect(ac.destination); n.start(t, Math.random() * 2); n.stop(t + 0.6);
    const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = 90; og.gain.setValueAtTime(0.001, t); og.gain.exponentialRampToValueAtTime(0.3 * vol, t + 0.01); og.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(og); og.connect(ac.destination); o.start(t); o.stop(t + 0.3);
  },
  anticipate(vol = 1) { this.swell(380, 950, 1.7, 0.38, vol); },
  /** Applause: a burst of clap-like noise hits. */
  applause(vol = 1, dur = 1.6) {
    if (!this.ready) return; const ac = this.ctx, t0 = ac.currentTime, n = Math.round(dur * 14);
    for (let i = 0; i < n; i++) { const t = t0 + Math.random() * dur, s = ac.createBufferSource(); s.buffer = this.bed.buffer; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 1500; f.Q.value = 1.1;
      const g = ac.createGain(); const env = Math.sin(Math.PI * (t - t0) / dur); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.12 * vol * (0.4 + env), t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t, Math.random() * 2); s.stop(t + 0.08); }
  },
  _cool: {},
  /** One place that says which crowd / referee sounds an event triggers (beyond the direct roar, ooh and groan calls in the match). cooldowns in seconds. */
  EVENTS: {
    kickoff: [['whistle', 'short', 0]], restart: [['whistle', 'short', 2]], offside: [['whistle', 'double', 2]], goalkick: [['whistle', 'double', 6]], penalty: [['whistle', 'short', 1], ['ooh', 0.9, 1]],
    corner: [['cheer', 0.3, 5]], half: [['whistle', 'long', 1]], full: [['whistle', 'triple', 1]], yellow: [['whistle', 'short', 1], ['groan', 0.5, 1]], red: [['whistle', 'long', 1], ['roar', 0.35, 1]],
    goal: [['ripple', 1, 1]], header_goal: [['ripple', 1, 1]], long_goal: [['ripple', 1, 1]], equaliser: [['ripple', 1, 1]], late_winner: [['ripple', 1, 1]],
    save: [['applause', 0.8, 3]], skill: [['applause', 0.45, 4]], tackle: [['cheer', 0.25, 4]], through: [['anticipate', 0.5, 6]], cross: [['anticipate', 0.6, 5]], box: [['anticipate', 0.8, 8]], shot_on: [['anticipate', 0.5, 3]],
  },
  /** Trigger the sounds mapped to a match event. ctx.home scales goal reactions; dry = return the cues instead of playing them. */
  play(type, ctx = {}, dry = false) {
    const cues = this.EVENTS[type] || [], out = [], now = this.ready ? this.ctx.currentTime : (performance.now() / 1000);
    for (const [fn, arg, cool] of cues) {
      const key = type + ':' + fn; if (cool && now - (this._cool[key] ?? -1e9) < cool) { out.push(fn + ':cooldown'); continue; }
      this._cool[key] = now; out.push(fn + ':' + arg);
      if (!dry && this.ready) { const v = typeof arg === 'number' ? arg * (ctx.home === false && fn !== 'whistle' ? 0.6 : 1) : arg; try { this[fn](v); } catch (e) {} }
    }
    return out;
  },
};
