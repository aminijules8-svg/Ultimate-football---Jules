// Career and Player Career screens in the home-menu style, plus the shared player / manager creator
// with the live 3D preview. The game owns all state (src/game.js careerApi / creatorApi / pcApi).
import { overlay } from './overlay.js';
import { crestSVG, kitSVG } from './kitart.js';
import { open, frame, clubTiles, leaguePick } from './screens.js';
import { createPreview } from './editor3d.js';

const css = document.createElement('style');
css.textContent = `
.sw-row{display:flex;flex-wrap:wrap;gap:6px}
.sw{width:30px;height:30px;border-radius:8px;border:2px solid rgba(255,255,255,.15);padding:0}
.sw.on{border-color:#ffe066;box-shadow:0 0 0 2px rgba(255,224,102,.35)}
.sw:focus-visible{outline:2px solid #fff;outline-offset:2px}
.ed-wrap{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1.15fr);gap:16px;min-height:0}
.ed3d{position:relative;min-height:420px;height:min(64vh,620px);border-radius:14px;overflow:hidden;background:radial-gradient(80% 70% at 50% 35%,rgba(255,255,255,.12),rgba(3,10,6,.7))}
.ed3d-canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.ed3d-views{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.ed3d-views button{background:rgba(3,10,6,.75);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;padding:5px 12px;font:600 15px 'Barlow Condensed',sans-serif}
.ed3d-views button.on{background:#ffe066;color:#111;border-color:#ffe066}
.ed3d-hint{position:absolute;top:10px;left:0;right:0;text-align:center;font:400 12px Barlow,system-ui;color:#a9bcae}
.face-img{width:56px;height:64px;flex:none}.preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}.preset-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:6px;color:#dfe6ee;cursor:pointer;display:grid;gap:4px;text-align:center;font:600 11px Barlow,system-ui}.preset-card:hover{border-color:#ffe066}
.boot-filters{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.boot-filters select{max-width:150px}
.boot-fav{background:none;border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;padding:4px 10px;font:600 14px 'Barlow Condensed',sans-serif;cursor:pointer}
.boot-fav.on{background:#ffe066;color:#111;border-color:#ffe066}
.boot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:min(44vh,420px);overflow:auto;padding:2px}
.boot-card{position:relative;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.12);border-radius:12px;padding:6px 6px 8px;color:#fff;text-align:left;cursor:pointer;display:grid;gap:4px}
.boot-card:hover{border-color:rgba(255,255,255,.4)}.boot-card.on{border-color:#ffe066;box-shadow:0 0 0 2px rgba(255,224,102,.35)}
.boot-card img{width:100%;height:auto;aspect-ratio:2/1;border-radius:8px;background:rgba(0,0,0,.25);display:block}
.boot-card b{font:600 15px 'Barlow Condensed',sans-serif;line-height:1.1}.boot-card small{font:400 11px Barlow,system-ui;color:#a9bcae}
.boot-card .heart{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;border:none;background:rgba(3,10,6,.7);color:#fff;font-size:14px;cursor:pointer;line-height:26px;padding:0}
.boot-card .heart.on{color:#ffe066}
.cal-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.cal-head b{font:700 22px 'Barlow Condensed',sans-serif;color:#fff}
.cal-months{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.cal-month h4{margin:0 0 6px;font:600 17px 'Barlow Condensed',sans-serif;color:#fff}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.cal-grid .wd{font:600 10px Barlow,system-ui;color:#8fa596;text-align:center}
.cal-day{min-height:44px;background:rgba(255,255,255,.04);border-radius:6px;padding:3px 4px;font:400 11px Barlow,system-ui;color:#8fa596}.cal-day.has{background:rgba(255,255,255,.09)}.cal-day.nx{outline:2px solid #ffe066}
.cal-ev{display:flex;align-items:center;gap:4px;margin-top:2px;color:#fff;font:600 11px Barlow,system-ui;line-height:1.1}.cal-ev .ct-crest{width:16px;height:16px;flex:none}.cal-ev.cup{color:#9be3b0}.cal-ev.nx{color:#ffe066}.cal-ev small{color:#a9bcae;font-weight:400}
.cal-hist td,.cal-hist th{padding:3px 8px;font:400 13px Barlow,system-ui;color:#d7e3da;text-align:left}.cal-hist th{color:#8fa596;font-size:11px;text-transform:uppercase}
.del-list{margin:6px 0 0;padding-left:18px;color:#fca5a5;font:400 13px Barlow,system-ui}.del-list li{margin:2px 0}.danger-zone{border-color:rgba(248,113,113,.35)}
.sv-card{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center}
.hub-head{display:flex;align-items:center;gap:12px;margin-left:auto}
.hub-head small{display:block;font:400 13px Barlow,system-ui;color:#a9bcae}
.vs{display:grid;grid-template-columns:48px 1fr auto 1fr 48px;gap:10px;align-items:center;font:600 22px 'Barlow Condensed',sans-serif;color:#fff}
.vs .ct-crest{width:48px;height:48px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.stat-grid div{background:rgba(255,255,255,.06);border-radius:10px;padding:8px 10px;font:400 12px Barlow,system-ui;color:#9be3b0}
.stat-grid b{display:block;font:600 22px 'Barlow Condensed',sans-serif;color:#fff}
.bar{height:10px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden}
.bar i{display:block;height:100%}
.attr-row{display:grid;grid-template-columns:100px 1fr 70px 34px;gap:10px;align-items:center;font:500 14px Barlow,system-ui;color:#fff}
.scr-tab:focus-visible{outline:0;color:#ffe066}
.kit-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.kit-tab{display:grid;justify-items:center;gap:4px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:8px;color:#cfdcd2;font:600 16px 'Barlow Condensed',sans-serif}
.kit-tab.on{border-color:#ffe066;color:#fff;background:rgba(255,224,102,.1)}
.kit-tab div{width:72px;height:72px}
.colin{width:36px;height:30px;border:0;padding:0;background:none;border-radius:8px}
.pitch{position:relative;aspect-ratio:105/68;width:100%;max-height:62vh;border-radius:12px;background:repeating-linear-gradient(90deg,#166534 0 10%,#15803d 10% 20%);border:2px solid rgba(255,255,255,.55);touch-action:none}
.pitch:before{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:2px solid rgba(255,255,255,.5)}
.pitch:after{content:'';position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;border:2px solid rgba(255,255,255,.5);border-radius:50%;transform:translate(-50%,-50%)}
.pitch i{position:absolute;top:20%;bottom:20%;width:14%;border:2px solid rgba(255,255,255,.5)}
.tok{position:absolute;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:2px;background:none;border:0;padding:0;cursor:grab;z-index:2;touch-action:none}
.tok b{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--c);border:2px solid #fff;color:#fff;font:700 14px Barlow,system-ui;text-shadow:0 1px 2px #000}
.tok span{font:600 12px Barlow,system-ui;color:#fff;text-shadow:0 1px 3px #000;white-space:nowrap}
.tok.sel b,.bench-row.sel{outline:3px solid #ffe066;outline-offset:2px}
.tok b{position:relative}
.tok.pro b:after{content:'★';position:absolute;top:-9px;right:-9px;color:#ffe066;font-size:15px}
.tok.drag{opacity:.35}
.ghost{position:fixed;z-index:50;pointer-events:none;transform:translate(-50%,-50%);background:#ffe066;color:#111;border-radius:16px;padding:4px 10px;font:700 13px Barlow,system-ui}
.bench-row{display:grid;grid-template-columns:44px 1fr 34px;gap:8px;align-items:center;width:100%;cursor:grab;touch-action:none;font:500 14px Barlow,system-ui}
.plan-wrap{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,1fr);gap:16px;align-items:start}
@media (max-width:860px){.plan-wrap{grid-template-columns:1fr}}
.stats-card{width:min(640px,92vw);max-height:94vh;overflow:auto;background:rgba(5,12,8,.94);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:20px 24px;display:grid;gap:14px}
.stats-score{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;color:#fff}
.stats-score .tm{display:flex;align-items:center;gap:10px;font:600 22px 'Barlow Condensed',sans-serif}
.stats-score .tm.r{justify-content:flex-end;text-align:right}
.stats-score .sc{font:800 italic 44px 'Barlow Condensed',sans-serif;letter-spacing:.04em}
.stats-gl{display:grid;grid-template-columns:1fr 1fr;gap:12px;font:400 13px Barlow,system-ui;color:#cfdcd2}
.stats-gl div:last-child{text-align:right}
.ss-row{display:grid;grid-template-columns:70px 1fr 70px;column-gap:10px;row-gap:3px;align-items:center;font:700 16px Barlow,system-ui;color:#fff}
.ss-row span{text-align:center;font:400 13px Barlow,system-ui;color:#a9bcae}
.ss-row b:nth-child(3){text-align:right}
.ss-bar{grid-column:1/-1;display:flex;gap:2px;height:5px}
.ss-bar i{display:block;border-radius:3px;min-width:2px}
.scr-btn[disabled]{opacity:.45;pointer-events:none}
@media (max-width:760px){.ed-wrap{grid-template-columns:1fr}.ed3d{height:46vh;min-height:300px}}
`;
document.head.append(css);

