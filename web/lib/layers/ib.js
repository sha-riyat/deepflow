// Initial balance (première heure de la session UTC) et ses extensions, de 00:00 au bord droit :
// IB en trait plein, extensions en tirets avec leur multiple. Lecture d'auction market : un marché
// qui s'étend franchement au-delà de l'IB montre des acheteurs (ou vendeurs) de plus long terme.
import { ibExtensions, ibLevels } from '@shared/opening.js';
import { fmt } from '../fmt.js';
import { C, alpha, pill } from '../theme.js';
import { prevAndToday } from './levels.js';

export const IB_STEPS = { 0: [], 1: [0.5, 1], 2: [0.5, 1, 2] };

export function drawIb(ctx, daily, scale, items, now, { ext = 1 } = {}) {
  const { today } = prevAndToday(daily, now);
  const ib = ibLevels(today, now);
  if (!ib) return;
  const x0 = Math.max(0, scale.xAt(today.t0, items));
  const xl = Math.max(0, scale.xAt(ib.end, items)); // étiquettes après la fin de l'IB
  if (!(x0 < scale.w)) return;
  const line = (price, color, dash, label) => {
    const y = Math.round(scale.yOfPrice(price)) + 0.5;
    if (y < 0 || y > scale.h) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(scale.w, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (xl + 6 < scale.w) pill(ctx, xl + 6, y, `${label} ${fmt(price)}`, { bg: C.obsidian, fg: color, size: 10 });
  };
  const ember = alpha(C.ember, 0.8);
  line(ib.hi, ember, [], ib.done ? 'IB haut' : 'IB haut (en cours)');
  line(ib.lo, ember, [], ib.done ? 'IB bas' : 'IB bas (en cours)');
  if (!ib.done) return;
  for (const e of ibExtensions(ib, IB_STEPS[ext] ?? IB_STEPS[1])) {
    line(e.price, alpha(C.ember, 0.45), [5, 4], `IB ×${String(1 + e.k).replace('.', ',')}`);
  }
}
