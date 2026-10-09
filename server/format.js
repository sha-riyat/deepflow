// Mise en forme texte d'un signal : WHY / ENTRY / EXIT / POS SIZE.
const fmt = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const time = (t) => new Date(t).toISOString().slice(11, 19) + ' UTC';
const sgn = (v) => (v >= 0 ? '+' : '') + fmt(v);
const dur = (ms) => (ms >= 60_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 1000)} s`);

export function formatSignal(s) {
  const pct = (p) => fmt((Math.abs(p - s.entry) / s.entry) * 100, 2);
  const lines = [
    `━━━ ${s.side} ${s.symbol} · ${s.label} · ${time(s.t)} ━━━`,
    'WHY',
    ...s.why.map((w) => `  • ${w}`),
    ...s.notes.map((n) => `  ⚠ ${n}`),
    'ENTRY',
    `  ${fmt(s.entry)} (${s.entryType})`,
    'EXIT',
    `  Stop     ${fmt(s.stop)}  (-1R, ${pct(s.stop)} %)`,
    ...(s.stopCurrent !== undefined && s.stopCurrent !== s.stop ? [`  Stop actuel ${fmt(s.stopCurrent)} (déplacé)`] : []),
    ...s.targets.map((t, i) => `  Cible ${i + 1}  ${fmt(t.price)}  (+${fmt(t.R)}R, ${pct(t.price)} %) → ${t.pct} % de la position${t.hit ? ' ✓ atteinte' : ''}`),
    "  Après la cible 1 : stop remonté au point d'entrée",
    `  Sortie forcée après ${dur(s.maxHoldMs)}`,
    'POS SIZE',
    `  ${fmt(s.qty, 6)} ${s.base} · notionnel ${fmt(s.notional)} ${s.quote} · levier ${fmt(s.leverage, 2)}×`,
    `  Risque ${fmt(s.riskUsd)} ${s.quote} (${fmt(s.riskPctEff, 2)} % du capital) · frais ≈ ${fmt(s.feesUsd)} ${s.quote} (${fmt(s.feeR, 2)}R)`,
  ];
  if (s.status === 'open') lines.push(`STATUT  en cours · R latent ${sgn(s.unrealizedR)}`);
  if (s.status === 'closed') lines.push(`STATUT  clôturé (${s.outcome}) · ${sgn(s.resultR)}R · ${fmt(s.pnlUsd)} ${s.quote}`);
  return lines.join('\n');
}

export function formatStats(st) {
  if (!st.n) return 'Aucun signal clôturé pour le moment.';
  return [
    `Signaux clôturés : ${st.n} · gagnants ${st.wins} (${st.winRate} %)`,
    `Moyenne ${st.avgR}R par trade · total ${st.totalR}R · P&L ${fmt(st.pnlUsd)} · drawdown max ${st.maxDDR}R`,
  ].join('\n');
}

export function formatRejection(r) {
  return `Setup ${r.label} ${r.dir > 0 ? 'LONG' : 'SHORT'} détecté à ${time(r.t)} mais refusé : ${r.reason}`;
}
