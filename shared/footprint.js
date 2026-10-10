// Lecture du footprint (calculs sans dessin, testables) : regroupement de lignes, déséquilibres
// diagonaux, déséquilibres empilés et enchères inachevées. Cellules : [ligne, ventes, achats,
// nb ventes, nb achats].

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
