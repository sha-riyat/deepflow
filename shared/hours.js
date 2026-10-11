// « Mes heures de trading » : plage horaire personnelle, en heure locale de l'ordinateur (heure
// d'été comprise), qui peut passer minuit (22 h → 2 h). Sert à griser le graphique hors de ces
// heures : un trader qui ne trade que de 14 h à 18 h n'a pas à regarder le reste.
const DAY = 86_400_000;

// Plages [début, fin) de « mes heures » qui touchent [from, to], pour les jours locaux voisins.
// start === end : aucune plage (pas de grisé).
export function tradingWindows(from, to, start, end) {
  if (start === end) return [];
  const out = [];
  const d0 = new Date(from - DAY);
  for (let d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()); d.getTime() <= to + DAY; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const t0 = new Date(y, m, d.getDate(), start).getTime();
    const t1 = new Date(y, m, d.getDate() + (end > start ? 0 : 1), end).getTime();
    if (t1 > from && t0 < to) out.push([t0, t1]);
  }
  return out;
}

// Plages de [from, to] situées hors de « mes heures » : celles à griser.
export function outsideWindows(from, to, start, end) {
  const win = tradingWindows(from, to, start, end);
  if (!win.length) return [];
  const out = [];
  let t = from;
  for (const [a, b] of win) {
    if (a > t) out.push([t, Math.min(a, to)]);
    t = Math.max(t, b);
  }
  if (t < to) out.push([t, to]);
  return out;
}

// Vrai si `t` est dans « mes heures » (toujours vrai sans plage définie).
export function inTradingHours(t, start, end) {
  if (start === end) return true;
  return tradingWindows(t, t + 1, start, end).some(([a, b]) => t >= a && t < b);
}
