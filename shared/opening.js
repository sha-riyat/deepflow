// Ouverture de la session et initial balance (IB : première heure de la session UTC), d'après le
// profil du jour (périodes TPO [période, ligne basse, ligne haute, clôture]).
//
// Types d'ouverture de Dalton (« Mind Over Markets »), lus ici sur l'IB, règle simplifiée et donc
// indicative :
//  - drive (Open-Drive) : le prix part d'un côté de l'ouverture et n'y revient pas ; conviction
//    forte, la journée tend dans ce sens ;
//  - test (Open-Test-Drive) : petit test d'un côté, puis départ franc de l'autre côté ;
//  - reject (Open-Rejection-Reverse) : départ marqué d'un côté, rejeté, puis retour au-delà de
//    l'ouverture ; conviction moindre ;
//  - auction (Open-Auction) : rotation autour de l'ouverture, pas de direction (souvent une journée
//    d'équilibre).

import { nyOpen, sessionHours } from './sessions.js';

const EDGE = 0.15; // part de l'IB tolérée de l'autre côté de l'ouverture pour un drive
const AWAY = 0.3; // clôture de l'IB à au moins 30 % de l'IB de l'ouverture : direction nette

// IB du jour en prix (null tant que la première heure n'est pas terminée), avec ses extensions
// (1,5 × et 2 × l'IB, comptées depuis le bord opposé : IB haute + 0,5 × et + 1 × la largeur).
export function ibLevels(today, now) {
  if (!today || today.ibLo === null || today.ibHi === null) return null;
  const tpoMs = today.tpoMs ?? 1_800_000;
  const end = today.t0 + (today.ibN ?? 2) * tpoMs;
  const lo = today.ibLo * today.bucket;
  const hi = (today.ibHi + 1) * today.bucket;
  return { lo, hi, range: hi - lo, end, done: now >= end };
}

export function ibExtensions(ib, steps = [0.5, 1]) {
  return steps.flatMap((k) => [{ k, side: 1, price: ib.hi + k * ib.range }, { k, side: -1, price: ib.lo - k * ib.range }]);
}

// Type d'ouverture : { type, side } (side : 1 haussier, -1 baissier, 0 sans direction), ou null
// avant la fin de l'IB.
export function openType(today, now) {
  const ib = ibLevels(today, now);
  if (!ib || !ib.done || !(ib.range > 0)) return null;
  const n = today.ibN ?? 2;
  const first = today.periods.filter(([k]) => k < n).sort((a, b) => a[0] - b[0]);
  const last = first[first.length - 1];
  if (!last || last[3] === undefined) return null;
  const o = today.open;
  const r = ib.range;
  const close = last[3];
  const side = close >= o + AWAY * r ? 1 : close <= o - AWAY * r ? -1 : 0;
  if (side === 0) return { type: 'auction', side: 0 };
  // Excursion de l'autre côté de l'ouverture pendant l'IB, et quand elle a eu lieu.
  const against = side > 0 ? o - ib.lo : ib.hi - o;
  if (against <= EDGE * r) return { type: 'drive', side };
  // Le côté opposé a-t-il été touché d'abord (première période) ?
  const [, a, b] = first[0];
  const aLo = a * today.bucket;
  const aHi = (b + 1) * today.bucket;
  const firstAgainst = side > 0 ? o - aLo : aHi - o;
  const firstWith = side > 0 ? aHi - o : o - aLo;
  if (firstAgainst <= firstWith) return { type: 'auction', side: 0 }; // pas de test d'abord : rotation
  return { type: against < 0.5 * r ? 'test' : 'reject', side };
}

export const OPEN_TYPE_LABEL = {
  drive: 'Open-Drive',
  test: 'Open-Test-Drive',
  reject: 'Open-Rejection-Reverse',
  auction: 'Open-Auction',
};

export function openTypeLabel(o) {
  if (!o) return '';
  const dir = o.side > 0 ? ' haussier' : o.side < 0 ? ' baissier' : '';
  return `${OPEN_TYPE_LABEL[o.type]}${dir}`;
}

// ── Range d'ouverture (ORB, « opening range breakout ») ────────────────────────────────────────
// Plus haut et plus bas des N premières minutes après une ancre : 00:00 UTC, ouverture de Londres
// (8 h locales) ou de New York (9 h 30 locales, heure d'été comprise). Repère très utilisé : une
// cassure du range, confirmée par le volume, donne souvent la direction de la séance ; un retour
// dans le range après une cassure est une enchère ratée. Le crypto n'ouvre ni ne ferme : l'ancre
// est un choix, New York restant le moment où le volume des actions américaines arrive.

export const ORB_ANCHORS = { utc: '00:00 UTC', london: 'Londres', ny: 'New York' };
export const ORB_MINUTES = [5, 15, 30, 60];
const HOUR = 3_600_000;

// Début du range du jour UTC `day` pour l'ancre donnée (null si pas d'ouverture ce jour-là : week-end
// pour Londres et New York).
export function orbStart(day, anchor) {
  const d = Math.floor(day / 86_400_000) * 86_400_000;
  if (anchor === 'ny') return nyOpen(d);
  if (anchor === 'london') {
    const wd = new Date(d).getUTCDay();
    return wd === 0 || wd === 6 ? null : d + sessionHours(d, 'london')[0] * HOUR;
  }
  return d;
}

// Dernier range commencé à `now` (aujourd'hui, sinon le dernier jour avec une ouverture) :
// { start, end, minutes }.
export function orbWindow(now, anchor, minutes) {
  for (let k = 0; k < 4; k++) {
    const start = orbStart(now - k * 86_400_000, anchor);
    if (start !== null && start <= now) return { start, end: start + minutes * 60_000, minutes };
  }
  return null;
}

// Range d'après des bougies { t0, h, l } (celles qui commencent dans la fenêtre) : null s'il n'y en a
// pas. `done` : fenêtre terminée à `now`. Extensions : voir ibExtensions (0,5 × et 1 × la largeur).
export function orbRange(bars, win, now) {
  if (!win) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of bars) {
    if (b.t0 < win.start || b.t0 >= win.end) continue;
    if (b.h > hi) hi = b.h;
    if (b.l < lo) lo = b.l;
  }
  if (!(hi >= lo)) return null;
  return { ...win, hi, lo, mid: (hi + lo) / 2, range: hi - lo, done: now >= win.end };
}
