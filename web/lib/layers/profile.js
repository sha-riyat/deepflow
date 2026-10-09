// Profils de session (volume par prix, POC, value area), POC non testés et VWAP avec bandes
// d'écart-type. Le TPO (Market Profile) a sa propre vue : voir tpo.js.
import { fmt } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

const DAY = 86_400_000;

function hline(ctx, x0, x1, y, color, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawVolumeProfiles(ctx, sessions, scale, items, { naked = true, width: share = 0.3, va = 1 } = {}) {
  const y = (p) => scale.yOfPrice(p);
  for (const [si, s] of sessions.entries()) {
    const x0 = scale.xAt(s.t0, items);
    const x1 = scale.xAt(Math.min(s.t1, items.length ? items[items.length - 1].t1 : s.t1), items);
    if (!(x1 > 0) || x0 > scale.w) continue;
    const width = Math.min(scale.w * share, Math.max(40, (x1 - x0) * share));
    let max = 0;
    for (const [, bv, sv] of s.rows) max = Math.max(max, bv + sv);
    for (const [row, bv, sv] of s.rows) {
      const yt = y((row + 1) * s.bucket);
      const h = Math.max(1, y(row * s.bucket) - yt);
      const inVa = va && row >= s.val && row <= s.vah;
      ctx.fillStyle = row === s.poc ? alpha(C.ember, 0.75) : alpha(inVa ? C.mist : C.graphite, inVa ? 0.32 : 0.18);
      ctx.fillRect(Math.max(0, x0), yt + 0.5, (width * (bv + sv)) / max, Math.max(1, h - 1));
    }
    const pocP = (s.poc + 0.5) * s.bucket;
    hline(ctx, x0, x1, y(pocP), alpha(C.ember, 0.8));
    if (va) {
      hline(ctx, x0, x1, y((s.vah + 1) * s.bucket), alpha(C.mist, 0.45), [4, 4]);
      hline(ctx, x0, x1, y(s.val * s.bucket), alpha(C.mist, 0.45), [4, 4]);
    }
    ctx.fillStyle = alpha(C.white, 0.08);
    ctx.fillRect(x0, 0, 1, scale.h); // séparation de session

    // POC non testé : prolongé tant qu'aucune bougie postérieure ne l'a traversé.
    if (!naked || si === sessions.length - 1) continue;
    let end = null;
    for (const b of items) {
      if (b.t0 < s.t1) continue;
      if (b.l <= pocP && b.h >= pocP) {
        end = b;
        break;
      }
    }
    if (end) continue;
    hline(ctx, x1, scale.w, y(pocP), alpha(C.ember, 0.6), [6, 4]);
    pill(ctx, scale.w - 6, y(pocP), `nPOC ${fmt(pocP)}`, { bg: C.obsidian, fg: C.ember, size: 10, align: 'right' });
  }
}

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
