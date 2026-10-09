// Construction incrémentale de bougies à partir de trades, partagée par le serveur
// (historique) et le navigateur (direct). Types :
//   time   : une bougie par période de `param` ms
//   tick   : une bougie tous les `param` trades
//   volume : une bougie tous les `param` unités échangées
//   range  : une bougie se ferme quand son amplitude dépasserait `param`
//   delta  : une bougie se ferme quand |achats - ventes| atteint `param`
//   renko  : briques de taille `param`, renversement après deux briques
// Avec `fpBucket` > 0, chaque bougie porte aussi son footprint : ligne -> [vol. vendeur,
// vol. acheteur, trades vendeurs, trades acheteurs].
export const BAR_TYPES = ['time', 'tick', 'volume', 'range', 'delta', 'renko'];

const r3 = (v) => Math.round(v * 1000) / 1000;

function newBar(t, p, fp) {
  return { t0: t, t1: t, o: p, h: p, l: p, c: p, v: 0, b: 0, s: 0, n: 0, pv: 0, p2v: 0, cells: fp ? new Map() : null };
}

export class BarBuilder {
  constructor({ type = 'time', param = 60_000, fpBucket = 0 } = {}) {
    if (!BAR_TYPES.includes(type)) throw new Error(`type de bougie inconnu : ${type}`);
    if (!(param > 0)) throw new Error('paramètre de bougie invalide');
    this.type = type;
    this.param = param;
    this.fp = fpBucket > 0 ? fpBucket : 0;
    this.cur = null;
    this.lastT = -Infinity;
    this.lastId = -1;
    this.renko = null; // { lo, hi } : bornes de la dernière brique
  }