const focusFirst = (H, sel) => { const n = H.root.querySelector(sel); if (n) n.focus({ preventScroll: true }); };

/** "Are you sure?" dialog on top of the current screen. */
export function confirmBox(H, title, text, yes, onYes, items = []) {
  const { el } = H, prev = document.activeElement;
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus({ preventScroll: true }); };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const m = el('div', { class: 'scr-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, onclick: e => { if (e.target === m) close(); } },
    el('div', {}, el('h3', { style: "margin:0;font:600 24px 'Barlow Condensed',sans-serif;color:#fff" }, title), el('p', { class: 'scr-note' }, text),
      items.length ? el('ul', { class: 'del-list' }, ...items.map(t => el('li', {}, t))) : '',
      el('div', { class: 'scr-foot' }, el('button', { class: 'scr-btn', onclick: close }, 'Cancel'), el('button', { class: 'scr-btn danger', onclick: () => { close(); onYes(); } }, yes))));
  document.addEventListener('keydown', onKey, true); H.root.append(m); m.querySelector('.scr-btn').focus();
}
/** Career settings panels shared by both careers: save now, my saves, danger zone with the explicit delete dialog. */
function careerSettings(H, { api, what, deleteLabel, onDelete, render }) {
  const { el } = H, tr = api.trash;
  return [el('div', { class: 'scr-panel' }, el('h3', {}, 'Save'), el('p', { class: 'scr-note' }, 'Progress also saves itself after every match and every edit.'),
      el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, el('button', { class: 'scr-btn go', onclick: () => { api.onSaveNow ? api.onSaveNow() : api.onSave(); render(); } }, 'Save now'), el('button', { class: 'scr-btn', onclick: api.onSaves }, 'My saves'))),
    el('div', { class: 'scr-panel danger-zone' }, el('h3', {}, 'Danger zone'), el('p', { class: 'scr-note' }, `Deleting removes this ${what} from this browser. The last deleted ${what} can be restored from My saves for 24 hours.`),
      tr ? el('p', { class: 'scr-note' }, `In the bin: ${tr.title} (${tr.left} h left).`) : '',
      el('div', {}, el('button', { class: 'scr-btn danger', onclick: () => confirmBox(H, `Delete this ${what}?`, 'This removes:', deleteLabel, onDelete, api.deleteInfo) }, deleteLabel)))];
}
const trashCard = (H, api, render) => { const tr = api.trash; return tr ? H.el('div', { class: 'scr-card', style: '--c:#9be3b0;display:grid;gap:6px' }, H.el('b', {}, 'Restore last deleted'), H.el('small', {}, `${tr.title} · deleted ${tr.age} min ago · ${tr.left} h left`), H.el('button', { class: 'scr-btn', onclick: () => { api.onRestore(); render(); } }, 'Restore')) : ''; };

const swatches = (H, list, cur, on, label) => H.el('div', { class: 'sw-row', role: 'radiogroup', 'aria-label': label },
  ...list.map((c, i) => H.el('button', { class: 'sw' + (cur(c, i) ? ' on' : ''), style: `background:${c}`, 'aria-label': `${label} ${i + 1}`, onclick: () => on(c, i) })));

const table = (H, rows) => H.el('table', { class: 'scr-table' },
  H.el('tr', {}, ...['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts'].map(t => H.el('th', {}, t))),
  ...rows.map((r, k) => H.el('tr', { class: r.me ? 'me' : '' }, ...[k + 1, r.n, r.p, r.w, r.d, r.l, (r.gf - r.ga > 0 ? '+' : '') + (r.gf - r.ga), r.pts].map(v => H.el('td', {}, String(v))))));

const savesList = (H, api, kind) => {
  const { el } = H;
  return el('div', { class: 'scr-cards', style: 'grid-template-columns:repeat(auto-fill,minmax(320px,1fr))' },
    ...api.saves.map((s, i) => el('div', { class: 'scr-card sv-card' }, el('div', { class: 'face-img' }, api.faceImg(s.face, s.pf)),
      el('button', { class: 'scr-btn', style: 'background:none;border:0;padding:0', onclick: () => api.onLoad(i) }, el('b', { style: "display:block;font:600 21px 'Barlow Condensed',sans-serif" }, s.t), el('small', { class: 'scr-note' }, s.s)),
      el('button', { class: 'scr-btn danger', 'aria-label': 'Delete ' + s.t, onclick: () => confirmBox(H, 'Delete this save?', `${s.t} will be removed. This cannot be undone.`, 'Delete', () => api.onDelete(i)) }, 'Delete'))),
    api.saves.length < 7 ? el('button', { class: 'scr-card', style: '--c:#ffe066', onclick: api.onNew }, el('b', {}, kind === 'pc' ? '+ New player' : '+ New career'), el('small', {}, kind === 'pc' ? 'Create a footballer and pick his first club.' : 'Choose a club and build your manager.')) : '',
    trashCard(H, api, () => api._render && api._render()));
};

const clubPick = (H, api, render, sub) => {
  const { el } = H;
  return [el('div', { class: 'scr-panel' }, el('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' }, el('h3', {}, 'Choose your club'), el('span', { class: 'scr-note' }, sub),
    api.league && !api.leagues ? el('div', { class: 'mm-step', style: 'margin-left:auto' }, el('button', { 'aria-label': 'Previous league', onclick: () => { api.onLeague(-1); render(); } }, '◀'), el('span', { style: 'min-width:220px' }, api.league), el('button', { 'aria-label': 'Next league', onclick: () => { api.onLeague(1); render(); } }, '▶')) : ''),
    api.leagues ? leaguePick(H, api.leagues) : clubTiles(H, api.clubs, i => api.onPickClub(i))),
  api.canCreate ? el('div', {}, el('button', { class: 'scr-btn', onclick: api.onCreateClub }, '+ Create your own club')) : ''];
};

