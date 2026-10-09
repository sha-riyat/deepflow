// Pont entre React et le moteur : instance unique des données, références vers le graphique et
// les widgets impératifs (DOM, trades), et connexion au flux temps réel du collecteur.
import { DataManager } from './chart/data.js';
import { getLive, setLive } from './store';
import type { AlertFired, Meta, Signal, Tick } from './types';

type Chart = {
  invalidate(): void;
  resize(): void;
  resetView(): void;
  signals: Signal[];
  alerts: unknown[];
  meta: Meta | null;
  scale: { follow: boolean; autoScale: boolean; msPerPx: number; w: number };
  settings: Record<string, unknown>;
  title: string;
};

export const engine: {
  data: DataManager | null;
  chart: Chart | null;
  tape: { push(t: Tick): void; clear(): void; setBigThreshold(v: number | null): void } | null;
  dom: { update(d: unknown): void } | null;
} = { data: null, chart: null, tape: null, dom: null };

export function getData(): DataManager {
  if (!engine.data) {
    engine.data = new DataManager((kind: string, n: number) => {
      const chart = engine.chart as (Chart & { scale: { mode: string; iRight: number } }) | null;
      if (kind === 'older' && chart?.scale.mode === 'index') chart.scale.iRight += n;
      chart?.invalidate();
      const status = engine.data?.status ?? '';
      if (status !== getLive().dataStatus) setLive({ dataStatus: status });
    });
  }
  return engine.data;
}

export interface StreamHandlers {
  onMeta(meta: Meta): void;
  onReset(): void;
  onSignal(s: Signal, isNew: boolean): void;
  onAlert(a: AlertFired): void;
  onRefresh(): void;
}

// Connexion SSE ; retourne la fonction de fermeture.
export function connectStream(h: StreamHandlers): () => void {
  const es = new EventSource('/stream');
  const on = <T>(name: string, fn: (v: T) => void) => es.addEventListener(name, (e) => fn(JSON.parse((e as MessageEvent).data)));
  const known = new Set<string>();
  let ready = false;
  let lastQuote = 0;

  on('reset', () => {
    ready = false;
    known.clear();
    setLive({ signals: [], dom: null, mark: null });
    getData().reset();
    engine.tape?.clear();
    h.onReset();
  });
  on<Meta>('meta', (m) => {
    setLive({ meta: m, conn: m.mode === 'replay' ? 'replay' : 'live' });
    h.onMeta(m);
  });
  on('ready', () => (ready = true));
  on<string>('status', (s) => setLive({ status: s }));
  on<Tick>('tick', (tick) => {
    getData().onTick(tick);
    engine.tape?.push(tick);
    engine.chart?.invalidate();
    if (performance.now() - lastQuote > 250) {
      lastQuote = performance.now();
      setLive({ quote: { bid: tick.bid, ask: tick.ask } });
    }
  });
  on('dom', (d) => engine.dom?.update(d));
  on('history', (hs) => setLive({ history: hs as never }));
  on('mark', (m) => setLive({ mark: m as never }));
  on('alerts', (list) => setLive({ alerts: list as never }));
  on<AlertFired>('alert', (a) => h.onAlert(a));
  on<Signal>('signal', (s) => {
    const isNew = !known.has(s.id);
    known.add(s.id);
    const others = getLive().signals.filter((x) => x.id !== s.id);
    setLive({ signals: [...others, s] });
    h.onSignal(s, isNew && ready);
  });
  on('stats', () => h.onRefresh());
  on('rejection', () => h.onRefresh());
  es.onerror = () => setLive({ status: 'Serveur injoignable, reconnexion…', conn: 'off' });
  return () => es.close();
}

