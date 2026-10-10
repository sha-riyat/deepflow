// Marques posées sur le graphique : best bid/ask récents et lignes d'alertes de prix. Bulles, gros
// prints et liquidations : voir flow.js.
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
