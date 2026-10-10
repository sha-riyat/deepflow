// Analyse du flux d'ordres en direct, frame par frame : delta / CVD, VWAP du jour, gros prints,
// murs de liquidité, déséquilibre du carnet et z-score du delta (mémoire glissante de 5 min).
const DAY = 86_400_000;
const PRINT_RING = 5000;
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

export class Flow {
  constructor(cfg, bucket, deltaWinMs) {
    this.cfg = cfg;
    this.bucket = bucket;
    this.deltaWinMs = deltaWinMs;
    this.frames = []; // { t, buy, sell }
    this.cvd = 0;
    this.imb = 0;
    this.vw = { day: null, pq: 0, q: 0 };
    this.prints = new Float64Array(PRINT_RING);
    this.printCount = 0;
    this.bigThreshold = Infinity;
    this.wallState = new Map();
    this.walls = [];
    this.deltaSamples = [];
    this.lastSampleT = 0;
  }

  get now() {
    return this.frames.length ? this.frames[this.frames.length - 1].t : 0;
  }

  get spanMs() {
    return this.frames.length ? this.now - this.frames[0].t : 0;
  }

  // Assez d'historique pour que les statistiques glissantes aient un sens.
  get ready() {
    return this.spanMs >= this.cfg.lookbackMs * 0.95 && this.bigThreshold < Infinity;
  }

  get vwap() {
    return this.vw.q > 0 ? this.vw.pq / this.vw.q : null;
  }

  update(f) {
    const day = Math.floor(f.t / DAY);
    if (day !== this.vw.day) this.vw = { day, pq: 0, q: 0 };

    let buy = 0;
    let sell = 0;
    for (const [p, q, side] of f.tr) {
      if (side > 0) buy += q;
      else sell += q;
      this.vw.pq += p * q;
      this.vw.q += q;
    }
    const big = this.#prints(f.tr).filter((pr) => pr.q >= this.bigThreshold);
    this.cvd += buy - sell;
    this.frames.push({ t: f.t, buy, sell });
    while (this.frames[0].t < f.t - this.cfg.lookbackMs) this.frames.shift();

    this.#imbalance(f);
    this.#walls(f);
    this.#sampleDelta(f.t);

    return {
      cvd: round(this.cvd),
      delta: round(buy - sell),
      imb: round(this.imb),
      vwap: this.vwap === null ? null : round(this.vwap, 2),
      big: big.map((pr) => [round(pr.p, 2), round(pr.q), pr.side]),
      walls: this.walls.map((w) => [w.price, round(w.q), w.side === 'bid' ? 1 : -1, Math.round(w.ageMs / 1000)]),
    };
  }

  // Regroupe les trades d'un même ordre agresseur (même horodatage, même côté).
  #prints(tr) {
    const groups = new Map();
    for (const [p, q, side, T] of tr) {
      const key = T * 2 + (side > 0 ? 1 : 0);
      const g = groups.get(key) ?? { pq: 0, q: 0, side };
      g.pq += p * q;
      g.q += q;
      groups.set(key, g);
    }
    const out = [];
    for (const g of groups.values()) {
      out.push({ p: g.pq / g.q, q: g.q, side: g.side });
      this.prints[this.printCount++ % PRINT_RING] = g.q;
      if (this.printCount % 200 === 0 && this.printCount >= this.cfg.bigPrintMinSamples) {
        const n = Math.min(this.printCount, PRINT_RING);
        const sorted = Array.from(this.prints.subarray(0, n)).sort((x, y) => x - y);
        this.bigThreshold = sorted[Math.floor(this.cfg.bigPrintPct * (n - 1))];
      }
    }
    return out;
  }

  // (B - A) / (B + A) sur `imbBuckets` tranches de part et d'autre du mid, dans [-1, 1].
  #imbalance(f) {
    const i0 = Math.floor((f.bid + f.ask) / 2 / this.bucket) - f.r0;
    const k = this.cfg.imbBuckets;
    let B = 0;
    let A = 0;
    for (let i = Math.max(0, i0 - k); i <= i0 && i < f.b.length; i++) B += f.b[i];
    for (let i = Math.max(0, i0); i <= i0 + k && i < f.a.length; i++) A += f.a[i];
    this.imb = B + A > 0 ? (B - A) / (B + A) : 0;
  }

  // Mur = niveau ≥ wallMult × médiane des niveaux non vides, présent depuis wallMinMs.
  #walls(f) {
    const vals = [];
    for (let i = 0; i < f.b.length; i++) {
      if (f.b[i] > 0) vals.push(f.b[i]);
      if (f.a[i] > 0) vals.push(f.a[i]);
    }
    if (vals.length === 0) return;
    vals.sort((x, y) => x - y);
    const threshold = vals[vals.length >> 1] * this.cfg.wallMult;
    const seen = [];
    for (const [side, arr] of [['bid', f.b], ['ask', f.a]]) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] < threshold) continue;
        const row = f.r0 + i;
        const key = `${side}${row}`;
        const st = this.wallState.get(key) ?? { side, row, since: f.t, peak: 0 };
        st.q = arr[i];
        st.peak = Math.max(st.peak, arr[i]);
        st.lastSeen = f.t;
        this.wallState.set(key, st);
        seen.push(st);
      }
    }
    // Tolère une disparition d'une seconde (niveau qui clignote) avant d'oublier un mur.
    for (const [key, st] of this.wallState) if (f.t - st.lastSeen > 1000) this.wallState.delete(key);
    this.walls = seen
      .filter((st) => f.t - st.since >= this.cfg.wallMinMs)
      .sort((x, y) => y.q - x.q)
      .slice(0, 12)
      .map((st) => ({ ...st, price: st.row * this.bucket, ageMs: f.t - st.since }));
  }

  // Échantillonne chaque seconde le delta de la fenêtre d'impulsion (pour son z-score).
  #sampleDelta(t) {
    if (t - this.lastSampleT < 1000) return;
    this.lastSampleT = t;
    this.deltaSamples.push(this.delta(this.deltaWinMs));
    const max = Math.round(this.cfg.lookbackMs / 1000);
    if (this.deltaSamples.length > max) this.deltaSamples.shift();
  }

  *#recent(ms) {
    const from = this.now - ms;
    for (let i = this.frames.length - 1; i >= 0 && this.frames[i].t > from; i--) yield this.frames[i];
  }

  delta(ms) {
    let d = 0;
    for (const fr of this.#recent(ms)) d += fr.buy - fr.sell;
    return d;
  }

  deltaZ() {
    const s = this.deltaSamples;
    if (s.length < 30) return null;
    const mean = s.reduce((x, y) => x + y, 0) / s.length;
    const sd = Math.sqrt(s.reduce((x, y) => x + (y - mean) ** 2, 0) / s.length);
    return sd > 0 ? (this.delta(this.deltaWinMs) - mean) / sd : null;
  }
}
