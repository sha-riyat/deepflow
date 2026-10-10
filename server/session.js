// Session d'un symbole : flux (direct, replay d'un enregistrement ou des archives), magasin de
// trades, heatmap, analyse du flux, alertes et DOM. `start` remplace le symbole ou passe du direct au
// replay des archives sans redémarrer le serveur.
import { EventEmitter } from 'node:events';
import { loadSymbolInfo } from './symbol.js';
import { LiveSource, ReplaySource } from './sources.js';
import { ArchiveSource } from './replay.js';
import { Recorder } from './recorder.js';
import { Flow } from './flow.js';
import { TradeStore, DAY, dayKey } from './history/store.js';
import { HeatStore } from './heatstore.js';
import { LiquidationStore } from './liquidations.js';
import { VenueFeed } from './venues.js';

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
    this.archive = null; // replay des archives en cours : { from, speed }
    this.gen = 0;
  }

  // `archive` = { from, speed } : rejoue les archives à partir de l'instant `from` au lieu du direct.
  async start(symbol, archive = null) {
    this.stop();
    const gen = ++this.gen; // un démarrage plus récent annule celui-ci
    const { cfg } = this;
    cfg.symbol = symbol;
    this.archive = archive;
    this.mode = archive || cfg.replay ? 'replay' : 'live';
    this.info = await loadSymbolInfo(cfg.market, symbol);
    this.store = new TradeStore({ market: cfg.market, symbol, dir: cfg.dataDir, rest: this.rest, offline: this.mode === 'replay' && !archive });
    let price = null;
    let day = null;
    if (archive) {
      // Jour rejoué : archive (téléchargée une fois puis gardée en cache), connue jusqu'au départ.
      const d = Math.floor(archive.from / DAY) * DAY;
      this.hub.state('status', `replay : chargement de l’archive du ${dayKey(d)}…`);
      day = await this.store.day(d);
      if (!day.n) throw new Error(`aucun trade archivé le ${dayKey(d)}`);
      this.store.seed(d, archive.from, day);
      price = day.p[Math.max(0, day.lowerBound(archive.from) - 1)];
    } else if (this.mode === 'live') price = await this.#lastPrice();
    if (gen !== this.gen) return;
    if (price) {
      cfg.bucket = this.fixed.bucket ?? niceStep(price * 0.00005, this.info.tickSize);
      this.domBucket = niceStep(price * 0.00001, this.info.tickSize);
    } else this.domBucket = cfg.bucket;
    cfg.footprint.bucket = this.fixed.fp ?? Number((cfg.bucket * 2).toPrecision(6));

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
    if (archive) {
      const end = Math.floor(Date.now() / DAY) * DAY; // archives jusqu'à hier inclus
      this.source = new ArchiveSource({ loadDay: (d) => this.store.day(d), from: archive.from, end, speed: archive.speed, frameMs: cfg.frameMs });
      this.#warm(day, archive.from);
    } else this.source = this.mode === 'replay' ? new ReplaySource(cfg.replay, cfg.speed) : new LiveSource(cfg);
    this.#wire();
    this.hub.reset();
    this.hub.setMeta(this.meta());
    this.hub.state('alerts', this.alerts.list());
    this.source.start();
    // CVD multi-plateformes : trades Bybit et OKX du même perpétuel, en direct seulement.
    this.venues = this.mode === 'live' && cfg.market === 'futures' && cfg.venues ? new VenueFeed(symbol) : null;
    this.venues?.start();
    this.domTimer = setInterval(() => this.#dom(), 250);
    console.log(`session ${this.mode} ${cfg.market} ${symbol} · tranche ${cfg.bucket} · footprint ${cfg.footprint.bucket} · DOM ${this.domBucket}`);
  }

  stop() {
    if (!this.source) return;
    this.source.stop();
    this.store.stop();
    this.recorder?.close();
    this.venues?.stop();
    clearInterval(this.domTimer);
    this.source.removeAllListeners();
    this.source = null;
  }

  // Instant « présent » de toutes les requêtes : l'horloge en direct ; en replay, l'heure rejouée,
  // pour qu'aucune donnée postérieure (le « futur » du replay) ne soit renvoyée.
  now() {
    if (this.mode === 'live') return Date.now();
    return this.source?.clock ?? this.store?.live.last ?? 0;
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
      key: this.key, // clé de la session (« futures:BTCUSDT », « replay »)
      mode: this.mode,
      archive: this.archive ? { from: this.archive.from } : null, // replay des archives (pilotable)
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
      if (f.b.length) this.heat.add(f); // replay des archives : pas de carnet
      this.frame = f;
      const an = flow.update(f);
      // Alertes en direct seulement : un replay ne doit ni sonner ni désactiver une alerte.
      if (this.mode === 'live') this.alerts.evaluate({ symbol: cfg.symbol, f, flow, base: this.info.base });
      // Avance silencieuse (saut dans le replay) : rien n'est diffusé, le navigateur recharge après.
      if (!f.silent) hub.tick({ t: f.t, bid: f.bid, ask: f.ask, tr: f.tr, liq: f.liq ?? [], an: { cvd: an.cvd, delta: an.delta, imb: an.imb, big: an.big } });
    });
    source.on('replay', (st) => hub.state('replay', st));
    source.on('jumped', () => this.#resync());
    store.on('progress', (st) => hub.state('history', st));
    source.on('liquidation', (l) => this.liqs.add(l));
    source.on('mark', (m) => {
      this.mark = m;
      hub.state('mark', m);
    });
  }

  // Après un saut dans le replay : les navigateurs repartent de zéro et rechargent l'historique.
  #resync() {
    const { hub } = this;
    hub.reset();
    hub.setMeta(this.meta());
    hub.state('alerts', this.alerts.list());
    hub.state('history', this.store.status());
  }

  // Replay des archives : l'analyse du flux (seuil des gros prints, z-score du delta) est amorcée
  // sur les minutes qui précèdent le départ, comme si le collecteur tournait déjà.
  #warm(trades, to) {
    for (let t = to - this.cfg.flow.lookbackMs; t < to; t += 1000) {
      const sl = trades.slice(t, Math.min(t + 1000, to));
      if (!sl.n) continue;
      const tr = Array.from({ length: sl.n }, (_, i) => [sl.p[i], sl.q[i], sl.s[i], sl.t[i], sl.id[i]]);
      const p = sl.p[sl.n - 1];
      this.flow.update({ t: Math.min(t + 1000, to), bid: p, ask: p, r0: null, b: [], a: [], tr });
    }
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
