// Regional tournaments (East & Central Africa): the Rwanda league re-skinned with look-alike club identities
// (recognisable by town, colours and nickname — names are invented, PES-style), regional clubs for the Kagame
// Cup, regional national teams and a World Legends XI. All player names are invented. Applied once to a world.
import { mulberry32, makePlayer, overall, valueOf, wageOf, pickStadium, roleOf } from './gen.js';
import { COUNTRIES } from './names.js';

export const REGIONAL_V = 1;

// [name, abbr, town, colours (home, second, third), reputation]
const RW_CLUBS = [
  ['Kigali Patriots', 'PAT', 'Kigali', ['#111111', '#f8fafc', '#ca8a04'], 80],
  ['Nyanza Blues', 'NYB', 'Nyanza', ['#1d4ed8', '#f8fafc', '#facc15'], 79],
  ['Police Kigali', 'POL', 'Kigali', ['#1e3a8a', '#facc15', '#f8fafc'], 76],
  ['Kigali City Sporting', 'KCS', 'Kigali', ['#f8fafc', '#b91c1c', '#111827'], 74],
  ['Huye Victory', 'HUV', 'Huye', ['#111827', '#facc15', '#f8fafc'], 73],
  ['Kiyovu Greens', 'KIY', 'Kigali', ['#15803d', '#f8fafc', '#111827'], 72],
  ['Gasogi City', 'GAS', 'Kigali', ['#6d28d9', '#f8fafc', '#facc15'], 70],
  ['Rubavu Mariners', 'MAR', 'Rubavu', ['#0369a1', '#f8fafc', '#111827'], 68],
  ['Musanze Volcanoes', 'MUS', 'Musanze', ['#ea580c', '#111827', '#f8fafc'], 67],
  ['Rubavu Sparks', 'SPK', 'Rubavu', ['#dc2626', '#111827', '#f8fafc'], 66],
  ['Bugesera Hornets', 'BUG', 'Bugesera', ['#f59e0b', '#111827', '#f8fafc'], 66],
  ['Gorillas Kigali', 'GOR', 'Kigali', ['#1f2937', '#a3e635', '#f8fafc'], 66],
  ['Nyamagabe Warriors', 'NYW', 'Nyamagabe', ['#166534', '#facc15', '#f8fafc'], 64],
  ['Muhazi Lakers', 'MUH', 'Rwamagana', ['#0e7490', '#f8fafc', '#facc15'], 63],
  ['Rutsiro Highlanders', 'RUT', 'Rutsiro', ['#7f1d1d', '#f8fafc', '#111827'], 62],
  ['Eastern Sunrise', 'SUN', 'Nyagatare', ['#f97316', '#1e3a8a', '#f8fafc'], 62],
  ['Rusizi Hope', 'RUS', 'Rusizi', ['#16a34a', '#facc15', '#111827'], 61],
  ['Muhanga Athletic', 'MUA', 'Muhanga', ['#be123c', '#f8fafc', '#111827'], 60],
  ['Kigali Heroes', 'HER', 'Kigali', ['#0f172a', '#ef4444', '#f8fafc'], 60],
  ['Vision Kigali', 'VIS', 'Kigali', ['#0ea5e9', '#111827', '#f8fafc'], 59],
];

