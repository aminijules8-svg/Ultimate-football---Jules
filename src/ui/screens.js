// Menu screens in the home-menu style (HTML overlays). Each show*(api) renders from the api's live
// getters and re-renders after every action; the game owns all state and logic (src/game.js *Api()).
import { overlay, _host } from './overlay.js';
import { kitSVG, crestSVG } from './kitart.js';
import { menuArt, ART_OF } from './art.js';
import { accentOf } from './theme.js';

function open(mode, onEscape) { const H = _host(); H.setState({ mode, onEscape }); H.root.className = 'on menu'; H.root.dataset.mode = mode; return H; }

/** Standard frame: Back + title header, scrolling body, optional footer. */
function frame(H, { title, onBack, right, body, foot, club }) {
  const { el } = H;
  const art = menuArt(ART_OF[H.root.dataset.mode] || 'stadium');
  return el('div', { class: 'mm scr', style: `--club:${club || '#1d4ed8'};--acc:${accentOf(club || '#fff1c9', '#fff1c9')}${art ? `;--art:url(${art})` : ''}` },
    el('div', { class: 'scr-grid' },
      el('div', { class: 'qm-head' }, onBack ? el('button', { class: 'qm-back', onclick: onBack }, '◀ Back') : '', el('h1', {}, title), right || ''),
      el('div', { class: 'scr-body' }, ...[].concat(body)),
      foot ? el('div', { class: 'scr-foot' }, ...[].concat(foot)) : ''));
}

export function clubTiles(H, clubs, onPick, { sel = -1, ratingLabel = true } = {}) {
  const { el } = H;
  return el('div', { class: 'club-grid' }, ...clubs.map((c, i) => el('button', { class: 'club-tile' + (i === sel ? ' sel' : ''), style: `--c:${c.c}`, onclick: () => onPick(i) },
    el('div', { class: 'ct-crest', html: crestSVG(c) }), el('b', {}, c.n), ratingLabel ? el('small', {}, String(c.s ?? '')) : '')));
}

/** League-first picker: cards for every league / group (logo, name, country, club count), then that group's clubs as crest tiles.
 *  P = { groups:[{id,name,sub,kind,logo,count}], clubsOf(id)->[legacy clubs], onPick(id, wid) }. Keeps its own group state. */
export function leaguePick(H, P, { back = 'All leagues' } = {}) {
  const { el } = H, box = el('div', {}); let gid = null;
  const render = () => {
    box.innerHTML = '';
    if (gid == null) {
      box.append(el('div', { class: 'lg-grid', role: 'list' }, ...P.groups.map(g => el('button', { class: 'lg-card', role: 'listitem', onclick: () => { gid = g.id; render(); const f = box.querySelector('.club-tile'); if (f) f.focus({ preventScroll: true }); } },
        el('div', { class: 'lg-logo', html: g.logo }), el('div', {}, el('b', {}, g.name), el('small', {}, `${g.sub} · ${g.count} ${g.kind === 'nations' ? 'teams' : g.count === 1 ? 'team' : 'clubs'}`))))));
      return;
    }
    const g = P.groups.find(x => x.id === gid), clubs = P.clubsOf(gid);
    box.append(el('div', { class: 'lg-head' }, el('button', { class: 'scr-btn', onclick: () => { gid = null; render(); const f = box.querySelector('.lg-card'); if (f) f.focus({ preventScroll: true }); } }, '◀ ' + back),
      el('div', { class: 'lg-logo', style: 'width:40px;height:40px', html: g.logo }), el('b', {}, g.name), el('small', { class: 'scr-note' }, g.sub)),
      clubTiles(H, clubs, i => P.onPick(gid, clubs[i].wid)));
  };
  render(); return box;
}

const focusFirst = (H, sel) => { const n = H.root.querySelector(sel || '.scr-btn, .scr-card, .club-tile, button'); if (n) n.focus({ preventScroll: true }); };

