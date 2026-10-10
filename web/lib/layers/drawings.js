// Dessins de l'utilisateur (voir lib/drawings) : tracé, poignées du dessin sélectionné ou en cours,
// étiquettes sur les axes (prix des horizontales, heure de la verticale sélectionnée).
import { PRICE_ONLY, shapeOf, toPixel } from '@shared/drawings.js';
import { OWN_FILL, colorOf, decorate } from './drawtools.js';
import { fmt } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

const DASH = { solid: [], dash: [6, 4], dot: [2, 3] };
const pad = (n) => String(n).padStart(2, '0');

// Dessins à afficher : dans les vues sans échelle de temps continue, seulement ceux sans heure.
const shown = (editor, priceOnly) => editor.visible().filter((d) => !priceOnly || PRICE_ONLY.includes(d.type));

export function drawDrawings(ctx, editor, scale, items, { digits, tf, base }, priceOnly = false) {
  const view = { w: scale.w, h: scale.h };
  for (const d of shown(editor, priceOnly)) {
    const shape = shapeOf(d, d.pts.map((pt) => toPixel(scale, items, pt)), view);
    const { width, dash } = d.style;
    const color = colorOf(d);
    ctx.fillStyle = alpha(color, 0.12); // zones (rectangle, règle) : fond léger de la couleur du trait
    if (!OWN_FILL.includes(d.type)) for (const [x0, y0, x1, y1] of shape.areas ?? []) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of shape.segs) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    // Liseré sombre sous le trait : lisible au-dessus de la heatmap et des profils.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = width + 2.5;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(DASH[dash] ?? []);
    ctx.stroke();
    // Guides (diagonale du Fibonacci) : trait fin en tirets.
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of shape.guides ?? []) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    decorate(ctx, d, shape, { digits, tf, items, base, editing: editor.editing });
    if (d.id !== editor.sel && d !== editor.draft) continue;
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (const [x, y] of shape.handles) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Étiquettes sur les axes, dessinées après eux : prix des horizontales et des rayons (toujours),
// heure de la verticale sélectionnée.
export function drawDrawingLabels(ctx, editor, scale, items, { axisW, timeTop, timeH, digits }, priceOnly = false) {
  for (const d of shown(editor, priceOnly)) {
    const [x, y] = toPixel(scale, items, d.pts[0]);
    if ((d.type === 'hline' || d.type === 'hray') && y >= 0 && y <= scale.h) {
      pill(ctx, scale.w + 4, y, fmt(d.pts[0].p, digits), { bg: d.style.color, fg: C.ink, size: 11, weight: 600 });
    }
    const selected = d.id === editor.sel || d === editor.draft;
    if (d.type === 'vline' && selected && x >= 0 && x <= scale.w) {
      const t = new Date(d.pts[0].t);
      const text = `${pad(t.getDate())}/${pad(t.getMonth() + 1)} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
      ctx.font = font(11, 600);
      const w = ctx.measureText(text).width + 14;
      pill(ctx, Math.min(scale.w + axisW - w, Math.max(0, x - w / 2)), timeTop + timeH / 2, text, { bg: d.style.color, fg: C.ink, size: 11, weight: 600 });
    }
  }
}
