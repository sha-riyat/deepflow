// Open interest (OI : nombre de contrats ouverts) croisé avec le prix.
//
// Les quatre cas classiques, sur une même période :
//  - prix ↑ et OI ↑ : nouveaux longs (acheteurs qui ouvrent des positions) ;
//  - prix ↓ et OI ↑ : nouveaux shorts (vendeurs qui ouvrent des positions) ;
//  - prix ↑ et OI ↓ : rachats de shorts (des vendeurs sortent, souvent forcés) ;
//  - prix ↓ et OI ↓ : sorties de longs (liquidations ou prises de bénéfices).
// Une hausse « saine » s'accompagne plutôt de nouveaux longs ; une hausse par rachats de shorts
// s'essouffle souvent une fois les shorts sortis. Lecture indicative, pas un signal.

export const QUADRANT_LABEL = {
  longsIn: 'nouveaux longs',
  shortsIn: 'nouveaux shorts',
  shortsOut: 'rachats de shorts',
  longsOut: 'sorties de longs',
  flat: 'OI stable',
};

// Cas prix / OI ; `minOi` : variation relative d'OI en deçà de laquelle l'OI est jugé stable.
export function oiQuadrant(dPrice, dOiPct, minOi = 0.1) {
  if (Math.abs(dOiPct) < minOi) return 'flat';
  if (dOiPct > 0) return dPrice >= 0 ? 'longsIn' : 'shortsIn';
  return dPrice >= 0 ? 'shortsOut' : 'longsOut';
}

// Prix de clôture de la bougie qui contient `t` (bougies triées [{ t0, t1, c }]), ou null.
function closeAt(bars, t) {
  let lo = 0;
  let hi = bars.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (bars[m].t0 > t) hi = m - 1;
    else if ((bars[m].t1 ?? bars[m].t0) < t) lo = m + 1;
    else return bars[m].c;
  }
  return null;
}

// Variation d'OI par niveau de prix sur [from, to] : chaque variation entre deux relevés d'OI est
// rangée au prix de clôture de la bougie du second relevé. Renvoie [ligne, ouvertures, fermetures]
// (ligne × `row` = bas du niveau), triées par ligne.
export function oiByPrice(oi, bars, row, from = -Infinity, to = Infinity) {
  const rows = new Map();
  for (let k = 1; k < oi.length; k++) {
    const [t, v] = oi[k];
    if (t < from || t > to) continue;
    const p = closeAt(bars, t);
    if (p === null) continue;
    const r = Math.floor(p / row);
    const cell = rows.get(r) ?? [r, 0, 0];
    const d = v - oi[k - 1][1];
    if (d >= 0) cell[1] += d;
    else cell[2] -= d;
    rows.set(r, cell);
  }
  return [...rows.values()].sort((a, b) => a[0] - b[0]);
}

// Variation du prix et de l'OI (en %) entre deux instants (bornés aux bougies chargées), et le cas
// correspondant.
export function oiChange(oi, bars, from, to) {
  const last = bars[bars.length - 1];
  const end = Math.min(to, last ? last.t1 ?? last.t0 : -Infinity);
  const pick = (t) => oi.filter(([x]) => x <= t).pop();
  const a = pick(from);
  const b = pick(end);
  const p0 = a && closeAt(bars, a[0]);
  const p1 = b && closeAt(bars, b[0]);
  if (!a || !b || a === b || !p0 || !p1) return null;
  const dPrice = ((p1 - p0) / p0) * 100;
  const dOi = ((b[1] - a[1]) / a[1]) * 100;
  return { dPrice, dOi, quadrant: oiQuadrant(dPrice, dOi) };
}
