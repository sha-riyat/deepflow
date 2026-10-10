// Lecture d'enchère sur les profils de session (calculs sans dessin, testables) : nœuds de volume
// (HVN / LVN), forme du profil, état d'acceptation ou de rejet par rapport à la value area de la
// veille, profils composites sur plusieurs sessions et taille des lignes.
import { valueArea } from './profile.js';

const DAY = 86_400_000;

// HVN / LVN, comme les plateformes de volume profile : histogramme continu (lignes vides à 0),
// lissé par une moyenne mobile centrée, extrema locaux sur ± `span` lignes, puis filtre de
// proéminence. Un HVN doit dépasser `prom` × le maximum au-dessus du creux le plus haut qui le
// sépare d'un pic plus fort ; un LVN est le creux le plus bas entre deux HVN retenus et doit être
// au moins `prom` sous le plus petit des deux. rows = [[ligne, achats, ventes], ...].
export function volumeNodes(rows, { smooth = 3, span = 2, prom = 0.15 } = {}) {
  if (rows.length < 5) return { hvn: [], lvn: [] };
  const lo = rows[0][0];
  const hi = rows[rows.length - 1][0];
  const raw = new Array(hi - lo + 1).fill(0);
  for (const [row, bv, sv] of rows) raw[row - lo] = bv + sv;
  const half = Math.floor(smooth / 2);
  const v = raw.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let k = i - half; k <= i + half; k++) if (k >= 0 && k < raw.length) (s += raw[k]), n++;
    return s / n;
  });
  const max = Math.max(...v);
  if (!(max > 0)) return { hvn: [], lvn: [] };
  const isPeak = (i) => {
    for (let k = i - span; k <= i + span; k++) if (k !== i && k >= 0 && k < v.length && v[k] > v[i]) return false;
    return v[i] > 0;
  };
  // Proéminence topographique : hauteur du pic au-dessus du col le plus haut menant à un pic plus haut.
  const prominence = (i) => {
    const side = (dir) => {
      let col = v[i];
      for (let k = i + dir; k >= 0 && k < v.length; k += dir) {
        if (v[k] > v[i]) return col; // pic plus haut atteint : col = point le plus bas du chemin
        col = Math.min(col, v[k]);
      }
      return null; // aucun pic plus haut de ce côté
    };
    const cols = [side(-1), side(1)].filter((c) => c !== null);
    return v[i] - (cols.length ? Math.max(...cols) : 0);
  };
  const peaks = [];
  for (let i = 0; i < v.length; i++) {
    if (!isPeak(i) || prominence(i) < prom * max) continue;
    if (peaks.length && i - peaks[peaks.length - 1] <= span) continue; // plateau : un seul nœud
    peaks.push(i);
  }
  const lvn = [];
  for (let k = 1; k < peaks.length; k++) {
    let m = peaks[k - 1];
    for (let i = peaks[k - 1]; i <= peaks[k]; i++) if (v[i] < v[m]) m = i;
    if (v[m] <= (1 - prom) * Math.min(v[peaks[k - 1]], v[peaks[k]])) lvn.push(m + lo);
  }
  return { hvn: peaks.map((i) => i + lo), lvn };
}

// Forme du profil (Dalton) : « double » si un LVN sépare deux HVN importants, « P » si le volume
// se concentre dans le tiers haut (rachat de shorts), « b » dans le tiers bas (liquidation de longs),
// sinon « D » (équilibre).
export function profileShape(s, nodes = volumeNodes(s.rows)) {
  if (!s.rows.length) return null;
  const lo = s.rows[0][0];
  const hi = s.rows[s.rows.length - 1][0];
  if (hi - lo < 4) return 'D';
  const vol = new Map(s.rows.map(([r, b, v]) => [r, b + v]));
  const big = nodes.hvn.filter((r) => (vol.get(r) ?? 0) >= 0.5 * Math.max(...vol.values()));
  if (big.length >= 2 && nodes.lvn.some((l) => l > Math.min(...big) && l < Math.max(...big))) return 'double';
  const third = (hi - lo + 1) / 3;
  let top = 0;
  let bottom = 0;
  let total = 0;
  for (const [r, v] of vol) {
    total += v;
    if (r >= hi - third) top += v;
    if (r <= lo + third) bottom += v;
  }
  const pocPos = (s.poc - lo) / (hi - lo);
  if (pocPos >= 0.6 && top / total >= 0.45) return 'P';
  if (pocPos <= 0.4 && bottom / total >= 0.45) return 'b';
  return 'D';
}

export const SHAPE_LABEL = { D: 'D (équilibre)', P: 'P (rachat de shorts)', b: 'b (liquidation de longs)', double: 'double distribution (tendance)' };

