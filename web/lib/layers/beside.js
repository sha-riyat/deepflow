// Profils « à côté des bougies » : quand un profil de session ne couvre qu'une ou deux bougies (profil
// du jour en 1J ou 12h, de la semaine en 1S, des séances en 4h), il se confondrait avec elles. Les
// bougies sont alors amincies et décalées vers la gauche de leur créneau, et chaque profil occupe la
// droite du créneau de la dernière bougie de sa période (voir volprofile.js et le rendu dans chart.js).
const DAY = 86_400_000;
const PERIOD_MS = { day: DAY, week: 7 * DAY, sessions: 5 * 3_600_000 }; // séance de bureau la plus courte : 5 h
export const BESIDE_BODY = 0.4; // largeur des bougies (part du créneau) en mode « à côté »
export const BESIDE_SHIFT = 0.25; // décalage des bougies vers la gauche (part du créneau)

// Début et largeur (pixels) du profil dans le créneau d'une bougie dont le centre décalé est `x`.
export function besideBox(x, slot) {
  const start = x + slot * (BESIDE_BODY / 2 + 0.05);
  return { start, width: Math.max(8, slot * (BESIDE_SHIFT + 0.5 - BESIDE_BODY / 2 - 0.07)) };
}

export function profilesBeside({ layers, opts, style }, spec) {
  const { range = 'day', place = 'auto' } = opts.profile ?? {};
  if (!layers.profile || style === 'tpo' || spec.type !== 'time' || place !== 'auto' || !(range in PERIOD_MS)) return false;
  return PERIOD_MS[range] / spec.param <= 2;
}
