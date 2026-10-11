// « Mes heures de trading » : le graphique est grisé hors de la plage choisie (heure locale de
// l'ordinateur). Dessiné derrière les bougies, de haut en bas du graphique.
import { inTradingHours, outsideWindows } from '@shared/hours.js';
import { C, alpha } from '../theme.js';

export function drawHours(ctx, scale, items, { start, end }) {
  if (!items.length) return;
  ctx.fillStyle = alpha(C.mist, 0.09);
  for (const [t0, t1] of outsideWindows(scale.tLeft, scale.tRight, Number(start), Number(end))) {
    const x0 = Math.max(0, scale.xAt(t0, items));
    const x1 = Math.min(scale.w, scale.xAt(t1, items));
    if (x1 > x0) ctx.fillRect(x0, 0, x1 - x0, scale.h);
  }
}

// Légende : la plage et si l'on y est (le graphique rejoué suit l'heure rejouée).
export function hoursLabel(now, { start, end }) {
  const pad = (h) => String(h).padStart(2, '0');
  if (start === end) return 'toute la journée (début = fin)';
  return `${pad(start)} h – ${pad(end)} h · ${inTradingHours(now, Number(start), Number(end)) ? 'dans vos heures' : 'hors de vos heures'}`;
}
