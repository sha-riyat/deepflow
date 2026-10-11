// Aimant sur les niveaux : en plus des prix OHLC de la bougie (snapToBar, measures.js), un point de
// dessin se colle aux niveaux que le trader surveille — POC, VAH, VAL et LVN de la veille, POC /
// VAH / VAL / ouverture / VWAP du jour, hauts et bas de la veille, ouvertures de la semaine et du
// mois, derniers gros prints. Fonctions pures, communes au graphique et aux tests.
import { volumeNodes } from './auction.js';

// Niveaux { price, label } d'après la veille et le jour (profils de session), les niveaux clés, les
// bougies chargées (VWAP du jour : seulement si elles couvrent tout le jour) et les gros prints
// [temps, prix, quantité, côté] (les 12 derniers).
export function levelsOf({ prev = null, today = null, keyLevels = null, bars = [], prints = [] } = {}) {
  const out = [];
  const add = (label, price) => Number.isFinite(price) && out.push({ label, price });
  const profile = (s, tag) => {
    if (!s || s.vah === null || s.vah === undefined) return;
    add(`POC ${tag}`, (s.poc + 0.5) * s.bucket);
    add(`VAH ${tag}`, (s.vah + 1) * s.bucket);
    add(`VAL ${tag}`, s.val * s.bucket);
  };
  profile(prev, 'J-1');
  if (prev) {
    add('Haut J-1', prev.hi);
    add('Bas J-1', prev.lo);
    for (const row of volumeNodes(prev.rows ?? []).lvn) add('LVN J-1', (row + 0.5) * prev.bucket);
  }
  profile(today, 'J');
  if (today) {
    add('Ouv. J', today.open);
    let pv = 0;
    let v = 0;
    if (bars.length && bars[0].t0 <= today.t0) {
      for (const b of bars) if (b.t0 >= today.t0) (pv += b.pv ?? 0), (v += b.v);
      if (v > 0) add('VWAP J', pv / v);
    }
  }
  if (keyLevels) {
    add('Ouv. S', keyLevels.weekOpen);
    add('Ouv. M', keyLevels.monthOpen);
  }
  for (const [, p] of prints.slice(-12)) add('Gros print', p);
  return out;
}

// Niveau le plus proche de la hauteur `y` (pixels), à `maxPx` au plus : { price, label, dist } ou null.
export function nearestLevel(levels, y, yOfPrice, maxPx = 30) {
  let best = null;
  for (const l of levels) {
    const dist = Math.abs(yOfPrice(l.price) - y);
    if (dist <= maxPx && (!best || dist < best.dist)) best = { ...l, dist };
  }
  return best;
}

// Point collé à l'aimant : au prix OHLC (et au milieu de la bougie dans le temps) ou au niveau, selon
// le plus proche en pixels ; un niveau garde l'heure du curseur. Sans rien à portée, le point reste libre.
export function snapPoint(bar, pt, y, yOfPrice, { levels = [], maxPx = 30, tf = null } = {}) {
  let ohlc = null;
  if (bar) {
    for (const p of [bar.o, bar.h, bar.l, bar.c]) {
      if (!Number.isFinite(p)) continue;
      const dist = Math.abs(yOfPrice(p) - y);
      if (dist <= maxPx && (!ohlc || dist < ohlc.dist)) ohlc = { p, dist };
    }
  }
  const level = nearestLevel(levels, y, yOfPrice, maxPx);
  if (level && (!ohlc || level.dist < ohlc.dist)) return { t: pt.t, p: level.price, label: level.label };
  if (!ohlc) return pt;
  return { t: Math.round(tf ? bar.t0 + tf / 2 : (bar.t0 + bar.t1) / 2), p: ohlc.p };
}
