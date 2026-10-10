// État en direct partagé par les composants, sans bibliothèque : un store observable lu via
// useSyncExternalStore. Les données à haute fréquence (ticks, bougies) restent hors de React.
import { useSyncExternalStore } from 'react';
import type { AlertFired, AlertItem, Dom, HistoryStatus, Mark, Meta } from './types';
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
  draw: DrawState;
}

// Outils de dessin : outil actif (null = curseur), sélection, nombre de dessins du symbole.
export interface DrawState {
  tool: string | null;
  sel: boolean;
  count: number;
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
  draw: { tool: null, sel: false, count: 0 },
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

// ---------- Préférences mémorisées ----------

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
  rail: { open: string[]; width: number; split: number };
}

export type IndicatorOptions = Record<string, Record<string, number | string>>;

const KEY = 'deepflow.ui.v2';
export const DEFAULT_PREFS: UiPrefs = {
  type: 'time',
  param: 60_000,
  style: 'candles',
  fpMode: 'off',
  panes: ['volume', 'delta'],
  layers: { heat: true, bubbles: true, big: true, quotes: true, profile: false, prev: true, div: true, naked: true, vwap: false, alerts: true, liq: true },
  opts: defaultOptions() as IndicatorOptions,
  legend: true,
  gamma: 0.9,
  rail: { open: ['flow', 'dom'], width: 360, split: 0.55 },
};

// Panneaux retirés avec la partie automatique : Signal devient Flux, Compte disparaît.
const RENAMED: Record<string, string | null> = { signal: 'flow', account: null };

export function loadPrefs(): UiPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const opts = Object.fromEntries(Object.entries(DEFAULT_PREFS.opts).map(([k, v]) => [k, { ...v, ...saved.opts?.[k] }]));
    const rail = { ...DEFAULT_PREFS.rail, ...saved.rail };
    rail.open = rail.open.map((id: string) => (id in RENAMED ? RENAMED[id] : id)).filter(Boolean);
    const { signals: _signals, ...layers } = { ...DEFAULT_PREFS.layers, ...saved.layers };
    return { ...DEFAULT_PREFS, ...saved, layers, opts, rail };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: UiPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // stockage indisponible (navigation privée) : préférences non mémorisées
  }
}
