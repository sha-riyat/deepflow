// Divergences prix / CVD de session (voir cvdDivergences) : segment entre les deux sommets
// (baissière, rouge, au-dessus) ou les deux creux (haussière, verte, en dessous).
import { cvdDivergences, sessionCvd } from '@shared/cvd.js';
import { C, alpha, font } from '../theme.js';

export function drawDivergences(ctx, items, geo, scale) {
  if (items.length < 12) return [];
  const divs = cvdDivergences(items, sessionCvd(items));
  const [i0, i1] = geo.range;
  ctx.font = font(10, 600);
  ctx.textAlign = 'center';
  for (const d of divs) {
    if (d.to < i0 || d.from > i1) continue;
    const bear = d.type === 'bear';
    const color = bear ? C.loss : C.growth;
    const yOf = (i) => scale.yOfPrice(bear ? items[i].h : items[i].l) + (bear ? -8 : 8);
    const [xa, xb] = [geo.x(items[d.from], d.from), geo.x(items[d.to], d.to)];
    ctx.strokeStyle = alpha(color, 0.85);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xa, yOf(d.from));
    ctx.lineTo(xb, yOf(d.to));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.textBaseline = bear ? 'bottom' : 'top';
    ctx.fillText('div', xb, yOf(d.to) + (bear ? -3 : 3));
  }
  ctx.textAlign = 'left';
  return divs;
}
