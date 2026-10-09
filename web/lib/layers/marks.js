// Marques posées sur le graphique : best bid/ask récents, signaux (chevron + niveaux du trade
// ouvert) et lignes d'alertes de prix. Bulles, gros prints et liquidations : voir flow.js.
import { fmt } from '../fmt.js';
import { C, alpha, pill } from '../theme.js';

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
