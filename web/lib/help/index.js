// Aide intégrée (panneau Apprendre) : une fiche par indicateur, panneau, mode du footprint et outil,
// avec son statut : donnée mesurée, règle empirique (non prouvée) ou repère de contexte.
import { FLOW_ARTICLES, FOOTPRINT_HELP } from './flow.js';
import { LEVEL_ARTICLES } from './levels.js';
import { PANE_ARTICLES } from './panes.js';
import { STRATEGY_ARTICLES } from './strategy.js';
import { THEORY_ARTICLES } from './theory.js';

export { FOOTPRINT_HELP };
export const ARTICLES = [...PANE_ARTICLES.filter((a) => a.group === 'Méthode'), ...STRATEGY_ARTICLES, ...FLOW_ARTICLES, ...THEORY_ARTICLES.filter((a) => a.group === 'Lire le flux'), ...LEVEL_ARTICLES, ...THEORY_ARTICLES.filter((a) => a.group !== 'Lire le flux'), ...PANE_ARTICLES.filter((a) => a.group !== 'Méthode')];
export const LEVELS = { fact: 'Donnée mesurée', rule: 'Règle empirique (non prouvée)', context: 'Repère de contexte' };

const BY_ID = new Map(ARTICLES.map((a) => [a.id, a]));
export const article = (id) => BY_ID.get(id) ?? null;

// Fiche d'un calque (« layer »), d'un panneau sous le graphique (« pane ») ou d'un outil de dessin.
const PANE_IDS = { volume: 'pane-volume', delta: 'pane-volume', cvd: 'pane-cvd', spot: 'pane-spot', venues: 'pane-venues', oi: 'pane-oi', funding: 'pane-funding', liq: 'pane-liq', stats: 'pane-stats' };
const LAYER_IDS = { alerts: null, profile: 'profile' };
const TOOL_IDS = { long: 'position', short: 'position', avwap: 'avwap', vp: 'vp' };

export function helpId(kind, where = 'layer') {
  if (where === 'pane') return PANE_IDS[kind] ?? null;
  if (where === 'tool') return TOOL_IDS[kind] ?? null;
  if (kind in LAYER_IDS) return LAYER_IDS[kind];
  return BY_ID.has(kind) ? kind : null;
}

// Recherche simple (titre et texte), sans accents ni casse.
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function searchArticles(q) {
  const words = plain(q).split(/\s+/).filter(Boolean);
  if (!words.length) return ARTICLES;
  return ARTICLES.filter((a) => {
    const text = plain([a.title, a.what, ...a.read, ...a.traps].join(' '));
    return words.every((w) => text.includes(w));
  });
}

// Ouvre une fiche dans le panneau Apprendre (écouté par l'espace de travail).
export function openHelp(id) {
  if (id) window.dispatchEvent(new CustomEvent('deepflow-help', { detail: id }));
}
