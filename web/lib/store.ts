// État en direct partagé par les composants, sans bibliothèque : un store observable lu via
// useSyncExternalStore. Il porte l'état du graphique actif (recopié par engine.ts, voir pane.ts) et
// les alertes. Les données à haute fréquence (ticks, bougies) restent hors de React.
import { useSyncExternalStore } from 'react';
import type { AlertFired, AlertItem, Dom, HistoryStatus, Mark, Meta, ReplayState } from './types';
import { defaultOptions } from './indicators.js';

export interface Live {
  meta: Meta | null;
  conn: 'off' | 'live' | 'replay';
  status: string;
  quote: { bid: number; ask: number } | null;
  dom: Dom | null;
  alerts: { items: AlertItem[]; fired: AlertFired[] };
  history: HistoryStatus | null;
  dataStatus: string;
  following: boolean;
  mark: Mark | null;
  replay: ReplayState | null; // replay des archives : heure rejouée, vitesse, lecture
  draw: DrawState;
}

// Outils de dessin : outil actif (null = curseur), sélection et son style, nombre de dessins du symbole.
export interface DrawStyle {
  color: string;
  width: number;
  dash: string;
}

export interface DrawState {
  tool: string | null;
  magnet: boolean;
  sel: boolean;
  id: string | null; // identifiant du dessin sélectionné
  type: string | null; // type du dessin sélectionné
  style: DrawStyle | null;
  calc: PositionCalc | null; // outil position : capital et risque
  count: number;
  edit: NoteEdit | null; // note en cours de saisie
}

export interface PositionCalc {
  capital: number;
  risk: number; // en % du capital
  fees: number; // en % de chaque ordre
}

export interface NoteEdit {
  id: string;
  at: [number, number]; // position (pixels du tracé)
  text: string;
  color: string;
  size: number;
}

let state: Live = {
  meta: null,
  conn: 'off',
  status: 'Connexion…',
  quote: null,
  dom: null,
  alerts: { items: [], fired: [] },
  history: null,
  dataStatus: '',
  following: true,
  mark: null,
  replay: null,
  draw: { tool: null, magnet: false, sel: false, id: null, type: null, style: null, calc: null, count: 0, edit: null },
};
const listeners = new Set<() => void>();

export function getLive(): Live {
  return state;
}

export function setLive(patch: Partial<Live>): void {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useLive<T>(select: (s: Live) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}

// ---------- Réglages d'un graphique (mémorisés avec la mise en page, voir layout.ts) ----------

export interface UiPrefs {
  type: string;
  param: number;
  style: string;
  fpMode: string;
  panes: string[];
  layers: Record<string, boolean>;
  opts: IndicatorOptions;
  legend: boolean; // liste des indicateurs dépliée dans la légende
  gamma: number;
}

export type IndicatorOptions = Record<string, Record<string, number | string>>;

export const DEFAULT_PREFS: UiPrefs = {
  type: 'time',
  param: 60_000,
  style: 'candles',
  fpMode: 'off',
  panes: ['volume', 'delta'],
  layers: { heat: true, bubbles: true, big: true, quotes: true, profile: false, prev: true, open: true, ib: false, keys: false, sessions: false, times: true, div: true, naked: true, vwap: false, alerts: true, liq: true, oiprof: false },
  opts: defaultOptions() as IndicatorOptions,
  legend: true,
  gamma: 0.9,
};

// Réglages complétés par les valeurs par défaut (indicateurs ajoutés depuis, stockage partiel).
export function normalizePrefs(saved: Partial<UiPrefs> | null | undefined): UiPrefs {
  const src = saved ?? {};
  const opts = Object.fromEntries(Object.entries(DEFAULT_PREFS.opts).map(([k, v]) => [k, { ...v, ...src.opts?.[k] }]));
  const { signals: _signals, ...layers } = { ...DEFAULT_PREFS.layers, ...src.layers } as Record<string, boolean>;
  const pick = Object.fromEntries(Object.keys(DEFAULT_PREFS).filter((k) => k in src).map((k) => [k, src[k as keyof UiPrefs]]));
  return { ...DEFAULT_PREFS, ...pick, layers, opts };
}
