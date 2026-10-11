// Position longue / courte : taille selon le risque, rapport gain / risque, frais. Calcul affiché
// seulement, aucune exécution. Fonctions pures, communes au graphique et aux tests.

// Capital en devise de cotation, risque en % du capital, frais en % par ordre (0,05 % : ordre au
// marché sur les futures USD-M au tarif de base ; 0,1 % en spot).
export const DEFAULT_CALC = { capital: 1000, risk: 1, fees: 0.05 };

export const MAX_MOVES = 30;
export const MAX_ADDS = 5; // renforts d'une position
export const FUNDING_DEFAULT = 0.01; // financement des perpétuels Binance : 0,01 % par période de 8 h (taux de base)
export const FEE_WARN = 3; // la cible doit valoir au moins 3 fois les frais aller-retour

// Réglages d'une position : capital, risque, frais, et seulement s'ils sont valides les champs
// propres à la position (stop initial et déplacements du stop : voir moveStop).
export function cleanCalc(c) {
  const capital = Number(c?.capital);
  const risk = Number(c?.risk);
  const fees = Number(c?.fees ?? DEFAULT_CALC.fees);
  const stop0 = Number(c?.stop0);
  const moves = Array.isArray(c?.moves) ? c.moves.filter((m) => Number.isFinite(m?.t) && m.p > 0).slice(-MAX_MOVES).map((m) => ({ t: m.t, p: m.p })) : [];
  const adds = Array.isArray(c?.adds) ? c.adds.map(Number).filter((p) => p > 0).slice(0, MAX_ADDS) : [];
  const rate = c?.funding == null ? NaN : Number(c.funding);
  const funding = rate >= 0 && rate <= 1 ? rate : null; // % par période de 8 h
  // Sortie partielle : `pct` % de la position sortis à `r` fois le risque initial, le reste à la cible.
  const pct = Number(c?.partial?.pct);
  const r = Number(c?.partial?.r);
  const partial = pct >= 1 && pct <= 95 && r >= 0.1 && r <= 50 ? { pct, r } : null;
  return {
    capital: capital > 0 && capital <= 1e12 ? capital : DEFAULT_CALC.capital,
    risk: risk > 0 && risk <= 100 ? risk : DEFAULT_CALC.risk,
    fees: fees >= 0 && fees <= 1 ? fees : DEFAULT_CALC.fees,
    ...(c?.stop0 != null && stop0 > 0 ? { stop0 } : {}),
    ...(funding !== null ? { funding } : {}),
    ...(partial ? { partial } : {}),
    ...(adds.length ? { adds } : {}),
    ...(moves.length ? { moves } : {}),
  };
}

// Réglages à garder pour la prochaine position : ceux du compte, pas ceux d'une position précise.
export function calcDefaults(c) {
  const { capital, risk, fees, funding } = cleanCalc(c);
  return { capital, risk, fees, ...(funding !== undefined ? { funding } : {}) };
}

// Points d'une nouvelle position : entrée au clic, stop à `dist` du prix, cible à 2 × `dist`
// (rapport gain / risque de 2), jusqu'à l'instant `end`.
export function positionPoints(entry, side, dist, end) {
  const k = side === 'long' ? 1 : -1;
  return [{ ...entry }, { t: end, p: entry.p - k * dist }, { t: end, p: entry.p + 2 * k * dist }];
}

// Prix moyen de l'entrée et des renforts (tous de même taille).
export const averageEntry = (entry, adds = []) => (adds.length ? (entry + adds.reduce((a, p) => a + p, 0)) / (1 + adds.length) : entry);