Object.assign(overlay, {
  /** api: { scheme, use3d, gq, GN, vol, muted, diff, DN, wx, WN, onSet(k,v), onRemap, onStadiums, onBack } */
  showSettings(api) {
    const H = open('settings', api.onBack), { el, select, range } = H;
    const render = () => {
      H.root.innerHTML = '';
      const row = (label, ctl, note) => el('div', { class: 'scr-row' }, el('span', {}, label), el('div', {}, ctl, note ? el('div', { class: 'scr-note' }, note) : ''));
      const set = (k, v) => { api.onSet(k, v); render(); };
      H.root.append(frame(H, { title: 'Settings', onBack: api.onBack, body: el('div', { class: 'scr-cols' },
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Play'),
          row('Controls', select([['simple', 'Simple: 4 buttons + gestures'], ['classic', 'Classic: full layout']], api.scheme, v => set('scheme', v)), 'Simple: A shoot · S pass · D cross · W skill/shield · Shift sprint.'),
          row('Difficulty', select(api.DN.map((d, i) => [i, d]), api.diff, v => set('diff', v))),
          row('Weather', select(api.WN.map((d, i) => [i, d]), api.wx, v => set('wx', v))),
          row('Stick-gesture skills', select([[1, 'On'], [0, 'Off']], api.gest ? 1 : 0, v => set('gest', !!v)), 'Simple scheme only: a sharp stick reversal, a sideways flick or a hard sprinting cut next to a defender triggers a move. Off = skills only on the skill button.'),
          el('button', { class: 'scr-btn', onclick: api.onRemap }, 'Remap keys (Classic) and see the Simple layout')),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Picture and sound'),
          row('View', select([[1, '3D'], [0, '2D']], api.use3d ? 1 : 0, v => set('use3d', !!v))),
          row('Graphics', select(api.GN.map((d, i) => [i, d]), api.gq, v => set('gq', v)), 'AUTO picks the best quality your machine can hold at about 60 fps.'),
          row('Player detail', select(api.PGN.map((d, i) => [i, d]), api.pgq, v => set('pgq', v)), api.pgq === 4 ? `Auto-realistic picks ${api.pgNow} for this machine (skin and fabric detail, LOD distance). Applies from the next kick-off.` : 'Skin and fabric detail and how far away players keep full detail. Applies from the next kick-off.'),
          row('Volume', range(Math.round(api.vol * 100), v => api.onSet('vol', v / 100))),
          row('Sound', select([[1, 'On'], [0, 'Off']], api.muted ? 0 : 1, v => set('muted', !v))),
          row('Commentary voice', select([[1, 'On'], [0, 'Off']], api.voice ? 1 : 0, v => set('voice', !!v)), 'Two commentators and a stadium announcer, using voices built into your browser.'),
          row('Commentary volume', range(Math.round((api.commVol ?? .9) * 100), v => api.onSet('cv', v / 100)), 'Separate from the effects and crowd volume above.'),
          row('Captions', select([[0, 'Off'], [1, 'On']], api.captions ? 1 : 0, v => set('cap', !!v)), 'Shows each commentary line as text under the play. Off by default.'),
          row('Chants', select([[1, 'On'], [0, 'Off']], api.chants ? 1 : 0, v => set('chants', !!v)), 'The home end sings the club name at kick-off, after goals and during lulls.')),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Stadiums'), el('p', {}, 'Build your own grounds and choose any club’s home stadium.'),
          el('button', { class: 'scr-btn', onclick: api.onStadiums }, 'Open the stadium editor'))) }));
      focusFirst(H, 'select');
    };
    render();
  },

  /** Online friendly: host a room (code) or join one; the host picks the clubs and kicks off. api: onlineApi() in src/game.js */
  /** Full-screen league-first club pick. api: leaguePickApi() from game.js: { title, groups, clubsOf, onPick, onBack } */
  showLeaguePick(api) {
    const H = open('pick', api.onBack), { el } = H;
    H.root.innerHTML = '';
    H.root.append(frame(H, { title: api.title, onBack: api.onBack, body: el('div', { class: 'scr-panel' }, el('p', { class: 'scr-note' }, 'Pick a league or group, then a team.'), leaguePick(H, api)) }));
    focusFirst(H, '.lg-card');
  },
  showOnline(api) {
    const H = open('online', api.onBack), { el, select } = H; let code = '';
    const row = (label, ctl) => el('div', { class: 'scr-row' }, el('span', {}, label), el('div', {}, ctl));
    const render = () => {
      H.root.innerHTML = '';
      const role = api.role, conn = api.connected, busy = !!role;
      const left = el('div', { class: 'scr-panel' }, el('h3', {}, 'Host a match'), el('p', {}, 'You get a room code to send to your friend. You pick both clubs and the match runs on your machine.'),
        role === 'host' ? el('div', { style: "font:800 44px 'Barlow Condensed',sans-serif;letter-spacing:.25em;color:#ffe066;text-align:center;padding:8px 0" }, api.code || '…') : el('button', { class: 'scr-btn go', disabled: busy, onclick: () => { api.onHost(); render(); } }, 'Create a room'));
      const right = el('div', { class: 'scr-panel' }, el('h3', {}, 'Join a friend'), el('p', {}, 'Type the code your friend sent you.'),
        el('div', { style: 'display:flex;gap:8px' }, el('input', { type: 'text', class: 'scr-in', maxlength: 5, placeholder: 'CODE', value: code, disabled: busy, style: 'text-transform:uppercase;letter-spacing:.2em;font-weight:700', oninput: e => { code = e.target.value.toUpperCase(); } }),
          el('button', { class: 'scr-btn', disabled: busy, onclick: () => { if (code.length >= 4) { api.onJoin(code); render(); } } }, 'Join')));
      const status = el('p', { class: 'scr-note', style: 'margin:12px 0' }, api.status || 'Both of you need this game open in a browser. The connection runs directly between the two browsers; a strict firewall or mobile network can block it.');
      const lobby = api.lobby || role === 'host' ? el('div', { class: 'scr-panel' }, el('h3', {}, 'Match'),
        role === 'host' && api.teams ? el('div', { class: 'lobby-teams' }, ...api.teams.map((T, k) => el('div', { class: 'lobby-team' }, el('small', {}, k ? 'Away (friend)' : 'Home (you)'), el('div', { class: 'ct-crest', style: 'width:44px;height:44px', html: T ? T.crest : '' }), el('b', {}, T ? T.n : '—'),
          el('small', { style: 'display:flex;align-items:center;gap:6px' }, T && T.lg ? el('span', { class: 'mm-lg', html: T.lg.logo }) : '', T && T.lg ? T.lg.name : ''), el('button', { class: 'scr-btn', onclick: () => api.onChange(k) }, 'Change'))))
        : role === 'host' ? el('div', {}, row('Home (you)', select(api.clubs.map((n, i) => [i, n]), api.sel[0], v => { api.onPick(0, v); render(); })), row('Away (friend)', select(api.clubs.map((n, i) => [i, n]), api.sel[1], v => { api.onPick(1, v); render(); })))
        : el('div', { class: 'lobby-teams' }, ...[['home', 'homeLg'], ['away', 'awayLg']].map(([n, lg], k) => el('div', { class: 'lobby-team' }, el('small', {}, k ? 'Away (you)' : 'Home (host)'), el('b', {}, api.lobby[n]), el('small', {}, api.lobby[lg] || '')))),
        role === 'host' ? (api.ready ? el('button', { class: 'scr-btn go', onclick: api.onStart }, 'Kick off') : el('p', { class: 'scr-note' }, 'Waiting for your friend to join…')) : el('p', { class: 'scr-note' }, 'Waiting for the host to kick off…')) : '';
      const cancel = busy ? el('button', { class: 'scr-btn', onclick: () => { api.onCancel(); render(); } }, 'Cancel') : '';
      H.root.append(frame(H, { title: 'Online friendly', onBack: api.onBack, body: el('div', {}, el('div', { class: 'scr-cols' }, left, right), status, lobby, cancel) }));
    };
    api.watch(render); render();
  },

  /** api: { groups:[[title,[[action,label]]]], keyOf(action), rebinding, onRebind(a), onKey(code), onReset, onBack } */
  showControls(api) {
    const H = open('ctl', api.onBack), { el } = H;
    const render = () => {
      H.root.innerHTML = '';
      const body = [
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Simple scheme (default)'),
          el('p', {}, 'Arrows move · A shoot (hold = power; slide when defending) · S pass (hold = through ball; tackle / jockey when defending) · D cross (switch when defending) · W tap = skill move, hold = shield · Shift sprint, double-tap = knock-on. Gestures: reverse the stick = drag-back, flick sideways near a defender = ball roll, hard cut while sprinting = chop.')),
        el('div', { class: 'scr-panel' }, el('h3', {}, 'Classic keys'), el('p', {}, api.rebinding ? 'Press a key or mouse button for the highlighted action (Esc cancels).' : 'Click an action, then press a key or mouse button.'),
          el('div', { class: 'keys-grid' }, ...api.groups.map(([g, acts]) => el('div', {}, el('div', { class: 'scr-note', style: 'margin-bottom:4px;font-weight:700' }, g.charAt(0) + g.slice(1).toLowerCase()),
            ...acts.map(([a, label]) => el('button', { class: 'key-row' + (api.rebinding === a ? ' wait' : ''), onclick: () => { api.onRebind(a); render(); } }, el('span', {}, label), el('b', {}, api.rebinding === a ? 'press…' : api.keyOf(a))))))))];
      const wrap = frame(H, { title: 'Controls', onBack: api.onBack, body, foot: [el('button', { class: 'scr-btn danger', onclick: () => { api.onReset(); render(); } }, 'Reset Classic keys')] });
      wrap.tabIndex = -1;
      wrap.addEventListener('keydown', e => { if (!api.rebinding) return; e.preventDefault(); e.stopPropagation(); api.onKey(e.code); render(); });
      wrap.addEventListener('mousedown', e => { if (!api.rebinding || e.target.closest('.key-row')) return; e.preventDefault(); api.onKey('Mouse' + e.button); render(); });
      H.root.append(wrap); wrap.focus({ preventScroll: true });
    };
    render();
  },

  /** api: { clubs, sel, drills:[[id,name,desc]], pov, onPick(i), onDrill(id), onPov(v), onBack } */
  showTraining(api) {
    const H = open('train', api.onBack), { el, select } = H;
    const render = () => {
      H.root.innerHTML = '';
      const C = api.clubs[api.sel];
      H.root.append(frame(H, { title: 'Training', onBack: api.onBack, club: C.c,
        right: el('div', { class: 'qm-pick', style: 'margin-left:auto' }, el('div', { class: 'qm-crest', html: crestSVG(C) }),
          select(api.clubs.map((c, i) => [i, c.n]), api.sel, v => { api.onPick(v); render(); })),
        body: [el('div', { class: 'scr-cards' }, ...api.drills.map(([id, n, d]) => el('button', { class: 'scr-card', onclick: () => api.onDrill(id) }, el('b', {}, n), el('small', {}, d)))),
          el('div', { class: 'scr-row' }, el('span', {}, 'Camera'), select([[1, 'Behind your player (POV)'], [0, 'Broadcast']], api.pov ? 1 : 0, v => { api.onPov(!!v); render(); }))] }));
      focusFirst(H, '.scr-card');
    };
    render();
  },
});

