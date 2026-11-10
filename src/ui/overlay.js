// Phase 4: HTML overlays on top of the canvas game — pause menu (Team Management, Game Settings,
// Game Controls) and the stadium customiser. Events are stopped at the root so the canvas UI
// underneath never sees them.
import { kitSVG, crestSVG, CREST_SHAPES, CREST_MOTIFS } from './kitart.js';
import { menuArt, ART_OF } from './art.js';
import { THEME_CSS, installTilt, accentOf } from './theme.js';
import { createMenuScene } from './menuScene.js';

const CSS = `
#uf-overlay{position:fixed;inset:0;z-index:10;display:none;font:14px/1.35 Barlow,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#eef2f7;background:rgba(4,8,16,.55);backdrop-filter:blur(6px)}
#uf-overlay.on{display:block}
#uf-overlay *{box-sizing:border-box}
.uf-wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:22px 28px;gap:14px;max-width:1280px;margin:0 auto}
.uf-head{display:flex;align-items:center;gap:18px}
.uf-head h1{font-size:30px;letter-spacing:.06em;margin:0;font-weight:800}
.uf-head .uf-score{margin-left:auto;display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;background:rgba(8,12,20,.85);padding:6px 14px;border-radius:10px}
.uf-tab{width:7px;height:30px;border-radius:3px}
.uf-cols{display:grid;grid-template-columns:1.25fr 1fr .9fr;gap:14px;flex:1;min-height:0}
@media (max-width:980px){.uf-cols{grid-template-columns:1fr;overflow:auto}}
.uf-panel{background:rgba(10,15,25,.78);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:0;overflow:auto}
.uf-panel h2{margin:0 0 4px;font-size:12px;letter-spacing:.18em;color:#9be3b0;font-weight:700}
.uf-row{display:flex;align-items:center;gap:10px}
.uf-row label{flex:1;color:#cbd5e1}
.uf-btn{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:8px;padding:8px 14px;font:600 13px Barlow,system-ui;cursor:pointer}
.uf-btn:hover{background:#ffe066;color:#111}
.uf-btn.primary{background:#4ade80;color:#0b1a12}.uf-btn.primary:hover{background:#86efac}
.uf-btn.danger{background:rgba(248,113,113,.2);color:#fca5a5}.uf-btn.danger:hover{background:#f87171;color:#111}
.uf-btn.small{padding:4px 9px;font-size:12px}
select,input[type=range],input[type=text]{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:7px;padding:6px 8px;font:13px Barlow,system-ui}
select option{color:#111}
input[type=color]{width:34px;height:26px;border:0;background:none;padding:0;cursor:pointer}
.uf-list{display:flex;flex-direction:column;gap:4px}
.uf-player{display:grid;grid-template-columns:30px 1fr 34px 70px auto;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05)}
.uf-player.sel{outline:2px solid #ffe066}
.uf-num{width:28px;height:22px;border-radius:5px;display:grid;place-items:center;font-weight:800;font-size:12px;color:#fff}
.uf-stam{height:6px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden}.uf-stam i{display:block;height:100%;background:#4ade80}
.uf-muted{color:#94a3b8;font-size:12px}
.uf-keys{display:grid;grid-template-columns:1fr auto;gap:4px 14px;font-size:13px}
.uf-keys b{font-weight:700;color:#ffe066;background:rgba(255,224,102,.12);padding:1px 8px;border-radius:5px;min-width:40px;text-align:center}
.uf-foot{display:flex;gap:10px;justify-content:flex-end}
.uf-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.uf-card{background:rgba(255,255,255,.05);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px}
.uf-swatches{display:flex;gap:6px;align-items:center}
#uf-overlay.menu{background:#04100a;backdrop-filter:none}
.home .uf-wrap{max-width:none;padding:4vh 4.5vw;background:linear-gradient(180deg,rgba(3,10,6,.86),rgba(3,10,6,.55) 30%,rgba(3,10,6,.8)),repeating-linear-gradient(90deg,#0a2715 0 7vw,#0c2e19 7vw 14vw)}
.home .uf-head h1{font:800 italic 48px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;text-transform:uppercase;letter-spacing:0;line-height:1;color:#f2f6f1}
.home .uf-panel{background:rgba(3,10,6,.62);border-color:rgba(255,255,255,.08)}
.home .uf-panel h2{font:600 22px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;letter-spacing:0;text-transform:none;color:#f2f6f1}
.home .uf-btn{border:1px solid rgba(255,255,255,.16);border-radius:9px;font:600 17px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;background:rgba(255,255,255,.1)}
.home .uf-btn.primary{background:#ffe066;color:#111;font-style:italic;font-weight:800;text-transform:uppercase}
.home .uf-btn.primary:hover{background:#fff}
.home .uf-btn.small{font-size:14px;padding:4px 10px}
.home .uf-player{background:rgba(255,255,255,.05)}
.home .uf-muted{color:#a9bcae}
.mm{position:absolute;inset:0;overflow:hidden;color:#f2f6f1;font-family:'Barlow Condensed','DejaVu Sans Condensed','Arial Narrow',Barlow,system-ui,sans-serif;
 background:linear-gradient(90deg,rgba(3,10,6,.94) 0,rgba(3,10,6,.78) 34%,rgba(3,10,6,.25) 62%,rgba(3,10,6,.35) 100%),
 radial-gradient(55% 75% at 76% 38%,color-mix(in srgb,var(--club) 55%,transparent),transparent 72%),
 radial-gradient(30% 40% at 96% 0,rgba(255,250,225,.22),transparent 70%),
 var(--art,repeating-linear-gradient(90deg,#0a2715 0 7vw,#0c2e19 7vw 14vw)) center/cover no-repeat}
.mm button{font-family:inherit;color:inherit;cursor:pointer}
.mm :focus-visible{outline:3px solid #ffe066;outline-offset:3px}
.mm-grid{position:absolute;inset:0;display:grid;grid-template-columns:minmax(330px,40%) 1fr;grid-template-rows:auto 1fr auto;padding:4.5vh 4.5vw;gap:2vh 3vw}
.mm-logo{grid-column:1;margin:0;font-weight:800;font-style:italic;text-transform:uppercase;line-height:.84;font-size:clamp(46px,8.4vh,96px);letter-spacing:.01em}
.mm-logo span{display:block}
.mm-logo span+span{padding-left:.5em;color:transparent;-webkit-text-stroke:2px #f2f6f1}
.mm-modes{grid-column:1;display:flex;flex-direction:column;justify-content:center;gap:.6vh}
.mm-mode{display:grid;grid-template-columns:1fr;text-align:left;background:none;border:0;border-left:4px solid transparent;padding:.7vh 0 .7vh 16px;transition:border-color .12s,transform .12s}
.mm-mode b{font-size:clamp(24px,4.1vh,40px);font-weight:600;text-transform:uppercase;letter-spacing:.02em;line-height:1}
.mm-mode small{font:400 13px/1.3 Barlow,system-ui,sans-serif;color:#a9bcae;margin-top:3px}
.mm-mode:hover,.mm-mode:focus-visible{border-left-color:var(--club2);transform:translateX(6px);outline:0}
.mm-mode:first-child b{color:#ffe066}
.mm-links{display:flex;gap:22px;padding-left:20px;margin-top:1.6vh}
.mm-link{background:none;border:0;padding:4px 0;font-size:20px;font-weight:500;color:#cfdcd2;border-bottom:2px solid transparent}
.mm-link:hover,.mm-link:focus-visible{border-bottom-color:#ffe066;color:#fff;outline:0}
.mm-club{grid-column:2;grid-row:1/3;display:grid;grid-template-rows:1fr auto;justify-items:center;align-items:center;min-height:0}
.mm-kit{width:min(52vh,92%);aspect-ratio:1;transform:rotate(-3deg);filter:drop-shadow(0 26px 30px rgba(0,0,0,.55))}
.mm-kit svg,.qm-kit svg,.mm-crest svg,.qm-crest svg{width:100%;height:100%;display:block}
.mm-id{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:14px;background:rgba(3,10,6,.72);border-radius:12px;padding:10px 12px 10px 14px;max-width:560px;width:100%}
.mm-crest{width:54px;height:54px}.mm-lg{display:inline-block;width:22px;height:22px;flex:none}.mm-lg svg{width:100%;height:100%;display:block}
.mm-id h2{margin:0;font-size:30px;font-weight:600;line-height:1}
.mm-id p{margin:2px 0 0;font:400 13px Barlow,system-ui,sans-serif;color:#a9bcae}
.mm-arrow{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);font-size:18px}
.mm-arrow:hover{background:#ffe066;color:#111;border-color:#ffe066}
.mm-foot{grid-column:1/3;display:flex;align-items:center;gap:22px;font:400 13px Barlow,system-ui,sans-serif;color:#8fa596}
.mm-step{display:flex;align-items:center;gap:8px;color:#dfe8e1;font:400 13px Barlow,system-ui,sans-serif}
.mm-step span{min-width:112px;text-align:center;font:600 19px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif}
.mm-step button{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:none;font-size:12px}
.mm-step button:hover{background:#ffe066;color:#111}
.mm-foot .mm-count{margin-left:auto}
.mm.qm{background:linear-gradient(180deg,rgba(3,10,6,.84),rgba(3,10,6,.58) 40%,rgba(3,10,6,.88)),radial-gradient(38% 60% at 22% 45%,color-mix(in srgb,var(--c0) 45%,transparent),transparent 72%),radial-gradient(38% 60% at 78% 45%,color-mix(in srgb,var(--c1) 45%,transparent),transparent 72%),var(--art,repeating-linear-gradient(90deg,#0a2715 0 7vw,#0c2e19 7vw 14vw)) center/cover no-repeat}
.qm-grid{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;padding:4vh 4.5vw;gap:2vh}
.qm-head{display:flex;align-items:center;gap:22px}
.qm-head h1{margin:0;font-size:48px;font-weight:800;font-style:italic;text-transform:uppercase;line-height:1}
.qm-head select{margin-left:auto;background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px 10px;font:500 15px Barlow,system-ui,sans-serif;max-width:46%}
.qm-back{background:none;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:6px 14px;font-size:18px}
.qm-back:hover{background:#fff;color:#111}
.qm-match{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:0}
.qm-side{display:grid;justify-items:center;gap:1.2vh;min-height:0}
.qm-side>small{font:500 13px Barlow,system-ui,sans-serif;color:#a9bcae}
.qm-kit{width:min(36vh,30vw);aspect-ratio:1;filter:drop-shadow(0 18px 22px rgba(0,0,0,.5))}
.qm-side:first-child .qm-kit{transform:rotate(-4deg)}.qm-side:last-child .qm-kit{transform:rotate(4deg)}
.qm-name{display:flex;align-items:center;gap:12px}
.qm-crest{width:44px;height:44px}
.qm-name h2{margin:0;font-size:clamp(26px,4.4vh,40px);font-weight:600;line-height:1}
.qm-pick{display:flex;align-items:center;gap:10px}
.qm-pick select{background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 8px;font:500 14px Barlow,system-ui,sans-serif;width:min(260px,24vw)}
.qm-rating{width:min(260px,24vw);height:6px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.qm-rating i{display:block;height:100%}
.qm-v{font-size:64px;font-weight:800;font-style:italic;color:rgba(255,255,255,.3);padding:0 2vw}
.qm-foot{display:flex;align-items:center;gap:28px;justify-content:center;flex-wrap:wrap}
.qm-go{background:#ffe066;color:#111 !important;border:0;border-radius:10px;padding:12px 44px;font-size:28px;font-weight:800;font-style:italic;text-transform:uppercase}
.qm-go:hover{background:#fff}
.st .qm-match{align-items:start;padding-top:1vh}
.st-kit{width:min(24vh,20vw)}
.st-rows{display:grid;gap:8px;width:min(330px,30vw)}
.st-row{display:grid;grid-template-columns:80px 1fr;align-items:center;gap:10px;font:400 13px Barlow,system-ui,sans-serif;color:#a9bcae}
.st-row select{background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px 8px;font:500 14px Barlow,system-ui,sans-serif}
.st-row .mm-step span{min-width:150px;font-size:17px}
.st-val{font:600 19px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;color:#dfe8e1}
.st-pitch{width:100%;max-height:16vh;display:block}
.st-plan{font-size:16px;justify-self:start}
.st-mid{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(300px,24vw)}.st-mid>select{width:100%;background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 8px;font:500 14px Barlow,system-ui,sans-serif}
.st-players{width:100%;display:flex;flex-direction:column;gap:6px;max-width:300px}.st-players select{background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 8px;font:500 14px Barlow,system-ui,sans-serif}.st-players small{font:400 11px/1.3 Barlow,system-ui,sans-serif;color:#a9bcae}
.st-venue{margin-left:auto;font:500 15px Barlow,system-ui,sans-serif;color:#cfdcd2}
.qm-foot>select{background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px 10px;font:500 14px Barlow,system-ui,sans-serif}
.mm.scr{background:linear-gradient(180deg,rgba(3,10,6,.86),rgba(3,10,6,.62) 30%,rgba(3,10,6,.86)),radial-gradient(50% 60% at 85% 10%,color-mix(in srgb,var(--club) 40%,transparent),transparent 70%),var(--art,repeating-linear-gradient(90deg,#0a2715 0 7vw,#0c2e19 7vw 14vw)) center/cover no-repeat}
.scr-grid{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;padding:4vh 4.5vw;gap:2vh}
.scr-body{min-height:0;overflow:auto;display:grid;gap:16px;align-content:start;padding-right:4px}
.scr-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;align-items:start}
.scr-panel{background:rgba(3,10,6,.62);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px;display:grid;gap:10px;align-content:start}
.scr-panel h3{margin:0;font:600 22px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;color:#f2f6f1}
.scr-panel p,.scr-note{margin:0;font:400 13px/1.45 Barlow,system-ui,sans-serif;color:#a9bcae}
.scr-row{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);align-items:center;gap:12px;font:400 14px Barlow,system-ui,sans-serif;color:#cfdcd2;max-width:620px}
.scr-row>div{min-width:0}.scr-row select,.scr-row input[type=range]{width:100%;max-width:340px}
.scr-row select,.scr-row input[type=text],.scr-in{background:rgba(3,10,6,.7);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 9px;font:500 14px Barlow,system-ui,sans-serif}
.scr-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);border-radius:9px;padding:8px 14px;font:600 17px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;color:#f2f6f1;text-align:left}
.scr-btn:hover,.scr-btn:focus-visible{background:#ffe066;color:#111;border-color:#ffe066;outline:0}
.scr-btn.go{background:#ffe066;color:#111;font-weight:800;font-style:italic;text-transform:uppercase;font-size:22px;text-align:center;padding:10px 26px}
.scr-btn.go:hover{background:#fff}
.scr-btn.danger{color:#fca5a5;border-color:rgba(248,113,113,.4)}.scr-btn.danger:hover{background:#f87171;color:#111}
.scr-btn.sel{border-color:#ffe066;box-shadow:inset 3px 0 0 #ffe066}
.scr-foot{display:flex;gap:12px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.scr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.scr-card{display:grid;gap:4px;text-align:left;background:rgba(3,10,6,.62);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--c,#4ade80);border-radius:12px;padding:12px 14px}
.scr-card b{font:600 21px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;color:#f2f6f1;text-transform:uppercase;letter-spacing:.02em}
.scr-card small{font:400 12.5px/1.4 Barlow,system-ui,sans-serif;color:#a9bcae}
.scr-card:hover,.scr-card:focus-visible{background:rgba(255,224,102,.12);border-color:#ffe066;outline:0}
.club-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.club-tile{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;background:rgba(3,10,6,.6);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--c);border-radius:10px;padding:7px 10px;text-align:left}
.club-tile b{font:600 17px 'Barlow Condensed','DejaVu Sans Condensed',sans-serif;color:#f2f6f1;line-height:1.05}
.club-tile small{font:600 13px 'Barlow Condensed',sans-serif;color:#ffe066}
.club-tile .ct-crest{width:38px;height:38px}.club-tile .ct-crest svg{width:100%;height:100%}
.lg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.lg-card{display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:center;text-align:left;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:10px;color:#fff;cursor:pointer}
.lg-card:hover,.lg-card:focus-visible{border-color:#ffe066;outline:none}.lg-card b{display:block;font:700 19px 'Barlow Condensed',sans-serif;line-height:1.05}.lg-card small{font:400 12px Barlow,system-ui;color:#a9bcae}
.lg-logo{width:56px;height:56px;flex:none}.lg-logo svg{width:100%;height:100%;display:block}
.lg-head{display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap}.lg-head b{font:700 22px 'Barlow Condensed',sans-serif;color:#fff}
.qm-league{display:flex;align-items:center;gap:6px;font:500 13px Barlow,system-ui;color:#d7e3da}.qm-change{background:rgba(3,10,6,.6);border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;padding:6px 12px;font:600 14px 'Barlow Condensed',sans-serif;cursor:pointer}.qm-change:hover{border-color:#ffe066}
.lobby-teams{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lobby-team{display:grid;justify-items:center;gap:6px;background:rgba(255,255,255,.05);border-radius:12px;padding:12px;color:#fff;text-align:center}.lobby-team b{font:700 20px 'Barlow Condensed',sans-serif}.lobby-team small{color:#a9bcae;font:400 12px Barlow,system-ui}
.club-tile:hover,.club-tile:focus-visible{background:rgba(255,224,102,.12);border-color:#ffe066;outline:0}
.keys-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.key-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font:400 13.5px Barlow,system-ui,sans-serif;color:#cfdcd2;background:none;border:0;padding:4px 2px;text-align:left}
.key-row b{font:700 13px Barlow,system-ui;color:#ffe066;background:rgba(255,224,102,.12);padding:2px 9px;border-radius:6px;min-width:46px;text-align:center}
.key-row.wait b{background:#ffe066;color:#111}
.key-row:hover b{background:rgba(255,224,102,.3)}
.scr-tabs{display:flex;gap:6px;flex-wrap:wrap}
.scr-tab{background:none;border:0;border-bottom:3px solid transparent;padding:6px 10px;font:600 19px 'Barlow Condensed',sans-serif;color:#a9bcae}
.scr-tab.on{color:#fff;border-bottom-color:#ffe066}
.scr-table{width:100%;border-collapse:collapse;font:400 13px Barlow,system-ui,sans-serif;color:#dfe8e1}
.scr-table th{font:600 12px Barlow,system-ui;color:#8fa596;text-align:right;padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.1)}
.scr-table td{padding:4px 6px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05)}
.scr-table td:nth-child(2),.scr-table th:nth-child(2){text-align:left}
.scr-table tr.me td{color:#ffe066;font-weight:700}
.scr-modal{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.55)}
.scr-modal>div{background:#0b1a12;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:20px 22px;display:grid;gap:12px;max-width:440px}
@media (max-width:820px){.mm-grid{grid-template-columns:1fr;grid-template-rows:auto auto auto auto;overflow:auto}.mm-club{grid-column:1;grid-row:auto}.mm-kit{width:40vw}.mm-foot{grid-column:1;flex-wrap:wrap}.qm-match{grid-template-columns:1fr;overflow:auto}.qm-v{display:none}}
@media (prefers-reduced-motion:reduce){.mm-mode{transition:none}}
`;

