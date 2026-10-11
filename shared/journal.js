// Journal de trading : entrées vérifiées, résultat en R (multiples du risque pris), statistiques et
// export CSV. Un trade à +2 R a rapporté deux fois ce qu'il risquait au stop ; à −1 R, le stop
// a été touché. Raisonner en R rend les trades comparables, quelle que soit la taille.

import { deltaPct, relativeVolume } from './barstats.js';
import { barAt } from './bigprints.js';
import { GRADES } from './position.js';
import { sessionAt, usDst } from './sessions.js';

export const JOURNAL_VERSION = 1;

// Instantané de la bougie en cours quand le trade est noté (contexte à relire plus tard) : volume, delta
// en % du volume, volume relatif (multiple de la moyenne des 20 précédentes), heure UTC et heure de
// New York, séance de bureau. null si aucune bougie ne couvre l'instant `t`.
export function entrySnapshot(bars, t) {
  const i = barAt(bars, t);
  if (i < 0) return null;
  const b = bars[i];
  const day = Math.floor(t / 86_400_000) * 86_400_000;
  const clock = (ms) => new Date(ms).toISOString().slice(11, 16);
  return {
    volume: b.v,
    deltaPct: deltaPct(b),
    relVolume: relativeVolume(bars, i),
    utc: clock(t),
    ny: clock(t - (usDst(day) ? 4 : 5) * 3_600_000),
    session: sessionAt(t),
  };
}

// Instantané relu depuis le stockage : seuls les champs valides sont gardés.
function cleanSnapshot(s) {
  if (!s || typeof s !== 'object') return null;
  const hhmm = (v) => (typeof v === 'string' && /^\d\d:\d\d$/.test(v) ? v : null);
  const out = {
    volume: num(s.volume), deltaPct: num(s.deltaPct), relVolume: num(s.relVolume), utc: hhmm(s.utc), ny: hhmm(s.ny),
    session: ['asia', 'london', 'ny', 'off'].includes(s.session) ? s.session : null,
  };
  return out.utc ? out : null;
}

// Erreurs typiques à étiqueter après coup (vidéos 09, 14, 22) : clé -> libellé. Leur coût cumulé en R
// montre ce qui coûte le plus cher (journalstats.js).
export const ERRORS = {
  hors_horaire: 'Hors de mes heures',
  premiere_poussee: 'Première poussée prise',
  mauvais_sens: 'Mauvais sens (contre le contexte)',
  hors_plan: 'Hors plan (sans zone ni confirmation)',
  stop_deplace: 'Stop éloigné',
};

// Setups proposés à la saisie (texte libre accepté) : ceux des vidéos (break-in, cassure, enchère
// ratée, retournement, absorption, balayage, momentum) et les lectures de profil de deepflow.
export const SETUPS = [
  'Break-in (retour dans la valeur)', 'Cassure (hors de la valeur)', 'Enchère ratée', 'Retournement complet',
  'Absorption', 'Balayage d’un plus haut / plus bas', 'Momentum', 'Rejet de la VAH', 'Rejet de la VAL',
  'Retour au POC', 'POC non testé', 'Cassure de l’IB', 'Rebond sur le VWAP',
];
const TEXT_MAX = 2000;
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const text = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');

// Entrée complétée et vérifiée (stockage abîmé, import) ; null si inutilisable.
export function cleanEntry(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;
  const e = {
    id: raw.id,
    t: num(raw.t) ?? Date.now(),
    symbol: text(raw.symbol, 20).toUpperCase(),
    market: raw.market === 'spot' ? 'spot' : 'futures',
    side: raw.side === 'short' ? 'short' : 'long',
    entry: num(raw.entry),
    stop: num(raw.stop),
    target: num(raw.target),
    exit: num(raw.exit),
    setup: text(raw.setup, 80),
    grade: GRADES.includes(raw.grade) ? raw.grade : null, // note du setup A / B / C
    errors: [...new Set(Array.isArray(raw.errors) ? raw.errors.filter((k) => k in ERRORS) : [])],
    snap: cleanSnapshot(raw.snap),
    tIn: num(raw.tIn), // heure d'entrée et de sortie (excursions)
    tOut: num(raw.tOut),
    mae: num(raw.mae),
    mfe: num(raw.mfe),
    notes: text(raw.notes, TEXT_MAX),
    shot: typeof raw.shot === 'string' && raw.shot.startsWith('data:image/') ? raw.shot : null,
  };
  return e.symbol ? e : null;
}

