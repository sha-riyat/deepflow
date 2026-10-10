// Repères horaires des marchés crypto, en UTC : ouverture de la Bourse de New York (9 h 30 à New
// York, du lundi au vendredi, heure d'été américaine comprise ; jours fériés non gérés) et heures
// de financement des perpétuels Binance (toutes les 8 h : 0 h, 8 h et 16 h UTC).
const DAY = 86_400_000;
const HOUR = 3_600_000;
export const FUNDING_HOURS = [0, 8, 16];

// Dimanche n° `n` du mois `month` (0 = janvier) à 00:00 UTC.
function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return Date.UTC(year, month, 1 + ((7 - first) % 7) + 7 * (n - 1));
}

// Heure d'été américaine pour le jour UTC `day` : du 2e dimanche de mars au 1er dimanche de novembre.
export function usDst(day) {
  const y = new Date(day).getUTCFullYear();
  return day >= nthSunday(y, 2, 2) && day < nthSunday(y, 10, 1);
}

// Ouverture de New York du jour UTC `day` (null le week-end) : 13 h 30 UTC en été, 14 h 30 en hiver.
export function nyOpen(day) {
  const d = Math.floor(day / DAY) * DAY;
  const wd = new Date(d).getUTCDay();
  if (wd === 0 || wd === 6) return null;
  return d + 9.5 * HOUR + (usDst(d) ? 4 : 5) * HOUR;
}

// Repères de [from, to] : { t, kind: 'ny' | 'funding' }, triés.
export function timeMarkers(from, to, { ny = true, funding = true } = {}) {
  const out = [];
  for (let d = Math.floor(from / DAY) * DAY; d <= to; d += DAY) {
    if (funding) for (const h of FUNDING_HOURS) out.push({ t: d + h * HOUR, kind: 'funding' });
    const o = ny ? nyOpen(d) : null;
    if (o !== null) out.push({ t: o, kind: 'ny' });
  }
  return out.filter((m) => m.t >= from && m.t <= to).sort((a, b) => a.t - b.t);
}

// Prochain repère de chaque sorte strictement après `now` (pour la légende) : à l'heure pile, le
// repère qui vient de passer ne compte plus.
export function nextMarkers(now, opts) {
  const list = timeMarkers(now + 1, now + 4 * DAY, opts);
  return { ny: list.find((m) => m.kind === 'ny')?.t ?? null, funding: list.find((m) => m.kind === 'funding')?.t ?? null };
}
