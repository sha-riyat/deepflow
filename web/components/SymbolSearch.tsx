'use client';
// Recherche de symbole (fenêtre modale) : filtre instantané, flèches + Entrée, prix et 24 h.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from './ui';
import { fmt, sgn } from '@/lib/fmt.js';
import type { Ticker } from '@/lib/types';
import { getLive } from '@/lib/store';

const vol = (v: number) => (v >= 1e9 ? `${fmt(v / 1e9, 2)} Md` : `${fmt(v / 1e6, 1)} M`);

export function SymbolSearch({ initial, onClose, onSelect }: { initial: string; onClose: () => void; onSelect: (s: string) => void }) {
  const [term, setTerm] = useState(initial);
  const [rows, setRows] = useState<Ticker[] | null>(null);
  const [sel, setSel] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Binance injoignable : le collecteur répond par une erreur, la liste reste vide (sans planter).
    fetch(`/api/tickers?market=${getLive().meta?.market ?? 'futures'}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, []);

  const shown = useMemo(() => {
    const t = term.trim().toUpperCase();
    return (rows ?? []).filter((r) => !t || r.symbol.includes(t)).slice(0, 60);
  }, [rows, term]);

  useEffect(() => {
    list.current?.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const choose = (symbol: string) => {
    onClose();
    onSelect(symbol);
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Rechercher un symbole">
        <div className="modal-head">
          <Icon icon={Search01Icon} />
          <input
            autoFocus
            value={term}
            placeholder="Symbole, ex. BTC, ETH, XAU"
            spellCheck={false}
            onChange={(e) => (setTerm(e.target.value), setSel(0))}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') setSel(Math.min(shown.length - 1, sel + 1));
              else if (e.key === 'ArrowUp') setSel(Math.max(0, sel - 1));
              else if (e.key === 'Enter' && shown[sel]) choose(shown[sel].symbol);
              else return;
              e.preventDefault();
            }}
          />
        </div>
        <div className="modal-list" ref={list}>
          {rows === null && <p className="note pad">Chargement des marchés…</p>}
          {rows !== null && shown.length === 0 && <p className="note pad">Aucun marché trouvé.</p>}
          {shown.map((r, i) => (
            <div key={r.symbol} className={`modal-row${i === sel ? ' sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => choose(r.symbol)}>
              <span className="left">
                <b>{r.symbol.replace(/USDT$/, '')}</b>
                <span className="muted"> USDT · Perpétuel</span>
              </span>
              <span>{fmt(r.last, 6)}</span>
              <span className={r.change >= 0 ? 'pos' : 'neg'}>{sgn(r.change)} %</span>
              <span className="muted">{vol(r.volume)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
