// Dessins de l'utilisateur (voir lib/drawings) et poignées du dessin sélectionné ou en cours.
import { shapeOf, toPixel } from '@shared/drawings.js';
import { C } from '../theme.js';

const DASH = { solid: [], dash: [6, 4], dot: [2, 3] };

export function drawDrawings(ctx, editor, scale, items) {
  for (const d of editor.visible()) {
    const shape = shapeOf(d, d.pts.map((pt) => toPixel(scale, items, pt)));
    const { color, width, dash } = d.style;
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
    ctx.setLineDash([]);
    if (d.id !== editor.sel && d !== editor.draft) continue;
    ctx.fillStyle = C.ink;
    ctx.lineWidth = 1.5;
    for (const [x, y] of shape.handles) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
