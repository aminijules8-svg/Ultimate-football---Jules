// Stadium editor (home style): live 3D preview, every club's home ground (any league), and up to six
// custom stadiums built from a preset. All changes save straight away. api: stadEdApi() in src/game.js
import { overlay } from './overlay.js';
import { crestSVG } from './kitart.js';
import { open, frame } from './screens.js';
import { createStadiumPreview } from './stadiumPreview.js';
import { STYLE_LIST, STYLES } from '../render3d/stadium.js';

const ROOFS = [['cantilever', 'Cantilever'], ['ring', 'Full ring'], ['main-only', 'Main stand only'], ['none', 'Open']];
const PATTERNS = [['blocks', 'Blocks'], ['stripes', 'Stripes'], ['waves', 'Waves'], ['gradient', 'Gradient']];

Object.assign(overlay, {
  showStadiumEditor(api) {
    const H = open('stadiums', () => api.onBack()), { el, select, range } = H;
    let tab = 'clubs', league = api.league, sel = null, edit = -1, box = null, prev = null;
    const mo = new MutationObserver(() => { if (prev && !H.root.contains(box)) { prev.dispose(); prev = box = null; } if (!H.root.children.length) mo.disconnect(); });
    mo.observe(H.root, { childList: true });
    const row = (label, ctl) => el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, label), el('div', {}, ctl));
    const preview = P => { if (prev && P) prev.show(P); };
    const render = () => {
      H.root.innerHTML = '';
      if (!box) { box = el('div', { class: 'ed3d', style: 'height:min(66vh,600px)' }, el('div', { class: 'ed3d-hint' }, 'Drag to turn · scroll to zoom')); prev = createStadiumPreview(box); }
      const cap = el('div', { class: 'ed3d-views', style: 'pointer-events:none' });
      box.querySelector('.ed3d-views')?.remove(); box.append(cap);
      let right;
      if (tab === 'clubs') {
        const clubs = api.clubsOf(league);
        if (sel == null || !clubs.some(c => c.key === sel)) sel = clubs[0] && clubs[0].key;
        const cur = clubs.find(c => c.key === sel);
        right = [api.leagues ? row('League', select(api.leagues, league, v => { league = v; sel = null; render(); })) : '',
          cur ? el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
            el('button', { class: 'scr-btn', onclick: () => { const i = api.onCopyToCustom(cur.key); if (i >= 0) { tab = 'mine'; edit = i; } render(); } }, `Customise ${cur.n}'s ground`),
            el('button', { class: 'scr-btn', onclick: () => { api.onAssign(cur.key, null); render(); } }, 'Back to their own ground')) : '',
          el('div', { style: 'display:grid;gap:6px' }, ...clubs.map(c => el('div', { class: 'scr-btn bench-row' + (c.key === sel ? ' sel' : ''), style: 'grid-template-columns:34px 1fr minmax(150px,46%);cursor:pointer', onclick: e => { if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return; sel = c.key; render(); } },
            el('div', { class: 'ct-crest', style: 'width:30px;height:30px', html: crestSVG(c) }), el('span', {}, c.n),
            select(api.options(), api.choiceOf(c.key), v => { api.onAssign(c.key, v); sel = c.key; render(); }))))];
        if (cur) { const P = api.resolve(cur.key); cap.append(el('button', { class: 'on' }, `${cur.n} · ${P.name}`)); preview(P); }
      } else {
        const C = api.custom;
        if (edit >= 0 && !C[edit]) edit = -1;
        const list = el('div', { class: 'scr-cards', style: 'grid-template-columns:repeat(auto-fill,minmax(150px,1fr))' }, ...C.map((c, i) => c
          ? el('button', { class: 'scr-card' + (edit === i ? ' sel' : ''), style: edit === i ? '--c:#ffe066;border-color:#ffe066' : `--c:${c.seat[0]}`, onclick: () => { edit = i; render(); } }, el('b', { style: 'font-size:17px' }, c.name), el('small', {}, api.usedBy(i)))
          : el('button', { class: 'scr-card', style: '--c:#4b5563', onclick: () => { api.onNewCustom(i); edit = i; render(); } }, el('b', { style: 'font-size:17px' }, '+ New'), el('small', {}, `Slot ${i + 1}`))));
        right = [list];
        if (edit >= 0) {
          const c = C[edit], set = (k, v) => { c[k] = v; api.onCustomChange(edit); preview(api.customPreset(edit)); }, setR = (k, v) => { set(k, v); render(); };
          const tiers = c.tiers;
          right.push(el('div', { class: 'scr-panel' }, el('h3', {}, 'Build'),
            row('Name', el('input', { type: 'text', class: 'scr-in', maxlength: 28, value: c.name, oninput: e => { c.name = e.target.value; api.onCustomChange(edit); } })),
            row('Start from', select(api.presets.map(p => [p.id, `${p.name} (${(STYLES[p.style] || {}).name || 'four-stand'})`]), c.base, v => { api.onRebase(edit, v); render(); preview(api.customPreset(edit)); })),
            row('Style', el('div', {}, select(STYLE_LIST, c.style || 'four-stand', v => setR('style', v)), el('small', { class: 'scr-note', style: 'display:block;margin-top:4px' }, (STYLES[c.style || 'four-stand'] || {}).desc || ''))),
            row('Tunnel', select([['south', 'Far side'], ['north', 'Camera side']], c.tunnel || 'south', v => setR('tunnel', v))),
            row('Tiers', select([[1, 'One tier'], [2, 'Two tiers'], [3, 'Three tiers']], tiers.length, v => { while (tiers.length < v) tiers.push({ rows: 10, rake: Math.min(0.6, tiers[tiers.length - 1].rake + 0.07) }); tiers.length = v; setR('tiers', tiers); })),
            ...tiers.map((t, j) => row(`Tier ${j + 1}`, el('div', { style: 'display:grid;grid-template-columns:auto 1fr auto 1fr;gap:8px;align-items:center' },
              el('small', { class: 'scr-note' }, 'rows'), range(t.rows, v => { t.rows = v; set('tiers', tiers); }, 6, 20), el('small', { class: 'scr-note' }, 'steep'), range(Math.round(t.rake * 100), v => { t.rake = v / 100; set('tiers', tiers); }, 30, 62)))),
            row('Crowd', range(Math.round(c.capacity * 100), v => set('capacity', v / 100), 30, 100)),
            row('Roof', el('div', { style: 'display:flex;gap:8px;align-items:center' }, select(ROOFS, c.roof, v => setR('roof', v)), el('input', { type: 'color', class: 'colin', value: c.roofColor, 'aria-label': 'Roof colour', onchange: e => set('roofColor', e.target.value) }))),
            row('Corners', select([['open', 'Open'], ['filled', 'Filled in']], c.corners, v => setR('corners', v)))),
            el('div', { class: 'scr-panel' }, el('h3', {}, 'Colours'),
              row('Seats', el('div', { style: 'display:flex;gap:8px' }, ...c.seat.map((col, k) => el('input', { type: 'color', class: 'colin', value: col, 'aria-label': `Seat colour ${k + 1}`, onchange: e => { c.seat[k] = e.target.value; set('seat', c.seat); } })))),
              row('Seat pattern', select(PATTERNS, c.pattern, v => setR('pattern', v))),
              row('Concrete', el('input', { type: 'color', class: 'colin', value: c.concrete, 'aria-label': 'Concrete colour', onchange: e => set('concrete', e.target.value) })),
              row('Flag letters', el('input', { type: 'text', class: 'scr-in', maxlength: 10, value: c.letters, oninput: e => set('letters', e.target.value.toUpperCase() || 'HOME') }))),
            el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, el('button', { class: 'scr-btn danger', onclick: () => { api.onDeleteCustom(edit); edit = -1; render(); } }, 'Delete this stadium')));
          cap.append(el('button', { class: 'on' }, c.name)); preview(api.customPreset(edit));
        } else right.push(el('p', { class: 'scr-note' }, 'Build up to six grounds of your own. Give one to any club from the Clubs tab.'));
      }
      H.root.append(frame(H, { title: 'Stadiums', onBack: api.onBack,
        right: el('div', { class: 'scr-tabs', style: 'margin-left:auto' }, ...[['clubs', 'Clubs'], ['mine', 'My stadiums']].map(([k, n]) => el('button', { class: 'scr-tab' + (tab === k ? ' on' : ''), onclick: () => { tab = k; render(); } }, n))),
        body: el('div', { class: 'ed-wrap', style: 'grid-template-columns:minmax(300px,1.3fr) minmax(300px,1fr)' }, box, el('div', { class: 'scr-body', style: 'padding:0;max-height:70vh' }, ...right.filter(Boolean))) }));
    };
    render();
  },
});
