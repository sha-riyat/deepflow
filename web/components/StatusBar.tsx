'use client';
// Barre d'état : plages rapides, état de l'historique, mode et heure UTC.
import { useEffect, useState } from 'react';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import { Icon } from './ui';
import { ReplayControls } from './Replay';
import { getLive, useLive } from '@/lib/store';
import { clockNow } from '@/lib/clock.js';
import { fmt, sgn } from '@/lib/fmt.js';

// Plage visible -> intervalle de bougie adapté.
export const RANGES: [string, number, number][] = [
  ['1J', 86_400_000, 300_000],
  ['5J', 5 * 86_400_000, 900_000],
  ['1M', 30 * 86_400_000, 14_400_000],
  ['3M', 90 * 86_400_000, 86_400_000],
  ['1A', 365 * 86_400_000, 86_400_000],
];

function countdown(ms: number): string {
  if (!(ms > 0)) return '—';
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function StatusBar({ onRange }: { onRange: (span: number, tf: number) => void }) {
  const history = useLive((s) => s.history);
  const meta = useLive((s) => s.meta);
  const mark = useLive((s) => s.mark);
  const [now, setNow] = useState('');
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const tick = () => {
      // En replay des archives : date et heure rejouées.
      const iso = new Date(clockNow()).toISOString();
      setNow(getLive().meta?.archive ? `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 19)}` : iso.slice(11, 19));
      setClock(Date.now());
    };
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
      <ReplayControls />
      <span className="sb-info">{info.join(' · ') || 'Historique à jour'}</span>
      <div className="sb-right">
        {mark && meta?.market === 'futures' && (
          <span className="sb-info" title="Positif : les positions longues paient les courtes à chaque échéance">
            Marque {fmt(mark.mark, 2)} · Financement <b className={mark.funding >= 0 ? 'pos' : 'neg'}>{sgn(mark.funding * 100, 4)} %</b> dans {countdown(mark.nextFunding - clock)}
          </span>
        )}
        <span className="tb-sep" />
        <span className="sb-info">{meta?.mode === 'replay' ? 'Replay' : 'Direct'} · Binance {meta?.market === 'spot' ? 'Spot' : 'Futures USD-M'}</span>
        <span className="tb-sep" />
        <span className="sb-info"><Icon icon={Clock01Icon} size={14} />{now} UTC</span>
      </div>
    </footer>
  );
}
