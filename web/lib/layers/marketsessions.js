// Sessions Asie, Londres et New York (voir shared/sessions.js) : zone du plus haut au plus bas de
// chaque session et son nom. En option, plus haut et plus bas prolongés jusqu'à la fin du jour UTC :
// la session suivante va souvent chercher la liquidité placée au-delà (stops, ordres en attente).
import { MARKET_SESSIONS, marketSessions, sessionRanges } from '@shared/sessions.js';
import { C, alpha, font } from '../theme.js';

const DAY = 86_400_000;
export const SESSION_STYLE = { asia: ['Asie', '#e8c35a'], london: ['Londres', '#479ffa'], ny: ['New York', C.ember] };
export const MAX_SESSION_TF = 3_600_000; // au-delà d'1 h, une bougie déborde de la session

// Sessions de la plage [from, to] avec leur range, d'après les bougies chargées.
export function rangesOf(bars, from, to, show, now) {
  const kinds = show === 'all' ? MARKET_SESSIONS : [show];
  return sessionRanges(bars, marketSessions(from - DAY, to, kinds), now);
}

export function drawMarketSessions(ctx, scale, items, bars, now, { show = 'all', extend = 1 } = {}) {
  if (!items.length) return;
  const y = (p) => scale.yOfPrice(p);
  ctx.font = font(10, 600);
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  for (const s of rangesOf(bars, scale.tLeft, scale.tRight, show, now)) {
    const [name, color] = SESSION_STYLE[s.kind];
    const x0 = scale.xAt(s.t0, items);
    const x1 = scale.xAt(Math.min(s.t1, now), items);
    if (x1 < 0 || x0 > scale.w) continue;
    const top = y(s.hi);
    const bottom = y(s.lo);
    ctx.fillStyle = alpha(color, 0.06);
    ctx.fillRect(x0, top, x1 - x0, bottom - top);
    ctx.strokeStyle = alpha(color, 0.45);
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x0) + 0.5, Math.round(top) + 0.5, Math.round(x1 - x0), Math.round(bottom - top));
    ctx.fillStyle = alpha(color, 0.9);
    ctx.fillText(name, Math.max(x0, 0) + 4, top - 2);
    if (!extend) continue;
    const xe = scale.xAt(Math.min(Math.floor(s.t0 / DAY) * DAY + DAY, now), items);
    if (!(xe > x1)) continue;
    ctx.strokeStyle = alpha(color, 0.5);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (const py of [top, bottom]) {
      ctx.moveTo(x1, Math.round(py) + 0.5);
      ctx.lineTo(xe, Math.round(py) + 0.5);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
