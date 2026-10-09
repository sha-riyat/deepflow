// Vue TPO (Market Profile) : une colonne par session UTC, une lettre (ou un bloc) par période de
// 30 min ayant touché le prix. POC et value area au nombre de TPO, initial balance (première heure),
// simples impressions, ouverture / clôture, profil de volume optionnel à droite et POC non testés.
import { tpoProfile, TPO_LETTERS } from '@shared/profile.js';
import { fmt } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

const MULTS = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const DAY = 86_400_000;
const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const pad = (n) => String(n).padStart(2, '0');
const cache = new WeakMap(); // session -> Map(mult -> profil TPO)

function profileOf(s, mult) {
  if (!cache.has(s)) cache.set(s, new Map());
  const byMult = cache.get(s);
  if (!byMult.has(mult)) byMult.set(mult, tpoProfile(s, mult));
  return byMult.get(mult);
}

// Sessions converties en éléments du graphique (une colonne chacune).
export function tpoItems(sessions) {
  return sessions.map((s) => {
    let b = 0;
    let sv = 0;
    for (const [, buy, sell] of s.rows) {
      b += buy;
      sv += sell;
    }
    return { t0: s.t0, t1: s.t1, o: s.open, h: s.hi, l: s.lo, c: s.close, v: s.total, b, s: sv, session: s };
  });
}

// Regroupement de lignes tel qu'une ligne fasse au moins `minPx` pixels.
function rowMult(scale, bucket, minPx) {
  const px = Math.abs(scale.yOfPrice(0) - scale.yOfPrice(bucket));
  return MULTS.find((m) => px * m >= minPx) ?? MULTS[MULTS.length - 1];
}

// Couleur hexadécimale (compatible avec alpha()) d'une teinte HSL, saturation 70 %, luminosité 66 %.
function hue(h) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = 0.66 - 0.7 * Math.min(0.66, 0.34) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Couleur d'une période : du bleu (début de session) à l'orange (fin), comme les palettes par
// période d'ATAS ou de TradingView.
const periodColor = (k, n) => hue(210 - 190 * (n > 1 ? k / (n - 1) : 0));

