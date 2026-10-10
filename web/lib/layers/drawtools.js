// Habillage propre à chaque outil de dessin (étiquettes, zones), après le tracé commun de
// drawings.js : niveaux et prix du Fibonacci, notes, mesures de la règle, position longue / courte,
// VWAP ancré, Volume Profile à plage fixe.
import { POSITIONS, indexOfTime, textBox } from '@shared/drawings.js';
import { fibLevels, formatDuration, positionStats, rulerStats } from '@shared/measures.js';
import { SHAPE_LABEL, auctionLabel, auctionState, profileShape, profileTotals } from '@shared/auction.js';
import { clockNow } from '../clock.js';
import { histogram } from './volprofile.js';
import { drawNodes } from './levels.js';
import { compact, fmt, qty, sgn } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

// Couleur du tracé : celle choisie, sauf la règle (verte si le prix monte, rouge s'il baisse) et
// la position (ligne d'entrée neutre ; zones cible et stop colorées par position()).
export function colorOf(d) {
  if (d.type === 'ruler') return d.pts[1].p >= d.pts[0].p ? C.growth : C.loss;
  return POSITIONS.includes(d.type) ? C.mist : d.style.color;
}

// Zones remplies ici plutôt que par le tracé commun.
export const OWN_FILL = [...POSITIONS, 'vp'];

// Texte sur un fond sombre arrondi (comme la légende), lisible sur la heatmap ; (x, y) = coin
// bas du fond, à gauche (align 'left') ou à droite ('right'). Retourne la largeur du fond.
export function label(ctx, text, x, y, color, { align = 'left', size = 11, weight = 500 } = {}) {
  ctx.font = font(size, weight);
  const w = ctx.measureText(text).width + 10;
  const h = size + 6;
  const left = align === 'right' ? x - w : x;
  ctx.fillStyle = 'rgba(11, 11, 11, 0.72)';
  ctx.beginPath();
  ctx.roundRect(left, y - h, w, h, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + 5, y - h / 2 + 0.5);
  return w;
}

// Fibonacci : zone 0,5 – 0,618 (« golden pocket ») légèrement remplie, niveau et prix à gauche.
function fib(ctx, d, shape, { digits }) {
  const levels = fibLevels(d.pts[0].p, d.pts[1].p);
  const { color } = d.style;
  const seg = (k) => shape.segs[levels.findIndex((l) => l.level === k)];
  const [a, b] = [seg(0.5), seg(0.618)];
  ctx.fillStyle = alpha(color, 0.1);
  ctx.fillRect(a[0], Math.min(a[1], b[1]), a[2] - a[0], Math.abs(b[1] - a[1]));
  levels.forEach(({ level, price }, i) => {
    const [x, y] = shape.segs[i];
    label(ctx, `${String(level).replace('.', ',')} (${fmt(price, digits)})`, x, y - 2, color);
  });
}

// Note : une ligne de texte par ligne saisie, à partir du point (coin haut gauche). Masquée
// pendant sa saisie (la zone de texte HTML la remplace).
function text(ctx, d, shape, { editing }) {
  if (d.id === editing) return;
  const [x, y] = shape.handles[0];
  const { size, lines } = textBox(d.text, d.style.width);
  lines.forEach((line, i) => label(ctx, line, x, y + (i + 1) * (size + 6), d.style.color, { size, weight: 500 }));
}

// Pointe de flèche en (x, y), orientée selon (dx, dy).
function head(ctx, x, y, dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / len, dy / len];
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - ux * 7 - uy * 4, y - uy * 7 + ux * 4);
  ctx.lineTo(x - ux * 7 + uy * 4, y - uy * 7 - ux * 4);
  ctx.closePath();
  ctx.fill();
}

