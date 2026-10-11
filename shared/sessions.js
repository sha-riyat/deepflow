// Repères horaires des marchés crypto, en UTC : ouverture de la Bourse de New York (9 h 30 à New
// York, du lundi au vendredi, heure d'été américaine comprise ; jours fériés non gérés) et heures
// de financement des perpétuels Binance (toutes les 8 h : 0 h, 8 h et 16 h UTC) ; périodes jour /
// semaine / mois ; sessions Asie, Londres et New York.
const DAY = 86_400_000;
const HOUR = 3_600_000;
export const FUNDING_HOURS = [0, 8, 16];

// Début de la période UTC contenant `t` : jour (00:00), semaine (lundi 00:00, comme Binance) ou
// mois (le 1er à 00:00). Sert au VWAP par période et aux niveaux d'ouverture.
export const PERIODS = ['day', 'week', 'month'];
const MONDAY = 4 * DAY; // 1970-01-01 était un jeudi : premier lundi le 5 janvier

export function periodStart(t, period = 'day') {
  if (period === 'week') return Math.floor((t - MONDAY) / (7 * DAY)) * 7 * DAY + MONDAY;
  if (period === 'month') {
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  }
  return Math.floor(t / DAY) * DAY;
}

// Début de la période suivante.
export function periodEnd(t, period = 'day') {
  const s = periodStart(t, period);
  if (period === 'week') return s + 7 * DAY;
  if (period === 'month') {
    const d = new Date(s);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  return s + DAY;
}

// Dimanche n° `n` du mois `month` (0 = janvier) à 00:00 UTC.
function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return Date.UTC(year, month, 1 + ((7 - first) % 7) + 7 * (n - 1));
}

// Heure d'été américaine pour le jour UTC `day` : du 2e dimanche de mars au 1er dimanche de novembre.
export function usDst(day) {
  const y = new Date(day).getUTCFullYear();
  return day >= nthSunday(y, 2, 2) && day < nthSunday(y, 10, 1);
}

// Ouverture de New York du jour UTC `day` (null le week-end) : 13 h 30 UTC en été, 14 h 30 en hiver.
export function nyOpen(day) {
  const d = Math.floor(day / DAY) * DAY;
  const wd = new Date(d).getUTCDay();
  if (wd === 0 || wd === 6) return null;
  return d + 9.5 * HOUR + (usDst(d) ? 4 : 5) * HOUR;
}

// Repères de [from, to] : { t, kind: 'ny' | 'funding' }, triés.
export function timeMarkers(from, to, { ny = true, funding = true } = {}) {
  const out = [];
  for (let d = Math.floor(from / DAY) * DAY; d <= to; d += DAY) {
    if (funding) for (const h of FUNDING_HOURS) out.push({ t: d + h * HOUR, kind: 'funding' });
    const o = ny ? nyOpen(d) : null;
    if (o !== null) out.push({ t: o, kind: 'ny' });
  }
  return out.filter((m) => m.t >= from && m.t <= to).sort((a, b) => a.t - b.t);
}

// Prochain repère de chaque sorte strictement après `now` (pour la légende) : à l'heure pile, le
// repère qui vient de passer ne compte plus.
export function nextMarkers(now, opts) {
  const list = timeMarkers(now + 1, now + 4 * DAY, opts);
  return { ny: list.find((m) => m.kind === 'ny')?.t ?? null, funding: list.find((m) => m.kind === 'funding')?.t ?? null };
}

// Heure d'été britannique pour le jour UTC `day` : du dernier dimanche de mars au dernier dimanche
// d'octobre (changement à 01:00 UTC, compté à partir du jour même).
function lastSunday(year, month) {
  const last = new Date(Date.UTC(year, month + 1, 0));
  return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay());
}

export function ukDst(day) {
  const y = new Date(day).getUTCFullYear();
  return day >= lastSunday(y, 2) && day < lastSunday(y, 9);
}