Object.assign(overlay, {
  /** Manager career. api: see careerApi() in src/game.js */
  showCareer(api) {
    const H = open('career', () => api.onBack()), { el, select } = H;
    const render = () => {
      H.root.innerHTML = '';
      if (api.view === 'saves') {
        H.root.append(frame(H, { title: 'Career', onBack: api.onBack, body: [el('p', { class: 'scr-note' }, 'Your saved careers. Load one, or start a new one.'), savesList(H, api, 'c')] }));
        return focusFirst(H, '.sv-card .scr-btn, .scr-card');
      }
      if (api.view === 'club') {
        H.root.append(frame(H, { title: 'New career', onBack: api.onBack, body: clubPick(H, api, render, `Manage them for a ${api.clubs.length - 1}-match league season`) }));
        return focusFirst(H, '.club-tile');
      }
      const D = api.hub, C = D.club;
      if (api.sub === 'settings') {
        H.root.append(frame(H, { title: 'Career settings', onBack: () => { api.onSub('hub'); render(); }, club: C.c, body: careerSettings(H, { api, what: 'career', deleteLabel: 'Delete career', onDelete: api.onDeleteCareer, render }) }));
        return focusFirst(H, '.scr-btn');
      }
      if (api.sub === 'calendar') {
        H.root.append(frame(H, { title: 'Calendar', onBack: () => { api.onSub('hub'); render(); }, club: C.c, body: calendarView(H, api.calendar, { myCrest: crestSVG(C), onPlay: D.next && !D.sacked ? api.onPlay : null, onSim: D.next && !D.sacked ? () => { api.onSimNext(); render(); } : null, onNewSeason: !D.next ? () => { api.onNewSeason(); render(); } : null }) }));
        return focusFirst(H, '.scr-btn');
      }
      let main;
      if (D.sacked) main = el('div', { class: 'scr-panel' }, el('h3', { style: 'color:#f87171' }, 'You have been sacked'), el('p', {}, 'The board has run out of patience. Another club may still want you.'),
        el('button', { class: 'scr-btn go', onclick: () => { api.onTakeJob(); render(); } }, 'Take another job'));
      else if (!D.next) main = el('div', { class: 'scr-panel', style: 'justify-items:center;text-align:center' }, el('h3', {}, 'Season complete'), el('div', { style: 'width:110px;height:110px', html: crestSVG(D.champ) }),
        el('p', { style: 'font-size:16px;color:#fff' }, D.won ? 'You won the league!' : `${D.champ.n} are champions.`), el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center' }, el('button', { class: 'scr-btn go', onclick: () => { api.onNewSeason(); render(); } }, `Next season (${C.n})`), el('button', { class: 'scr-btn', onclick: api.onNewCareer }, 'Start a new career')));
      else {
        const O = D.next.opp;
        main = el('div', { class: 'scr-panel' }, el('h3', {}, `Matchday ${D.next.wk} of ${D.next.of}`, el('small', { class: 'scr-note', style: 'margin-left:10px' }, D.next.date || '')),
          el('div', { class: 'vs' }, el('div', { class: 'ct-crest', html: crestSVG(C) }), el('span', {}, C.n), el('small', { class: 'scr-note' }, D.next.home ? 'home' : 'away'), el('span', { style: 'text-align:right' }, O.n), el('div', { class: 'ct-crest', html: crestSVG(O) })),
          el('button', { class: 'scr-btn go', onclick: api.onPlay }, 'Play match'),
          el('div', { class: 'scr-cols', style: 'grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px' },
            el('button', { class: 'scr-btn', onclick: () => { api.onSub('calendar'); render(); } }, `Calendar  ·  ${D.season}`),
            el('button', { class: 'scr-btn', onclick: api.onTransfers }, `Transfers  ·  €${D.budget}M`),
            el('button', { class: 'scr-btn', onclick: api.onNews }, `News centre${D.newsN ? `  (${D.newsN})` : ''}`),
            el('button', { class: 'scr-btn', disabled: D.yp ? null : '', onclick: () => { api.onYouth(); render(); } }, `Youth academy  (${D.yp})`)),
          el('div', { class: 'scr-row' }, el('span', {}, 'Team style'), select(D.MS.map((m, i) => [i, m]), D.style, v => { api.onStyle(v); render(); })));
      }
      const prop = api.proposal, propPanel = prop ? el('div', { class: 'scr-panel' }, el('h3', {}, `New kit for ${prop.season}`), el('p', { class: 'scr-note' }, 'The kit maker proposes a fresh home design for the new season. Adopt it, or keep this year’s kits (you can always edit them in Customise kits).'),
        el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:360px' }, el('div', { style: 'text-align:center' }, el('div', { class: 'qm-kit', style: 'width:120px;height:120px;margin:0 auto', html: kitSVG(prop.cur, prop.crest) }), el('small', { class: 'scr-note' }, 'Current')), el('div', { style: 'text-align:center' }, el('div', { class: 'qm-kit', style: 'width:120px;height:120px;margin:0 auto', html: kitSVG(prop.next, prop.crest) }), el('small', { class: 'scr-note' }, 'Proposed'))),
        el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, el('button', { class: 'scr-btn go', onclick: () => { api.onKitAccept(); render(); } }, 'Adopt the new kit'), el('button', { class: 'scr-btn', onclick: () => { api.onKitKeep(); render(); } }, 'Keep this year’s kits'))) : '';
      H.root.append(frame(H, { title: 'Career', onBack: api.onBack, club: C.c,
        right: el('div', { class: 'hub-head' }, el('div', { class: 'face-img' }, api.faceImg(D.face, D)), el('div', {}, el('b', { style: 'color:#fff;font-size:16px' }, D.mn), el('small', {}, `Manager of ${C.n}${D.league ? ' · ' + D.league : ''}`)), el('div', { class: 'ct-crest', style: 'width:48px;height:48px', html: crestSVG(C) })),
        body: el('div', { class: 'scr-cols' }, el('div', { style: 'display:grid;gap:16px;align-content:start' }, main, propPanel),
          el('div', { class: 'scr-panel' }, el('h3', {}, 'League table'), table(H, D.table)),
          el('div', { class: 'scr-panel' }, el('h3', {}, 'Latest'), ...(D.log.length ? D.log.map(l => el('p', {}, l)) : [el('p', {}, 'No matches played yet.')]))),
        foot: [el('button', { class: 'scr-btn', onclick: api.onSaves }, 'My saves'), el('button', { class: 'scr-btn', onclick: () => { api.onSub('settings'); render(); } }, 'Career settings')] }));
      focusFirst(H, '.scr-btn.go, .scr-btn');
    };
    api._render = render;
    render();
  },

  /** Player / manager creator with the live 3D preview. api: see creatorApi() in src/game.js */
  showCreator(api) {
    const H = open('face', () => api.onBack()), { el, select } = H, E = api.edit, pc = api.kind === 'pc';
    let view = pc ? 'body' : 'face';
    const box = el('div', { class: 'ed3d' }, el('div', { class: 'ed3d-hint' }, 'Drag to turn · scroll to zoom'));
    const views = el('div', { class: 'ed3d-views' });
    const prev = createPreview(box, { view });
    let tm = 0; const refresh = () => { clearTimeout(tm); tm = setTimeout(() => prev.update(api.look()), 60); };
    const renderViews = () => { views.innerHTML = ''; [['face', 'Face'], ['body', 'Body'], ['back', 'Back'], ['boots', 'Boots']].forEach(([k, n]) => views.append(el('button', { class: view === k ? 'on' : '', onclick: () => { view = k; prev.setView(k); renderViews(); } }, n))); };
    box.append(views); renderViews();
    const controls = el('div', { class: 'scr-body', style: 'padding:0' });
    const row = (label, ctl) => el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, label), el('div', {}, ctl));
    const renderCtl = () => {
      controls.innerHTML = '';
      const set = (fn, v) => { fn(); renderCtl(); refresh(); if (v) { view = v; prev.setView(v); renderViews(); } };
      controls.append(
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Start from a preset'), el('p', { class: 'scr-note' }, 'Twenty looks to start from. Everything stays editable below.'),
          el('div', { class: 'preset-grid' }, ...api.presets.map((n, i) => el('button', { class: 'preset-card', title: n, onclick: () => set(() => api.onPreset(i)) }, el('div', { class: 'face-img', style: 'width:100%;height:auto;aspect-ratio:7/8' }, api.presetImg(i)), el('small', {}, n))))),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Identity'),
          row('Name', el('input', { type: 'text', class: 'scr-in', maxlength: 22, value: E.nm, placeholder: pc ? 'Player One' : 'Manager One', oninput: e => { E.nm = e.target.value; clearTimeout(tm); tm = setTimeout(() => prev.update(api.look()), 400); } })),
          pc ? el('p', {}, `${api.pos} at ${api.club.n}. Your name goes on the back of the shirt.`) : el('p', {}, `New manager of ${api.club.n}.`)),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Look'),
          row('Skin tone', swatches(H, api.SK, (c, i) => E.tone === i, (c, i) => set(() => { E.tone = i; }), 'Skin tone')),
          row('Hairstyle', select(api.HSN.map((n, i) => [i, n]), E.hair, v => set(() => { E.hair = v; }, 'face'))),
          row('Hair colour', swatches(H, api.HCP, c => E.hc === c, c => set(() => { E.hc = c; }), 'Hair colour')),
          row('Facial hair', select([[0, 'None'], [1, 'Stubble'], [2, 'Short beard'], [3, 'Full beard']], E.beard | 0, v => set(() => { E.beard = +v; }, 'face')))),
        pc ? el('div', { class: 'scr-panel' }, el('h3', {}, 'Body'),
          row('Body type', select([[-1, 'Custom (sliders only)'], ...api.ARCH.map(([n, d], i) => [i, n])], E.body.arch == null ? -1 : E.body.arch, v => set(() => { E.body.arch = +v < 0 ? null : +v; }, 'body'))),
          E.body.arch != null ? el('p', { class: 'scr-note' }, api.ARCH[E.body.arch][1]) : '',
          ...[['Height', 'h'], ['Build', 'w'], ['Arm length', 'wing'], ['Leg length', 'leg']].map(([n, k]) => row(n, H.range(Math.round(E.body[k] * 100), v => { E.body[k] = v / 100; refresh(); }))),
          el('p', {}, 'Taller players defend better but lose a little pace; heavier builds are stronger and slower.')) : '',
        pc ? el('div', { class: 'scr-panel' }, el('h3', {}, 'Boots'), el('p', { class: 'scr-note' }, 'Fifty-four boots from nine makers. Heart the ones you like; the preview turns to your feet when you pick.'),
          bootCatalogue(H, api.boots, () => { refresh(); view = 'boots'; prev.setView('boots'); renderViews(); })) : '');
    };
    renderCtl();
    const wrap = frame(H, { title: pc ? 'Create your player' : 'Create your manager', onBack: api.onBack, club: api.club.c,
      body: el('div', { class: 'ed-wrap' }, box, controls),
      foot: [el('button', { class: 'scr-btn go', onclick: () => api.onConfirm() }, pc ? 'Start my career' : 'Take the job')] });
    H.root.innerHTML = ''; H.root.append(wrap);
    // the preview lives as long as this screen: dispose when the overlay is cleared or replaced
    const mo = new MutationObserver(() => { if (!H.root.contains(box)) { mo.disconnect(); prev.dispose(); } });
    mo.observe(H.root, { childList: true });
    prev.update(api.look());
    focusFirst(H, 'input');
  },
});