export { frame, open };

Object.assign(overlay, {
  /** api: { tour, tpls:[[id,name,desc]], tpl, clubs, league, onTpl(id), onLeague(d), onPick(i), roundName(n), onPlay, onNew, onBack } */
  showTour(api) {
    const H = open('tour', api.onBack), { el } = H;
    const render = () => {
      H.root.innerHTML = '';
      const t = api.tour, C = api.clubs;
      if (!t && api.setup) {
        const S = api.setup, slots = S.slots;
        H.root.append(frame(H, { title: `${S.name} · setup`, onBack: () => { S.onBack(); render(); }, body: [
          el('div', { class: 'scr-panel' }, el('h3', {}, `${S.size} teams${S.groups ? ` · ${S.groups} groups of 4, then knockout` : ' · single-leg knockout'}`),
            el('div', { class: 'scr-row', style: 'max-width:none' }, el('span', {}, 'Randomiser'), el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;align-items:center' }, H.select(S.modes, S.mode, v => { S.onMode(v); render(); }), el('button', { class: 'scr-btn', 'aria-label': 'Randomise the other teams', onclick: () => { S.onRandom(); render(); } }, '⟳ Shuffle'))),
            el('p', { class: 'scr-note' }, 'Your team keeps its place. Tap any other team to swap it for one from any league.'),
            el('div', { class: 'club-grid' }, ...slots.map((c, k) => el('button', { class: 'club-tile' + (c.you ? ' sel' : ''), style: `--c:${c.s ? '#9be3b0' : '#888'}`, disabled: c.you ? '' : null, title: c.you ? 'Your team' : 'Replace ' + c.n, onclick: () => S.onChange(k) },
              el('div', { class: 'ct-crest', html: c.crest }), el('b', {}, c.n + (c.you ? ' (you)' : '')), el('small', {}, `${c.s} · ${c.lg}`)))))],
          foot: [el('button', { class: 'scr-btn go', onclick: () => { S.onStart(); render(); } }, 'Start tournament')] }));
        focusFirst(H, '.scr-btn.go'); return;
      }
      if (!t) {
        const tp = api.tpls.find(x => x[0] === api.tpl);
        H.root.append(frame(H, { title: 'Tournament', onBack: api.onBack, body: [
          el('div', { class: 'scr-cards' }, ...api.tpls.map(([id, n, d]) => el('button', { class: 'scr-card' + (id === api.tpl ? ' sel' : ''), style: id === api.tpl ? '--c:#ffe066;border-color:#ffe066' : '', onclick: () => { api.onTpl(id); render(); } }, el('b', {}, n), el('small', {}, d)))),
          el('div', { class: 'scr-panel' }, el('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap' }, el('h3', {}, 'Choose your club'), el('span', { class: 'scr-note' }, (tp ? tp[1] : '') + ' · single-leg knockout'),
            api.league && !api.leagues ? el('div', { class: 'mm-step', style: 'margin-left:auto' }, el('button', { 'aria-label': 'Previous league', onclick: () => { api.onLeague(-1); render(); } }, '◀'), el('span', { style: 'min-width:220px' }, api.league), el('button', { 'aria-label': 'Next league', onclick: () => { api.onLeague(1); render(); } }, '▶')) : ''),
            api.leagues ? leaguePick(H, api.leagues) : clubTiles(H, C, i => api.onPick(i)))] }));
        focusFirst(H, '.scr-card'); return;
      }
      const you = C[t.you];
      if (t.champ !== null) {
        const won = t.champ === t.you;
        H.root.append(frame(H, { title: won ? 'Champions!' : 'Tournament over', onBack: api.onBack, club: C[t.champ].c, body: [
          el('div', { class: 'scr-panel', style: 'justify-items:center;text-align:center' }, el('div', { style: 'width:120px;height:120px', html: crestSVG(C[t.champ]) }), el('h3', {}, won ? `${you.n} lift the trophy` : `${C[t.champ].n} win the tournament`)),
          el('div', { class: 'scr-panel' }, el('h3', {}, 'Your run'), ...t.hist.map(l => el('p', {}, l)))],
          foot: [el('button', { class: 'scr-btn go', onclick: () => { api.onNew(); } }, 'New tournament')] }));
        focusFirst(H, '.scr-btn.go'); return;
      }
      const nx = api.next, op = C[nx.opp], pairs = [];
      if (t.stage === 'groups' && api.groups) {
        const gt = G => el('table', { class: 'scr-table', style: 'font-size:12px' }, el('tr', {}, ...['#', G.name, 'P', 'W', 'D', 'L', 'GD', 'Pts'].map(h => el('th', {}, h))),
          ...G.rows.map((r, k) => el('tr', { class: r.me ? 'me' : '' }, ...[k + 1, r.n, r.p, r.w, r.d, r.l, (r.gf - r.ga > 0 ? '+' : '') + (r.gf - r.ga), r.pts].map(v => el('td', {}, String(v))))));
        const mine = api.groups.filter(G => G.me), others = api.groups.filter(G => !G.me);
        H.root.append(frame(H, { title: nx.label, onBack: api.onBack, club: you.c, right: el('span', { class: 'st-venue' }, (api.allTpls || api.tpls).find(x => x[0] === t.tpl)?.[1] || ''),
          body: [el('div', { class: 'scr-cols' }, el('div', { class: 'scr-panel' }, el('h3', {}, 'Your group'), ...mine.map(gt), el('p', { class: 'scr-note' }, 'Top two go through to the knockout rounds.'), el('h3', {}, 'Your run so far'), ...(t.hist.length ? t.hist.map(l => el('p', {}, l)) : [el('p', {}, 'Three group games, then the knockout rounds.')])),
            el('div', { class: 'scr-panel' }, el('h3', {}, 'Other groups'), el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px' }, ...others.map(gt))))],
          foot: [el('button', { class: 'scr-btn go', onclick: api.onPlay }, `Play ${you.a} v ${op.a}`)] }));
        focusFirst(H, '.scr-btn.go'); return;
      }
      for (let k = 0; k < t.cur.length; k += 2) pairs.push([t.cur[k], t.cur[k + 1]]);
      const tie = ([a, b]) => el('div', { class: 'club-tile', style: `--c:${C[a].c};grid-template-columns:30px 1fr auto 1fr 30px;${a === t.you || b === t.you ? 'border-color:#ffe066' : ''}` },
        el('div', { class: 'ct-crest', style: 'width:30px;height:30px', html: crestSVG(C[a]) }), el('b', {}, C[a].n), el('small', {}, 'v'), el('b', { style: 'text-align:right' }, C[b].n), el('div', { class: 'ct-crest', style: 'width:30px;height:30px', html: crestSVG(C[b]) }));
      H.root.append(frame(H, { title: api.roundName(t.cur.length), onBack: api.onBack, club: you.c,
        right: el('span', { class: 'st-venue' }, (api.allTpls || api.tpls).find(x => x[0] === t.tpl)?.[1] || ''),
        body: [el('div', { class: 'scr-cols' }, el('div', { class: 'scr-panel' }, el('h3', {}, 'This round'), el('div', { style: 'display:grid;gap:8px' }, ...pairs.map(tie))),
          el('div', { class: 'scr-panel' }, el('h3', {}, 'Your run so far'), ...(t.hist.length ? t.hist.map(l => el('p', {}, l)) : [el('p', {}, 'First match — win and you go through.')])))],
        foot: [el('button', { class: 'scr-btn go', onclick: api.onPlay }, `Play ${you.a} v ${op.a}`)] }));
      focusFirst(H, '.scr-btn.go');
    };
    render();
  },
});
