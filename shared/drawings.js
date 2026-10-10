// Dessins du graphique : format sauvegardé, conversion entre (heure, prix) et pixels, forme en
// pixels et test du clic. Un dessin est accroché à des points (heure, prix) et non à des pixels :
// il garde sa place au zoom, au défilement et au changement d'unité de temps.

export const DRAWINGS_VERSION = 1;
export const DRAW_TYPES = { trend: 2, hline: 1, hray: 1, vline: 1 }; // type -> nombre de points
export const PRICE_ONLY = ['hline']; // dessins sans heure : affichés aussi dans les vues TPO, Kagi...
export const DEFAULT_STYLE = { color: '#479ffa', width: 1.5, dash: 'solid' };
export const DRAW_COLORS = ['#479ffa', '#ffa16c', '#4ebe96', '#e0685f', '#f5c84c', '#a78bfa', '#e6e6e6', '#868f97'];
export const DRAW_WIDTHS = [1, 1.5, 2, 3];
export const DRAW_DASHES = ['solid', 'dash', 'dot'];

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

// Déplacement d'un dessin de (dx, dy) pixels, à partir de ses points d'origine.
export function movePoints(scale, items, pts, dx, dy) {
  return pts.map((pt) => {
    const [x, y] = toPixel(scale, items, pt);
    return fromPixel(scale, items, x + dx, y + dy);
  });
}

// ---------- Forme en pixels et test du clic ----------

// Segments (tracé et clic) et poignées (points que l'on peut saisir) d'un dessin, à partir de ses
// points convertis en pixels ; `view` = dimensions du tracé (lignes prolongées jusqu'aux bords).
export function shapeOf(d, px, view = { w: 1e6, h: 1e6 }) {
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
    default:
      return { segs: [], handles: px };
  }
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
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].segs.some((s) => distToSegment(x, y, ...s) <= tol)) return { index: i, handle: -1 };
  }
  return null;
}

// ---------- Format sauvegardé : { v, sets: { 'marché:SYMBOLE': [dessin, ...] } } ----------

const validPoint = (pt) => pt && Number.isFinite(pt.t) && Number.isFinite(pt.p);

export function validDrawing(d) {
  return Boolean(d) && typeof d.id === 'string' && d.type in DRAW_TYPES && Array.isArray(d.pts)
    && d.pts.length === DRAW_TYPES[d.type] && d.pts.every(validPoint);
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
    const ok = list.filter(validDrawing).map((d) => ({ ...d, style: cleanStyle(d.style) }));
    if (ok.length) sets[key] = ok;
  }
  return sets;
}

export function serializeDrawings(sets) {
  const kept = Object.fromEntries(Object.entries(sets).filter(([, list]) => list.length));
  return JSON.stringify({ v: DRAWINGS_VERSION, sets: kept });
}