export function drawTpoView(ctx, items, geo, scale, opts = {}) {
  const { display = 'letters', volume = 1, naked = true, color: colorMode = 'va', singles: extendSingles = 1 } = opts;
  const [i0, i1] = geo.range;
  if (i1 < i0 || !items.length) return;
  const bucket = items[0].session.bucket;
  const letters = display !== 'blocks';
  const split = display === 'split';
  const zones = []; // simples impressions à prolonger
  const mult = rowMult(scale, bucket, letters ? 12 : 4);
  const y = (p) => scale.yOfPrice(p);
  const pocs = [];

  for (let i = Math.max(0, i0); i <= i1; i++) {
    const it = items[i];
    const tp = profileOf(it.session, mult);
    if (!tp) continue;
    const step = tp.bucket;
    const cx = geo.x(it, i);
    const colL = cx - geo.slot / 2 + 10;
    const colR = cx + geo.slot / 2 - 6;
    const area = (colR - colL) * (volume ? 0.66 : 1);
    const s = it.session;
    const nPeriods = Math.max(1, Math.round(DAY / (s.tpoMs ?? 1_800_000)));
    let maxN = 1;
    if (split) for (const ks of tp.letters.values()) maxN = Math.max(maxN, ks[ks.length - 1] + 1);
    else for (const ks of tp.letters.values()) maxN = Math.max(maxN, ks.length);
    const cw = Math.max(1.5, Math.min(11, area / maxN));
    const rowH = Math.abs(y(0) - y(step));
    const yRow = (r) => y((r + 0.5) * step);

    // Fond de la value area et ligne du POC.
    ctx.fillStyle = alpha(C.white, 0.035);
    ctx.fillRect(colL, y((tp.vah + 1) * step), colR - colL, y(tp.val * step) - y((tp.vah + 1) * step));
    ctx.fillStyle = alpha(C.ember, 0.16);
    ctx.fillRect(colL, y((tp.poc + 1) * step), colR - colL, rowH);

    const useLetters = letters && cw >= 7 && rowH >= 9;
    ctx.font = font(Math.min(11, Math.max(8, rowH - 2)), 500);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [r, ks] of tp.letters) {
      const inVa = r >= tp.val && r <= tp.vah;
      ks.forEach((k, n) => {
        const ib = k < (s.ibN ?? 2);
        const color = colorMode === 'period' ? periodColor(k, nPeriods) : ib ? C.ember : r === tp.poc ? C.white : inVa ? C.pale : C.graphite;
        const xc = colL + ((split ? k : n) + 0.5) * cw; // éclaté : chaque période dans sa colonne
        if (useLetters) {
          ctx.fillStyle = color;
          ctx.fillText(TPO_LETTERS[k % TPO_LETTERS.length], xc, yRow(r) + 0.5);
        } else {
          ctx.fillStyle = alpha(color, inVa ? 0.75 : 0.5);
          ctx.fillRect(xc - cw / 2, yRow(r) - rowH / 2 + 0.5, Math.max(1, cw - 1), Math.max(1, rowH - 1));
        }
      });
    }
    // Simples impressions : trait bleu à gauche (et zone prolongée) ; initial balance : barre ember.
    ctx.fillStyle = alpha('#479ffa', 0.85);
    for (const r of tp.singles) ctx.fillRect(colL - 5, y((r + 1) * step) + 0.5, 2, Math.max(1, rowH - 1));
    for (const [a, b] of runs(tp.singles)) zones.push({ i, x: colR, lo: a * step, hi: (b + 1) * step });
    // Poor high / poor low : au moins deux TPO à l'extrême, enchère sans excès (souvent revisitée).
    for (const [row, label] of [[tp.hi, 'Poor high'], [tp.lo, 'Poor low']]) {
      if ((tp.letters.get(row)?.length ?? 0) < 2) continue;
      const yy = label === 'Poor high' ? y((row + 1) * step) : y(row * step);
      line(ctx, colL, colR, yy, alpha(C.ember, 0.7), [2, 3]);
      ctx.font = font(9, 600);
      ctx.fillStyle = C.ember;
      ctx.textAlign = 'right';
      ctx.textBaseline = label === 'Poor high' ? 'bottom' : 'top';
      ctx.fillText(label, colR, yy + (label === 'Poor high' ? -1 : 1));
    }
    if (tp.ibLo !== null) {
      ctx.fillStyle = C.ember;
      ctx.fillRect(colL - 8, y((tp.ibHi + 1) * step), 2, y(tp.ibLo * step) - y((tp.ibHi + 1) * step));
    }
    // Ouverture (triangle à gauche) et clôture (triangle à droite des lettres).
    const marker = (x, yy, dir, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x - 5 * dir, yy - 4);
      ctx.lineTo(x - 5 * dir, yy + 4);
      ctx.closePath();
      ctx.fill();
    };
    marker(colL - 1, yRow(tp.openRow), 1, C.mist);
    const closeN = split ? (s.periods[s.periods.length - 1]?.[0] ?? 0) + 1 : tp.letters.get(tp.closeRow)?.length ?? 1;
    marker(colL + closeN * cw + 7, yRow(tp.closeRow), -1, C.white);

    if (volume) drawSideVolume(ctx, it.session, mult, { x0: colL + area + 6, x1: colR, y, step });

    // Séparateur de session ; date et niveaux en pied de colonne (le haut est occupé par la légende).
    ctx.fillStyle = alpha(C.white, 0.08);
    ctx.fillRect(Math.round(cx - geo.slot / 2), 0, 1, scale.h);
    const d = new Date(it.t0);
    ctx.font = font(11, 600);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = C.mist;
    ctx.fillText(`${WEEKDAYS[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`, colL - 8, scale.h - 22);
    ctx.font = font(10);
    ctx.fillStyle = C.graphite;
    ctx.fillText(`POC ${fmt((tp.poc + 0.5) * step)} · VA ${fmt(tp.val * step)}–${fmt((tp.vah + 1) * step)}`, colL - 8, scale.h - 8);
    pocs.push({ i, price: (tp.poc + 0.5) * step, x: colR, tp, step });
  }

  // Simples impressions des sessions passées, prolongées jusqu'à ce qu'une session les retraverse.
  if (extendSingles) {
    for (const z of zones) {
      const k = items.findIndex((it, j) => j > z.i && it.l < z.hi && it.h > z.lo);
      const x1 = k < 0 ? scale.w : geo.x(items[k], k) - geo.slot / 2;
      if (z.i === items.length - 1 || x1 <= z.x) continue;
      ctx.fillStyle = alpha('#479ffa', 0.09);
      ctx.fillRect(z.x, y(z.hi), x1 - z.x, y(z.lo) - y(z.hi));
    }
  }

  // Session en cours : POC, VAH et VAL prolongés jusqu'au bord ; sessions passées : POC non testés.
  const last = pocs.find((p) => p.i === items.length - 1);
  if (last) {
    const { tp, step } = last;
    for (const [label, price, color] of [['POC', last.price, C.ember], ['VAH', (tp.vah + 1) * step, C.mist], ['VAL', tp.val * step, C.mist]]) {
      line(ctx, last.x, scale.w, y(price), alpha(color, 0.6), [4, 4]);
      pill(ctx, scale.w - 6, y(price), `${label} ${fmt(price)}`, { bg: C.obsidian, fg: color, size: 10, align: 'right' });
    }
  }
  if (!naked) return;
  for (const p of pocs) {
    if (p.i === items.length - 1) continue;
    const touched = items.slice(p.i + 1).some((it) => it.l <= p.price && it.h >= p.price);
    if (touched) continue;
    line(ctx, p.x, scale.w, y(p.price), alpha(C.ember, 0.55), [6, 4]);
    pill(ctx, scale.w - 6, y(p.price), `nPOC ${fmt(p.price)}`, { bg: C.obsidian, fg: C.ember, size: 10, align: 'right' });
  }
}

// Suites de lignes consécutives : [[début, fin], ...].
function runs(rows) {
  const out = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && r === last[1] + 1) last[1] = r;
    else out.push([r, r]);
  }
  return out;
}

function line(ctx, x0, x1, yy, color, dash) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, yy);
  ctx.lineTo(x1, yy);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Profil de volume de la session, aux mêmes lignes que le TPO, dans la marge droite de la colonne.
function drawSideVolume(ctx, s, mult, { x0, x1, y, step }) {
  if (x1 - x0 < 12) return;
  const rows = new Map();
  for (const [row, bv, sv] of s.rows) {
    const r = Math.floor(row / mult);
    rows.set(r, (rows.get(r) ?? 0) + bv + sv);
  }
  let max = 0;
  let poc = null;
  for (const [r, v] of rows) {
    if (v > max) {
      max = v;
      poc = r;
    }
  }
  for (const [r, v] of rows) {
    const top = y((r + 1) * step);
    ctx.fillStyle = r === poc ? alpha(C.ember, 0.7) : alpha(C.mist, 0.22);
    ctx.fillRect(x0, top + 0.5, ((x1 - x0) * v) / max, Math.max(1, y(r * step) - top - 1));
  }
}
