'use client';
// Barre du haut : symbole, intervalles favoris + menu complet, style, footprint, Indicateurs,
// Alerte, état de connexion, réglages d'affichage, plein écran.
import { useState } from 'react';
import {
  AlarmClockPlusIcon, Analytics01Icon, ChartAverageIcon, ChartBarLineIcon, ChartCandlestickIcon, ChartIncreaseIcon,
  ChartLineData01Icon, FullScreenIcon, FunctionSquareIcon, GridTableIcon, LayoutListIcon, Search01Icon, Settings02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon, MenuButton, MenuItem, Switch } from './ui';
import { STYLES } from '@/lib/layers/candles.js';
import { FP_MODES } from '@/lib/layers/footprint.js';
import { PANES } from '@/lib/chart/panes.js';
import { niceStep } from '@/lib/chart/axes.js';
import { fmt } from '@/lib/fmt.js';
import { GROUPS, LAYERS } from '@/lib/indicators.js';
import { useLive, type UiPrefs } from '@/lib/store';

export const TYPES: Record<string, string> = { tick: 'Ticks', volume: 'Volume', range: 'Range', delta: 'Delta', renko: 'Renko' };
export const INTERVALS: Record<number, string> = {
  1000: '1s', 5000: '5s', 15000: '15s', 30000: '30s', 60000: '1m', 180000: '3m', 300000: '5m', 900000: '15m',
  1800000: '30m', 3600000: '1h', 7200000: '2h', 14400000: '4h', 21600000: '6h', 43200000: '12h', 86400000: '1J', 604800000: '1S',
};
const FAVORITES = [60000, 300000, 900000, 3600000, 14400000, 86400000];
const PANE_SUB: Record<string, string> = {
  volume: 'Volume par bougie, couleur de la bougie',
  delta: 'Achats moins ventes agressifs par bougie',
  cvd: 'Delta cumulé depuis la première bougie chargée',
  oi: 'Open interest Binance (futures, pas de 5 min)',
  liq: 'Montant liquidé par bougie (futures)',
};
type LayerDef = { label: string; sub: string; group: string };
const STYLE_ICON: Record<string, IconSvgElement> = {
  candles: ChartCandlestickIcon, hollow: ChartCandlestickIcon, heikin: ChartCandlestickIcon, volcandles: ChartCandlestickIcon,
  bars: ChartBarLineIcon, line: ChartLineData01Icon, step: ChartLineData01Icon, baseline: ChartLineData01Icon, area: ChartAverageIcon,
  columns: Analytics01Icon, hilo: Analytics01Icon, linebreak: ChartIncreaseIcon, kagi: ChartIncreaseIcon, pnf: ChartIncreaseIcon, tpo: LayoutListIcon,
};

export function defaultParam(type: string, price: number, bucket: number): number {
  if (type === 'tick') return 500;
  if (type === 'volume') return niceStep(250_000 / price) ?? 1;
  if (type === 'delta') return niceStep(50_000 / price) ?? 1;
  return Number((bucket * 10).toPrecision(6));
}

export function seriesLabel(p: Pick<UiPrefs, 'type' | 'param'>): string {
  return p.type === 'time' ? INTERVALS[p.param] ?? `${p.param} ms` : `${TYPES[p.type]} ${fmt(p.param, 6)}`;
}

type Kind = 'series' | 'style' | 'view' | 'layout';
interface Props {
  prefs: UiPrefs;
  update: (patch: Partial<UiPrefs>, kind: Kind) => void;
  onSymbol: () => void;
  onAlert: () => void;
}

const CONN_TEXT: Record<string, string> = { synced: 'En direct', syncing: 'Synchronisation…', 'depth connected': 'Carnet connecté', 'trades connected': 'Trades connectés' };

