// Catalogue des indicateurs dessinés sur le graphique : libellé, description, groupe, couleur de
// légende et réglages proposés (valeur par défaut en premier). Partagé par le menu Indicateurs,
// la légende et le moteur de dessin.
export const GROUPS = [
  ['flow', 'Flux d’ordres'],
  ['levels', 'Profils et niveaux'],
  ['time', 'Sessions et horaires'],
  ['trade', 'Alertes'],
];

export const LAYERS = {
  heat: { label: 'Heatmap de liquidité', sub: 'Carnet d’ordres dans le temps', group: 'flow', color: '#b6d6ff' },
  bubbles: { label: 'Bulles de trades', sub: 'Volume agressif au VWAP de chaque créneau, part acheteuse en vert', group: 'flow', color: '#4ebe96' },
  big: { label: 'Gros prints', sub: 'Ordres agresseurs les plus gros', group: 'flow', color: '#ffa16c' },
  oiprof: { label: 'OI par prix', sub: 'Positions ouvertes (vert) et fermées (rouge) par niveau de prix sur la plage visible ; lecture prix / OI de la dernière heure', group: 'flow', color: '#4ebe96' },
  liq: { label: 'Liquidations', sub: 'Positions liquidées (futures, échantillon Binance)', group: 'flow', color: '#e0685f' },
  div: { label: 'Divergences CVD', sub: 'Sommets et creux du prix non confirmés par le CVD de session', group: 'flow', color: '#e0685f' },
  quotes: { label: 'Bid / ask', sub: 'Meilleurs prix récents (zoom serré)', group: 'flow', color: '#cccccc' },
  profile: { label: 'Profil de session', sub: 'Volume par prix, POC et value area du jour UTC', group: 'levels', color: '#868f97' },
  prev: { label: 'Value area de la veille', sub: 'VAH, VAL et POC d’hier sur la journée, état d’acceptation ou de rejet', group: 'levels', color: '#479ffa' },
  open: { label: 'Ouverture du jour', sub: 'Premier prix de la session UTC, dans ou hors de la valeur de la veille', group: 'levels', color: '#e6e6e6' },
  ib: { label: 'Initial balance et ouverture', sub: 'Première heure de la session UTC, extensions 1,5 × et 2 ×, type d’ouverture de Dalton (indicatif)', group: 'levels', color: '#ffa16c' },
  orb: { label: 'Range d’ouverture (ORB)', sub: 'Plus haut et plus bas des premières minutes après l’ouverture (UTC, Londres ou New York), milieu et extensions', group: 'levels', color: '#7dd3c0' },
  keys: { label: 'Niveaux clés', sub: 'Ouvertures de la semaine et du mois, plus hauts et plus bas de la veille, de la semaine et du mois précédents', group: 'levels', color: '#a78bfa' },
  sessions: { label: 'Sessions Asie / Londres / NY', sub: 'Range de chaque session (heures de bureau locales, heure d’été comprise), du lundi au vendredi', group: 'time', color: '#e8c35a' },
  times: { label: 'Repères horaires', sub: 'Ouverture de New York (9 h 30 là-bas, heure d’été comprise) et heures de financement (0 h, 8 h, 16 h UTC)', group: 'time', color: '#ffa16c' },
  naked: { label: 'POC non testés', sub: 'POC des 7 dernières sessions, prolongés jusqu’au retest', group: 'levels', color: '#ffa16c' },
  vwap: { label: 'VWAP', sub: 'Moyenne pondérée du jour, de la semaine ou du mois (UTC) et bandes d’écart-type', group: 'levels', color: '#e6e6e6' },
  alerts: { label: 'Alertes de prix', sub: 'Niveaux surveillés', group: 'trade', color: '#ffa16c' },
};

