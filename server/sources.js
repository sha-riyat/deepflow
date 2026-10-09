// Sources de frames : direct (Binance) ou replay d'un enregistrement.
// Une frame = { t, bid, ask, r0, b, a, tr } : carnet regroupé + trades [prix, qté, côté, temps, id].
// Les deux sources émettent aussi 'trade' pour chaque trade (y compris carnet non synchronisé).
import { EventEmitter } from 'node:events';
import { BinanceFeed } from './binance.js';
import { readRecording } from './recorder.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class LiveSource extends EventEmitter {
  constructor(cfg) {
    super();
    this.cfg = cfg;
    this.feed = new BinanceFeed(cfg);
    this.trades = [];
  }

  start() {
    this.feed.on('trade', (t) => {
      this.trades.push([t.p, t.q, t.side, t.t, t.id]);
      this.emit('trade', t);
    });
    this.feed.on('status', (s) => this.emit('status', s));
    this.feed.start();
    this.timer = setInterval(() => this.#tick(), this.cfg.frameMs);
  }

  stop() {
    clearInterval(this.timer);
    this.feed.stop();
  }

  // Carnet détaillé pour le DOM (null tant qu'il n'est pas synchronisé).
  ladder(bucket, levels) {
    return this.feed.synced ? this.feed.book.ladder(bucket, levels) : null;
  }

  #tick() {
    const { feed, cfg } = this;
    if (!feed.synced) {
      this.trades = [];
      return;
    }
    const bid = feed.book.bestBid();
    const ask = feed.book.bestAsk();
    if (bid === null || ask === null) return;
    const { r0, b, a } = feed.book.grouped(cfg.bucket, (bid + ask) / 2, cfg.rangeBuckets);
    const frame = { t: Date.now(), bid, ask, r0, b, a, tr: this.trades };
    this.trades = [];
    this.emit('frame', frame);
  }
}

export class ReplaySource extends EventEmitter {
  constructor(file, speed) {
    super();
    this.file = file;
    this.speed = speed;
  }

  async start() {
    this.emit('status', `replay ×${this.speed}`);
    let prevT = null;
    for await (const obj of readRecording(this.file)) {
      if (this.stopped) return;
      if (obj.meta) continue;
      if (prevT !== null && this.speed > 0) await sleep((obj.t - prevT) / this.speed);
      prevT = obj.t;
      for (const [p, q, side, T, id] of obj.tr) this.emit('trade', { t: T, p, q, side, id: id ?? -1 });
      this.emit('frame', obj);
    }
    this.emit('status', 'replay terminé');
  }

  stop() {
    this.stopped = true;
  }

  ladder() {
    return null;
  }
}