// Sessions des marchés traditionnels, heures de bureau locales (convention du forex) : Asie
// (Tokyo 9 h – 18 h, pas d'heure d'été), Londres (8 h – 17 h) et New York (8 h – 17 h), du lundi
// au vendredi. Le crypto ne ferme jamais, mais la liquidité suit ces horaires.
export const MARKET_SESSIONS = ['asia', 'london', 'ny'];

export function sessionHours(day, kind) {
  if (kind === 'asia') return [0, 9];
  if (kind === 'london') return ukDst(day) ? [7, 16] : [8, 17];
  return usDst(day) ? [12, 21] : [13, 22];
}

// Session de l'instant t : 'ny', 'london' ou 'asia' (New York l'emporte sur Londres pendant leur
// chevauchement), 'off' hors des heures de bureau et le week-end.
const hoursOfDay = new Map();
export function sessionAt(t) {
  const d = Math.floor(t / DAY) * DAY;
  let hours = hoursOfDay.get(d);
  if (!hours) {
    const wd = new Date(d).getUTCDay();
    hours = wd === 0 || wd === 6 ? [] : ['ny', 'london', 'asia'].map((kind) => [kind, ...sessionHours(d, kind)]);
    if (hoursOfDay.size > 400) hoursOfDay.clear();
    hoursOfDay.set(d, hours);
  }
  const h = (t - d) / HOUR;
  for (const [kind, h0, h1] of hours) if (h >= h0 && h < h1) return kind;
  return 'off';
}

// Sessions qui touchent [from, to] : { kind, t0, t1 }, triées par début.
export function marketSessions(from, to, kinds = MARKET_SESSIONS) {
  const out = [];
  for (let d = Math.floor(from / DAY) * DAY; d <= to; d += DAY) {
    const wd = new Date(d).getUTCDay();
    if (wd === 0 || wd === 6) continue;
    for (const kind of kinds) {
      const [h0, h1] = sessionHours(d, kind);
      const t0 = d + h0 * HOUR;
      const t1 = d + h1 * HOUR;
      if (t1 > from && t0 <= to) out.push({ kind, t0, t1 });
    }
  }
  return out.sort((a, b) => a.t0 - b.t0);
}

// Découpe de [from, to] en séances qui ne se chevauchent pas, pour les profils par séance : dans un
// chevauchement, la séance qui ouvre le plus tard l'emporte (comme sessionAt). Hors des heures de
// bureau et le week-end, pas de séance. { kind, t0, t1 }, triées par début.
export function sessionSegments(from, to) {
  const out = [];
  for (let d = Math.floor(from / DAY) * DAY; d <= to; d += DAY) {
    const wd = new Date(d).getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const cuts = [...new Set(MARKET_SESSIONS.flatMap((k) => sessionHours(d, k)))].sort((a, b) => a - b);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const kind = sessionAt(d + ((cuts[i] + cuts[i + 1]) / 2) * HOUR);
      if (kind === 'off') continue;
      const t0 = d + cuts[i] * HOUR;
      const t1 = d + cuts[i + 1] * HOUR;
      const last = out[out.length - 1];
      if (last && last.kind === kind && last.t1 === t0) last.t1 = t1;
      else out.push({ kind, t0, t1 });
    }
  }
  return out.filter((s) => s.t1 > from && s.t0 <= to);
}

// Plus haut et plus bas de chaque session d'après les bougies qui y commencent ; sessions sans
// bougie écartées. `done` : session terminée à `now`.
export function sessionRanges(bars, list, now) {
  const out = [];
  for (const s of list) {
    let hi = -Infinity;
    let lo = Infinity;
    for (const b of bars) {
      if (b.t0 < s.t0 || b.t0 >= s.t1) continue;
      if (b.h > hi) hi = b.h;
      if (b.l < lo) lo = b.l;
    }
    if (hi >= lo) out.push({ ...s, hi, lo, done: now >= s.t1 });
  }
  return out;
}