/** Boots catalogue: filters (brand / line / colour / favourites), a grid of painted cards, the current pick highlighted.
 *  B = api.boots (list, brands, lines, fams, thumb, cur, pick, isFav, toggleFav); onPick(id) runs after B.pick. */
const bootFilter = { brand: '', line: '', fam: '', fav: false };
function bootCatalogue(H, B, onPick) {
  const { el, select } = H, F = bootFilter, wrap = el('div', {});
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const render = () => {
    wrap.innerHTML = '';
    const list = B.list.filter(d => (!F.brand || d.brandId === F.brand) && (!F.line || d.line === F.line) && (!F.fam || d.fam === F.fam) && (!F.fav || B.isFav(d.id)));
    const cur = B.list[B.cur] || B.list[0];
    wrap.append(
      el('div', { class: 'boot-filters' },
        select([['', 'All brands'], ...B.brands], F.brand, v => { F.brand = v; render(); }),
        select([['', 'All lines'], ...B.lines], F.line, v => { F.line = v; render(); }),
        select([['', 'All colours'], ...B.fams.map(f => [f, cap(f)])], F.fam, v => { F.fam = v; render(); }),
        el('button', { class: 'boot-fav' + (F.fav ? ' on' : ''), 'aria-pressed': F.fav ? 'true' : 'false', onclick: () => { F.fav = !F.fav; render(); } }, '♥ Favourites'),
        el('small', { style: 'color:#a9bcae;margin-left:auto' }, `${list.length} of ${B.list.length}`)),
      el('p', { class: 'scr-note' }, `Wearing ${cur.name} · ${cur.colours} · ${cur.desc}`),
      list.length ? el('div', { class: 'boot-grid', role: 'radiogroup', 'aria-label': 'Boots' }, ...list.map(d => el('div', { class: 'boot-card' + (d.id === B.cur ? ' on' : ''), role: 'radio', 'aria-checked': d.id === B.cur ? 'true' : 'false', tabindex: 0, title: `${d.name} · ${d.colours}`,
        onclick: () => { B.pick(d.id); onPick(d.id); render(); }, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); B.pick(d.id); onPick(d.id); render(); } } },
        el('img', { src: B.thumb(d), alt: '' }), el('b', {}, d.name), el('small', {}, `${d.colours} · ${d.lineName.toLowerCase()} · ${d.finish}`),
        el('button', { class: 'heart' + (B.isFav(d.id) ? ' on' : ''), 'aria-label': (B.isFav(d.id) ? 'Remove from' : 'Add to') + ' favourites: ' + d.name, onclick: e => { e.stopPropagation(); B.toggleFav(d.id); render(); } }, B.isFav(d.id) ? '♥' : '♡'))))
      : el('p', { class: 'scr-note' }, F.fav ? 'No favourites yet. Tap ♡ on a boot to keep it here.' : 'No boots match these filters.'));
  };
  render(); return wrap;
}

/** Season calendar: next fixture with Play / Simulate, month grids with crest chips (H/A, competition, result), season history. */
function calendarView(H, cal, { onPlay, onSim, onNewSeason, myCrest }) {
  const { el } = H, WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const nx = cal.next;
  const nextPanel = nx ? el('div', { class: 'scr-panel' }, el('h3', {}, `Next: ${nx.comp} · ${nx.label}`),
    el('div', { class: 'vs' }, el('div', { class: 'ct-crest', html: myCrest }), el('span', {}, nx.home ? 'Home' : 'Away'), el('small', { class: 'scr-note' }, 'v'), el('span', { style: 'text-align:right' }, nx.opp.n), el('div', { class: 'ct-crest', html: nx.opp.crest })),
    el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, onPlay ? el('button', { class: 'scr-btn go', onclick: onPlay }, 'Play match') : '', onSim ? el('button', { class: 'scr-btn', onclick: onSim }, 'Simulate match') : ''))
    : el('div', { class: 'scr-panel' }, el('h3', {}, 'Season complete'), onNewSeason ? el('button', { class: 'scr-btn go', onclick: onNewSeason }, 'Start next season') : '');
  const months = el('div', { class: 'cal-months' }, ...cal.months.map(M => el('div', { class: 'cal-month' }, el('h4', {}, M.label),
    el('div', { class: 'cal-grid' }, ...WD.map(w => el('div', { class: 'wd' }, w)), ...Array.from({ length: M.start }, () => el('div', {})),
      ...M.days.map(D => el('div', { class: 'cal-day' + (D.events.length ? ' has' : '') + (D.events.some(e => e.next) ? ' nx' : ''), title: D.events.map(e => `${e.comp}: ${e.home ? 'v' : 'at'} ${e.opp.n}${e.res ? ` (${e.res[0]}–${e.res[1]})` : ''}`).join('\n') }, String(D.d),
        ...D.events.map(e => el('div', { class: 'cal-ev' + (e.cup ? ' cup' : '') + (e.next ? ' nx' : '') }, el('div', { class: 'ct-crest', html: e.opp.crest }), el('span', {}, `${e.home ? 'H' : 'A'} ${e.opp.a}`), e.res ? el('small', {}, `${e.res[0]}–${e.res[1]}`) : e.cup ? el('small', {}, 'cup') : ''))))))));
  const hist = cal.hist && cal.hist.length ? el('div', { class: 'scr-panel' }, el('h3', {}, 'Past seasons'), el('table', { class: 'cal-hist' }, el('tr', {}, ...['Season', 'Club', 'Pos', 'P', 'W', 'D', 'L', 'Pts', 'Champions', 'Cup'].map(t => el('th', {}, t))),
    ...cal.hist.map(h => el('tr', {}, ...[h.season, h.club, h.pos, h.w + h.d + h.l, h.w, h.d, h.l, h.pts, h.champion, h.cup || ''].map(v => el('td', {}, String(v))))))) : '';
  return el('div', { style: 'display:grid;gap:12px' },
    el('div', { class: 'cal-head' }, el('b', {}, `Season ${cal.season}`), el('small', { class: 'scr-note' }, `Starts ${cal.start} · ${cal.events} fixtures · played ${cal.played}: ${cal.record.w}W ${cal.record.d}D ${cal.record.l}L`)),
    nextPanel, el('div', { class: 'scr-panel' }, el('h3', {}, 'Fixtures'), el('p', { class: 'scr-note' }, 'League on Saturdays, cup ties on Wednesdays. Yellow = next match, green = cup.'), months), hist);
}

