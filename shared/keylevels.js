// Niveaux clés tirés des bougies journalières UTC : ouvertures de la semaine (lundi) et du mois,
// plus haut et plus bas de la veille, de la semaine et du mois précédents. Repères très suivis :
// le prix y réagit souvent (prises de liquidité au-delà des extrêmes, retours vers l'ouverture).
import { periodStart } from './sessions.js';

const DAY = 86_400_000;

// `days` : bougies journalières [{ t0, o, h, l }] triées, celle d'aujourd'hui comprise (seule son
// ouverture est lue : en replay, son plus haut et son plus bas ne sont pas encore connus).
export function keyLevels(days, today) {
  const at = new Map(days.map((d) => [d.t0, d]));
  const week = periodStart(today, 'week');
  const month = periodStart(today, 'month');
  const prevMonth = periodStart(month - DAY, 'month');
  const range = (from, to) => {
    const list = days.filter((d) => d.t0 >= from && d.t0 < to);
    if (!list.length) return null;
    return { hi: Math.max(...list.map((d) => d.h)), lo: Math.min(...list.map((d) => d.l)) };
  };
  const prevDay = at.get(today - DAY);
  return {
    day: today,
    dayOpen: at.get(today)?.o ?? null,
    weekOpen: at.get(week)?.o ?? null,
    monthOpen: at.get(month)?.o ?? null,
    prevDay: prevDay ? { hi: prevDay.h, lo: prevDay.l } : null,
    prevWeek: range(week - 7 * DAY, week),
    prevMonth: range(prevMonth, month),
    starts: { week, month },
  };
}

// Lignes à tracer : [clé, libellé, prix, début (heure)], selon le choix `show`. Chaque niveau part
// du début de la période où il sert (hauts et bas de la veille : 00:00 ; de la semaine précédente :
// lundi ; du mois précédent : le 1er).
export function levelLines(k, show = 'all') {
  if (!k) return [];
  const out = [];
  if (show !== 'prev') {
    if (k.weekOpen !== null) out.push(['wo', 'Ouv. S', k.weekOpen, k.starts.week]);
    if (k.monthOpen !== null) out.push(['mo', 'Ouv. M', k.monthOpen, k.starts.month]);
  }
  if (show !== 'opens') {
    for (const [key, label, r, t] of [['d', 'J-1', k.prevDay, k.day], ['w', 'S-1', k.prevWeek, k.starts.week], ['m', 'M-1', k.prevMonth, k.starts.month]]) {
      if (r) out.push([`${key}h`, `Haut ${label}`, r.hi, t], [`${key}l`, `Bas ${label}`, r.lo, t]);
    }
  }
  return out;
}
