// Autres plateformes (Bybit, OKX) pour le CVD multi-plateformes : trades publics du même
// perpétuel USDT, résumés en volumes acheteur et vendeur agressifs par minute, gardés 3 jours en
// mémoire. Pas d'historique : seulement depuis le lancement de la session (ces plateformes ne
// publient pas gratuitement le côté agresseur passé à la minute).
// Docs : https://bybit-exchange.github.io/docs/v5/websocket/public/trade
//        https://www.okx.com/docs-v5/en/#public-data-websocket-trades-channel
import { EventEmitter } from 'node:events';

const MINUTE = 60_000;
const KEEP = 3 * 1440; // minutes gardées
export const VENUE_NAMES = { bybit: 'Bybit', okx: 'OKX' };

// Trades { t, q (en actif de base), side (1 achat agresseur, -1 vente) } d'un message Bybit.
export function parseBybit(msg) {
  if (!msg?.topic?.startsWith('publicTrade.') || !Array.isArray(msg.data)) return [];
  return msg.data.map((d) => ({ t: Number(d.T), q: Number(d.v), side: d.S === 'Buy' ? 1 : -1 }));
}

// Idem pour OKX : la taille est en contrats, convertie avec la valeur d'un contrat (ctVal).
export function parseOkx(msg, ctVal) {
  if (msg?.arg?.channel !== 'trades' || !Array.isArray(msg.data)) return [];
  return msg.data.map((d) => ({ t: Number(d.ts), q: Number(d.sz) * ctVal, side: d.side === 'buy' ? 1 : -1 }));
}

// Refus d'abonnement (symbole absent de la plateforme).
export function subscribeError(venue, msg) {
  if (venue === 'bybit') return msg?.op === 'subscribe' && msg.success === false ? msg.ret_msg ?? 'refusé' : null;
  return msg?.event === 'error' ? msg.msg ?? 'refusé' : null;
}

// Volumes par minute : minute -> { bybit: [achats, ventes], okx: [achats, ventes] }.
export class MinuteBook {
  constructor() {
    this.rows = new Map();
    this.since = null;
  }

  add(venue, { t, q, side }) {
    if (!(q > 0) || !Number.isFinite(t)) return;
    const m = Math.floor(t / MINUTE) * MINUTE;
    const row = this.rows.get(m) ?? {};
    const v = (row[venue] ??= [0, 0]);
    v[side > 0 ? 0 : 1] += q;
    this.rows.set(m, row);
    this.since ??= m;
    if (this.rows.size > KEEP + 60) {
      const old = [...this.rows.keys()].sort((a, b) => a - b).slice(0, this.rows.size - KEEP);
      for (const k of old) this.rows.delete(k);
      this.since = Math.min(...this.rows.keys());
    }
  }

  // Lignes [minute, achats Bybit, ventes Bybit, achats OKX, ventes OKX] de [from, to].
  range(from, to) {
    const out = [];
    for (const [m, r] of this.rows) {
      if (m < from || m > to) continue;
      out.push([m, ...(r.bybit ?? [0, 0]), ...(r.okx ?? [0, 0])].map((x) => Math.round(x * 1000) / 1000));
    }
    return out.sort((a, b) => a[0] - b[0]);
  }
}

const SOCKETS = {
  bybit: { url: 'wss://stream.bybit.com/v5/public/linear', inst: (b) => `${b}USDT`, sub: (i) => ({ op: 'subscribe', args: [`publicTrade.${i}`] }), ping: JSON.stringify({ op: 'ping' }) },
  okx: { url: 'wss://ws.okx.com:8443/ws/v5/public', inst: (b) => `${b}-USDT-SWAP`, sub: (i) => ({ op: 'subscribe', args: [{ channel: 'trades', instId: i }] }), ping: 'ping' },
};

// Connexions aux deux plateformes pour un symbole Binance (« BTCUSDT »), reconnexion automatique.
export class VenueFeed extends EventEmitter {
  constructor(symbol) {
    super();
    this.base = symbol.endsWith('USDT') ? symbol.slice(0, -4) : null;
    this.book = new MinuteBook();
    this.status = { bybit: 'connexion…', okx: 'connexion…' };
    this.sockets = new Set();
    this.timers = new Set();
    this.stopped = false;
    this.ctVal = null;
  }

  start() {
    if (!this.base) {
      this.status = { bybit: 'paires USDT seulement', okx: 'paires USDT seulement' };
      return;
    }
    this.#connect('bybit', 1000);
    this.#okx();
  }

  stop() {
    this.stopped = true;
    for (const t of this.timers) clearTimeout(t);
    for (const ws of this.sockets) ws.close();
  }

  #later(fn, ms) {
    const t = setTimeout(() => (this.timers.delete(t), fn()), ms);
    this.timers.add(t);
  }

  // OKX : valeur d'un contrat d'abord (en actif de base), puis connexion.
  async #okx() {
    try {
      const inst = SOCKETS.okx.inst(this.base);
      const res = await fetch(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${inst}`);
      const d = (await res.json()).data?.[0];
      if (!d) {
        this.status.okx = 'symbole absent';
        return;
      }
      this.ctVal = Number(d.ctVal);
      this.#connect('okx', 1000);
    } catch {
      this.status.okx = 'injoignable, nouvel essai dans 1 min';
      if (!this.stopped) this.#later(() => this.#okx(), 60_000);
    }
  }

  #connect(venue, backoff) {
    if (this.stopped) return;
    const def = SOCKETS[venue];
    const ws = new WebSocket(def.url);
    this.sockets.add(ws);
    let ping = null;
    ws.onopen = () => {
      ws.send(JSON.stringify(def.sub(def.inst(this.base))));
      this.status[venue] = 'connecté';
      backoff = 1000;
      ping = setInterval(() => ws.readyState === 1 && ws.send(def.ping), 20_000);
    };
    ws.onmessage = (ev) => {
      if (ev.data === 'pong') return;
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      const err = subscribeError(venue, msg);
      if (err) {
        this.status[venue] = `symbole absent (${err})`;
        ws.close();
        return;
      }
      const trades = venue === 'bybit' ? parseBybit(msg) : parseOkx(msg, this.ctVal);
      for (const tr of trades) this.book.add(venue, tr);
    };
    ws.onerror = () => {}; // `close` suit toujours une erreur
    ws.onclose = () => {
      clearInterval(ping);
      this.sockets.delete(ws);
      if (this.stopped || this.status[venue].startsWith('symbole absent')) return;
      this.status[venue] = 'déconnecté, reconnexion…';
      this.#later(() => this.#connect(venue, Math.min(backoff * 2, 60_000)), backoff);
    };
  }
}
