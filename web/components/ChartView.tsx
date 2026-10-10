'use client';
// Un graphique de l'espace de travail : instancie le moteur Canvas/WebGL (hors du rendu React), suit
// la session de son graphique et affiche par-dessus la légende interactive, les commandes des
// panneaux et le bouton « Direct ». Un clic le rend actif (barres et outils agissent sur lui).
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft01Icon, ArrowRight01Icon, ArrowRightDoubleIcon, Cancel01Icon, MinusSignIcon, PlusSignIcon, RefreshCwIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from './ui';
import { Legend, type Bar } from './Legend';
import { DrawingStyle } from './DrawingStyle';
import { NoteEditor } from './NoteEditor';
import { Chart } from '@/lib/chart/chart.js';
import { PANES } from '@/lib/chart/panes.js';
import { setFontFamily } from '@/lib/theme.js';
import { paneOf } from '@/lib/engine';
import { usePane } from '@/lib/pane';
import { useLive, type DrawState, type UiPrefs } from '@/lib/store';
import type { PaneSpec } from '@/lib/layout';

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

type Update = (p: Partial<UiPrefs>, kind: 'view' | 'style' | 'layout') => void;

interface Props {
  spec: PaneSpec;
  compact: boolean; // graphique non actif d'une grille : légende repliée
  source: string; // session suivie : clé directe ou « replay »
  active: boolean;
  onActivate: () => void;
  update: Update;
}

export function ChartView({ spec, source, active, compact, onActivate, update }: Props) {
  const pane = paneOf(spec.id);
  const prefs = spec.prefs;
  const host = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [panes, setPanes] = useState<{ kind: string; y: number }[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [paneVals, setPaneVals] = useState<Record<string, [string, string, string][]>>({});
  const [plotH, setPlotH] = useState(0);
  const [nearNav, setNearNav] = useState(false);
  const following = usePane(pane, (s) => s.following);
  const meta = usePane(pane, (s) => s.meta);
  const alerts = useLive((s) => s.alerts);

  useEffect(() => {
    setFontFamily(getComputedStyle(document.body).fontFamily);
    const chart = new Chart(host.current, pane.data);
    chart.onHover = (b: Bar | null) => setBar(b);
    chart.onFollow = (f: boolean) => pane.set({ following: f });
    chart.onValues = (v: Record<string, string>) => setValues(v);
    chart.onPaneValues = (v: Record<string, [string, string, string][]>) => setPaneVals(v);
    chart.drawings.onState = (draw: DrawState) => pane.set({ draw });
    chart.onLayout = (rects: { kind: string; y: number }[], h: number) => {
      setPanes(rects);
      setPlotH(h);
    };
    pane.attach(chart);
    document.fonts?.ready.then(() => chart.invalidate());
    return () => {
      chart.destroy();
      pane.attach(null);
    };
  }, [pane]);

  // Session suivie (changement de symbole, replay) ; réglages transmis au moteur.
  useEffect(() => pane.follow(source), [pane, source]);
  useEffect(() => {
    pane.apply(prefs);
    pane.chart?.invalidate();
  }, [pane, prefs]);

  // Alertes de prix de ce symbole dessinées sur le graphique.
  useEffect(() => {
    if (!pane.chart) return;
    pane.chart.alerts = alerts.items.filter((a) => a.enabled && a.type === 'price' && a.symbol === meta?.symbol);
    pane.chart.invalidate();
  }, [pane, alerts, meta]);

  const chart = () => pane.chart as unknown as NavChart | null;
  return (
    <section
      className={`chart-wrap${active ? ' active' : ''}`}
      onMouseDownCapture={onActivate}
      onMouseMove={(e) => {
        // Les commandes n'apparaissent que dans la bande basse du tracé principal.
        const r = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - r.top;
        const near = y > plotH - NAV_ZONE && y < plotH && e.clientX - r.left < r.width - 84;
        if (near !== nearNav) setNearNav(near);
      }}
      onMouseLeave={() => setNearNav(false)}
    >
      <div className="chart" ref={host} />
      <Legend pane={pane} prefs={prefs} update={update} bar={bar} values={values} compact={compact} />
      {active && <DrawingStyle />}
      {active && <NoteEditor />}
      <div className="pane-legends">
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
            <button key={label} type="button" title={label} onClick={() => { const c = chart(); if (c) act(c); }}>
              <Icon icon={ico} size={16} />
            </button>
          ))}
        </div>
      )}
      {!following && (
        <button type="button" className="go-live" onClick={() => {
          const c = pane.chart;
          if (!c) return;
          c.scale.follow = true;
          c.scale.autoScale = true;
          c.invalidate();
        }}>
          <Icon icon={ArrowRightDoubleIcon} size={16} />
          Direct
        </button>
      )}
    </section>
  );
}