const bar = (H, v, c) => H.el('div', { class: 'bar' }, H.el('i', { style: `width:${Math.max(0, Math.min(100, v))}%;background:${c || (v > 60 ? '#4ade80' : v > 35 ? '#facc15' : '#f87171')}` }));
const growth = (hist) => {
  const H0 = hist.length ? hist : [0], mx = Math.max(100, ...H0), pts = H0.map((v, i) => `${H0.length > 1 ? i / (H0.length - 1) * 400 : 0},${120 - v / mx * 110}`).join(' ');
  return `<svg viewBox="-4 0 408 124" style="width:100%;height:auto"><rect x="0" y="0" width="400" height="120" fill="none" stroke="rgba(255,255,255,.15)"/><polyline points="${pts}" fill="none" stroke="#4ade80" stroke-width="3" stroke-linejoin="round"/></svg>`;
};

Object.assign(overlay, {
  /** Player Career. api: see pcApi() in src/game.js */
  showPC(api) {
    const H = open('pc', () => api.onBack()), { el, select, range } = H;
    let box = null, prev = null, edTab = 0, view = 'body';
    const mo = new MutationObserver(() => { if (prev && !H.root.contains(box)) { prev.dispose(); prev = box = null; } if (!H.root.isConnected || !H.root.children.length) mo.disconnect(); });
    mo.observe(H.root, { childList: true });
    const card = (title, sub, onclick, opts = {}) => el('button', { class: 'scr-card' + (opts.on ? ' sel' : ''), style: opts.on ? '--c:#ffe066;border-color:#ffe066' : '', disabled: opts.off ? '' : null, onclick }, el('b', {}, title), el('small', {}, sub));
    const row = (label, ctl) => el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, label), el('div', {}, ctl));
    const render = () => {
      H.root.innerHTML = '';
      if (api.view === 'saves') { H.root.append(frame(H, { title: 'Player Career', onBack: api.onBack, body: [el('p', { class: 'scr-note' }, 'Your saved players. Load one, or create a new one.'), savesList(H, api, 'pc')] })); return focusFirst(H, '.sv-card .scr-btn, .scr-card'); }
      if (api.view === 'pos') { H.root.append(frame(H, { title: 'New player', onBack: api.onBack, body: [el('p', { class: 'scr-note' }, 'Choose your position. Your playstyle comes next.'), ...api.posGroups.map(([g, list]) => el('div', { class: 'scr-panel' }, el('h3', {}, g), el('div', { class: 'scr-cards' }, ...list.map(([v, n, d]) => card(n, d, () => { api.onPos(v); render(); }, { on: api.pos === v })))))] })); return focusFirst(H, '.scr-card'); }
      if (api.view === 'style') { H.root.append(frame(H, { title: 'New player', onBack: () => { api.onBack(); render(); }, body: [el('p', { class: 'scr-note' }, `Playstyle for a ${api.posName}. It shapes how you and your team-mates move; you stay in control.`), el('div', { class: 'scr-cards' }, ...api.styles(api.pos).map(([id, n, d]) => card(n, d, () => { api.onStyle(id); render(); })))] })); return focusFirst(H, '.scr-card'); }
      if (api.view === 'club') { H.root.append(frame(H, { title: 'New player', onBack: () => { api.onBack(); render(); }, body: clubPick(H, api, render, 'Your first professional club') })); return focusFirst(H, '.club-tile'); }
      const P = api.P, D = api.hub, C = D.club, t = api.tab, sb = api.sub, go = (a, b) => { api.onTab(a, b); render(); }, act = fn => (...a) => { fn(...a); render(); };
      const tabs = el('div', {}, el('div', { class: 'scr-tabs', role: 'tablist' }, ...api.PCT.map((q, i) => el('button', { class: 'scr-tab' + (t === i ? ' on' : ''), role: 'tab', 'aria-selected': String(t === i), onclick: () => go(i, 0) }, q[0].charAt(0) + q[0].slice(1).toLowerCase()))),
        el('div', { class: 'scr-tabs', style: 'margin-top:4px' }, ...api.PCT[t][1].map((n, i) => el('button', { class: 'scr-btn' + (sb === i ? ' sel' : ''), style: 'font-size:15px;padding:5px 12px', onclick: () => go(t, i) }, n))));
      let body;
      if (t === 0 && sb === 0) {
        const N = D.next;
        const play = N ? el('div', { class: 'scr-panel' }, el('h3', {}, N.label),
          el('div', { class: 'vs' }, el('div', { class: 'ct-crest', html: crestSVG(C) }), el('span', {}, C.n), el('small', { class: 'scr-note' }, 'v'), el('span', { style: 'text-align:right' }, N.opp.n), el('div', { class: 'ct-crest', html: crestSVG(N.opp) })),
          el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, el('button', { class: 'scr-btn go', disabled: D.inj ? '' : null, onclick: api.onPlay }, D.inj ? `Injured — ${D.inj} wk` : 'Play match'), el('button', { class: 'scr-btn', onclick: act(api.onSim) }, 'Simulate match')),
          D.world ? el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, el('button', { class: 'scr-btn', onclick: api.onOffers }, `Interested clubs${D.offersN ? ` (${D.offersN})` : ''}`), el('button', { class: 'scr-btn', onclick: api.onNews }, `News centre${D.newsN ? ` (${D.newsN})` : ''}`)) : '')
          : el('div', { class: 'scr-panel' }, el('h3', {}, 'Season complete'), el('button', { class: 'scr-btn go', onclick: act(api.onNewSeason) }, 'Start a new season'));
        const L = P.last;
        body = el('div', { class: 'scr-cols' }, play,
          el('div', { class: 'scr-panel' }, el('h3', {}, 'Condition'), row('Fitness', bar(H, P.fit)), row('Morale', bar(H, P.morale)),
            el('div', { class: 'stat-grid' }, ...[['Training left', P.tr], ['Activities left', P.act], ['Fans', P.fans], ['Money', '€' + P.money + 'k']].map(([a, b]) => el('div', {}, a, el('b', {}, String(b)))))),
          el('div', { class: 'scr-panel' }, el('h3', {}, 'Last match'), L ? el('p', { style: 'color:#fff' }, `${L.a}–${L.c} v ${(api.clubs[L.opp] || {}).n || ''} · rating ${L.rt.toFixed(1)}${L.mom ? ' · ★ Man of the Match' : ''} · +${L.xp} XP`) : el('p', {}, 'No matches yet.'),
            L ? el('p', {}, `${L.g} goals · ${L.as} assists · ${L.tk} tackles`) : '', el('p', {}, 'Recent ratings: ' + (P.log.length ? P.log.slice(-5).map(l => (l.split('·')[1] || '').trim()).join('  ') : '—'))));
      } else if (t === 0 && sb === 1) body = [el('p', { class: 'scr-note' }, `Earn XP from drill points. ${P.tr} session(s) left this week. Quit a drill from the pause menu to bank your XP.`), el('div', { class: 'scr-cards' }, ...api.drills.map(([id, n, d]) => card(n, d, () => api.onDrill(id), { off: P.tr <= 0 })))];
      else if (t === 0 && sb === 2) body = [el('p', { class: 'scr-note' }, `Activities left this week: ${P.act}`), el('div', { class: 'scr-cards' }, ...api.acts.map(([n, d], i) => card(n, d, act(() => api.onAct(i)), { off: P.act <= 0 })))];
      else if (t === 0) body = el('div', { class: 'scr-panel' }, el('h3', {}, 'News'), ...(P.news.length ? [...P.news].slice(-12).reverse().map(n => el('p', { style: 'color:#e6efe8' }, '• ' + n)) : [el('p', {}, 'No news yet — play a match!')]));
      else if (t === 1 && sb === 0) body = el('div', { class: 'scr-cols' },
        el('div', { class: 'scr-panel' }, el('h3', {}, `Level ${D.lv}`), bar(H, P.xp % 100, '#60a5fa'), el('p', {}, `XP ${P.xp % 100}/100 · attribute points: ${D.pts}`),
          ...api.K5.map((k, i) => el('div', { class: 'attr-row' }, el('span', {}, api.N5[i]), bar(H, D.A[k] / .99, '#4ade80'), el('b', { style: 'color:#ffe066' }, D.A[k] + (D.A[k] - P.a0[k] > 0 ? ` (+${D.A[k] - P.a0[k]})` : '')),
            el('button', { class: 'scr-btn', style: 'padding:2px 0;text-align:center', 'aria-label': 'Add to ' + api.N5[i], disabled: D.pts > 0 && P.a[k] < 99 ? null : '', onclick: act(() => api.onAttr(k)) }, '+')))),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'XP growth'), el('div', { html: growth(P.hist) })));
      else if (t === 1 && sb === 1) body = [el('div', { class: 'scr-panel' }, el('h3', {}, 'Signature move'), el('p', { style: 'color:#fff' }, D.sig ? '✦ ' + D.sig : 'Unlocks at level 3: you will choose from three moves.')),
        el('h3', { style: "margin:0;font:600 22px 'Barlow Condensed',sans-serif;color:#fff" }, 'Archetype'), el('div', { class: 'scr-cards' }, ...api.PARCH.map((a, i) => card(a.n, a.d, act(() => api.onArch(i)), { on: P.arch === i }))),
        el('h3', { style: "margin:0;font:600 22px 'Barlow Condensed',sans-serif;color:#fff" }, `Perks (${P.perks.length}/${D.slots}, +1 slot every 3 levels)`), el('div', { class: 'scr-cards' }, ...api.PPERK.map((k, i) => card(k.n, k.d, act(() => api.onPerk(i)), { on: P.perks.includes(i) })))];
      else if (t === 1) { const avg = P.gm ? (P.rt / P.gm).toFixed(1) : '—';
        body = el('div', { class: 'scr-panel' }, el('h3', {}, 'Career stats'), el('div', { class: 'stat-grid' }, ...[['Matches', P.gm], ['Goals', P.gl], ['Assists', P.as], ['Avg rating', avg], ['Tackles', P.tk], ['Passes', P.ps], ['Shots', P.sh], ['Fans', P.fans], ['Money', '€' + P.money + 'k'], ['Morale', P.morale], ['Fitness', P.fit], ['Overall', D.ovr]].map(([a, b]) => el('div', {}, a, el('b', {}, String(b))))),
          el('p', {}, 'Recent: ' + (P.log.slice(-3).join('  |  ') || '—'))); }
      else if (t === 2 && sb === 0) body = calendarView(H, api.calendar, { myCrest: crestSVG(C), onPlay: D.next && !D.inj ? api.onPlay : null, onSim: D.next ? act(api.onSim) : null, onNewSeason: !D.next ? act(api.onNewSeason) : null });
      else if (t === 2) body = el('div', { class: 'scr-cols' }, el('div', { class: 'scr-panel' }, el('h3', {}, 'League table'), table(H, D.table)),
        D.cup ? el('div', { class: 'scr-panel' }, el('h3', {}, 'Cup'), el('p', { style: 'color:#ffe066' }, D.cup.status), ...D.cup.pairs.map(([a, b, me]) => el('p', { style: me ? 'color:#ffe066;font-weight:700' : 'color:#fff' }, `${a.n}  v  ${b ? b.n : '—'}`))) : '');
      else if (t === 3 && sb === 1) body = el('div', { class: 'scr-panel' }, el('h3', {}, 'Gameplay'),
        ...[['Pass assist', 'passA'], ['Shot assist', 'shotA'], ['Defending assist', 'defA']].map(([n, k]) => row(n, range(api.GS[k], v => api.onSet(k, v)))),
        row('Difficulty', select(api.DN.map((d, i) => [i, d]), api.diff, v => api.onSet('diff', v))),
        row('Graphics', select(api.GN.map((d, i) => [i, d]), api.gq, v => api.onSet('gq', v))),
        row('Training view', select([[1, 'Behind your player (POV)'], [0, 'Broadcast']], api.pov ? 1 : 0, v => api.onSet('pov', !!v))),
        el('p', {}, 'Higher assist = more forgiving passes, shots and tackles.'));
      else if (t === 3 && sb === 2) body = el('div', { style: 'display:grid;gap:12px' }, ...careerSettings(H, { api, what: 'player', deleteLabel: 'Delete player', onDelete: api.onDeletePC, render }));
      else body = editPro();
      H.root.append(frame(H, { title: 'Player Career', onBack: api.onBack, club: C.c,
        right: el('div', { class: 'hub-head' }, el('div', { class: 'face-img' }, api.faceImg(P.face, P)), el('div', {}, el('b', { style: 'color:#fff;font-size:16px' }, P.nm), el('small', {}, `${C.n} · ${D.pos} · Level ${D.lv} · OVR ${D.ovr}${D.sig ? ' · ✦ ' + D.sig : ''}${D.arch ? ' · ' + D.arch : ''}`)), el('div', { class: 'ct-crest', style: 'width:48px;height:48px', html: crestSVG(C) })),
        body: [tabs].concat(body),
        foot: [el('button', { class: 'scr-btn', onclick: api.onSaves }, 'My saves'), el('button', { class: 'scr-btn', onclick: () => go(3, 2) }, 'Career settings')] }));
      const f = H.root.querySelector('.scr-tab.on'); if (f && !H.root.contains(document.activeElement)) f.focus({ preventScroll: true });
    };
    // Customise › Edit Pro: live 3D preview + face / body / boots / accessories
    const editPro = () => {
      const P = api.P, f = P.face, B = P.body, L = P.look, sv = () => { api.onEdit(); refresh(); };
      if (!box) { box = el('div', { class: 'ed3d' }, el('div', { class: 'ed3d-hint' }, 'Drag to turn · scroll to zoom')); prev = createPreview(box, { view }); prev.update(api.look()); }
      let tm = 0; const refresh = () => { clearTimeout(tm); tm = setTimeout(() => prev && prev.update(api.look()), 60); };
      const vw = el('div', { class: 'ed3d-views' }, ...[['face', 'Face'], ['body', 'Body'], ['back', 'Back'], ['boots', 'Boots']].map(([k, n]) => el('button', { class: view === k ? 'on' : '', onclick: () => { view = k; prev.setView(k); render(); } }, n)));
      box.querySelector('.ed3d-views')?.remove(); box.append(vw);
      const look = v => { if (v && v !== view) { view = v; prev.setView(v); } };
      const set = (fn, v) => () => { fn(); sv(); look(v); render(); };
      const sw = (list, cur, on, label, v) => swatches(H, list, cur, (c, i) => set(() => on(c, i), v)(), label);
      let pane;
      if (edTab === 0) pane = [row('Skin tone', sw(api.SK, (c, i) => f.tone === i, (c, i) => { f.tone = i; }, 'Skin tone')),
        row('Hairstyle', select(api.HSN.map((n, i) => [i, n]), f.hair, v => set(() => { f.hair = v; }, 'face')())),
        row('Hair colour', sw(api.HCP, c => f.hc === c, c => { f.hc = c; }, 'Hair colour')),
        row('Facial hair', select([[0, 'None'], [1, 'Stubble'], [2, 'Short beard'], [3, 'Full beard']], f.beard, v => set(() => { f.beard = v; }, 'face')())),
        ...[['Nose size', 'nose'], ['Nose width', 'nosew'], ['Eye size', 'eyeS'], ['Eye spacing', 'eyeSp'], ['Brow', 'brow'], ['Jaw width', 'jaw'], ['Lips', 'lip'], ['Ears', 'ear'], ['Head size', 'head']].map(([n, k]) => row(n, range(Math.round(f[k] * 100), v => { f[k] = v / 100; api.onEdit(); })))];
      else if (edTab === 1) pane = [row('Body type', select([[-1, 'Custom (sliders only)'], ...api.ARCH.map(([n, d], i) => [i, n])], B.arch == null ? -1 : B.arch, v => set(() => { B.arch = +v < 0 ? null : +v; }, 'body')())),
        B.arch != null ? el('p', { class: 'scr-note' }, api.ARCH[B.arch][1]) : '',
        ...[['Height', 'h'], ['Build / weight', 'w'], ['Arm length', 'wing'], ['Leg length', 'leg']].map(([n, k]) => row(n, range(Math.round(B[k] * 100), v => { B[k] = v / 100; sv(); }))),
        el('p', {}, 'Taller players lose a little pace but defend better; heavier builds are slower. Shows in matches.')];
      else if (edTab === 2) pane = [bootCatalogue(H, api.boots, () => { sv(); look('boots'); })];
      else if (edTab === 4) pane = [row('Position', select(api.allPos, P.pos, v => set(() => api.onRole(v, null))())), el('p', { class: 'scr-note' }, 'Playstyle'),
        el('div', { class: 'scr-cards' }, ...api.styles(P.pos).map(([id, n, d]) => card(n, d, set(() => api.onRole(P.pos, id)), { on: P.style === id })))];
      else pane = [['Headband', 'head', 'hcl'], ['Wristbands', 'wrist', 'wcl'], ['Arm sleeves', 'sleeve', 'scl'], ['Captain armband', 'arm', null], ['Gloves', 'glove', 'gcl']].map(([n, k, ck]) => row(n, el('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
        select([[1, 'On'], [0, 'Off']], L[k] ? 1 : 0, v => set(() => { L[k] = v; })()), ck ? sw(api.PAL12.slice(0, 10), c => L[ck] === c, c => { L[ck] = c; L[k] = 1; }, n + ' colour') : '')));
      return el('div', { class: 'ed-wrap' }, box, el('div', { class: 'scr-panel' },
        el('div', { class: 'scr-tabs' }, ...['Face', 'Body', 'Boots', 'Accessories', 'Role'].map((n, i) => el('button', { class: 'scr-tab' + (edTab === i ? ' on' : ''), onclick: () => { edTab = i; look(['face', 'body', 'boots', 'body', 'body'][i]); render(); } }, n))), ...pane));
    };
    api._render = render;
    render();
  },
});

