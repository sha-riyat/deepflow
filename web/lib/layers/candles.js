// Séries de prix : bougies, bougies creuses, barres OHLC, bougies de volume, ligne, aire,
// baseline, escalier, colonnes, haut-bas. `geo` donne la position et la largeur des colonnes.
import { C, alpha } from '../theme.js';

export const STYLES = {
  candles: 'Bougies',
  hollow: 'Bougies creuses',
  bars: 'Barres OHLC',
  heikin: 'Heikin Ashi',
  volcandles: 'Bougies de volume',
  line: 'Ligne',
  area: 'Aire',
  baseline: 'Baseline',
  step: 'Escalier',
  columns: 'Colonnes',
  hilo: 'Haut-bas',
  linebreak: 'Line break',
  kagi: 'Kagi',
  pnf: 'Point & Figure',
  tpo: 'TPO (Market Profile)',
};

export function drawSeries(ctx, items, geo, scale, style) {
  const [i0, i1] = geo.range;
  if (i1 < i0) return;
  const y = (p) => scale.yOfPrice(p);
  const body = Math.max(1, geo.slot * (geo.body ?? 0.7)); // amincies quand les profils sont à côté (volprofile.js)
  const up = (b, i) => (style === 'hollow' && i > 0 ? b.c >= items[i - 1].c : b.c >= b.o);

  if (['line', 'area', 'baseline', 'step'].includes(style)) return drawLine(ctx, items, geo, scale, style);

  let maxV = 0;
  if (style === 'volcandles') for (let i = i0; i <= i1; i++) maxV = Math.max(maxV, items[i].v);

  for (let i = i0; i <= i1; i++) {
    const b = items[i];
    const x = geo.x(b, i);
    const color = up(b, i) ? C.growth : C.loss;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    if (style === 'bars') {
      ctx.fillRect(x - 0.5, y(b.h), 1, Math.max(1, y(b.l) - y(b.h)));
      ctx.fillRect(x - body / 2, y(b.o), body / 2, 1);
      ctx.fillRect(x, y(b.c), body / 2, 1);
      continue;
    }
    if (style === 'columns') {
      ctx.fillStyle = alpha(color, 0.6);
      ctx.fillRect(x - body / 2, y(b.c), body, scale.h - y(b.c));
      continue;
    }
    if (style === 'hilo') {
      ctx.fillRect(x - body / 2, y(b.h), body, Math.max(1, y(b.l) - y(b.h)));
      continue;
    }
    const w = style === 'volcandles' && maxV > 0 ? Math.max(2, body * (b.v / maxV)) : body;
    const top = y(Math.max(b.o, b.c));
    const h = Math.max(1, y(Math.min(b.o, b.c)) - top);
    ctx.fillRect(x - 0.5, y(b.h), 1, Math.max(1, y(b.l) - y(b.h)));
    if (style === 'hollow' && b.c >= b.o && w > 3) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x - w / 2, top, w, h);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - w / 2 + 0.5, top + 0.5, w - 1, Math.max(0, h - 1));
    } else ctx.fillRect(x - w / 2, top, w, h);
  }
}

function drawLine(ctx, items, geo, scale, style) {
  const [i0, i1] = geo.range;
  const pts = [];
  for (let i = Math.max(0, i0 - 1); i <= Math.min(items.length - 1, i1 + 1); i++) pts.push([geo.x(items[i], i), scale.yOfPrice(items[i].c)]);
  if (pts.length < 2) return;
  const path = new Path2D();
  pts.forEach(([x, y], k) => {
    if (k === 0) path.moveTo(x, y);
    else if (style === 'step') {
      path.lineTo(x, pts[k - 1][1]);
      path.lineTo(x, y);
    } else path.lineTo(x, y);
  });
  if (style === 'area') {
    const fill = new Path2D(path);
    fill.lineTo(pts[pts.length - 1][0], scale.h);
    fill.lineTo(pts[0][0], scale.h);
    const g = ctx.createLinearGradient(0, 0, 0, scale.h);
    g.addColorStop(0, alpha(C.ember, 0.35));
    g.addColorStop(1, alpha(C.ember, 0));
    ctx.fillStyle = g;
    ctx.fill(fill);
  }
  if (style === 'baseline') {
    const base = scale.yOfPrice(items[Math.max(0, i0)].c);
    for (const [color, clipTop] of [[C.growth, true], [C.loss, false]]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, clipTop ? 0 : base, scale.w, clipTop ? base : scale.h - base);
      ctx.clip();
      const fill = new Path2D(path);
      fill.lineTo(pts[pts.length - 1][0], base);
      fill.lineTo(pts[0][0], base);
      ctx.fillStyle = alpha(color, 0.18);
      ctx.fill(fill);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke(path);
      ctx.restore();
    }
    ctx.strokeStyle = alpha(C.white, 0.25);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, base);
    ctx.lineTo(scale.w, base);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  ctx.strokeStyle = style === 'line' || style === 'step' ? C.pale : C.ember;
  ctx.lineWidth = 1.5;
  ctx.stroke(path);
}

// --- types dérivés (mode index) ---

export function drawLineBreak(ctx, items, geo, scale) {
  const [i0, i1] = geo.range;
  const w = Math.max(1, geo.slot * 0.8);
  for (let i = i0; i <= i1; i++) {
    const l = items[i];
    const top = scale.yOfPrice(Math.max(l.o, l.c));
    ctx.fillStyle = l.up ? C.growth : C.loss;
    ctx.fillRect(geo.x(l, i) - w / 2, top, w, Math.max(1, scale.yOfPrice(Math.min(l.o, l.c)) - top));
  }
}

export function drawKagi(ctx, items, geo, scale) {
  const [i0, i1] = geo.range;
  for (let i = Math.max(0, i0); i <= i1; i++) {
    const s = items[i];
    const x = geo.x(s, i);
    ctx.strokeStyle = s.thick ? C.growth : C.loss;
    ctx.lineWidth = s.thick ? 3 : 1.25;
    ctx.beginPath();
    if (i > 0) ctx.moveTo(geo.x(items[i - 1], i - 1), scale.yOfPrice(s.from));
    else ctx.moveTo(x, scale.yOfPrice(s.from));
    ctx.lineTo(x, scale.yOfPrice(s.from));
    ctx.lineTo(x, scale.yOfPrice(s.to));
    ctx.stroke();
  }
}

export function drawPointFigure(ctx, items, geo, scale, box) {
  const [i0, i1] = geo.range;
  const size = Math.min(geo.slot * 0.8, Math.abs(scale.yOfPrice(0) - scale.yOfPrice(box)));
  for (let i = i0; i <= i1; i++) {
    const col = items[i];
    const x = geo.x(col, i);
    ctx.strokeStyle = col.up ? C.growth : C.loss;
    ctx.lineWidth = 1.25;
    for (let k = col.lo; k <= col.hi; k++) {
      const yc = scale.yOfPrice((k + 0.5) * box);
      const r = size / 2 - 1;
      if (r < 2) {
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x - geo.slot * 0.4, yc - size / 2, geo.slot * 0.8, Math.max(1, size));
        continue;
      }
      ctx.beginPath();
      if (col.up) {
        ctx.moveTo(x - r, yc - r);
        ctx.lineTo(x + r, yc + r);
        ctx.moveTo(x + r, yc - r);
        ctx.lineTo(x - r, yc + r);
      } else ctx.arc(x, yc, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
