// Lecture du footprint (calculs sans dessin, testables) : regroupement de lignes, déséquilibres
// diagonaux, déséquilibres empilés, enchères inachevées, absorption et épuisement. Cellules :
// [ligne, ventes, achats, nb ventes, nb achats].

// Cellules [ligne, ventes, achats, nb ventes, nb achats] triées et regroupées par `m` lignes
// (mémorisé par footprint de bougie).
const merged = new WeakMap();
export function mergeRows(fp, m) {
  const byM = merged.get(fp) ?? new Map();
  merged.set(fp, byM);
  if (byM.has(m)) return byM.get(m);
  const rows = new Map();
  for (const [row, sv, bv, sn, bn] of fp) {
    const r = Math.floor(row / m);
    const c = rows.get(r) ?? [r, 0, 0, 0, 0];
    c[1] += sv;
    c[2] += bv;
    c[3] += sn ?? 0;
    c[4] += bn ?? 0;
    rows.set(r, c);
  }
  const out = [...rows.values()].sort((a, b) => a[0] - b[0]);
  byM.set(m, out);
  return out;
}

// Déséquilibres diagonaux : achats d'un niveau ≥ ratio × ventes du niveau inférieur (et inversement).
// Une case opposée à zéro (« zero print ») n'est pas un déséquilibre par défaut, comme dans
// Flowsurface (ignore_zeros) : sinon chaque bord de bougie produirait de faux déséquilibres empilés.
export function imbalances(fp, ratio, zeros = 'ignore') {
  const strict = zeros === 'ignore';
  const byRow = new Map(fp.map((c) => [c[0], c]));
  const buy = new Set();
  const sell = new Set();
  for (const [row, sv, bv] of fp) {
    const below = byRow.get(row - 1);
    const above = byRow.get(row + 1);
    if (below && bv > 0 && (!strict || below[1] > 0) && bv >= ratio * below[1]) buy.add(row);
    if (above && sv > 0 && (!strict || above[2] > 0) && sv >= ratio * above[2]) sell.add(row);
  }
  return { buy, sell };
}

// Suites d'au moins `min` lignes consécutives : [[début, fin], ...].
export function stacks(set, min) {
  const rows = [...set].sort((a, b) => a - b);
  const out = [];
  let start = null;
  rows.forEach((r, k) => {
    if (start === null) start = r;
    if (rows[k + 1] !== r + 1) {
      if (r - start + 1 >= min) out.push([start, r]);
      start = null;
    }
  });
  return out;
}

// Enchère inachevée : acheteurs ET vendeurs sur la ligne extrême (plus haut ou plus bas) de la
// bougie, aux lignes d'origine ; le marché y revient souvent. Retourne le milieu de ces lignes.
export function unfinished(fp, step) {
  if (!fp.length) return [];
  const out = [];
  const top = fp[fp.length - 1];
  const bottom = fp[0];
  if (top[1] > 0 && top[2] > 0) out.push({ price: (top[0] + 0.5) * step, high: true });
  if (bottom[1] > 0 && bottom[2] > 0) out.push({ price: (bottom[0] + 0.5) * step, high: false });
  return out;
}

// Absorption et épuisement lus dans les trades d'une bougie (et non dans le carnet, falsifiable) :
//  - absorption : sur une des 2 lignes extrêmes, l'agression d'un côté pèse ≥ 2,5 × la ligne moyenne
//    sans faire progresser le prix (clôture repartie à l'opposé de l'extrême) : un acteur passif
//    encaisse tout, retournement possible ;
//  - épuisement : sur la ligne extrême, l'agression qui poussait le prix est quasi nulle
//    (≤ 15 % de la ligne moyenne) : plus personne pour pousser.
// Retourne [{ row, side, kind }] ; side 1 = acheteurs (en bas), -1 = vendeurs (en haut).
export function flowMarks(fp, bar, step) {
  if (fp.length < 4 || !(bar.h > bar.l)) return [];
  let total = 0;
  for (const c of fp) total += c[1] + c[2];
  const avg = total / fp.length;
  const pos = (bar.c - bar.l) / (bar.h - bar.l); // 0 = clôture au plus bas, 1 = au plus haut
  const out = [];
  const low = fp.slice(0, 2);
  const high = fp.slice(-2);
  const absLow = low.find((c) => c[1] >= 2.5 * avg && c[1] >= 0.6 * (c[1] + c[2]));
  if (absLow && pos >= 0.4) out.push({ row: absLow[0], side: 1, kind: 'absorption', price: (absLow[0] + 0.5) * step });
  const absHigh = high.find((c) => c[2] >= 2.5 * avg && c[2] >= 0.6 * (c[1] + c[2]));
  if (absHigh && pos <= 0.6) out.push({ row: absHigh[0], side: -1, kind: 'absorption', price: (absHigh[0] + 0.5) * step });
  const bottom = fp[0];
  const top = fp[fp.length - 1];
  if (bottom[1] <= 0.15 * avg && bar.c < bar.o) out.push({ row: bottom[0], side: 1, kind: 'exhaustion', price: (bottom[0] + 0.5) * step });
  if (top[2] <= 0.15 * avg && bar.c > bar.o) out.push({ row: top[0], side: -1, kind: 'exhaustion', price: (top[0] + 0.5) * step });
  return out;
}
