// Range d'ouverture (ORB, « opening range breakout ») : plus haut et plus bas des premières minutes
// après l'ouverture choisie (00:00 UTC, Londres ou New York), de l'ouverture au bord droit.
// Haut et bas en trait plein, milieu en pointillés, extensions en tirets ; un cadre léger montre la
// fenêtre pendant sa formation. Lecture : une sortie nette du range, appuyée par le flux, indique le
// camp qui prend le contrôle ; un retour dans le range après une sortie est une cassure ratée.
import { ORB_ANCHORS, ibExtensions, orbRange, orbWindow } from '@shared/opening.js';
import { fmt } from '../fmt.js';
import { C, alpha, pill } from '../theme.js';

const COLOR = '#7dd3c0';
export const ORB_STEPS = { 0: [], 1: [0.5, 1] };

// Range à afficher d'après les bougies d'une minute chargées (`data.orbBars`), ou null.
export function orbOf(data, now, { anchor, minutes }) {
  const win = orbWindow(now, anchor, minutes);
  const b = data.orbBars;
  if (!win || !b || b.start !== win.start || b.minutes !== minutes) return null;
  return orbRange(b.bars, win, now);
}

export function drawOrb(ctx, data, scale, items, now, opts) {
  const orb = orbOf(data, now, opts);
  if (!orb) return;
  const x0 = Math.max(0, scale.xAt(orb.start, items));
  const xl = Math.max(0, scale.xAt(orb.end, items)); // étiquettes après la fin du range
  if (!(x0 < scale.w)) return;
  const mint = alpha(COLOR, 0.85);
  const yOf = (price) => Math.round(scale.yOfPrice(price)) + 0.5;
  if (!orb.done) {
    // Cadre de la fenêtre en formation.
    const yh = yOf(orb.hi);
    const yl = yOf(orb.lo);
    ctx.fillStyle = alpha(COLOR, 0.08);
    ctx.fillRect(x0, yh, Math.max(0, Math.min(scale.w, xl) - x0), yl - yh);
  }
  const line = (price, color, dash, label) => {
    const y = yOf(price);
    if (y < 0 || y > scale.h) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(scale.w, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (xl + 6 < scale.w) pill(ctx, xl + 6, y, `${label} ${fmt(price)}`, { bg: C.obsidian, fg: color, size: 10 });
  };
  const tail = orb.done ? '' : ' (en cours)';
  line(orb.hi, mint, [], `ORB haut${tail}`);
  line(orb.lo, mint, [], `ORB bas${tail}`);
  if (!orb.done) return;
  line(orb.mid, alpha(COLOR, 0.5), [2, 3], 'ORB milieu');
  for (const e of ibExtensions(orb, ORB_STEPS[opts.ext] ?? ORB_STEPS[1])) {
    line(e.price, alpha(COLOR, 0.4), [5, 4], `ORB ×${String(1 + e.k).replace('.', ',')}`);
  }
}

// Texte de la légende.
export function orbLabel(data, now, opts) {
  const win = orbWindow(now, opts.anchor, opts.minutes);
  const name = `${ORB_ANCHORS[opts.anchor]} ${opts.minutes} min`;
  if (!win) return `${name} : pas d'ouverture récente`;
  const orb = orbOf(data, now, opts);
  if (!orb) return `${name} : chargement…`;
  const hhmm = (t) => new Date(t).toISOString().slice(11, 16);
  if (!orb.done) return `${name} : en formation jusqu’à ${hhmm(orb.end)} UTC`;
  return `${name} : ${fmt(orb.lo)} – ${fmt(orb.hi)} · ouvert à ${hhmm(orb.start)} UTC`;
}
