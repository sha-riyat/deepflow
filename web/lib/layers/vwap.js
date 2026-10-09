// VWAP journalier avec bandes d'écart-type (profils de volume : volprofile.js ; TPO : tpo.js).
import { C, alpha } from '../theme.js';

const DAY = 86_400_000;

// VWAP cumulé par jour UTC, avec bandes à 1 et 2 écarts-types. `anchor` porte les sommes du jour
// antérieures à la première bougie chargée (sinon le VWAP partirait de cette bougie).
export function vwapStart(anchor, b) {
  return anchor && anchor.first === b.t0 && anchor.day === Math.floor(b.t0 / DAY) * DAY ? [anchor.pv, anchor.p2v, anchor.v] : [0, 0, 0];
}

export function drawVwap(ctx, items, geo, scale, { bands = 2 } = {}, anchor = null) {
  const [i0, i1] = geo.range;
  if (i1 < i0) return;
  let day = null;
  let pv = 0;
  let p2v = 0;
  let v = 0;
  const lines = [[], [], [], [], []]; // vwap, +1σ, -1σ, +2σ, -2σ
  const breakAll = () => lines.forEach((l) => l.push(null));
  for (let i = 0; i <= i1; i++) {
    const b = items[i];
    const d = Math.floor(b.t0 / DAY);
    if (d !== day) {
      day = d;
      [pv, p2v, v] = vwapStart(anchor, b);
      if (i >= i0) breakAll();
    }
    pv += b.pv;
    p2v += b.p2v;
    v += b.v;
    if (i < i0 || v <= 0) continue;
    const vw = pv / v;
    const sd = Math.sqrt(Math.max(0, p2v / v - vw * vw));
    const x = geo.x(b, i);
    [vw, vw + sd, vw - sd, vw + 2 * sd, vw - 2 * sd].forEach((p, k) => lines[k].push([x, scale.yOfPrice(p)]));
  }
  const styles = [[C.pale, 1.5, []], [alpha(C.mist, 0.4), 1, [4, 4]], [alpha(C.mist, 0.4), 1, [4, 4]], [alpha(C.mist, 0.22), 1, [2, 5]], [alpha(C.mist, 0.22), 1, [2, 5]]];
  lines.forEach((pts, k) => {
    if (k > bands * 2) return; // 0 : VWAP seul, 1 : ±1σ, 2 : ±1σ et ±2σ
    const [color, width, dash] = styles[k];
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let pen = false;
    for (const pt of pts) {
      if (!pt) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(pt[0], pt[1]);
      else ctx.moveTo(pt[0], pt[1]);
      pen = true;
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);
}
