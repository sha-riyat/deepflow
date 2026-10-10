// Statistiques d'une bougie pour la lecture effort / résultat : delta en % du volume, volume relatif
// (multiple du volume moyen des bougies précédentes) et taille moyenne d'un ordre agresseur.

// Seuil de « bougie d'initiative » : |delta| ≥ 10 % du volume (repère cité dans les vidéos sur le
// CVD ; en dessous, la bougie est équilibrée entre acheteurs et vendeurs agressifs).
export const INITIATIVE_PCT = 10;

export const deltaPct = (b) => (b.v > 0 ? ((b.b - b.s) / b.v) * 100 : 0);

// Volume de la bougie i rapporté à la moyenne des `n` précédentes (null s'il y en a moins de 5).
export function relativeVolume(items, i, n = 20) {
  const from = Math.max(0, i - n);
  if (i - from < 5) return null;
  let sum = 0;
  for (let k = from; k < i; k++) sum += items[k].v;
  const mean = sum / (i - from);
  return mean > 0 ? items[i].v / mean : null;
}

// Taille moyenne d'un ordre agresseur (trades agrégés Binance : un ordre au marché, à un prix).
export const avgSize = (b) => (b.n > 0 ? b.v / b.n : null);