  // Ajoute un trade (side : 1 = agresseur acheteur, -1 = vendeur). Retourne les bougies closes.
  push(t, p, q, side, id = -1) {
    if (id >= 0 && id <= this.lastId) return []; // déjà intégré (raccord historique / direct)
    if (id >= 0) this.lastId = id;
    this.lastT = t;
    const done = [];
    const { type, param } = this;

    if (type === 'time') {
      const t0 = Math.floor(t / param) * param;
      if (this.cur && t0 > this.cur.t0) done.push(this.#close());
      if (!this.cur) this.cur = newBar(t0, p, this.fp);
    } else if (type === 'range' && this.cur && Math.max(this.cur.h, p) - Math.min(this.cur.l, p) > param) {
      done.push(this.#close());
    }
    if (!this.cur) this.cur = newBar(t, p, this.fp);
    this.#add(t, p, q, side);

    if (type === 'tick' && this.cur.n >= param) done.push(this.#close());
    else if (type === 'volume' && this.cur.v >= param) done.push(this.#close());
    else if (type === 'delta' && Math.abs(this.cur.b - this.cur.s) >= param) done.push(this.#close());
    else if (type === 'renko') done.push(...this.#renko(p));
    return done;
  }

  #add(t, p, q, side) {
    const bar = this.cur;
    if (bar.n === 0 && this.type !== 'renko') bar.o = p;
    bar.t1 = t;
    bar.h = Math.max(bar.h, p);
    bar.l = Math.min(bar.l, p);
    bar.c = p;
    bar.v += q;
    bar.n += 1;
    bar.pv += p * q;
    bar.p2v += p * p * q;
    if (side > 0) bar.b += q;
    else bar.s += q;
    if (bar.cells) {
      const row = Math.floor(p / this.fp + 1e-9);
      const cell = bar.cells.get(row) ?? [0, 0, 0, 0];
      const k = side > 0 ? 1 : 0;
      cell[k] += q;
      cell[k + 2] += 1;
      bar.cells.set(row, cell);
    }
  }

  // Briques : hausse si p >= haut + taille, baisse si p <= bas - taille.
  #renko(p) {
    const box = this.param;
    if (!this.renko) {
      const base = Math.round(p / box) * box;
      this.renko = { lo: base, hi: base };
    }
    const out = [];
    while (p >= this.renko.hi + box || p <= this.renko.lo - box) {
      const up = p >= this.renko.hi + box;
      const o = up ? this.renko.hi : this.renko.lo;
      const c = up ? o + box : o - box;
      const bar = this.cur ?? newBar(this.lastT, o, this.fp);
      bar.o = o;
      bar.c = c;
      bar.h = Math.max(bar.h, o, c);
      bar.l = Math.min(bar.l, o, c);
      this.cur = bar;
      out.push(this.#close());
      this.renko = { lo: Math.min(o, c), hi: Math.max(o, c) };
    }
    return out;
  }

  #close() {
    const bar = this.cur;
    this.cur = null;
    return toWire(bar, true);
  }

  // Bougie en cours (non close), au format échangé.
  current() {
    if (!this.cur) return null;
    const out = toWire(this.cur, false);
    if (this.renko) out.ro = [this.renko.lo, this.renko.hi]; // état renko pour la reprise
    return out;
  }

  // Reprend une bougie en cours reçue de l'historique, pour continuer en direct.
  restore(wire, { lastT, lastId } = {}) {
    this.cur = fromWire(wire);
    if (lastT !== undefined) this.lastT = lastT;
    if (lastId !== undefined) this.lastId = lastId;
    if (this.type === 'renko' && wire.ro) this.renko = { lo: wire.ro[0], hi: wire.ro[1] };
  }
}

// Format échangé : nombres arrondis, footprint en tableau trié du haut vers le bas.
export function toWire(bar, closed) {
  const out = {
    t0: bar.t0,
    t1: bar.t1,
    o: bar.o,
    h: bar.h,
    l: bar.l,
    c: bar.c,
    v: r3(bar.v),
    b: r3(bar.b),
    s: r3(bar.s),
    n: bar.n,
    pv: bar.pv,
    p2v: bar.p2v,
    x: closed ? 1 : 0,
  };
  if (bar.cells) {
    out.fp = [...bar.cells].map(([row, c]) => [row, r3(c[0]), r3(c[1]), c[2], c[3]]).sort((a, b) => b[0] - a[0]);
  }
  return out;
}

export function fromWire(w) {
  const bar = { ...w, cells: null };
  if (w.fp) bar.cells = new Map(w.fp.map(([row, sv, bv, sn, bn]) => [row, [sv, bv, sn, bn]]));
  delete bar.fp;
  delete bar.x;
  return bar;
}

// Statistiques d'une bougie footprint : POC, value area (70 %) et volume max d'une cellule.
export function footprintStats(fp, vaPct = 0.7) {
  if (!fp || fp.length === 0) return null;
  const rows = [...fp].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let pocI = 0;
  let max = 0;
  rows.forEach((r, i) => {
    const vol = r[1] + r[2];
    total += vol;
    if (vol > max) {
      max = vol;
      pocI = i;
    }
  });
  let lo = pocI;
  let hi = pocI;
  let acc = max;
  while (acc < total * vaPct && (lo > 0 || hi < rows.length - 1)) {
    const down = lo > 0 ? rows[lo - 1][1] + rows[lo - 1][2] : -1;
    const up = hi < rows.length - 1 ? rows[hi + 1][1] + rows[hi + 1][2] : -1;
    if (up >= down) acc += rows[++hi][1] + rows[hi][2];
    else acc += rows[--lo][1] + rows[lo][2];
  }
  return { poc: rows[pocI][0], val: rows[lo][0], vah: rows[hi][0], max };
}

// Bougie Binance (kline) -> format échangé, sans footprint.
export function klineToWire(k, closed) {
  const [t0, o, h, l, c, v, t1, qv, n, tb] = k;
  const vol = Number(v);
  const quote = Number(qv); // volume en devise de cotation : quote / volume = VWAP exact de la bougie
  return {
    t0,
    t1,
    o: Number(o),
    h: Number(h),
    l: Number(l),
    c: Number(c),
    v: r3(vol),
    b: r3(Number(tb)),
    s: r3(vol - Number(tb)),
    n,
    pv: quote,
    p2v: vol > 0 ? (quote * quote) / vol : 0, // variance interne à la bougie ignorée
    x: closed ? 1 : 0,
  };
}