// Réglages : clé -> { label, choices: [[valeur, libellé], ...] }.
export const OPTIONS = {
  bubbles: {
    filter: { label: 'Afficher', choices: [[1, '≥ moyenne'], [0, 'Toutes'], [2, '≥ 2× moyenne'], [4, '≥ 4× moyenne']] },
    size: { label: 'Taille', choices: [[1, 'Normale'], [0.7, 'Petite'], [1.4, 'Grande']] },
    align: { label: 'Position horizontale', choices: [['candle', 'Sur la bougie'], ['time', 'Selon l’heure']] },
    density: { label: 'Créneau', choices: [[8, 'Normal (8 px)'], [4, 'Fin (4 px)'], [16, 'Large (16 px)']] },
    color: { label: 'Couleur', choices: [['split', 'Achats / ventes'], ['delta', 'Delta'], ['volume', 'Volume seul']] },
    scale: { label: 'Échelle des tailles', choices: [['sqrt', 'Racine'], ['linear', 'Linéaire'], ['log', 'Logarithmique']] },
  },
  big: {
    min: { label: 'Seuil', choices: [[-1, 'Selon l’actif (BTC 50 k $, autres 25 k $)'], [0, 'Auto (0,5 % les plus gros)'], [25_000, '≥ 25 k $'], [50_000, '≥ 50 k $'], [100_000, '≥ 100 k $'], [500_000, '≥ 500 k $'], [1_000_000, '≥ 1 M $']] },
    limit: { label: 'Nombre affiché', choices: [[15, '15 plus gros'], [10, '10 plus gros'], [25, '25 plus gros'], [50, '50 plus gros'], [200, '200']] },
    perBar: { label: 'Maximum par bougie', choices: [[3, 'Les 3 plus gros'], [2, 'Les 2 plus gros'], [5, 'Les 5 plus gros'], [0, 'Tous']] },
    labels: { label: 'Étiquettes', choices: [['big', 'Les 3 plus gros'], ['all', 'Toutes'], ['none', 'Aucune']] },
    align: { label: 'Position horizontale', choices: [['candle', 'Sur la bougie'], ['time', 'Selon l’heure']] },
    group: { label: 'Regroupement', choices: [['level', 'Par niveau dans la bougie'], ['order', 'Par ordre']] },
    follow: { label: 'Suite du prix (absorbé = anneau creux)', choices: [[3, 'Sur 3 bougies'], [1, 'Sur 1 bougie'], [5, 'Sur 5 bougies'], [0, 'Masquée']] },
    sess: { label: 'Seuil par session', choices: [['off', 'Le même partout'], ['on', 'Ajusté (Asie ×0,5, Londres ×1, New York ×2)']] },
    move: { label: 'Avancée minimale', choices: [[0.5, 'Une demi-bougie moyenne'], [0.25, 'Un quart de bougie'], [1, 'Une bougie moyenne']] },
  },
  oiprof: {
    width: { label: 'Largeur', choices: [[0.15, '15 %'], [0.25, '25 %'], [0.1, '10 %']] },
  },
  liq: {
    min: { label: 'Montant minimum', choices: [[0, 'Toutes'], [10_000, '≥ 10 k $'], [100_000, '≥ 100 k $'], [1_000_000, '≥ 1 M $']] },
    group: { label: 'Regroupement', choices: [['bar', 'Par bougie et par côté'], ['none', 'Une par liquidation']] },
  },
  profile: {
    range: { label: 'Période', choices: [['day', 'Jour UTC'], ['week', 'Semaine'], ['visible', 'Plage visible'], ['c5', 'Composite 5 j'], ['c10', 'Composite 10 j']] },
    nodes: { label: 'HVN / LVN', choices: [[1, 'Affichés'], [0, 'Masqués']] },
    kind: { label: 'Type', choices: [['volume', 'Volume'], ['bidask', 'Achats / ventes'], ['delta', 'Delta']] },
    row: { label: 'Taille des lignes', choices: [[0.05, '0,05 % du prix'], [0.1, '0,1 %'], [0, 'Fine (tranche du footprint)']] },
    width: { label: 'Largeur', choices: [[0.3, '30 %'], [0.15, '15 %'], [0.5, '50 %']] },
    va: { label: 'Value area', choices: [[1, 'Zone et lignes'], [2, 'Lignes'], [0, 'Masquée']] },
    dev: { label: 'POC en développement', choices: [[0, 'Masqué'], [1, 'POC'], [2, 'POC et value area']] },
  },
  times: {
    show: { label: 'Afficher', choices: [['all', 'Ouverture NY et financement'], ['ny', 'Ouverture NY'], ['funding', 'Financement']] },
  },
  ib: {
    ext: { label: 'Extensions', choices: [[1, '×1,5 et ×2'], [2, '×1,5, ×2 et ×3'], [0, 'IB seule']] },
  },
  orb: {
    anchor: { label: 'Ouverture', choices: [['ny', 'New York'], ['london', 'Londres'], ['utc', '00:00 UTC']] },
    minutes: { label: 'Durée du range', choices: [[15, '15 min'], [5, '5 min'], [30, '30 min'], [60, '1 h']] },
    ext: { label: 'Extensions', choices: [[1, '×1,5 et ×2'], [0, 'Range seul']] },
  },
  keys: {
    show: { label: 'Afficher', choices: [['all', 'Ouvertures et hauts / bas'], ['opens', 'Ouvertures (semaine, mois)'], ['prev', 'Hauts / bas précédents']] },
  },
  sessions: {
    show: { label: 'Afficher', choices: [['all', 'Asie, Londres et New York'], ['asia', 'Asie'], ['london', 'Londres'], ['ny', 'New York']] },
    extend: { label: 'Plus haut et plus bas', choices: [[1, 'Prolongés jusqu’à la fin du jour'], [0, 'Dans la session seulement']] },
  },
  vwap: {
    period: { label: 'Période', choices: [['day', 'Jour UTC'], ['week', 'Semaine (lundi)'], ['month', 'Mois']] },
    bands: { label: 'Bandes', choices: [[2, '±1σ et ±2σ'], [3, '±1σ, ±2σ et ±3σ'], [1, '±1σ'], [0, 'Aucune']] },
  },
};

