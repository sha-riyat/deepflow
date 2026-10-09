// Magasin de trades : assemble l'historique complet d'un symbole.
//  - jours passés : archive Binance Vision (cache disque), sinon API REST ;
//  - jour du démarrage : rattrapage REST de minuit jusqu'au premier trade direct,
//    heure par heure en partant de la plus récente ;
//  - depuis le démarrage : trades reçus en direct (ou rejoués).
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { Trades } from './trades.js';
import { fetchVisionDay } from './vision.js';

export const DAY = 86_400_000;
const HOUR = 3_600_000;
const MAX_CACHED_DAYS = 4;
export const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

export class TradeStore extends EventEmitter {
  constructor({ market, symbol, dir, rest, offline = false }) {
    super();
    Object.assign(this, { market, symbol, rest, offline });
    this.dir = path.join(dir, 'cache', market, symbol);
    this.live = new Trades(1 << 16);
    this.liveStart = null;
    this.back = new Map(); // début d'heure -> Trades (avant le direct)
    this.backFrom = null; // minuit UTC du jour de démarrage
    this.memStart = null; // tout est en mémoire de memStart à maintenant
    this.backfill = { done: 0, total: 0, error: null };
    this.days = new Map();
    this.pending = new Map();
    this.stopped = false;
  }

  appendLive(t, p, q, s, id) {
    if (this.liveStart === null) {
      this.liveStart = t;
      this.memStart = t;
      this.backFrom = Math.floor(t / DAY) * DAY;
      if (!this.offline) this.#runBackfill();
    }
    this.live.push(t, p, q, s, id);
  }

  stop() {
    this.stopped = true;
  }

  status() {
    return {
      memStart: this.memStart,
      backFrom: this.backFrom,
      backfill: this.backfill,
      loading: [...this.pending.keys()],
    };
  }

  // Trades de [from, to), limités à `maxDays` jours. `partial` signale un trou en cours de rattrapage.
  async getRange(from, to, { maxDays = 3 } = {}) {
    from = Math.max(from, to - maxDays * DAY);
    if (this.memStart === null) return { trades: new Trades(1), partial: true };
    const parts = [];
    let partial = false;
    if (from < this.memStart) {
      if (this.offline) partial = true;
      else if (to > this.backFrom && this.memStart > this.backFrom) {
        // Trou du jour encore en rattrapage : on ne renvoie pas les jours antérieurs, sinon le
        // client les placerait avant ce trou et ne pourrait plus le combler.
        partial = true;
      } else {
        for (let d = Math.floor(from / DAY) * DAY; d < Math.min(to, this.backFrom); d += DAY) {
          const day = await this.day(d);
          parts.push(day.slice(Math.max(from, d), Math.min(to, d + DAY)));
        }
      }
    }
    parts.push(this.#memory(Math.max(from, this.memStart), to));
    return { trades: Trades.concat(parts), partial };
  }

  #memory(from, to) {
    if (to <= from) return new Trades(1);
    const hours = [...this.back.keys()].filter((h) => h + HOUR > from && h < to).sort((a, b) => a - b);
    return Trades.concat([...hours.map((h) => this.back.get(h).slice(from, to)), this.live.slice(from, to)]);
  }

  // Un jour complet (antérieur au démarrage), dédupliqué si plusieurs requêtes l'attendent.
  day(d) {
    if (this.days.has(d)) {
      const v = this.days.get(d);
      this.days.delete(d);
      this.days.set(d, v); // ordre LRU
      return Promise.resolve(v);
    }
    if (!this.pending.has(d)) {
      const p = this.#loadDay(d).finally(() => this.pending.delete(d));
      this.pending.set(d, p);
      this.emit('progress', this.status());
    }
    return this.pending.get(d);
  }

  async #loadDay(d) {
    const key = dayKey(d);
    const file = path.join(this.dir, `${key}.bin`);
    let trades;
    if (fs.existsSync(file)) trades = Trades.fromBuffer(fs.readFileSync(file));
    else {
      trades = await fetchVisionDay(this.market, this.symbol, key);
      if (!trades) trades = await this.#restRange(d, d + DAY); // archive pas encore publiée
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(file, trades.toBuffer());
    }
    this.days.set(d, trades);
    while (this.days.size > MAX_CACHED_DAYS) this.days.delete(this.days.keys().next().value);
    this.emit('progress', this.status());
    return trades;
  }

  async #restRange(from, to) {
    const out = new Trades(1 << 14);
    await this.rest.aggTrades(this.symbol, from, to, (rows) => {
      for (const r of rows) out.push(r.T, Number(r.p), Number(r.q), r.m ? -1 : 1, r.a);
    });
    return out;
  }

  // Rattrapage du jour de démarrage, de l'heure la plus récente vers minuit.
  async #runBackfill() {
    const hours = [];
    for (let h = Math.floor(this.liveStart / HOUR) * HOUR; h >= this.backFrom; h -= HOUR) hours.push(h);
    this.backfill = { done: 0, total: hours.length, error: null };
    for (const h of hours) {
      for (let attempt = 0; ; attempt++) {
        if (this.stopped) return;
        try {
          this.back.set(h, await this.#restRange(h, Math.min(h + HOUR, this.liveStart)));
          break;
        } catch (err) {
          if (attempt >= 3) {
            this.backfill.error = err.message;
            this.emit('progress', this.status());
            return;
          }
          await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        }
      }
      this.memStart = h;
      this.backfill.done++;
      this.emit('progress', this.status());
    }
  }
}
