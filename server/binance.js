// Flux Binance : maintient un carnet local synchronisé (snapshot REST + diffs WS)
// et relaie les trades agrégés.
// Procédure officielle : https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
import { EventEmitter } from 'node:events';
import { OrderBook } from './orderbook.js';
import { ENDPOINTS } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BinanceFeed extends EventEmitter {
  constructor({ market, symbol }) {
    super();
    this.market = market;
    this.symbol = symbol;
    this.ep = ENDPOINTS[market];
    if (!this.ep) throw new Error(`Marché inconnu : ${market}`);
    this.book = new OrderBook();
    this.synced = false;
    this.buffer = [];
    this.prevU = null; // dernier `u` appliqué (contrôle de continuité futures)
    this.generation = 0; // invalide une resynchronisation devenue obsolète
    this.sockets = new Set();
    this.stopped = false;
  }

  // Ferme les connexions sans reconnexion (changement de symbole).
  stop() {
    this.stopped = true;
    this.generation++;
    for (const ws of this.sockets) ws.close();
  }

  start() {
    const s = this.symbol.toLowerCase();
    this.#connect(`${this.ep.depthWs}?streams=${s}@depth@100ms`, 'depth');
    this.#connect(`${this.ep.tradeWs}?streams=${s}@aggTrade`, 'trades');
  }

  // Une connexion par flux ; reconnexion automatique, resynchro du carnet si c'est la profondeur.
  #connect(url, name) {
    if (this.stopped) return;
    const ws = new WebSocket(url);
    this.sockets.add(ws);
    ws.onopen = () => {
      this.emit('status', `${name} connected`);
      if (name === 'depth') this.#resync();
    };
    ws.onmessage = (ev) => this.#onMessage(JSON.parse(ev.data).data);
    ws.onerror = () => {}; // `close` suit toujours une erreur
    ws.onclose = () => {
      this.sockets.delete(ws);
      if (this.stopped) return;
      if (name === 'depth') {
        this.synced = false;
        this.generation++;
      }
      this.emit('status', `${name} disconnected`);
      setTimeout(() => this.#connect(url, name), 2000);
    };
  }

  #onMessage(data) {
    if (data.e === 'aggTrade') {
      // m = true : l'acheteur est maker, donc le vendeur est l'agresseur.
      this.emit('trade', { t: data.T, p: Number(data.p), q: Number(data.q), side: data.m ? -1 : 1, id: data.a });
    } else if (data.e === 'depthUpdate') {
      if (this.synced) this.#applyDiff(data);
      else this.buffer.push(data);
    }
  }

  async #resync() {
    const gen = ++this.generation;
    this.synced = false;
    this.buffer = [];
    this.emit('status', 'syncing');

    let snap;
    for (;;) {
      // Attend les premiers diffs : un snapshot coûte cher en poids d'API (250 en spot).
      await sleep(500);
      if (gen !== this.generation) return;
      if (this.buffer.length === 0) continue;
      try {
        const res = await fetch(`${this.ep.rest}?symbol=${this.symbol}&limit=${this.ep.limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        snap = await res.json();
      } catch (err) {
        this.emit('status', `snapshot error: ${err.message}`);
        await sleep(2000);
        continue;
      }
      if (gen !== this.generation) return;
      // Le snapshot doit être postérieur au premier diff bufferisé.
      if (this.buffer.length > 0 && snap.lastUpdateId >= this.buffer[0].U) break;
    }

    this.book.loadSnapshot(snap);
    this.prevU = null;
    const pending = this.buffer;
    this.buffer = [];
    this.synced = true;
    for (const e of pending) {
      if (!this.#applyDiff(e)) return;
    }
    this.emit('status', 'synced');
  }

  // Applique un diff ; retourne false si une rupture de séquence impose une resync.
  #applyDiff(e) {
    const id = this.book.lastUpdateId;
    if (this.market === 'spot') {
      if (e.u <= id) return true; // déjà inclus dans le snapshot
      if (e.U > id + 1) return this.#gap();
    } else {
      if (e.u < id) return true;
      const continuous = this.prevU === null ? e.U <= id && e.u >= id : e.pu === this.prevU;
      if (!continuous) return this.#gap();
    }
    this.book.applyDiff(e);
    this.prevU = e.u;
    return true;
  }

  #gap() {
    this.emit('status', 'gap detected, resyncing');
    this.#resync();
    return false;
  }
}
