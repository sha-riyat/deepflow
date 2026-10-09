'use client';
// Panneau Marchés : top 200 Binance par volume, recherche, clic pour changer de symbole.
import { useEffect, useState } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui';
import { fmt, sgn } from '@/lib/fmt.js';
import { useLive } from '@/lib/store';
import type { Ticker } from '@/lib/types';

const vol = (v: number) => (v >= 1e9 ? `${fmt(v / 1e9, 2)} Md` : `${fmt(v / 1e6, 1)} M`);

export function MarketsPanel({ onSelect }: { onSelect: (s: string) => void }) {
  const current = useLive((s) => s.meta?.symbol);
  const [rows, setRows] = useState<Ticker[]>([]);
  const [term, setTerm] = useState('');

  useEffect(() => {
    const load = () => fetch('/api/tickers').then((r) => (r.ok ? r.json() : null)).then((d) => d && setRows(d)).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const t = term.trim().toUpperCase();
  return (
    <div className="pane-body fill">
      <label className="mk-search">
        <Icon icon={Search01Icon} size={16} />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Rechercher" spellCheck={false} />
      </label>
      <div className="mk-cols"><span>Symbole</span><span>Dernier</span><span>24 h</span><span>Volume</span></div>
      <div className="mk-list">
        {rows.filter((r) => !t || r.symbol.includes(t)).slice(0, 120).map((r) => (
          <div key={r.symbol} className={`mk${r.symbol === current ? ' active' : ''}`} onClick={() => onSelect(r.symbol)}>
            <span><b>{r.symbol.replace(/USDT$/, '')}</b><small>USDT</small></span>
            <span>{fmt(r.last, 6)}</span>
            <span className={r.change >= 0 ? 'pos' : 'neg'}>{sgn(r.change)} %</span>
            <span className="muted">{vol(r.volume)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