// regional name pools (invented combinations of common names)
const POOLS = {
  ug: { id: 'ug', name: 'Uganda', first: ['Emmanuel', 'Allan', 'Moses', 'Joseph', 'Isaac', 'Denis', 'Ivan', 'Farouk', 'Ronald', 'Steven', 'Hassan', 'Brian', 'Godfrey', 'Patrick', 'Martin', 'Derrick', 'Shafik', 'Rogers', 'Bobosi', 'Milton'],
    last: ['Okello', 'Mukasa', 'Ssekitto', 'Kizito', 'Wasswa', 'Onyango', 'Ochieng', 'Kateregga', 'Mubiru', 'Nsubuga', 'Byaruhanga', 'Kasirye', 'Lubega', 'Ssemakula', 'Mutyaba', 'Waiswa', 'Opio', 'Ochan', 'Kalanzi', 'Ssewanyana'] },
  ke: { id: 'ke', name: 'Kenya', first: ['Michael', 'Dennis', 'Victor', 'Eric', 'Kevin', 'Brian', 'Collins', 'Joash', 'Duncan', 'Clifton', 'Kenneth', 'Ayub', 'Johanna', 'Elvis', 'Musa', 'Benson', 'Cliff', 'Lawrence', 'Teddy', 'Amos'],
    last: ['Otieno', 'Odhiambo', 'Mwangi', 'Kamau', 'Omondi', 'Wafula', 'Njoroge', 'Kiprono', 'Ouma', 'Mutua', 'Achieng', 'Simiyu', 'Kibet', 'Oduor', 'Nyamweya', 'Wekesa', 'Owino', 'Kariuki', 'Barasa'] },
  tz: { id: 'tz', name: 'Tanzania', first: ['Abdallah', 'Juma', 'Salum', 'Ibrahim', 'Saimon', 'Erasto', 'Haji', 'Mzamiru', 'Kibu', 'Shomari', 'Dickson', 'Aishi', 'Novatus', 'Bakari', 'Yusuph', 'Clement', 'Kelvin'],
    last: ['Mwakalebela', 'Mshamu', 'Kibwana', 'Hamisi', 'Mapunda', 'Mohamed', 'Shabani', 'Kitwana', 'Nyoni', 'Banda', 'Mrisho', 'Chuma', 'Makame', 'Mgaya', 'Lyimo', 'Kessy'] },
  bi: { id: 'bi', name: 'Burundi', first: ['Cédric', 'Gaël', 'Fiston', 'Pierre', 'Shassiri', 'Bienvenue', 'Frédéric', 'Jonathan', 'Elvis', 'Christophe', 'Amissi', 'Hussein', 'Moussa', 'Olivier', 'Emery', 'Didier', 'Abdul', 'Bonfils', 'Duhamel'],
    last: ['Nduwimana', 'Ndikumana', 'Nizigiyimana', 'Bigirimana', 'Nahimana', 'Hakizimana', 'Irambona', 'Kwizera', 'Ndayisenga', 'Nshimirimana', 'Manirakiza', 'Niyonkuru', 'Habonimana', 'Ciza', 'Bizimungu', 'Mbonihankuye', 'Nimbona', 'Ruvumbu'] },
  cd: { id: 'cd', name: 'Congo', first: ['Fiston', 'Glody', 'Jackson', 'Chancel', 'Merveille', 'Héritier', 'Trésor', 'Dieumerci', 'Junior', 'Arsène', 'Christian', 'Joël', 'Ricky', 'Bienvenu', 'Gloire', 'Exaucé', 'Landry', 'Cédric', 'Patou', 'Doxa'],
    last: ['Kalonji', 'Kabeya', 'Ilunga', 'Tshibangu', 'Mukendi', 'Mputu', 'Kasongo', 'Makusu', 'Bolingi', 'Muleka', 'Nsimba', 'Kabangu', 'Mulumba', 'Lomboto', 'Mosengo', 'Kiaku'] },
  et: { id: 'et', name: 'Ethiopia', first: ['Abubeker', 'Gatoch', 'Saladin', 'Amanuel', 'Biniam', 'Dawit', 'Henok', 'Mesfin', 'Yared', 'Tesfaye', 'Surafel', 'Aschalew', 'Bereket', 'Fasika', 'Kidus', 'Mujib', 'Natnael', 'Yonatan'],
    last: ['Kebede', 'Tadesse', 'Bekele', 'Girma', 'Haile', 'Mengistu', 'Wolde', 'Desta', 'Abebe', 'Assefa', 'Gebre', 'Alemu', 'Tefera', 'Nega', 'Mekonnen', 'Teshome', 'Worku', 'Yohannes', 'Demissie', 'Berhanu'] },
  sd: { id: 'sd', name: 'Sudan', first: ['Mohamed', 'Ahmed', 'Abdelrahman', 'Ramadan', 'Musab', 'Mazin', 'Yasir', 'Salah', 'Omer', 'Bakhit', 'Mohanad', 'Hamza', 'Faris', 'Abuaagla', 'Sharaf', 'Ali', 'Khalid', 'Amir', 'Tajeldin'],
    last: ['Abdalla', 'Elnour', 'Hassan', 'Omer', 'Osman', 'Babiker', 'Eltayeb', 'Ibrahim', 'Mustafa', 'Musa', 'Yousif', 'Adam', 'Kamal', 'Ahmed', 'Saeed', 'Bashir', 'Idris', 'Hamid', 'Nasr', 'Gasim'] },
  ss: { id: 'ss', name: 'South Sudan', first: ['Atak', 'Peter', 'Majak', 'Deng', 'Garang', 'Manyang', 'Lual', 'Mabior', 'Machar', 'Akol', 'Wani', 'Kuol', 'Bol', 'Thon', 'James', 'Joseph', 'Simon', 'Daniel', 'Gabriel', 'Emmanuel'],
    last: ['Lomodo', 'Deng', 'Garang', 'Malek', 'Akech', 'Majok', 'Wol', 'Kuol', 'Ajak', 'Chol', 'Mayen', 'Bol', 'Akot', 'Ladu', 'Lado', 'Mading', 'Ring', 'Atem', 'Dut', 'Alier'] },
  zn: { id: 'zn', name: 'Zanzibar', first: ['Abdulla', 'Suleiman', 'Khamis', 'Ali', 'Said', 'Omar', 'Mussa', 'Haji', 'Ameir', 'Nassor', 'Makame', 'Issa', 'Rashid', 'Mohamed', 'Juma', 'Hassan', 'Seif', 'Salim', 'Hamad', 'Faki'],
    last: ['Makame', 'Juma', 'Khamis', 'Said', 'Abdalla', 'Hamad', 'Mussa', 'Suleiman', 'Ali', 'Nassor', 'Omar', 'Faki', 'Haji', 'Mzee', 'Mbarouk', 'Kassim', 'Shaame', 'Vuai', 'Pandu', 'Ussi'] },
};
// Rwandan names: generic first names + common Kinyarwanda surnames (male), combined at random
const RW = { ...COUNTRIES.find(c => c.id === 'rw'),
  first: ['Jean', 'Eric', 'Olivier', 'Emmanuel', 'Patrick', 'Claude', 'Innocent', 'Gilbert', 'Thierry', 'Yves', 'Kevin', 'Samuel', 'Christian', 'Joseph', 'Clément', 'Bertrand', 'Fabrice', 'Didier', 'Jacques', 'Pascal',
    'Alain', 'Serge', 'Hervé', 'Prosper', 'Fidèle', 'Dieudonné', 'Bonheur', 'Ange', 'Elie', 'Moïse', 'Isaac', 'Josué', 'Yannick', 'Cédric', 'Régis', 'Aimable', 'Ernest', 'Félix', 'Gédéon', 'Valens'],
  last: ['Niyonzima', 'Mugisha', 'Nshuti', 'Bizimana', 'Manzi', 'Mutsinzi', 'Byiringiro', 'Hakizimana', 'Iradukunda', 'Ishimwe', 'Ndayishimiye', 'Nsabimana', 'Rukundo', 'Kwizera', 'Tuyisenge', 'Sibomana', 'Ngabonziza',
    'Mugenzi', 'Nshimiyimana', 'Twizerimana', 'Habimana', 'Usengimana', 'Bizimungu', 'Mutabazi', 'Rugwiro', 'Ntwari', 'Kayitare', 'Nsengiyumva', 'Gakwaya', 'Hategekimana', 'Mukunzi', 'Niyibizi', 'Manishimwe', 'Ndikumana',
    'Rwigema', 'Kagabo', 'Munyaneza', 'Gasana', 'Shema', 'Ganza', 'Tuyishime', 'Ndahiro', 'Rugamba', 'Karangwa', 'Nkurunziza', 'Nsengimana', 'Rutayisire', 'Habiyaremye', 'Niyitegeka', 'Dusabimana'] };
