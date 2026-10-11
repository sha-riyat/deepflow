'use client';
// Statistiques du journal ventilées par setup, note, heure d'entrée ou jour de la semaine : repérer
// quels setups, quelles heures et quels jours rapportent vraiment (et lesquels coûtent). Avec peu de
// trades par ligne, ce sont des indications, pas des preuves.
import { useState } from 'react';
import { breakdown } from '@shared/journalstats.js';
import { fmt } from '@/lib/fmt.js';
import type { JournalEntry } from '@/lib/journal';

const DIMS: [string, string][] = [['setup', 'Setup'], ['grade', 'Note'], ['hour', 'Heure'], ['weekday', 'Jour']];
const signed = (v: number) => `${v >= 0 ? '+' : ''}${fmt(v, 2)}`;

export function JournalBreakdown({ list }: { list: JournalEntry[] }) {
  const [dim, setDim] = useState('setup');
  const rows = breakdown(list, dim) as { key: string; trades: number; winRate: number; avgR: number; totalR: number }[];
  if (!rows.length) return null;
  return (
    <div className="journal-stats journal-breakdown">
      <div className="jf-row"><b>Par</b>
        <div className="seg">{DIMS.map(([k, label]) => <button key={k} type="button" className={dim === k ? 'on' : ''} onClick={() => setDim(k)}>{label}</button>)}</div>
      </div>
      {rows.map((r) => (
        <span key={r.key} className="jb-row">
          <span>{r.key}</span>
          <span className="muted">{r.trades} trade{r.trades > 1 ? 's' : ''} · {fmt(r.winRate * 100, 0)} %</span>
          <b className={r.totalR >= 0 ? 'pos' : 'neg'}>{signed(r.totalR)} R</b>
          <span className="muted">{signed(r.avgR)} / trade</span>
        </span>
      ))}
      {rows.some((r) => r.trades < 5) && <span className="muted">Moins de 5 trades sur certaines lignes : indication seulement.</span>}
    </div>
  );
}
