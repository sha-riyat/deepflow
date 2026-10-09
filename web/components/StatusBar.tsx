'use client';
// Barre d'état : plages rapides, état de l'historique, mode et heure UTC.
import { useEffect, useState } from 'react';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import { Icon } from './ui';
import { useLive } from '@/lib/store';

// Plage visible -> intervalle de bougie adapté.
export const RANGES: [string, number, number][] = [
  ['1J', 86_400_000, 300_000],
  ['5J', 5 * 86_400_000, 900_000],
  ['1M', 30 * 86_400_000, 14_400_000],
  ['3M', 90 * 86_400_000, 86_400_000],
  ['1A', 365 * 86_400_000, 86_400_000],
];

export function StatusBar({ onRange }: { onRange: (span: number, tf: number) => void }) {
  const history = useLive((s) => s.history);
  const meta = useLive((s) => s.meta);
  const [now, setNow] = useState('');

  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const bf = history?.backfill;
  const info = [];
  if (bf?.total && bf.done < bf.total) info.push(`Rattrapage de l’historique du jour : ${bf.done}/${bf.total} h`);
  if (bf?.error) info.push(`Rattrapage interrompu : ${bf.error}`);
  if (history?.loading?.length) info.push(`Archives Binance : ${history.loading.length} jour(s) en téléchargement`);

  return (
    <footer id="statusbar">
      {RANGES.map(([label, span, tf]) => (
        <button key={label} type="button" className="tb-btn" onClick={() => onRange(span, tf)}>{label}</button>
      ))}
      <span className="tb-sep" />
      <span className="sb-info">{info.join(' · ') || 'Historique à jour'}</span>
      <div className="sb-right">
        <span className="sb-info">{meta?.mode === 'replay' ? 'Replay' : 'Direct'} · Binance {meta?.market === 'spot' ? 'Spot' : 'Futures USD-M'}</span>
        <span className="tb-sep" />
        <span className="sb-info"><Icon icon={Clock01Icon} size={14} />{now} UTC</span>
      </div>
    </footer>
  );
}
