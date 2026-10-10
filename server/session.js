// Session d'un symbole : flux (direct ou replay), magasin de trades, heatmap, analyse du flux,
// alertes et DOM. `start` remplace le symbole sans redémarrer le serveur.
import { EventEmitter } from 'node:events';
import { loadSymbolInfo } from './symbol.js';
import { LiveSource, ReplaySource } from './sources.js';
import { Recorder } from './recorder.js';
import { Flow } from './flow.js';
import { TradeStore, DAY } from './history/store.js';
import { HeatStore } from './heatstore.js';
import { LiquidationStore } from './liquidations.js';

// Plus petit pas « rond » (1, 2, 2,5, 5 × 10^k) supérieur ou égal à x, et au moins un tick.
export function niceStep(x, tick) {
  const k = 10 ** Math.floor(Math.log10(x));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * k).find((v) => v >= x * 0.999);
  return Number(Math.max(step, tick).toPrecision(6));
}

export class Session extends EventEmitter {
  constructor(cfg, { mode, rest, hub, alerts }) {
    super();
    Object.assign(this, { cfg, mode, rest, hub, alerts });
    this.fixed = { bucket: cfg.bucket, fp: cfg.footprint.bucket };
    this.source = null;
  }

  async start(symbol) {
    this.stop();
    const { cfg } = this;
    cfg.symbol = symbol;
    this.info = await loadSymbolInfo(cfg.market, symbol);
    const price = this.mode === 'live' ? await this.#lastPrice() : null;
    if (price) {
      cfg.bucket = this.fixed.bucket ?? niceStep(price * 0.00005, this.info.tickSize);
      this.domBucket = niceStep(price * 0.00001, this.info.tickSize);
    } else this.domBucket = cfg.bucket;
    cfg.footprint.bucket = this.fixed.fp ?? Number((cfg.bucket * 2).toPrecision(6));

    this.store = new TradeStore({ market: cfg.market, symbol, dir: cfg.dataDir, rest: this.rest, offline: this.mode === 'replay' });
    this.heat = new HeatStore({ bucket: cfg.bucket, hours: cfg.heatHours });
    this.liqs = new LiquidationStore(cfg.dataDir, cfg.market, symbol);
    this.mark = null;
    this.flow = new Flow(cfg.flow, cfg.bucket, cfg.flow.deltaWinMs);
    this.frame = null;
    this.domVol = new Map(); // prix -> [achats, ventes] de la session UTC en cours
    this.domDay = null;
    this.recorder =
      cfg.record && this.mode === 'live'
        ? new Recorder(cfg.dataDir, { symbol, market: cfg.market, bucket: cfg.bucket, frameMs: cfg.frameMs })
        : null;
    this.source = this.mode === 'replay' ? new ReplaySource(cfg.replay, cfg.speed) : new LiveSource(cfg);
    this.#wire();
    this.hub.reset();
    this.hub.setMeta(this.meta());
    this.hub.state('alerts', this.alerts.list());
    this.source.start();
    this.domTimer = setInterval(() => this.#dom(), 250);
    console.log(`session ${this.mode} ${cfg.market} ${symbol} · tranche ${cfg.bucket} · footprint ${cfg.footprint.bucket} · DOM ${this.domBucket}`);
  }

  stop() {
    if (!this.source) return;
    this.source.stop();
    this.store.stop();
    this.recorder?.close();
    clearInterval(this.domTimer);
    this.source.removeAllListeners();
    this.source = null;
  }

  // Instantané du flux en direct (panneau Flux, API /api/state).
  state() {
    const { flow, frame: f } = this;
    return {
      symbol: this.cfg.symbol,
      market: this.cfg.market,
      t: f?.t ?? null,
      price: f ? { bid: f.bid, ask: f.ask } : null,
      warmup: !flow.ready,
      warmupPct: Math.min(100, Math.round((flow.spanMs / this.cfg.flow.lookbackMs) * 100)),
      flow: {
        cvd: flow.cvd,
        imbalance: flow.imb,
        vwap: flow.vwap,
        deltaZ: flow.deltaZ(),
        bigPrintThreshold: Number.isFinite(flow.bigThreshold) ? flow.bigThreshold : null,
        walls: flow.walls.map((w) => ({ side: w.side, price: w.price, qty: w.q, ageS: Math.round(w.ageMs / 1000) })),
      },
    };
  }

  meta() {
    const { cfg, info } = this;
    return {
      mode: this.mode,
      symbol: cfg.symbol,
      market: cfg.market,
      bucket: cfg.bucket,
      fpBucket: cfg.footprint.bucket,
      domBucket: this.domBucket,
      frameMs: cfg.frameMs,
      base: info.base,
      quote: info.quote,
      tickSize: info.tickSize,
    };
  }

  async #lastPrice() {
    try {
      const r = await this.rest.get('/ticker/price', { symbol: this.cfg.symbol });
      return Number(r.price);
    } catch {
      return null;
    }
  }

  #wire() {
    const { source, flow, store, hub, cfg } = this;

    source.on('status', (s) => {
      console.log(`[${new Date().toISOString()}] ${cfg.symbol} ${s}`);
      hub.state('status', s);
    });
    source.on('trade', (t) => {
      store.appendLive(t.t, t.p, t.q, t.side, t.id);
      this.#domTrade(t);
    });
    source.on('frame', (f) => {
      this.recorder?.write(f);
      this.heat.add(f);
      this.frame = f;
      const an = flow.update(f);
      this.alerts.evaluate({ symbol: cfg.symbol, f, flow, base: this.info.base });
      hub.tick({ t: f.t, bid: f.bid, ask: f.ask, tr: f.tr, liq: f.liq ?? [], an: { cvd: an.cvd, delta: an.delta, imb: an.imb, big: an.big } });
    });
    store.on('progress', (st) => hub.state('history', st));
    source.on('liquidation', (l) => this.liqs.add(l));
    source.on('mark', (m) => {
      this.mark = m;
      hub.state('mark', m);
    });
  }

  // Volume échangé par niveau de prix (au pas du DOM), remis à zéro chaque jour UTC.
  #domTrade(t) {
    const day = Math.floor(t.t / DAY);
    if (day !== this.domDay) {
      this.domDay = day;
      this.domVol.clear();
    }
    const key = Math.floor(t.p / this.domBucket + 1e-9);
    const cell = this.domVol.get(key) ?? [0, 0];
    cell[t.side > 0 ? 0 : 1] += t.q;
    this.domVol.set(key, cell);
  }

  #dom() {
    const ladder = this.source?.ladder(this.domBucket, this.cfg.domLevels);
    if (!ladder) return;
    const prices = [...ladder.bids, ...ladder.asks].map(([p]) => Math.round(p / this.domBucket));
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const vol = [];
    for (const [key, [bv, sv]] of this.domVol) {
      if (key >= lo && key <= hi) vol.push([Number((key * this.domBucket).toFixed(10)), Math.round(bv * 1000) / 1000, Math.round(sv * 1000) / 1000]);
    }
    this.hub.state('dom', { t: Date.now(), bucket: this.domBucket, ...ladder, vol });
  }
}
