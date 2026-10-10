// Sessions du collecteur : une par marché et symbole suivis en direct (clé « futures:BTCUSDT »),
// démarrée à la première demande et arrêtée après quelques minutes sans graphique abonné ni alerte
// active sur son symbole ; plus au plus une session de replay des archives (clé « replay »). Un
// collecteur lancé sur un enregistrement (REPLAY=…) n'a qu'une session, servie pour toute clé.
import { Session } from './session.js';
import { Hub } from './hub.js';
import { BinanceRest } from './history/rest.js';

export const MARKETS = ['futures', 'spot'];
export const REPLAY_KEY = 'replay';
const IDLE_MS = 3 * 60_000;
const MAX_LIVE = 8; // sessions directes simultanées (WebSockets, carnets, mémoire)

// { market, symbol } d'une clé directe, { replay: true }, ou null si la clé est invalide.
export function parseKey(key) {
  if (key === REPLAY_KEY) return { replay: true };
  const m = /^(futures|spot):([A-Z0-9]{2,20})$/.exec(String(key ?? ''));
  return m ? { market: m[1], symbol: m[2] } : null;
}

export class Sessions {
  constructor(cfg, alerts, { rests = null, SessionClass = Session } = {}) {
    this.cfg = cfg;
    this.alerts = alerts;
    this.SessionClass = SessionClass;
    this.rests = rests ?? Object.fromEntries(MARKETS.map((m) => [m, new BinanceRest(m)]));
    this.map = new Map();
    this.recording = null; // collecteur lancé sur un enregistrement
    this.defaultKey = `${cfg.market}:${cfg.symbol}`;
    this.timer = setInterval(() => this.gc(), 30_000);
    this.timer.unref?.();
  }

  // Session d'une clé ; une session directe absente est démarrée (null pour un replay absent).
  get(key = this.defaultKey) {
    if (this.recording) return this.recording;
    const k = parseKey(key);
    if (!k) throw new Error(`session invalide : ${key}`);
    if (k.replay) return this.map.get(REPLAY_KEY) ?? null;
    let s = this.map.get(key);
    if (!s) {
      if (this.live().length >= MAX_LIVE) throw new Error(`au plus ${MAX_LIVE} symboles suivis à la fois`);
      s = this.#create(key, k.market);
      s.start(k.symbol).catch((err) => s.hub.state('status', `démarrage impossible : ${err.message}`));
    }
    return s;
  }

  live() {
    return [...this.map.entries()].filter(([k]) => k !== REPLAY_KEY).map(([, s]) => s);
  }

  // Replay des archives : remplace le replay en cours. La session (et son flux) existe tout de
  // suite ; le chargement de l'archive se fait en tâche de fond, avec son état diffusé.
  startReplay({ market, symbol, from, speed }) {
    this.stopReplay();
    const s = this.#create(REPLAY_KEY, market);
    s.start(symbol, { from, speed }).catch((err) => s.hub.state('status', `replay impossible : ${err.message}`));
    return s;
  }

  stopReplay() {
    const s = this.map.get(REPLAY_KEY);
    if (!s) return;
    s.stop();
    this.map.delete(REPLAY_KEY);
  }

  // Événement pour tous les navigateurs (déclenchement d'alerte, liste des alertes).
  event(name, value) {
    for (const s of this.#all()) s.hub.event(name, value);
  }

  state(name, value) {
    for (const s of this.#all()) s.hub.state(name, value);
  }

  // Arrête les sessions inutilisées : sans abonné depuis IDLE_MS, sans alerte active sur le symbole.
  gc(now = Date.now()) {
    for (const [key, s] of this.map) {
      const idle = s.hub.idleSince !== null && now - s.hub.idleSince > IDLE_MS;
      const watched = key !== REPLAY_KEY && this.alerts.items.some((a) => a.enabled && a.symbol === s.cfg.symbol);
      if (!idle || watched || key === this.defaultKey) continue;
      s.stop();
      this.map.delete(key);
    }
  }

  // Les alertes actives sont surveillées même sans graphique ouvert sur leur symbole.
  watchAlerts() {
    for (const a of this.alerts.items) {
      if (!a.enabled || this.recording) continue;
      try {
        this.get(`futures:${a.symbol}`);
      } catch {
        // trop de sessions : l'alerte sera évaluée quand un graphique suivra ce symbole
      }
    }
  }

  #all() {
    return this.recording ? [this.recording] : [...this.map.values()];
  }

  #create(key, market) {
    const cfg = { ...this.cfg, market, footprint: { ...this.cfg.footprint } };
    const s = new this.SessionClass(cfg, { mode: 'live', rest: this.rests[market], hub: new Hub(), alerts: this.alerts });
    s.key = key;
    this.map.set(key, s);
    return s;
  }
}
