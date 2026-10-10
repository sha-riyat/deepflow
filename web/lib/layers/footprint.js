// Footprint dans les bougies (modes d'ATAS, LuxAlgo, Exocharts) : bid × ask, échelle bid × ask,
// delta, volume, trades, volume + delta, profil bid / ask et profil delta. Cases en déséquilibre
// encadrées, déséquilibres empilés et enchères inachevées prolongés, POC et value area par bougie,
// delta sous chaque bougie, lignes regroupées automatiquement quand on dézoome.
import { footprintStats } from '@shared/bars.js';
import { qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';
import { drawFootprintZones, flowMarks, imbalances, mergeRows, rowMult } from './fpmarks.js';

export const FP_MODES = {
  off: 'Désactivé',
  bidask: 'Bid × Ask',
  ladder: 'Échelle bid × ask',
  delta: 'Delta',
  volume: 'Volume',
  trades: 'Trades',
  voldelta: 'Volume + delta',
  profile: 'Profil bid / ask',
  deltaprofile: 'Profil delta',
};

export const MIN_SLOT = 36; // largeur de colonne (px) à partir de laquelle le footprint remplace la bougie
const SPLIT = ['bidask', 'ladder']; // modes à deux colonnes (bougie possible au centre)

function drawCandle(ctx, b, x, y, wide) {
  const up = b.c >= b.o;
  ctx.fillStyle = up ? C.growth : C.loss;
  ctx.fillRect(x - 0.5, y(b.h), 1, Math.max(1, y(b.l) - y(b.h)));
  const top = y(Math.max(b.o, b.c));
  ctx.fillRect(x - wide / 2, top, wide, Math.max(1, y(Math.min(b.o, b.c)) - top));
}

export function drawFootprint(ctx, items, geo, scale, opts) {
  const { mode, bucket, ratio = 3, zeros = 'ignore', stack = 3, outline = 1, candle = 'left', auctions = 1, rows = 'auto', marks = 1 } = opts;
  const [i0, i1] = geo.range;
  const y = (p) => scale.yOfPrice(p);
  const baseH = Math.abs(y(0) - y(bucket));
  const textMode = !['profile', 'deltaprofile'].includes(mode);
  const mult = rows === 'auto' ? rowMult(baseH, textMode ? 12 : 4) : 1;
  const step = bucket * mult;
  const rowH = baseH * mult;
  drawFootprintZones(ctx, items, geo, scale, { bucket, mult, ratio, zeros, stack, auctions, visible: geo.slot >= MIN_SLOT && mode !== 'off' });

  if (geo.slot < MIN_SLOT || mode === 'off') return;
  const text = rowH >= 10 && geo.slot >= 56;
  const half = geo.slot * 0.45;
  const centered = candle === 'center' && SPLIT.includes(mode);
  ctx.textBaseline = 'middle';
  for (let i = i0; i <= i1; i++) {
    const b = items[i];
    if (!b.fp?.length) continue;
    const fp = mergeRows(b.fp, mult);
    const x = geo.x(b, i);
    const left = centered ? x - half : x - half + 7;
    const width = centered ? half * 2 : half * 2 - 7;
    const mid = left + width / 2;
    const gap = centered ? 6 : 0; // place de la bougie entre bid et ask
    const st = footprintStats(fp);
    const imb = imbalances(fp, ratio, zeros);
    let maxSide = 0;
    let maxAbsD = 0;
    for (const c of fp) {
      maxSide = Math.max(maxSide, c[1], c[2]);
      maxAbsD = Math.max(maxAbsD, Math.abs(c[2] - c[1]));
    }

    for (const [row, sv, bv, sn, bn] of fp) {
      const yt = y((row + 1) * step);
      const h = Math.max(1, y(row * step) - yt);
      if (yt > scale.h || yt + h < 0) continue;
      const vol = sv + bv;
      const d = bv - sv;
      const cell = (x0, w, color, a) => {
        ctx.fillStyle = alpha(color, a);
        ctx.fillRect(x0, yt + 0.5, w, h - 1);
      };
      if (mode === 'profile') {
        cell(mid - (sv / st.max) * (width / 2), (sv / st.max) * (width / 2), C.loss, 0.65);
        cell(mid, (bv / st.max) * (width / 2), C.growth, 0.65);
      } else if (mode === 'deltaprofile') {
        const w = maxAbsD > 0 ? (Math.abs(d) / maxAbsD) * (width / 2) : 0;
        cell(d >= 0 ? mid : mid - w, w, d >= 0 ? C.growth : C.loss, 0.7);
      } else if (mode === 'ladder') {
        cell(left, width / 2 - gap / 2, C.loss, 0.06 + 0.5 * (maxSide ? sv / maxSide : 0));
        cell(mid + gap / 2, width / 2 - gap / 2, C.growth, 0.06 + 0.5 * (maxSide ? bv / maxSide : 0));
      } else {
        const tone = mode === 'volume' || mode === 'trades' ? C.ember : d >= 0 ? C.growth : C.loss;
        const k = mode === 'delta' && maxAbsD > 0 ? Math.abs(d) / maxAbsD : st.max > 0 ? vol / st.max : 0;
        cell(left, width, tone, 0.06 + 0.4 * k);
      }
      if (row === st.poc) {
        ctx.strokeStyle = C.ember;
        ctx.lineWidth = 1.25;
        ctx.strokeRect(left + 0.5, yt + 1, width - 1, h - 2);
      }
      // Cases en déséquilibre encadrées, du côté qui domine (comme sur Exocharts / LuxAlgo).
      if (outline && SPLIT.includes(mode)) {
        ctx.lineWidth = 1.25;
        if (imb.sell.has(row)) {
          ctx.strokeStyle = C.loss;
          ctx.strokeRect(left + 1.5, yt + 1.5, width / 2 - gap / 2 - 3, h - 3);
        }
        if (imb.buy.has(row)) {
          ctx.strokeStyle = C.growth;
          ctx.strokeRect(mid + gap / 2 + 1.5, yt + 1.5, width / 2 - gap / 2 - 3, h - 3);
        }
      }
      if (!text || !textMode) continue;
      const size = Math.min(11, h - 3);
      const yc = yt + h / 2 + 0.5;
      const put = (s, xx, align, color, bold = false) => {
        ctx.font = font(size, bold ? 700 : 400);
        ctx.textAlign = align;
        ctx.fillStyle = color;
        ctx.fillText(s, xx, yc);
      };
      if (SPLIT.includes(mode)) {
        put(qty(sv), mid - gap / 2 - 5, 'right', imb.sell.has(row) ? C.loss : C.mist, imb.sell.has(row));
        if (!centered) put('×', mid, 'center', C.smoke);
        put(qty(bv), mid + gap / 2 + 5, 'left', imb.buy.has(row) ? C.growth : C.mist, imb.buy.has(row));
      } else if (mode === 'delta') put((d >= 0 ? '+' : '') + qty(d), mid, 'center', d >= 0 ? C.growth : C.loss);
      else if (mode === 'volume') put(qty(vol), mid, 'center', C.mist);
      else if (mode === 'trades') put(String((sn ?? 0) + (bn ?? 0)), mid, 'center', C.mist);
      else if (mode === 'voldelta') {
        put(qty(vol), mid - 4, 'right', C.mist);
        put((d >= 0 ? '+' : '') + qty(d), mid + 4, 'left', d >= 0 ? C.growth : C.loss);
      }
    }
    // Bougie : fine au centre entre bid et ask, ou sur le bord gauche.
    if (centered) drawCandle(ctx, b, mid, y, 4);
    else drawCandle(ctx, b, x - half + 2, y, 4);
    // Absorption (A) et épuisement (E) : pastille à gauche de la ligne concernée.
    if (marks) {
      for (const m of flowMarks(fp, b, step)) {
        const yy = y((m.row + 0.5) * step);
        const color = m.side > 0 ? C.growth : C.loss;
        ctx.fillStyle = m.kind === 'absorption' ? color : C.obsidian;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(x - half - 9, yy - 7, 14, 14, 4);
        ctx.fill();
        ctx.stroke();
        ctx.font = font(10, 700);
        ctx.textAlign = 'center';
        ctx.fillStyle = m.kind === 'absorption' ? C.ink : color;
        ctx.fillText(m.kind === 'absorption' ? 'A' : 'E', x - half - 2, yy + 0.5);
      }
    }
    // Value area de la bougie : trait vertical sur le bord droit.
    ctx.fillStyle = alpha(C.mist, 0.5);
    ctx.fillRect(x + half - 1, y((st.vah + 1) * step), 1.5, y(st.val * step) - y((st.vah + 1) * step));
    // Delta de la bougie sous son plus bas.
    if (text) {
      const dBar = b.b - b.s;
      ctx.font = font(11, 600);
      ctx.textAlign = 'center';
      ctx.fillStyle = dBar >= 0 ? C.growth : C.loss;
      ctx.fillText((dBar >= 0 ? '+' : '') + qty(dBar), x, Math.min(scale.h - 8, y(b.l) + 12));
    }
  }
  ctx.textAlign = 'left';
}