Object.assign(overlay, {
  /** Kit designer with the live 3D preview. api: see kitsApi() in src/game.js */
  showKits(api) {
    const H = open('cust', () => api.onBack()), { el, select } = H;
    let box = null, prev = null, view = 'body', tm = 0;
    const mo = new MutationObserver(() => { if (prev && !H.root.contains(box)) { prev.dispose(); prev = box = null; } if (!H.root.children.length) mo.disconnect(); });
    mo.observe(H.root, { childList: true });
    const refresh = () => { clearTimeout(tm); tm = setTimeout(() => prev && prev.update(api.look()), 60); };
    const row = (label, ctl) => el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, label), el('div', {}, ctl));
    const render = () => {
      H.root.innerHTML = '';
      if (api.cust < 0) { H.root.append(frame(H, { title: 'Kit designer', onBack: api.onBack, body: clubPick(H, api, render, 'Pick the club whose kits you want to design') })); return focusFirst(H, '.club-tile'); }
      const C = api.clubs[api.cust], K = api.K, set = (k, v) => { api.onSet(k, v); render(); refresh(); };
      if (!box) { box = el('div', { class: 'ed3d' }, el('div', { class: 'ed3d-hint' }, 'Drag to turn · scroll to zoom')); prev = createPreview(box, { view }); prev.update(api.look()); }
      box.querySelector('.ed3d-views')?.remove();
      box.append(el('div', { class: 'ed3d-views' }, ...[['body', 'Front'], ['back', 'Back'], ['boots', 'Socks']].map(([k, n]) => el('button', { class: view === k ? 'on' : '', onclick: () => { view = k; prev.setView(k); render(); } }, n))));
      const trim = (label, k) => row(label, el('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' },
        el('button', { class: 'sw' + (K[k] ? '' : ' on'), style: 'background:repeating-linear-gradient(45deg,#333 0 4px,#555 4px 8px)', 'aria-label': label + ' none', title: 'None', onclick: () => set(k, null) }),
        swatches(H, api.PAL, c => K[k] === c, c => set(k, c), label)));
      const colour = (label, k, fallback) => row(label, el('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' },
        swatches(H, api.PAL, c => (K[k] || fallback) === c, c => set(k, c), label),
        el('input', { type: 'color', class: 'colin', value: K[k] || fallback, 'aria-label': label + ' (any colour)', onchange: e => set(k, e.target.value) })));
      H.root.append(frame(H, { title: 'Kit designer', onBack: api.onBack, club: K.c,
        right: el('div', { class: 'hub-head' }, el('b', { style: 'color:#fff;font-size:16px' }, C.n), el('div', { class: 'ct-crest', style: 'width:48px;height:48px', html: crestSVG(C) })),
        body: el('div', { class: 'ed-wrap' }, box, el('div', { class: 'scr-body', style: 'padding:0' },
          el('div', { class: 'scr-panel' }, el('div', { class: 'kit-tabs' }, ...['Home', 'Away', 'Third'].map((n, j) => el('button', { class: 'kit-tab' + (api.ck === j ? ' on' : ''), onclick: () => { api.onKit(j); render(); refresh(); } }, el('div', { html: kitSVG(api.kits[j], C.crest, { sponsor: true }) }), n)))),
          el('div', { class: 'scr-panel' }, el('h3', {}, `${['Home', 'Away', 'Third'][api.ck]} kit`),
            row('Pattern', select(api.DSG.map((d, i) => [i, d]), K.d || 0, v => set('d', v))),
            colour('Main colour', 'c', '#1d4ed8'), colour('Second colour', 'c2', '#ffffff'), colour('Socks', 'socks', K.c),
            trim('Collar', 'collar'), trim('Sleeve cuffs', 'cuff'),
            row('Sponsor', select([['', 'None'], ...api.sponsors.map(n => [n, n])], K.sponsor || '', v => set('sponsor', v))),
            row('Sponsor placement', select([['chest', 'Chest'], ['back', 'Back, below the number'], ['sleeve', 'Sleeve']], K.spPos || 'chest', v => set('spPos', v))),
            el('p', { class: 'scr-note' }, api.dirty ? 'Unsaved changes — Save to use them at the next kick-off.' : 'Saved. Changes show at the next kick-off.')))),
        foot: [el('button', { class: 'scr-btn go', disabled: api.dirty ? null : '', onclick: () => { api.onSave(); render(); refresh(); } }, 'Save kit'), el('button', { class: 'scr-btn', disabled: api.dirty ? null : '', onclick: () => { api.onReset(); render(); refresh(); } }, 'Reset'),
          el('button', { class: 'scr-btn', onclick: () => { api.onCancel(); render(); } }, api.dirty ? 'Cancel' : 'Other club')] }));
      focusFirst(H, '.kit-tab.on');
    };
    render();
  },
});

