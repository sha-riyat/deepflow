'use client';
// Espace de travail : mise en page (grille de graphiques, graphique actif, rail des panneaux),
// graphiques indépendants (chacun sa session, ses réglages), panneaux et raccourcis. Barre du haut,
// barre d'état, panneaux et outils de dessin agissent sur le graphique actif.
import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './TopBar';
import { ChartView } from './ChartView';
import { DrawingBar } from './DrawingBar';
import { Panels, Rail, toggleOpen } from './Rail';
import { StatusBar } from './StatusBar';
import { SymbolSearch } from './SymbolSearch';
import { FlowPanel } from './panels/FlowPanel';
import { AlertsPanel } from './panels/AlertsPanel';
import { MarketsPanel } from './panels/MarketsPanel';
import { DomPanel, TapePanel } from './panels/LivePanels';
import { activate, dropPane, engine, paneOf } from '@/lib/engine';
import { getLive, type UiPrefs } from '@/lib/store';
import { GRIDS, loadLayout, newId, saveLayout, type Layout, type Rail as RailState } from '@/lib/layout';
import { beep } from '@/lib/sound';
import { toolForKey } from '@/lib/drawings/tools.js';
import type { FlowState } from '@/lib/types';

type Kind = 'series' | 'style' | 'view' | 'layout';
interface Toast { id: number; title: string; text: string }

