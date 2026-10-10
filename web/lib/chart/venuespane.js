// Panneau « CVD multi-plateformes » : CVD de session de Binance (orange), de Bybit (bleu) et d'OKX
// (gris) sur le même perpétuel, chacun sur sa propre échelle pour comparer les formes. Un mouvement
// suivi partout est porté par tout le marché ; une plateforme qui diverge signale un acteur isolé.
// Bybit et OKX : depuis le lancement de la session en direct (voir server/venues.js).
import { qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';
import { sessionCvd, sessionStart } from '@shared/cvd.js';
import { line } from './spotpane.js';

const MINUTE = 60_000;
export const VENUES = [['bybit', 'Bybit', '#479ffa', 1], ['okx', 'OKX', C.mist, 3]]; // colonne des achats dans les lignes

// CVD d'une plateforme aligné sur les bougies (null avant les premières données).
export function venueCvd(items, upto, venues, col) {
  const out = new Array(Math.max(0, upto + 1)).fill(null);
  if (!venues?.rows?.length) return out;
  const byMinute = new Map(venues.rows.map((r) => [r[0], r]));
  const first = venues.rows[0][0];
  let cum = 0;
  for (let i = 0; i <= upto; i++) {
    const b = items[i];
    if (sessionStart(items, i)) cum = 0;
    if ((b.t1 ?? b.t0) < first) continue;
    for (let m = Math.floor(b.t0 / MINUTE) * MINUTE; m <= (b.t1 ?? b.t0); m += MINUTE) {
      const r = byMinute.get(m);
      if (r) cum += r[col] - r[col + 1];
    }
    out[i] = cum;
  }
  return out;
}

export function drawVenuesPane(ctx, items, geo, { top, h, w, axisW }, venues, minuteBars) {
  const [i0, i1] = geo.range;
  const pad = 6;
  const message = !minuteBars ? 'CVD multi-plateformes : bougies temps d’au moins 1 min'
    : !venues ? 'CVD multi-plateformes : chargement…'
      : !venues.status ? 'CVD multi-plateformes : direct futures uniquement (pas en replay)'
        : !venues.rows.length ? `Bybit : ${venues.status.bybit} · OKX : ${venues.status.okx} · en attente des premiers trades` : null;
  if (message) {
    ctx.font = font(11);
    ctx.fillStyle = C.smoke;
    ctx.textBaseline = 'middle';
    ctx.fillText(message, 8, top + h / 2);
    return;
  }
  const series = [['binance', 'Binance', C.ember, sessionCvd(items, i1)], ...VENUES.map(([k, name, color, col]) => [k, name, color, venueCvd(items, i1, venues, col)])];
  const ranges = series.map(([, , color, cvd]) => {
    const pts = [];
    for (let i = Math.max(0, i0); i <= i1; i++) {
      if (sessionStart(items, i)) pts.push(null);
      pts.push(cvd[i] === null ? null : [geo.x(items[i], i), cvd[i]]);
    }
    return line(ctx, pts, alpha(color, 0.9), top, h, pad);
  });
  ctx.fillStyle = alpha(C.ink, 0.9);
  ctx.fillRect(w, top + 1, axisW, h - 1);
  ctx.font = font(10);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  series.forEach(([, name, color], k) => {
    ctx.fillStyle = color;
    ctx.fillText(ranges[k] ? name : `${name} —`, w + 8, top + pad + 4 + k * 13);
  });
}

export function venuesValues(items, i, venues) {
  const tone = (v) => (v >= 0 ? 'pos' : 'neg');
  const out = [['Binance', qty(sessionCvd(items, i)[i]), tone(sessionCvd(items, i)[i])]];
  for (const [, name, , col] of VENUES) {
    const v = venueCvd(items, i, venues, col)[i];
    out.push([name, v === null ? '—' : qty(v), v === null ? '' : tone(v)]);
  }
  return out;
}
