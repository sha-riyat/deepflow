// Profils par séance (Asie, Londres, New York) : un profil de volume par séance de bureau, sur les
// derniers jours (voir sessionSegments). Les séances finies sont gardées en cache. Comme pour les
// profils journaliers, un jour d'archive pas encore téléchargé est demandé en tâche de fond et
// la séance n'est renvoyée qu'une fois ses données là.
import { SessionProfiler } from '../shared/profile.js';
import { sessionSegments } from '../shared/sessions.js';

const DAY = 86_400_000;
export const SESSION_DAYS = 7;
const cache = new WeakMap();

export async function sessionProfiles(s, { to, bucket, tpoMs, from }) {
  const start = Math.max(from, Math.floor(to / DAY) * DAY - (SESSION_DAYS - 1) * DAY);
  const now = s.now();
  const store = s.store;
  if (!cache.has(store)) cache.set(store, new Map());
  const done = cache.get(store);
  const sessions = [];
  let partial = false;
  for (const seg of sessionSegments(start, to)) {
    const key = `${bucket}:${tpoMs}:${seg.t0}`;
    const finished = seg.t1 <= now;
    if (finished && done.has(key)) {
      sessions.push(done.get(key));
      continue;
    }
    const day = Math.floor(seg.t0 / DAY) * DAY;
    if (store.backFrom !== null && day < store.backFrom && !store.hasDay(day)) {
      partial = true;
      if (!store.offline) store.day(day).catch(() => {});
      continue;
    }
    const prof = new SessionProfiler(bucket, { tpoMs, range: [seg.t0, seg.t1] });
    const part = await store.forEachChunk(seg.t0, Math.min(seg.t1, to), { maxDays: 1 }, (t) => {
      for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
    });
    const [profile] = prof.list();
    if (!profile) continue;
    const session = { ...profile, kind: seg.kind };
    if (finished && !part) done.set(key, session);
    partial ||= part;
    sessions.push(session);
  }
  return { bucket, partial, sessions };
}
