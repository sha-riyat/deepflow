// Trades stockés en colonnes (tableaux typés) : temps, prix, quantité, côté, identifiant.
// Format binaire de cache : 'DFT2', n (uint32), puis t (f64), p (f64), q (f32), s (i8), id (f64).
const MAGIC = 0x32544644; // 'DFT2'

export class Trades {
  constructor(capacity = 1024) {
    this.n = 0;
    this.#alloc(capacity);
  }

  #alloc(cap) {
    const old = this.n ? this : null;
    const t = new Float64Array(cap);
    const p = new Float64Array(cap);
    const q = new Float32Array(cap);
    const s = new Int8Array(cap);
    const id = new Float64Array(cap);
    if (old) {
      t.set(old.t.subarray(0, this.n));
      p.set(old.p.subarray(0, this.n));
      q.set(old.q.subarray(0, this.n));
      s.set(old.s.subarray(0, this.n));
      id.set(old.id.subarray(0, this.n));
    }
    Object.assign(this, { t, p, q, s, id, cap });
  }

  push(t, p, q, s, id = -1) {
    if (this.n === this.cap) this.#alloc(this.cap * 2);
    const i = this.n++;
    this.t[i] = t;
    this.p[i] = p;
    this.q[i] = q;
    this.s[i] = s;
    this.id[i] = id;
  }

  get first() {
    return this.n ? this.t[0] : null;
  }

  get last() {
    return this.n ? this.t[this.n - 1] : null;
  }

  // Premier index dont le temps est >= t (recherche dichotomique).
  lowerBound(t) {
    let lo = 0;
    let hi = this.n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.t[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Vue [from, to) sans copie.
  slice(from, to) {
    const a = this.lowerBound(from);
    const b = this.lowerBound(to);
    const view = Object.create(Trades.prototype);
    Object.assign(view, {
      n: b - a,
      cap: b - a,
      t: this.t.subarray(a, b),
      p: this.p.subarray(a, b),
      q: this.q.subarray(a, b),
      s: this.s.subarray(a, b),
      id: this.id.subarray(a, b),
    });
    return view;
  }

  static concat(parts) {
    const n = parts.reduce((acc, x) => acc + x.n, 0);
    const out = new Trades(Math.max(1, n));
    let k = 0;
    for (const x of parts) {
      out.t.set(x.t.subarray(0, x.n), k);
      out.p.set(x.p.subarray(0, x.n), k);
      out.q.set(x.q.subarray(0, x.n), k);
      out.s.set(x.s.subarray(0, x.n), k);
      out.id.set(x.id.subarray(0, x.n), k);
      k += x.n;
    }
    out.n = n;
    return out;
  }

  toBuffer() {
    const { n } = this;
    const buf = Buffer.alloc(8 + n * 29);
    buf.writeUInt32LE(MAGIC, 0);
    buf.writeUInt32LE(n, 4);
    let off = 8;
    for (const [arr, size] of [[this.t, 8], [this.p, 8], [this.q, 4], [this.s, 1], [this.id, 8]]) {
      const bytes = Buffer.from(arr.buffer, arr.byteOffset, n * size);
      bytes.copy(buf, off);
      off += n * size;
    }
    return buf;
  }

  static fromBuffer(buf) {
    if (buf.readUInt32LE(0) !== MAGIC) throw new Error('cache de trades invalide');
    const n = buf.readUInt32LE(4);
    const out = new Trades(Math.max(1, n));
    let off = 8;
    for (const [key, size, Ctor] of [['t', 8, Float64Array], ['p', 8, Float64Array], ['q', 4, Float32Array], ['s', 1, Int8Array], ['id', 8, Float64Array]]) {
      const copy = new Uint8Array(n * size);
      copy.set(buf.subarray(off, off + n * size));
      out[key].set(new Ctor(copy.buffer, 0, n));
      off += n * size;
    }
    out.n = n;
    return out;
  }
}
