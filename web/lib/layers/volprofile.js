// Profils de volume, comme les « Session », « Periodic » et « Visible range » de TradingView ou le
// Volume Profile d'ATAS : par jour UTC, par semaine (lundi 00:00 UTC) ou sur la plage visible
// (épinglé au bord droit). Type volume, achats / ventes ou delta ; value area en zone et lignes ;
// POC et value area « en développement » ; POC non testés prolongés jusqu'au retest.
import { valueArea } from '@shared/profile.js';
import { fmt } from '../fmt.js';
import { C, alpha, pill } from '../theme.js';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const MONDAY = 4 * DAY; // 1970-01-01 était un jeudi : premier lundi le 5 janvier

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

// Sessions journalières regroupées par semaine UTC. L'évolution du POC est relevée à la fin de
// chaque jour (le détail intra-journalier n'existe que pour le profil du jour).
export function weeklySessions(sessions) {
  const weeks = new Map();
  for (const s of sessions) {
    const w0 = Math.floor((s.t0 - MONDAY) / WEEK) * WEEK + MONDAY;
    const w = weeks.get(w0) ?? { t0: w0, t1: w0 + WEEK, bucket: s.bucket, rows: new Map(), dev: [], hi: -Infinity, lo: Infinity };
    for (const [row, bv, sv] of s.rows) {
      const cell = w.rows.get(row) ?? [0, 0];
      cell[0] += bv;
      cell[1] += sv;
      w.rows.set(row, cell);
    }
    w.hi = Math.max(w.hi, s.hi);
    w.lo = Math.min(w.lo, s.lo);
    w.dev.push([Math.min(s.t1, Date.now()), ...valueArea(w.rows)]);
    weeks.set(w0, w);
  }
  return [...weeks.values()].map((w) => {
    const [poc, val, vah] = valueArea(w.rows);
    const rows = [...w.rows].sort((a, b) => a[0] - b[0]).map(([row, [bv, sv]]) => [row, bv, sv]);
    return { ...w, rows, poc, val, vah };
  });
}

// Évolution [instant, poc, val, vah] d'une session journalière (fin de chaque sous-période).
function devPoints(s) {
  if (s.dev?.length && s.tpoMs) return s.dev.map(([k, ...v]) => [Math.min(s.t0 + (k + 1) * s.tpoMs, Date.now()), ...v]);
  return s.dev ?? [];
}

// Histogramme d'une session, de x vers la droite (dir = 1) ou vers la gauche (dir = -1).
function histogram(ctx, s, scale, x, width, dir, { kind, va }) {
  const y = (p) => scale.yOfPrice(p);
  let max = 0;
  for (const [, bv, sv] of s.rows) max = Math.max(max, kind === 'delta' ? Math.abs(bv - sv) : bv + sv);
  if (max <= 0) return;
  for (const [row, bv, sv] of s.rows) {
    const yt = y((row + 1) * s.bucket);
    const h = Math.max(1, y(row * s.bucket) - yt);
    if (yt > scale.h || yt + h < 0) continue;
    const inVa = va === 1 && row >= s.val && row <= s.vah;
    const a = inVa ? 0.5 : 0.28;
    const bar = (from, len, color) => {
      const w = (width * len) / max;
      ctx.fillStyle = color;
      ctx.fillRect(dir > 0 ? x + from : x - from - w, yt + 0.5, w, Math.max(1, h - 1));
    };
    if (row === s.poc && kind !== 'delta') bar(0, bv + sv, alpha(C.ember, 0.75));
    else if (kind === 'bidask') {
      bar(0, sv, alpha(C.loss, a));
      bar((width * sv) / max, bv, alpha(C.growth, a));
    } else if (kind === 'delta') bar(0, Math.abs(bv - sv), alpha(bv >= sv ? C.growth : C.loss, a + 0.15));
    else bar(0, bv + sv, alpha(inVa ? C.mist : C.graphite, inVa ? 0.32 : 0.18));
  }
}

