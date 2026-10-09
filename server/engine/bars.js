// Bougies footprint : OHLC + volume acheteur/vendeur par cellule de prix.
const MAX_BARS = 500;
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

export class Bars {
  constructor(tfMs, bucket) {
    this.tf = tfMs;
    this.bucket = bucket;
    this.closed = [];
    this.cur = null;
  }

  // Intègre les trades d'une frame ; retourne les bougies clôturées.
  update(f) {
    const done = [];
    for (const [p, q, side, T] of f.tr) {
      const t0 = Math.floor(T / this.tf) * this.tf;
      if (this.cur && t0 > this.cur.t0) done.push(this.#close());
      if (!this.cur) this.cur = { t0, o: p, h: p, l: p, c: p, buy: 0, sell: 0, cells: new Map() };
      const bar = this.cur;
      bar.h = Math.max(bar.h, p);
      bar.l = Math.min(bar.l, p);
      bar.c = p;
      if (side > 0) bar.buy += q;
      else bar.sell += q;
      const row = Math.floor(p / this.bucket);
      const cell = bar.cells.get(row) ?? [0, 0];
      cell[side > 0 ? 1 : 0] += q;
      bar.cells.set(row, cell);
    }
    if (this.cur && f.t >= this.cur.t0 + this.tf) done.push(this.#close());
    return done;
  }

  #close() {
    const bar = this.cur;
    this.cur = null;
    this.closed.push(bar);
    if (this.closed.length > MAX_BARS) this.closed.shift();
    return bar;
  }

  // ATR simple sur les n dernières bougies clôturées (null si historique insuffisant).
  atr(n = 14) {
    const bars = this.closed.slice(-(n + 1));
    if (bars.length < 6) return null;
    let sum = 0;
    for (let i = 1; i < bars.length; i++) {
      const prev = bars[i - 1].c;
      const b = bars[i];
      sum += Math.max(b.h - b.l, Math.abs(b.h - prev), Math.abs(b.l - prev));
    }
    return sum / (bars.length - 1);
  }

  static serialize(bar, closed) {
    let poc = null;
    let pocVol = -1;
    const rows = [];
    for (const [row, [sell, buy]] of bar.cells) {
      rows.push([row, round(sell), round(buy)]);
      if (sell + buy > pocVol) {
        pocVol = sell + buy;
        poc = row;
      }
    }
    rows.sort((x, y) => y[0] - x[0]);
    return {
      t0: bar.t0,
      o: bar.o,
      h: bar.h,
      l: bar.l,
      c: bar.c,
      buy: round(bar.buy),
      sell: round(bar.sell),
      delta: round(bar.buy - bar.sell),
      poc,
      rows,
      closed,
    };
  }
}
