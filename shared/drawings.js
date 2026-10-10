// Dessins du graphique : format sauvegardé, conversion entre (heure, prix) et pixels, forme en
// pixels et test du clic (mesures des outils : measures.js). Un dessin est accroché à des points
// (heure, prix) et non à des pixels : il garde sa place au zoom, au défilement et au changement
// d'unité de temps.
import { FIB_LEVELS, anchoredVwap, cleanCalc } from './measures.js';

export const DRAWINGS_VERSION = 1;
export const DRAW_TYPES = { trend: 2, hline: 1, hray: 1, vline: 1, rect: 2, fib: 2, text: 1, ruler: 2, long: 3, short: 3, avwap: 1, vp: 2 }; // type -> nombre de points
export const POSITIONS = ['long', 'short']; // points : entrée (début), stop et cible (fin)
export const PRICE_ONLY = ['hline']; // dessins sans heure : affichés aussi dans les vues TPO, Kagi...
export const DEFAULT_STYLE = { color: '#479ffa', width: 1.5, dash: 'solid' };
export const DRAW_COLORS = ['#479ffa', '#ffa16c', '#4ebe96', '#e0685f', '#f5c84c', '#a78bfa', '#e6e6e6', '#868f97'];
export const DRAW_WIDTHS = [1, 1.5, 2, 3];
export const DRAW_DASHES = ['solid', 'dash', 'dot'];
export const TEXT_MAX = 500;

// Notes : l'épaisseur choisie donne la taille du texte ; boîte estimée (sans canvas) pour le clic.
export const textSize = (width) => ({ 1: 12, 1.5: 13, 2: 15, 3: 18 })[width] ?? 13;

export function textBox(text, width) {
  const size = textSize(width);
  const lines = String(text || ' ').split('\n');
  return { size, lines, w: Math.max(...lines.map((l) => l.length)) * size * 0.6 + 10, h: lines.length * (size + 6) };
}

// Style complété et vérifié : une valeur inconnue (stockage abîmé) reprend la valeur par défaut.
export function cleanStyle(style) {
  const s = style ?? {};
  return {
    color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : DEFAULT_STYLE.color,
    width: DRAW_WIDTHS.includes(s.width) ? s.width : DEFAULT_STYLE.width,
    dash: DRAW_DASHES.includes(s.dash) ? s.dash : DEFAULT_STYLE.dash,
  };
}

// ---------- Axe des bougies d'activité (ticks, volume, renko...) : une colonne par bougie ----------

const avgSpan = (items) => Math.max(1, (items[items.length - 1].t1 - items[0].t0) / items.length);

