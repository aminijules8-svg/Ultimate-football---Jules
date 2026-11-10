// The wider football world (Phase 16): six more league countries (full name pools, 20 clubs each), thirty more
// nations that field a national team from a generated pool, six confederations, and original flag designs.
// Everything is fictional; pools are reused by region so names fit the country.
export const CONFEDS = [
  { id: 'af', name: 'Equatorial Football Union', short: 'EFU', colors: ['#16a34a', '#facc15'] },
  { id: 'eu', name: 'Continental Union', short: 'CU', colors: ['#1d4ed8', '#f8fafc'] },
  { id: 'sa', name: 'Southern Cone Confederation', short: 'SCC', colors: ['#0ea5e9', '#fde047'] },
  { id: 'na', name: 'Atlantic & Caribbean Union', short: 'ACU', colors: ['#dc2626', '#f8fafc'] },
  { id: 'as', name: 'Pacific Rim Federation', short: 'PRF', colors: ['#b91c1c', '#fbbf24'] },
  { id: 'oc', name: 'Oceanic Alliance', short: 'OA', colors: ['#0d9488', '#f8fafc'] },
];
/** confederation of the original ten league countries */
export const CONFED_OF = { rw: 'af', gh: 'af', sa: 'af', ib: 'eu', al: 'eu', nd: 'eu', rh: 'eu', pl: 'sa', ya: 'as', oc: 'oc', ti: 'eu', ga: 'eu', lu: 'eu', ze: 'eu', an: 'eu', am: 'sa' };

