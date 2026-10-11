// Un graphique de l'espace de travail : ses données (DataManager), son moteur de dessin (Chart, créé
// par ChartView), son état en direct (méta, prix, statut, historique, replay, dessins…) et la
// session du collecteur qu'il suit. L'état du graphique actif est recopié dans le store global
// (voir engine.ts) : barres, panneaux et outils agissent sur lui.
import { useSyncExternalStore } from 'react';
import { DataManager } from './chart/data.js';
import { setReplayClock } from './clock.js';
import { stream } from './stream';
import type { DrawState, DrawStyle, Live, PositionCalc, UiPrefs } from './store';
import type { Meta, ReplayState, Tick } from './types';

export type PaneLive = Omit<Live, 'alerts'>;

const EMPTY: PaneLive = {
  meta: null,
  conn: 'off',
  status: 'Connexion…',
  quote: null,
  dom: null,
  history: null,
  dataStatus: '',
  following: true,
  mark: null,
  replay: null,
  draw: { tool: null, magnet: false, sel: false, id: null, type: null, style: null, calc: null, count: 0, edit: null },
};

// Moteur de dessin vu depuis React (voir lib/chart/chart.js).
export interface ChartLike {
  invalidate(): void;
  resize(): void;
  resetView(): void;
  forgetRequests(): void;
  alerts: unknown[];
  meta: Meta | null;
  scale: { follow: boolean; autoScale: boolean; msPerPx: number; w: number; mode: string; iRight: number };
  settings: Record<string, unknown>;
  drawings: {
    onState: ((s: DrawState) => void) | null;
    setTool(tool: string | null): void;
    setMagnet(on: boolean): void;
    setStyle(patch: Partial<DrawStyle>): void;
    setText(text: string | null): void;
    setCalc(patch: Partial<PositionCalc>, id?: string): void;
    escape(): boolean;
    removeSelected(): boolean;
    clear(): void;
  };
}

// Réactions de l'espace de travail (graphique actif : DOM, liste des trades ; recopie de l'état).
export interface PaneHooks {
  changed(pane: Pane, patch: Partial<PaneLive>): void;
  tick(pane: Pane, tick: Tick): void;
  dom(pane: Pane, d: unknown): void;
  reset(pane: Pane): void;
}

export class Pane {
  live: PaneLive = { ...EMPTY };
  chart: ChartLike | null = null;
  data: DataManager;
  source = ''; // session suivie : clé directe ou « replay »
  prefs: UiPrefs | null = null;
  pendingSpan: number | null = null; // plage demandée par la barre d'état (1J, 5J…)
  private listeners = new Set<() => void>();
  private prevMeta: Meta | null = null;
  private lastQuote = 0;
  private unsub: (() => void) | null = null;

  constructor(public id: string, private hooks: PaneHooks) {
    this.data = new DataManager((kind: string, n: number) => this.onData(kind, n));
  }

  set(patch: Partial<PaneLive>) {
    this.live = { ...this.live, ...patch };
    for (const fn of this.listeners) fn();
    this.hooks.changed(this, patch);
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  // Suit une session : données vidées puis rechargées à l'arrivée de ses métadonnées.
  follow(source: string) {
    if (source === this.source && this.unsub) return;
    this.unsub?.();
    this.source = source;
    this.data.key = source;
    this.data.reset();
    this.chart?.forgetRequests();
    setReplayClock(this.data, null);
    this.prevMeta = null;
    this.set({ meta: null, dom: null, mark: null, history: null, replay: null, quote: null, status: 'Connexion…', conn: 'off' });
    this.unsub = source ? stream.subscribe(source, (name, d) => this.onEvent(name, d)) : null;
  }

  dispose() {
    this.unsub?.();
    this.unsub = null;
  }

  // Réglages du graphique (style, panneaux, indicateurs) transmis au moteur.
  apply(prefs: UiPrefs) {
    this.prefs = prefs;
    if (!this.chart) return;
    Object.assign(this.chart.settings, { style: prefs.style, fpMode: prefs.fpMode, panes: prefs.panes, layers: prefs.layers, opts: prefs.opts, gamma: prefs.gamma, hideCandles: prefs.hideCandles });
  }

  // Recharge la série (type, intervalle, footprint) pour la session suivie.
  async reload() {
    const chart = this.chart;
    const m = this.live.meta;
    const p = this.prefs;
    if (!chart || !m || !p) return;
    this.apply(p);
    // setSpec fixe la nouvelle série avant son premier await : la vue standard est ainsi calculée
    // pour le nouvel intervalle (et non pour l'ancien).
    const loading = this.data.setSpec({ type: p.type, param: p.param, fp: p.fpMode !== 'off' ? m.fpBucket : 0 });
    chart.resetView();
    await loading;
    if (this.pendingSpan) {
      chart.scale.follow = true;
      chart.scale.msPerPx = this.pendingSpan / chart.scale.w;
      this.pendingSpan = null;
    }
    chart.invalidate();
  }

  // Moteur créé (ou recréé) par ChartView : il reprend les réglages et la série en cours.
  attach(chart: ChartLike | null) {
    this.chart = chart;
    if (!chart) return;
    chart.meta = this.live.meta;
    if (this.prefs) this.apply(this.prefs);
    if (this.live.meta) this.reload();
  }

  private onEvent(name: string, d: unknown) {
    switch (name) {
      case 'reset':
        this.set({ dom: null, mark: null });
        this.data.reset();
        this.chart?.forgetRequests(); // données vidées : tout est redemandé, même pour une plage identique
        this.prevMeta = null; // le collecteur repart de zéro (saut dans le replay) : rechargement au prochain meta
        this.hooks.reset(this);
        break;
      case 'meta': {
        const m = d as Meta;
        if (!m.archive) {
          setReplayClock(this.data, null); // direct (ou replay d'un enregistrement) : heure réelle
          this.set({ replay: null });
        }
        this.set({ meta: m, conn: m.mode === 'replay' ? 'replay' : 'live' });
        if (this.chart) this.chart.meta = m;
        const prev = this.prevMeta;
        this.prevMeta = m;
        if (!prev || m.symbol !== prev.symbol || m.bucket !== prev.bucket) this.reload();
        break;
      }
      case 'status':
        this.set({ status: d as string });
        break;
      case 'tick': {
        const tick = d as Tick;
        this.data.onTick(tick);
        this.hooks.tick(this, tick);
        this.chart?.invalidate();
        if (performance.now() - this.lastQuote > 250) {
          this.lastQuote = performance.now();
          this.set({ quote: { bid: tick.bid, ask: tick.ask } });
        }
        break;
      }
      case 'dom':
        this.hooks.dom(this, d);
        break;
      case 'history':
        this.set({ history: d as never });
        break;
      case 'mark':
        this.set({ mark: d as never });
        break;
      case 'replay':
        setReplayClock(this.data, d as ReplayState);
        this.set({ replay: d as ReplayState });
        this.chart?.invalidate();
        break;
      default:
    }
  }

  private onData(kind: string, n: number) {
    const chart = this.chart;
    if (kind === 'older' && chart?.scale.mode === 'index') chart.scale.iRight += n;
    chart?.invalidate();
    const status = this.data.status ?? '';
    if (status !== this.live.dataStatus) this.set({ dataStatus: status });
  }
}

export function usePane<T>(pane: Pane, select: (s: PaneLive) => T): T {
  return useSyncExternalStore(pane.subscribe, () => select(pane.live), () => select(pane.live));
}
