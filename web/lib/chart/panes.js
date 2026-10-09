// Panneaux d'indicateurs sous le graphique principal, alignés sur les mêmes colonnes :
// volume, delta par bougie, CVD (delta cumulé depuis la première bougie chargée), open interest.
import { fmt, qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

export const PANES = { volume: 'Volume', delta: 'Delta', cvd: 'CVD', oi: 'Open interest' };

export function drawPane(ctx, kind, rect, items, geo, scale, { oi = [], axisW }) {
  const { y: top, h } = rect;
  const w = scale.w;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, w + axisW, h);
  ctx.clip();
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, top, w + axisW, h);
  ctx.fillStyle = alpha(C.white, 0.07);
  ctx.fillRect(0, top, w + axisW, 1);

  const [i0, i1] = geo.range;
  const pad = 6;
  const inner = h - 2 * pad;
  const barW = Math.max(1, geo.slot * 0.7);
  let lastValue = null;
  let lo = 0;
  let hi = 1;

  if (kind === 'volume' || kind === 'delta') {
    let max = 0;
    for (let i = i0; i <= i1; i++) max = Math.max(max, kind === 'volume' ? items[i].v : Math.abs(items[i].b - items[i].s));
    const base = kind === 'volume' ? top + h - pad : top + h / 2;
    const scaleH = kind === 'volume' ? inner : inner / 2;
    for (let i = i0; i <= i1; i++) {
      const b = items[i];
      const val = kind === 'volume' ? b.v : b.b - b.s;
      const bh = max > 0 ? (Math.abs(val) / max) * scaleH : 0;
      const positive = kind === 'volume' ? b.c >= b.o : val >= 0;
      ctx.fillStyle = alpha(positive ? C.growth : C.loss, kind === 'volume' ? 0.45 : 0.7);
      ctx.fillRect(geo.x(b, i) - barW / 2, val >= 0 || kind === 'volume' ? base - bh : base, barW, Math.max(1, bh));
    }
    if (i1 >= i0) lastValue = kind === 'volume' ? items[i1].v : items[i1].b - items[i1].s;
    lo = kind === 'volume' ? 0 : -max;
    hi = max;
  } else {
    // Séries en ligne : CVD calculé sur les bougies, OI venant de Binance.
    const pts = [];
    if (kind === 'cvd') {
      let cum = 0;
      for (let i = 0; i <= i1; i++) {
        cum += items[i].b - items[i].s;
        if (i >= i0) pts.push([geo.x(items[i], i), cum]);
      }
    } else {
      for (const [t, v] of oi) {
        const x = scale.xAt(t, items);
        if (x >= -10 && x <= w + 10) pts.push([x, v]);
      }
    }
    if (pts.length) {
      lo = Math.min(...pts.map((p) => p[1]));
      hi = Math.max(...pts.map((p) => p[1]));
      if (hi - lo < 1e-9) hi = lo + 1;
      const yOf = (v) => top + pad + (1 - (v - lo) / (hi - lo)) * inner;
      ctx.strokeStyle = kind === 'cvd' ? C.ember : C.mist;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pts.forEach(([x, v], k) => (k ? ctx.lineTo(x, yOf(v)) : ctx.moveTo(x, yOf(v))));
      ctx.stroke();
      lastValue = pts[pts.length - 1][1];
    }
  }

  // Étiquette et échelle à droite.
  ctx.font = font(11, 500);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = C.graphite;
  ctx.fillText(PANES[kind], 8, top + 6);
  if (lastValue !== null) {
    ctx.fillStyle = kind === 'cvd' ? C.ember : lastValue >= 0 ? C.mist : C.loss;
    ctx.fillText(kind === 'oi' ? fmt(lastValue, 0) : qty(lastValue), 8 + ctx.measureText(PANES[kind]).width + 10, top + 6);
  }
  ctx.fillStyle = alpha(C.ink, 0.9);
  ctx.fillRect(w, top + 1, axisW, h - 1);
  ctx.fillStyle = alpha(C.white, 0.07);
  ctx.fillRect(w, top, 1, h);
  ctx.font = font(10);
  ctx.fillStyle = C.graphite;
  ctx.textBaseline = 'middle';
  ctx.fillText(kind === 'oi' ? fmt(hi, 0) : qty(hi), w + 10, top + pad + 4);
  ctx.fillText(kind === 'oi' ? fmt(lo, 0) : qty(lo), w + 10, top + h - pad - 4);
  ctx.restore();
}
