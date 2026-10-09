// Profils de session (volume par prix, POC, value area), POC non testés, VWAP avec bandes
// d'écart-type, et TPO (Market Profile) en lettres par période de 30 min.
import { TPO_LETTERS } from '@shared/profile.js';
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

export function drawVolumeProfiles(ctx, sessions, scale, items, { naked = true } = {}) {
  const y = (p) => scale.yOfPrice(p);
  for (const [si, s] of sessions.entries()) {
    const x0 = scale.xAt(s.t0, items);
    const x1 = scale.xAt(Math.min(s.t1, items.length ? items[items.length - 1].t1 : s.t1), items);
    if (!(x1 > 0) || x0 > scale.w) continue;
    const width = Math.min(220, Math.max(40, (x1 - x0) * 0.3));
    let max = 0;
    for (const [, bv, sv] of s.rows) max = Math.max(max, bv + sv);
    for (const [row, bv, sv] of s.rows) {
      const yt = y((row + 1) * s.bucket);
      const h = Math.max(1, y(row * s.bucket) - yt);
      const inVa = row >= s.val && row <= s.vah;
      ctx.fillStyle = row === s.poc ? alpha(C.ember, 0.75) : alpha(inVa ? C.mist : C.graphite, inVa ? 0.32 : 0.18);
      ctx.fillRect(Math.max(0, x0), yt + 0.5, (width * (bv + sv)) / max, Math.max(1, h - 1));
    }
    const pocP = (s.poc + 0.5) * s.bucket;
    hline(ctx, x0, x1, y(pocP), alpha(C.ember, 0.8));
    hline(ctx, x0, x1, y((s.vah + 1) * s.bucket), alpha(C.mist, 0.45), [4, 4]);
    hline(ctx, x0, x1, y(s.val * s.bucket), alpha(C.mist, 0.45), [4, 4]);
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

export function drawVwap(ctx, items, geo, scale, anchor = null) {
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

// TPO : pour chaque prix, une lettre par période de 30 min qui l'a touché, alignées à gauche.
export function drawTpo(ctx, sessions, scale, items) {
  const y = (p) => scale.yOfPrice(p);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (const s of sessions) {
    const x0 = scale.xAt(s.t0, items);
    const x1 = scale.xAt(s.t1, items);
    if (!(x1 > 0) || x0 > scale.w) continue;
    const count = new Map();
    let maxN = 1;
    for (const [, lo, hi] of s.periods) {
      for (let r = lo; r <= hi; r++) {
        const n = (count.get(r) ?? 0) + 1;
        count.set(r, n);
        maxN = Math.max(maxN, n);
      }
    }
    const cw = Math.max(2, Math.min(11, (x1 - x0 - 8) / maxN));
    const rowH = Math.abs(y(0) - y(s.bucket));
    const letters = cw >= 7 && rowH >= 8;
    const placed = new Map();
    for (const [k, lo, hi] of s.periods) {
      for (let r = lo; r <= hi; r++) {
        const n = placed.get(r) ?? 0;
        placed.set(r, n + 1);
        const xc = x0 + 4 + (n + 0.5) * cw;
        const yc = y((r + 0.5) * s.bucket);
        const inVa = r >= s.val && r <= s.vah;
        const color = k < 2 ? C.ember : inVa ? C.pale : C.graphite;
        if (letters) {
          ctx.font = font(Math.min(11, rowH - 1), 500);
          ctx.fillStyle = color;
          ctx.fillText(TPO_LETTERS[k % TPO_LETTERS.length], xc, yc);
        } else {
          ctx.fillStyle = alpha(color, 0.7);
          ctx.fillRect(xc - cw / 2, yc - rowH / 2 + 0.5, Math.max(1, cw - 1), Math.max(1, rowH - 1));
        }
      }
    }
    hline(ctx, x0, x1, y((s.poc + 0.5) * s.bucket), alpha(C.ember, 0.8));
    if (s.ibLo !== null) {
      ctx.fillStyle = C.ember;
      ctx.fillRect(x0 + 1, y((s.ibHi + 1) * s.bucket), 2, y(s.ibLo * s.bucket) - y((s.ibHi + 1) * s.bucket));
    }
    ctx.fillStyle = alpha(C.white, 0.08);
    ctx.fillRect(x0, 0, 1, scale.h);
  }
  ctx.textAlign = 'left';
}
