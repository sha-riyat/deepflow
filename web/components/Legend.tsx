'use client';
// Légende du graphique : symbole, OHLC de la bougie survolée, puis une ligne par indicateur actif
// avec sa valeur courante et, au survol, ses réglages et le bouton pour le retirer.
import { useEffect, useRef, useState } from 'react';
import { ArrowDown01Icon, Cancel01Icon, Layers01Icon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { Icon, OptionRows, type OptDefs } from './ui';
import { LAYERS, OPTIONS } from '@/lib/indicators.js';
import { fmt, qty } from '@/lib/fmt.js';
import { useLive, type UiPrefs } from '@/lib/store';
import { seriesLabel } from './TopBar';

export interface Bar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  b: number;
  s: number;
}

type Update = (p: Partial<UiPrefs>, kind: 'view' | 'layout') => void;

interface RowProps {
  color: string;
  label: string;
  value?: string;
  defs?: OptDefs;
  opts?: Record<string, number | string>;
  setOpt: (key: string, v: number | string) => void;
  onRemove: () => void;
}

function LegendRow({ color, label, value, defs, opts, setOpt, onRemove }: RowProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);
  return (
    <div className={`lg-item${open ? ' open' : ''}`} ref={ref}>
      <div className="lg-row">
        <span className="dot" style={{ background: color }} />
        <span>{label}</span>
        {value && <span className="val">{value}</span>}
        <span className="acts">
          {defs && (
            <button type="button" title="Réglages" className={open ? 'on' : ''} onClick={() => setOpen(!open)}>
              <Icon icon={SlidersHorizontalIcon} size={14} />
            </button>
          )}
          <button type="button" title="Retirer" onClick={onRemove}>
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </span>
      </div>
      {open && defs && opts && (
        <div className="lg-opts">
          <OptionRows defs={defs} values={opts} onChange={setOpt} />
        </div>
      )}
    </div>
  );
}

export function Legend({ prefs, update, bar, values }: { prefs: UiPrefs; update: Update; bar: Bar | null; values: Record<string, string> }) {
  const collapsed = !prefs.legend;
  const meta = useLive((s) => s.meta);
  const dataStatus = useLive((s) => s.dataStatus);
  const active = Object.keys(LAYERS).filter((k) => prefs.layers[k]);
  const count = active.length;
  const tone = bar && bar.c < bar.o ? 'neg' : 'pos';
  const setOpt = (layer: string) => (key: string, v: number | string) =>
    update({ opts: { ...prefs.opts, [layer]: { ...prefs.opts[layer], [key]: v } } }, 'view');

  return (
    <div id="legend">
      <div className="lg-title">
        <b>{meta?.symbol ?? '—'}</b>
        <span className="sub">{seriesLabel(prefs)} · Binance {meta?.market === 'futures' ? 'Perpétuel' : 'Spot'}</span>
      </div>
      {bar && (
        <div className="lg-ohlc">
          <span>O<b className={tone}>{fmt(bar.o)}</b></span>
          <span>H<b className={tone}>{fmt(bar.h)}</b></span>
          <span>B<b className={tone}>{fmt(bar.l)}</b></span>
          <span>C<b className={tone}>{fmt(bar.c)}</b></span>
          <span>Vol<b>{qty(bar.v)}</b></span>
          <span>Δ<b className={bar.b >= bar.s ? 'pos' : 'neg'}>{qty(bar.b - bar.s)}</b></span>
        </div>
      )}
      {dataStatus && <div className="lg-status">{dataStatus}</div>}
      <div className="lg-rows">
        {count > 0 && (
          <button type="button" className="lg-row lg-toggle" onClick={() => update({ legend: collapsed }, 'view')} title={collapsed ? 'Afficher les indicateurs' : 'Replier'}>
            <Icon icon={Layers01Icon} size={14} />
            <span>{count} indicateur{count > 1 ? 's' : ''}</span>
            <Icon icon={ArrowDown01Icon} size={12} className={collapsed ? '' : 'flip'} />
          </button>
        )}
        {!collapsed && active.map((k) => {
          const d = (LAYERS as Record<string, { label: string; color: string }>)[k];
          return (
            <LegendRow key={k} color={d.color} label={d.label} value={values[k]} defs={(OPTIONS as Record<string, OptDefs>)[k]}
              opts={prefs.opts[k]} setOpt={setOpt(k)} onRemove={() => update({ layers: { ...prefs.layers, [k]: false } }, 'view')} />
          );
        })}
      </div>
    </div>
  );
}