// Position (indice fractionnaire) d'un instant : la bougie i occupe [i - 0,5 ; i + 0,5] et est
// parcourue de t0 à t1 ; hors des données, on prolonge avec la durée moyenne d'une bougie.
export function indexOfTime(items, t) {
  const n = items.length;
  if (!n) return NaN;
  if (t < items[0].t0) return -0.5 - (items[0].t0 - t) / avgSpan(items);
  if (t > items[n - 1].t1) return n - 0.5 + (t - items[n - 1].t1) / avgSpan(items);
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (items[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  const b = items[lo];
  return lo - 0.5 + Math.min(1, Math.max(0, (t - b.t0) / Math.max(1, b.t1 - b.t0)));
}

// Inverse de indexOfTime.
export function timeOfIndex(items, idx) {
  const n = items.length;
  if (!n) return NaN;
  if (idx < -0.5) return items[0].t0 + (idx + 0.5) * avgSpan(items);
  if (idx >= n - 0.5) return items[n - 1].t1 + (idx - n + 0.5) * avgSpan(items);
  const i = Math.max(0, Math.round(idx));
  const b = items[i];
  return b.t0 + (idx - i + 0.5) * Math.max(1, b.t1 - b.t0);
}

// ---------- Conversions (heure, prix) <-> pixels, selon le mode de l'échelle ----------

export function toPixel(scale, items, pt) {
  const x = scale.mode === 'time' ? scale.xOfTime(pt.t) : scale.xOfIndex(indexOfTime(items, pt.t));
  return [x, scale.yOfPrice(pt.p)];
}

export function fromPixel(scale, items, x, y) {
  const t = scale.mode === 'time' ? scale.timeOfX(x) : timeOfIndex(items, scale.indexOfX(x));
  return { t: Math.round(t), p: scale.priceOfY(y) };
}

// Forme d'un dessin sur le graphique : `scale` et `items` (série affichée) pour les positions,
// `bars` (bougies brutes) et `tf` (intervalle des bougies temps) pour le VWAP ancré.
export function shapeIn(d, { scale, items, bars = [], tf = null }) {
  const view = { w: scale.w, h: scale.h };
  const px = d.pts.map((pt) => toPixel(scale, items, pt));
  if (d.type !== 'avwap') return shapeOf(d, px, view);
  const { points, partial } = anchoredVwap(bars, d.pts[0].t);
  const mid = (q) => (tf ? q.t0 + tf / 2 : (q.t0 + q.t1) / 2);
  const curve = points.map((q) => toPixel(scale, items, { t: mid(q), p: q.vwap }));
  return { ...shapeOf(d, px, view, { curve, partial }), last: points[points.length - 1]?.vwap ?? null };
}

// Déplacement d'un dessin de (dx, dy) pixels, à partir de ses points d'origine.
export function movePoints(scale, items, pts, dx, dy) {
  return pts.map((pt) => {
    const [x, y] = toPixel(scale, items, pt);
    return fromPixel(scale, items, x + dx, y + dy);
  });
}

// ---------- Forme en pixels et test du clic ----------

// Segments (tracé et clic), guides (trait fin en tirets, clic), zones pleines (clic à l'intérieur)
// et poignées (points que l'on peut saisir) d'un dessin, à partir de ses points convertis en pixels ;
// `view` = dimensions du tracé (lignes prolongées jusqu'aux bords) ; `extra` = courbe calculée du
// VWAP ancré (voir shapeIn).
export function shapeOf(d, px, view = { w: 1e6, h: 1e6 }, extra = {}) {
  const [x, y] = px[0];
  switch (d.type) {
    case 'trend':
      return { segs: [[x, y, ...px[1]]], handles: px };
    case 'hline':
      return { segs: [[0, y, view.w, y]], handles: px };
    case 'hray':
      return { segs: [[x, y, view.w, y]], handles: px };
    case 'vline':
      return { segs: [[x, 0, x, view.h]], handles: px };
    case 'rect': {
      const [x1, y1] = px[1];
      const segs = [[x, y, x1, y], [x1, y, x1, y1], [x1, y1, x, y1], [x, y1, x, y]];
      return { segs, areas: [[Math.min(x, x1), Math.min(y, y1), Math.max(x, x1), Math.max(y, y1)]], handles: [px[0], px[1], [x, y1], [x1, y]] };
    }
    case 'ruler': {
      // Zone entre les deux points, flèches au milieu (verticale = prix, horizontale = temps).
      const [x1, y1] = px[1];
      const [mx, my] = [(x + x1) / 2, (y + y1) / 2];
      return { segs: [[mx, y, mx, y1], [x, my, x1, my]], areas: [[Math.min(x, x1), Math.min(y, y1), Math.max(x, x1), Math.max(y, y1)]], handles: px };
    }
    case 'long':
    case 'short': {
      // Zones cible et stop de l'entrée jusqu'à la fin ; poignées : entrée, stop, cible, fin.
      const [x1, ys] = px[1];
      const [, yt] = px[2];
      const box = (ya) => [Math.min(x, x1), Math.min(y, ya), Math.max(x, x1), Math.max(y, ya)];
      return { segs: [[x, y, x1, y]], areas: [box(yt), box(ys)], handles: [px[0], [x, ys], [x, yt], [x1, y]] };
    }
    case 'vp': {
      // Profil à plage fixe : zone entre les deux points (clic à l'intérieur), sans contour.
      const [x1, y1] = px[1];
      return { segs: [], areas: [[Math.min(x, x1), Math.min(y, y1), Math.max(x, x1), Math.max(y, y1)]], handles: px };
    }
    case 'avwap': {
      // Courbe du VWAP (pixels, voir shapeIn) ; segments hors de la vue ignorés.
      const c = extra.curve ?? [];
      const segs = [];
      for (let i = 1; i < c.length; i++) {
        if ((c[i - 1][0] < -10 && c[i][0] < -10) || (c[i - 1][0] > view.w + 10 && c[i][0] > view.w + 10)) continue;
        segs.push([...c[i - 1], ...c[i]]);
      }
      return { segs, handles: [c[0] ?? px[0]], end: c[c.length - 1] ?? null, partial: extra.partial };
    }
    case 'text': {
      const box = textBox(d.text, d.style?.width);
      return { segs: [], areas: [[x, y, x + box.w, y + box.h]], handles: px };
    }
    case 'fib': {
      // Niveaux de l'extrémité gauche à l'extrémité droite ; le prix est linéaire en pixels.
      const [x1, y1] = px[1];
      const [l, r] = [Math.min(x, x1), Math.max(x, x1)];
      const segs = FIB_LEVELS.map((k) => [l, y1 + (y - y1) * k, r, y1 + (y - y1) * k]);
      return { segs, guides: [[x, y, x1, y1]], handles: px };
    }
    default:
      return { segs: [], handles: px };
  }
}

// Points d'un dessin après avoir déplacé sa poignée `i` en `pt`. Rectangle : poignées 2 et 3 =
// coins opposés, qui mêlent l'heure d'un point et le prix de l'autre.
export function setHandle(d, i, pt) {
  const pts = d.pts.map((q) => ({ ...q }));
  if (d.type === 'rect' && i >= 2) {
    const [a, b] = i === 2 ? [0, 1] : [1, 0];
    pts[a].t = pt.t;
    pts[b].p = pt.p;
  } else if (POSITIONS.includes(d.type) && i > 0) {
    // Position : stop (1) et cible (2) ne changent que de prix ; la fin (3) que d'heure.
    if (i === 3) pts[1].t = pts[2].t = pt.t;
    else pts[i].p = pt.p;
  } else pts[i] = { ...pt };
  return pts;
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const k = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + k * dx), py - (y1 + k * dy));
}

