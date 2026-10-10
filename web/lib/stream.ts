// Flux SSE unique de la fenêtre : les navigateurs limitent les connexions par site, donc une seule
// connexion porte toutes les sessions suivies par les graphiques (`/stream?s=clé1,clé2`), leurs
// événements préfixés par la clé (« futures:BTCUSDT|tick »). Quand l'ensemble des clés change, le
// flux est rouvert ; chaque session renvoie alors son état et ses derniers ticks (les graphiques
// ignorent ceux déjà reçus). Un graphique qui rejoint une session déjà suivie reçoit tout de suite
// son dernier état connu (métadonnées, statut…), le flux n'étant pas rouvert.
type Handler = (name: string, data: unknown) => void;

const EVENTS = ['reset', 'meta', 'status', 'tick', 'dom', 'history', 'mark', 'alerts', 'alert', 'replay'];
const GLOBAL = new Set(['alerts', 'alert']); // communs à toutes les sessions
const STATE = new Set(['meta', 'status', 'history', 'mark', 'replay']); // dernier état, gardé par session

class StreamMux {
  private subs = new Map<string, Set<Handler>>();
  private es: EventSource | null = null;
  private keys = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seenAlerts = new Set<string>();
  private latest = new Map<string, Map<string, unknown>>(); // clé -> événement -> dernière valeur
  onGlobal: Handler | null = null; // alertes (une fois, quelle que soit la session qui les relaie)
  onError: (() => void) | null = null;

  subscribe(key: string, fn: Handler): () => void {
    const set = this.subs.get(key) ?? new Set();
    set.add(fn);
    const known = this.latest.get(key);
    if (known) setTimeout(() => set.has(fn) && known.forEach((data, name) => fn(name, data)), 0);
    this.subs.set(key, set);
    this.schedule();
    return () => {
      set.delete(fn);
      if (!set.size) this.subs.delete(key);
      this.schedule();
    };
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), 30);
  }

  private connect() {
    const keys = [...this.subs.keys()].sort();
    const id = keys.join(',');
    if (id === this.keys && this.es) return;
    for (const k of [...this.latest.keys()]) if (!this.subs.has(k)) this.latest.delete(k);
    this.es?.close();
    this.es = null;
    this.keys = id;
    if (!keys.length) return;
    const es = new EventSource(`/stream?s=${encodeURIComponent(id)}`);
    for (const key of keys) {
      for (const name of EVENTS) {
        es.addEventListener(`${key}|${name}`, (e) => {
          const data = JSON.parse((e as MessageEvent).data);
          if (GLOBAL.has(name)) return this.global(name, data);
          this.remember(key, name, data);
          for (const fn of this.subs.get(key) ?? []) fn(name, data);
        });
      }
    }
    es.onerror = () => this.onError?.();
    this.es = es;
  }

  private remember(key: string, name: string, data: unknown) {
    if (name === 'reset') this.latest.delete(key);
    if (!STATE.has(name)) return;
    const known = this.latest.get(key) ?? new Map();
    known.set(name, data);
    this.latest.set(key, known);
  }

  // Un déclenchement d'alerte arrive par chaque session suivie : on ne le traite qu'une fois.
  private global(name: string, data: unknown) {
    if (name === 'alert') {
      const a = data as { id: string; t: number };
      const id = `${a.id}:${a.t}`;
      if (this.seenAlerts.has(id)) return;
      this.seenAlerts.add(id);
      if (this.seenAlerts.size > 500) this.seenAlerts.clear();
    }
    this.onGlobal?.(name, data);
  }
}

export const stream = new StreamMux();