let root = null, state = { mode: null };
function mount() {
  if (root) return root;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const theme = document.createElement('style'); theme.id = 'uf-theme'; theme.textContent = THEME_CSS; document.head.appendChild(theme);
  root = document.createElement('div'); root.id = 'uf-overlay'; document.body.appendChild(root); installTilt(root);
  for (const ev of ['mousedown', 'mouseup', 'click', 'mousemove', 'wheel', 'contextmenu', 'pointerdown', 'pointerup']) root.addEventListener(ev, e => e.stopPropagation());
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && state.onEscape) { state.onEscape(); } e.stopPropagation(); });
  root.addEventListener('keyup', e => e.stopPropagation());
  return root;
}
// Main-menu live stage: one canvas kept across re-renders of the main menu, disposed when another screen replaces it.
let stage = null;
export const _stage = () => stage;
function stageFor(api) {
  if (api.lowGfx) return null;
  if (stage && stage.dead) stage = null;
  if (!stage) {
    const holder = document.createElement('div'); holder.className = 'mm-stage';
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = createMenuScene(holder, { still: reduce }); if (!scene) return null;
    stage = { el: holder, scene, key: null, dead: false };
    const S = stage;
    const onMove = e => { const r = holder.getBoundingClientRect(); if (r.width) S.scene.parallax((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); };
    if (!reduce) window.addEventListener('pointermove', onMove, { passive: true });
    const mo = new MutationObserver(() => { if (!root || !root.contains(holder)) { mo.disconnect(); window.removeEventListener('pointermove', onMove); S.dead = true; S.scene.dispose(); if (stage === S) stage = null; } });
    mo.observe(root, { childList: true, subtree: true });
  }
  return stage;
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (k === 'style') n.style.cssText = v; else if (k === 'html') n.innerHTML = v; else n.setAttribute(k, v); } for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(String(c))); return n; };
const select = (options, value, onchange) => { const s = el('select', { onchange: e => onchange(isNaN(+e.target.value) ? e.target.value : +e.target.value) }); options.forEach(([v, label]) => s.append(el('option', { value: v, ...(String(v) === String(value) ? { selected: '' } : {}) }, label))); return s; };
const range = (value, onchange, min = 0, max = 100) => el('input', { type: 'range', min, max, value, oninput: e => onchange(+e.target.value) });