// Taille de position pour perdre `risk` % du capital, frais compris, si le stop INITIAL est touché
// (`stop0`, sinon le stop courant) : par unité, la perte au stop est l'écart entrée-stop plus les
// frais de l'entrée et de la sortie (`fees` % de chaque prix) ; quantité = montant risqué / perte
// par unité. Gain à la cible et R:R (gain / montant risqué) nets de frais. Un stop déplacé change
// `riskNow` (perte restante au stop courant) et `lockedR` (en R, > 0 : gain verrouillé). Avec des
// renforts (`adds`, prix d'entrées de même taille que la première), tout part du prix moyen.
export function positionStats({ side, entry, stop, target, capital, risk, fees = 0, stop0 = stop, partial = null, adds = [], funding = FUNDING_DEFAULT, fundings = 0 }) {
  const e = averageEntry(entry, adds);
  const k = side === 'long' ? 1 : -1;
  const f = fees / 100;
  const perUnit = k * (e - stop0); // écart au stop initial, par unité
  const reward = k * (target - e); // écart à la cible, par unité
  if (!(perUnit > 0) || !(e > 0)) return { valid: false };
  const riskAmount = (capital * risk) / 100;
  const qty = riskAmount / (perUnit + f * (e + stop0));
  // Sortie partielle : une part sort à `tp1`, le reste à la cible ; ignorée si `tp1` n'est pas avant la cible.
  const tp1 = partial ? e + k * partial.r * perUnit : null;
  const share = partial && k * (tp1 - e) < reward ? partial.pct / 100 : 0;
  const exit = share ? share * tp1 + (1 - share) * target : target; // prix de sortie moyen
  const gain = qty * (k * (exit - e) - f * (e + exit));
  const lossNow = qty * (k * (e - stop) + f * (e + stop)); // perte au stop courant (< 0 : gain)
  return {
    valid: reward > 0,
    avg: e,
    entries: 1 + adds.length,
    rr: gain / riskAmount,
    qty,
    notional: qty * e,
    leverage: (qty * e) / capital,
    riskAmount,
    riskNow: Math.max(0, lossNow),
    lockedR: Math.max(0, -lossNow) / riskAmount,
    gain,
    fees: qty * f * (e + exit), // frais si la cible est atteinte (et la part sortie à TP1)
    // Financement estimé sur `fundings` périodes de 8 h traversées : > 0, c'est un coût pour un long (taux
    // positif) et un gain pour un court ; l'inverse si le taux est négatif.
    fundingCost: qty * e * (funding / 100) * fundings * k,
    tp1: share ? tp1 : null,
    share,
    stopPct: (k * (e - stop) / e) * 100, // < 0 : stop au-delà de l'entrée, côté gain
    targetPct: (reward / e) * 100,
    feeMultiple: f > 0 ? (reward / e) / (2 * f) : Infinity, // cible en multiples des frais aller-retour
    feeWarn: f > 0 && (reward / e) / (2 * f) < FEE_WARN - 1e-9,
  };
}

// ---------- Gestion du stop : point mort, gain verrouillé ----------

// Prix de sortie qui couvre les frais d'entrée et de sortie (`fees` % de chaque prix) : le « vrai »
// point mort, un peu au-delà de l'entrée.
export function breakEvenPrice(side, entry, fees) {
  return stopForR(side, entry, entry, 0, fees); // r = 0 : aucun gain verrouillé
}

// Prix du stop qui verrouille `r` fois le risque initial, frais compris : le risque initial (1 R) est
// l'écart au stop initial plus les frais ; à r = 0, c'est le point mort.
export function stopForR(side, entry, stop0, r, fees = 0) {
  const f = fees / 100;
  const k = side === 'long' ? 1 : -1;
  const unit = k * (entry - stop0) + f * (entry + stop0); // 1 R par unité
  return side === 'long' ? (entry * (1 + f) + r * unit) / (1 - f) : (entry * (1 - f) - r * unit) / (1 + f);
}

// Un stop ne se déplace que vers le gain : vrai si `next` est plus protecteur que `current`.
export const improves = (side, current, next) => (side === 'long' ? next > current : next < current);

// Déplace le stop de `calc` / `pts` vers `price` s'il est plus protecteur : le stop initial et
// l'heure du déplacement sont mémorisés (historique tracé sur le graphique). Retourne
// { pts, calc } ou null si le stop ne s'améliore pas.
export function moveStop(side, pts, calc, price, t) {
  if (!(price > 0) || !improves(side, pts[1].p, price)) return null;
  const moves = [...(calc.moves ?? []), { t, p: price }].slice(-MAX_MOVES);
  return {
    pts: pts.map((q, i) => (i === 0 ? { ...q } : i === 1 ? { ...q, p: price } : { ...q })),
    calc: { ...calc, stop0: calc.stop0 ?? pts[1].p, moves },
  };
}

// Retour au stop initial : historique effacé.
export function resetStop(pts, calc) {
  if (calc.stop0 == null) return null;
  const { stop0, moves: _moves, ...rest } = calc;
  return { pts: pts.map((q, i) => (i === 1 ? { ...q, p: stop0 } : { ...q })), calc: rest };
}

// Décale les prix et heures mémorisés d'une position déplacée de `dt` (temps) et `dp` (prix).
export function shiftCalc(calc, dt, dp) {
  return {
    ...calc,
    ...(calc.stop0 != null ? { stop0: calc.stop0 + dp } : {}),
    ...(calc.adds ? { adds: calc.adds.map((p) => p + dp) } : {}),
    ...(calc.moves ? { moves: calc.moves.map((m) => ({ t: m.t + dt, p: m.p + dp })) } : {}),
  };
}
