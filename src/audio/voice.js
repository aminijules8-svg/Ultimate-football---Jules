// Spoken commentary and stadium announcer through the browser's own voices (Web Speech API: free, no
// audio files). One line at a time: a goal or card line interrupts, ordinary lines are dropped while
// another is still being read, so the commentator never talks over himself.
export const voice = {
  on: true, vol: 1, ready: false, v: null, pa: null,
  init() {
    if (this.ready || typeof speechSynthesis === 'undefined') return; this.ready = true;
    const pick = () => {
      const vs = speechSynthesis.getVoices(); if (!vs.length) return;
      const en = vs.filter(v => /^en/i.test(v.lang));
      this.v = en.find(v => /Google UK English Male|Daniel|George|Ryan|Arthur/i.test(v.name)) || en.find(v => /GB/i.test(v.lang)) || en[0] || vs[0];
      this.pa = en.find(v => v !== this.v && /Female|Zira|Hazel|Sonia|Libby/i.test(v.name)) || en.find(v => v !== this.v) || this.v;
    };
    pick(); try { speechSynthesis.onvoiceschanged = pick; } catch (e) {}
  },
  /** prio 0 ordinary (dropped when busy), 1 waits its turn, 2 interrupts. pa = announcer voice. */
  say(text, { prio = 0, rate = 1.08, pitch = 1, pa = false } = {}) {
    if (!this.on || !text || typeof speechSynthesis === 'undefined') return; this.init();
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) { if (prio === 0) return; if (prio === 2) speechSynthesis.cancel(); }
      const u = new SpeechSynthesisUtterance(text); const vc = pa ? this.pa : this.v; if (vc) { u.voice = vc; u.lang = vc.lang; } else u.lang = 'en-GB';
      u.rate = rate; u.pitch = pitch; u.volume = Math.max(0, Math.min(1, this.vol)); speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable */ }
  },
  stop() { try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch (e) {} },
};