Object.assign(overlay, {
  /** Line-up / game plan: tap or drag to swap, drag a bench player on to substitute, Move mode places players. api: planApi() */
  showPlan(api) {
    const H = open('plan', () => api.onBack()), { el, select } = H;
    let selSlot = -1, selBench = -1, move = false;
    const render = () => {
      H.root.innerHTML = '';
      const S = api.squad, lu = api.lu, slots = api.slots, col = api.col;
      const xi = Math.round(lu.reduce((a, i) => a + S[i].ov, 0) / 11);
      const pitch = el('div', { class: 'pitch', 'aria-label': 'Pitch' }, el('i', { style: 'left:0;border-left:0' }), el('i', { style: 'right:0;border-right:0' }));
      slots.forEach(([x, y], i) => { const q = S[lu[i]];
        pitch.append(el('button', { class: 'tok' + (selSlot === i ? ' sel' : '') + (q.pro ? ' pro' : ''), 'data-slot': i, style: `left:${Math.max(4, Math.min(96, (x + 1) * 50))}%;top:${Math.max(5, Math.min(93, (y + 1) * 50))}%;--c:${col}`, 'aria-label': `${q.pos} ${q.nm}, rating ${q.ov}` }, el('b', {}, String(q.ov)), el('span', {}, `${q.pos} ${q.sur}`))); });
      const bench = S.map((q, i) => i).filter(i => !lu.includes(i));
      const tap = (kind, i) => {
        if (kind === 'slot') {
          if (selBench >= 0) { api.onSub(i, selBench); selBench = selSlot = -1; }
          else if (selSlot >= 0 && selSlot !== i && !move) { api.onSwap(selSlot, i); selSlot = -1; }
          else selSlot = selSlot === i ? -1 : i;
        } else if (selSlot >= 0) { api.onSub(selSlot, i); selSlot = selBench = -1; }
        else selBench = selBench === i ? -1 : i;
        render();
      };
      // pointer drag: drop on a player = swap / substitute; in Move mode drop on grass = new position
      const drag = (node, kind, i, label) => node.addEventListener('pointerdown', e => {
        if (e.button) return; e.preventDefault(); const x0 = e.clientX, y0 = e.clientY; let gh = null;
        const mv = ev => { if (!gh && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) { gh = el('div', { class: 'ghost' }, label); document.body.append(gh); node.classList.add('drag'); } if (gh) { gh.style.left = ev.clientX + 'px'; gh.style.top = ev.clientY + 'px'; } };
        const up = ev => { removeEventListener('pointermove', mv, true); removeEventListener('pointerup', up, true);
          if (!gh) return tap(kind, i);
          gh.remove(); const t = document.elementFromPoint(ev.clientX, ev.clientY), ts = t && t.closest('[data-slot]'), tb = t && t.closest('[data-bench]'), tp = t && t.closest('.pitch');
          if (kind === 'slot' && ts && +ts.dataset.slot !== i) api.onSwap(i, +ts.dataset.slot);
          else if (kind === 'slot' && tb) api.onSub(i, +tb.dataset.bench);
          else if (kind === 'bench' && ts) api.onSub(+ts.dataset.slot, i);
          else if (kind === 'slot' && move && tp) { const r = tp.getBoundingClientRect(); api.onMove(i, (ev.clientX - r.left) / r.width * 2 - 1, (ev.clientY - r.top) / r.height * 2 - 1); }
          selSlot = selBench = -1; render(); };
        addEventListener('pointermove', mv, true); addEventListener('pointerup', up, true);  // capture: the overlay root stops bubbling
      });
      pitch.querySelectorAll('[data-slot]').forEach(n => { const i = +n.dataset.slot; drag(n, 'slot', i, S[lu[i]].nm); });
      const benchList = el('div', { style: 'display:grid;gap:6px' }, ...bench.slice(0, 9).map(si => { const q = S[si], n = el('button', { class: 'scr-btn bench-row' + (selBench === si ? ' sel' : ''), 'data-bench': si }, el('small', { class: 'scr-note' }, q.pos), el('span', {}, q.nm + (q.pro ? '  ★' : '')), el('b', { style: 'color:#ffe066' }, String(q.ov))); drag(n, 'bench', si, q.nm); return n; }));
      const row = (label, ctl) => el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, label), el('div', {}, ctl));
      H.root.append(frame(H, { title: 'Line-up', onBack: api.onBack, club: col,
        right: el('div', { class: 'hub-head' }, el('div', {}, el('b', { style: 'color:#fff;font-size:16px' }, api.club.n), el('small', {}, `XI rating ${xi}`)), el('div', { class: 'ct-crest', style: 'width:48px;height:48px', html: crestSVG(api.club) })),
        body: el('div', { class: 'plan-wrap' }, el('div', { style: 'display:grid;gap:8px' }, pitch,
            el('p', { class: 'scr-note' }, api.msg || (move ? 'Move mode: drag a player anywhere on the pitch.' : 'Tap two players to swap them, or drag one onto another. Drag a bench player onto the pitch to bring him on.'))),
          el('div', { class: 'scr-body', style: 'padding:0' },
            el('div', { class: 'scr-panel' }, el('h3', {}, 'Shape'),
              row('Formation', select(api.FN.map((n, i) => [i, n]), api.f, v => { api.onFormation(v); selSlot = selBench = -1; render(); })),
              row('Pick by', select(api.PS.map((n, i) => [i, n]), api.psI, v => { api.onStyle(v); render(); })),
              el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, el('button', { class: 'scr-btn', onclick: () => { api.onAuto(); selSlot = selBench = -1; render(); } }, 'Auto pick XI + tactic'),
                el('button', { class: 'scr-btn' + (move ? ' sel' : ''), 'aria-pressed': String(move), onclick: () => { move = !move; selSlot = -1; render(); } }, 'Move players: ' + (move ? 'on' : 'off')),
                el('button', { class: 'scr-btn', onclick: () => { api.onReset(); render(); } }, 'Reset positions'))),
            el('div', { class: 'scr-panel' }, el('h3', {}, 'Bench'), benchList))),
        foot: [el('button', { class: 'scr-btn go', onclick: api.onBack }, 'Done')] }));
      focusFirst(H, '.scr-btn.go');
    };
    render();
  },
});

