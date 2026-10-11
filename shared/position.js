// Position longue / courte : taille selon le risque, rapport gain / risque, frais. Calcul affiché
// seulement, aucune exécution. Fonctions pures, communes au graphique et aux tests.

// Capital en devise de cotation, risque en % du capital, frais en % par ordre (0,05 % : ordre au
// marché sur les futures USD-M au tarif de base ; 0,1 % en spot).
export const DEFAULT_CALC = { capital: 1000, risk: 1, fees: 0.05 };

export function cleanCalc(c) {
  const capital = Number(c?.capital);
  const risk = Number(c?.risk);
  const fees = Number(c?.fees ?? DEFAULT_CALC.fees);
  return {
    capital: capital > 0 && capital <= 1e12 ? capital : DEFAULT_CALC.capital,
    risk: risk > 0 && risk <= 100 ? risk : DEFAULT_CALC.risk,
    fees: fees >= 0 && fees <= 1 ? fees : DEFAULT_CALC.fees,
  };
}

// Points d'une nouvelle position : entrée au clic, stop à `dist` du prix, cible à 2 × `dist`
// (rapport gain / risque de 2), jusqu'à l'instant `end`.
export function positionPoints(entry, side, dist, end) {
  const k = side === 'long' ? 1 : -1;
  return [{ ...entry }, { t: end, p: entry.p - k * dist }, { t: end, p: entry.p + 2 * k * dist }];
}

// Taille de position pour perdre `risk` % du capital, frais compris, si le stop est touché : par
// unité, la perte au stop est l'écart entrée-stop plus les frais de l'entrée et de la sortie
// (`fees` % de chaque prix) ; quantité = montant risqué / perte par unité. Gain à la cible et R:R
// (gain / perte au stop) nets de frais.
export function positionStats({ side, entry, stop, target, capital, risk, fees = 0 }) {
  const k = side === 'long' ? 1 : -1;
  const f = fees / 100;
  const perUnit = k * (entry - stop); // écart au stop, par unité
  const reward = k * (target - entry); // écart à la cible, par unité
  if (!(perUnit > 0) || !(entry > 0)) return { valid: false };
  const riskAmount = (capital * risk) / 100;
  const qty = riskAmount / (perUnit + f * (entry + stop));
  const gain = qty * (reward - f * (entry + target));
  return {
    valid: reward > 0,
    rr: gain / riskAmount,
    qty,
    notional: qty * entry,
    leverage: (qty * entry) / capital,
    riskAmount,
    gain,
    fees: qty * f * (entry + target), // frais si la cible est atteinte
    stopPct: (perUnit / entry) * 100,
    targetPct: (reward / entry) * 100,
  };
}
