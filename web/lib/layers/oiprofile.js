// Open interest par prix (voir shared/oiflow.js) : profil à droite du tracé, sur la plage visible.
// Pour chaque niveau, en vert les positions ouvertes (OI en hausse), en rouge les positions
// fermées (OI en baisse) : où les traders à levier sont entrés, et où ils sont sortis.
import { oiByPrice } from '@shared/oiflow.js';
import { niceStep } from '../chart/axes.js';
import { C, alpha, font } from '../theme.js';

export function drawOiProfile(ctx, scale, items, oi, bars, { width = 0.15 } = {}) {
  if (oi.length < 2 || !bars.length) return;
  const row = niceStep((scale.pTop - scale.pBottom) / 60);
  const rows = oiByPrice(oi, bars, row, scale.tLeft, scale.tRight);
  const max = Math.max(0, ...rows.map(([, a, b]) => Math.max(a, b)));
  if (!(max > 0)) return;
  const W = scale.w * width;
  const right = scale.w - 2;
  for (const [r, opened, closed] of rows) {
    const yTop = scale.yOfPrice((r + 1) * row);
    const yBot = scale.yOfPrice(r * row);
    if (yBot < 0 || yTop > scale.h) continue;
    const h = Math.max(1, (yBot - yTop - 1) / 2);
    ctx.fillStyle = alpha(C.growth, 0.55);
    ctx.fillRect(right - (opened / max) * W, yTop, (opened / max) * W, h);
    ctx.fillStyle = alpha(C.loss, 0.55);
    ctx.fillRect(right - (closed / max) * W, yTop + h, (closed / max) * W, h);
  }
  ctx.font = font(10, 600);
  ctx.fillStyle = C.graphite;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('OI par prix', right, 4);
  ctx.textAlign = 'left';
}
