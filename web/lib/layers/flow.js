// Flux d'ordres sur le graphique : bulles de trades, gros prints et liquidations.
// Inspirés des réglages de Bookmap / DeepCharts (bulles), ATAS / DeepCharts (gros prints)
// et Exocharts / Kiyotaka (liquidations), adaptés aux données publiques de Binance.
import { barIndex } from '../chart/panes.js';
import { groupBigPrints } from '@shared/bigprints.js';
import { compact, qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

const GROW = {
  sqrt: (k) => Math.sqrt(k),
  linear: (k) => k,
  log: (k) => Math.log2(1 + k) * 1.4,
};

// Bulles : une par créneau, centrée sur son milieu et sur son VWAP. Le rayon suit le volume
// rapporté à la moyenne des créneaux visibles (taille stable d'une vue à l'autre), selon l'échelle
// choisie. Couleur : camembert achats / ventes, delta (teinte du camp dominant, opacité selon le
// déséquilibre) ou volume seul. Les plus grosses d'abord, pour que les petites restent visibles.
export function drawBubbles(ctx, scale, items, rows, slot, { filter = 1, size = 1, color = 'split', scale: mode = 'sqrt' } = {}) {
  const vis = [];
  let sum = 0;
  for (const [t0, p, buy, sell] of rows) {
    const x = scale.xAt(t0 + slot / 2, items);
    if (!(x >= -30 && x <= scale.w + 30)) continue;
    const y = scale.yOfPrice(p);
    if (y < -30 || y > scale.h + 30) continue;
    vis.push([x, y, buy, sell]);
    sum += buy + sell;
  }
  if (!vis.length) return;
  const avg = sum / vis.length;
  const grow = GROW[mode] ?? GROW.sqrt;
  const shown = vis.filter((v) => v[2] + v[3] >= filter * avg).sort((a, b) => b[2] + b[3] - (a[2] + a[3]));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [x, y, buy, sell] of shown) {
    const total = buy + sell;
    const r = Math.min(30, 2 + 6 * size * grow(total / avg));
    const dominant = buy >= sell ? C.growth : C.loss;
    if (color === 'split') {
      const start = -Math.PI / 2;
      const cut = start + 2 * Math.PI * (buy / total);
      for (const [a0, a1, c] of [[start, cut, C.growth], [cut, start + 2 * Math.PI, C.loss]]) {
        if (a1 - a0 < 1e-3) continue;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, a0, a1);
        ctx.closePath();
        ctx.fillStyle = alpha(c, 0.5);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color === 'delta' ? alpha(dominant, 0.15 + 0.6 * (Math.abs(buy - sell) / total)) : alpha(C.mist, 0.3);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color === 'volume' ? alpha(C.mist, 0.7) : alpha(dominant, 0.9);
    ctx.stroke();
    if (r < 15) continue;
    ctx.font = font(10, 600);
    ctx.fillStyle = C.white;
    ctx.fillText(qty(total), x, y + 0.5);
  }
  ctx.textAlign = 'left';
}

// Gros prints : ordres agresseurs (fills regroupés) au-delà du seuil, au prix moyen de l'ordre. Cercles
// pleins lumineux (vert = achat, rouge = vente), sans texte par défaut : c'est la taille qui parle, comme
// dans DeepCharts et les autres plateformes. Les bulles de volume (calque « Bulles de trades ») sont des
// camemberts translucides : pour une lecture nette, n'affichez que l'un des deux.
// Regroupement « par niveau » (par défaut) : les gros ordres du même côté, à la même ligne de prix de la
// même bougie sont additionnés ; « par ordre » les montre un à un. Seuls les `limit` plus gros de la vue
// sont dessinés.
// Étiquettes (quantité, « ×n » si plusieurs ordres) : les 3 plus gros, ou toutes, ou aucune ; elles ne se
// chevauchent jamais.
export function drawBigPrints(ctx, scale, items, all, { limit = 15, labels = 'big', group = 'level', row = 0 } = {}) {
  const seen = all.filter((b) => {
    const x = scale.xAt(b[0], items);
    return x >= -40 && x <= scale.w + 40;
  });
  const big = groupBigPrints(seen, items, group === 'level' ? row : 0)
    .map((g) => [scale.xAt(g[0], items), g])
    .sort((a, b) => b[1][2] - a[1][2])
    .slice(0, limit);
  let max = 0;
  for (const [, b] of big) max = Math.max(max, b[2]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Du plus gros au plus petit : l'ordre des étiquettes ; dessin dans l'ordre inverse, le plus gros au-dessus.
  const shapes = big.map(([x, g]) => ({ x, y: scale.yOfPrice(g[1]), r: 3 + 11 * Math.sqrt(g[2] / max), q: g[2], n: g[4], side: g[3], g }));
  for (const s of [...shapes].reverse()) {
    const color = s.side > 0 ? C.growth : C.loss;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = alpha(color, 0.55);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = alpha(color, 0.95);
    ctx.stroke();
  }
  if (labels !== 'none') {
    ctx.font = font(10, 600);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = alpha(C.ink, 0.9);
    ctx.fillStyle = C.white;
    const placed = [];
    for (const s of labels === 'all' ? shapes : shapes.slice(0, 3)) {
      const text = s.n > 1 ? `${qty(s.q)} ×${s.n}` : qty(s.q);
      const w = ctx.measureText(text).width + 2;
      const inside = w <= 2 * s.r; // le texte tient dans le cercle ; sinon au-dessus
      const y = inside ? s.y + 0.5 : s.y - s.r - 7;
      const box = [s.x - w / 2, y - 6, s.x + w / 2, y + 6];
      if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      placed.push(box);
      ctx.strokeText(text, s.x, y);
      ctx.fillText(text, s.x, y);
    }
  }
  ctx.textAlign = 'left';
}

// Regroupe les liquidations par bougie et par côté, au prix moyen pondéré par le montant
// (les cascades d'une même bougie deviennent un seul losange).
function groupByBar(items, geo, rows) {
  const out = new Map();
  for (const [t, p, q, side] of rows) {
    const i = barIndex(items, t);
    if (i < 0) continue;
    const key = i * 2 + (side < 0 ? 0 : 1);
    const g = out.get(key) ?? { x: geo.x(items[i], i), pn: 0, n: 0, side };
    g.pn += p * p * q;
    g.n += p * q;
    out.set(key, g);
  }
  return [...out.values()].map((g) => [g.x, g.pn / g.n, g.n, g.side]);
}

// Liquidations : losanges dont l'aire suit le montant, au prix moyen d'exécution (Binance `ap`) ;
// rouge = position longue liquidée (vente forcée), vert = position courte liquidée (achat forcé).
export function drawLiquidations(ctx, scale, items, geo, rows, { min = 0, group = 'bar' } = {}) {
  const raw = group === 'bar' ? groupByBar(items, geo, rows) : rows.map(([t, p, q, side]) => [scale.xAt(t, items), p, p * q, side]);
  const vis = raw.filter(([x, , n]) => n >= min && x >= -20 && x <= scale.w + 20);
  let max = 0;
  for (const v of vis) max = Math.max(max, v[2]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (const [x, p, n, side] of vis) {
    const y = scale.yOfPrice(p);
    const r = 4 + 14 * Math.sqrt(n / max);
    const color = side < 0 ? C.loss : C.growth;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fillStyle = alpha(color, 0.35);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    if (r < 10) continue;
    ctx.font = font(10, 600);
    ctx.fillStyle = C.white;
    ctx.fillText(`${compact(n)} $`, x, y - r - 2);
  }
  ctx.textAlign = 'left';
}
