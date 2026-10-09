// État en direct partagé par les composants, sans bibliothèque : un store observable lu via
// useSyncExternalStore. Les données à haute fréquence (ticks, bougies) restent hors de React.
import { useSyncExternalStore } from 'react';
import type { AlertFired, AlertItem, Dom, HistoryStatus, Mark, Meta, Signal } from './types';

export interface Live {
  meta: Meta | null;
  conn: 'off' | 'live' | 'replay';
  status: string;
  quote: { bid: number; ask: number } | null;
  dom: Dom | null;
  alerts: { items: AlertItem[]; fired: AlertFired[] };
  history: HistoryStatus | null;
  signals: Signal[];
  dataStatus: string;
  following: boolean;
  mark: Mark | null;
}

let state: Live = {
  meta: null,
  conn: 'off',
  status: 'Connexion…',
  quote: null,
  dom: null,
  alerts: { items: [], fired: [] },
  history: null,
  signals: [],
  dataStatus: '',
  following: true,
  mark: null,
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
  gamma: number;
  rail: { open: string[]; width: number; split: number };
  signalSound: boolean;
}

const KEY = 'deepflow.ui.v2';
export const DEFAULT_PREFS: UiPrefs = {
  type: 'time',
  param: 60_000,
  style: 'candles',
  fpMode: 'off',
  panes: ['volume', 'delta'],
  layers: { heat: true, bubbles: true, big: true, quotes: true, profile: false, naked: true, vwap: false, signals: true, alerts: true, liq: true },
  gamma: 0.9,
  rail: { open: ['signal', 'dom'], width: 360, split: 0.55 },
  signalSound: false,
};

export function loadPrefs(): UiPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULT_PREFS, ...saved, layers: { ...DEFAULT_PREFS.layers, ...saved.layers }, rail: { ...DEFAULT_PREFS.rail, ...saved.rail } };
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