// Réglages de la vue TPO (Market Profile), proposés dans le menu Indicateurs.
export const TPO_OPTIONS = {
  display: { label: 'Affichage', choices: [['letters', 'Lettres'], ['blocks', 'Blocs'], ['split', 'Éclaté (par période)']] },
  color: { label: 'Couleurs', choices: [['va', 'Value area'], ['period', 'Par période']] },
  period: { label: 'Sous-période', choices: [[30, '30 min'], [15, '15 min'], [60, '1 h']] },
  singles: { label: 'Simples impressions', choices: [[1, 'Prolongées jusqu’au retest'], [0, 'Marquées seulement']] },
  volume: { label: 'Profil de volume', choices: [[1, 'À droite des lettres'], [0, 'Masqué']] },
  days: { label: 'Sessions', choices: [[5, '5 jours'], [3, '3 jours'], [7, '7 jours'], [14, '14 jours']] },
};

// Réglages du footprint (menu Footprint).
export const FP_OPTIONS = {
  ratio: { label: 'Déséquilibre (diagonal)', choices: [[3, '300 %'], [1.5, '150 %'], [2, '200 %'], [4, '400 %']] },
  zeros: { label: 'Case opposée à zéro', choices: [['ignore', 'Pas un déséquilibre'], ['count', 'Compte comme déséquilibre']] },
  stack: { label: 'Déséquilibres empilés', choices: [[3, '3 niveaux'], [2, '2'], [4, '4'], [5, '5']] },
  outline: { label: 'Cases en déséquilibre', choices: [[1, 'Encadrées'], [0, 'Texte coloré seul']] },
  candle: { label: 'Bougie', choices: [['left', 'À gauche'], ['center', 'Au centre (bid | ask)']] },
  auctions: { label: 'Enchères inachevées', choices: [[1, 'Marquées'], [0, 'Masquées']] },
  marks: { label: 'Absorption (A) et épuisement (E)', choices: [[1, 'Marqués'], [0, 'Masqués']] },
  rows: { label: 'Lignes', choices: [['auto', 'Regroupées au dézoom'], ['fixed', 'Taille fixe']] },
};

export function defaultOptions() {
  const out = {};
  for (const [layer, opts] of Object.entries({ ...OPTIONS, tpo: TPO_OPTIONS, fp: FP_OPTIONS })) {
    out[layer] = Object.fromEntries(Object.entries(opts).map(([k, o]) => [k, o.choices[0][0]]));
  }
  return out;
}

// Libellé court du réglage principal (affiché dans la légende).
export function optionSummary(layer, opts) {
  const defs = layer === 'tpo' ? TPO_OPTIONS : layer === 'fp' ? FP_OPTIONS : OPTIONS[layer];
  if (!defs || !opts) return '';
  const [key, def] = Object.entries(defs)[0];
  return def.choices.find(([v]) => v === opts[key])?.[1] ?? '';
}