// shared host for the menu screens in screens.js (same root, helpers and Escape handling)
export function _host() { mount(); return { root, el, select, range, esc, setState: st => { state = st; } }; }

export const overlay = {
  get visible() { return !!(root && root.classList.contains('on')); },
  get mode() { return state.mode; },
  hide() { if (root) { root.classList.remove('on', 'menu'); root.innerHTML = ''; } state = { mode: null }; },

  /** api: { teams, squad, formations, tactics, names:{DN,WN,GN,cams}, settings, keymap, actions, kn, onResume, onQuit, onFormation, onTactic, onSub, onSetting } */
  showPause(api) {
    mount(); state = { mode: 'pause', onEscape: api.onResume }; root.innerHTML = ''; root.className = 'on';
    const T = api.teams[0], O = api.teams[1]; let selIdx = -1;
    const head = el('div', { class: 'uf-head' }, el('h1', {}, 'PAUSED'),
      el('div', { class: 'uf-score' }, el('span', { class: 'uf-tab', style: `background:${T.col}` }), `${T.ab} ${T.score} – ${O.score} ${O.ab}`, el('span', { class: 'uf-tab', style: `background:${O.col}` })));
    // ---- team management
    const list = el('div', { class: 'uf-list' }), benchBox = el('div', { class: 'uf-list' });
    const renderList = () => {
      list.innerHTML = '';
      T.p.forEach((p, i) => list.append(el('div', { class: 'uf-player' + (i === selIdx ? ' sel' : ''), onclick: () => { selIdx = selIdx === i ? -1 : i; renderList(); renderBench(); } },
        el('span', { class: 'uf-num', style: `background:${T.col}` }, i + 1), el('span', {}, p.nm + (p.red ? '  🟥' : '')), el('span', { class: 'uf-muted' }, (api.squad[p.sqi] && api.squad[p.sqi].dpos) || p.role),
        el('div', { class: 'uf-stam' }, el('i', { style: `width:${Math.round(p.stam * 100)}%;background:${p.stam > .3 ? '#4ade80' : '#f87171'}` })),
        el('span', { class: 'uf-muted' }, p.sqi != null ? `OVR ${api.squad[p.sqi]?.ov ?? ''}` : ''))));
    };
    const renderBench = () => {
      benchBox.innerHTML = '';
      const used = new Set(T.p.map(q => q.sqi)), subsLeft = 3 - (T.subs || 0);
      benchBox.append(el('div', { class: 'uf-muted' }, selIdx < 0 ? `Select a starter, then a substitute (${subsLeft} left)` : `Replace #${selIdx + 1} ${T.p[selIdx].nm} with: (${subsLeft} left)`));
      api.squad.forEach((q, si) => { if (used.has(si)) return; benchBox.append(el('div', { class: 'uf-player', style: 'cursor:pointer', onclick: () => { if (selIdx < 0 || subsLeft <= 0) return; api.onSub(selIdx, si); selIdx = -1; renderList(); renderBench(); } }, el('span', { class: 'uf-num', style: 'background:#334155' }, q.pos), el('span', {}, q.nm), el('span', { class: 'uf-muted' }, ''), el('span', {}), el('span', { class: 'uf-muted' }, `OVR ${q.ov}`))); });
    };
    renderList(); renderBench();
    const team = el('div', { class: 'uf-panel' }, el('h2', {}, 'TEAM MANAGEMENT'),
      el('div', { class: 'uf-row' }, el('label', {}, 'Formation'), select(api.formations.map((f, i) => [i, f]), T.fm, v => { api.onFormation(v); renderList(); })),
      el('div', { class: 'uf-row' }, el('label', {}, 'Tactic'), select(api.tactics.map((t, i) => [i, t]), T.tac, v => api.onTactic(v))),
      list, el('h2', {}, 'SET-PIECE TAKERS'), (() => {
        const tk = { ...(api.takers || {}) }, opts = [[-1, 'Auto (nearest / best)'], ...T.p.map((p, i) => [p.sqi, `#${i + 1} ${p.nm}  (SHO ${p.a.shoot} · PAS ${p.a.pass})`])];
        const row = (k, label) => el('div', { class: 'uf-row' }, el('label', {}, label), select(opts, tk[k] ?? -1, v => { if (v < 0) delete tk[k]; else tk[k] = v; api.onTakers && api.onTakers(tk); }));
        return el('div', { class: 'uf-list' }, row('fk', 'Free kicks'), row('ck', 'Corners'), row('pk', 'Penalties'));
      })(), el('h2', {}, 'BENCH'), benchBox);
    // ---- game settings
    const S = api.settings, N = api.names, set = (k, v) => api.onSetting(k, v);
    const settings = el('div', { class: 'uf-panel' }, el('h2', {}, 'GAME SETTINGS'),
      el('div', { class: 'uf-row' }, el('label', {}, 'Controls'), select([['simple', 'Simple (4 buttons + gestures)'], ['classic', 'Classic (full layout)']], S.scheme || 'simple', v => set('scheme', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Camera'), select(N.cams.map((c, i) => [i, c]), S.camM, v => set('camM', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'View'), select([[1, '3D'], [0, '2D']], S.use3d ? 1 : 0, v => set('use3d', !!v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Difficulty'), select(N.DN.map((d, i) => [i, d]), S.diff, v => set('diff', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Lighting / weather'), select(N.WN.map((d, i) => [i, d]), S.wx, v => set('wx', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Graphics'), select(N.GN.map((d, i) => [i, d]), S.gq, v => set('gq', v))),
      el('div', { class: 'uf-muted', style: 'font-size:11px' }, S.qdesc || ''),
      el('div', { class: 'uf-row' }, el('label', {}, 'Volume'), range(Math.round(S.vol * 100), v => set('vol', v / 100))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Sound'), select([[1, 'On'], [0, 'Off']], S.muted ? 0 : 1, v => set('muted', !v))),
      el('h2', {}, 'ASSISTS'),
      el('div', { class: 'uf-row' }, el('label', {}, 'Pass assist'), range(S.GS.passA, v => set('passA', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Shot assist'), range(S.GS.shotA, v => set('shotA', v))),
      el('div', { class: 'uf-row' }, el('label', {}, 'Defending assist'), range(S.GS.defA, v => set('defA', v))));
    // ---- controls
    const keys = el('div', { class: 'uf-keys' }); api.actions.forEach(([k, label]) => keys.append(el('span', {}, label), el('b', {}, api.kn(api.keymap[k] || '—'))));
    const controls = el('div', { class: 'uf-panel' }, el('h2', {}, 'GAME CONTROLS'), keys, el('div', { class: 'uf-muted' }, 'Remap keys in Settings → Controls (main menu). Gamepad: A pass / tackle · B shoot / slide · X lob / steal · Y through / 2nd-man press · LB switch · LT jockey / shield · RB/RT sprint · right stick flick: skill move / switch.'));
    const foot = el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn danger', onclick: api.onQuit }, 'QUIT TO MENU'), el('button', { class: 'uf-btn primary', onclick: api.onResume }, 'RESUME  (Esc)'));
    root.append(el('div', { class: 'uf-wrap' }, head, el('div', { class: 'uf-cols' }, team, settings, controls), foot));
  },

  /** Simple modal: { title, text, options:[[label, fn], ...] } */
  showChoice(api) {
    mount(); state = { mode: 'choice', onEscape: null }; root.innerHTML = ''; root.className = 'on';
    root.append(el('div', { class: 'uf-wrap', style: 'justify-content:center;align-items:center' }, el('div', { class: 'uf-panel', style: 'min-width:420px;max-width:560px;text-align:center;gap:14px' },
      el('h1', { style: 'margin:0;font-size:26px;letter-spacing:.06em' }, api.title), el('div', { class: 'uf-muted', style: 'font-size:14px;color:#cbd5e1' }, api.text),
      el('div', { class: 'uf-row', style: 'justify-content:center' }, ...api.options.map(([label, fn], i) => el('button', { class: 'uf-btn' + (i === 0 ? ' primary' : ''), onclick: fn }, label))))));
  },

  // ------------------------------------------------------------ Phase 6: world screens -----------
  /** Transfer market. api: { world, myClub(id), budget, onSearch(filters)->players, onOffer(playerId, fee, wage)->result, onSell(playerId)->result, incoming:[{player,club,fee}], onAcceptIncoming(i), onClose } */
  showTransfers(api) {
    mount(); state = { mode: 'transfers', onEscape: api.onClose }; root.innerHTML = ''; root.className = 'on menu home';
    const W = api.world, my = W.clubs[api.myClub]; const f = { league: 'all', pos: 'all', minOv: 60, name: '' };
    const results = el('div', { class: 'uf-list' }), detail = el('div', { class: 'uf-panel', style: 'min-height:260px' }, el('h2', {}, 'NEGOTIATION'), el('div', { class: 'uf-muted' }, 'Pick a player to open talks.'));
    const money = v => '€' + (v >= 1 ? v.toFixed(1) + 'M' : Math.round(v * 1000) + 'k');
    const render = () => {
      results.innerHTML = ''; const list = api.onSearch(f).slice(0, 40);
      if (!list.length) results.append(el('div', { class: 'uf-muted' }, 'No players match.'));
      for (const p of list) results.append(el('div', { class: 'uf-player', style: 'grid-template-columns:34px 1fr 42px 60px 70px;cursor:pointer', onclick: () => openTalks(p) }, el('span', { class: 'uf-num', style: 'background:#334155' }, p.pos), el('span', {}, p.name, el('span', { class: 'uf-muted' }, `  ·  ${W.clubs[p.club].name}  ·  ${p.age}y`)), el('b', { style: 'color:#ffe066' }, p.ov), el('span', { class: 'uf-muted' }, money(p.value)), el('span', { class: 'uf-muted' }, `€${p.wage}k/w`)));
    };
    const openTalks = p => {
      let fee = Math.round(p.value * 1.1 * 10) / 10, wage = Math.round(p.wage * 1.1); const out = el('div', { class: 'uf-muted' }, 'Set your offer and send it.');
      const feeLbl = el('b', {}, money(fee)), wageLbl = el('b', {}, `€${wage}k/w`);
      detail.innerHTML = ''; detail.append(el('h2', {}, 'NEGOTIATION'), el('div', { style: 'font-weight:700;font-size:16px' }, `${p.name}  ·  ${p.pos}  ·  OVR ${p.ov}`), el('div', { class: 'uf-muted' }, `${W.clubs[p.club].name} · ${p.age} years · contract ${p.contract}y · value ${money(p.value)} · form ${Math.round(p.form)}`),
        el('div', { class: 'uf-row' }, el('label', {}, 'Transfer fee ', feeLbl), range(Math.round(fee / Math.max(0.2, p.value * 3) * 100), v => { fee = Math.round(Math.max(0.1, p.value * 3) * v / 100 * 10) / 10; feeLbl.textContent = money(fee); })),
        el('div', { class: 'uf-row' }, el('label', {}, 'Weekly wage ', wageLbl), range(Math.round(wage / (p.wage * 2.5) * 100), v => { wage = Math.max(1, Math.round(p.wage * 2.5 * v / 100)); wageLbl.textContent = `€${wage}k/w`; })),
        el('div', { class: 'uf-row' }, el('button', { class: 'uf-btn primary', onclick: () => { const r = api.onOffer(p.id, fee, wage); out.textContent = r.text; out.style.color = r.ok ? '#86efac' : '#fca5a5'; if (r.ok) { budgetLbl.textContent = `Budget ${money(api.budget())}`; render(); } } }, 'SEND OFFER'), el('span', { class: 'uf-muted' }, `Budget ${money(api.budget())}`)), out);
    };
    const budgetLbl = el('span', { class: 'uf-muted' }, `Budget ${money(api.budget())}`);
    const filters = el('div', { class: 'uf-panel', style: 'gap:8px' }, el('h2', {}, 'SEARCH'),
      el('div', { class: 'uf-row' }, el('label', {}, 'League'), select([['all', 'All leagues'], ...W.countries.map(c => [c.league.id, c.league.name])], f.league, v => { f.league = v; render(); })),
      el('div', { class: 'uf-row' }, el('label', {}, 'Position'), select([['all', 'Any'], ...['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'DMF', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'].map(p => [p, p])], f.pos, v => { f.pos = v; render(); })),
      el('div', { class: 'uf-row' }, el('label', {}, 'Min rating ', el('b', { id: 'uf-minov' }, f.minOv)), range(f.minOv, v => { f.minOv = v; document.getElementById('uf-minov').textContent = v; render(); }, 40, 90)),
      el('div', { class: 'uf-row' }, el('label', {}, 'Name'), el('input', { type: 'text', placeholder: 'search…', oninput: e => { f.name = e.target.value; render(); } })),
      budgetLbl, el('h2', {}, 'RESULTS'), results);
    const incoming = el('div', { class: 'uf-panel' }, el('h2', {}, 'OFFERS FOR YOUR PLAYERS'));
    if (!api.incoming.length) incoming.append(el('div', { class: 'uf-muted' }, 'No clubs have made offers this week.'));
    api.incoming.forEach((o, i) => { const p = W.players[o.player]; incoming.append(el('div', { class: 'uf-player', style: 'grid-template-columns:1fr auto auto' }, el('span', {}, `${W.clubs[o.club].name} offer ${money(o.fee)} for ${p.name} (OVR ${p.ov})`), el('button', { class: 'uf-btn small primary', onclick: () => { api.onAcceptIncoming(i); overlay.hide(); api.onReopen && api.onReopen(); } }, 'ACCEPT'), el('button', { class: 'uf-btn small', onclick: () => { api.incoming.splice(i, 1); overlay.hide(); api.onReopen && api.onReopen(); } }, 'REJECT'))); });
    const squad = el('div', { class: 'uf-panel' }, el('h2', {}, `${my.name.toUpperCase()} SQUAD (${my.squad.length})`), ...my.squad.map(id => W.players[id]).sort((a, b) => b.ov - a.ov).map(p => el('div', { class: 'uf-player', style: 'grid-template-columns:34px 1fr 42px auto' }, el('span', { class: 'uf-num', style: `background:${my.colors[0]}` }, p.pos), el('span', {}, p.name, el('span', { class: 'uf-muted' }, `  ${p.age}y · €${p.wage}k/w${p.injury ? ' · 🩹 ' + p.injury.weeks + 'w' : ''}`)), el('b', { style: 'color:#ffe066' }, p.ov), el('button', { class: 'uf-btn small', onclick: () => { const r = api.onSell(p.id); detail.innerHTML = ''; detail.append(el('h2', {}, 'SALE'), el('div', { style: r.ok ? 'color:#86efac' : 'color:#fca5a5' }, r.text)); if (r.ok) { overlay.hide(); api.onReopen && api.onReopen(); } } }, 'LIST FOR SALE'))));
    render();
    root.append(el('div', { class: 'uf-wrap' }, el('div', { class: 'uf-head' }, el('h1', {}, 'TRANSFER MARKET'), el('span', { class: 'uf-muted' }, `${my.name} · window open`)),
      el('div', { class: 'uf-cols', style: 'grid-template-columns:1.1fr 1fr 1fr' }, filters, el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0;overflow:auto' }, detail, incoming), squad),
      el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn', onclick: api.onClose }, 'CLOSE'))));
  },

  /** News feed: tabs (My career / League / World), newest first, detail with a generated image.
   *  api: { items:[{type,text,week,title?,detail?,scope?}], scopeOf(it)->'me'|'league'|'world', league, onClose, renderImage(item)->canvas|null } */
  showNews(api) {
    mount(); state = { mode: 'news', onEscape: api.onClose }; root.innerHTML = ''; root.className = 'on menu home';
    const icon = { transfer: '🔁', injury: '🩹', fit: '✅', rival: '🔥', result: '📊', table: '📈', world: '🌍', offer: '💼', award: '🏆', board: '🏛️', bench: '🪑', sig: '✦', info: '📰' };
    const scope = it => (api.scopeOf ? api.scopeOf(it) : 'me');
    const all = api.items.map((it, i) => [it, i]).sort((a, b) => (b[0].week ?? -1) - (a[0].week ?? -1) || b[1] - a[1]).map(x => x[0]);
    const tabs = [['me', 'My career'], ['league', api.league || 'League'], ['world', 'World']];
    let tab = all.length && !all.some(it => scope(it) === 'me') ? 'league' : 'me', cur = null;
    const list = el('div', { class: 'uf-list' }), detail = el('div', { class: 'uf-panel', style: 'align-items:center;text-align:center' }), tabBar = el('div', { class: 'scr-tabs' });
    const open = it => { cur = it; detail.innerHTML = '';
      detail.append(el('h2', {}, (it.title || it.type || 'news') + (it.week != null ? `  ·  week ${it.week + 1}` : '')));
      const img = api.renderImage && api.renderImage(it); if (img) { img.style.cssText = 'width:min(100%,360px);border-radius:12px;background:rgba(255,255,255,.04)'; detail.append(img); }
      detail.append(el('div', { style: 'font-size:17px;font-weight:700;max-width:440px' }, it.text));
      if (it.detail) detail.append(el('div', { class: 'uf-muted', style: 'font-size:13px;max-width:440px;line-height:1.5' }, it.detail));
      renderList(); };
    const renderList = () => { list.innerHTML = ''; const items = all.filter(it => scope(it) === tab);
      if (!items.length) list.append(el('div', { class: 'uf-muted' }, tab === 'world' ? 'World news arrives as the season goes on.' : 'Nothing yet — play a match.'));
      items.forEach(it => list.append(el('div', { class: 'uf-player' + (it === cur ? ' sel' : ''), style: 'grid-template-columns:28px 1fr auto;cursor:pointer', onclick: () => open(it) }, el('span', {}, icon[it.type] || '📰'), el('span', {}, it.text), el('span', { class: 'uf-muted' }, it.week != null ? 'wk ' + (it.week + 1) : '')))); };
    const renderTabs = () => { tabBar.innerHTML = ''; tabs.forEach(([k, n]) => { const c = all.filter(it => scope(it) === k).length; tabBar.append(el('button', { class: 'scr-tab' + (tab === k ? ' on' : ''), onclick: () => { tab = k; renderTabs(); const f = all.find(it => scope(it) === k); if (f) open(f); else { detail.innerHTML = ''; renderList(); } } }, `${n} (${c})`)); }); };
    renderTabs(); const first = all.find(it => scope(it) === tab); if (first) open(first); else renderList();
    root.append(el('div', { class: 'uf-wrap' }, el('div', { class: 'uf-head' }, el('h1', {}, 'News'), el('div', { style: 'margin-left:auto' }, tabBar)), el('div', { class: 'uf-cols', style: 'grid-template-columns:1.2fr 1fr' }, el('div', { class: 'uf-panel' }, list), detail), el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn', onclick: api.onClose }, 'Close'))));
  },

  /** Interested clubs / offers for the player's career. api: { offers:[{club, fee, wage, years}], world, current:{wage}, onAccept(i), onAsk(i, wage)->{ok,text}, onClose } */
  showOffers(api) {
    mount(); state = { mode: 'offers', onEscape: api.onClose }; root.innerHTML = ''; root.className = 'on menu home';
    const W = api.world, list = el('div', { class: 'uf-list' }), out = el('div', { class: 'uf-muted' }, api.offers.length ? 'Negotiate your wage, then accept. Your current club decides whether to let you go.' : 'No club has declared an interest yet. Keep playing well.');
    api.offers.forEach((o, i) => { const c = W.clubs[o.club]; let wage = o.wage; const lbl = el('b', {}, `€${wage}k/w`);
      list.append(el('div', { class: 'uf-card' }, el('div', { style: 'font-weight:800;font-size:15px' }, c.name, el('span', { class: 'uf-muted' }, `  ·  ${W.countries.find(k => k.id === c.country).league.name}  ·  rep ${c.rep}`)), el('div', { class: 'uf-muted' }, `Bid to your club: €${o.fee}M · contract ${o.years} years`),
        el('div', { class: 'uf-row' }, el('label', {}, 'Your wage demand ', lbl), range(50, v => { wage = Math.round(o.wage * (0.6 + v / 100 * 1.2)); lbl.textContent = `€${wage}k/w`; })),
        el('div', { class: 'uf-row' }, el('button', { class: 'uf-btn primary', onclick: () => { const r = api.onAsk(i, wage); out.textContent = r.text; out.style.color = r.ok ? '#86efac' : '#fca5a5'; if (r.ok && r.done) { overlay.hide(); } } }, 'AGREE TERMS & MOVE')))); });
    root.append(el('div', { class: 'uf-wrap' }, el('div', { class: 'uf-head' }, el('h1', {}, 'INTERESTED CLUBS')), el('div', { class: 'uf-panel' }, out, list), el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn', onclick: api.onClose }, 'CLOSE'))));
  },

  /** Create-a-club. api: { world, onCreate({name, abbr, colors, letter, shape, country, replace, profile, manager}), onClose } */
  showCreateClub(api) {
    mount(); state = { mode: 'create', onEscape: api.onClose }; root.innerHTML = ''; root.className = 'on menu home';
    const W = api.world, d = { name: 'Nyanza Lakers FC', abbr: 'NYA', colors: ['#0ea5e9', '#f8fafc', '#111827'], letter: 'N', shape: 0, motif: 2, country: W.countries[0].id, replace: null, profile: 'balanced', manager: 'Your Manager' };
    const replaceSel = el('div'), crestBox = el('div', { class: 'mm-crest', style: 'width:64px;height:64px;margin-left:8px' });
    const crestPrev = () => { crestBox.innerHTML = crestSVG({ n: d.name, crest: { shape: d.shape, motif: d.motif, border: 1, c1: d.colors[0], c2: d.colors[1], c3: d.colors[2], letter: d.letter, year: W.year || 2026 } }); }; crestPrev();
    const renderReplace = () => { const c = W.countries.find(k => k.id === d.country); replaceSel.innerHTML = ''; d.replace = d.replace != null && c.league.clubs.includes(d.replace) ? d.replace : c.league.clubs[c.league.clubs.length - 1]; replaceSel.append(select(c.league.clubs.map(id => [id, `${W.clubs[id].name} (rep ${W.clubs[id].rep})`]), d.replace, v => { d.replace = v; })); };
    renderReplace();
    root.append(el('div', { class: 'uf-wrap' }, el('div', { class: 'uf-head' }, el('h1', {}, 'CREATE YOUR CLUB')),
      el('div', { class: 'uf-cols', style: 'grid-template-columns:1fr 1fr' },
        el('div', { class: 'uf-panel' }, el('h2', {}, 'IDENTITY'),
          el('div', { class: 'uf-row' }, el('label', {}, 'Club name'), el('input', { type: 'text', value: d.name, oninput: e => { d.name = e.target.value; } })),
          el('div', { class: 'uf-row' }, el('label', {}, 'Abbreviation'), el('input', { type: 'text', value: d.abbr, maxlength: 3, style: 'width:70px', oninput: e => { d.abbr = e.target.value.toUpperCase(); } })),
          el('div', { class: 'uf-row' }, el('label', {}, 'Colours (home / away / third)'), el('div', { class: 'uf-swatches' }, ...d.colors.map((c, i) => el('input', { type: 'color', value: c, oninput: e => { d.colors[i] = e.target.value; crestPrev(); } })))),
          el('div', { class: 'uf-row' }, el('label', {}, 'Crest letter / shape'), el('input', { type: 'text', value: d.letter, maxlength: 1, style: 'width:50px', oninput: e => { d.letter = e.target.value.toUpperCase(); crestPrev(); } }), select(CREST_SHAPES.map((n, i) => [i, n]), d.shape, v => { d.shape = +v; crestPrev(); }), select(CREST_MOTIFS.map((n, i) => [i, n]), d.motif, v => { d.motif = +v; crestPrev(); }), crestBox),
          el('div', { class: 'uf-row' }, el('label', {}, 'Manager name'), el('input', { type: 'text', value: d.manager, oninput: e => { d.manager = e.target.value; } }))),
        el('div', { class: 'uf-panel' }, el('h2', {}, 'LEAGUE & SQUAD'),
          el('div', { class: 'uf-row' }, el('label', {}, 'League'), select(W.countries.map(c => [c.id, c.league.name]), d.country, v => { d.country = v; renderReplace(); })),
          el('div', { class: 'uf-row' }, el('label', {}, 'Takes the place of'), replaceSel),
          el('div', { class: 'uf-row' }, el('label', {}, 'Starting squad'), select([['youth', 'Youth prospects (cheap, low rating, high growth)'], ['balanced', 'Balanced'], ['veterans', 'Experienced veterans (strong now, ageing)']], d.profile, v => { d.profile = v; })),
          el('div', { class: 'uf-muted' }, 'Local rivals are assigned from the same league. Board expectation: mid-table in season one.'))),
      el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn', onclick: api.onClose }, 'CANCEL'), el('button', { class: 'uf-btn primary', onclick: () => api.onCreate(d) }, 'FOUND THE CLUB'))));
  },

  /** World editor: browse and rename. api: { world, onSave, onClose, onPickLeague(countryId) } */
  showWorld(api) {
    mount(); state = { mode: 'world', onEscape: api.onClose }; root.innerHTML = ''; root.className = 'on menu home';
    const W = api.world; let country = W.countries[0], club = W.clubs[country.league.clubs[0]];
    const clubs = el('div', { class: 'uf-list' }), players = el('div', { class: 'uf-list' }), title = el('div', { style: 'font-weight:800;font-size:16px' });
    const renderPlayers = () => { players.innerHTML = ''; title.textContent = `${club.name} · rep ${club.rep} · €${club.budget}M`;
      players.append(el('div', { class: 'uf-row' }, el('label', {}, 'Club name'), el('input', { type: 'text', value: club.name, oninput: e => { club.name = e.target.value; api.onSave(); renderClubs(); } }), el('input', { type: 'color', value: club.colors[0], oninput: e => { club.colors[0] = e.target.value; club.kits[0].c = e.target.value; club.crest.c1 = e.target.value; api.onSave(); } })));
      club.squad.map(id => W.players[id]).sort((a, b) => b.ov - a.ov).forEach(p => players.append(el('div', { class: 'uf-player', style: 'grid-template-columns:34px 1fr 42px 60px' }, el('span', { class: 'uf-num', style: 'background:#334155' }, p.pos), el('input', { type: 'text', value: p.name, style: 'background:none;border:0;color:#fff;padding:0', onchange: e => { p.name = e.target.value; const parts = p.name.split(' '); p.first = parts[0]; p.last = parts.slice(1).join(' ') || parts[0]; api.onSave(); } }), el('b', { style: 'color:#ffe066' }, p.ov), el('span', { class: 'uf-muted' }, `${p.age}y`)))); };
    const renderClubs = () => { clubs.innerHTML = ''; country.league.clubs.map(id => W.clubs[id]).sort((a, b) => b.rep - a.rep).forEach(c => clubs.append(el('div', { class: 'uf-player' + (c === club ? ' sel' : ''), style: 'grid-template-columns:28px 1fr 40px;cursor:pointer', onclick: () => { club = c; renderClubs(); renderPlayers(); } }, el('span', { class: 'uf-num', style: `background:${c.colors[0]}` }, c.crest.letter), el('span', {}, c.name), el('span', { class: 'uf-muted' }, c.rep)))); };
    renderClubs(); renderPlayers();
    root.append(el('div', { class: 'uf-wrap' }, el('div', { class: 'uf-head' }, el('h1', {}, 'WORLD'), el('span', { class: 'uf-muted' }, `${W.clubs.length} clubs · ${W.players.length} players · seed ${W.seed}`)),
      el('div', { class: 'uf-cols', style: 'grid-template-columns:.8fr 1fr 1.4fr' },
        el('div', { class: 'uf-panel' }, el('h2', {}, 'COUNTRIES & LEAGUES'), ...W.countries.map(c => el('div', { class: 'uf-player' + (c === country ? ' sel' : ''), style: 'grid-template-columns:1fr auto;cursor:pointer', onclick: () => { country = c; club = W.clubs[c.league.clubs[0]]; renderClubs(); renderPlayers(); } }, el('span', {}, c.league.name, el('span', { class: 'uf-muted' }, `  ·  ${c.name}`)), el('button', { class: 'uf-btn small', onclick: e => { e.stopPropagation(); api.onPickLeague(c.id); } }, 'PLAY HERE')))),
        el('div', { class: 'uf-panel' }, el('h2', {}, 'CLUBS'), clubs),
        el('div', { class: 'uf-panel' }, el('h2', {}, 'SQUAD'), title, players)),
      el('div', { class: 'uf-foot' }, el('button', { class: 'uf-btn danger', onclick: () => { if (confirm('Regenerate the whole world with a new seed? Careers keep their club index but squads change.')) api.onRegenerate(); } }, 'NEW WORLD'), el('button', { class: 'uf-btn primary', onclick: api.onClose }, 'DONE'))));
  },
  /** Main menu. api (live getters): { clubs, sel, DN, diff, counts, onCycle(d), onGo(scr), onDiff(d), onWorld } */
  showMain(api) {
    mount(); state = { mode: 'main' }; root.className = 'on menu';
    const MODES = [['quick', 'Quick match', 'Pick two clubs and play one match'], ['career', 'Career', 'Manage a club through a league season'],
      ['tour', 'Tournament', 'Knockout cups: domestic, continental, world and nations'], ['regional', 'Regional tournaments', 'Rwanda league, Peace Cup, Kagame Cup, Nations Cup, Legends'], ['pc', 'Player career', 'Create a player and earn your next transfer'],
      ['train', 'Training', 'Ten drills, from shooting to one-two passing'], ['online', 'Online friendly', 'Play a friend over the internet with a room code']];
    const render = (focusSel) => {
      const C = api.clubs[api.sel[0]], K = (C.k && C.k[0]) || { c: C.c, c2: '#ffffff', d: 0 };
      root.innerHTML = '';
      const useStage = stageFor(api);
      const wrap = el('div', { class: 'mm' + (useStage ? ' has-stage' : ''), style: `--club:${K.c};--club2:${K.c2 === K.c ? '#ffe066' : K.c2};--acc:${accentOf(K.c, K.c2)};--art:url(${menuArt('stadium')})` });
      if (useStage) { wrap.append(useStage.el); const key = api.sel[0] + ':' + JSON.stringify(K); if (useStage.key !== key) { useStage.key = key; useStage.scene.show(api.stadium, api.look && api.look()); } }
      const club = el('aside', { class: 'mm-club' }, el('div', { class: 'mm-kit', html: kitSVG(K, C.crest) }),
        el('div', { class: 'mm-id' }, el('div', { class: 'mm-crest', html: crestSVG(C) }),
          el('div', {}, el('h2', {}, C.n), el('p', { style: 'display:flex;align-items:center;gap:6px' }, api.leagueLogo ? el('span', { class: 'mm-lg', html: api.leagueLogo }) : '', `Your club, rating ${C.s}${api.league ? ', ' + api.league : ''}`)),
          el('button', { class: 'mm-arrow', 'aria-label': 'Previous club', 'data-k': 'prev', onclick: () => { api.onCycle(-1); render('[data-k=prev]'); } }, '◀'),
          el('button', { class: 'mm-arrow', 'aria-label': 'Next club', 'data-k': 'next', onclick: () => { api.onCycle(1); render('[data-k=next]'); } }, '▶')));
      const modes = el('nav', { class: 'mm-modes', 'aria-label': 'Game modes' }, el('div', { class: 'mm-deck' }, ...MODES.map(([k, n, d]) => el('button', { class: 'mm-mode', 'data-k': k, onclick: () => api.onGo(k) }, el('b', {}, n), el('small', {}, d)))),
        el('div', { class: 'mm-links' }, el('button', { class: 'mm-link', 'data-k': 'cust', onclick: () => api.onGo('cust') }, 'Customise kits'), el('button', { class: 'mm-link', 'data-k': 'settings', onclick: () => api.onGo('settings') }, 'Settings'),
          api.counts ? el('button', { class: 'mm-link', 'data-k': 'world', onclick: () => api.onWorld() }, 'World editor') : ''));
      const foot = el('div', { class: 'mm-foot' }, el('div', { class: 'mm-step' }, 'Difficulty',
        el('button', { 'aria-label': 'Easier', 'data-k': 'dm', onclick: () => { api.onDiff(-1); render('[data-k=dm]'); } }, '◀'), el('span', {}, api.DN[api.diff]),
        el('button', { 'aria-label': 'Harder', 'data-k': 'dp', onclick: () => { api.onDiff(1); render('[data-k=dp]'); } }, '▶')),
        el('span', { class: 'mm-count' }, api.counts ? `${api.counts.clubs} fictional clubs and ${api.counts.players.toLocaleString()} players in ${api.counts.leagues} leagues` : 'Fictional clubs and players'));
      wrap.append(el('div', { class: 'mm-grid' }, el('h1', { class: 'mm-logo' }, el('span', {}, 'Ultimate'), el('span', {}, 'Football')), club, modes, foot));
      wrap.addEventListener('keydown', e => {
        const list = [...wrap.querySelectorAll('.mm-mode,.mm-link')], i = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus(); }
        else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && i >= 0) { e.preventDefault(); api.onCycle(e.key === 'ArrowRight' ? 1 : -1); render(`[data-k=${list[i].dataset.k}]`); }
      });
      root.append(wrap);
      (wrap.querySelector(focusSel || '.mm-mode') || wrap.querySelector('.mm-mode')).focus({ preventScroll: true });
    };
    render();
  },

  /** Quick match setup. api (live getters): { clubs, sel, leagues:[[id,name]], leagueId, WN, wx, DN, diff, onPick(side, idx), onLeague(id), onWeather(d), onDiff(d), onKickOff, onBack } */
  showQuick(api) {
    mount(); state = { mode: 'quick', onEscape: api.onBack }; root.className = 'on menu';
    const render = (focusSel) => {
      const n = api.clubs.length, C0 = api.clubs[api.sel[0]];
      root.innerHTML = '';
      const side = k => {
        const C = api.clubs[api.sel[k]], K = (C.k && C.k[k ? 1 : 0]) || { c: C.c, c2: '#fff', d: 0 }, step = d => { let i = (api.sel[k] + d + n) % n; if (i === api.sel[1 - k]) i = (i + d + n) % n; api.onPick(k, i); render(`[data-k=${k}${d > 0 ? 'n' : 'p'}]`); };
        const g = api.world && api.groupOf ? api.groupOf(k) : null, cyc = d => { if (g) { api.onCycle(k, d); render(`[data-k=${k}${d > 0 ? 'n' : 'p'}]`); } else step(d); };
        return el('div', { class: 'qm-side' }, el('small', {}, k ? 'Opponent (away kit)' : 'Your club (home kit)'), el('div', { class: 'qm-kit', html: kitSVG(K, C.crest) }),
          el('div', { class: 'qm-name' }, el('div', { class: 'qm-crest', html: crestSVG(C) }), el('h2', {}, C.n)),
          g ? el('small', { class: 'qm-league' }, el('span', { class: 'mm-lg', html: g.logo }), g.name) : '',
          el('div', { class: 'qm-rating', title: `Rating ${C.s}` }, el('i', { style: `width:${Math.max(8, Math.min(100, (C.s - 40) * 1.8))}%;background:${K.c}` })),
          el('small', {}, `Rating ${C.s}`),
          el('div', { class: 'qm-pick' }, el('button', { class: 'mm-arrow', 'data-k': k + 'p', 'aria-label': 'Previous club', onclick: () => cyc(-1) }, '◀'),
            g ? select(g.clubs, C.wid, v => { api.onPickWid(k, v); render(); }) : select(api.clubs.map((c, i) => [i, c.n]).filter(([i]) => i !== api.sel[1 - k]), api.sel[k], v => { api.onPick(k, v); render(); }),
            el('button', { class: 'mm-arrow', 'data-k': k + 'n', 'aria-label': 'Next club', onclick: () => cyc(1) }, '▶')),
          g ? el('button', { class: 'qm-change', 'data-k': k + 'c', onclick: () => api.onChange(k) }, 'Change league / team') : '');
      };
      const stepper = (label, names, v, f, key) => el('div', { class: 'mm-step' }, label,
        el('button', { 'aria-label': 'Previous ' + label, 'data-k': key + 'm', onclick: () => { f(-1); render(`[data-k=${key}m]`); } }, '◀'), el('span', {}, names[v]),
        el('button', { 'aria-label': 'Next ' + label, 'data-k': key + 'p', onclick: () => { f(1); render(`[data-k=${key}p]`); } }, '▶'));
      const wrap = el('div', { class: 'mm qm', style: `--art:url(${menuArt('tunnel')});--acc:${accentOf(C0.c, (C0.k && C0.k[0] && C0.k[0].c2) || '#fff1c9')};--c0:${C0.c};--c1:${((api.clubs[api.sel[1]].k || [])[1] || api.clubs[api.sel[1]]).c}` },
        el('div', { class: 'qm-grid' },
          el('div', { class: 'qm-head' }, el('button', { class: 'qm-back', onclick: api.onBack }, '◀ Back'), el('h1', {}, 'Quick match'),
            api.leagues && !api.world ? select(api.leagues, api.leagueId, v => { api.onLeague(v); render(); }) : ''),
          el('div', { class: 'qm-match' }, side(0), el('div', { class: 'qm-v' }, 'v'), side(1)),
          el('div', { class: 'qm-foot' }, stepper('Weather', api.WN, api.wx, api.onWeather, 'w'), stepper('Difficulty', api.DN, api.diff, api.onDiff, 'd'),
            el('button', { class: 'qm-go', 'data-k': 'go', onclick: api.onKickOff }, 'Kick off'))));
      root.append(wrap);
      (wrap.querySelector(focusSel || '[data-k=go]') || wrap.querySelector('[data-k=go]')).focus({ preventScroll: true });
    };
    render();
  },
  /** Match setup. api (live getters): { clubs, sel, pre, FN, TN, DSG, FM, WN, wx, DN, diff, stadium, onKit(k,d), onTactic(k,v), onPlan, onWeather(d), onDiff(d), onControl(v), onStart, onBack } */
  showSetup(api) {
    mount(); state = { mode: 'pre', onEscape: api.onBack }; root.className = 'on menu';
    const KN = ['Home', 'Away', 'Third'];
    const pitch = (f, pos) => `<svg viewBox="0 0 200 130" class="st-pitch" role="img" aria-label="${esc(api.FN[f])} formation"><rect x="2" y="2" width="196" height="126" rx="3" fill="#0f3a1f" stroke="rgba(255,255,255,.45)"/><line x1="100" y1="2" x2="100" y2="128" stroke="rgba(255,255,255,.3)"/><circle cx="100" cy="65" r="16" fill="none" stroke="rgba(255,255,255,.3)"/>${api.FM[f].map((q0, i) => { const q = (pos && pos[i]) || q0; return `<circle cx="${100 + q[0] * 90}" cy="${65 + q[1] * 55}" r="5" fill="#ffe066"/>`; }).join('')}</svg>`;
    const render = (focusSel) => {
      const P = api.pre, C = [api.clubs[api.sel[0]], api.clubs[api.sel[1]]], K = [0, 1].map(k => (C[k].k && C[k].k[P.k[k]]) || { c: C[k].c, c2: '#fff', d: 0 });
      root.innerHTML = '';
      const side = k => el('div', { class: 'qm-side' }, el('small', {}, k ? 'Opponent' : 'Your team'), el('div', { class: 'qm-kit st-kit', html: kitSVG(K[k], C[k].crest) }),
        el('div', { class: 'qm-name' }, el('div', { class: 'qm-crest', html: crestSVG(C[k]) }), el('h2', {}, C[k].n)),
        el('div', { class: 'st-rows' },
          el('div', { class: 'st-row' }, el('label', {}, 'Kit'), el('div', { class: 'mm-step' }, el('button', { 'aria-label': 'Previous kit', 'data-k': 'k' + k, onclick: () => { api.onKit(k, -1); render(`[data-k=k${k}]`); } }, '◀'),
            el('span', {}, `${KN[P.k[k]]}, ${(api.DSG[K[k].d] || '').toLowerCase()}`), el('button', { 'aria-label': 'Next kit', 'data-k': 'K' + k, onclick: () => { api.onKit(k, 1); render(`[data-k=K${k}]`); } }, '▶'))),
          el('div', { class: 'st-row' }, el('label', {}, 'Tactic'), select(api.TN.map((t, i) => [i, t]), P.t[k], v => { api.onTactic(k, v); render(); })),
          el('div', { class: 'st-row' }, el('label', {}, 'Formation'), el('span', { class: 'st-val' }, api.FN[P.f[k]])),
          el('div', { html: pitch(P.f[k], P.pos[k]) }),
          k ? '' : el('button', { class: 'qm-back st-plan', onclick: api.onPlan }, 'Edit line-up and positions')));
      const stepper = (label, names, v, f, key) => el('div', { class: 'mm-step' }, label,
        el('button', { 'aria-label': 'Previous ' + label, 'data-k': key + 'm', onclick: () => { f(-1); render(`[data-k=${key}m]`); } }, '◀'), el('span', {}, names[v]),
        el('button', { 'aria-label': 'Next ' + label, 'data-k': key + 'p', onclick: () => { f(1); render(`[data-k=${key}p]`); } }, '▶'));
      const P2M = [['1', '1 player'], ['vs', '2 players: versus'], ['coop', '2 players: co-op vs CPU']], P2D = [['kk', 'One keyboard (WASD + arrows)'], ['kp', 'Keyboard + controller'], ['pp', 'Two controllers']];
      const DEV = { kk: ['kbA', 'kbB'], kp: ['kbM', 'pad0'], pp: ['pad0', 'pad1'] }, cur = api.p2, curD = cur ? (cur.dev[0] === 'kbA' ? 'kk' : cur.dev[0] === 'kbM' ? 'kp' : 'pp') : 'kk';
      const players = api.onP2 && api.isQuick ? el('div', { class: 'st-players' }, select(P2M, cur ? cur.mode : '1', v => { api.onP2(v === '1' ? null : { mode: v, dev: DEV[curD] }); render(); }),
        cur ? select(P2D, curD, v => { api.onP2({ mode: cur.mode, dev: DEV[v] }); render(); }) : '',
        cur && curD === 'kk' ? el('small', {}, 'P1: WASD, F shoot, G pass, E skill. P2: arrows, K shoot, J pass, O skill. Some keyboards miss keys when many are held — a controller is smoother.') : '') : '';
      const ctl = api.isPC ? select([[1, `Control only ${api.proName || 'my player'}`], [0, 'Control the whole team']], api.pcSolo ? 1 : 0, v => { api.onPcSolo(!!v); render(); }) : select([[-1, 'Control the whole team'], ...api.FM[P.f[0]].map((q, i) => [i, `Control one player: #${i + 1} (${q[2]})`])], P.solo ? P.soloIdx : -1, v => { api.onControl(v); render(); });
      const wrap = el('div', { class: 'mm qm st', style: `--c0:${K[0].c};--c1:${K[1].c}` },
        el('div', { class: 'qm-grid' },
          el('div', { class: 'qm-head' }, el('button', { class: 'qm-back', onclick: api.onBack }, '◀ Back'), el('h1', {}, 'Match setup'), el('span', { class: 'st-venue' }, `Played at ${api.stadium}`)),
          el('div', { class: 'qm-match' }, side(0), el('div', { class: 'st-mid' }, el('div', { class: 'qm-v' }, 'v'), players, ctl), side(1)),
          el('div', { class: 'qm-foot' }, stepper('Weather', api.WN, api.wx, api.onWeather, 'w'), stepper('Difficulty', api.DN, api.diff, api.onDiff, 'd'),
            el('button', { class: 'qm-go', 'data-k': 'go', onclick: api.onStart }, 'Start match'))));
      root.append(wrap);
      (wrap.querySelector(focusSel || '[data-k=go]') || wrap.querySelector('[data-k=go]')).focus({ preventScroll: true });
    };
    render();
  },
};
