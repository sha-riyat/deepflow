// Profils de session : volume par prix, POC, value area, TPO par sous-période (30 min par
// défaut), initial balance (première heure) et POC / value area « en développement » (état à la
// fin de chaque sous-période). Session = jour UTC, ou une plage libre (profil de plage visible).
const DAY = 86_400_000;
const HOUR = 3_600_000;
export const TPO_MS = 30 * 60_000;
export const TPO_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXabcdefghijklmnopqrstuvwx';

const r3 = (v) => Math.round(v * 1000) / 1000;

export class SessionProfiler {
  // range : [début, fin] pour un profil unique sur une plage libre (sinon un profil par jour UTC).
  constructor(bucket, { tpoMs = TPO_MS, range = null } = {}) {
    this.bucket = bucket;
    this.tpoMs = tpoMs;
    this.range = range;
    this.sessions = new Map(); // début de session -> état
  }

  push(t, p, q, side) {
    const t0 = this.range ? this.range[0] : Math.floor(t / DAY) * DAY;
    let s = this.sessions.get(t0);
    if (!s) {
      s = { t0, rows: new Map(), periods: new Map(), dev: [], lastK: null, open: p, close: p, hi: p, lo: p };
      this.sessions.set(t0, s);
    }
    const row = Math.floor(p / this.bucket + 1e-9);
    const k = Math.floor((t - t0) / this.tpoMs);
    // Nouvelle sous-période : on fige l'état « en développement » de la précédente.
    if (s.lastK !== null && k !== s.lastK) s.dev.push([s.lastK, ...valueArea(s.rows)]);
    s.lastK = k;
    const cell = s.rows.get(row) ?? [0, 0];
    cell[side > 0 ? 0 : 1] += q;
    s.rows.set(row, cell);
    const per = s.periods.get(k);
    if (per) {
      per[0] = Math.min(per[0], row);
      per[1] = Math.max(per[1], row);
      per[2] = p; // clôture de la période (dernier prix)
    } else s.periods.set(k, [row, row, p]);
    s.close = p;
    s.hi = Math.max(s.hi, p);
    s.lo = Math.min(s.lo, p);
  }

  list() {
    return [...this.sessions.values()].sort((a, b) => a.t0 - b.t0).map((s) => finalize(s, this));
  }
}

// POC (ligne la plus chargée) et value area à 70 % : on part du POC et on ajoute le côté le plus
// chargé. Retourne [poc, val, vah] (numéros de ligne).
export function valueArea(rowsMap, pct = 0.7) {
  const rows = [...rowsMap].sort((a, b) => a[0] - b[0]);
  if (!rows.length) return [null, null, null];
  const vol = (i) => rows[i][1][0] + rows[i][1][1];
  let total = 0;
  let pocI = 0;
  for (let i = 0; i < rows.length; i++) {
    total += vol(i);
    if (vol(i) > vol(pocI)) pocI = i;
  }
  let lo = pocI;
  let hi = pocI;
  let acc = vol(pocI);
  while (acc < total * pct && (lo > 0 || hi < rows.length - 1)) {
    const down = lo > 0 ? vol(lo - 1) : -1;
    const up = hi < rows.length - 1 ? vol(hi + 1) : -1;
    if (up >= down) acc += vol(++hi);
    else acc += vol(--lo);
  }
  return [rows[pocI][0], rows[lo][0], rows[hi][0]];
}

function finalize(s, { bucket, tpoMs, range }) {
  const rows = [...s.rows].sort((a, b) => a[0] - b[0]);
  let total = 0;
  for (const [, [bv, sv]] of rows) total += bv + sv;
  const [poc, val, vah] = valueArea(s.rows);
  const periods = [...s.periods].sort((a, b) => a[0] - b[0]);
  const ibN = Math.max(1, Math.round(HOUR / tpoMs)); // initial balance : première heure
  const ib = periods.filter(([k]) => k < ibN);
  const dev = s.lastK === null ? s.dev : [...s.dev, [s.lastK, poc, val, vah]];
  return {
    t0: s.t0,
    t1: range ? range[1] : s.t0 + DAY,
    bucket,
    tpoMs,
    ibN,
    open: s.open,
    close: s.close,
    hi: s.hi,
    lo: s.lo,
    total: r3(total),
    rows: rows.map(([row, [bv, sv]]) => [row, r3(bv), r3(sv)]),
    poc,
    val,
    vah,
    periods: periods.map(([k, [a, b, c]]) => [k, a, b, c]), // [période, ligne basse, ligne haute, clôture]
    dev,
    ibLo: ib.length ? Math.min(...ib.map((p) => p[1][0])) : null,
    ibHi: ib.length ? Math.max(...ib.map((p) => p[1][1])) : null,
  };
}

// POC non testés : POC de volume d'une session terminée qu'aucun prix ultérieur n'a retouché.
// Les étendues des sessions suivantes font foi (elles couvrent tous les trades) ; `after` =
// [plus bas, plus haut] du direct postérieur à la dernière session reçue. La dernière session
// (en cours) n'a pas encore de POC définitif.
export function nakedPocs(sessions, after = null) {
  const out = [];
  for (let i = 0; i < sessions.length - 1; i++) {
    const s = sessions[i];
    if (s.poc === null) continue;
    const price = (s.poc + 0.5) * s.bucket;
    if (sessions.slice(i + 1).some((x) => x.lo <= price && x.hi >= price)) continue;
    if (after && after[0] <= price && after[1] >= price) continue;
    out.push({ t0: s.t0, t1: s.t1, price });
  }
  return out;
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
