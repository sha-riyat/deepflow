// Profils de session (UTC, un jour) : volume par prix, POC, value area, TPO par
// période de 30 min et initial balance (deux premières périodes).
const DAY = 86_400_000;
export const TPO_MS = 30 * 60_000;
export const TPO_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXabcdefghijklmnopqrstuvwx';

const r3 = (v) => Math.round(v * 1000) / 1000;

export class SessionProfiler {
  constructor(bucket) {
    this.bucket = bucket;
    this.sessions = new Map(); // début de session -> état
  }

  push(t, p, q, side) {
    const t0 = Math.floor(t / DAY) * DAY;
    let s = this.sessions.get(t0);
    if (!s) {
      s = { t0, rows: new Map(), periods: new Map(), open: p, close: p, hi: p, lo: p };
      this.sessions.set(t0, s);
    }
    const row = Math.floor(p / this.bucket + 1e-9);
    const cell = s.rows.get(row) ?? [0, 0];
    cell[side > 0 ? 0 : 1] += q;
    s.rows.set(row, cell);
    const k = Math.floor((t - t0) / TPO_MS);
    const per = s.periods.get(k);
    if (per) {
      per[0] = Math.min(per[0], row);
      per[1] = Math.max(per[1], row);
    } else s.periods.set(k, [row, row]);
    s.close = p;
    s.hi = Math.max(s.hi, p);
    s.lo = Math.min(s.lo, p);
  }

  list() {
    return [...this.sessions.values()].sort((a, b) => a.t0 - b.t0).map((s) => finalize(s, this.bucket));
  }
}

function finalize(s, bucket) {
  const rows = [...s.rows].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let pocI = 0;
  let max = -1;
  rows.forEach(([, [bv, sv]], i) => {
    total += bv + sv;
    if (bv + sv > max) {
      max = bv + sv;
      pocI = i;
    }
  });
  // Value area : on part du POC et on ajoute le côté le plus chargé jusqu'à 70 %.
  let lo = pocI;
  let hi = pocI;
  let acc = max;
  const vol = (i) => rows[i][1][0] + rows[i][1][1];
  while (acc < total * 0.7 && (lo > 0 || hi < rows.length - 1)) {
    const down = lo > 0 ? vol(lo - 1) : -1;
    const up = hi < rows.length - 1 ? vol(hi + 1) : -1;
    if (up >= down) acc += vol(++hi);
    else acc += vol(--lo);
  }
  const periods = [...s.periods].sort((a, b) => a[0] - b[0]);
  const ib = periods.filter(([k]) => k < 2);
  return {
    t0: s.t0,
    t1: s.t0 + DAY,
    bucket,
    open: s.open,
    close: s.close,
    hi: s.hi,
    lo: s.lo,
    total: r3(total),
    rows: rows.map(([row, [bv, sv]]) => [row, r3(bv), r3(sv)]),
    poc: rows[pocI]?.[0] ?? null,
    val: rows[lo]?.[0] ?? null,
    vah: rows[hi]?.[0] ?? null,
    periods: periods.map(([k, [a, b]]) => [k, a, b]),
    ibLo: ib.length ? Math.min(...ib.map((p) => p[1][0])) : null,
    ibHi: ib.length ? Math.max(...ib.map((p) => p[1][1])) : null,
  };
}

// Market Profile d'une session, lignes regroupées par `mult` tranches. Contrairement au profil de
// volume, POC et value area portent sur le nombre de TPO (périodes ayant touché le prix) :
// POC = prix le plus visité (égalité : le plus proche du centre de l'étendue), value area = 70 %
// des TPO autour du POC, simples impressions = prix touchés par une seule période hors extrêmes.
export function tpoProfile(s, mult = 1) {
  const m = Math.max(1, Math.round(mult));
  const letters = new Map(); // ligne -> indices des périodes
  for (const [k, a, b] of s.periods) {
    for (let r = Math.floor(a / m); r <= Math.floor(b / m); r++) {
      const list = letters.get(r);
      if (list) list.push(k);
      else letters.set(r, [k]);
    }
  }
  if (letters.size === 0) return null;
  const keys = [...letters.keys()];
  const lo = Math.min(...keys);
  const hi = Math.max(...keys);
  const count = (r) => letters.get(r)?.length ?? 0;
  const mid = (lo + hi) / 2;
  let poc = lo;
  let best = -1;
  let total = 0;
  for (let r = lo; r <= hi; r++) {
    const n = count(r);
    total += n;
    if (n > best || (n === best && Math.abs(r - mid) < Math.abs(poc - mid))) {
      best = n;
      poc = r;
    }
  }
  let val = poc;
  let vah = poc;
  let acc = best;
  while (acc < total * 0.7 && (val > lo || vah < hi)) {
    const up = vah < hi ? count(vah + 1) : -1;
    const down = val > lo ? count(val - 1) : -1;
    if (up >= down) acc += count(++vah);
    else acc += count(--val);
  }
  const singles = [];
  for (let r = lo + 1; r < hi; r++) if (count(r) === 1) singles.push(r);
  const ib = s.periods.filter(([k]) => k < (s.ibN ?? 2));
  const rowOf = (p) => Math.floor(Math.floor(p / s.bucket + 1e-9) / m);
  return {
    mult: m,
    bucket: s.bucket * m,
    lo,
    hi,
    letters,
    total,
    poc,
    val,
    vah,
    singles,
    ibLo: ib.length ? Math.floor(Math.min(...ib.map((p) => p[1])) / m) : null,
    ibHi: ib.length ? Math.floor(Math.max(...ib.map((p) => p[2])) / m) : null,
    openRow: rowOf(s.open),
    closeRow: rowOf(s.close),
  };
}
