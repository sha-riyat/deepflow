// Mesures des outils de dessin : niveaux de Fibonacci, règle (et, au fil des outils, position,
// VWAP ancré, aimant). Fonctions pures, communes au graphique et aux tests.

// Retracement de Fibonacci, comme TradingView : 0 sur le second point (fin du mouvement), 1 sur
// le premier (début) ; les niveaux mesurent le recul depuis la fin du mouvement.
export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function fibLevels(p0, p1, levels = FIB_LEVELS) {
  return levels.map((level) => ({ level, price: p1 + (p0 - p1) * level }));
}

// Règle : écart de prix (et en % du prix de départ), nombre de bougies et durée entre deux points.
// `tf` = intervalle des bougies temps ; sinon (ticks, volume, renko...) on compte les colonnes
// avec `columns(t)` (position d'un instant en colonnes, voir indexOfTime).
export function rulerStats(a, b, { tf = null, columns = null } = {}) {
  const dp = b.p - a.p;
  const dt = Math.abs(b.t - a.t);
  const bars = tf ? Math.round(dt / tf) : columns ? Math.round(Math.abs(columns(b.t) - columns(a.t))) : null;
  return { dp, pct: a.p ? (dp / a.p) * 100 : 0, bars, dt };
}

// Durée lisible : 45 s, 12 min, 2 h 15, 3 j 4 h.
export function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} h ${String(m % 60).padStart(2, '0')}` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} j ${h % 24} h` : `${d} j`;
}