const RPL_FOREIGN = ['ug', 'bi', 'cd', 'cd', 'ke', 'tz'];

// Kagame Cup guests: [name, abbr, town, nation, colours, rep]
const KAGAME = [
  ['Kampala Villa', 'VIL', 'Kampala', 'ug', ['#1d4ed8', '#f8fafc', '#111827'], 74],
  ['Kampala Capital', 'KCC', 'Kampala', 'ug', ['#facc15', '#1e3a8a', '#f8fafc'], 75],
  ['Wakiso Vipers', 'VIP', 'Wakiso', 'ug', ['#0f766e', '#f8fafc', '#facc15'], 76],
  ['Nairobi Green Army', 'GRA', 'Nairobi', 'ke', ['#15803d', '#f8fafc', '#111827'], 76],
  ['Nairobi Leopards', 'LEO', 'Nairobi', 'ke', ['#2563eb', '#f8fafc', '#111827'], 72],
  ['Msimbazi Lions', 'MSL', 'Dar es Salaam', 'tz', ['#dc2626', '#f8fafc', '#111827'], 80],
  ['Jangwani Yellows', 'JAN', 'Dar es Salaam', 'tz', ['#facc15', '#15803d', '#111827'], 80],
  ['Chamazi City', 'CHA', 'Dar es Salaam', 'tz', ['#0ea5e9', '#f8fafc', '#111827'], 76],
  ['Bujumbura Purples', 'BUJ', 'Bujumbura', 'bi', ['#7c3aed', '#f8fafc', '#111827'], 68],
  ['Addis Saints', 'ADS', 'Addis Ababa', 'et', ['#facc15', '#b91c1c', '#111827'], 72],
  ['Omdurman Crescent', 'OMC', 'Omdurman', 'sd', ['#1e40af', '#f8fafc', '#facc15'], 77],
  ['Omdurman Reds', 'OMR', 'Omdurman', 'sd', ['#b91c1c', '#facc15', '#f8fafc'], 75],
  ['Zanzibar Sailors', 'ZAN', 'Zanzibar', 'zn', ['#0369a1', '#f8fafc', '#16a34a'], 64],
];
// CECAFA nations (Rwanda itself is built from the world's Rwandan players): [name, abbr, nation, colours, rep]
const NATIONS = [
  ['Uganda', 'UGA', 'ug', ['#111111', '#facc15', '#dc2626'], 72],
  ['Kenya', 'KEN', 'ke', ['#b91c1c', '#15803d', '#f8fafc'], 71],
  ['Tanzania', 'TAN', 'tz', ['#16a34a', '#1e3a8a', '#facc15'], 70],
  ['Burundi', 'BDI', 'bi', ['#dc2626', '#16a34a', '#f8fafc'], 67],
  ['Ethiopia', 'ETH', 'et', ['#16a34a', '#facc15', '#dc2626'], 66],
  ['Sudan', 'SDN', 'sd', ['#dc2626', '#f8fafc', '#111111'], 67],
  ['South Sudan', 'SSD', 'ss', ['#111111', '#dc2626', '#15803d'], 61],
];
// World Legends XI + bench: invented names, all-time-great level. [first, last, nation pool, position, rating]
const LEGENDS = [
  ['Lyova', 'Varenko', null, 'GK', 94], ['Gianni', 'Castellari', null, 'GK', 90], ['Ricardo', 'Alvim', null, 'RB', 91], ['Franz', 'Hollmann', null, 'CB', 95],
  ['Paolo', 'Marzetti', null, 'CB', 94], ['Robério', 'Caldas', null, 'LB', 92], ['Marcel', 'Duvalier', null, 'CM', 95], ['Jopie', 'Kruiver', null, 'CAM', 96],
  ['Diego', 'Arrabal', null, 'CAM', 97], ['Edinho', 'Navarro', null, 'ST', 98], ['Georges', 'Welah', null, 'ST', 94], ['Rogério', 'Feitosa', null, 'ST', 95],
  ['Samson', 'Etoba', null, 'CF', 92], ['Rogier', 'Mbilla', null, 'ST', 90], ['Abeid', 'Pelegba', null, 'CAM', 92], ['Ferko', 'Puskar', null, 'CF', 94],
  ['Robbie', 'Charlwood', null, 'CM', 92], ['Lutz', 'Mattheis', null, 'DMF', 93], ['Garrincho', 'Santos', null, 'RW', 93], ['Rhys', 'Giggard', null, 'LW', 90],
  ['Kader', 'Mbarek', null, 'RWB', 89], ['Didier', 'Drocourt', null, 'ST', 91],
];
const LEGEND_NAT = { Varenko: 'Eastern Europe', Castellari: 'Italy', Alvim: 'Brazil', Hollmann: 'Germany', Marzetti: 'Italy', Caldas: 'Brazil', Duvalier: 'France', Kruiver: 'Netherlands', Arrabal: 'Argentina', Navarro: 'Brazil',
  Welah: 'Liberia', Feitosa: 'Brazil', Etoba: 'Cameroon', Mbilla: 'Cameroon', Pelegba: 'Ghana', Puskar: 'Hungary', Charlwood: 'England', Mattheis: 'Germany', Santos: 'Brazil', Giggard: 'Wales', Mbarek: 'Morocco', Drocourt: "Côte d'Ivoire" };

