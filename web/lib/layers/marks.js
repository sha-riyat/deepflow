// Marques posées sur le graphique : bulles de trades, gros prints, best bid/ask récents,
// signaux (chevron + niveaux du trade ouvert) et lignes d'alertes de prix.
import { fmt, qty } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

// Bulles à la Bookmap : une par créneau, centrée sur son milieu et sur son VWAP. L'aire suit le
// volume rapporté à la moyenne des créneaux visibles (taille stable d'une vue à l'autre) ; le
// camembert donne la part acheteuse (vert) et vendeuse (rouge). Les plus grosses sont dessinées
// d'abord pour que les petites restent visibles par-dessus.
export function drawBubbles(ctx, scale, items, rows, slot, { filter = 1, size = 1 } = {}) {
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
  const shown = vis.filter((v) => v[2] + v[3] >= filter * avg).sort((a, b) => b[2] + b[3] - (a[2] + a[3]));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [x, y, buy, sell] of shown) {
    const total = buy + sell;
    const r = Math.min(30, 2 + 6 * size * Math.sqrt(total / avg));
    const start = -Math.PI / 2;
    const cut = start + 2 * Math.PI * (buy / total);
    for (const [a0, a1, color] of [[start, cut, C.growth], [cut, start + 2 * Math.PI, C.loss]]) {
      if (a1 - a0 < 1e-3) continue;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = alpha(color, 0.5);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = alpha(buy >= sell ? C.growth : C.loss, 0.9);
    ctx.stroke();
    if (r < 15) continue;
    ctx.font = font(10, 600);
    ctx.fillStyle = C.white;
    ctx.fillText(qty(total), x, y + 0.5);
  }
  ctx.textAlign = 'left';
}

export function drawBigPrints(ctx, scale, items, all, limit = 25) {
  // Seuls les plus gros de la vue sont dessinés, pour ne pas masquer les bougies.
  const big = all
    .map((b) => [scale.xAt(b[0], items), b])
    .filter(([x]) => x >= -40 && x <= scale.w + 40)
    .sort((a, b) => b[1][2] - a[1][2])
    .slice(0, limit)
    .map(([, b]) => b);
  let max = 0;
  for (const b of big) max = Math.max(max, b[2]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [t, p, q, side] of big) {
    const x = scale.xAt(t, items);
    if (x < -40 || x > scale.w + 40) continue;
    const yy = scale.yOfPrice(p);
    const color = side > 0 ? C.growth : C.loss;
    const r = 5 + 22 * Math.sqrt(q / max);
    ctx.beginPath();
    ctx.arc(x, yy, r, 0, Math.PI * 2);
    ctx.fillStyle = alpha(C.ink, 0.55);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (r < 12) continue; // étiquette seulement sur les plus gros
    ctx.font = font(10, 600);
    ctx.fillStyle = C.white;
    ctx.fillText(qty(q), x, yy + 0.5);
  }
  ctx.textAlign = 'left';
}

// Meilleurs prix récents, en escalier (utile en zoom serré).
export function drawQuotes(ctx, scale, items, ticks) {
  if (ticks.length < 2) return;
  for (const [key, color] of [['bid', C.growth], ['ask', C.loss]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    let prevY = null;
    for (const tk of ticks) {
      const x = scale.xAt(tk.t, items);
      const yy = scale.yOfPrice(tk[key]);
      if (prevY === null) ctx.moveTo(x, yy);
      else {
        ctx.lineTo(x, prevY);
        ctx.lineTo(x, yy);
      }
      prevY = yy;
    }
    ctx.stroke();
  }
}

export function drawSignals(ctx, scale, items, signals) {
  for (const s of signals) {
    const x = scale.xAt(s.t, items);
    const onScreen = x >= 0 && x <= scale.w;
    if (!onScreen && s.status !== 'open') continue;
    const up = s.dir > 0;
    if (onScreen) {
      const yy = scale.yOfPrice(s.entry);
      ctx.fillStyle = up ? C.growth : C.loss;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x - 7, yy + (up ? 12 : -12));
      ctx.lineTo(x + 7, yy + (up ? 12 : -12));
      ctx.closePath();
      ctx.fill();
    }
    if (s.status !== 'open') continue;
    const x0 = onScreen ? x : 0;
    const levels = [
      ['Entrée', s.entry, C.pale, []],
      ['Stop', s.stopCurrent ?? s.stop, C.loss, [4, 4]],
      ...s.targets.map((t, i) => [`Cible ${i + 1}${t.hit ? ' ✓' : ''}`, t.price, C.growth, [4, 4]]),
    ];
    for (const [label, price, color, dash] of levels) {
      const yy = scale.yOfPrice(price);
      ctx.strokeStyle = alpha(color, 0.8);
      ctx.lineWidth = 1;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(scale.w, yy);
      ctx.stroke();
      ctx.setLineDash([]);
      pill(ctx, scale.w - 8, yy, `${label} ${fmt(price)}`, { bg: C.obsidian, fg: color, size: 10, align: 'right' });
    }
  }
}

export function drawAlertLines(ctx, scale, alerts) {
  for (const a of alerts) {
    const yy = scale.yOfPrice(a.params.price);
    if (yy < 0 || yy > scale.h) continue;
    ctx.strokeStyle = alpha(C.ember, 0.7);
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(scale.w, yy);
    ctx.stroke();
    ctx.setLineDash([]);
    pill(ctx, 8, yy, `Alerte ${fmt(a.params.price)}`, { bg: C.obsidian, fg: C.ember, size: 10 });
  }
}

// Liquidations : losanges dont l'aire suit le montant ; rouge = position longue liquidée
// (vente forcée), vert = position courte liquidée (achat forcé).
export function drawLiquidations(ctx, scale, items, rows, { min = 0 } = {}) {
  const vis = [];
  let max = 0;
  for (const [t, p, q, side] of rows) {
    if (p * q < min) continue;
    const x = scale.xAt(t, items);
    if (x < -20 || x > scale.w + 20) continue;
    vis.push([x, p, p * q, side]);
    max = Math.max(max, p * q);
  }
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
    ctx.fillText(n >= 1e6 ? `${fmt(n / 1e6, 1)} M` : `${fmt(n / 1e3, 0)} k`, x, y - r - 2);
  }
  ctx.textAlign = 'left';
}
