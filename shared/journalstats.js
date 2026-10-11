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
