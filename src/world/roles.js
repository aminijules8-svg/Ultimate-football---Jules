// Positions and playstyles. A position decides the match-engine role (GK/D/M/F) and which side of the formation
// the player takes; a playstyle sets trait flags that bias the AI (runs, width, pressing, shooting, holding the
// ball) without taking control away from the user. World players get a style from their attributes once
// (`styleFor`), the pro picks one in the creator.
export const POSITIONS = ['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'DMF', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'];
export const POS_NAME = { GK: 'Goalkeeper', RB: 'Right-back', CB: 'Centre-back', LB: 'Left-back', RWB: 'Right wing-back', LWB: 'Left wing-back', DMF: 'Defensive midfielder', CM: 'Central midfielder', CAM: 'Attacking midfielder', RM: 'Right midfielder', LM: 'Left midfielder', RW: 'Right winger', LW: 'Left winger', CF: 'Centre-forward', ST: 'Striker' };
// role = engine role, side = sign of the formation slot's y (+ right, - left, 0 central)
export const POS_SLOT = { GK: { role: 'GK', side: 0 }, RB: { role: 'D', side: 1 }, CB: { role: 'D', side: 0 }, LB: { role: 'D', side: -1 }, RWB: { role: 'D', side: 1 }, LWB: { role: 'D', side: -1 }, DMF: { role: 'M', side: 0 }, CM: { role: 'M', side: 0 }, CAM: { role: 'M', side: 0 }, RM: { role: 'M', side: 1 }, LM: { role: 'M', side: -1 }, RW: { role: 'F', side: 1 }, LW: { role: 'F', side: -1 }, CF: { role: 'F', side: 0 }, ST: { role: 'F', side: 0 } };
export const POS_GROUPS = [['Goalkeeper', ['GK']], ['Defence', ['CB', 'RB', 'LB', 'RWB', 'LWB']], ['Midfield', ['DMF', 'CM', 'CAM', 'RM', 'LM']], ['Attack', ['RW', 'LW', 'CF', 'ST']]];
export const POS_NUMBER = { GK: 1, RB: 2, CB: 4, LB: 3, RWB: 2, LWB: 3, DMF: 6, CM: 8, CAM: 10, RM: 7, LM: 11, RW: 7, LW: 11, CF: 9, ST: 9 };
export const roleOf = pos => (POS_SLOT[pos] || POS_SLOT.CM).role;

