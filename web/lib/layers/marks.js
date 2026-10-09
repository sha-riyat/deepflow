// Marques posées sur le graphique : bulles de trades, gros prints, best bid/ask récents,
// signaux (chevron + niveaux du trade ouvert) et lignes d'alertes de prix.
import { fmt, qty } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

export function drawBubbles(ctx, scale, items, rows, slot) {
  let max = 0;
  const vis = [];
  for (const r of rows) {
    const x = scale.xAt(r[0] + slot / 2, items);
    if (x < -30 || x > scale.w + 30) continue;
    vis.push([x, r]);
    max = Math.max(max, r[2]);
  }
  for (const [x, [, p, q, side]] of vis) {
    ctx.beginPath();
    ctx.arc(x, scale.yOfPrice(p), 1.5 + 20 * Math.sqrt(q / max), 0, Math.PI * 2);
    ctx.fillStyle = alpha(side > 0 ? C.growth : C.loss, 0.32);
    ctx.fill();
  }
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
