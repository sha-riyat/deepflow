// Pont entre React et le moteur : instance unique des données, références vers le graphique et
// les widgets impératifs (DOM, trades), et connexion au flux temps réel du collecteur.
import { DataManager } from './chart/data.js';
import { getLive, setLive, type DrawState, type DrawStyle, type PositionCalc } from './store';
import type { AlertFired, Meta, Tick } from './types';

type Chart = {
  invalidate(): void;
  resize(): void;
  resetView(): void;
  alerts: unknown[];
  meta: Meta | null;
  scale: { follow: boolean; autoScale: boolean; msPerPx: number; w: number };
  settings: Record<string, unknown>;
  title: string;
  drawings: {
    onState: ((s: DrawState) => void) | null;
    setTool(tool: string | null): void;
    setStyle(patch: Partial<DrawStyle>): void;
    setText(text: string | null): void;
    setCalc(patch: Partial<PositionCalc>): void;
    escape(): boolean;
    removeSelected(): boolean;
    clear(): void;
  };
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
  onAlert(a: AlertFired): void;
}

// Connexion SSE ; retourne la fonction de fermeture.
export function connectStream(h: StreamHandlers): () => void {
  const es = new EventSource('/stream');
  const on = <T>(name: string, fn: (v: T) => void) => es.addEventListener(name, (e) => fn(JSON.parse((e as MessageEvent).data)));
  let lastQuote = 0;

  on('reset', () => {
    setLive({ dom: null, mark: null });
    getData().reset();
    engine.tape?.clear();
    h.onReset();
  });
  on<Meta>('meta', (m) => {
    setLive({ meta: m, conn: m.mode === 'replay' ? 'replay' : 'live' });
    h.onMeta(m);
  });
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
  es.onerror = () => setLive({ status: 'Serveur injoignable, reconnexion…', conn: 'off' });
  return () => es.close();
}

