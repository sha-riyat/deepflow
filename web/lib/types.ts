// Types partagés par les composants (formes renvoyées par le collecteur).

export interface Meta {
  mode: 'live' | 'replay';
  symbol: string;
  market: 'futures' | 'spot';
  bucket: number;
  fpBucket: number;
  domBucket: number;
  frameMs: number;
  base: string;
  quote: string;
  tickSize: number;
  risk: Record<string, number>;
}

export interface Target {
  R: number;
  pct: number;
  price: number;
  hit: boolean;
}

export interface Signal {
  id: string;
  t: number;
  symbol: string;
  base: string;
  quote: string;
  side: 'LONG' | 'SHORT';
  dir: 1 | -1;
  setup: string;
  label: string;
  why: string[];
  notes: string[];
  entry: number;
  entryType: string;
  stop: number;
  stopCurrent?: number;
  dist: number;
  targets: Target[];
  qty: number;
  notional: number;
  leverage: number;
  riskUsd: number;
  riskPctEff: number;
  feesUsd: number;
  feeR: number;
  maxHoldMs: number;
  status: 'open' | 'closed';
  remainingPct?: number;
  unrealizedR?: number;
  resultR?: number;
  pnlUsd?: number;
  outcome?: 'stop' | 'breakeven' | 'target' | 'time';
  closedAt?: number;
  events: { t: number; text: string }[];
}

export interface Stats {
  n: number;
  wins: number;
  winRate: number;
  avgR: number;
  totalR: number;
  pnlUsd: number;
  maxDDR: number;
}

export interface EngineState {
  t: number | null;
  price: { bid: number; ask: number } | null;
  warmup: boolean;
  warmupPct: number;
  flow: {
    cvd: number;
    imbalance: number;
    vwap: number | null;
    deltaZ: number | null;
    bigPrintThreshold: number | null;
    walls: { side: 'bid' | 'ask'; price: number; qty: number; ageS: number }[];
  } | null;
  atr: number | null;
  active: Signal | null;
  lastRejection: { t: number; label: string; dir: number; reason: string } | null;
  recent: Signal[];
  stats: Stats;
}

export interface Dom {
  bucket: number;
  bids: [number, number][];
  asks: [number, number][];
  vol: [number, number, number][];
}

export interface AlertItem {
  id: string;
  symbol: string;
  type: string;
  params: Record<string, number>;
  once: boolean;
  enabled: boolean;
}

export interface AlertFired {
  id: string;
  t: number;
  symbol: string;
  type: string;
  label: string;
  text: string;
}

export interface HistoryStatus {
  backfill?: { done: number; total: number; error: string | null };
  loading?: number[];
}

export interface Tick {
  t: number;
  bid: number;
  ask: number;
  tr: [number, number, number, number, number?][];
  liq?: [number, number, number, number][];
  an: { cvd: number; delta: number; imb: number; big: [number, number, number][] };
}

export interface Mark {
  t: number;
  mark: number;
  index: number;
  funding: number;
  nextFunding: number;
}

export interface Ticker {
  symbol: string;
  last: number;
  change: number;
  volume: number;
}
