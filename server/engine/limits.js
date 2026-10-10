// Garde-fous du cours : fenêtres horaires de trading et limites de risque (par jour, semaine, mois).
// Les fenêtres sont exprimées en heure locale de chaque place (Londres, New York) : le passage
// heure d'été / heure d'hiver est donc suivi automatiquement (07:00 UTC l'été à Londres, 08:00 l'hiver).

const DAY = 86_400_000;

// Heure locale (minutes depuis minuit) et jour de semaine (0 = dimanche) dans un fuseau donné.
function localClock(t, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(new Date(t));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { minutes: Number(get('hour')) * 60 + Number(get('minute')), weekday: days[get('weekday')] };
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Fenêtre active à l'instant t, ou null. windows = [{ name, tz, from: 'HH:MM', to: 'HH:MM' }].
export function activeWindow(t, windows, { weekends = false } = {}) {
  for (const w of windows) {
    const { minutes, weekday } = localClock(t, w.tz);
    if (!weekends && (weekday === 0 || weekday === 6)) continue;
    if (minutes >= toMin(w.from) && minutes < toMin(w.to)) return w;
  }
  return null;
}

// Début (UTC) du jour, de la semaine (lundi) et du mois contenant t.
function periodStarts(t) {
  const d = new Date(t);
  const day = Math.floor(t / DAY) * DAY;
  const week = day - ((d.getUTCDay() + 6) % 7) * DAY;
  const month = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  return { day, week, month };
}

// Raison de refuser un nouveau trade à l'instant t, ou null. history = signaux clôturés
// ({ t, resultR, pnlUsd }), active = signal en cours éventuel.
export function riskGate(history, active, t, risk) {
  const L = risk.limits;
  if (!L) return null;
  if (active) return 'un trade est déjà en cours';
  const { day, week, month } = periodStarts(t);
  const since = (t0) => history.filter((s) => s.t >= t0);
  const pnlPct = (list) => (list.reduce((a, s) => a + (s.pnlUsd ?? 0), 0) / risk.equity) * 100;
  const today = since(day);
  if (today.length >= L.tradesPerDay) return `${today.length} trades déjà pris aujourd'hui (limite ${L.tradesPerDay})`;
  const losses = today.filter((s) => s.resultR < 0).length;
  if (losses >= L.lossesPerDay) return `${losses} pertes aujourd'hui (limite ${L.lossesPerDay})`;
  if (pnlPct(today) <= -L.dayPct) return `perte du jour ≥ ${L.dayPct} % du capital`;
  if (pnlPct(since(week)) <= -L.weekPct) return `perte de la semaine ≥ ${L.weekPct} % : pause jusqu'à lundi`;
  if (pnlPct(since(month)) <= -L.monthPct) return `perte du mois ≥ ${L.monthPct} % : retour en démo conseillé`;
  return null;
}
