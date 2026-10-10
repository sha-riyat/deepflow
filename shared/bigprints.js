// Gros prints regroupés par niveau de prix dans la bougie (lecture « Deep Trades » : plusieurs gros
// ordres au même prix s'additionnent, 72 + 61 + 60 + 62 contrats ≈ 255 contrats sur un seul niveau).
// Un gros print est [temps, prix, quantité, côté] ; côté 1 = acheteur agresseur, -1 = vendeur.

import { sessionAt } from './sessions.js';

// Multiplicateur du seuil de gros print selon la session (la liquidité n'est pas la même à Tokyo qu'à
// New York) : Asie ×0,5, Londres ×1, New York ×2, hors sessions et week-end ×0,5.
export const SESSION_MULT = { asia: 0.5, london: 1, ny: 2, off: 0.5 };

// Ne garde que les prints dont le montant (prix × quantité) atteint le seuil `min` de leur session.
export function bySession(prints, min) {
  return prints.filter(([t, p, q]) => p * q >= min * SESSION_MULT[sessionAt(t)]);
}

// Index de la bougie qui contient l'instant t (dernière bougie commencée), -1 avant la première.
function barAt(items, t) {
  let lo = 0;
  let hi = items.length - 1;
  if (hi < 0 || t < items[0].t0) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (items[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Regroupe par (bougie, ligne de prix de hauteur `row`, côté) : quantité sommée, prix et instant
// moyens pondérés par la quantité, nombre d'ordres. Retourne [t, prix, quantité, côté, nombre, i]
// (i = index de la bougie, -1 si hors des bougies chargées). Sans ligne (row ≤ 0), un ordre = un groupe.
export function groupBigPrints(prints, items, row) {
  if (!(row > 0)) return prints.map(([t, p, q, side]) => [t, p, q, side, 1, barAt(items, t)]);
  const groups = new Map();
  for (const [t, p, q, side] of prints) {
    const i = barAt(items, t);
    const key = `${i}:${Math.floor(p / row + 1e-9)}:${side > 0 ? 1 : -1}`;
    const g = groups.get(key) ?? { tq: 0, pq: 0, q: 0, n: 0, side, i };
    g.tq += t * q;
    g.pq += p * q;
    g.q += q;
    g.n += 1;
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => [g.tq / g.q, g.pq / g.q, g.q, g.side, g.n, g.i]);
}

// Amplitude moyenne (haut − bas) des 20 bougies jusqu'à la bougie i : l'échelle de mouvement normale de
// l'unité de temps affichée (quelques dollars sur 1 minute, plusieurs dizaines sur 1 heure).
export function avgRange(items, i) {
  const from = Math.max(0, i - 19);
  let sum = 0;
  for (let k = from; k <= i; k++) sum += items[k].h - items[k].l;
  return sum / (i - from + 1);
}

// Suite d'un gros print : le prix a-t-il avancé dans son sens (hausse pour un achat, baisse pour une vente)
// d'au moins `move` × l'amplitude moyenne d'une bougie pendant les `bars` bougies suivantes ? On compare au
// prix du print le meilleur entre la clôture de sa propre bougie et les extrêmes des bougies suivantes. Le
// seuil suit l'unité de temps : un pourcentage fixe du prix donnerait « absorbé » presque partout en 1 minute.
//  - 'follow' : le prix a suivi ;
//  - 'absorbed' : gros ordre agressif sans résultat, lecture d'absorption (un acteur passif a tout encaissé) ;
//  - null : pas encore jugeable (bougies de la fenêtre pas toutes terminées) ou hors des bougies.
// Mesure sur les bougies chargées, pas un signal : un prix qui n'avance pas peut aussi avancer plus tard.
export function printFollow([, p, , side, , i], items, { bars = 3, move = 0.5 } = {}) {
  if (!(bars >= 1) || i < 0 || i + bars >= items.length - 1) return null;
  let best = items[i].c;
  for (let k = i + 1; k <= i + bars; k++) best = side > 0 ? Math.max(best, items[k].h) : Math.min(best, items[k].l);
  const adv = side * (best - p);
  return adv > 0 && adv >= move * avgRange(items, i) ? 'follow' : 'absorbed';
}

// Garde au plus `k` groupes par bougie, les plus gros (k ≤ 0 : tous). Évite qu'une bougie agitée porte une
// dizaine de cercles empilés sur sa mèche pendant que les autres restent vides. Retourne les groupes triés du
// plus gros au plus petit ; ceux hors des bougies chargées (index -1) sont tous gardés.
export function topPerBar(groups, k) {
  const sorted = [...groups].sort((a, b) => b[2] - a[2]);
  if (!(k > 0)) return sorted;
  const count = new Map();
  return sorted.filter((g) => {
    if (g[5] < 0) return true;
    const c = count.get(g[5]) ?? 0;
    count.set(g[5], c + 1);
    return c < k;
  });
}
