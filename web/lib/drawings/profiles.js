// Profils de volume à plage fixe (outil de dessin) : demandés au collecteur (profil d'une plage,
// 3 jours au plus) et gardés en mémoire. Une plage qui touche le direct est rafraîchie toutes les
// 15 s ; un résultat incomplet (historique en cours de téléchargement) ou en erreur est redemandé
// après 15 s. Pendant qu'on déplace ou étire le dessin, son dernier profil reste affiché.
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

  // Résultat pour un dessin : { session, partial, clipped, after } | { error } | { loading: true }. `after` :
  // profil de la fin de la plage jusqu'à maintenant (pour l'état d'acceptation ou de rejet), demandé
  // seulement si le dessin prolonge ses niveaux et que la plage est terminée.
  get(d, moving) {
    const [from, end] = [d.pts[0].t, d.pts[1].t].sort((a, b) => a - b);
    const now = clockNow();
    const live = end > now - 60_000;
    const to = live ? now : end;
    const key = `${from}:${live ? `direct${Math.floor(Date.now() / RETRY_MS)}` : end}`; // rafraîchi en heure réelle
    const entry = this.cache.get(key);
    if (entry?.result) {
      this.byId.set(d.id, entry.result);
      return d.style.extend && !live && entry.result.session ? { ...entry.result, after: this.#after(d.id, end, now, entry.result.session.bucket) } : entry.result;
    }
    if (!entry && !moving && to > from) this.#load(key, from, to);
    return this.byId.get(d.id) ?? { loading: true };
  }

  // Profil de [fin de la plage, maintenant], rafraîchi toutes les 15 s, avec la taille de ligne de la plage.
  #after(id, end, now, bucket) {
    const key = `${end}:apres:${bucket}:${Math.floor(Date.now() / RETRY_MS)}`;
    const entry = this.cache.get(key);
    if (entry?.result) return entry.result;
    if (!entry && now > end) this.#load(key, end, now, { bucket });
    return null;
  }

  async #load(key, from, to, size = { rows: 30 }) {
    const entry = {};
    this.cache.set(key, entry);
    if (this.cache.size > 80) this.cache.delete(this.cache.keys().next().value);
    try {
      // `rows` : le collecteur choisit la taille des lignes d'après la hauteur de la plage (≈ 30 lignes) ;
      // `bucket` : taille imposée (profil d'après la plage).
      const q = new URLSearchParams({ mode: 'range', from: Math.floor(from), to: Math.floor(to), ...size, tpo: 30 });
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
