// Mesures des outils de dessin : niveaux de Fibonacci, règle, position, aimant, VWAP ancré.
// Fonctions pures, communes au graphique et aux tests.

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

// ---------- Position longue / courte (calcul affiché seulement, aucune exécution) ----------

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

// ---------- Aimant ----------

// Le point se colle au prix (ouverture, plus haut, plus bas, clôture) de la bougie sous le curseur le
// plus proche en pixels, s'il est à moins de `maxPx`, et au milieu de la bougie dans le temps
// (`tf` = intervalle des bougies temps ; sinon milieu de t0 – t1). Sinon le point reste libre.
export function snapToBar(bar, pt, y, yOfPrice, { maxPx = 30, tf = null } = {}) {
  if (!bar) return pt;
  let best = null;
  let dist = Infinity;
  for (const p of [bar.o, bar.h, bar.l, bar.c]) {
    if (!Number.isFinite(p)) continue;
    const d = Math.abs(yOfPrice(p) - y);
    if (d < dist) [best, dist] = [p, d];
  }
  if (best === null || dist > maxPx) return pt;
  return { t: Math.round(tf ? bar.t0 + tf / 2 : (bar.t0 + bar.t1) / 2), p: best };
}

// ---------- VWAP ancré ----------

// Prix moyen pondéré par le volume depuis la bougie qui contient l'ancre (incluse) : Σ prix ×
// quantité / Σ quantité, cumulés bougie après bougie (pv et v de chaque bougie). Sur une unité plus
// grande que celle du clic, la moyenne part donc du début de cette bougie. `partial` : l'ancre
// précède la première bougie chargée, le début de la moyenne manque.
export function anchoredVwap(bars, t) {
  let i = bars.findIndex((b) => b.t1 >= t);
  if (i < 0) i = bars.length;
  const points = [];
  let pv = 0;
  let v = 0;
  for (; i < bars.length; i++) {
    const b = bars[i];
    pv += b.pv;
    v += b.v;
    if (v > 0) points.push({ t0: b.t0, t1: b.t1, vwap: pv / v });
  }
  return { points, partial: bars.length > 0 && t < bars[0].t0 };
}