export const NEW_COUNTRIES = [
  { id: 'ti', name: 'Tirrenia', adj: 'Tirrenian', league: 'Serie Tirrena', cup: 'Coppa del Mare', colors: ['#1e3a8a', '#f8fafc', '#16a34a'],
    first: ['Marco', 'Luca', 'Matteo', 'Alessandro', 'Lorenzo', 'Andrea', 'Francesco', 'Davide', 'Giovanni', 'Riccardo', 'Simone', 'Federico', 'Gabriele', 'Tommaso', 'Nicolò', 'Stefano', 'Emanuele', 'Giuseppe', 'Antonio', 'Daniele', 'Pietro', 'Leonardo', 'Alberto', 'Enzo', 'Fabio', 'Massimo', 'Sandro', 'Vittorio', 'Dario', 'Elia'],
    last: ['Rossini', 'Bellandi', 'Carraro', 'Moretti', 'Ferrante', 'Galassi', 'Lombardo', 'Marchetti', 'Pellegrino', 'Santoro', 'Vitale', 'Colombo', 'De Luca', 'Esposito', 'Fontana', 'Greco', 'Mancini', 'Orlandi', 'Pagani', 'Rinaldi', 'Serra', 'Toscano', 'Valente', 'Zanetti', 'Barone', 'Conti', 'D’Amico', 'Fiore', 'Guerra', 'Lanza'],
    towns: ['Porto Azzurro', 'Montechiaro', 'Villasanta', 'Castelmare', 'Fiumalto', 'Riva Bianca', 'San Lorenzo', 'Torre Grande', 'Valbruna', 'Colle Verde', 'Pietrarossa', 'Borgo Antico', 'Marina Alta', 'Rocca Nuova', 'Ponte Vecchio', 'Sorrento Bay', 'Lago Chiaro', 'Terrabella', 'Campo d’Oro', 'Altavilla'] },
  { id: 'ga', name: 'Gallia', adj: 'Gallian', league: 'Ligue Gallienne', cup: 'Coupe Tricolore', colors: ['#1d4ed8', '#f8fafc', '#dc2626'],
    first: ['Lucas', 'Hugo', 'Théo', 'Nathan', 'Louis', 'Enzo', 'Mathis', 'Jules', 'Léo', 'Gabriel', 'Antoine', 'Maxime', 'Clément', 'Romain', 'Baptiste', 'Kylian', 'Adrien', 'Florian', 'Quentin', 'Julien', 'Mehdi', 'Yanis', 'Ismaël', 'Moussa', 'Alexandre', 'Rémi', 'Thibault', 'Olivier', 'Guillaume', 'Étienne'],
    last: ['Lefebvre', 'Moreau', 'Girard', 'Fournier', 'Mercier', 'Dupont', 'Lambert', 'Rousseau', 'Vincent', 'Muller', 'Faure', 'Garnier', 'Chevalier', 'Perrin', 'Renard', 'Marchand', 'Blanchard', 'Leroux', 'Gauthier', 'Picard', 'Diallo', 'Traoré', 'Benali', 'Kouassi', 'Charpentier', 'Dumas', 'Bouchard', 'Lacroix', 'Aubert', 'Delorme'],
    towns: ['Saint-Rémy', 'Villeneuve', 'Mont-Clair', 'Beaumont', 'Port-Lumière', 'Rochefort', 'Belleroche', 'Châteauvert', 'Val-d’Or', 'Fontenay', 'Lyonnel', 'Aubervale', 'Clairmont', 'Saint-Aubin', 'Bordelaise', 'Nancéy', 'Tourville', 'Grandbois', 'Marseillon', 'Rivière-Haute'] },
  { id: 'lu', name: 'Lusitania', adj: 'Lusitanian', league: 'Liga Atlântica', cup: 'Taça da Costa', colors: ['#dc2626', '#16a34a', '#facc15'],
    first: ['João', 'Tiago', 'Rui', 'Diogo', 'Gonçalo', 'Bruno', 'Nuno', 'André', 'Ricardo', 'Miguel', 'Rafael', 'Pedro', 'Hugo', 'Fábio', 'Vítor', 'Sérgio', 'Nélson', 'Duarte', 'Bernardo', 'Afonso', 'Tomás', 'Rodrigo', 'Cristiano', 'Renato', 'Danilo', 'Edson', 'Gelson', 'Raúl', 'Luís', 'Paulo'],
    last: ['Silveira', 'Carvalho', 'Pereira', 'Nogueira', 'Teixeira', 'Figueira', 'Ramalho', 'Amaral', 'Barbosa', 'Cordeiro', 'Delgado', 'Esteves', 'Freitas', 'Guedes', 'Henriques', 'Lourenço', 'Macedo', 'Neves', 'Pimenta', 'Quaresma', 'Rebelo', 'Semedo', 'Tavares', 'Varela', 'Xavier', 'Azevedo', 'Brandão', 'Coelho', 'Fonseca', 'Moutinho'],
    towns: ['Porto Claro', 'Vila Nova', 'Costa Dourada', 'Monte Alto', 'Ribeira Azul', 'Santa Clara', 'Castelo Branco', 'Lagoa Verde', 'Alcântara', 'Serra Velha', 'Praia Mar', 'Vale Fresco', 'Torres Brancas', 'Beira Rio', 'Figueirinha', 'Ponta Luz', 'Oliveirais', 'Cabo Sereno', 'Marinha Alta', 'Campos Largos'] },
  { id: 'ze', name: 'Zeelandia', adj: 'Zeelandic', league: 'Eredivisie Zeeland', cup: 'Oranje Beker', colors: ['#f97316', '#f8fafc', '#1e3a8a'],
    first: ['Daan', 'Sem', 'Lucas', 'Jesse', 'Finn', 'Bram', 'Thijs', 'Lars', 'Milan', 'Ruben', 'Sven', 'Joris', 'Niels', 'Stijn', 'Wout', 'Koen', 'Jasper', 'Tijn', 'Mees', 'Gijs', 'Rik', 'Teun', 'Jurgen', 'Pim', 'Floris', 'Maarten', 'Casper', 'Rens', 'Noud', 'Siem'],
    last: ['de Vries', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'de Groot', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'Kok', 'Jacobs', 'Schouten', 'Willems', 'Kuipers', 'van den Berg', 'Meijer', 'Prins', 'Veenstra', 'Hoekstra', 'Zwart'],
    towns: ['Zeehaven', 'Westerburg', 'Oudenmolen', 'Noordwijk', 'Dijkstad', 'Veldhoven', 'Bloemendal', 'Groenhoek', 'Windmeer', 'Kasteelburg', 'Rietveld', 'Zonnedorp', 'Heuvelrug', 'Waterland', 'Polderzicht', 'Brugkerk', 'Eikenlaan', 'Schipdam', 'Lindenhof', 'Vlietstroom'] },
  { id: 'an', name: 'Anatolia', adj: 'Anatolian', league: 'Süper Anadolu Ligi', cup: 'Boğaz Kupası', colors: ['#dc2626', '#f8fafc', '#111827'],
    first: ['Mehmet', 'Mustafa', 'Ahmet', 'Emre', 'Burak', 'Cenk', 'Hakan', 'Arda', 'Kerem', 'Ozan', 'Serkan', 'Volkan', 'Yusuf', 'Berk', 'Can', 'Deniz', 'Efe', 'Furkan', 'Gökhan', 'Halil', 'İbrahim', 'Kaan', 'Levent', 'Murat', 'Onur', 'Rıza', 'Selçuk', 'Tolga', 'Umut', 'Zeki'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özdemir', 'Polat', 'Şimşek', 'Taş', 'Tekin', 'Türkmen', 'Uysal', 'Yavuz', 'Güneş', 'Erdoğan', 'Bulut', 'Korkmaz', 'Sarı', 'Ünal'],
    towns: ['Boğazköy', 'Yıldıztepe', 'Akdeniz', 'Karaburun', 'Güneşli', 'Taşkent', 'Altınova', 'Denizkent', 'Kayalık', 'Yeşilyurt', 'Çamlıca', 'Doğukent', 'Sarayköy', 'Gölbaşı', 'Kızıltepe', 'Mavişehir', 'Ulukaya', 'Beyazkent', 'Zeytinli', 'Tuzlu'] },
  { id: 'am', name: 'Amazonia', adj: 'Amazonian', league: 'Brasileirão Verde', cup: 'Copa Selva', colors: ['#16a34a', '#facc15', '#1d4ed8'],
    first: ['Gabriel', 'Lucas', 'Matheus', 'Rafael', 'Thiago', 'Bruno', 'Felipe', 'Leonardo', 'Vinícius', 'Caio', 'Eduardo', 'Renan', 'Douglas', 'Igor', 'Wesley', 'Everton', 'Marcelo', 'Rodrigo', 'Jefferson', 'Anderson', 'Tales', 'Yago', 'Kauã', 'Davi', 'Ítalo', 'Jonas', 'Murilo', 'Paulinho', 'Rômulo', 'Wendel'],
    last: ['Silva', 'Souza', 'Oliveira', 'Santos', 'Lima', 'Pereira', 'Costa', 'Ribeiro', 'Alves', 'Nascimento', 'Araújo', 'Batista', 'Cardoso', 'Dias', 'Farias', 'Gomes', 'Jesus', 'Machado', 'Nunes', 'Pinto', 'Rocha', 'Sales', 'Teles', 'Vieira', 'Xavier', 'Moraes', 'Barros', 'Correia', 'Dantas', 'Lopes'],
    towns: ['Rio Verde', 'Porto Seguro', 'Vila Palmeira', 'Santa Luzia', 'Serra Azul', 'Cachoeira', 'Lagoa Dourada', 'Barra Nova', 'Campo Alegre', 'Morro Alto', 'Ipanema Sul', 'Jardim Flor', 'Praia Branca', 'Terra Boa', 'Vale do Sol', 'Ribeirão', 'Belo Monte', 'Cruzeiro', 'Estrela', 'Mangueira'] },
];

// flag designs: t = tricolour vertical / horizontal, bicolour, diagonal, cross, canton star, disc, chevron, stripes; c = colours
const F = (t, ...c) => ({ t, c });
// thirty more nations: no league of their own, 23-man generated pool, name pool borrowed from the nearest country style
export const EXTRA_NATIONS = [
  { id: 'kz', name: 'Kazembe', adj: 'Kazembean', confed: 'af', pool: 'rw', rep: 68, colors: ['#15803d', '#facc15', '#111827'], flag: F('h3', '#15803d', '#facc15', '#111827') },
  { id: 'mb', name: 'Mbara', adj: 'Mbaran', confed: 'af', pool: 'gh', rep: 66, colors: ['#dc2626', '#111827', '#facc15'], flag: F('v3', '#dc2626', '#111827', '#facc15') },
  { id: 'sg', name: 'Segou', adj: 'Segovian', confed: 'af', pool: 'sa', rep: 64, colors: ['#f97316', '#f8fafc', '#15803d'], flag: F('v3', '#f97316', '#f8fafc', '#15803d') },
  { id: 'nk', name: 'Nakuru Coast', adj: 'Nakuran', confed: 'af', pool: 'gh', rep: 63, colors: ['#0ea5e9', '#111827', '#f8fafc'], flag: F('diag', '#0ea5e9', '#111827', '#f8fafc') },
  { id: 'kb', name: 'Kalabari', adj: 'Kalabarian', confed: 'af', pool: 'gh', rep: 70, colors: ['#15803d', '#f8fafc', '#15803d'], flag: F('v3', '#15803d', '#f8fafc', '#15803d') },
  { id: 'zm', name: 'Zambezia', adj: 'Zambezian', confed: 'af', pool: 'rw', rep: 65, colors: ['#15803d', '#f97316', '#dc2626'], flag: F('stripes', '#15803d', '#f97316', '#dc2626') },
  { id: 'hb', name: 'Hibernia', adj: 'Hibernian', confed: 'eu', pool: 'al', rep: 74, colors: ['#15803d', '#f8fafc', '#f97316'], flag: F('v3', '#15803d', '#f8fafc', '#f97316') },
  { id: 'cl', name: 'Caledon', adj: 'Caledonian', confed: 'eu', pool: 'al', rep: 71, colors: ['#1e3a8a', '#f8fafc', '#1e3a8a'], flag: F('cross', '#1e3a8a', '#f8fafc') },
  { id: 'hv', name: 'Helvetia', adj: 'Helvetian', confed: 'eu', pool: 'rh', rep: 76, colors: ['#dc2626', '#f8fafc', '#dc2626'], flag: F('cross', '#dc2626', '#f8fafc') },
  { id: 'bv', name: 'Bavarnia', adj: 'Bavarnian', confed: 'eu', pool: 'rh', rep: 73, colors: ['#1e3a8a', '#f8fafc', '#1e3a8a'], flag: F('chev', '#1e3a8a', '#f8fafc', '#1e3a8a') },
  { id: 'pn', name: 'Polonia Nova', adj: 'Polonian', confed: 'eu', pool: 'nd', rep: 72, colors: ['#f8fafc', '#dc2626', '#f8fafc'], flag: F('h2', '#f8fafc', '#dc2626') },
  { id: 'bl', name: 'Baltica', adj: 'Baltic', confed: 'eu', pool: 'nd', rep: 62, colors: ['#1e3a8a', '#facc15', '#1e3a8a'], flag: F('h3', '#1e3a8a', '#facc15', '#1e3a8a') },
  { id: 'dn', name: 'Danubia', adj: 'Danubian', confed: 'eu', pool: 'rh', rep: 69, colors: ['#dc2626', '#f8fafc', '#15803d'], flag: F('h3', '#dc2626', '#f8fafc', '#15803d') },
  { id: 'hl', name: 'Hellenia', adj: 'Hellenic', confed: 'eu', pool: 'ti', rep: 70, colors: ['#0ea5e9', '#f8fafc', '#0ea5e9'], flag: F('stripes', '#0ea5e9', '#f8fafc', '#0ea5e9') },
  { id: 'cs', name: 'Castellon', adj: 'Castellonian', confed: 'eu', pool: 'ib', rep: 75, colors: ['#facc15', '#dc2626', '#facc15'], flag: F('h3', '#dc2626', '#facc15', '#dc2626') },
  { id: 'sv', name: 'Slavonia', adj: 'Slavonian', confed: 'eu', pool: 'nd', rep: 73, colors: ['#dc2626', '#f8fafc', '#1e3a8a'], flag: F('h3', '#dc2626', '#f8fafc', '#1e3a8a') },
  { id: 'ad', name: 'Andoria', adj: 'Andorian', confed: 'sa', pool: 'pl', rep: 74, colors: ['#dc2626', '#f8fafc', '#dc2626'], flag: F('h2', '#dc2626', '#f8fafc') },
  { id: 'ct', name: 'Costa Tropical', adj: 'Tropical', confed: 'sa', pool: 'am', rep: 72, colors: ['#facc15', '#1e3a8a', '#dc2626'], flag: F('h3', '#facc15', '#1e3a8a', '#dc2626') },
  { id: 'pt', name: 'Patagonia Sur', adj: 'Patagonian', confed: 'sa', pool: 'pl', rep: 66, colors: ['#0ea5e9', '#f8fafc', '#111827'], flag: F('diag', '#0ea5e9', '#f8fafc', '#111827') },
  { id: 'al2', name: 'Altiplano', adj: 'Altiplanian', confed: 'sa', pool: 'pl', rep: 63, colors: ['#dc2626', '#facc15', '#15803d'], flag: F('h3', '#dc2626', '#facc15', '#15803d') },
  { id: 'ca', name: 'Caribe Azul', adj: 'Caribbean', confed: 'na', pool: 'am', rep: 67, colors: ['#0ea5e9', '#facc15', '#111827'], flag: F('diag', '#0ea5e9', '#111827', '#facc15') },
  { id: 'nw', name: 'New Albany', adj: 'Albanian', confed: 'na', pool: 'oc', rep: 73, colors: ['#1e3a8a', '#dc2626', '#f8fafc'], flag: F('canton', '#dc2626', '#f8fafc', '#1e3a8a') },
  { id: 'bo', name: 'Boreal', adj: 'Boreal', confed: 'na', pool: 'al', rep: 69, colors: ['#dc2626', '#f8fafc', '#dc2626'], flag: F('v3', '#dc2626', '#f8fafc', '#dc2626') },
  { id: 'mx', name: 'Mesa Grande', adj: 'Mesan', confed: 'na', pool: 'ib', rep: 74, colors: ['#15803d', '#f8fafc', '#dc2626'], flag: F('v3', '#15803d', '#f8fafc', '#dc2626') },
  { id: 'kr', name: 'Koryo', adj: 'Koryan', confed: 'as', pool: 'ya', rep: 74, colors: ['#f8fafc', '#dc2626', '#1e3a8a'], flag: F('disc', '#f8fafc', '#dc2626', '#1e3a8a') },
  { id: 'sm', name: 'Samudra', adj: 'Samudran', confed: 'as', pool: 'ya', rep: 62, colors: ['#dc2626', '#f8fafc', '#dc2626'], flag: F('h2', '#dc2626', '#f8fafc') },
  { id: 'hd', name: 'Hindustan Bay', adj: 'Bay', confed: 'as', pool: 'sa', rep: 60, colors: ['#f97316', '#f8fafc', '#15803d'], flag: F('h3', '#f97316', '#f8fafc', '#15803d') },
  { id: 'pr', name: 'Persis', adj: 'Persian', confed: 'as', pool: 'sa', rep: 71, colors: ['#15803d', '#f8fafc', '#dc2626'], flag: F('h3', '#15803d', '#f8fafc', '#dc2626') },
  { id: 'ar', name: 'Aotea', adj: 'Aotean', confed: 'oc', pool: 'oc', rep: 68, colors: ['#111827', '#f8fafc', '#dc2626'], flag: F('canton', '#1e3a8a', '#f8fafc', '#dc2626') },
  { id: 'fj', name: 'Fenua', adj: 'Fenuan', confed: 'oc', pool: 'oc', rep: 58, colors: ['#0ea5e9', '#f8fafc', '#dc2626'], flag: F('disc', '#0ea5e9', '#dc2626', '#f8fafc') },
];

/** Flag drawn inside a 200×200 box (the crest outline clips it). */
export function flagSVG(f) {
  if (!f) return '';
  const [a, b, c] = f.c, r = (x, y, w, h, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`;
  switch (f.t) {
    case 'v3': return r(0, 0, 67, 200, a) + r(67, 0, 66, 200, b) + r(133, 0, 67, 200, c);
    case 'h3': return r(0, 0, 200, 67, a) + r(0, 67, 200, 66, b) + r(0, 133, 200, 67, c);
    case 'h2': return r(0, 0, 200, 100, a) + r(0, 100, 200, 100, b);
    case 'diag': return r(0, 0, 200, 200, a) + `<polygon points="0,200 200,0 200,60 60,200" fill="${c}"/><polygon points="0,200 200,0 200,25 25,200" fill="${b}"/>`;
    case 'cross': return r(0, 0, 200, 200, a) + r(80, 0, 40, 200, b) + r(0, 80, 200, 40, b);
    case 'canton': return r(0, 0, 200, 200, a) + [0, 1, 2, 3, 4].map(i => r(0, 20 + i * 40, 200, 20, b)).join('') + r(0, 0, 100, 100, c) + `<circle cx="50" cy="50" r="16" fill="${b}"/>`;
    case 'disc': return r(0, 0, 200, 200, a) + `<circle cx="100" cy="100" r="46" fill="${b}"/><circle cx="100" cy="100" r="30" fill="${c}" fill-opacity=".35"/>`;
    case 'chev': return r(0, 0, 200, 200, b) + `<polygon points="0,0 120,100 0,200" fill="${a}"/><polygon points="0,30 90,100 0,170" fill="${c}"/>`;
    case 'stripes': return [0, 1, 2, 3, 4, 5, 6, 7].map(i => r(0, i * 25, 200, 25, i % 2 ? b : a)).join('') + r(0, 175, 200, 25, c);
    default: return r(0, 0, 200, 200, a);
  }
}
/** Flag of a league country from its three colours (older worlds have no flag field). */
export const flagFor = (id, colors) => ({ v3: 1, h3: 1 }[id] ? F('v3', ...colors) : F(['v3', 'h3', 'diag', 'cross', 'h2', 'stripes', 'disc', 'chev', 'canton'][[...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 9], colors[0], colors[1], colors[2] || colors[0]));
