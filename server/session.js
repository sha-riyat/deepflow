// Session d'un symbole : flux (direct ou replay), magasin de trades, heatmap, moteur de
// signaux, alertes et DOM. `switch` remplace le symbole sans redémarrer le serveur.
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { loadSymbolInfo } from './symbol.js';
import { LiveSource, ReplaySource } from './sources.js';
import { Recorder } from './recorder.js';
import { Engine } from './engine/engine.js';
import { TradeStore, DAY } from './history/store.js';
import { HeatStore } from './heatstore.js';
import { LiquidationStore } from './liquidations.js';
import { formatSignal, formatRejection } from './format.js';
import { profiles } from './queries.js';
import { rowBucket } from '../shared/auction.js';

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

    const suffix = this.mode === 'replay' ? '-replay' : '';
    this.store = new TradeStore({ market: cfg.market, symbol, dir: cfg.dataDir, rest: this.rest, offline: this.mode === 'replay' });
    this.heat = new HeatStore({ bucket: cfg.bucket, hours: cfg.heatHours });
    this.liqs = new LiquidationStore(cfg.dataDir, cfg.market, symbol);
    this.mark = null;
    this.engine = new Engine(cfg, this.info, { signalsFile: path.join(cfg.dataDir, `signals-${symbol}-${cfg.market}${suffix}.ndjson`) });
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
    this.hub.state('stats', this.engine.tracker.stats());
    this.hub.state('alerts', this.alerts.list());
    this.source.start();
    this.domTimer = setInterval(() => this.#dom(), 250);
    this.vaTimer = setInterval(() => this.#feedSessions(), 60_000);
    setTimeout(() => this.#feedSessions(), 5_000);
    console.log(`session ${this.mode} ${cfg.market} ${symbol} · tranche ${cfg.bucket} · footprint ${cfg.footprint.bucket} · DOM ${this.domBucket}`);
  }

  stop() {
    if (!this.source) return;
    this.source.stop();
    this.store.stop();
    this.recorder?.close();
    clearInterval(this.domTimer);
    clearInterval(this.vaTimer);
    this.source.removeAllListeners();
    this.engine.removeAllListeners();
    this.source = null;
  }

  // Stratégie du cours : sessions journalières complètes (10 jours + aujourd'hui depuis 00:00 UTC,
  // calculées sur l'historique des trades) transmises au moteur, qui ne voit le direct que depuis
  // le lancement du collecteur.
  async #feedSessions() {
    const va = this.engine?.va;
    const f = this.engine?.frame;
    if (!va || !f) return;
    const now = Date.now();
    const bucket = va.bucket ?? rowBucket((f.bid + f.ask) / 2, this.cfg.footprint.bucket, this.cfg.setups.valuearea.rowPct);
    try {
      const r = await profiles(this, { from: Math.floor(now / DAY) * DAY - 10 * DAY, to: now, bucket });
      va.setSessions(r.sessions, now);
    } catch (err) {
      console.error('sessions du moteur :', err.message);
    }
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
      risk: cfg.risk,
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
    const { source, engine, store, hub, cfg } = this;
    let newSignal = null;
    const printed = new Set();

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
      newSignal = null;
      const an = engine.onFrame(f);
      this.alerts.evaluate({ symbol: cfg.symbol, f, flow: engine.flow, base: this.info.base, newSignal });
      hub.tick({ t: f.t, bid: f.bid, ask: f.ask, tr: f.tr, liq: f.liq ?? [], an: { cvd: an.cvd, delta: an.delta, imb: an.imb, big: an.big } });
    });
    store.on('progress', (st) => hub.state('history', st));
    source.on('liquidation', (l) => this.liqs.add(l));
    source.on('mark', (m) => {
      this.mark = m;
      engine.mark = m;
      hub.state('mark', m);
    });

    engine.on('signal', (s) => {
      hub.signal(s);
      if (!printed.has(s.id)) {
        printed.add(s.id);
        newSignal = s;
        console.log('\n' + formatSignal(s) + '\n');
      } else if (s.status === 'closed') console.log('\n' + formatSignal(s) + '\n');
    });
    engine.on('rejection', (r) => {
      hub.state('rejection', r);
      console.log(formatRejection(r));
    });
    engine.on('stats', (st) => hub.state('stats', st));
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
