// VWAP par période (jour, semaine ou mois UTC) avec bandes d'écart-type (profils de volume :
// volprofile.js ; TPO : tpo.js).
import { periodStart } from '@shared/sessions.js';
import { C, alpha } from '../theme.js';

// VWAP cumulé depuis le début de chaque période, avec bandes à 1, 2 et 3 écarts-types. `anchor`
// porte les sommes de la période antérieures à la première bougie chargée (sinon le VWAP partirait
// de cette bougie).
export function vwapStart(anchor, b, period = 'day') {
  return anchor && anchor.first === b.t0 && anchor.period === period && anchor.start === periodStart(b.t0, period) ? [anchor.pv, anchor.p2v, anchor.v] : [0, 0, 0];
}

export function drawVwap(ctx, items, geo, scale, { bands = 2, period = 'day' } = {}, anchor = null) {
  const [i0, i1] = geo.range;
  if (i1 < i0) return;
  let start = null;
  let pv = 0;
  let p2v = 0;
  let v = 0;
  const lines = [[], [], [], [], [], [], []]; // vwap, ±1σ, ±2σ, ±3σ
  const breakAll = () => lines.forEach((l) => l.push(null));
  for (let i = 0; i <= i1; i++) {
    const b = items[i];
    const d = periodStart(b.t0, period);
    if (d !== start) {
      start = d;
      [pv, p2v, v] = vwapStart(anchor, b, period);
      if (i >= i0) breakAll();
    }
    pv += b.pv;
    p2v += b.p2v;
    v += b.v;
    if (i < i0 || v <= 0) continue;
    const vw = pv / v;
    const sd = Math.sqrt(Math.max(0, p2v / v - vw * vw));
    const x = geo.x(b, i);
    [vw, vw + sd, vw - sd, vw + 2 * sd, vw - 2 * sd, vw + 3 * sd, vw - 3 * sd].forEach((p, k) => lines[k].push([x, scale.yOfPrice(p)]));
  }
  const band = (a, dash) => [alpha(C.mist, a), 1, dash];
  const styles = [[C.pale, 1.5, []], band(0.4, [4, 4]), band(0.4, [4, 4]), band(0.22, [2, 5]), band(0.22, [2, 5]), band(0.16, [1, 6]), band(0.16, [1, 6])];
  lines.forEach((pts, k) => {
    if (k > bands * 2) return; // 0 : VWAP seul, 1 : ±1σ, 2 : jusqu'à ±2σ, 3 : jusqu'à ±3σ
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
