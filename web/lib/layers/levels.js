// Niveaux de la stratégie du cours : value area de la veille prolongée sur la journée (VAH, VAL,
// POC d'hier) et extrême de la sortie en cours.
import { auctionState } from '@shared/auction.js';
import { fmt } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

const DAY = 86_400_000;

function hline(ctx, x0, x1, y, color, dash = [], width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Veille (avant-dernière session) et jour (dernière session, si elle est celle d'aujourd'hui).
export function prevAndToday(daily, now = Date.now()) {
  const today = daily[daily.length - 1];
  if (!today || today.t0 !== Math.floor(now / DAY) * DAY) return { prev: daily[daily.length - 1] ?? null, today: null };
  return { prev: daily[daily.length - 2] ?? null, today };
}

// Value area d'hier tracée de 00:00 UTC aujourd'hui jusqu'au bord droit, avec l'extrême de la
// sortie (stop du Setup 1 : au-delà de cet extrême) quand une sortie a eu lieu.
export function drawPrevLevels(ctx, daily, scale, items) {
  const { prev, today } = prevAndToday(daily);
  if (!prev || prev.vah === null) return null;
  const st = today ? auctionState(prev, today) : null;
  const vah = (prev.vah + 1) * prev.bucket;
  const val = prev.val * prev.bucket;
  const poc = (prev.poc + 0.5) * prev.bucket;
  const x0 = Math.max(0, scale.xAt(prev.t1, items));
  if (!(x0 < scale.w)) return st;
  const y = (p) => scale.yOfPrice(p);
  ctx.fillStyle = alpha('#479ffa', 0.05);
  ctx.fillRect(x0, y(vah), scale.w - x0, y(val) - y(vah));
  hline(ctx, x0, scale.w, y(vah), alpha('#479ffa', 0.85), [6, 3], 1.25);
  hline(ctx, x0, scale.w, y(val), alpha('#479ffa', 0.85), [6, 3], 1.25);
  hline(ctx, x0, scale.w, y(poc), alpha(C.ember, 0.85), [], 1.25);
  for (const [label, price, color] of [['VAH J-1', vah, '#7fbcff'], ['POC J-1', poc, C.ember], ['VAL J-1', val, '#7fbcff']]) {
    pill(ctx, x0 + 6, y(price), `${label} ${fmt(price)}`, { bg: C.obsidian, fg: color, size: 10 });
  }
  if (st && st.extreme !== null && st.state !== 'inside') {
    hline(ctx, x0, scale.w, y(st.extreme), alpha(C.mist, 0.5), [2, 4]);
    ctx.font = font(10);
    ctx.fillStyle = C.graphite;
    ctx.textBaseline = st.side > 0 ? 'bottom' : 'top';
    ctx.fillText(`extrême de la sortie ${fmt(st.extreme)}`, x0 + 6, y(st.extreme) + (st.side > 0 ? -2 : 2));
  }
  return st;
}
