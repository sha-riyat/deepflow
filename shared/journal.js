// Journal de trading : entrées vérifiées, résultat en R (multiples du risque pris), statistiques et
// export CSV. Un trade à +2 R a rapporté deux fois ce qu'il risquait au stop ; à −1 R, le stop
// a été touché. Raisonner en R rend les trades comparables, quelle que soit la taille.

export const JOURNAL_VERSION = 1;
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
    notes: text(raw.notes, TEXT_MAX),
    shot: typeof raw.shot === 'string' && raw.shot.startsWith('data:image/') ? raw.shot : null,
  };
  return e.symbol ? e : null;
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
  const cols = ['date', 'symbole', 'marché', 'sens', 'entrée', 'stop', 'cible', 'sortie', 'R', 'setup', 'notes'];
  const cell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = list.map((e) => {
    const r = tradeR(e);
    return [new Date(e.t).toISOString(), e.symbol, e.market, e.side, e.entry, e.stop, e.target, e.exit, r === null ? '' : r.toFixed(2), e.setup, e.notes];
  });
  return [cols, ...rows].map((r) => r.map(cell).join(';')).join('\n');
}
