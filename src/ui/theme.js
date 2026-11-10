// Menu theme, layered on top of the base overlay styles (injected after them, same selectors, so these win).
// Idea: the menus are physical things standing in a floodlit stadium at night. Panels and buttons are slabs
// with a visible edge, pickable tiles tilt toward the pointer, headlines are extruded like stadium lettering,
// and the accent is the club's own colour (`--acc`, set per screen) against night ink and floodlight white.
export const THEME_CSS = `
#uf-overlay{--ink:#08121c;--ink2:#0f1e2e;--ink3:#16283b;--turf:#1f6b33;--chalk:#f4f7f2;--flood:#fff1c9;--red:#e5484d;--mute:#9fb0c2;--acc:var(--flood);
 --edge:#03080e;--slab:linear-gradient(180deg,rgba(26,44,64,.9),rgba(12,24,38,.92));--lift:0 1px 0 rgba(255,255,255,.07) inset,0 5px 0 -1px var(--edge),0 16px 30px -12px rgba(0,0,0,.75);
 font-family:Barlow,system-ui,sans-serif}
#uf-overlay.menu{background:var(--ink)}
#uf-overlay input[type=range]{accent-color:var(--flood)}
#uf-overlay input[type=checkbox]{accent-color:var(--flood)}
.mm{color:var(--chalk)}
.mm :focus-visible{outline:3px solid var(--flood);outline-offset:3px}

/* ---- extruded display type: stacked offsets give the letters a body, a long soft shadow sets them on the floor */
.mm-logo,.qm-head h1{color:var(--chalk);text-shadow:1px 1px 0 #c7d0cc,2px 2px 0 #a9b4b0,3px 3px 0 #8d9995,4px 4px 0 #6f7c78,5px 5px 0 #56625e,6px 6px 0 #3d4845,8px 10px 14px rgba(0,0,0,.55)}
.mm-logo{font-size:clamp(44px,8.2vh,100px);line-height:.82;transform:perspective(900px) rotateY(9deg) rotateX(4deg);transform-origin:left center}
.mm-logo span+span{padding-left:.42em;color:var(--chalk);-webkit-text-stroke:0}
.qm-head h1{font-size:clamp(34px,5.6vh,52px);text-shadow:1px 1px 0 #b9c3bf,2px 2px 0 #8d9995,3px 3px 0 #5f6b67,4px 5px 8px rgba(0,0,0,.5)}

/* ---- main menu: live stage behind, mode list on angled slabs */
.mm.has-stage{background:var(--ink)}
.mm-stage{position:absolute;inset:0;z-index:0}
.mm-scene-canvas{width:100%;height:100%;display:block}
.mm.has-stage::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(8,18,28,.92) 0,rgba(8,18,28,.72) 30%,rgba(8,18,28,.05) 58%,transparent 70%),linear-gradient(0deg,rgba(8,18,28,.85) 0,transparent 22%)}
.mm.has-stage .mm-grid{z-index:2}
.mm.has-stage .mm-kit{visibility:hidden}
.mm-modes{perspective:1100px;justify-content:center}
.mm-deck{display:flex;flex-direction:column;gap:7px;transform:rotateY(16deg) rotateX(3deg);transform-origin:left center;transform-style:preserve-3d;max-width:440px}
.mm-mode{position:relative;background:var(--slab);border:1px solid rgba(255,255,255,.06);border-top-color:rgba(255,255,255,.14);border-left:5px solid color-mix(in srgb,var(--acc) 55%,transparent);border-radius:10px;padding:6px 16px 7px 16px;box-shadow:var(--lift);
 transform:translateZ(0);transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s,border-color .16s}
.mm-mode b{font-size:clamp(20px,3.1vh,32px);font-weight:700;text-transform:none;letter-spacing:0;color:var(--chalk)}
.mm-mode small{font:400 12.5px/1.25 Barlow,system-ui,sans-serif;color:var(--mute)}
.mm-mode:first-child b{color:var(--chalk)}
.mm-mode:hover,.mm-mode:focus-visible{transform:translateZ(34px) translateX(6px);border-left-color:var(--acc);box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 7px 0 -1px var(--edge),0 26px 40px -10px rgba(0,0,0,.8),-8px 0 26px -8px color-mix(in srgb,var(--acc) 60%,transparent);outline:0}
.mm-mode:focus-visible{box-shadow:0 0 0 3px var(--flood),0 7px 0 -1px var(--edge),0 26px 40px -10px rgba(0,0,0,.8)}
.mm-mode:active{transform:translateZ(16px) translateY(3px);box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 2px 0 -1px var(--edge),0 10px 20px -10px rgba(0,0,0,.8)}
.mm-links{padding-left:4px;gap:10px;margin-top:1.4vh;flex-wrap:wrap}
.mm-link{border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:6px 12px;font-size:18px;background:rgba(8,18,28,.55);color:var(--chalk);box-shadow:0 3px 0 -1px var(--edge)}
.mm-link:hover,.mm-link:focus-visible{border-color:var(--acc);color:var(--chalk);transform:translateY(-1px)}
.mm-id{background:var(--slab);border:1px solid rgba(255,255,255,.07);border-top-color:rgba(255,255,255,.15);border-radius:12px;box-shadow:var(--lift)}
.mm.has-stage .mm-club{grid-row:1/2;grid-template-rows:auto;align-items:start;justify-items:end}
.mm.has-stage .mm-kit{display:none}
.mm-id h2{font-weight:700}
.mm-id p{font-family:Barlow,system-ui,sans-serif;color:var(--mute)}
.mm-arrow,.mm-step button{background:var(--ink3);border:1px solid rgba(255,255,255,.16);box-shadow:0 3px 0 -1px var(--edge);color:var(--chalk)}
.mm-arrow:hover,.mm-step button:hover{background:var(--chalk);color:var(--ink);border-color:var(--chalk)}
.mm-arrow:active,.mm-step button:active{transform:translateY(2px);box-shadow:0 1px 0 -1px var(--edge)}
.mm-foot,.mm-step{font-family:Barlow,system-ui,sans-serif;color:var(--mute)}

/* ---- quick match: the two kits stand on the floor, angled toward each other */
.qm-match{perspective:1200px}
.qm-kit{transition:transform .2s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 24px 18px rgba(0,0,0,.55))}
.qm-side:first-child .qm-kit{transform:perspective(800px) rotateY(32deg) rotateZ(-2deg)}
.qm-side:last-child .qm-kit{transform:perspective(800px) rotateY(-32deg) rotateZ(2deg)}
.qm-side:first-child .qm-kit:hover{transform:perspective(900px) rotateY(10deg) rotateZ(-1deg) translateY(-4px)}
.qm-side:last-child .qm-kit:hover{transform:perspective(900px) rotateY(-10deg) rotateZ(1deg) translateY(-4px)}
.qm-side .qm-kit::after{content:''}
.qm-side{position:relative}
.qm-v{color:transparent;-webkit-text-stroke:2px rgba(244,247,242,.5);text-shadow:none;font-size:72px}
.qm-go,.scr-btn.go{background:var(--chalk);color:var(--ink) !important;border:0;border-radius:12px;box-shadow:0 1px 0 #fff inset,0 6px 0 #9aa7a2,0 18px 26px -8px rgba(0,0,0,.65);transition:transform .08s,box-shadow .08s;font-style:normal;font-weight:800;text-transform:none;letter-spacing:.01em}
.qm-go:hover,.scr-btn.go:hover,.scr-btn.go:focus-visible{background:var(--flood);color:var(--ink) !important;box-shadow:0 1px 0 #fff inset,0 6px 0 #b8a97f,0 22px 30px -8px rgba(0,0,0,.7),0 0 0 3px color-mix(in srgb,var(--acc) 70%,transparent)}
.qm-go:active,.scr-btn.go:active{transform:translateY(5px);box-shadow:0 1px 0 #fff inset,0 1px 0 #9aa7a2,0 8px 14px -8px rgba(0,0,0,.6)}
.qm-back{border-color:rgba(255,255,255,.2);background:var(--ink3);box-shadow:0 3px 0 -1px var(--edge)}
.qm-back:hover{background:var(--chalk);color:var(--ink)}
.qm-change,.qm-pick select,.qm-head select,.qm-foot>select,.st-row select,.st-mid>select,.st-players select{background:var(--ink2);border-color:rgba(255,255,255,.16);box-shadow:0 3px 0 -1px var(--edge);font-family:Barlow,system-ui,sans-serif}
.qm-side>small,.qm-league,.st-row,.st-venue{font-family:Barlow,system-ui,sans-serif;color:var(--mute)}

/* ---- every other screen: a pitch floor receding under slab panels */
.mm.scr::before{content:'';position:absolute;left:-30%;right:-30%;bottom:-8%;height:58%;z-index:0;pointer-events:none;
 background:repeating-linear-gradient(90deg,rgba(47,140,60,.16) 0 6%,rgba(31,107,51,.10) 6% 12%),linear-gradient(0deg,rgba(31,107,51,.25),transparent);
 transform:perspective(520px) rotateX(64deg);transform-origin:bottom center;-webkit-mask-image:linear-gradient(0deg,#000 10%,transparent 92%);mask-image:linear-gradient(0deg,#000 10%,transparent 92%)}
.mm.scr .scr-grid{z-index:1}
.scr-panel,.uf-panel{background:var(--slab);border:1px solid rgba(255,255,255,.07);border-top-color:rgba(255,255,255,.15);border-radius:12px;box-shadow:var(--lift)}
.scr-panel h3,.home .uf-panel h2{font-weight:700;color:var(--chalk)}
.scr-panel p,.scr-note,.scr-row,.scr-table,.uf-muted{font-family:Barlow,system-ui,sans-serif}
.scr-panel p,.scr-note{color:var(--mute)}
.scr-btn,.home .uf-btn{background:var(--ink3);border:1px solid rgba(255,255,255,.14);border-top-color:rgba(255,255,255,.2);border-radius:10px;box-shadow:0 4px 0 -1px var(--edge),0 10px 18px -12px rgba(0,0,0,.7);color:var(--chalk);transition:transform .08s,box-shadow .08s,background .12s}
.scr-btn:hover,.scr-btn:focus-visible,.home .uf-btn:hover{background:#21384f;border-color:var(--acc);color:var(--chalk);outline:0}
.scr-btn:active,.home .uf-btn:active{transform:translateY(3px);box-shadow:0 1px 0 -1px var(--edge)}
.scr-btn.sel{border-color:var(--acc);box-shadow:inset 3px 0 0 var(--acc),0 4px 0 -1px var(--edge)}
.scr-btn.danger{color:#ffb4b6;border-color:rgba(229,72,77,.45)}.scr-btn.danger:hover{background:var(--red);color:#fff;border-color:var(--red)}
.scr-btn[disabled]{opacity:.45;box-shadow:none;cursor:not-allowed}
.scr-row select,.scr-row input[type=text],.scr-in,#uf-overlay select{background:var(--ink2);border:1px solid rgba(255,255,255,.16);box-shadow:0 2px 0 -1px var(--edge) inset;border-radius:8px;color:var(--chalk);font-family:Barlow,system-ui,sans-serif}
.scr-tab{color:var(--mute)}
.scr-tab.on{color:var(--chalk);border-bottom-color:var(--acc)}
.scr-table tr.me td{color:var(--chalk);background:color-mix(in srgb,var(--acc) 22%,transparent)}
.scr-modal{background:rgba(3,8,14,.7);perspective:900px}
.scr-modal>div{background:var(--slab);border-color:rgba(255,255,255,.14);box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 7px 0 -1px var(--edge),0 40px 70px -20px rgba(0,0,0,.85);animation:uf-drop .22s cubic-bezier(.2,.8,.2,1)}
@keyframes uf-drop{from{transform:rotateX(14deg) translateY(-18px);opacity:0}to{transform:none;opacity:1}}

/* ---- pickable tiles and cards: slabs that lean toward the pointer (--rx / --ry set by the tilt handler) */
.club-tile,.lg-card,.scr-card,.boot-card,.preset-card,.lobby-team{background:var(--slab);border:1px solid rgba(255,255,255,.08);border-top-color:rgba(255,255,255,.16);box-shadow:var(--lift);
 transform:perspective(700px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateZ(0);transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .18s,border-color .15s;will-change:transform}
.club-tile{border-left:4px solid var(--c)}
.scr-card{border-left:4px solid var(--c,var(--acc))}
.club-tile.tilting,.lg-card.tilting,.scr-card.tilting,.boot-card.tilting,.preset-card.tilting{transition:transform .05s linear,box-shadow .18s}
.club-tile:hover,.club-tile:focus-visible,.lg-card:hover,.lg-card:focus-visible,.scr-card:hover,.scr-card:focus-visible{background:linear-gradient(180deg,rgba(36,58,82,.95),rgba(16,30,46,.95));border-color:var(--acc);box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 7px 0 -1px var(--edge),0 22px 34px -12px rgba(0,0,0,.85);outline:0}
.club-tile.sel,.boot-card.on,.scr-card.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc),0 5px 0 -1px var(--edge),0 16px 30px -12px rgba(0,0,0,.75)}
.club-tile b,.lg-card b,.scr-card b{color:var(--chalk)}
.club-tile small{color:var(--flood)}
.lg-card small,.scr-card small,.club-tile small{font-family:Barlow,system-ui,sans-serif}
.club-tile .ct-crest,.lg-logo{filter:drop-shadow(0 4px 4px rgba(0,0,0,.45));transform:translateZ(18px)}

/* 3D previews (player, stadium) sit in a recessed bay */
.ed3d{background:radial-gradient(80% 70% at 50% 35%,rgba(120,150,190,.18),rgba(8,18,28,.9));border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 10px 30px rgba(0,0,0,.6),inset 0 -2px 0 rgba(255,255,255,.04),0 5px 0 -1px var(--edge)}
.ed3d-views button{background:var(--ink2);box-shadow:0 3px 0 -1px var(--edge)}
.ed3d-views button.on{background:var(--chalk);color:var(--ink);border-color:var(--chalk)}

@media (prefers-reduced-motion:reduce){
 .mm-logo,.mm-deck{transform:none}
 .mm-mode,.club-tile,.lg-card,.scr-card,.boot-card,.preset-card,.qm-kit,.qm-go,.scr-btn{transition:none}
 .mm-mode:hover,.mm-mode:focus-visible{transform:none}
 .scr-modal>div{animation:none}
}
@media (max-width:820px){.mm-deck{transform:none;max-width:none}.mm-logo{transform:none}.mm.has-stage .mm-club{grid-row:auto;justify-items:stretch;min-height:auto}.mm-modes{justify-content:flex-start;min-height:auto}.mm.has-stage .mm-grid{gap:14px}.mm.has-stage .mm-grid{grid-template-rows:auto auto auto auto}.mm.has-stage::after{background:linear-gradient(0deg,rgba(8,18,28,.94) 0,rgba(8,18,28,.6) 55%,rgba(8,18,28,.2) 100%)}}
`;

/** Pointer tilt for pickable tiles: one delegated listener on the overlay root. */
const TILT = '.club-tile,.lg-card,.scr-card,.boot-card,.preset-card';
export function installTilt(root) {
  if (root.__tilt) return; root.__tilt = true;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  let cur = null;
  const reset = el => { if (!el) return; el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.classList.remove('tilting'); };
  root.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest && e.target.closest(TILT);
    if (el !== cur) { reset(cur); cur = el; }
    if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.classList.add('tilting'); el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
  }, { passive: true });
  root.addEventListener('pointerleave', () => { reset(cur); cur = null; });
}

/** A readable accent from a club's two colours: the first that stands out on night ink, else floodlight white. */
export function accentOf(c1, c2) {
  const lum = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 0; const n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const sat = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 0; const n = parseInt(m[1], 16), v = [n >> 16 & 255, n >> 8 & 255, n & 255]; return (Math.max(...v) - Math.min(...v)) / 255; };
  for (const c of [c1, c2]) if (c && lum(c) > 0.32 && (sat(c) > 0.25 || lum(c) > 0.8)) return c;
  return '#fff1c9';
}
