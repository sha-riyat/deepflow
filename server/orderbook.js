// Carnet d'ordres local : prix -> quantité, de chaque côté.
export class OrderBook {
  constructor() {
    this.bids = new Map();
    this.asks = new Map();
    this.lastUpdateId = 0;
  }

  loadSnapshot(snap) {
    this.bids.clear();
    this.asks.clear();
    this.#apply(this.bids, snap.bids);
    this.#apply(this.asks, snap.asks);
    this.lastUpdateId = snap.lastUpdateId;
  }

  applyDiff(event) {
    this.#apply(this.bids, event.b);
    this.#apply(this.asks, event.a);
    this.lastUpdateId = event.u;
  }

  #apply(side, levels) {
    for (const [p, q] of levels) {
      const price = Number(p);
      const qty = Number(q);
      if (qty === 0) side.delete(price);
      else side.set(price, qty);
    }
  }

  bestBid() {
    let best = 0;
    for (const p of this.bids.keys()) if (p > best) best = p;
    return best || null;
  }

  bestAsk() {
    let best = Infinity;
    for (const p of this.asks.keys()) if (p < best) best = p;
    return best === Infinity ? null : best;
  }

  // Liquidité regroupée par tranches de `bucket` autour du mid.
  // Retourne { r0, b, a } : b[i] / a[i] = quantité acheteuse / vendeuse de la tranche r0 + i,
  // la tranche r couvrant [r * bucket, (r + 1) * bucket).
  grouped(bucket, mid, range) {
    const r0 = Math.floor(mid / bucket) - range;
    const n = 2 * range + 1;
    const fill = (side) => {
      const out = new Array(n).fill(0);
      for (const [price, qty] of side) {
        const i = Math.floor(price / bucket) - r0;
        if (i >= 0 && i < n) out[i] += qty;
      }
      return out.map((v) => Math.round(v * 1000) / 1000);
    };
    return { r0, b: fill(this.bids), a: fill(this.asks) };
  }

  // Échelle de prix pour le DOM : `levels` niveaux regroupés par `bucket` de chaque côté.
  ladder(bucket, levels) {
    const group = (side, dir) => {
      const m = new Map();
      for (const [price, qty] of side) {
        const key = dir > 0 ? Math.floor(price / bucket + 1e-9) : Math.ceil(price / bucket - 1e-9);
        m.set(key, (m.get(key) ?? 0) + qty);
      }
      return [...m]
        .sort((x, y) => (dir > 0 ? y[0] - x[0] : x[0] - y[0]))
        .slice(0, levels)
        .map(([k, q]) => [Number((k * bucket).toFixed(10)), Math.round(q * 1000) / 1000]);
    };
    return { bids: group(this.bids, 1), asks: group(this.asks, -1) };
  }
}