export default function Workspace() {
  const [layout, setLayout] = useState<Layout>(loadLayout);
  const [search, setSearch] = useState<string | null>(null);
  const [st, setSt] = useState<FlowState | null>(null);
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<{ price: number; n: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [replay, setReplay] = useState<Set<string>>(new Set()); // graphiques branchés sur le replay
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const visible = layout.panes.slice(0, GRIDS[layout.grid].n);
  const activeSpec = visible.find((p) => p.id === layout.active) ?? visible[0];
  const sourceOf = (id: string, key: string) => (replay.has(id) ? 'replay' : key);

  const commit = useCallback((next: Layout) => {
    layoutRef.current = next;
    setLayout(next);
    saveLayout(next);
  }, []);

  const toast = useCallback((title: string, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [{ id, title, text }, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
  }, []);

  // Réglages d'un graphique : mémorisés, puis appliqués à son moteur.
  const updatePane = useCallback((id: string, patch: Partial<UiPrefs>, kind: Kind) => {
    const l = layoutRef.current;
    const panes = l.panes.map((p) => (p.id === id ? { ...p, prefs: { ...p.prefs, ...patch } } : p));
    commit({ ...l, panes });
    const pane = paneOf(id);
    pane.apply(panes.find((p) => p.id === id)!.prefs);
    if (kind === 'series') pane.reload();
    else if (kind === 'style') pane.chart?.resetView();
    else if (kind === 'layout') pane.chart?.resize();
    pane.chart?.invalidate();
  }, [commit]);

  // Barre du haut, barre d'état, clavier : graphique actif.
  const update = useCallback((patch: Partial<UiPrefs>, kind: Kind) => updatePane(layoutRef.current.active, patch, kind), [updatePane]);

  const setKey = useCallback((id: string, key: string) => {
    const l = layoutRef.current;
    commit({ ...l, panes: l.panes.map((p) => (p.id === id ? { ...p, key } : p)) });
  }, [commit]);

  const setRail = useCallback((rail: RailState) => commit({ ...layoutRef.current, rail }), [commit]);

  const refresh = useCallback(() => {
    const src = engine.active?.source;
    if (!src) return;
    fetch(`/api/state?s=${encodeURIComponent(src)}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setSt(d)).catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setBadges((b) => (b.has(id) ? new Set([...b].filter((x) => x !== id)) : b));
    const rail = layoutRef.current.rail;
    setRail({ ...rail, open: toggleOpen(rail.open, id) });
  }, [setRail]);

  // Changer de symbole (graphique actif) : changer de session (marché choisi, sinon le même) ; le
  // collecteur la démarre au besoin. Sans effet sur un graphique en replay.
  const selectSymbol = useCallback((symbol: string, market?: string) => {
    const pane = engine.active;
    const m = getLive().meta;
    if (!pane || pane.source === 'replay') return;
    const key = `${market ?? m?.market ?? 'futures'}:${symbol}`;
    if (key !== pane.source) setKey(pane.id, key);
  }, [setKey]);

  // Grille : graphiques ajoutés en copie du graphique actif (symbole et réglages) ; ceux qui ne
  // tiennent plus restent mémorisés pour un retour à une grille plus grande.
  const setGrid = useCallback((grid: string) => {
    const l = layoutRef.current;
    const n = GRIDS[grid].n;
    const src = l.panes.find((p) => p.id === l.active) ?? l.panes[0];
    const panes = [...l.panes];
    while (panes.length < n) panes.push({ ...src, id: newId(), link: null });
    const active = panes.slice(0, n).some((p) => p.id === l.active) ? l.active : panes[0].id;
    commit({ ...l, grid, panes, active });
  }, [commit]);

  // Graphique actif : le plus récent cliqué (ou le premier visible).
  useEffect(() => activate(paneOf(activeSpec.id)), [activeSpec.id]);

  // Graphiques sans session (première ouverture) : session par défaut du collecteur.
  useEffect(() => {
    const missing = layout.panes.filter((p) => !p.key);
    if (!missing.length) return;
    fetch('/api/sessions').then((r) => r.json()).then((d) => missing.forEach((p) => setKey(p.id, d.default))).catch(() => {});
  }, [layout.panes, setKey]);

  // Graphiques retirés de la mise en page : session quittée, mémoire libérée.
  useEffect(() => {
    const ids = new Set(visible.map((p) => p.id));
    for (const id of [...engine.panes.keys()]) if (!ids.has(id)) dropPane(id);
  }, [visible]);

  useEffect(() => {
    engine.setReplay = (on: boolean) => {
      const id = engine.active?.id;
      if (!id) return;
      setReplay((r) => {
        const next = new Set(r);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    };
    engine.onAlert = (a) => {
      beep();
      toast(`${a.label} · ${a.symbol}`, a.text);
      if (window.Notification?.permission === 'granted') new Notification(`${a.label} · ${a.symbol}`, { body: a.text });
      if (!layoutRef.current.rail.open.includes('alerts')) setBadges((b) => new Set([...b, 'alerts']));
    };
    const id = setInterval(refresh, 1000);
    return () => {
      engine.setReplay = null;
      engine.onAlert = null;
      clearInterval(id);
    };
  }, [refresh, toast]);

  // Clavier : lettres -> recherche de symbole ; flèches -> contraste de la heatmap ; dessins :
  // Alt + lettre -> outil, Échap -> annulation, Suppr -> suppression du dessin sélectionné.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.ctrlKey || e.metaKey) return;
      const draw = engine.chart?.drawings;
      if (e.altKey) {
        const tool = toolForKey(e.key, e.code);
        if (tool && draw) {
          e.preventDefault();
          draw.setTool(getLive().draw.tool === tool ? null : tool);
        }
        return;
      }
      if (e.key === 'Escape' && draw?.escape()) e.preventDefault();
      else if ((e.key === 'Delete' || e.key === 'Backspace') && draw?.removeSelected()) e.preventDefault();
      else if (/^[a-zA-Z0-9]$/.test(e.key) && search === null) {
        e.preventDefault();
        setSearch(e.key.toUpperCase());
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const prefs = layoutRef.current.panes.find((p) => p.id === layoutRef.current.active)?.prefs;
        if (!prefs) return;
        const g = prefs.gamma + (e.key === 'ArrowUp' ? -0.05 : 0.05);
        update({ gamma: Math.min(3, Math.max(0.2, g)) }, 'view');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [search, update]);

  const render = (id: string) => {
    if (id === 'flow') return <FlowPanel st={st} />;
    if (id === 'dom') return <DomPanel />;
    if (id === 'tape') return <TapePanel />;
    if (id === 'markets') return <MarketsPanel onSelect={selectSymbol} />;
    return <AlertsPanel preset={preset} />;
  };

  return (
    <>
      <TopBar
        prefs={activeSpec.prefs}
        update={update}
        onSymbol={() => setSearch('')}
        grid={layout.grid}
        onGrid={setGrid}
        onAlert={() => {
          const q = getLive().quote;
          if (q) setPreset({ price: Number(((q.bid + q.ask) / 2).toFixed(6)), n: Date.now() });
          if (!layoutRef.current.rail.open.includes('alerts')) toggle('alerts');
        }}
      />
      <main id="workspace">
        <DrawingBar />
        <div className={`charts grid-${layout.grid}`}>
          {visible.map((spec) => (
            <ChartView key={spec.id} spec={spec} source={sourceOf(spec.id, spec.key)} active={spec.id === activeSpec.id}
              compact={visible.length > 1 && spec.id !== activeSpec.id}
              onActivate={() => spec.id !== layoutRef.current.active && commit({ ...layoutRef.current, active: spec.id })}
              update={(patch, kind) => updatePane(spec.id, patch, kind)} />
          ))}
        </div>
        <Panels rail={layout.rail} setRail={setRail} onToggle={toggle} render={render} />
        <Rail rail={layout.rail} badges={badges} onToggle={toggle} />
      </main>
      <StatusBar onRange={(span, tf) => {
        if (engine.active) engine.active.pendingSpan = span;
        update({ type: 'time', param: tf }, 'series');
      }} />
      {search !== null && <SymbolSearch initial={search} onClose={() => setSearch(null)} onSelect={selectSymbol} />}
      <div id="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast"><b>{t.title}</b><span>{t.text}</span></div>
        ))}
      </div>
    </>
  );
}
