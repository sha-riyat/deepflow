// Mise en page de l'espace de travail, mémorisée dans le navigateur : grille, graphiques (chacun
// avec sa session, son lien de couleur et ses réglages), graphique actif, rail des panneaux. Les
// anciennes préférences (un seul graphique) sont reprises automatiquement.
import { DEFAULT_PREFS, normalizePrefs, type UiPrefs } from './store';

// Grilles : nombre de graphiques et disposition (voir .charts dans chrome.css).
export const GRIDS: Record<string, { n: number; label: string }> = {
  '1': { n: 1, label: '1 graphique' },
  '2': { n: 2, label: '2 côte à côte' },
  '2v': { n: 2, label: '2 l’un sous l’autre' },
  '3': { n: 3, label: '1 grand et 2 petits' },
  '4': { n: 4, label: '4 (2 × 2)' },
};

// Liens : les graphiques d'une même couleur partagent leur symbole, leur intervalle, ou les deux.
export const LINKS: Record<string, string> = { blue: '#479ffa', orange: '#ffa16c', green: '#4ebe96', purple: '#a78bfa' };
export const LINK_MODES: Record<string, string> = { symbol: 'Symbole', interval: 'Intervalle', both: 'Symbole et intervalle' };

export interface PaneSpec {
  id: string;
  key: string; // session suivie en direct (« futures:BTCUSDT » ; vide : celle du collecteur)
  link: string | null; // couleur de lien (symbole / intervalle partagés), null = indépendant
  prefs: UiPrefs;
}

export interface Rail {
  open: string[];
  width: number;
  split: number;
}

export interface Layout {
  grid: string;
  linkMode: string; // ce que partagent les graphiques liés (voir LINK_MODES)
  panes: PaneSpec[];
  active: string;
  rail: Rail;
}

const KEY = 'deepflow.layout.v1';
const OLD_KEY = 'deepflow.ui.v2'; // préférences d'avant les grilles
export const DEFAULT_RAIL: Rail = { open: ['flow', 'dom'], width: 360, split: 0.55 };

// Panneaux retirés avec la partie automatique : Signal devient Flux, Compte disparaît.
const RENAMED: Record<string, string | null> = { signal: 'flow', account: null };

export const newId = () => Math.random().toString(36).slice(2, 8);

export function newPane(key = '', prefs: UiPrefs = DEFAULT_PREFS): PaneSpec {
  return { id: newId(), key, link: null, prefs: normalizePrefs(prefs) };
}

// Mise en page complétée et vérifiée (stockage abîmé, ancienne version, import d'un fichier).
export function normalizeLayout(raw: Partial<Layout> | null | undefined): Layout {
  const grid = raw?.grid && raw.grid in GRIDS ? raw.grid : '1';
  const panes = (Array.isArray(raw?.panes) ? raw.panes : [])
    .filter((p): p is PaneSpec => Boolean(p) && typeof p.id === 'string')
    .map((p) => ({ id: p.id, key: typeof p.key === 'string' ? p.key : '', link: p.link && p.link in LINKS ? p.link : null, prefs: normalizePrefs(p.prefs) }));
  if (!panes.length) panes.push(newPane());
  const rail = { ...DEFAULT_RAIL, ...raw?.rail };
  rail.open = (Array.isArray(rail.open) ? rail.open : []).map((id: string) => (id in RENAMED ? RENAMED[id] : id)).filter((id): id is string => Boolean(id));
  const active = panes.some((p) => p.id === raw?.active) ? (raw?.active as string) : panes[0].id;
  const linkMode = raw?.linkMode && raw.linkMode in LINK_MODES ? raw.linkMode : 'symbol';
  return { grid, linkMode, panes, active, rail };
}

export function loadLayout(): Layout {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return normalizeLayout(JSON.parse(saved));
    const old = JSON.parse(localStorage.getItem(OLD_KEY) ?? 'null');
    if (old) return normalizeLayout({ grid: '1', panes: [{ id: newId(), key: old.key ?? '', link: null, prefs: old }], rail: old.rail });
  } catch {
    // stockage illisible : mise en page par défaut
  }
  return normalizeLayout(null);
}

export function saveLayout(layout: Layout): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(layout));
  } catch {
    // stockage indisponible (navigation privée) : mise en page non mémorisée
  }
}
