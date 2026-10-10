// Niveaux clés (voir shared/keylevels.js) : ouvertures de la semaine et du mois, plus hauts et plus
// bas de la veille, de la semaine et du mois précédents, du début de leur période au bord droit.
// Étiquettes alignées à droite, écartées quand des niveaux sont trop proches.
import { levelLines } from '@shared/keylevels.js';
import { fmt } from '../fmt.js';
import { C, alpha, pill } from '../theme.js';

const VIOLET = '#a78bfa';
// Ouvertures en tirets ; veille en gris, semaine en violet, mois en orange (pointillés).
const STYLE = { wo: [VIOLET, [6, 3]], mo: [C.ember, [6, 3]], d: [C.mist, [2, 3]], w: [VIOLET, [2, 3]], m: [C.ember, [2, 3]] };

export function drawKeyLevels(ctx, k, scale, items, { show = 'all' } = {}) {
  const lines = levelLines(k, show)
    .map(([key, label, price, t]) => ({ key, label, price, y: scale.yOfPrice(price), x0: Math.max(0, scale.xAt(t, items)) }))
    .filter((l) => l.y >= 0 && l.y <= scale.h && l.x0 < scale.w)
    .sort((a, b) => a.y - b.y);
  let last = -Infinity;
  for (const l of lines) {
    const [color, dash] = STYLE[l.key] ?? STYLE[l.key[0]];
    ctx.strokeStyle = alpha(color, 0.75);
    ctx.lineWidth = 1;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(l.x0, l.y);
    ctx.lineTo(scale.w, l.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const y = Math.max(l.y, last + 16);
    last = y;
    pill(ctx, scale.w - 8, y, `${l.label} ${fmt(l.price)}`, { bg: C.obsidian, fg: color, size: 10, align: 'right' });
  }
}
