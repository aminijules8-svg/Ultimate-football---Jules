// Spoken commentary v2 (Phase 19): an event bus the match feeds (kick-off, passes, through balls, crosses, skills,
// tackles, interceptions, shots, saves, rebounds, woodwork, misses, corners, free kicks, penalties, offsides, fouls
// and cards, goals incl. equalisers and late winners, half and full time, finals). Lines live in banks with
// variables, a priority, a weight and a voice (lead commentator or co-commentator). Per-event cooldowns, a global
// gap between ordinary lines and a no-repeat window keep it from babbling; only goals, cards and saves interrupt.
// Speech goes through the browser's own voices (src/audio/voice.js); `test()` replays a scripted event list
// without speaking so the choices can be checked headlessly.
import { voice } from './voice.js';

const L = (t, o = {}) => Object.assign({ t, w: 1, co: false }, o);
const BANK = {
  kickoff: [L('And we are under way.'), L('The referee gets us started.'), L('Kick-off at a packed ground.', { co: true })],
  restart: [L('Back under way.'), L('They restart from the centre.')],
  pass: [L('{n} keeps it simple.'), L('Neat pass from {n}.'), L('{n} finds a team-mate.'), L('Good ball from {n}.'), L('{t} patient in possession.', { co: true })],
  long: [L('{n} switches the play.'), L('A long ball from {n}.'), L('{n} goes long.'), L('He has seen the run — a big diagonal from {n}.', { co: true })],
  through: [L('{n} slides it through!'), L('Lovely through ball from {n}.'), L('{n} splits the defence!'), L('That is a proper pass, that.', { co: true })],
  cross: [L('{n} whips it in!'), L('Cross from {n}…'), L('{n} delivers from the flank.'), L('Into the box…')],
  dribble: [L('{n} takes him on.'), L('{n} drives forward.'), L('{n} is away!'), L('Lovely feet from {n}.', { co: true })],
  skill: [L('Lovely skill from {n}!'), L('{n} leaves him for dead!'), L('Showboating from {n}.'), L('Oh, that is cheeky.', { co: true })],
  tackle: [L('Great tackle by {n}.'), L('{n} wins it back.'), L('Superb timing from {n}.'), L('Crunching challenge — fair, though.', { co: true })],
  intercept: [L('Intercepted by {n}.'), L('{n} reads it.'), L('Cut out by {n}.'), L('He saw that coming a mile off.', { co: true })],
  shot: [L('He lets fly!'), L('A powerful effort!'), L('{n} shoots!'), L('Shot from {n}…')],
  shot_on: [L('{n} tests the keeper!'), L('On target from {n}!'), L('{n} forces a stop!')],
  save: [L('Saved!'), L('Great save!'), L('The keeper gets down well.'), L('Kept out by {n}!'), L('What a stop that is.', { co: true })],
  rebound: [L('It comes back out…'), L('Rebound in the box!'), L('Loose ball — who wants it?')],
  post: [L('That was inches away!'), L('So close — off the woodwork!'), L('The post saves them!')],
  bar: [L('Off the crossbar!'), L('Rattles the bar!'), L('Against the bar from {n}!')],
  miss: [L('{n} will be disappointed — wide by inches!'), L('Just past the post from {n}!'), L('{n} drags it wide.'), L('He should hit the target from there.', { co: true })],
  corner: [L('Corner to {t}.'), L('{t} have a corner.'), L('Into the box from the corner…')],
  freekick: [L('Free kick to {t}.'), L('{t} have a free kick.'), L('A chance to deliver for {t}.')],
  freekick_shot: [L('Here comes the strike!'), L('{n} steps up…'), L('A dead-ball specialist!')],
  penalty: [L('Penalty to {t}!'), L('The referee points to the spot!'), L('Penalty! Huge moment for {t}.')],
  throw: [L('Throw-in to {t}.')],
  goalkick: [L('Goal kick.'), L('{t} restart from the back.')],
  offside: [L('The flag is up — offside.'), L('Offside against {n}.'), L('He was a yard off there.', { co: true })],
  foul: [L('The referee blows for a foul.'), L('That challenge was late!'), L('Free kick — foul by {n}.')],
  advantage: [L('The referee plays the advantage.'), L('Advantage played — play on!')],
  yellow: [L('Yellow card for {n}.'), L('{n} goes into the book.'), L('A caution for {n} of {t}.')],
  red: [L('Red card! {n} is off!'), L('{n} has been sent off — {t} down to ten.'), L('Straight red for {n}!')],
  goal: [L('What a finish from {n}!'), L('{n} makes no mistake!'), L('The net bulges — {n} scores!'), L('{n} finds the net! {s}.'), L('Goal! {t} lead through {n}.'), L('Goal! It is in — {s}.'), L('The net bulges for {t}!')],
  header_goal: [L('{n} rises highest — what a header!'), L('Header! {n} powers it in!'), L('Headed in! {t} score.')],
  long_goal: [L('Wonder strike from {n}!'), L('{n} from distance — unstoppable!'), L('From there?! {n} has scored a screamer!', { co: true }), L('A screamer from distance for {t}!')],
  equaliser: [L('{n} equalises! It is {s}.'), L('Level again — {n} with the equaliser!'), L('Game on! {n} pulls {t} level.'), L('{t} are level! {s}.')],
  late_winner: [L('{n} in the {m}th minute — surely the winner!'), L('Late drama! {n} scores for {t}!'), L('They have left it late — {n} wins it for {t}!'), L('Late, late drama for {t}! {s}.')],
  half: [L('That is half time. {s}.'), L('The referee brings the first half to a close. {s}.')],
  full: [L('And that is full time. {s}.'), L('Full time. {s}.')],
  final_win: [L('{t} have won the final! {s}.'), L('Champions! {t} lift the trophy — {s}.')],
  final_loss: [L('Heartbreak for {t} in the final. {s}.')],
  qualify: [L('{t} go through to the next round.')],
};
const PRIO = { goal: 2, header_goal: 2, long_goal: 2, equaliser: 2, late_winner: 2, yellow: 2, red: 2, save: 2, full: 2, final_win: 2, final_loss: 2, penalty: 1, half: 1, post: 1, bar: 1, kickoff: 1 };
const COOL = { pass: 16, long: 14, through: 10, cross: 9, dribble: 9, skill: 6, tackle: 7, intercept: 9, shot: 3, shot_on: 3, save: 2, rebound: 4, post: 2, bar: 2, miss: 3, corner: 5, freekick: 5, freekick_shot: 3, penalty: 2, throw: 40, goalkick: 45, offside: 4, foul: 4, advantage: 4, restart: 8 };
const GAP = 4;   // seconds between ordinary (priority 0) lines
const WINDOW = 10;  // recent lines that may not repeat
const words = t => Math.max(2, String(t).split(/\s+/).length);

