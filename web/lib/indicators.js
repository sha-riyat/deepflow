// Catalogue des indicateurs dessinés sur le graphique : libellé, description, groupe, couleur de
// légende et réglages proposés (valeur par défaut en premier). Partagé par le menu Indicateurs,
// la légende et le moteur de dessin.
export const GROUPS = [
  ['flow', 'Flux d’ordres'],
  ['levels', 'Profils et niveaux'],
  ['trade', 'Trading'],
];

export const LAYERS = {
  heat: { label: 'Heatmap de liquidité', sub: 'Carnet d’ordres dans le temps', group: 'flow', color: '#b6d6ff' },
  bubbles: { label: 'Bulles de trades', sub: 'Volume agressif au VWAP de chaque créneau, part acheteuse en vert', group: 'flow', color: '#4ebe96' },
  big: { label: 'Gros prints', sub: 'Ordres agresseurs les plus gros', group: 'flow', color: '#ffa16c' },
  liq: { label: 'Liquidations', sub: 'Positions liquidées (futures, échantillon Binance)', group: 'flow', color: '#e0685f' },
  quotes: { label: 'Bid / ask', sub: 'Meilleurs prix récents (zoom serré)', group: 'flow', color: '#cccccc' },
  profile: { label: 'Profil de session', sub: 'Volume par prix, POC et value area du jour UTC', group: 'levels', color: '#868f97' },
  prev: { label: 'Value area de la veille', sub: 'VAH, VAL et POC d’hier sur la journée, état d’acceptation ou de rejet', group: 'levels', color: '#479ffa' },
  naked: { label: 'POC non testés', sub: 'POC des 7 dernières sessions, prolongés jusqu’au retest', group: 'levels', color: '#ffa16c' },
  vwap: { label: 'VWAP', sub: 'Moyenne pondérée du jour UTC et bandes d’écart-type', group: 'levels', color: '#e6e6e6' },
  signals: { label: 'Signaux', sub: 'Entrées, stops et cibles', group: 'trade', color: '#4ebe96' },
  alerts: { label: 'Alertes de prix', sub: 'Niveaux surveillés', group: 'trade', color: '#ffa16c' },
};

// Réglages : clé -> { label, choices: [[valeur, libellé], ...] }.
export const OPTIONS = {
  bubbles: {
    filter: { label: 'Afficher', choices: [[1, '≥ moyenne'], [0, 'Toutes'], [2, '≥ 2× moyenne'], [4, '≥ 4× moyenne']] },
    size: { label: 'Taille', choices: [[1, 'Normale'], [0.7, 'Petite'], [1.4, 'Grande']] },
    density: { label: 'Créneau', choices: [[8, 'Normal (8 px)'], [4, 'Fin (4 px)'], [16, 'Large (16 px)']] },
    color: { label: 'Couleur', choices: [['split', 'Achats / ventes'], ['delta', 'Delta'], ['volume', 'Volume seul']] },
    scale: { label: 'Échelle des tailles', choices: [['sqrt', 'Racine'], ['linear', 'Linéaire'], ['log', 'Logarithmique']] },
  },
  big: {
    min: { label: 'Seuil', choices: [[-1, 'Selon l’actif (BTC 50 k $, autres 25 k $)'], [0, 'Auto (0,5 % les plus gros)'], [25_000, '≥ 25 k $'], [50_000, '≥ 50 k $'], [100_000, '≥ 100 k $'], [500_000, '≥ 500 k $'], [1_000_000, '≥ 1 M $']] },
    limit: { label: 'Nombre affiché', choices: [[25, '25 plus gros'], [10, '10 plus gros'], [50, '50 plus gros'], [200, '200']] },
    labels: { label: 'Étiquettes', choices: [['big', 'Les plus gros'], ['all', 'Toutes'], ['none', 'Aucune']] },
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
  vwap: {
    bands: { label: 'Bandes', choices: [[2, '±1σ et ±2σ'], [1, '±1σ'], [0, 'Aucune']] },
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
