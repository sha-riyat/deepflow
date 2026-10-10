// Zones prolongées du footprint (déséquilibres empilés, enchères inachevées) et regroupement de
// lignes au dézoom. Les calculs sur les cellules sont dans shared/footprint.js.
import { C, alpha } from '../theme.js';
import { imbalances, mergeRows, stacks, unfinished } from '@shared/footprint.js';

export { imbalances, mergeRows, stacks, unfinished };

const MULTS = [1, 2, 4, 5, 10, 20, 25, 50, 100];

// Regroupement de lignes tel qu'une ligne fasse au moins `minPx` pixels (1 = taille d'origine).
export function rowMult(rowPx, minPx) {
  return MULTS.find((m) => rowPx * m >= minPx) ?? MULTS[MULTS.length - 1];
}

// Zones prolongées : déséquilibres empilés (bande colorée) et enchères inachevées (trait), depuis
// leur bougie jusqu'à la première bougie qui retraverse le niveau, ou jusqu'au bord droit.
export function drawFootprintZones(ctx, items, geo, scale, { bucket, mult, ratio, zeros, stack, auctions, visible }) {
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
    const imb = imbalances(fp, ratio, zeros);
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