export function TopBar({ prefs, update, onSymbol, onAlert }: Props) {
  const meta = useLive((s) => s.meta);
  const conn = useLive((s) => s.conn);
  const status = useLive((s) => s.status);
  const quote = useLive((s) => s.quote);
  const [param, setParam] = useState('');
  const price = quote ? (quote.bid + quote.ask) / 2 : 1;
  const setSeries = (type: string, value: number) => update({ type, param: value }, 'series');
  const custom = prefs.type !== 'time' || !FAVORITES.includes(prefs.param);

  return (
    <header id="topbar">
      <span className="logo">deepflow</span>
      <button type="button" className="symbol-btn" onClick={onSymbol} title="Rechercher un symbole (tapez au clavier)">
        <Icon icon={Search01Icon} size={16} />
        <span>{meta?.symbol ?? '—'}</span>
        {meta && <span className="tag">{meta.market === 'futures' ? 'PERP' : 'SPOT'}</span>}
      </button>
      <span className="tb-sep" />
      <div className="intervals">
        {FAVORITES.map((ms) => (
          <button key={ms} type="button" className={`tb-btn${prefs.type === 'time' && prefs.param === ms ? ' on' : ''}`} onClick={() => setSeries('time', ms)}>
            {INTERVALS[ms]}
          </button>
        ))}
        {custom && <span className="tb-btn on">{seriesLabel(prefs)}</span>}
      </div>
      <MenuButton title="Tous les intervalles et bougies d'activité">
        {(close) => (
          <>
            <div className="pop-title">Temps</div>
            <div className="pop-grid">
              {Object.entries(INTERVALS).map(([ms, label]) => (
                <MenuItem key={ms} label={label} on={prefs.type === 'time' && prefs.param === Number(ms)} onClick={() => (setSeries('time', Number(ms)), close())} />
              ))}
            </div>
            <div className="pop-sep" />
            <div className="pop-title">Bougies d’activité</div>
            {Object.entries(TYPES).map(([k, label]) => (
              <MenuItem key={k} label={label} on={prefs.type === k} hint={prefs.type === k ? <span className="hint">{fmt(prefs.param, 6)}</span> : null}
                onClick={() => setSeries(k, defaultParam(k, price, meta?.bucket ?? 1))} />
            ))}
            {prefs.type !== 'time' && (
              <form className="pop-param" onSubmit={(e) => (e.preventDefault(), Number(param) > 0 && (setSeries(prefs.type, Number(param)), close()))}>
                <input type="number" min="0" step="any" placeholder={String(prefs.param)} value={param} onChange={(e) => setParam(e.target.value)} aria-label="Taille de bougie" />
                <button type="submit" className="btn small">Appliquer</button>
              </form>
            )}
          </>
        )}
      </MenuButton>
      <span className="tb-sep" />
      <MenuButton icon={STYLE_ICON[prefs.style]} title="Type de graphique">
        {(close) =>
          Object.entries(STYLES as Record<string, string>).map(([k, label]) => (
            <MenuItem key={k} label={label} icon={STYLE_ICON[k]} on={prefs.style === k} onClick={() => (update({ style: k }, 'style'), close())} />
          ))
        }
      </MenuButton>
      <MenuButton icon={GridTableIcon} label="Footprint" active={prefs.fpMode !== 'off'} title="Footprint dans les bougies">
        {(close) => (
          <>
            <div className="pop-title">Footprint dans les bougies</div>
            {Object.entries(FP_MODES as Record<string, string>).map(([k, label]) => (
              <MenuItem key={k} label={label} on={prefs.fpMode === k}
                onClick={() => (update({ fpMode: k }, (prefs.fpMode === 'off') !== (k === 'off') ? 'series' : 'view'), close())} />
            ))}
          </>
        )}
      </MenuButton>
      <MenuButton icon={FunctionSquareIcon} label="Indicateurs" caret={false} wide className="ind-btn">
        {() => {
          const toggle = (k: string) => update({ layers: { ...prefs.layers, [k]: !prefs.layers[k] } }, 'view');
          const group = (g: string) => (Object.entries(LAYERS) as [string, LayerDef][]).filter(([, d]) => d.group === g).map(([k, d]) => (
            <MenuItem key={k} label={d.label} sub={d.sub} on={prefs.layers[k]} hint={<Switch />} onClick={() => toggle(k)} />
          ));
          const [flow, levels, trade] = GROUPS;
          return (
            <div className="pop-cols">
              <div>
                <div className="pop-title">{flow[1]}</div>
                {group(flow[0])}
                <div className="pop-sep" />
                <div className="pop-title">{trade[1]}</div>
                {group(trade[0])}
              </div>
              <div>
                <div className="pop-title">{levels[1]}</div>
                {group(levels[0])}
                <div className="pop-sep" />
                <div className="pop-title">Panneaux sous le graphique</div>
                {Object.entries(PANES as Record<string, string>).map(([k, label]) => (
                  <MenuItem key={k} label={label} sub={PANE_SUB[k]} on={prefs.panes.includes(k)} hint={<Switch />}
                    onClick={() => update({ panes: prefs.panes.includes(k) ? prefs.panes.filter((p) => p !== k) : [...prefs.panes, k] }, 'layout')} />
                ))}
              </div>
            </div>
          );
        }}
      </MenuButton>
      <button type="button" className="tb-btn" onClick={onAlert} title="Créer une alerte au prix courant">
        <Icon icon={AlarmClockPlusIcon} />
        <span>Alerte</span>
      </button>
      <div className="tb-right">
        <span className={`conn ${conn}`}>
          <i />
          <span>{CONN_TEXT[status] ?? status}</span>
        </span>
        <MenuButton icon={Settings02Icon} caret={false} align="right" title="Réglages d’affichage">
          {() => (
            <>
              <div className="pop-title">Contraste de la heatmap · {prefs.gamma.toFixed(2)}</div>
              <MenuItem label="Plus de détails" hint={<span className="hint">↑</span>} onClick={() => update({ gamma: Math.max(0.2, prefs.gamma - 0.1) }, 'view')} />
              <MenuItem label="Moins de bruit" hint={<span className="hint">↓</span>} onClick={() => update({ gamma: Math.min(3, prefs.gamma + 0.1) }, 'view')} />
            </>
          )}
        </MenuButton>
        <button type="button" className="tb-btn icon" title="Plein écran"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>
          <Icon icon={FullScreenIcon} />
        </button>
      </div>
    </header>
  );
}
