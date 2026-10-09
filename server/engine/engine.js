// Orchestration : flux -> bougies -> suivi du signal actif -> recherche de setups.
// Événements : 'bar' (bougie footprint), 'signal' (nouveau ou mis à jour),
// 'rejection' (setup détecté mais plan refusé), 'stats'.
// Le moteur n'utilise que le temps des frames : il se comporte pareil en direct et en replay.
import { EventEmitter } from 'node:events';
import { Flow } from './flow.js';
import { Bars } from './bars.js';
import { Tracker } from './tracker.js';
import { SETUPS } from './setups.js';
import { buildPlan } from './plan.js';

const REJECTION_THROTTLE_MS = 5000;

export class Engine extends EventEmitter {
  constructor(cfg, info, { signalsFile = null } = {}) {
    super();
    this.cfg = cfg;
    this.info = info;
    this.flow = new Flow(cfg.flow, cfg.bucket, cfg.setups.breakout.windowMs);
    this.bars = new Bars(cfg.footprint.tfMs, cfg.footprint.bucket);
    this.tracker = new Tracker(signalsFile);
    this.lastSignalT = -Infinity;
    this.lastBarEmit = 0;
    this.lastTickEmit = 0;
    this.lastRejection = null;
    this.frame = null;
    this.analytics = null;
  }

  onFrame(f) {
    const an = this.flow.update(f);
    this.frame = f;
    this.analytics = an;

    for (const bar of this.bars.update(f)) this.emit('bar', Bars.serialize(bar, true));
    if (this.bars.cur && f.t - this.lastBarEmit >= 1000) {
      this.lastBarEmit = f.t;
      this.emit('bar', Bars.serialize(this.bars.cur, false));
    }

    const active = this.tracker.active;
    const res = this.tracker.update(f);
    if (res === 'closed') {
      this.emit('signal', active);
      this.emit('stats', this.tracker.stats());
    } else if (res === 'event' || (res === 'tick' && f.t - this.lastTickEmit >= 1000)) {
      this.lastTickEmit = f.t;
      this.emit('signal', active);
    }

    if (!this.tracker.active) this.#scan(f);
    return an;
  }

  #scan(f) {
    const { cfg, flow } = this;
    if (!flow.ready || f.t - this.lastSignalT < cfg.risk.cooldownMs) return;
    const ctx = { f, flow, bucket: cfg.bucket, base: this.info.base };
    for (const [name, fn] of Object.entries(SETUPS)) {
      const setupCfg = cfg.setups[name];
      if (!setupCfg.enabled) continue;
      for (const dir of [1, -1]) {
        const cand = fn({ ...ctx, cfg: setupCfg }, dir);
        if (!cand) continue;
        const res = buildPlan(cand, { f, risk: cfg.risk, info: this.info, atr: this.bars.atr(), walls: flow.walls });
        if (res.rejected) {
          this.#reject(f.t, cand, res.rejected);
          continue;
        }
        const signal = {
          id: `${f.t}-${name}-${dir > 0 ? 'L' : 'S'}`,
          t: f.t,
          symbol: this.info.symbol,
          base: this.info.base,
          quote: this.info.quote,
          side: dir > 0 ? 'LONG' : 'SHORT',
          dir,
          setup: name,
          label: cand.label,
          why: cand.why,
          ...res.plan,
        };
        this.tracker.open(signal);
        this.lastSignalT = f.t;
        this.emit('signal', signal);
        return;
      }
    }
  }

  #reject(t, cand, reason) {
    const prev = this.lastRejection;
    const same = prev && prev.setup === cand.setup && prev.dir === cand.dir && prev.reason === reason;
    if (same && t - prev.t < REJECTION_THROTTLE_MS) return;
    this.lastRejection = { t, setup: cand.setup, label: cand.label, dir: cand.dir, reason, why: cand.why };
    this.emit('rejection', this.lastRejection);
  }

  // Instantané lisible par l'API (et donc par un agent).
  state() {
    const f = this.frame;
    const an = this.analytics;
    return {
      symbol: this.info.symbol,
      market: this.cfg.market,
      t: f?.t ?? null,
      price: f ? { bid: f.bid, ask: f.ask } : null,
      warmup: !this.flow.ready,
      warmupPct: Math.min(100, Math.round((this.flow.spanMs / this.cfg.flow.lookbackMs) * 100)),
      flow: an && {
        cvd: an.cvd,
        imbalance: an.imb,
        vwap: an.vwap,
        deltaZ: this.flow.deltaZ(),
        bigPrintThreshold: Number.isFinite(this.flow.bigThreshold) ? this.flow.bigThreshold : null,
        walls: this.flow.walls.map((w) => ({ side: w.side, price: w.price, qty: w.q, ageS: Math.round(w.ageMs / 1000) })),
      },
      atr: this.bars.atr(),
      risk: this.cfg.risk,
      active: this.tracker.active,
      lastRejection: this.lastRejection,
      recent: this.tracker.history.slice(-20),
      stats: this.tracker.stats(),
    };
  }
}