const S = (id, n, d, tr) => ({ id, n, d, tr });
const FB = [S('overlap', 'Overlapping full-back', 'Bombs forward outside the winger to cross.', { overlap: 1, width: 1 }), S('inverted', 'Inverted full-back', 'Steps inside into midfield when we have the ball.', { inside: 1, play: 1 }), S('defensive', 'Defensive full-back', 'Stays home and defends the flank.', { stayback: 1, wall: 1 })];
const WING = [S('winger', 'Traditional winger', 'Hugs the touchline and crosses.', { width: 1, cross: 1 }), S('inside', 'Inside forward', 'Cuts in from the wing to shoot.', { inside: 1, fin: 1 }), S('inverted', 'Inverted winger', 'Drifts inside to create.', { inside: 1, play: 1 }), S('wideplay', 'Wide playmaker', 'Keeps width and picks passes.', { width: 1, play: 1 }), S('pressw', 'Pressing winger', 'Hunts the full-back when we lose it.', { press: 1, pace: 1 })];
export const STYLES = {
  GK: [S('line', 'Traditional keeper', 'Stays on the line and commands the box.', {}), S('sweeper', 'Sweeper keeper', 'Rushes out to loose balls behind the defence.', { sweep: 1 }), S('ballgk', 'Ball-playing keeper', 'Starts attacks with short passes.', { play: 1 })],
  CB: [S('stopper', 'Stopper', 'Steps out to win the ball early.', { wall: 1, stopper: 1 }), S('cover', 'Cover defender', 'Sits deepest and sweeps up behind.', { cover: 1 }), S('ballplay', 'Ball-playing centre-back', 'Carries and passes out from the back.', { ballplay: 1, play: 1 })],
  RB: FB, LB: FB, RWB: [S('wingback', 'Wing-back', 'Runs the whole flank, both ways.', { overlap: 1, width: 1, b2b: 1 }), ...FB], LWB: [S('wingback', 'Wing-back', 'Runs the whole flank, both ways.', { overlap: 1, width: 1, b2b: 1 }), ...FB],
  DMF: [S('anchor', 'Anchor', 'Sits in front of the defence and releases early.', { anchor: 1, wall: 1 }), S('bwm', 'Ball-winning midfielder', 'Presses and tackles to regain the ball.', { wall: 1, press: 1 }), S('regista', 'Deep-lying playmaker', 'Dictates from deep with long passes.', { play: 1, anchor: 1 }), S('holding', 'Holding midfielder', 'Screens the back four, keeps it simple.', { anchor: 1 })],
  CM: [S('b2b', 'Box-to-box', 'Runs from box to box all match.', { b2b: 1 }), S('dlp', 'Deep-lying playmaker', 'Drops deep to start moves.', { play: 1, anchor: 1 }), S('mezzala', 'Mezzala', 'Drifts into the half-space and arrives late.', { inside: 1, b2b: 1 }), S('creator', 'Central creator', 'Looks for the killer pass.', { play: 1 }), S('bwm', 'Ball-winning midfielder', 'Presses and tackles.', { wall: 1, press: 1 })],
  CAM: [S('ap', 'Advanced playmaker', 'Finds the forwards between the lines.', { play: 1 }), S('shadow', 'Shadow striker', 'Arrives late in the box to finish.', { poach: 1, fin: 1 }), S('free', 'Free-roaming creator', 'Goes where the space is.', { play: 1, pace: 1 })],
  RM: WING.slice(0, 4), LM: WING.slice(0, 4), RW: WING, LW: WING,
  CF: [S('false9', 'False nine', 'Drops deep to link play, drags defenders out.', { false9: 1, play: 1 }), S('complete', 'Complete forward', 'Scores, holds up and links.', { fin: 1, target: 1, play: 1 }), S('deep', 'Deep-lying forward', 'Plays between the lines and brings others in.', { false9: 1, play: 1 }), S('advanced', 'Advanced forward', 'Leads the line and runs the channels.', { poach: 1, pace: 1 })],
  ST: [S('poacher', 'Goal poacher', 'Lives on the last defender, finishes chances.', { poach: 1, fin: 1 }), S('target', 'Target man', 'Holds the ball up, wins headers.', { target: 1, hea: 1 }), S('advanced', 'Advanced forward', 'Runs in behind at pace.', { poach: 1, pace: 1 }), S('pressing', 'Pressing forward', 'Starts the press from the front.', { press: 1, pace: 1 }), S('complete', 'Complete forward', 'Scores, holds up and links.', { fin: 1, target: 1, play: 1 })],
};
export const styleName = (pos, id) => { const s = (STYLES[pos] || []).find(x => x.id === id); return s ? s.n : ''; };
export const styleFlags = (pos, id) => { const s = (STYLES[pos] || []).find(x => x.id === id); return s ? s.tr : {}; };
export const defaultStyle = pos => (STYLES[pos] || STYLES.CM)[0].id;
/** A deterministic style from a world player's position and attributes. */
export function styleFor(p) {
  const a = p.attrs || {}, pos = p.pos, g = (k, d = 60) => a[k] == null ? d : a[k];
  const list = STYLES[pos] || STYLES.CM, has = id => list.some(s => s.id === id) ? id : list[0].id;
  if (pos === 'GK') return has(g('dive') >= 72 ? 'sweeper' : g('pass') >= 62 ? 'ballgk' : 'line');
  if (pos === 'CB') return has(g('pass') >= 66 ? 'ballplay' : g('pace') >= g('def') ? 'cover' : 'stopper');
  if (['RB', 'LB', 'RWB', 'LWB'].includes(pos)) return has(pos.endsWith('WB') ? 'wingback' : g('pass') >= 66 && g('pace') < 70 ? 'inverted' : g('pace') >= 66 ? 'overlap' : 'defensive');
  if (pos === 'DMF') return has(g('pass') >= 70 ? 'regista' : g('def') >= 70 ? 'bwm' : 'anchor');
  if (pos === 'CM') return has(g('pass') >= 72 ? 'creator' : g('def') >= 68 ? 'bwm' : g('pace') >= 68 ? 'b2b' : 'dlp');
  if (pos === 'CAM') return has(g('shoot') >= 70 ? 'shadow' : g('pace') >= 72 ? 'free' : 'ap');
  if (['RM', 'LM', 'RW', 'LW'].includes(pos)) return has(g('shoot') >= 68 ? 'inside' : g('pass') >= 70 ? 'wideplay' : g('def') >= 60 ? 'pressw' : 'winger');
  if (pos === 'CF') return has(g('pass') >= 68 ? 'false9' : g('pow') >= 70 ? 'complete' : 'advanced');
  return has(g('pow') >= g('shoot') + 4 ? 'target' : g('pace') >= 78 ? 'advanced' : g('def') >= 55 ? 'pressing' : 'poacher');
}
