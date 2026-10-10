// Panneau « Statistiques » (Bar Stats de LuxAlgo, Cluster Statistic d'ATAS, « order flow values » de
// DeepCharts) : une ligne par statistique et par bougie, fond d'intensité relative à la vue, valeurs
// écrites quand la colonne est assez large. Lecture effort / résultat : delta % au-delà du seuil
// d'initiative en couleur pleine, volume relatif fort (×2 et plus) en orange. Le tableau laisse en haut
// la place de la légende HTML du panneau (nom et valeurs de la bougie survolée) quand il y a la hauteur.
import { compact, qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';
import { INITIATIVE_PCT, avgSize, deltaPct, relativeVolume } from '@shared/barstats.js';

const LEGEND_H = 18; // hauteur de la légende HTML posée en haut du panneau

// Lignes, par priorité (celles qui tiennent dans la hauteur sont gardées) : [libellé, valeur, sorte].
const STATS = [
  ['Delta', (items, i) => items[i].b - items[i].s, 'delta'],
  ['Volume', (items, i) => items[i].v, 'plain'],
  ['Delta %', (items, i) => deltaPct(items[i]), 'pct'],
  ['Vol. ×', (items, i) => relativeVolume(items, i), 'mult'],
  ['Achats', (items, i) => items[i].b, 'buy'],
  ['Ventes', (items, i) => items[i].s, 'sell'],
  ['Trades', (items, i) => items[i].n ?? 0, 'count'],
  ['Taille moy.', (items, i) => avgSize(items[i]), 'plain'],
];

function colorOf(kind, v) {
  if (kind === 'buy') return C.growth;
  if (kind === 'sell') return C.loss;
  if (kind === 'delta') return v >= 0 ? C.growth : C.loss;
  if (kind === 'pct') return Math.abs(v) >= INITIATIVE_PCT ? (v >= 0 ? C.growth : C.loss) : C.graphite;
  if (kind === 'mult') return v >= 2 ? C.ember : C.mist;
  return C.mist;
}

function label(kind, v) {
  if (v === null) return '';
  if (kind === 'pct') return `${Math.round(v)}%`;
  if (kind === 'mult') return `×${v.toFixed(1).replace('.', ',')}`;
  if (kind === 'count') return compact(v);
  return qty(v);
}

export function drawStats(ctx, items, geo, { top, h, w }) {
  const [i0, i1] = geo.range;
  const head = h >= 64 ? LEGEND_H : 0;
  const body = h - 6 - head;
  const n = Math.max(1, Math.min(STATS.length, Math.floor(body / 13)));
  const rowH = body / n;
  const colW = Math.max(1, geo.slot - 2);
  const text = geo.slot >= 30 && rowH >= 11;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  STATS.slice(0, n).forEach(([name, get, kind], k) => {
    const yt = top + 3 + head + k * rowH;
    const vals = [];
    let max = 0;
    for (let i = i0; i <= i1; i++) {
      const v = get(items, i);
      vals.push(v);
      if (v !== null) max = Math.max(max, Math.abs(v));
    }
    for (let i = i0; i <= i1; i++) {
      const v = vals[i - i0];
      if (v === null) continue;
      const x = geo.x(items[i], i);
      const color = colorOf(kind, v);
      ctx.fillStyle = alpha(color, 0.05 + 0.4 * (max > 0 ? Math.abs(v) / max : 0));
      ctx.fillRect(x - colW / 2, yt + 0.5, colW, rowH - 1);
      if (!text) continue;
      ctx.font = font(10, kind === 'delta' ? 600 : 400);
      ctx.fillStyle = kind === 'plain' || kind === 'count' ? C.mist : color;
      ctx.fillText(label(kind, v), x, yt + rowH / 2 + 0.5);
    }
    ctx.font = font(10);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.graphite;
    ctx.fillText(name, w + 10, yt + rowH / 2 + 0.5); // nom de la ligne dans la colonne d'échelle
    ctx.textAlign = 'center';
  });
  ctx.textAlign = 'left';
}

// Valeurs de la bougie survolée pour la légende du panneau.
export function statsValues(items, i) {
  const b = items[i];
  const pct = deltaPct(b);
  const rel = relativeVolume(items, i);
  const tone = Math.abs(pct) >= INITIATIVE_PCT ? (pct >= 0 ? 'pos' : 'neg') : '';
  const out = [['Delta %', label('pct', pct), tone]];
  if (rel !== null) out.push(['Vol.', label('mult', rel), rel >= 2 ? 'pos' : '']);
  out.push(['Trades', compact(b.n ?? 0), '']);
  return out;
}
