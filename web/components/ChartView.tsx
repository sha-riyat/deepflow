'use client';
// Graphique : instancie le moteur Canvas/WebGL (hors du rendu React) et affiche par-dessus la
// légende interactive, les commandes des panneaux et le bouton « Direct ».
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft01Icon, ArrowRight01Icon, ArrowRightDoubleIcon, Cancel01Icon, MinusSignIcon, PlusSignIcon, RefreshCwIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from './ui';
import { Legend, type Bar } from './Legend';
import { Chart } from '@/lib/chart/chart.js';
import { PANES } from '@/lib/chart/panes.js';
import { setFontFamily } from '@/lib/theme.js';
import { engine, getData } from '@/lib/engine';
import { setLive, useLive, type DrawState, type UiPrefs } from '@/lib/store';

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

export function ChartView({ prefs, update }: { prefs: UiPrefs; update: (p: Partial<UiPrefs>, kind: 'view' | 'style' | 'layout') => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [panes, setPanes] = useState<{ kind: string; y: number }[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [paneVals, setPaneVals] = useState<Record<string, [string, string, string][]>>({});
  const [plotH, setPlotH] = useState(0);
  const [nearNav, setNearNav] = useState(false);
  const following = useLive((s) => s.following);

  useEffect(() => {
    setFontFamily(getComputedStyle(document.body).fontFamily);
    const chart = new Chart(host.current, getData());
    chart.onHover = (b: Bar | null) => setBar(b);
    chart.onFollow = (f: boolean) => setLive({ following: f });
    chart.onValues = (v: Record<string, string>) => setValues(v);
    chart.onPaneValues = (v: Record<string, [string, string, string][]>) => setPaneVals(v);
    chart.drawings.onState = (draw: DrawState) => setLive({ draw });
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
      <Legend prefs={prefs} update={update} bar={bar} values={values} />
      <div id="pane-legends">
        {panes.map((p) => (
          <div key={`lg-${p.kind}`} className="pane-lg" style={{ top: p.y + 5 }}>
            <b>{(PANES as Record<string, string>)[p.kind]}</b>
            {(paneVals[p.kind] ?? []).map(([label, text, tone], k) => text && (
              <span key={k}>{label && <i>{label}</i>}<em className={tone}>{text}</em></span>
            ))}
          </div>
        ))}
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