const contrast = hex => { const c = parseInt(hex.slice(1), 16); return (0.299 * (c >> 16) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255; };
const kitsOf = (cols, R, sponsor) => { const [c1, c2, c3] = cols, d = () => Math.floor(R() * 12);
  return [{ c: c1, c2, d: d(), socks: c1, sponsor }, { c: c2, c2: c1, d: d(), socks: c2, sponsor }, { c: c3, c2: contrast(c3) > 0.5 ? '#111827' : '#f8fafc', d: d(), socks: c3, sponsor }]; };
const SQUAD = ['GK', 'GK', 'GK', 'RB', 'CB', 'CB', 'LB', 'CB', 'RWB', 'LWB', 'DMF', 'CM', 'CM', 'CAM', 'RM', 'LM', 'CM', 'DMF', 'ST', 'ST', 'RW', 'LW'];

// keep a player's skills but move the overall toward a target (re-rated for the regional level)
function rerate(p, target) {
  const d = Math.round(target - p.ov); for (const k in p.attrs) p.attrs[k] = Math.max(30, Math.min(99, p.attrs[k] + d));
  p.ov = overall(p); p.value = valueOf(p); p.wage = wageOf(p);
}
// skin tone index into the game's SK palette (0 light … 7 very dark) by nation
const TONES = { rw: [2, 3, 7, 3, 7, 6], ug: [2, 3, 7, 3, 7], ke: [2, 3, 7, 3], tz: [2, 3, 7, 6], bi: [2, 3, 7, 3], cd: [3, 7, 7, 2], et: [1, 6, 2, 6], sd: [6, 2, 3, 1], ss: [7, 7, 3], zn: [6, 2, 1, 3],
  Europe: [0, 4, 5, 0, 4], 'Eastern Europe': [0, 5], Brazil: [0, 1, 4, 6, 2, 3], Argentina: [0, 4, 1], Africa: [2, 3, 7], Morocco: [1, 4, 6] };
const LEGEND_REGION = n => ['Liberia', 'Cameroon', 'Ghana', "Côte d'Ivoire"].includes(n) ? 'Africa' : ['Italy', 'Germany', 'France', 'Netherlands', 'England', 'Wales', 'Hungary'].includes(n) ? 'Europe' : n;
const toneFor = (nat, R) => { const t = TONES[nat] || TONES.rw; return t[Math.floor(R() * t.length)]; };
function rename(p, pool, R) { const f = pool.first[Math.floor(R() * pool.first.length)], l = pool.last[Math.floor(R() * pool.last.length)]; p.first = f; p.last = l; p.name = f + ' ' + l; p.nat = pool.id; if (p.look) p.look.tone = toneFor(pool.id, R); }

function addClub(world, R, { name, abbr, town, nat, cols, rep, kind }) {
  const id = world.clubs.length, sponsor = kind === 'nation' || kind === 'legends' ? '' : 'EAST AFRICA AIR';
  const club = { id, name, short: town, abbr, country: nat, town, colors: cols, rep, budget: 0, hidden: true, kind,
    kits: kitsOf(cols, R, sponsor), crest: { shape: kind === 'nation' ? 1 : kind === 'legends' ? 6 : Math.floor(R() * 7), motif: kind === 'nation' ? 4 : kind === 'legends' ? 10 : 1 + Math.floor(R() * 10), border: kind === 'nation' ? 2 : Math.floor(R() * 3), c1: cols[0], c2: cols[1], c3: cols[2] || '#f8fafc', letter: name[0], year: kind ? null : 1900 + Math.floor(R() * 90), seed: Math.floor(R() * 2 ** 31) },
    stadium: pickStadium(rep, id), rivals: [], squad: [], tactic: Math.floor(R() * 8), manager: '', mood: 60 };
  world.clubs.push(club); return club;
}
function fillSquad(world, R, club, pool) {
  SQUAD.forEach((pos, i) => {
    const p = makePlayer(R, world.players.length, pool, pos, club.rep - 4 + (i < 11 ? 2 : -3), club.id, i);
    p.number = i < 11 ? i + 1 : 12 + (i - 11); p.look.tone = toneFor(pool.id, R); world.players.push(p); club.squad.push(p.id);
  });
  club.manager = pool.first[Math.floor(R() * pool.first.length)] + ' ' + pool.last[Math.floor(R() * pool.last.length)];
}

/** Re-skin the Rwanda league and add the regional clubs, national teams and World Legends (idempotent). */
export function applyRegional(world) {
  if (world.regional && world.regional.v >= REGIONAL_V) return false;
  const R = mulberry32((world.seed || 1) * 7919 + 17);
  const rw = world.countries.find(c => c.id === 'rw'); if (!rw) return false;
  rw.league.name = 'Rwanda Premier League'; rw.cup = 'Peace Cup';
  const ids = rw.league.clubs.slice().sort((a, b) => world.clubs[b].rep - world.clubs[a].rep);
  ids.forEach((cid, k) => {
    const c = world.clubs[cid], [name, abbr, town, cols, rep0] = RW_CLUBS[k % RW_CLUBS.length], rep = Math.round(60 + (rep0 - 59) * 0.76);  // East African level: ~60-76
    Object.assign(c, { name, short: town, abbr, town, colors: cols, rep, budget: Math.round(Math.pow(rep - 45, 1.7) / 6), kits: kitsOf(cols, R, c.kits[0] && c.kits[0].sponsor), crest: { ...c.crest, c1: cols[0], c2: cols[1], letter: name[0] }, stadium: pickStadium(rep, cid) });
    c.squad.forEach((pid, i) => { const p = world.players[pid]; if (!p) return; rename(p, R() < 0.25 ? POOLS[RPL_FOREIGN[Math.floor(R() * RPL_FOREIGN.length)]] : RW, R); rerate(p, rep - 4 + (i < 11 ? 2 : -3) + (R() - 0.5) * 6); });
  });
  const kagame = ids.slice(0, 3);  // Rwanda's three best enter the Kagame Cup
  for (const [name, abbr, town, nat, cols, rep0] of KAGAME) { const rep = rep0 - 6, c = addClub(world, R, { name, abbr, town, nat, cols, rep, kind: 'club' }); fillSquad(world, R, c, POOLS[nat]); kagame.push(c.id); }
  // Amavubi: the best Rwandans in the Rwanda league (squad references their club players; national sides are never simulated)
  const pool = ids.flatMap(cid => world.clubs[cid].squad.map(pid => world.players[pid])).filter(p => p && p.nat === 'rw').sort((a, b) => b.ov - a.ov);
  const byRole = r => pool.filter(p => roleOf(p.pos) === r), am = [...byRole('GK').slice(0, 3), ...byRole('D').slice(0, 7), ...byRole('M').slice(0, 7), ...byRole('F').slice(0, 5)];
  const amRep = Math.round(am.slice(0, 11).reduce((s, p) => s + p.ov, 0) / Math.max(1, Math.min(11, am.length)));
  const amavubi = addClub(world, R, { name: 'Rwanda (Amavubi)', abbr: 'RWA', town: 'Kigali', nat: 'rw', cols: ['#00a1de', '#fad201', '#20603d'], rep: amRep, kind: 'nation' });
  amavubi.squad = am.map(p => p.id);
  const nations = [amavubi.id];
  for (const [name, abbr, nat, cols, rep0] of NATIONS) { const rep = rep0 - 2, c = addClub(world, R, { name, abbr, town: name, nat, cols, rep, kind: 'nation' }); fillSquad(world, R, c, POOLS[nat]); nations.push(c.id); }
  const L = addClub(world, R, { name: 'World Legends', abbr: 'LEG', town: 'Legends', nat: 'xx', cols: ['#d4af37', '#111111', '#f8fafc'], rep: 94, kind: 'legends' });
  LEGENDS.forEach(([first, last, , pos, ov], i) => {
    const p = makePlayer(R, world.players.length, { id: 'xx', first: [first], last: [last] }, pos, ov, L.id, i);
    p.age = 30 + Math.floor(R() * 6); rerate(p, ov); p.number = i + 1; p.legend = LEGEND_NAT[last] || 'World'; p.nat = 'xx'; p.look.tone = toneFor(LEGEND_REGION(p.legend), R); p.look.beard = 0;
    world.players.push(p); L.squad.push(p.id);
  });
  L.manager = 'Rinus Holtkamp'; amavubi.manager = RW.first[3] + ' ' + RW.last[8];
  world.regional = { v: REGIONAL_V, kagame, nations, legends: L.id };
  return true;
}
export const isHidden = (world, clubId) => !!(world.clubs[clubId] && world.clubs[clubId].hidden);
export { roleOf };
