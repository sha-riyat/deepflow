'use client';
// Espace de travail : relie préférences, flux temps réel, graphique, panneaux et raccourcis.
import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './TopBar';
import { ChartView } from './ChartView';
import { Panels, Rail, toggleOpen } from './Rail';
import { StatusBar } from './StatusBar';
import { SymbolSearch } from './SymbolSearch';
import { SignalPanel } from './panels/SignalPanel';
import { AccountPanel } from './panels/AccountPanel';
import { AlertsPanel } from './panels/AlertsPanel';
import { MarketsPanel } from './panels/MarketsPanel';
import { DomPanel, TapePanel } from './panels/LivePanels';
import { connectStream, engine, getData } from '@/lib/engine';
import { getLive, loadPrefs, savePrefs, useLive, type UiPrefs } from '@/lib/store';
import { beep } from '@/lib/sound';
import type { EngineState, Meta } from '@/lib/types';
import { seriesLabel } from './TopBar';

type Kind = 'series' | 'style' | 'view' | 'layout';
interface Toast { id: number; title: string; text: string }

export default function Workspace() {
  const [prefs, setPrefs] = useState<UiPrefs>(loadPrefs);
  const [search, setSearch] = useState<string | null>(null);
  const [st, setSt] = useState<EngineState | null>(null);
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<{ price: number; n: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prefsRef = useRef(prefs);
  const pendingSpan = useRef<number | null>(null);
  const alerts = useLive((s) => s.alerts);
  const meta = useLive((s) => s.meta);
  const signals = useLive((s) => s.signals);

  const toast = useCallback((title: string, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [{ id, title, text }, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
  }, []);

  const applyChart = useCallback((p: UiPrefs) => {
    const chart = engine.chart;
    if (!chart) return;
    Object.assign(chart.settings, { style: p.style, fpMode: p.fpMode, panes: p.panes, layers: p.layers, gamma: p.gamma });
    chart.title = `${getLive().meta?.symbol ?? ''} · ${seriesLabel(p)}`;
  }, []);

  const reloadSeries = useCallback(async (p: UiPrefs) => {
    const chart = engine.chart;
    const m = getLive().meta;
    if (!chart || !m) return;
    applyChart(p);
    // setSpec fixe la nouvelle série avant son premier await : la vue standard est ainsi calculée
    // pour le nouvel intervalle (et non pour l'ancien).
    const loading = getData().setSpec({ type: p.type, param: p.param, fp: p.fpMode !== 'off' ? m.fpBucket : 0 });
    chart.resetView();
    await loading;
    if (pendingSpan.current) {
      chart.scale.follow = true;
      chart.scale.msPerPx = pendingSpan.current / chart.scale.w;
      pendingSpan.current = null;
    }
    chart.invalidate();
  }, [applyChart]);

  const update = useCallback((patch: Partial<UiPrefs>, kind: Kind) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    savePrefs(next);
    applyChart(next);
    if (kind === 'series') reloadSeries(next);
    else if (kind === 'style') engine.chart?.resetView();
    else if (kind === 'layout') engine.chart?.resize();
    engine.chart?.invalidate();
  }, [applyChart, reloadSeries]);

  const refresh = useCallback(() => {
    fetch('/api/state').then((r) => (r.ok ? r.json() : null)).then((d) => d && setSt(d)).catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setBadges((b) => (b.has(id) ? new Set([...b].filter((x) => x !== id)) : b));
    update({ rail: { ...prefsRef.current.rail, open: toggleOpen(prefsRef.current.rail.open, id) } }, 'layout');
  }, [update]);

  const selectSymbol = useCallback(async (symbol: string) => {
    if (getLive().meta?.mode !== 'live' || symbol === getLive().meta?.symbol) return;
    await fetch('/api/symbol', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }) });
  }, []);

  // Flux temps réel.
  useEffect(() => {
    let prev: Meta | null = null;
    const close = connectStream({
      onMeta: (m) => {
        const changed = !prev || m.symbol !== prev.symbol || m.bucket !== prev.bucket;
        prev = m;
        if (engine.chart) engine.chart.meta = m;
        if (changed) reloadSeries(prefsRef.current);
      },
      onReset: () => {},
      onSignal: (s, isNew) => {
        if (isNew && s.status === 'open') {
          if (prefsRef.current.signalSound) beep();
          toast(`Signal ${s.side} · ${s.symbol}`, `${s.label} à ${s.entry}`);
          if (!prefsRef.current.rail.open.includes('signal')) setBadges((b) => new Set([...b, 'signal']));
        }
        refresh();
      },
      onAlert: (a) => {
        beep();
        toast(`${a.label} · ${a.symbol}`, a.text);
        if (window.Notification?.permission === 'granted') new Notification(`${a.label} · ${a.symbol}`, { body: a.text });
        if (!prefsRef.current.rail.open.includes('alerts')) setBadges((b) => new Set([...b, 'alerts']));
      },
      onRefresh: refresh,
    });
    const id = setInterval(refresh, 1000);
    return () => {
      close();
      clearInterval(id);
    };
  }, [reloadSeries, refresh, toast]);

  // Signaux et alertes de prix dessinés sur le graphique.
  useEffect(() => {
    if (!engine.chart) return;
    engine.chart.signals = signals;
    engine.chart.alerts = alerts.items.filter((a) => a.enabled && a.type === 'price' && a.symbol === meta?.symbol);
    engine.chart.invalidate();
  }, [signals, alerts, meta]);

  // Clavier : lettres -> recherche de symbole ; flèches -> contraste de la heatmap.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z0-9]$/.test(e.key) && search === null) {
        e.preventDefault();
        setSearch(e.key.toUpperCase());
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const g = prefsRef.current.gamma + (e.key === 'ArrowUp' ? -0.05 : 0.05);
        update({ gamma: Math.min(3, Math.max(0.2, g)) }, 'view');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [search, update]);

  useEffect(() => applyChart(prefs), [applyChart, prefs]);

  const render = (id: string) => {
    if (id === 'signal') return <SignalPanel st={st} />;
    if (id === 'dom') return <DomPanel />;
    if (id === 'tape') return <TapePanel />;
    if (id === 'markets') return <MarketsPanel onSelect={selectSymbol} />;
    if (id === 'alerts') return <AlertsPanel preset={preset} />;
    return <AccountPanel st={st} sound={prefs.signalSound} setSound={(v) => update({ signalSound: v }, 'view')} />;
  };

  return (
    <>
      <TopBar
        prefs={prefs}
        update={update}
        onSymbol={() => setSearch('')}
        onAlert={() => {
          const q = getLive().quote;
          if (q) setPreset({ price: Number(((q.bid + q.ask) / 2).toFixed(6)), n: Date.now() });
          if (!prefsRef.current.rail.open.includes('alerts')) toggle('alerts');
        }}
      />
      <main id="workspace">
        <ChartView prefs={prefs} update={update} />
        <Panels rail={prefs.rail} setRail={(rail) => update({ rail }, 'layout')} onToggle={toggle} render={render} />
        <Rail rail={prefs.rail} badges={badges} onToggle={toggle} />
      </main>
      <StatusBar onRange={(span, tf) => ((pendingSpan.current = span), update({ type: 'time', param: tf }, 'series'))} />
      {search !== null && <SymbolSearch initial={search} onClose={() => setSearch(null)} onSelect={selectSymbol} />}
      <div id="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast"><b>{t.title}</b><span>{t.text}</span></div>
        ))}
      </div>
    </>
  );
}
