// Panneaux d'indicateurs sous le graphique principal, alignés sur les mêmes colonnes :
// volume, delta par bougie, CVD (delta cumulé depuis la première bougie chargée), open interest,
// liquidations. Le nom et les valeurs de la bougie survolée sont affichés en HTML (ChartView) ;
// chaque panneau renvoie la conversion hauteur -> valeur utilisée par le réticule.
import { compact, qty, sgn } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

export const PANES = { volume: 'Volume', delta: 'Delta', cvd: 'CVD', oi: 'Open interest', liq: 'Liquidations', stats: 'Statistiques' };

// Lignes du tableau de statistiques, par priorité (celles qui tiennent dans la hauteur sont gardées).
const STATS = [
  ['Delta', (b) => b.b - b.s, 'delta'],
  ['Volume', (b) => b.v, 'plain'],
  ['Delta %', (b) => (b.v > 0 ? ((b.b - b.s) / b.v) * 100 : 0), 'pct'],
  ['Achats', (b) => b.b, 'buy'],
  ['Ventes', (b) => b.s, 'sell'],
  ['Trades', (b) => b.n ?? 0, 'count'],
];

// Tableau par bougie (Bar Stats de LuxAlgo, Cluster Statistic d'ATAS) : une ligne par statistique,
// fond d'intensité relative à la vue, valeurs écrites quand la colonne est assez large.
function drawStats(ctx, items, geo, { top, h, w, axisW }) {
  const [i0, i1] = geo.range;
  const n = Math.max(1, Math.min(STATS.length, Math.floor((h - 6) / 13)));
  const rowH = (h - 6) / n;
  const colW = Math.max(1, geo.slot - 2);
  const text = geo.slot >= 30 && rowH >= 11;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  STATS.slice(0, n).forEach(([label, get, kind], k) => {
    const yt = top + 3 + k * rowH;
    let max = 0;
    for (let i = i0; i <= i1; i++) max = Math.max(max, Math.abs(get(items[i])));
    for (let i = i0; i <= i1; i++) {
      const v = get(items[i]);
      const x = geo.x(items[i], i);
      const color = kind === 'buy' ? C.growth : kind === 'sell' ? C.loss : kind === 'delta' || kind === 'pct' ? (v >= 0 ? C.growth : C.loss) : C.mist;
      ctx.fillStyle = alpha(color, 0.05 + 0.4 * (max > 0 ? Math.abs(v) / max : 0));
      ctx.fillRect(x - colW / 2, yt + 0.5, colW, rowH - 1);
      if (!text) continue;
      ctx.font = font(10, kind === 'delta' ? 600 : 400);
      ctx.fillStyle = kind === 'plain' || kind === 'count' ? C.mist : color;
      const s = kind === 'pct' ? `${Math.round(v)}%` : kind === 'count' ? compact(v) : qty(v);
      ctx.fillText(s, x, yt + rowH / 2 + 0.5);
    }
    ctx.font = font(10);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.graphite;
    ctx.fillText(label, w + 10, yt + rowH / 2 + 0.5); // nom de la ligne dans la colonne d'échelle
    ctx.textAlign = 'center';
  });
  ctx.textAlign = 'left';
}