export const commentary = {
  vol: 0.9, enabled: true, mute: false,
  _cool: {}, _recent: [], _lastAny: -1e9, _busyUntil: -1e9, _log: [],
  reset() { this._cool = {}; this._recent = []; this._lastAny = -1e9; this._busyUntil = -1e9; this._log = []; },
  fill(t, c) { return t.replace(/\{n\}/g, c.n || 'he').replace(/\{t\}/g, c.t || 'they').replace(/\{o\}/g, c.o || 'the opposition').replace(/\{m\}/g, c.m != null ? String(c.m) : '90').replace(/\{s\}/g, c.s || ''); },
  /** Chooses a line for an event at sim time `now` (seconds) or returns null with the reason. */
  pick(type, ctx = {}, now = 0) {
    const bank = BANK[type]; if (!bank) return { skip: 'unknown' };
    const prio = PRIO[type] || 0, cool = COOL[type] || 0;
    if (cool && now - (this._cool[type] ?? -1e9) < cool) return { skip: 'cooldown' };
    if (prio === 0 && now - this._lastAny < GAP) return { skip: 'gap' };
    if (prio === 0 && now < this._busyUntil) return { skip: 'busy' };
    const usable = ctx.n ? bank : (bank.filter(l => !/\{n\}/.test(l.t)).length ? bank.filter(l => !/\{n\}/.test(l.t)) : bank);  // no name known → name-free lines
    const fresh = usable.map(l => [l, bank.indexOf(l)]).filter(([, i]) => !this._recent.includes(type + ':' + i));
    const pool = fresh.length ? fresh : usable.map(l => [l, bank.indexOf(l)]);
    let total = pool.reduce((s, [l]) => s + l.w, 0), r = Math.random() * total, chosen = pool[0];
    for (const e of pool) { r -= e[0].w; if (r <= 0) { chosen = e; break; } }
    const [line, idx] = chosen, text = this.fill(line.t, ctx);
    this._cool[type] = now; this._recent.push(type + ':' + idx); if (this._recent.length > WINDOW) this._recent.shift();
    if (prio === 0) this._lastAny = now;
    const dur = words(text) * 0.36; this._busyUntil = Math.max(prio === 2 ? now : this._busyUntil, now) + dur;
    return { text, prio, co: !!line.co, type, dur };
  },
  /** Picks and speaks (unless muted). Returns the line for the caption. */
  event(type, ctx, now) {
    const r = this.pick(type, ctx, now); if (!r || r.skip) return null;
    this._log.push([+now.toFixed(1), type, r.text]); if (this._log.length > 60) this._log.shift();
    if (this.enabled && !this.mute) this.speak(r);
    return r;
  },
  speak(r) { voice.vol = this.vol; voice.say(r.text, { prio: r.prio, rate: r.co ? 1.0 : 1.08, pitch: r.co ? 0.9 : 1.0, pa: r.co }); },
  /** Scripted replay without speech: [[type, ctx, time], …] → decisions. */
  test(events) {
    const sv = [this._cool, this._recent, this._lastAny, this._busyUntil]; this.reset();
    const out = events.map(([type, ctx, t]) => { const r = this.pick(type, ctx || {}, t); return Object.assign({ t, type }, r); });
    [this._cool, this._recent, this._lastAny, this._busyUntil] = sv; return out;
  },
  get types() { return Object.keys(BANK); },
};
