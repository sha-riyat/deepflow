'use client';
// Graphiques du journal : courbe de capital en R (avec repli maximal et plus longue série de pertes) et
// taux de réussite face au payoff (gain moyen / perte moyenne), avec la ligne d'équilibre 1 / (1 + payoff) :
// au-dessus de la ligne, la stratégie gagne de l'argent (avant frais) ; en dessous, elle en perd.
import { breakEvenWinRate, edgeStats, equityCurve, longestLosingStreak, maxDrawdown } from '@shared/journalstats.js';
import { fmt } from '@/lib/fmt.js';
import type { JournalEntry } from '@/lib/journal';

const W = 300;
const H = 90;

function Equity({ list }: { list: JournalEntry[] }) {
  const curve = equityCurve(list);
  if (curve.length < 2) return null;
  const values = [0, ...curve.map((p: { cum: number }) => p.cum)];
  const lo = Math.min(...values);
  const hi = Math.max(...values, lo + 1);
  const x = (i: number) => (i / curve.length) * (W - 8) + 4;
  const y = (v: number) => H - 6 - ((v - lo) / (hi - lo)) * (H - 12);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = curve[curve.length - 1].cum;
  return (
    <figure className="journal-chart">
      <figcaption>Capital en R · {curve.length} trades · repli maximal <b className="neg">−{fmt(maxDrawdown(curve), 2)} R</b> · plus longue série de pertes <b>{longestLosingStreak(list)}</b></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Courbe de capital en R">
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3 3" />
        <polyline points={pts} fill="none" stroke={last >= 0 ? 'var(--growth, #4ebe96)' : 'var(--loss, #e0685f)'} strokeWidth={1.6} />
      </svg>
    </figure>
  );
}

function Edge({ list }: { list: JournalEntry[] }) {
  const s = edgeStats(list);
  if (s.payoff === null || s.winRate === null || s.breakEven === null) return null;
  const maxP = Math.max(4, Math.ceil(s.payoff));
  const x = (p: number) => (p / maxP) * (W - 24) + 12;
  const y = (wr: number) => H - 8 - wr * (H - 16);
  const curve = Array.from({ length: 41 }, (_, i) => { const p = 0.25 + (i / 40) * (maxP - 0.25); return `${x(p).toFixed(1)},${y(breakEvenWinRate(p)).toFixed(1)}`; }).join(' ');
  const above = s.winRate > s.breakEven;
  return (
    <figure className="journal-chart">
      <figcaption>
        Taux de réussite <b>{fmt(s.winRate * 100, 0)} %</b> · payoff <b>{fmt(s.payoff, 2)}</b> (gain moyen {fmt(s.avgWin ?? 0, 2)} R, perte moyenne {fmt(s.avgLoss ?? 0, 2)} R) · équilibre à <b>{fmt(s.breakEven * 100, 0)} %</b> :
        {' '}<b className={above ? 'pos' : 'neg'}>{above ? 'au-dessus' : 'en dessous'}</b>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Taux de réussite face au payoff">
        <polyline points={curve} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeDasharray="3 3" />
        <circle cx={x(s.payoff)} cy={y(s.winRate)} r={4} fill={above ? 'var(--growth, #4ebe96)' : 'var(--loss, #e0685f)'} />
      </svg>
    </figure>
  );
}

export function JournalCharts({ list }: { list: JournalEntry[] }) {
  return (
    <>
      <Equity list={list} />
      <Edge list={list} />
    </>
  );
}
