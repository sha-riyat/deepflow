// Footprint dans les bougies : six modes d'affichage, déséquilibres diagonaux, déséquilibres
// empilés prolongés jusqu'à ce que le prix les traverse, POC et value area par bougie.
import { footprintStats } from '@shared/bars.js';
import { qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

export const FP_MODES = {
  off: 'Désactivé',
  bidask: 'Bid × Ask',
  delta: 'Delta',
  volume: 'Volume',
  trades: 'Trades',
  voldelta: 'Volume + delta',
  profile: 'Profil',
};

export const MIN_SLOT = 36; // largeur de colonne (px) à partir de laquelle le footprint remplace la bougie

// Déséquilibres d'une bougie : acheteurs d'un niveau vs vendeurs du niveau inférieur, et inversement.
function imbalances(fp, ratio) {
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

// Zones de déséquilibres empilés (au moins `min` niveaux consécutifs du même côté).
function stacks(set, min) {
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

export function drawFootprint(ctx, items, geo, scale, opts) {
  const { mode, bucket, ratio = 3, stackMin = 3 } = opts;
  const [i0, i1] = geo.range;
  const y = (p) => scale.yOfPrice(p);
  const rowH = Math.abs(y(0) - y(bucket));
  const half = geo.slot * 0.45;
  const zones = [];

  // Les zones empilées des bougies antérieures restent visibles tant qu'elles ne sont pas retestées.
  for (let i = Math.max(0, i0 - 300); i <= i1; i++) {
    const b = items[i];
    if (!b.fp) continue;
    const imb = imbalances(b.fp, ratio);
    for (const [side, set] of [[1, imb.buy], [-1, imb.sell]]) {
      for (const [lo, hi] of stacks(set, stackMin)) {
        const pLo = lo * bucket;
        const pHi = (hi + 1) * bucket;
        let end = items.length - 1;
        for (let k = i + 1; k < items.length; k++) {
          if (items[k].l <= pHi && items[k].h >= pLo) {
            end = k;
            break;
          }
        }
        if (end >= i0) zones.push({ i, end, pLo, pHi, side });
      }
    }
  }
  for (const z of zones) {
    const x0 = geo.x(items[z.i], z.i) + half;
    const x1 = z.end === items.length - 1 ? scale.w : geo.x(items[z.end], z.end);
    ctx.fillStyle = alpha(z.side > 0 ? C.growth : C.loss, 0.12);
    ctx.fillRect(x0, y(z.pHi), Math.max(0, x1 - x0), y(z.pLo) - y(z.pHi));
  }

  if (geo.slot < MIN_SLOT || mode === 'off') return;
  const text = rowH >= 10 && geo.slot >= 56;
  ctx.textBaseline = 'middle';
  for (let i = i0; i <= i1; i++) {
    const b = items[i];
    if (!b.fp) continue;
    const x = geo.x(b, i);
    const left = x - half + 7;
    const width = half * 2 - 7;
    const mid = left + width / 2;
    const st = footprintStats(b.fp);
    const imb = imbalances(b.fp, ratio);
    let maxAbsD = 0;
    for (const c of b.fp) maxAbsD = Math.max(maxAbsD, Math.abs(c[2] - c[1]));

    // Bougie fine sur le bord gauche.
    const upBar = b.c >= b.o;
    ctx.fillStyle = upBar ? C.growth : C.loss;
    ctx.fillRect(x - half + 1.5, y(b.h), 1, Math.max(1, y(b.l) - y(b.h)));
    const top = y(Math.max(b.o, b.c));
    ctx.fillRect(x - half, top, 4, Math.max(1, y(Math.min(b.o, b.c)) - top));

    for (const [row, sv, bv, sn, bn] of b.fp) {
      const yt = y((row + 1) * bucket);
      const h = Math.max(1, y(row * bucket) - yt);
      if (yt > scale.h || yt + h < 0) continue;
      const vol = sv + bv;
      const d = bv - sv;
      const share = st.max > 0 ? vol / st.max : 0;
      if (mode === 'profile') {
        ctx.fillStyle = alpha(C.loss, 0.65);
        ctx.fillRect(mid - (sv / st.max) * (width / 2), yt + 0.5, (sv / st.max) * (width / 2), h - 1);
        ctx.fillStyle = alpha(C.growth, 0.65);
        ctx.fillRect(mid, yt + 0.5, (bv / st.max) * (width / 2), h - 1);
      } else {
        const tone = mode === 'volume' || mode === 'trades' ? C.ember : d >= 0 ? C.growth : C.loss;
        const k = mode === 'delta' && maxAbsD > 0 ? Math.abs(d) / maxAbsD : share;
        ctx.fillStyle = alpha(tone, 0.06 + 0.4 * k);
        ctx.fillRect(left, yt + 0.5, width, h - 1);
      }
      if (row === st.poc) {
        ctx.strokeStyle = C.ember;
        ctx.lineWidth = 1.25;
        ctx.strokeRect(left + 0.5, yt + 1, width - 1, h - 2);
      }
      if (!text || mode === 'profile') continue;
      const size = Math.min(11, h - 3);
      const yc = yt + h / 2 + 0.5;
      const put = (s, xx, align, color, bold = false) => {
        ctx.font = font(size, bold ? 700 : 400);
        ctx.textAlign = align;
        ctx.fillStyle = color;
        ctx.fillText(s, xx, yc);
      };
      if (mode === 'bidask') {
        put(qty(sv), mid - 5, 'right', imb.sell.has(row) ? C.loss : C.mist, imb.sell.has(row));
        put('×', mid, 'center', C.smoke);
        put(qty(bv), mid + 5, 'left', imb.buy.has(row) ? C.growth : C.mist, imb.buy.has(row));
      } else if (mode === 'delta') put((d >= 0 ? '+' : '') + qty(d), mid, 'center', d >= 0 ? C.growth : C.loss);
      else if (mode === 'volume') put(qty(vol), mid, 'center', C.mist);
      else if (mode === 'trades') put(String(sn + bn), mid, 'center', C.mist);
      else if (mode === 'voldelta') {
        put(qty(vol), mid - 4, 'right', C.mist);
        put((d >= 0 ? '+' : '') + qty(d), mid + 4, 'left', d >= 0 ? C.growth : C.loss);
      }
    }
    // Value area de la bougie : trait vertical sur le bord droit.
    ctx.fillStyle = alpha(C.mist, 0.5);
    ctx.fillRect(x + half - 1, y((st.vah + 1) * bucket), 1.5, y(st.val * bucket) - y((st.vah + 1) * bucket));
  }
  ctx.textAlign = 'left';
}
