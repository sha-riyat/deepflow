'use client';
// Graphique : instancie le moteur Canvas/WebGL (hors du rendu React) et affiche par-dessus la
// légende interactive, les commandes des panneaux et le bouton « Direct ».
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowRightDoubleIcon, Cancel01Icon, Layers01Icon, MinusSignIcon,
  PlusSignIcon, RefreshCwIcon, ViewIcon, ViewOffIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from './ui';
import { Chart } from '@/lib/chart/chart.js';
import { PANES } from '@/lib/chart/panes.js';
import { setFontFamily } from '@/lib/theme.js';
import { fmt, qty } from '@/lib/fmt.js';
import { engine, getData } from '@/lib/engine';
import { setLive, useLive, type UiPrefs } from '@/lib/store';
import { LAYERS, seriesLabel } from './TopBar';

interface Bar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  b: number;
  s: number;
}

const LAYER_COLOR: Record<string, string> = {
  heat: '#b6d6ff', bubbles: '#4ebe96', big: '#ffa16c', quotes: '#cccccc', profile: '#868f97',
  naked: '#ffa16c', vwap: '#e6e6e6', signals: '#4ebe96', alerts: '#ffa16c',
};

interface NavChart {
  zoom(f: number): void;
  pan(f: number): void;
  resetView(): void;
}

const NAV_ZONE = 90; // hauteur (px) de la bande basse qui révèle les commandes

// Commandes flottantes en bas du graphique ; la dernière revient au zoom standard et au direct.
const NAV: [string, IconSvgElement, (c: NavChart) => void][] = [
  ['Dézoomer', MinusSignIcon, (c) => c.zoom(1.25)],
  ['Zoomer', PlusSignIcon, (c) => c.zoom(0.8)],
  ['Vers le passé', ArrowLeft01Icon, (c) => c.pan(0.15)],
  ['Vers le présent', ArrowRight01Icon, (c) => c.pan(-0.15)],
  ['Réinitialiser la vue', RefreshCwIcon, (c) => c.resetView()],
];

export function ChartView({ prefs, update }: { prefs: UiPrefs; update: (p: Partial<UiPrefs>, kind: 'view' | 'layout') => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [panes, setPanes] = useState<{ kind: string; y: number }[]>([]);
  const [showLayers, setShowLayers] = useState(false);
  const [plotH, setPlotH] = useState(0);
  const [nearNav, setNearNav] = useState(false);
  const meta = useLive((s) => s.meta);
  const following = useLive((s) => s.following);
  const dataStatus = useLive((s) => s.dataStatus);

  useEffect(() => {
    setFontFamily(getComputedStyle(document.body).fontFamily);
    const chart = new Chart(host.current, getData());
    chart.onHover = (b: Bar | null) => setBar(b);
    chart.onFollow = (f: boolean) => setLive({ following: f });
    chart.onLayout = (rects: { kind: string; y: number }[], h: number) => {
      setPanes(rects);
      setPlotH(h);
    };
    engine.chart = chart;
    document.fonts?.ready.then(() => chart.invalidate());
    return () => {
      chart.destroy();
      engine.chart = null;
    };
  }, []);


  const active = Object.keys(LAYERS).filter((k) => prefs.layers[k]);
  const up = bar ? bar.c >= bar.o : true;
  const tone = up ? 'pos' : 'neg';

  return (
    <section
      id="chart-wrap"
      onMouseMove={(e) => {
        // Les commandes n'apparaissent que dans la bande basse du tracé principal.
        const r = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - r.top;
        const near = y > plotH - NAV_ZONE && y < plotH && e.clientX - r.left < r.width - 84;
        if (near !== nearNav) setNearNav(near);
      }}
      onMouseLeave={() => setNearNav(false)}
    >
      <div id="chart" ref={host} />
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
          {active.length > 0 && (
            <button type="button" className="lg-row lg-toggle" onClick={() => setShowLayers(!showLayers)} title="Afficher les couches actives">
              <Icon icon={Layers01Icon} size={14} />
              <span>{active.length} couche{active.length > 1 ? 's' : ''}</span>
              <Icon icon={ArrowDown01Icon} size={12} className={showLayers ? 'flip' : ''} />
            </button>
          )}
          {showLayers && active.map((k) => (
            <div key={k} className="lg-row">
              <span className="dot" style={{ background: LAYER_COLOR[k] }} />
              <span>{LAYERS[k][0]}</span>
              <span className="acts">
                <button type="button" title="Masquer" onClick={() => update({ layers: { ...prefs.layers, [k]: false } }, 'view')}>
                  <Icon icon={prefs.layers[k] ? ViewIcon : ViewOffIcon} size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div id="pane-legends">
        {panes.map((p) => (
          <div key={p.kind} className="lg-row pane-ctl" style={{ top: p.y + 4 }}>
            <span className="acts">
              <button type="button" title={`Retirer ${(PANES as Record<string, string>)[p.kind]}`}
                onClick={() => update({ panes: prefs.panes.filter((x) => x !== p.kind) }, 'layout')}>
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
      {plotH > 120 && (
        <div className={`nav-ctl${nearNav ? ' show' : ''}`} style={{ top: plotH - 46 }}>
          {NAV.map(([label, ico, act]) => (
            <button key={label} type="button" title={label} onClick={() => engine.chart && act(engine.chart as unknown as NavChart)}>
              <Icon icon={ico} size={16} />
            </button>
          ))}
        </div>
      )}
      {!following && (
        <button type="button" id="go-live" onClick={() => engine.chart && ((engine.chart.scale.follow = true), (engine.chart.scale.autoScale = true), engine.chart.invalidate())}>
          <Icon icon={ArrowRightDoubleIcon} size={16} />
          Direct
        </button>
      )}
    </section>
  );
}