// Index de la bougie qui contient l'instant t (recherche dichotomique sur t0).
export function barIndex(items, t) {
  let lo = 0;
  let hi = items.length - 1;
  if (hi < 0 || t < items[0].t0) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (items[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Montant liquidé par bougie : index -> [longues, courtes] (montant en devise de cotation).
function liqByBar(items, liqs, i0, i1) {
  const sums = new Map();
  for (const [t, p, q, side] of liqs) {
    const i = barIndex(items, t);
    if (i < i0 || i > i1) continue;
    const cell = sums.get(i) ?? [0, 0];
    cell[side < 0 ? 0 : 1] += p * q;
    sums.set(i, cell);
  }
  return sums;
}

// Dernier point d'open interest publié avant la fin de la bougie.
function oiAt(oi, item) {
  const end = item.t1 ?? item.t0;
  let k = -1;
  for (let j = 0; j < oi.length && oi[j][0] <= end; j++) k = j;
  return k < 0 ? null : { v: oi[k][1], prev: k > 0 ? oi[k - 1][1] : null };
}

export function drawPane(ctx, kind, rect, items, geo, scale, { oi = [], liqs = [], axisW }) {
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
  const barW = Math.max(1, Math.min(geo.slot * 0.7, 40)); // colonnes larges (TPO, footprint) : barre plafonnée
  const mid = top + h / 2;
  const bottom = top + h - pad;
  let lo = 0;
  let hi = 1;
  let valueAt = null;

  if (kind === 'stats') {
    drawStats(ctx, items, geo, { top, h, w, axisW });
    ctx.restore();
    return { kind, top, h, valueAt: null, format: qty };
  }
  if (kind === 'liq') {
    // Courtes liquidées vers le haut (achats forcés), longues vers le bas (ventes forcées).
    const sums = liqByBar(items, liqs, i0, i1);
    let max = 0;
    for (const [l, s] of sums.values()) max = Math.max(max, l, s);
    for (const [i, [longs, shorts]] of sums) {
      const x = geo.x(items[i], i) - barW / 2;
      ctx.fillStyle = alpha(C.growth, 0.75);
      ctx.fillRect(x, mid - (shorts / max) * (inner / 2), barW, (shorts / max) * (inner / 2));
      ctx.fillStyle = alpha(C.loss, 0.75);
      ctx.fillRect(x, mid, barW, (longs / max) * (inner / 2));
    }
    [lo, hi] = [-max, max];
    valueAt = (y) => Math.abs(((mid - y) / (inner / 2)) * max);
  } else if (kind === 'volume' || kind === 'delta') {
    const vol = kind === 'volume';
    let max = 0;
    for (let i = i0; i <= i1; i++) max = Math.max(max, vol ? items[i].v : Math.abs(items[i].b - items[i].s));
    const base = vol ? bottom : mid;
    const scaleH = vol ? inner : inner / 2;
    for (let i = i0; i <= i1; i++) {
      const b = items[i];
      const val = vol ? b.v : b.b - b.s;
      const bh = max > 0 ? (Math.abs(val) / max) * scaleH : 0;
      const positive = vol ? b.c >= b.o : val >= 0;
      ctx.fillStyle = alpha(positive ? C.growth : C.loss, vol ? 0.45 : 0.7);
      ctx.fillRect(geo.x(b, i) - barW / 2, val >= 0 || vol ? base - bh : base, barW, Math.max(1, bh));
    }
    [lo, hi] = [vol ? 0 : -max, max];
    valueAt = (y) => ((base - y) / scaleH) * max;
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
      const [l0, h0] = [lo, hi];
      valueAt = (y) => l0 + (1 - (y - top - pad) / inner) * (h0 - l0);
    } else if (kind === 'oi') {
      ctx.font = font(11);
      ctx.fillStyle = C.smoke;
      ctx.textBaseline = 'middle';
      ctx.fillText('Open interest : futures uniquement, 30 derniers jours (Binance)', 8, mid);
    }
  }

  // Échelle à droite (bornes de la vue).
  ctx.fillStyle = alpha(C.ink, 0.9);
  ctx.fillRect(w, top + 1, axisW, h - 1);
  ctx.fillStyle = alpha(C.white, 0.07);
  ctx.fillRect(w, top, 1, h);
  ctx.font = font(10);
  ctx.fillStyle = C.graphite;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const label = (v) => (kind === 'liq' ? compact(Math.abs(v)) : qty(v));
  ctx.fillText(label(hi), w + 10, top + pad + 4);
  ctx.fillText(label(lo), w + 10, top + h - pad - 4);
  ctx.restore();
  return { kind, top, h, valueAt, format: label };
}

// Valeurs d'une bougie pour la légende HTML du panneau : [libellé, valeur, ton].
export function paneValues(kind, items, i, { oi = [], liqs = [] } = {}) {
  const b = items[i];
  if (!b) return [];
  const tone = (v) => (v >= 0 ? 'pos' : 'neg');
  if (kind === 'volume') return [['', qty(b.v), ''], ['Achats', qty(b.b), 'pos'], ['Ventes', qty(b.s), 'neg']];
  if (kind === 'stats') return [['Trades', compact(b.n ?? 0), '']];
  if (kind === 'delta') {
    const d = b.b - b.s;
    return [['', (d >= 0 ? '+' : '') + qty(d), tone(d)], ['', b.v > 0 ? `${sgn((d / b.v) * 100, 1)} % du volume` : '', '']];
  }
  if (kind === 'cvd') {
    let cum = 0;
    for (let k = 0; k <= i; k++) cum += items[k].b - items[k].s;
    return [['', qty(cum), tone(cum)], ['Δ bougie', (b.b >= b.s ? '+' : '') + qty(b.b - b.s), tone(b.b - b.s)]];
  }
  if (kind === 'oi') {
    const p = oiAt(oi, b);
    if (!p) return [['', '—', '']];
    const out = [['', qty(p.v), ''], ['', `${compact(p.v * b.c)} $`, '']];
    if (p.prev !== null) out.push(['Var.', `${sgn(p.v - p.prev, 2)} (${sgn(((p.v - p.prev) / p.prev) * 100, 2)} %)`, tone(p.v - p.prev)]);
    return out;
  }
  if (kind === 'liq') {
    const [longs, shorts] = liqByBar(items, liqs, i, i).get(i) ?? [0, 0];
    return [['Longues', `${compact(longs)} $`, longs ? 'neg' : ''], ['Courtes', `${compact(shorts)} $`, shorts ? 'pos' : '']];
  }
  return [];
}

