// Phase 6: seeded procedural football world — 10 countries, 20 clubs each, 22 players per club,
// crests, kits, stadiums, rivals. Deterministic for a seed; persisted (with edits/transfers) in IndexedDB.
import { NEW_COUNTRIES, EXTRA_NATIONS, CONFED_OF, flagFor } from './nations.js';
import { COUNTRIES, CLUB_SUFFIX, SPONSOR_POOL } from './names.js';
import { styleFor } from './roles.js';
import { archFor } from './archetypes.js';

export const POSITIONS = ['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'DMF', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'];
export const roleOf = pos => pos === 'GK' ? 'GK' : ['RB', 'CB', 'LB', 'RWB', 'LWB'].includes(pos) ? 'D' : ['DMF', 'CM', 'CAM', 'RM', 'LM'].includes(pos) ? 'M' : 'F';
const SQUAD_TEMPLATE = ['GK', 'GK', 'GK', 'RB', 'CB', 'CB', 'LB', 'CB', 'RWB', 'LWB', 'DMF', 'CM', 'CM', 'CAM', 'RM', 'LM', 'CM', 'DMF', 'ST', 'ST', 'RW', 'LW'];
const PALETTE = ['#1d4ed8', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#be123c', '#0f766e', '#ea580c', '#111827', '#f8fafc', '#facc15', '#14b8a6', '#9333ea', '#ec4899', '#1e3a8a', '#b45309', '#065f46', '#4b5563', '#e11d48'];

export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
const gauss = R => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const contrast = hex => { const c = parseInt(hex.slice(1), 16), r = c >> 16, g = (c >> 8) & 255, b = c & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

/** overall rating from detailed attributes, by position */
export function overall(p) {
  const a = p.attrs;
  if (p.pos === 'GK') return Math.round((a.dive + a.hand + a.reflex) / 3 * 0.9 + a.pace * 0.1);
  const w = { D: { def: .35, pace: .15, str: .15, hea: .1, pass: .1, pow: .05, drib: .05, bal: .05 }, M: { pass: .3, drib: .2, def: .1, pace: .1, shoot: .1, sta: .1, bal: .1 }, F: { shoot: .3, pace: .2, drib: .2, pow: .1, hea: .1, bal: .1 } }[roleOf(p.pos)];
  return Math.round(Object.entries(w).reduce((s, [k, v]) => s + (a[k] || 50) * v, 0));
}
export const valueOf = p => Math.round(Math.max(0.1, Math.pow(Math.max(0, p.ov - 45) / 10, 2.6) * (p.age < 24 ? 1.3 : p.age > 31 ? 0.5 : 1) * 1.6) * 10) / 10; // €M
export const wageOf = p => Math.round(Math.max(1, Math.pow(Math.max(0, p.ov - 45) / 10, 2.2) * 9)); // k€/week

export function makePlayer(R, id, country, pos, targetOv, clubId, idx) {
  const first = pick(R, country.first), last = pick(R, country.last);
  const age = clamp(Math.round(26 + gauss(R) * 4.2), 17, 37);
  const base = clamp(targetOv + gauss(R) * 5 - (age < 21 ? 6 : 0) - (age > 33 ? 4 : 0), 40, 94);
  const n = (bias = 0, spread = 9) => clamp(Math.round(base + bias + gauss(R) * spread), 30, 99);
  const role = roleOf(pos);
  const attrs = role === 'GK'
    ? { pace: n(-15), pass: n(-10), shoot: n(-25), def: n(-5), drib: n(-20), pow: n(-5), hea: n(-10), sta: n(-5), str: n(0), bal: n(0), set: n(-10), dive: n(4), hand: n(4), reflex: n(4) }
    : { pace: n(role === 'F' ? 5 : role === 'D' ? -2 : 0), pass: n(role === 'M' ? 6 : role === 'D' ? -4 : -2), shoot: n(role === 'F' ? 8 : role === 'D' ? -14 : -3), def: n(role === 'D' ? 8 : role === 'M' ? -2 : -16), drib: n(role === 'F' ? 5 : role === 'D' ? -8 : 2), pow: n(role === 'F' ? 4 : 0), hea: n(role === 'D' ? 6 : role === 'F' ? 3 : -4), sta: n(role === 'M' ? 5 : 0), str: n(role === 'D' ? 5 : -1), bal: n(0), set: n(role === 'M' ? 4 : -4), dive: n(-30, 5), hand: n(-30, 5), reflex: n(-25, 5) };
  const p = { id, first, last, name: first + ' ' + last, age, nat: country.id, pos, attrs, club: clubId, number: 0, contract: 1 + Math.floor(R() * 4), form: 50 + Math.round(gauss(R) * 8), morale: 70, injury: null,
    look: { tone: Math.floor(R() * 8), hair: Math.floor(R() * 16), hc: Math.floor(R() * 16), boots: Math.floor(R() * 4), beard: R() < 0.3 ? 1 + Math.floor(R() * 3) : 0, acc: R() < 0.15 ? pick(R, ['headband', 'wristbands', 'sleeves', 'gloves']) : null },
    face: { eyeS: R(), eyeSp: R(), brow: R(), nose: R(), nosew: R(), lip: R(), jaw: R(), head: R() }, body: { h: R(), w: R(), wing: R(), leg: R(), arch: archFor(pos, attrs, age, id) },
    stats: { apps: 0, goals: 0, assists: 0, yc: 0, rc: 0, rating: [] } };
  p.ov = overall(p); p.value = valueOf(p); p.wage = wageOf(p);
  return p;
}

function makeClub(R, id, country, town, rank, nClubs) {
  const suffix = pick(R, CLUB_SUFFIX), name = R() < 0.25 ? `${suffix} ${town}` : `${town} ${suffix}`;
  const c1 = pick(R, PALETTE); let c2 = pick(R, PALETTE); if (c2 === c1 || Math.abs(contrast(c1) - contrast(c2)) < 0.25) c2 = contrast(c1) > 0.5 ? '#111827' : '#f8fafc';
  const c3 = pick(R, PALETTE.filter(c => c !== c1 && c !== c2));
  const rep = clamp(Math.round(84 - rank * (30 / nClubs) + gauss(R) * 3), 50, 90); // league leaders ~84, tail ~55
  const sponsor = pick(R, SPONSOR_POOL);
  const design = () => Math.floor(R() * 12);
  return { id, name, short: town, abbr: (town.replace(/[^A-Za-z]/g, '').slice(0, 3) || suffix.slice(0, 3)).toUpperCase(), country: country.id, town, colors: [c1, c2, c3], rep, budget: Math.round(Math.pow(rep - 45, 1.7) / 6),
    kits: [{ c: c1, c2, d: design(), socks: c1, sponsor }, { c: c2, c2: c1, d: design(), socks: c2, sponsor }, { c: c3, c2: contrast(c3) > 0.5 ? '#111827' : '#f8fafc', d: design(), socks: c3, sponsor }],
    crest: { shape: Math.floor(R() * 7), motif: 1 + Math.floor(R() * 10), border: Math.floor(R() * 3), c1, c2, c3, letter: town[0].toUpperCase(), year: 1880 + Math.floor(R() * 130), seed: Math.floor(R() * 2 ** 31) }, stadium: pickStadium(rep, id), rivals: [], squad: [], tactic: Math.floor(R() * 8), manager: `${pick(R, country.first)} ${pick(R, country.last)}`, mood: 60 };
}

/** Build the whole world for a seed. ~200 clubs, ~4400 players. */
// Bigger clubs get the bigger grounds; the club id spreads the three designs within each tier.
export function pickStadium(rep, id) {
  const tier = rep >= 78 ? ['umuhire-arena', 'capital-dome', 'horizon'] : rep >= 66 ? ['lion-park', 'horizon', 'capital-dome'] : ['red-valley', 'eastland', 'lion-park'];
  return tier[id % 3];
}

export const ALL_COUNTRIES = [...COUNTRIES, ...NEW_COUNTRIES];
/** One league country with 20 clubs and their squads appended to the world (shared by generation and the leaguesV3 migration). */
function addCountry(world, R, C) {
  const country = { id: C.id, name: C.name, adj: C.adj, league: { id: C.id + '-1', name: C.league, clubs: [] }, cup: C.cup, colors: C.colors };
  const towns = [...C.towns].sort(() => R() - 0.5);
  for (let k = 0; k < 20; k++) {
    const club = makeClub(R, world.clubs.length, C, towns[k % towns.length] + (k >= towns.length ? ' II' : ''), k, 20);
    for (let i = 0; i < SQUAD_TEMPLATE.length; i++) {
      const foreign = R() < 0.18 ? pick(R, ALL_COUNTRIES) : C;
      const p = makePlayer(R, world.players.length, foreign, SQUAD_TEMPLATE[i], club.rep - 4 + (i < 11 ? 2 : -3), club.id, i);
      p.number = i < 11 ? i + 1 : 12 + (i - 11); club.squad.push(p.id); world.players.push(p);
    }
    world.clubs.push(club); country.league.clubs.push(club.id);
  }
  country.league.clubs.forEach((id, k) => { const arr = country.league.clubs; world.clubs[id].rivals = [arr[(k + 1) % arr.length], arr[(k + 7) % arr.length]]; });
  world.countries.push(country); return country;
}
/** Nations list (league countries first, so national-team ids 1000+index stay stable, then the extra nations) and the
 *  23-man generated pools of the nations without a league. Idempotent: pools are only generated once. */
export function buildNations(world) {
  world.nations = [...world.countries.map(c => ({ id: c.id, name: c.name, adj: c.adj, confed: CONFED_OF[c.id] || 'eu', colors: c.colors, flag: flagFor(c.id, c.colors), league: true })),
    ...EXTRA_NATIONS.map(n => ({ id: n.id, name: n.name, adj: n.adj, confed: n.confed, colors: n.colors, flag: n.flag, league: false, rep: n.rep }))];
  world.natPools = world.natPools || {};
  EXTRA_NATIONS.forEach((n, ni) => {
    if (world.natPools[n.id]) return;
    const R = mulberry32((world.seed ^ (ni + 1) * 0x9E3779B9) >>> 0), pool = ALL_COUNTRIES.find(c => c.id === n.pool) || COUNTRIES[0], ids = [];
    SQUAD_TEMPLATE.slice(0, 18).concat(['GK', 'CB', 'CM', 'RW', 'ST']).forEach((pos, i) => {
      const p = makePlayer(R, world.players.length, pool, pos, n.rep - 2 + (i < 11 ? 3 : -3), -1, i); p.nat = n.id; p.pool = n.id; p.number = i + 1; world.players.push(p); ids.push(p.id);
    });
    world.natPools[n.id] = ids;
  });
  return world;
}
/** leaguesV3 migration for older worlds: append the six new league countries (existing ids untouched), then the nations. */
export function addLeagues(world) {
  let added = 0;
  for (const C of NEW_COUNTRIES) { if (world.countries.some(c => c.id === C.id)) continue; addCountry(world, mulberry32((world.seed ^ (C.id.charCodeAt(0) * 131 + C.id.charCodeAt(1))) >>> 0), C); added++; }
  buildNations(world); return added;
}
export function generateWorld(seed = 1, countries = ALL_COUNTRIES) {
  const R = mulberry32(seed);
  const world = { seed, version: 1, year: 2026, countries: [], clubs: [], players: [], transfers: [], news: [] };
  for (const C of countries) addCountry(world, R, C);
  if (countries === ALL_COUNTRIES) { buildNations(world); world.leaguesV3 = 1; }
  return world;
}

// ---------------------------------------------------------------- bridges to the match engine ------
/** Legacy club entry used by the match engine/menus: {n, a, c, s, k:[{c,c2,d}], wid} */
export function toLegacyClub(club) {
  return { n: club.name, a: club.abbr, c: club.colors[0], s: club.rep, k: club.kits.map(k => ({ c: k.c, c2: k.c2, d: k.d, socks: k.socks, sponsor: k.sponsor, collar: k.collar || null, cuff: k.cuff || null, spPos: k.spPos || 'chest' })), wid: club.id, crest: club.crest, stadium: club.stadium, town: club.town };
}
/** 18-man legacy squad from a world club: best XI by position balance + 7 subs. */
export function toLegacySquad(world, club) {
  const ps = club.squad.map(id => world.players[id]).filter(p => p && !(p.injury && p.injury.weeks > 0));
  const byRole = r => ps.filter(p => roleOf(p.pos) === r).sort((a, b) => b.ov - a.ov);
  const take = (r, n) => byRole(r).slice(0, n);
  let chosen = [...take('GK', 2), ...take('D', 6), ...take('M', 6), ...take('F', 4)];
  if (chosen.length < 18) for (const p of ps.sort((a, b) => b.ov - a.ov)) { if (chosen.length >= 18) break; if (!chosen.includes(p)) chosen.push(p); }
  if (chosen.length < 18) for (const id of club.squad) { const p = world.players[id]; if (chosen.length >= 18) break; if (p && !chosen.includes(p)) chosen.push(p); }
  const order = { GK: 0, D: 1, M: 2, F: 3 }; chosen.sort((a, b) => order[roleOf(a.pos)] - order[roleOf(b.pos)] || b.ov - a.ov);
  return chosen.slice(0, 18).map(p => ({ nm: p.name, pos: roleOf(p.pos), dpos: p.pos, style: p.style || (p.style = styleFor(p)), a: { pace: p.attrs.pace, pass: p.attrs.pass, shoot: p.attrs.shoot, def: p.attrs.def, drib: p.attrs.drib, dive: p.attrs.dive, hand: p.attrs.hand, reflex: p.attrs.reflex, pow: p.attrs.pow }, ov: p.ov, wid: p.id, look: p.look, face: Object.assign({ tone: p.look.tone, hair: p.look.hair, hc: p.look.hc, beard: p.look.beard }, p.face), body: p.body, age: p.age }));
}

// ---------------------------------------------------------------- world simulation helpers -----------
/** Simulate a result between two clubs by reputation (Poisson-ish). */
export function simResult(R, a, b) {
  const la = 1.35 * Math.pow(1.07, (a.rep - b.rep) / 3), lb = 1.1 * Math.pow(1.07, (b.rep - a.rep) / 3);
  const pois = l => { let k = 0, p = Math.exp(-l), s = p, u = R(); while (u > s && k < 9) { k++; p *= l / k; s += p; } return k; };
  return [pois(la), pois(lb)];
}
/** Weekly background: AI transfers between clubs, injuries heal, form drifts, news. */
export function worldWeek(world, R, week, protect = []) {
  const news = [];
  for (const p of world.players) {
    if (p.club < 0 || !world.clubs[p.club] || world.clubs[p.club].hidden) continue; // released / orphaned players and regional guest sides sit out
    if (p.injury) { p.injury.weeks--; if (p.injury.weeks <= 0) { p.injury = null; news.push({ type: 'fit', player: p.id, club: p.club, text: `${p.name} is back in training for ${world.clubs[p.club].name}.` }); } }
    else if (R() < 0.004) { p.injury = { weeks: 1 + Math.floor(R() * 8), type: ['hamstring', 'ankle', 'knee', 'groin', 'calf'][Math.floor(R() * 5)] }; news.push({ type: 'injury', player: p.id, club: p.club, weeks: p.injury.weeks, text: `${p.name} (${world.clubs[p.club].name}) out for ${p.injury.weeks} week${p.injury.weeks > 1 ? 's' : ''} with a ${p.injury.type} injury.` }); }
    p.form = clamp(p.form + gauss(R) * 3, 20, 95);
  }
  // 2-4 AI transfers per week across the world
  const n = 2 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const buyer = pick(R, world.clubs), p = pick(R, world.players); const seller = world.clubs[p.club];
    if (!seller || seller.hidden || buyer.hidden || seller.id === buyer.id || protect.includes(seller.id) || protect.includes(buyer.id) || p.ov < buyer.rep - 12 || p.ov > buyer.rep + 6) continue;
    const fee = Math.round(p.value * (0.9 + R() * 0.4) * 10) / 10; if (fee > buyer.budget) continue;
    transferPlayer(world, p.id, buyer.id, fee); news.push({ type: 'transfer', player: p.id, from: seller.id, to: buyer.id, fee, text: `${p.name} joins ${buyer.name} from ${seller.name} for €${fee}M.` });
  }
  world.news.push(...news.map(x => ({ ...x, week })));
  if (world.news.length > 300) world.news.splice(0, world.news.length - 300);
  return news;
}
export function transferPlayer(world, playerId, toClubId, fee = 0) {
  const p = world.players[playerId], from = world.clubs[p.club], to = world.clubs[toClubId];
  if (!to || from === to) return false;
  from.squad = from.squad.filter(id => id !== playerId); to.squad.push(playerId); from.budget = Math.round((from.budget + fee) * 10) / 10; to.budget = Math.round(Math.max(0, to.budget - fee) * 10) / 10;
  p.club = toClubId; p.contract = 2 + Math.floor(Math.random() * 3); p.number = Math.max(2, ...to.squad.map(id => world.players[id].number)) + 1;
  world.transfers.push({ player: playerId, from: from.id, to: toClubId, fee, year: world.year });
  return true;
}
/** Does a club accept selling this player for this fee, and will the player sign? Returns {sell, join, reason} */
export function negotiate(world, playerId, buyerId, fee, wage) {
  const p = world.players[playerId], seller = world.clubs[p.club], buyer = world.clubs[buyerId];
  const want = p.value * (p.ov >= seller.rep + 2 ? 1.6 : 1.15) * (p.age < 23 ? 1.25 : 1);
  const sell = fee >= want ? 1 : fee >= want * 0.85 ? 0.5 : fee >= want * 0.7 ? 0.2 : 0;
  const stepDown = seller.rep - buyer.rep; const join = p.ov > buyer.rep + 8 ? 0 : stepDown > 12 ? 0.1 : stepDown > 5 ? 0.45 : 0.9;
  const wageOk = wage >= p.wage * (stepDown > 0 ? 1.3 : 1.05);
  return { sell, join: wageOk ? join : join * 0.3, want: Math.round(want * 10) / 10, wageWant: Math.round(p.wage * (stepDown > 0 ? 1.3 : 1.05)), reason: sell === 0 ? `${seller.name} say ${p.name} is not for sale at that price (they value him at €${Math.round(want)}M).` : join < 0.3 ? `${p.name} is not convinced a move to ${buyer.name} is a step up.` : !wageOk ? `${p.name} wants at least €${Math.round(p.wage * (stepDown > 0 ? 1.3 : 1.05))}k a week.` : 'Talks are progressing.' };
}

/** Create one player in the world (used for the Player Career pro and squad rebuilds). */
export function createPlayer(world, countryId, pos, ov, clubId, opts = {}) {
  const C = COUNTRIES.find(c => c.id === countryId) || COUNTRIES[0], R = mulberry32((world.players.length + 1) * 7919 ^ world.seed);
  const p = makePlayer(R, world.players.length, C, pos, ov, clubId, 0);
  Object.assign(p, opts); if (opts.name) { const parts = opts.name.split(' '); p.first = parts[0]; p.last = parts.slice(1).join(' ') || parts[0]; }
  p.ov = overall(p); p.value = valueOf(p); p.wage = wageOf(p); p.number = Math.max(1, ...world.clubs[clubId].squad.map(id => world.players[id].number)) + 1;
  world.players.push(p); world.clubs[clubId].squad.push(p.id); return p;
}
/** Replace a club's squad with a fresh one of the given profile: youth | balanced | veterans */
export function rebuildSquad(world, club, profile = 'balanced') {
  const R = mulberry32(club.id * 31 + world.seed + 17);
  club.squad.forEach(id => { const p = world.players[id]; if (p) p.club = -1; }); club.squad = [];
  const C = COUNTRIES.find(c => c.id === club.country) || COUNTRIES[0];
  SQUAD_TEMPLATE.forEach((pos, i) => {
    const p = makePlayer(R, world.players.length, C, pos, club.rep - 4 + (i < 11 ? 2 : -3), club.id, i);
    if (profile === 'youth') { p.age = 17 + Math.floor(R() * 5); for (const k in p.attrs) p.attrs[k] = clamp(p.attrs[k] - 5, 30, 99); }
    if (profile === 'veterans') { p.age = 29 + Math.floor(R() * 6); for (const k in p.attrs) p.attrs[k] = clamp(p.attrs[k] + 3, 30, 99); }
    p.ov = overall(p); p.value = valueOf(p); p.wage = wageOf(p); p.number = i < 11 ? i + 1 : 12 + (i - 11);
    world.players.push(p); club.squad.push(p.id);
  });
}
/** National team as a club-like object built from the best players of a nationality. */
export function nationalTeam(world, countryId) {
  if (!world.nations) buildNations(world);
  const ni = world.nations.findIndex(n => n.id === countryId), N = world.nations[ni], C = { name: N.name, id: N.id, colors: N.colors, idx: ni };
  const ps = world.players.filter(p => p.nat === countryId && (p.club >= 0 || p.pool === countryId)).sort((a, b) => b.ov - a.ov);
  const byRole = r => ps.filter(p => roleOf(p.pos) === r); const squad = [...byRole('GK').slice(0, 3), ...byRole('D').slice(0, 7), ...byRole('M').slice(0, 7), ...byRole('F').slice(0, 5)].map(p => p.id);
  const col = C.colors; return { id: 1000 + C.idx, name: C.name, short: C.name, abbr: C.id.toUpperCase().slice(0, 2) + 'N', confed: N.confed, flag: N.flag, country: C.id, town: C.name, colors: col, rep: Math.round(squad.slice(0, 11).reduce((s, id) => s + world.players[id].ov, 0) / 11), budget: 0, kits: [{ c: col[0], c2: col[1], d: 0, socks: col[0], sponsor: '' }, { c: col[1], c2: col[0], d: 1, socks: col[1], sponsor: '' }, { c: col[2], c2: col[1], d: 3, socks: col[2], sponsor: '' }], crest: { shape: 1, motif: 11, border: 2, c1: col[0], c2: col[1] || '#f8fafc', c3: col[2] || col[0], letter: C.name[0], year: null, seed: ni + 1, flag: N.flag }, stadium: 'capital-dome', rivals: [], squad, tactic: 0, manager: 'National coach', national: true };
}