// État de l'enchère du jour face à la value area de la veille, sur les clôtures de périodes de
// 30 min terminées (règle d'acceptation du cours : 2 périodes) :
//  - inside : dans la valeur, pas de sortie ;
//  - outside : sortie en cours, pas encore 2 clôtures dehors ;
//  - accepted : 2 clôtures consécutives du même côté hors de la valeur (Setup 2, on suit) ;
//  - returning : retour dans la valeur après une sortie, pas encore 2 clôtures ;
//  - rejected : après une sortie, 2 clôtures consécutives de retour dans la valeur (Setup 1).
// `now` sert à écarter la période en cours. side = 1 (au-dessus de la VAH) ou -1 (sous la VAL).
export function auctionState(prev, today, now = Date.now(), need = 2) {
  if (!prev || prev.vah === null || !today) return null;
  const vah = (prev.vah + 1) * prev.bucket;
  const val = prev.val * prev.bucket;
  const poc = (prev.poc + 0.5) * prev.bucket;
  const tpoMs = today.tpoMs ?? 1_800_000;
  const current = Math.floor((now - today.t0) / tpoMs);
  const res = { state: 'inside', side: 0, count: 0, extreme: null, at: null, vah, val, poc, excursion: 0 };
  let zone = null;
  let run = 0;
  for (const [k, a, b, close] of today.periods) {
    if (k >= current || close === undefined) continue;
    const pHi = (b + 1) * today.bucket;
    const pLo = a * today.bucket;
    if (pHi > vah) {
      if (res.excursion !== 1) res.extreme = null;
      res.excursion = 1;
      res.extreme = Math.max(res.extreme ?? pHi, pHi);
    } else if (pLo < val) {
      if (res.excursion !== -1) res.extreme = null;
      res.excursion = -1;
      res.extreme = Math.min(res.extreme ?? pLo, pLo);
    }
    const z = close > vah ? 1 : close < val ? -1 : 0;
    run = z === zone ? run + 1 : 1;
    zone = z;
    let next;
    if (z !== 0) next = { state: run >= need ? 'accepted' : 'outside', side: z };
    else if (res.excursion === 0) next = { state: 'inside', side: 0 };
    else if (run >= need) next = { state: 'rejected', side: res.excursion };
    else next = res.state === 'rejected' ? { state: 'rejected', side: res.side } : { state: 'returning', side: res.excursion };
    if (next.state !== res.state || next.side !== res.side) res.at = ['accepted', 'rejected'].includes(next.state) ? today.t0 + (k + 1) * tpoMs : null;
    Object.assign(res, next, { count: run });
  }
  return res;
}

// Position de l'ouverture du jour (premier prix de la session UTC) face à la value area de la
// veille. Lecture de Dalton : une ouverture dans la valeur annonce plutôt une journée de rotation
// entre VAH et VAL, une ouverture hors de la valeur un déséquilibre possible (tendance).
export function openLocation(prev, today) {
  if (!prev || prev.vah === null || !today) return null;
  const vah = (prev.vah + 1) * prev.bucket;
  const val = prev.val * prev.bucket;
  return { open: today.open, where: today.open > vah ? 'above' : today.open < val ? 'below' : 'inside' };
}

export const OPEN_LABEL = { above: 'au-dessus de la valeur de la veille', inside: 'dans la valeur de la veille', below: 'sous la valeur de la veille' };

export function auctionLabel(st) {
  if (!st) return '';
  const where = st.side > 0 ? 'au-dessus de la VAH' : 'sous la VAL';
  if (st.state === 'accepted') return `acceptation ${where} (${st.count} × 30 min)`;
  if (st.state === 'rejected') return `rejet ${st.side > 0 ? 'par le haut' : 'par le bas'}, retour dans la valeur (${st.count} × 30 min)`;
  if (st.state === 'outside') return `sortie ${where} en cours (${st.count}/2)`;
  if (st.state === 'returning') return `retour dans la valeur en cours (${st.count}/2)`;
  return 'dans la valeur de la veille';
}

// Profil composite : fusion de sessions (rows, POC, value area recalculés). `n` dernières
// sessions terminées si précisé.
export function compositeSession(sessions, n = sessions.length) {
  const list = sessions.slice(-n);
  if (!list.length) return null;
  const rows = new Map();
  let hiP = -Infinity;
  let loP = Infinity;
  for (const s of list) {
    for (const [row, bv, sv] of s.rows) {
      const cell = rows.get(row) ?? [0, 0];
      cell[0] += bv;
      cell[1] += sv;
      rows.set(row, cell);
    }
    hiP = Math.max(hiP, s.hi);
    loP = Math.min(loP, s.lo);
  }
  const [poc, val, vah] = valueArea(rows);
  return {
    t0: list[0].t0,
    t1: list[list.length - 1].t1,
    bucket: list[0].bucket,
    rows: [...rows].sort((a, b) => a[0] - b[0]).map(([r, [bv, sv]]) => [r, bv, sv]),
    poc,
    val,
    vah,
    hi: hiP,
    lo: loP,
    days: Math.round((list[list.length - 1].t1 - list[0].t0) / DAY),
  };
}

// Taille des lignes d'un profil : `pct` du prix arrondi à un pas rond (1, 2, 2,5, 5 × 10^k),
// multiple de la tranche du footprint et jamais plus fin qu'elle.
export function rowBucket(price, fpBucket, pct = 0.05) {
  if (!pct || !(price > 0)) return fpBucket;
  const min = (price * pct) / 100;
  const k = 10 ** Math.floor(Math.log10(min));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * k).find((v) => v >= min);
  return Math.max(fpBucket, Math.round(step / fpBucket) * fpBucket);
}
