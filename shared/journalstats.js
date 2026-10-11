// Statistiques du journal au-delà des totaux (journal.js) : coût des erreurs, courbe de capital en R,
// séries de pertes, ventilation par setup, note, heure, jour. Tout porte sur les trades réellement
// notés et clôturés : ce ne sont pas des backtests.
import { ERRORS, tradeR } from './journal.js';

const sum = (a) => a.reduce((s, x) => s + x, 0);

// Coût de chaque erreur : nombre de trades étiquetés, total en R (négatif : l'erreur coûte) et R moyen,
// du plus coûteux au moins coûteux ; `clean` : trades clôturés sans aucune erreur, pour comparer.
export function errorCosts(list) {
  const closed = list.map((e) => [e, tradeR(e)]).filter(([, r]) => r !== null);
  const rows = Object.keys(ERRORS).map((key) => {
    const rs = closed.filter(([e]) => e.errors.includes(key)).map(([, r]) => r);
    return { key, count: rs.length, totalR: sum(rs), avgR: rs.length ? sum(rs) / rs.length : null };
  }).filter((r) => r.count > 0).sort((a, b) => a.totalR - b.totalR);
  const clean = closed.filter(([e]) => !e.errors.length).map(([, r]) => r);
  return { rows, clean: { count: clean.length, totalR: sum(clean), avgR: clean.length ? sum(clean) / clean.length : null } };
}

// Trades clôturés triés par heure de sortie (à défaut, de saisie), avec leur résultat en R.
function closedByTime(list) {
  return list.map((e) => ({ e, r: tradeR(e), t: e.tOut ?? e.t })).filter((x) => x.r !== null).sort((a, b) => a.t - b.t);
}

// Courbe de capital en R : [{ t, r, cum }] trade après trade, partie de 0.
export function equityCurve(list) {
  let cum = 0;
  return closedByTime(list).map(({ t, r }) => ({ t, r, cum: (cum += r) }));
}

// Pire repli de la courbe (du plus haut au creux suivant, en R, positif) ; 0 s'il n'y en a pas.
export function maxDrawdown(curve) {
  let peak = 0;
  let worst = 0;
  for (const { cum } of curve) {
    peak = Math.max(peak, cum);
    worst = Math.max(worst, peak - cum);
  }
  return worst;
}

// Plus longue série de trades perdants d'affilée (R < 0) : repère de ce qu'il faut savoir encaisser.
export function longestLosingStreak(list) {
  let best = 0;
  let run = 0;
  for (const { r } of closedByTime(list)) {
    run = r < 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

// Taux de réussite et rapport gain moyen / perte moyenne (payoff) : le taux de réussite minimal pour ne
// pas perdre d'argent est 1 / (1 + payoff) (avant frais). Avec un payoff de 2, un trade sur trois suffit.
export function edgeStats(list) {
  const rs = closedByTime(list).map((x) => x.r);
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r < 0);
  const avgWin = wins.length ? sum(wins) / wins.length : null;
  const avgLoss = losses.length ? -sum(losses) / losses.length : null;
  const payoff = avgWin !== null && avgLoss !== null ? avgWin / avgLoss : null;
  return {
    trades: rs.length,
    winRate: rs.length ? wins.length / rs.length : null,
    avgWin,
    avgLoss,
    payoff,
    breakEven: payoff === null ? null : 1 / (1 + payoff),
  };
}

// Taux de réussite minimal pour un payoff donné (courbe d'équilibre du graphique).
export const breakEvenWinRate = (payoff) => 1 / (1 + payoff);