// Règle : pointes des flèches, puis écart de prix (et en %), bougies et durée sous la zone.
function ruler(ctx, d, shape, { digits, tf, items }) {
  const [[mx, y0, , y1], [x0, my, x1]] = shape.segs;
  const color = colorOf(d);
  ctx.fillStyle = color;
  head(ctx, mx, y1, 0, y1 - y0);
  head(ctx, x1, my, x1 - x0, 0);
  const st = rulerStats(d.pts[0], d.pts[1], { tf, columns: (t) => indexOfTime(items, t) });
  const lines = [`${sgn(st.dp, digits)} (${sgn(st.pct, 2)} %)`, `${st.bars ?? '—'} bougie${st.bars > 1 ? 's' : ''} · ${formatDuration(st.dt)}`];
  const bottom = Math.max(y0, y1) + 8;
  ctx.font = font(11, 600);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 10;
  lines.forEach((l, i) => label(ctx, l, mx - w / 2, bottom + (i + 1) * 17, color, { weight: 600 }));
}

// Position : zones cible (verte) et stop (rouge), prix et montants nets de frais ; à droite, R:R et
// taille de position pour risquer le pourcentage choisi du capital (calcul affiché seulement).
function position(ctx, d, shape, { digits, base, scale }) {
  const [target, stop] = shape.areas;
  for (const [[x0, y0, x1, y1], color] of [[target, C.growth], [stop, C.loss]]) {
    ctx.fillStyle = alpha(color, 0.16);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  const [entry, sl, tp] = d.pts.map((q) => q.p);
  const st = positionStats({ side: d.type, entry, stop: sl, target: tp, ...d.calc });
  // Étiquettes hors des zones (lisibles même sur une petite position) : cible au-delà de sa zone,
  // stop au-delà de la sienne, résumé à droite de la ligne d'entrée.
  const left = target[0];
  const above = (box) => box[1] - 3;
  const below = (box) => box[3] + 20;
  const long = d.type === 'long';
  if (!st.valid) {
    label(ctx, 'Stop et cible de part et d’autre de l’entrée', left, long ? above(target) : below(target), C.ember, { weight: 600 });
    return;
  }
  const money = (v) => `${v >= 0 ? '+' : '−'}${compact(Math.abs(v))} $`;
  const tText = `Cible ${fmt(tp, digits)} · +${fmt(st.targetPct, 2)} % · ${money(st.gain)}${st.gain <= 0 ? ' : les frais mangent le gain' : ''}`;
  const sText = `Stop ${fmt(sl, digits)} · −${fmt(st.stopPct, 2)} % · −${compact(st.riskAmount)} $`;
  // Décalées vers la gauche si elles déborderaient sous l'axe des prix.
  const fit = (text) => {
    ctx.font = font(11, 600);
    return Math.max(0, Math.min(left, scale.w - ctx.measureText(text).width - 12));
  };
  label(ctx, tText, fit(tText), long ? above(target) : below(target), st.gain > 0 ? C.growth : C.ember, { weight: 600 });
  label(ctx, sText, fit(sText), long ? below(stop) : above(stop), C.loss, { weight: 600 });
  const [, yE] = shape.handles[0];
  const fees = d.calc.fees ? ` · frais ${fmt(d.calc.fees, 3)} %` : ' · sans frais';
  const info = `R:R ${fmt(st.rr, 2)} · ${qty(st.qty)} ${base} (${compact(st.notional)} $) · levier ×${fmt(st.leverage, 1)} · risque ${fmt(d.calc.risk, 2)} %${fees}`;
  // À droite de la zone, ou à sa gauche si le texte déborderait sous l'axe des prix.
  ctx.font = font(11, 600);
  const right = target[2] + 6 + ctx.measureText(info).width + 10 <= scale.w;
  label(ctx, info, right ? target[2] + 6 : target[0] - 6, yE + 8.5, C.white, { weight: 600, align: right ? 'left' : 'right' });
}

// VWAP ancré : nom à l'ancre ; historique incomplet signalé (l'ancre précède les bougies chargées).
function avwap(ctx, d, shape) {
  const [x, y] = shape.handles[0];
  label(ctx, shape.partial ? 'VWAP ancré · historique incomplet' : 'VWAP ancré', x + 6, y - 6, shape.partial ? C.ember : d.style.color);
}

// Volume Profile à plage fixe : histogramme par prix depuis le bord gauche (30 % de la largeur) en
// volume, en achats / ventes ou en delta (`style.kind`), POC (prix le plus échangé) et value area (70 %
// du volume : VAH en haut, VAL en bas) prolongés sur la plage, pics (HVN) et creux (LVN) de volume, et en
// dessous une étiquette de totaux (volume, delta, bougies, forme du profil). Avec `style.extend`, POC,
// VAH et VAL sont prolongés jusqu'au bord droit et l'état de l'enchère par rapport à la zone de valeur
// (acceptation ou rejet, 2 clôtures de 30 min) est indiqué. Profil calculé par le collecteur à partir
// de chaque trade.
function vp(ctx, d, shape, { scale, digits, profileOf, items = [] }) {
  const [x0, y0, x1, y1] = shape.areas[0];
  ctx.fillStyle = alpha(d.style.color, 0.05);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const r = profileOf?.(d) ?? { loading: true };
  const note = (text, color = C.graphite) => label(ctx, text, x0, Math.max(y0, 0) - 3, color);
  if (r.loading) return note('Profil : chargement…');
  if (r.error) return note(`Profil indisponible : ${r.error}`, C.ember);
  const s = r.session;
  if (!s?.rows.length) return note('Aucun trade sur cette plage');
  histogram(ctx, s, scale, x0, Math.max(24, (x1 - x0) * 0.3), 1, { kind: d.style.kind ?? 'volume', va: 1 });
  const ext = d.style.extend === true;
  const xr = ext ? scale.w : x1; // fin des lignes : bord droit si prolongées
  const lines = [['POC', (s.poc + 0.5) * s.bucket, C.ember, []], ['VAH', (s.vah + 1) * s.bucket, C.mist, [4, 3]], ['VAL', s.val * s.bucket, C.mist, [4, 3]]];
  for (const [name, price, color, dash] of lines) {
    const y = scale.yOfPrice(price);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(xr, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (ext) label(ctx, `${name} ${fmt(price, digits)}`, scale.w - 4, y + 8.5, color, { size: 10, align: 'right' });
    else label(ctx, `${name} ${fmt(price, digits)}`, x1 + 4, y + 8.5, color, { size: 10 });
  }
  const nodes = drawNodes(ctx, s, scale, x0, x1, { labels: true });
  const t = profileTotals(s);
  const [from, to] = [d.pts[0].t, d.pts[1].t].sort((a, b) => a - b);
  const n = items.filter((b) => b.t1 > from && b.t0 < to).length;
  const form = profileShape(s, nodes);
  const total = `Volume ${qty(t.volume)} · Δ ${t.delta >= 0 ? '+' : ''}${qty(t.delta)} (${Math.round(t.deltaPct)} %) · ${n} bougie${n > 1 ? 's' : ''}${form ? ` · forme ${SHAPE_LABEL[form]}` : ''}`;
  // Décalée vers la gauche si elle dépasserait le bord droit du graphique.
  ctx.font = font(10, 500);
  const lx = Math.max(4, Math.min(x0, scale.w - ctx.measureText(total).width - 14));
  // Sous la zone, et sous l'étiquette « VAL » (qui descend de 8 px sous la ligne) quand le VAL est près du bas.
  const below = Math.max(y1 + 16, scale.yOfPrice(s.val * s.bucket) + 27);
  const ly = below <= scale.h ? below : Math.max(y0, 0) + 16;
  label(ctx, total, lx, ly, C.mist, { size: 10 });
  if (ext && r.after?.session) {
    const st = auctionState(s, r.after.session, clockNow(), 2);
    label(ctx, `Depuis la fin de la plage : ${auctionLabel(st, 'du profil')}`, lx, ly + 17, C.mist, { size: 10 });
  }
  if (r.clipped) note('Plage limitée aux 3 derniers jours de la sélection', C.ember);
  else if (r.partial) note('Historique en cours de téléchargement', C.ember);
}

const DECOR = { fib, text, ruler, long: position, short: position, avwap, vp };

export function decorate(ctx, d, shape, opts) {
  DECOR[d.type]?.(ctx, d, shape, opts);
}
