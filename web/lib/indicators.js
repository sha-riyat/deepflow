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
  naked: { label: 'POC non testés', sub: 'Prolongés jusqu’au retest', group: 'levels', color: '#ffa16c' },
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
  },
  big: {
    limit: { label: 'Nombre affiché', choices: [[25, '25 plus gros'], [10, '10 plus gros'], [50, '50 plus gros']] },
  },
  liq: {
    min: { label: 'Montant minimum', choices: [[0, 'Toutes'], [10_000, '≥ 10 k $'], [100_000, '≥ 100 k $'], [1_000_000, '≥ 1 M $']] },
  },
  profile: {
    width: { label: 'Largeur', choices: [[0.3, '30 % de la session'], [0.15, '15 %'], [0.5, '50 %']] },
    va: { label: 'Value area', choices: [[1, 'Affichée'], [0, 'Masquée']] },
  },
  vwap: {
    bands: { label: 'Bandes', choices: [[2, '±1σ et ±2σ'], [1, '±1σ'], [0, 'Aucune']] },
  },
};

export function defaultOptions() {
  const out = {};
  for (const [layer, opts] of Object.entries(OPTIONS)) {
    out[layer] = Object.fromEntries(Object.entries(opts).map(([k, o]) => [k, o.choices[0][0]]));
  }
  return out;
}

// Libellé court du réglage principal (affiché dans la légende).
export function optionSummary(layer, opts) {
  const defs = OPTIONS[layer];
  if (!defs || !opts) return '';
  const [key, def] = Object.entries(defs)[0];
  return def.choices.find(([v]) => v === opts[key])?.[1] ?? '';
}
