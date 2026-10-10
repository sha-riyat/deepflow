// Habillage propre à chaque outil de dessin (étiquettes, zones), après le tracé commun de
// drawings.js : niveaux et prix du Fibonacci.
import { fibLevels } from '@shared/measures.js';
import { fmt } from '../fmt.js';
import { alpha, font } from '../theme.js';

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

const DECOR = { fib };

export function decorate(ctx, d, shape, opts) {
  DECOR[d.type]?.(ctx, d, shape, opts);
}
