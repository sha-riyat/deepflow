// Panneau « Prime et financement » (futures) : indice de prime (écart du perpétuel à l'indice spot,
// en gris) et taux de financement payés (en orange, en escalier jusqu'au suivant), sur une échelle
// en % centrée sur zéro. Prime et financement positifs : les longs paient les shorts, le marché
// est penché à l'achat (levier acheteur) ; très positifs, foule trop longue (risque de purge).
import { C, alpha, font } from '../theme.js';

export const pct = (v, d = 4) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(d).replace('.', ',')} %`;

// Dernière valeur de `rows` [temps, valeur] à l'instant `t` (ou avant).
function valueAt(rows, t) {
  let v = null;
  for (const [rt, rv] of rows) {
    if (rt > t) break;
    v = rv;
  }
  return v;
}

export function drawFundingPane(ctx, items, scale, { top, h, w }, funding) {
  const pad = 6;
  const mid = top + h / 2;
  const { premium = [], rates = [], error = null } = funding ?? {};
  const inView = (t) => {
    const x = scale.xAt(t, items);
    return x >= -10 && x <= w + 10;
  };
  const prem = premium.filter(([t]) => inView(t));
  const lastBefore = rates.filter(([t]) => scale.xAt(t, items) < -10).pop();
  const steps = [...(lastBefore ? [lastBefore] : []), ...rates.filter(([t]) => inView(t))];
  if (!prem.length && !steps.length) {
    ctx.font = font(11);
    ctx.fillStyle = C.smoke;
    ctx.textBaseline = 'middle';
    ctx.fillText(error ?? 'Prime et financement : futures uniquement (chargement…)', 8, mid);
    return null;
  }
  const max = Math.max(1e-6, ...prem.map(([, v]) => Math.abs(v)), ...steps.map(([, v]) => Math.abs(v)));
  const yOf = (v) => mid - (v / max) * (h / 2 - pad);
  ctx.strokeStyle = alpha(C.white, 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, Math.round(mid) + 0.5);
  ctx.lineTo(w, Math.round(mid) + 0.5);
  ctx.stroke();
  // Prime : ligne grise.
  ctx.strokeStyle = C.mist;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  prem.forEach(([t, v], k) => (k ? ctx.lineTo(scale.xAt(t, items), yOf(v)) : ctx.moveTo(scale.xAt(t, items), yOf(v))));
  ctx.stroke();
  // Financement : escalier orange, point à chaque paiement.
  ctx.strokeStyle = C.ember;
  ctx.fillStyle = C.ember;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  steps.forEach(([t, v], k) => {
    const x = Math.max(0, scale.xAt(t, items));
    const next = steps[k + 1] ? scale.xAt(steps[k + 1][0], items) : w;
    ctx.moveTo(x, yOf(v));
    ctx.lineTo(Math.min(next, w), yOf(v));
  });
  ctx.stroke();
  for (const [t, v] of steps) {
    const x = scale.xAt(t, items);
    if (x < 0) continue;
    ctx.beginPath();
    ctx.arc(x, yOf(v), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return { lo: -max, hi: max, valueAt: (y) => ((mid - y) / (h / 2 - pad)) * max };
}

// Valeurs de la bougie survolée : prime, dernier financement payé et son équivalent annuel
// (3 paiements par jour sur la plupart des contrats).
export function fundingValues(items, i, funding) {
  const b = items[i];
  if (!b || !funding) return [];
  const p = valueAt(funding.premium ?? [], b.t0);
  const r = valueAt(funding.rates ?? [], b.t1 ?? b.t0);
  const tone = (v) => (v >= 0 ? 'pos' : 'neg');
  const out = [];
  if (p !== null) out.push(['Prime', pct(p), tone(p)]);
  if (r !== null) out.push(['Financement', pct(r), tone(r)], ['', `≈ ${pct(r * 3 * 365, 1)} par an`, '']);
  return out.length ? out : [['', '—', '']];
}
