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
