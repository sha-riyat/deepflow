// Analyse des cellules du footprint : regroupement de lignes au dézoom, déséquilibres diagonaux,
// déséquilibres empilés et enchères inachevées, avec leurs zones prolongées jusqu'au retest.
import { C, alpha } from '../theme.js';

const MULTS = [1, 2, 4, 5, 10, 20, 25, 50, 100];

// Regroupement de lignes tel qu'une ligne fasse au moins `minPx` pixels (1 = taille d'origine).
export function rowMult(rowPx, minPx) {
  return MULTS.find((m) => rowPx * m >= minPx) ?? MULTS[MULTS.length - 1];
}

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
export function imbalances(fp, ratio) {
  const byRow = new Map(fp.map((c) => [c[0], c]));
  const buy = new Set();
  const sell = new Set();
  for (const [row, sv, bv] of fp) {
    const below = byRow.get(row - 1);
    const above = byRow.get(row + 1);
    if (below && bv > 0 && bv >= ratio * below[1]) buy.add(row);
    if (above && sv > 0 && sv >= ratio * above[2]) sell.add(row);
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

// Zones prolongées : déséquilibres empilés (bande colorée) et enchères inachevées (trait), depuis
// leur bougie jusqu'à la première bougie qui retraverse le niveau, ou jusqu'au bord droit.
export function drawFootprintZones(ctx, items, geo, scale, { bucket, mult, ratio, stack, auctions, visible }) {
  const [i0, i1] = geo.range;
  const y = (p) => scale.yOfPrice(p);
  const half = geo.slot * 0.45;
  const step = bucket * mult;
  const endOf = (i, test) => {
    for (let k = i + 1; k < items.length; k++) if (test(items[k])) return k;
    return items.length - 1;
  };
  const xEnd = (end) => (end === items.length - 1 ? scale.w : geo.x(items[end], end));
  for (let i = Math.max(0, i0 - 300); i <= i1; i++) {
    const b = items[i];
    if (!b.fp?.length) continue;
    const fp = mergeRows(b.fp, mult);
    const imb = imbalances(fp, ratio);
    for (const [side, set] of [[1, imb.buy], [-1, imb.sell]]) {
      for (const [lo, hi] of stacks(set, stack)) {
        const [pLo, pHi] = [lo * step, (hi + 1) * step];
        const end = endOf(i, (it) => it.l <= pHi && it.h >= pLo);
        if (end < i0) continue;
        const x0 = geo.x(b, i) + half;
        ctx.fillStyle = alpha(side > 0 ? C.growth : C.loss, 0.12);
        ctx.fillRect(x0, y(pHi), Math.max(0, xEnd(end) - x0), y(pLo) - y(pHi));
      }
    }
    // Enchères inachevées : seulement avec les cellules visibles, hors bougie en cours (extrêmes
    // encore ouverts) ; terminées dès qu'une bougie suivante revient sur le niveau.
    if (!auctions || !visible || i === items.length - 1) continue;
    for (const u of unfinished(mergeRows(b.fp, 1), bucket)) {
      const end = endOf(i, (it) => it.l <= u.price && it.h >= u.price);
      if (end < i0) continue;
      const x0 = geo.x(b, i) - half;
      ctx.strokeStyle = alpha(C.ember, 0.75);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, y(u.price));
      ctx.lineTo(xEnd(end), y(u.price));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