function devLines(ctx, s, scale, items, dev) {
  const pts = devPoints(s);
  if (pts.length < 2) return;
  const keys = dev === 2 ? [[1, C.ember, []], [2, C.mist, [3, 3]], [3, C.mist, [3, 3]]] : [[1, C.ember, []]];
  for (const [k, color, dash] of keys) {
    ctx.strokeStyle = alpha(color, 0.85);
    ctx.lineWidth = 1.25;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let prev = null;
    for (const p of pts) {
      if (p[k] === null) continue;
      const price = k === 3 ? (p[k] + 1) * s.bucket : k === 1 ? (p[k] + 0.5) * s.bucket : p[k] * s.bucket;
      const x = scale.xAt(p[0], items);
      const yy = scale.yOfPrice(price);
      if (prev === null) ctx.moveTo(scale.xAt(s.t0, items), yy);
      else ctx.lineTo(x, prev); // en escalier : la valeur tient jusqu'au relevé suivant
      ctx.lineTo(x, yy);
      prev = yy;
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

export function drawVolumeProfiles(ctx, sessions, scale, items, opts = {}) {
  const { naked = true, width: share = 0.3, va = 1, kind = 'volume', range = 'day', dev = 0 } = opts;
  const y = (p) => scale.yOfPrice(p);
  if (range === 'visible') {
    const s = sessions[sessions.length - 1];
    if (!s) return;
    histogram(ctx, s, scale, scale.w, scale.w * share, -1, { kind, va });
    if (va) {
      hline(ctx, 0, scale.w, y((s.vah + 1) * s.bucket), alpha(C.mist, 0.35), [4, 4]);
      hline(ctx, 0, scale.w, y(s.val * s.bucket), alpha(C.mist, 0.35), [4, 4]);
    }
    hline(ctx, 0, scale.w, y((s.poc + 0.5) * s.bucket), alpha(C.ember, 0.6));
    return;
  }
  const list = range === 'week' ? weeklySessions(sessions) : sessions;
  const lastT = items.length ? items[items.length - 1].t1 : Date.now();
  for (const [si, s] of list.entries()) {
    const x0 = scale.xAt(s.t0, items);
    const x1 = scale.xAt(Math.min(s.t1, lastT), items);
    if (!(x1 > 0) || x0 > scale.w) continue;
    const width = Math.min(scale.w * share, Math.max(40, (x1 - x0) * share));
    if (va === 1) {
      ctx.fillStyle = alpha(C.white, 0.025);
      ctx.fillRect(x0, y((s.vah + 1) * s.bucket), x1 - x0, y(s.val * s.bucket) - y((s.vah + 1) * s.bucket));
    }
    histogram(ctx, s, scale, Math.max(0, x0), width, 1, { kind, va });
    const pocP = (s.poc + 0.5) * s.bucket;
    if (dev) devLines(ctx, s, scale, items, dev);
    else {
      hline(ctx, x0, x1, y(pocP), alpha(C.ember, 0.8));
      if (va) {
        hline(ctx, x0, x1, y((s.vah + 1) * s.bucket), alpha(C.mist, 0.45), [4, 4]);
        hline(ctx, x0, x1, y(s.val * s.bucket), alpha(C.mist, 0.45), [4, 4]);
      }
    }
    ctx.fillStyle = alpha(C.white, 0.08);
    ctx.fillRect(x0, 0, 1, scale.h); // séparation de session

    // POC non testé : prolongé tant qu'aucune bougie postérieure ne l'a traversé.
    if (!naked || si === list.length - 1) continue;
    if (items.some((b) => b.t0 >= s.t1 && b.l <= pocP && b.h >= pocP)) continue;
    hline(ctx, x1, scale.w, y(pocP), alpha(C.ember, 0.6), [6, 4]);
    pill(ctx, scale.w - 6, y(pocP), `nPOC ${fmt(pocP)}`, { bg: C.obsidian, fg: C.ember, size: 10, align: 'right' });
  }
}
