// Panneau « CVD spot / perp » : CVD de session du perpétuel (orange) et du spot du même actif
// (bleu), chacun sur sa propre échelle pour comparer les formes. Une hausse portée par le seul perp
// (spot à plat) est jugée fragile ; une hausse portée par le spot (achat réel) plus saine.
import { qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';
import { sessionCvd, sessionStart } from '@shared/cvd.js';

const BLUE = '#479ffa';

// CVD spot de session aligné sur les bougies (null quand la bougie n'a pas de donnée spot).
export function spotCvd(items, upto, spot) {
  const out = new Array(Math.max(0, upto + 1)).fill(null);
  let cum = 0;
  for (let i = 0; i <= upto; i++) {
    if (sessionStart(items, i)) cum = 0;
    const row = spot.rows.get(items[i].t0);
    if (!row) continue;
    cum += row[0] - row[1];
    out[i] = cum;
  }
  return out;
}

function line(ctx, pts, color, top, h, pad) {
  const vals = pts.filter(Boolean).map((p) => p[1]);
  if (!vals.length) return null;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (hi - lo < 1e-9) hi = lo + 1;
  const yOf = (v) => top + pad + (1 - (v - lo) / (hi - lo)) * (h - 2 * pad);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let pen = false;
  for (const p of pts) {
    if (!p) {
      pen = false;
      continue;
    }
    if (pen) ctx.lineTo(p[0], yOf(p[1]));
    else ctx.moveTo(p[0], yOf(p[1]));
    pen = true;
  }
  ctx.stroke();
  return [lo, hi];
}

export function drawSpotPane(ctx, items, geo, { top, h, w, axisW }, spot) {
  const [i0, i1] = geo.range;
  const pad = 6;
  if (!spot || spot.error || !spot.rows.size) {
    ctx.font = font(11);
    ctx.fillStyle = C.smoke;
    ctx.textBaseline = 'middle';
    ctx.fillText(spot?.error ?? 'CVD spot : chargement des klines spot…', 8, top + h / 2);
    return;
  }
  const perp = sessionCvd(items, i1);
  const sp = spotCvd(items, i1, spot);
  const ptsPerp = [];
  const ptsSpot = [];
  for (let i = Math.max(0, i0); i <= i1; i++) {
    const x = geo.x(items[i], i);
    if (sessionStart(items, i)) ptsPerp.push(null), ptsSpot.push(null);
    ptsPerp.push([x, perp[i]]);
    ptsSpot.push(sp[i] === null ? null : [x, sp[i]]);
  }
  const rp = line(ctx, ptsPerp, alpha(C.ember, 0.9), top, h, pad);
  const rs = line(ctx, ptsSpot, BLUE, top, h, pad);
  ctx.fillStyle = alpha(C.ink, 0.9);
  ctx.fillRect(w, top + 1, axisW, h - 1);
  ctx.font = font(10);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (rs) {
    ctx.fillStyle = BLUE;
    ctx.fillText(`spot ${qty(rs[1])}`, w + 8, top + pad + 4);
  }
  if (rp) {
    ctx.fillStyle = C.ember;
    ctx.fillText(`perp ${qty(rp[1])}`, w + 8, top + h - pad - 4);
  }
}

export function spotValues(items, i, spot) {
  const perp = sessionCvd(items, i)[i];
  const sp = spot?.rows?.size ? spotCvd(items, i, spot)[i] : null;
  const tone = (v) => (v >= 0 ? 'pos' : 'neg');
  return [['Spot', sp === null ? '—' : qty(sp), sp === null ? '' : tone(sp)], ['Perp', qty(perp), tone(perp)]];
}
