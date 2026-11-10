// Starting looks for created players and managers: 20 distinct appearances across skin tones, hairstyles,
// facial hair, face shapes and builds. A preset only fills the editor; every field stays editable afterwards.
// tone = index into SK (8 tones), hair = HSN index, hc = hair colour, beard 0-3, face sliders 0..1, body h/w/wing/leg 0..1.
const F = (nose, nosew, eyeS, eyeSp, brow, lip, jaw, head, ear = 0.5) => ({ nose, nosew, eyeS, eyeSp, brow, lip, jaw, head, ear });
export const PRESETS = [
  { n: 'Kigali striker', tone: 0, hair: 13, hc: '#0a0a0a', beard: 1, face: F(.55, .6, .5, .5, .45, .6, .55, .5), body: { h: .55, w: .5, wing: .55, leg: .55 }, boots: 1, bc1: '#f8fafc', bc2: '#dc2626' },
  { n: 'Lakeside playmaker', tone: 1, hair: 15, hc: '#14100c', beard: 0, face: F(.45, .5, .55, .5, .5, .5, .45, .45), body: { h: .45, w: .4, wing: .5, leg: .5 }, boots: 0, bc1: '#111827', bc2: '#f8fafc' },
  { n: 'Highland wall', tone: 0, hair: 5, hc: '#0a0a0a', beard: 3, face: F(.6, .65, .45, .5, .6, .55, .7, .6), body: { h: .8, w: .7, wing: .6, leg: .55 }, boots: 2, bc1: '#111827', bc2: '#facc15' },
  { n: 'Coastal winger', tone: 2, hair: 9, hc: '#2b1d12', beard: 1, face: F(.5, .5, .55, .55, .5, .55, .4, .45), body: { h: .35, w: .3, wing: .45, leg: .55 }, boots: 1, bc1: '#f97316', bc2: '#111827' },
  { n: 'Northern keeper', tone: 5, hair: 1, hc: '#c9a65a', beard: 0, face: F(.5, .45, .5, .5, .45, .45, .55, .55), body: { h: .9, w: .55, wing: .7, leg: .65 }, boots: 0, bc1: '#0ea5e9', bc2: '#f8fafc' },
  { n: 'Iberian creator', tone: 4, hair: 10, hc: '#2b1d12', beard: 2, face: F(.55, .45, .5, .45, .55, .5, .5, .5), body: { h: .45, w: .45, wing: .5, leg: .5 }, boots: 3, bc1: '#111827', bc2: '#f8fafc' },
  { n: 'Sahel full-back', tone: 1, hair: 11, hc: '#0a0a0a', beard: 2, face: F(.6, .6, .45, .5, .5, .6, .6, .55), body: { h: .5, w: .45, wing: .5, leg: .6 }, boots: 1, bc1: '#22c55e', bc2: '#111827' },
  { n: 'Twists No. 10', tone: 0, hair: 15, hc: '#0a0a0a', beard: 0, face: F(.5, .55, .6, .5, .4, .55, .45, .45), body: { h: .4, w: .35, wing: .45, leg: .5 }, boots: 2, bc1: '#a855f7', bc2: '#f8fafc' },
  { n: 'Long dreads', tone: 1, hair: 16, hc: '#14100c', beard: 1, face: F(.5, .55, .5, .5, .5, .55, .5, .5), body: { h: .6, w: .5, wing: .55, leg: .55 }, boots: 0, bc1: '#111827', bc2: '#ef4444' },
  { n: 'Eastern forward', tone: 3, hair: 0, hc: '#0a0a0a', beard: 0, face: F(.4, .45, .45, .55, .45, .45, .45, .5), body: { h: .5, w: .4, wing: .5, leg: .5 }, boots: 1, bc1: '#f8fafc', bc2: '#111827' },
  { n: 'Veteran captain', tone: 4, hair: 12, hc: '#4a3322', beard: 3, face: F(.55, .5, .45, .5, .6, .5, .65, .6), body: { h: .6, w: .6, wing: .55, leg: .5 }, boots: 3, bc1: '#111827', bc2: '#c9a65a' },
  { n: 'Afro midfielder', tone: 0, hair: 2, hc: '#0a0a0a', beard: 1, face: F(.55, .6, .55, .5, .5, .6, .5, .55), body: { h: .5, w: .5, wing: .55, leg: .5 }, boots: 2, bc1: '#facc15', bc2: '#111827' },
  { n: 'Mohawk pace', tone: 2, hair: 6, hc: '#14100c', beard: 1, face: F(.5, .5, .5, .5, .55, .5, .5, .45), body: { h: .4, w: .35, wing: .45, leg: .6 }, boots: 1, bc1: '#ec4899', bc2: '#111827' },
  { n: 'Fade and stubble', tone: 1, hair: 11, hc: '#0a0a0a', beard: 1, face: F(.5, .55, .5, .5, .5, .55, .55, .5), body: { h: .55, w: .5, wing: .5, leg: .55 }, boots: 0, bc1: '#0a0a0a', bc2: '#22d3ee' },
  { n: 'Curly top', tone: 3, hair: 7, hc: '#2b1d12', beard: 0, face: F(.45, .5, .6, .55, .4, .5, .4, .45), body: { h: .35, w: .35, wing: .45, leg: .5 }, boots: 2, bc1: '#f8fafc', bc2: '#16a34a' },
  { n: 'Nordic centre-back', tone: 6, hair: 5, hc: '#c9a65a', beard: 2, face: F(.5, .45, .45, .5, .55, .45, .65, .6), body: { h: .85, w: .65, wing: .65, leg: .6 }, boots: 0, bc1: '#1d4ed8', bc2: '#f8fafc' },
  { n: 'Braided winger', tone: 0, hair: 17, hc: '#0a0a0a', beard: 0, face: F(.5, .55, .55, .5, .45, .6, .45, .5), body: { h: .45, w: .4, wing: .5, leg: .55 }, boots: 1, bc1: '#f8fafc', bc2: '#7c3aed' },
  { n: 'Cornrows anchor', tone: 1, hair: 13, hc: '#0a0a0a', beard: 2, face: F(.6, .6, .45, .5, .6, .55, .6, .55), body: { h: .6, w: .6, wing: .55, leg: .5 }, boots: 3, bc1: '#111827', bc2: '#f8fafc' },
  { n: 'Slick-back sweeper', tone: 5, hair: 12, hc: '#2b1d12', beard: 1, face: F(.5, .45, .5, .5, .5, .45, .55, .55), body: { h: .7, w: .5, wing: .6, leg: .6 }, boots: 0, bc1: '#f8fafc', bc2: '#0ea5e9' },
  { n: 'Buzz cut poacher', tone: 7, hair: 5, hc: '#4a3322', beard: 0, face: F(.45, .5, .5, .55, .45, .5, .5, .5), body: { h: .5, w: .45, wing: .5, leg: .55 }, boots: 1, bc1: '#dc2626', bc2: '#f8fafc' },
];
