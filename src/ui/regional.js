// Regional tournaments screen (home style): the Rwanda league shortcuts, then the four regional cups —
// pick a competition, pick your side, play through the knockout bracket. api: regionalApi() in src/game.js
import { overlay } from './overlay.js';
import { open, frame, clubTiles } from './screens.js';

const FLAG = 'linear-gradient(90deg,#00a1de 0 50%,#fad201 50% 75%,#20603d 75%)';  // Rwanda blue / yellow / green

Object.assign(overlay, {
  showRegional(api) {
    const H = open('regional', () => api.onBack()), { el } = H;
    let comp = null;
    const render = () => {
      H.root.innerHTML = '';
      if (!api.ready) { H.root.append(frame(H, { title: 'Regional tournaments', onBack: api.onBack, body: el('p', { class: 'scr-note' }, 'The football world is still loading — try again in a moment.') })); return; }
      if (comp) {
        const [id, name, desc] = comp, clubs = api.clubsOf(id);
        H.root.append(frame(H, { title: name, onBack: () => { comp = null; render(); }, club: '#00a1de',
          body: [el('div', { class: 'scr-panel' }, el('h3', {}, id === 'legends' ? 'Pick the club that takes on the Legends' : id === 'cecafa' ? 'Pick your nation' : 'Pick your club'), el('p', {}, desc),
            clubTiles(H, clubs, i => api.onStart(id, clubs[i].wid))),
            id === 'legends' ? el('div', { class: 'scr-panel' }, el('h3', {}, 'World Legends squad'), el('p', {}, 'Invented names, all-time-great ability.'),
              el('table', { class: 'scr-table' }, el('tr', {}, ...['Pos', 'Name', 'From', 'OVR'].map(t => el('th', {}, t))),
                ...api.legends.slice(0, 22).map(p => el('tr', {}, el('td', {}, p.pos), el('td', {}, p.nm), el('td', {}, p.from), el('td', {}, String(p.ov)))))) : ''] }));
        return H.root.querySelector('.club-tile')?.focus({ preventScroll: true });
      }
      H.root.append(frame(H, { title: 'Regional tournaments', onBack: api.onBack, club: '#00a1de',
        right: el('div', { style: `width:120px;height:10px;border-radius:5px;background:${FLAG};margin-left:auto` }),
        body: [
          el('div', { class: 'scr-panel' }, el('h3', {}, api.leagueName), el('p', {}, 'Twenty Rwandan clubs from Kigali to Rubavu, Huye and Nyagatare. Club identities and player names are invented look-alikes; edit any name in the World editor.'),
            el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, el('button', { class: 'scr-btn', onclick: () => api.onLeague('career') }, 'Manage a club'), el('button', { class: 'scr-btn', onclick: () => api.onLeague('pc') }, 'Player career'), el('button', { class: 'scr-btn', onclick: () => api.onLeague('quick') }, 'Quick match'))),
          el('div', { class: 'scr-cards' }, ...api.comps.map(c => el('button', { class: 'scr-card', style: '--c:#fad201', onclick: () => { comp = c; render(); } }, el('b', {}, c[1]), el('small', {}, c[2]))))] }));
      H.root.querySelector('.scr-card')?.focus({ preventScroll: true });
    };
    render();
  },
});
