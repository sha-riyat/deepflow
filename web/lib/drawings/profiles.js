// Profils de volume à plage fixe (outil de dessin) : demandés au collecteur (profil d'une plage,
// 3 jours au plus) et gardés en mémoire. Une plage qui touche le direct est rafraîchie toutes les
// 15 s ; un résultat incomplet (historique en cours de téléchargement) ou en erreur est redemandé
// après 15 s. Pendant qu'on déplace ou étire le dessin, son dernier profil reste affiché.
import { profileBucket } from '../chart/requests.js';
import { clockNow } from '../clock.js';

const DAY = 86_400_000;
const MAX_SPAN = 3 * DAY; // limite du collecteur (profil de plage)
const RETRY_MS = 15_000;

export class RangeProfiles {
  constructor(chart) {
    this.chart = chart;
    this.cache = new Map(); // clé de la plage -> { result }
    this.byId = new Map(); // dessin -> dernier résultat affiché
  }

  // Résultat pour un dessin : { session, partial, clipped } | { error } | { loading: true }.
  get(d, moving) {
    const [from, end] = [d.pts[0].t, d.pts[1].t].sort((a, b) => a - b);
    const now = clockNow();
    const live = end > now - 60_000;
    const to = live ? now : end;
    const bucket = profileBucket(this.chart);
    const key = `${from}:${live ? `direct${Math.floor(Date.now() / RETRY_MS)}` : end}:${bucket}`; // rafraîchi en heure réelle
    const entry = this.cache.get(key);
    if (entry?.result) {
      this.byId.set(d.id, entry.result);
      return entry.result;
    }
    if (!entry && !moving && to > from) this.#load(key, from, to, bucket);
    return this.byId.get(d.id) ?? { loading: true };
  }

  async #load(key, from, to, bucket) {
    const entry = {};
    this.cache.set(key, entry);
    if (this.cache.size > 80) this.cache.delete(this.cache.keys().next().value);
    try {
      const q = new URLSearchParams({ mode: 'range', from: Math.floor(from), to: Math.floor(to), bucket, tpo: 30 });
      const res = await fetch(this.chart.data.url(`/api/profile?${q}`));
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      entry.result = { session: body.sessions?.[0] ?? null, partial: Boolean(body.partial), clipped: to - from > MAX_SPAN };
    } catch (err) {
      entry.result = { error: err.message };
    }
    if (entry.result.error || entry.result.partial) setTimeout(() => this.cache.delete(key), RETRY_MS);
    this.chart.invalidate();
  }
}