// Dessin sous le curseur : { index, handle } (handle = -1 pour le corps), le dernier tracé étant
// au-dessus ; les poignées du dessin sélectionné passent en premier.
export function hitTest(shapes, x, y, tol = 6, selected = -1) {
  const sel = shapes[selected];
  if (sel) {
    const h = sel.handles.findIndex(([hx, hy]) => Math.hypot(x - hx, y - hy) <= tol + 2);
    if (h >= 0) return { index: selected, handle: h };
  }
  const inside = ([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const { segs, guides = [], areas = [] } = shapes[i];
    const near = (s) => distToSegment(x, y, ...s) <= tol;
    if (segs.some(near) || guides.some(near) || areas.some(inside)) return { index: i, handle: -1 };
  }
  return null;
}

// ---------- Format sauvegardé : { v, sets: { 'marché:SYMBOLE': [dessin, ...] } } ----------

const validPoint = (pt) => pt && Number.isFinite(pt.t) && Number.isFinite(pt.p);

export function validDrawing(d) {
  return Boolean(d) && typeof d.id === 'string' && d.type in DRAW_TYPES && Array.isArray(d.pts)
    && d.pts.length === DRAW_TYPES[d.type] && d.pts.every(validPoint)
    && (d.type !== 'text' || (typeof d.text === 'string' && d.text.length <= TEXT_MAX));
}

// Lecture tolérante : un texte illisible ou un dessin invalide est ignoré, le reste est gardé.
export function parseDrawings(text) {
  let raw;
  try {
    raw = JSON.parse(text ?? '');
  } catch {
    return {};
  }
  const sets = {};
  for (const [key, list] of Object.entries(raw?.sets ?? {})) {
    if (!Array.isArray(list)) continue;
    const ok = list.filter(validDrawing).map((d) => ({
      ...d, style: cleanStyle(d.style), ...(POSITIONS.includes(d.type) ? { calc: cleanCalc(d.calc) } : {}),
    }));
    if (ok.length) sets[key] = ok;
  }
  return sets;
}

export function serializeDrawings(sets) {
  const kept = Object.fromEntries(Object.entries(sets).filter(([, list]) => list.length));
  return JSON.stringify({ v: DRAWINGS_VERSION, sets: kept });
}