// Excursions du trade entre son entrée (`tIn`) et sa sortie (`tOut`), d'après les bougies : MAE
// (maximum adverse excursion : jusqu'où le prix est allé contre vous) et MFE (maximum favorable
// excursion : jusqu'où il est allé pour vous), en R. Un stop souvent touché de justesse (MAE proche
// de 1 R sur les gagnants) ou des gains non pris (MFE bien au-dessus du résultat) se lisent ici.
// null sans heures, sans résultat, ou si les bougies chargées ne couvrent pas tout le trade.
export function excursions(e, bars) {
  const r = tradeR(e);
  if (r === null || e.tIn === null || e.tOut === null || e.tOut < e.tIn || !bars.length || bars[0].t0 > e.tIn) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of bars) {
    if (b.t1 <= e.tIn || b.t0 >= e.tOut) continue;
    if (b.h > hi) hi = b.h;
    if (b.l < lo) lo = b.l;
  }
  if (!(hi >= lo)) return null;
  const long = e.side === 'long';
  const risk = long ? e.entry - e.stop : e.stop - e.entry;
  const against = long ? e.entry - lo : hi - e.entry;
  const forward = long ? hi - e.entry : e.entry - lo;
  return { mae: Math.max(0, against) / risk, mfe: Math.max(0, forward) / risk };
}

// Résultat en R d'un trade clôturé (null tant qu'il n'a pas de sortie ou si le stop est mal placé).
export function tradeR(e) {
  if (e.entry === null || e.stop === null || e.exit === null) return null;
  const k = e.side === 'long' ? 1 : -1;
  const risk = k * (e.entry - e.stop);
  if (!(risk > 0)) return null;
  return (k * (e.exit - e.entry)) / risk;
}

// R:R prévu (cible face au stop).
export function plannedRR(e) {
  if (e.entry === null || e.stop === null || e.target === null) return null;
  const k = e.side === 'long' ? 1 : -1;
  const risk = k * (e.entry - e.stop);
  const reward = k * (e.target - e.entry);
  return risk > 0 && reward > 0 ? reward / risk : null;
}

// Statistiques des trades clôturés : nombre, gagnants, taux de réussite, R moyen (espérance par
// trade), total, facteur de profit (gains / pertes en R).
export function journalStats(list) {
  const rs = list.map(tradeR).filter((r) => r !== null);
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r < 0);
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const lossSum = -sum(losses);
  return {
    trades: rs.length,
    open: list.length - rs.length,
    wins: wins.length,
    winRate: rs.length ? wins.length / rs.length : null,
    avgR: rs.length ? sum(rs) / rs.length : null,
    totalR: sum(rs),
    profitFactor: lossSum > 0 ? sum(wins) / lossSum : null,
  };
}

// Export CSV (séparateur « ; », lisible par un tableur en français), sans les captures.
export function toCsv(list) {
  const cols = ['date', 'symbole', 'marché', 'sens', 'entrée', 'stop', 'cible', 'sortie', 'R', 'setup', 'notes', 'note', 'erreurs', 'MAE', 'MFE'];
  const cell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = list.map((e) => {
    const r = tradeR(e);
    return [new Date(e.t).toISOString(), e.symbol, e.market, e.side, e.entry, e.stop, e.target, e.exit, r === null ? '' : r.toFixed(2), e.setup, e.notes, e.grade, e.errors.map((k) => ERRORS[k]).join(' + '), e.mae === null ? '' : e.mae.toFixed(2), e.mfe === null ? '' : e.mfe.toFixed(2)];
  });
  return [cols, ...rows].map((r) => r.map(cell).join(';')).join('\n');
}