Object.assign(overlay, {
  /** Half-time / full-time stats over the paused match. api: statsApi() in src/game.js */
  showStats(api) {
    const H = open(api.mode, null), { el } = H; H.root.className = 'on';
    const [A, B] = api.teams, crest = T => T.club && T.club.crest ? el('div', { class: 'ct-crest', style: 'width:40px;height:40px', html: crestSVG(T.club) }) : '';
    const num = v => parseFloat(String(v)) || 0;
    const lite = c => `color-mix(in srgb, ${c} 70%, #fff)`;
    const card = el('div', { class: 'stats-card', role: 'dialog', 'aria-label': api.mode === 'ht' ? 'Half-time' : 'Full-time' },
      el('div', { style: "font:800 italic 26px 'Barlow Condensed',sans-serif;color:#ffe066;text-align:center;text-transform:uppercase" }, api.mode === 'ht' ? 'Half-time' : 'Full-time'),
      el('div', { class: 'stats-score' }, el('div', { class: 'tm' }, crest(A), A.n), el('div', { class: 'sc' }, `${A.score} – ${B.score}`), el('div', { class: 'tm r' }, B.n, crest(B))),
      api.pens ? el('p', { class: 'scr-note', style: 'text-align:center' }, `Penalties ${api.pens[0]}–${api.pens[1]}`) : '',
      (A.gl.length || B.gl.length) ? el('div', { class: 'stats-gl' }, ...[A, B].map(T => el('div', {}, ...T.gl.map(([n, m]) => el('div', {}, `⚽ ${n} ${m}'`))))) : '',
      el('div', { style: 'display:grid;gap:8px' }, ...api.rows.map(([n, a, b]) => { const x = num(a), y = num(b), t = x + y || 1;
        return el('div', { class: 'ss-row' }, el('b', {}, String(a)), el('span', {}, n), el('b', {}, String(b)),
          el('div', { class: 'ss-bar' }, ...(x + y ? [el('i', { style: `flex:${x / t};background:${lite(A.col)}` }), el('i', { style: `flex:${y / t};background:${lite(B.col)}` })] : [el('i', { style: 'flex:1;background:rgba(255,255,255,.12)' })]))); })),
      el('div', { style: 'display:flex;justify-content:center;gap:10px;flex-wrap:wrap' },
        api.hl ? el('button', { class: 'scr-btn', onclick: api.onHighlights }, `▶ Highlights (${api.hl} goal${api.hl > 1 ? 's' : ''})`) : '',
        el('button', { class: 'scr-btn go', onclick: api.onContinue }, api.mode === 'ht' ? 'Start second half' : 'Continue')));
    H.root.innerHTML = ''; H.root.append(el('div', { style: 'position:absolute;inset:0;display:grid;place-items:center;overflow:auto;padding:16px' }, card));
    focusFirst(H, '.scr-btn.go');
  },
});
