// Pont entre React et le moteur : graphiques de l'espace de travail (voir pane.ts), graphique actif
// (son état est recopié dans le store global : barres, panneaux et outils agissent sur lui),
// widgets impératifs (DOM, trades) qui suivent le graphique actif, et alertes du flux partagé.
import { DataManager } from './chart/data.js';
import { Pane, type ChartLike, type PaneLive } from './pane';
import { setLive } from './store';
import { stream } from './stream';
import type { AlertFired, Tick } from './types';

class Engine {
  panes = new Map<string, Pane>();
  active: Pane | null = null;
  tape: { push(t: Tick): void; clear(): void; setBigThreshold(v: number | null): void } | null = null;
  dom: { update(d: unknown): void } | null = null;
  setReplay: ((on: boolean) => void) | null = null; // bascule le graphique actif sur le replay (Workspace)
  onAlert: ((a: AlertFired) => void) | null = null; // déclenchement d'alerte (Workspace)

  // Moteur de dessin du graphique actif.
  get chart(): ChartLike | null {
    return this.active?.chart ?? null;
  }
}

export const engine = new Engine();

const hooks = {
  changed(pane: Pane, patch: Partial<PaneLive>) {
    if (engine.active === pane) setLive(patch);
  },
  tick(pane: Pane, tick: Tick) {
    if (engine.active === pane) engine.tape?.push(tick);
  },
  dom(pane: Pane, d: unknown) {
    if (engine.active === pane) engine.dom?.update(d);
  },
  reset(pane: Pane) {
    if (engine.active === pane) engine.tape?.clear();
  },
};

// Graphique d'identifiant `id` (créé au besoin).
export function paneOf(id: string): Pane {
  let pane = engine.panes.get(id);
  if (!pane) {
    pane = new Pane(id, hooks);
    engine.panes.set(id, pane);
  }
  return pane;
}

export function dropPane(id: string) {
  engine.panes.get(id)?.dispose();
  engine.panes.delete(id);
}

// Rend un graphique actif : son état devient celui des barres et des panneaux.
export function activate(pane: Pane) {
  if (engine.active === pane) return;
  engine.active = pane;
  setLive({ ...pane.live });
  engine.tape?.clear();
}

// Réticule synchronisé : l'heure sous la souris d'un graphique s'affiche sur les autres.
export function syncCrosshair(from: Pane, t: number | null) {
  for (const pane of engine.panes.values()) {
    if (pane === from || !pane.chart) continue;
    (pane.chart as ChartLike & { syncT: number | null }).syncT = t;
  }
}

// Données du graphique actif.
const idle = new DataManager(() => {});
export function getData(): DataManager {
  return engine.active?.data ?? idle;
}

stream.onGlobal = (name, data) => {
  if (name === 'alerts') setLive({ alerts: data as never });
  else engine.onAlert?.(data as AlertFired);
};

stream.onError = () => {
  for (const pane of engine.panes.values()) pane.set({ status: 'Serveur injoignable, reconnexion…', conn: 'off' });
};
