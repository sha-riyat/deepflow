// Types partagés par les composants (formes renvoyées par le collecteur).

export interface Meta {
  mode: 'live' | 'replay';
  archive: { from: number } | null; // replay des archives (pilotable depuis l'interface)
  symbol: string;
  market: 'futures' | 'spot';
  bucket: number;
  fpBucket: number;
  domBucket: number;
  frameMs: number;
  base: string;
  quote: string;
  tickSize: number;
}

export interface FlowState {
  symbol: string;
  market: 'futures' | 'spot';
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
  };
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

// État du replay des archives (collecteur) : heure rejouée, vitesse, lecture, fin des données.
export interface ReplayState {
  t: number;
  speed: number;
  playing: boolean;
  end: number;
}
