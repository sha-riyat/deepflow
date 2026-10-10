// Mesures des outils de dessin : niveaux de Fibonacci (et, au fil des outils, règle, position,
// VWAP ancré, aimant). Fonctions pures, communes au graphique et aux tests.

// Retracement de Fibonacci, comme TradingView : 0 sur le second point (fin du mouvement), 1 sur
// le premier (début) ; les niveaux mesurent le recul depuis la fin du mouvement.
export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function fibLevels(p0, p1, levels = FIB_LEVELS) {
  return levels.map((level) => ({ level, price: p1 + (p0 - p1) * level }));
}
