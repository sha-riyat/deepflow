// Mises en page et modèles d'indicateurs nommés, et fichier d'export (sauvegarde à garder ou à
// passer à un ami) : format versionné, lecture tolérante. Le contenu de chaque mise en page et de
// chaque modèle est complété côté navigateur (normalizeLayout, normalizePrefs).
import { parseDrawings } from './drawings.js';

export const PRESETS_VERSION = 1;
export const NAME_MAX = 40;

// Réglages repris par un modèle d'indicateurs : tout sauf le symbole et l'intervalle, pour
// l'appliquer à n'importe quel graphique.
export const TEMPLATE_KEYS = ['style', 'fpMode', 'panes', 'layers', 'opts', 'gamma'];

export function templateOf(prefs) {
  return Object.fromEntries(TEMPLATE_KEYS.filter((k) => prefs?.[k] !== undefined).map((k) => [k, prefs[k]]));
}

export const cleanName = (name) => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX) : '');

const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

// Liste [{ name, value }] valide : noms non vides et uniques (le dernier l'emporte).
function cleanList(raw) {
  const byName = new Map();
  for (const item of Array.isArray(raw) ? raw : []) {
    const name = cleanName(item?.name);
    if (name && isObject(item.value)) byName.set(name, { name, value: item.value });
  }
  return [...byName.values()];
}

export function parsePresets(text) {
  let raw;
  try {
    raw = JSON.parse(text ?? '');
  } catch {
    raw = null;
  }
  return { layouts: cleanList(raw?.layouts), templates: cleanList(raw?.templates) };
}

export function serializePresets(p) {
  return JSON.stringify({ v: PRESETS_VERSION, layouts: p.layouts, templates: p.templates });
}

// Ajoute ou remplace l'élément `name` (même nom : mise à jour).
export function upsert(list, name, value) {
  const n = cleanName(name);
  if (!n) return list;
  const i = list.findIndex((x) => x.name === n);
  const item = { name: n, value };
  return i < 0 ? [...list, item] : list.map((x, k) => (k === i ? item : x));
}

export const removeNamed = (list, name) => list.filter((x) => x.name !== name);

// Nom libre dans `list` : « Scalping », puis « Scalping (2) », « Scalping (3) »…
export function uniqueName(list, name) {
  const base = cleanName(name) || 'Sans nom';
  const taken = new Set(list.map((x) => x.name));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const n = `${base.slice(0, NAME_MAX - 6)} (${i})`;
    if (!taken.has(n)) return n;
  }
}

// Fichier d'export : mises en page, modèles et dessins.
export function exportFile(presets, drawings) {
  return JSON.stringify({ app: 'deepflow', v: PRESETS_VERSION, layouts: presets.layouts, templates: presets.templates, drawings: { sets: drawings } }, null, 1);
}

// Lecture d'un fichier d'export ; erreur lisible si ce n'en est pas un.
export function readExport(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Fichier illisible (JSON attendu)');
  }
  if (raw?.app !== 'deepflow') throw new Error('Ce fichier n’est pas un export deepflow');
  const { layouts, templates } = parsePresets(JSON.stringify(raw));
  return { layouts, templates, drawings: parseDrawings(JSON.stringify(raw.drawings ?? {})) };
}

// Import : les éléments sont ajoutés (renommés en cas de doublon), les dessins fusionnés (ceux déjà
// présents, même identifiant, sont gardés). Renvoie aussi le nombre d'éléments ajoutés.
export function mergeImport(presets, drawings, incoming) {
  const add = (list, items) => items.reduce((acc, x) => [...acc, { name: uniqueName(acc, x.name), value: x.value }], list);
  const sets = { ...drawings };
  let added = 0;
  for (const [key, list] of Object.entries(incoming.drawings)) {
    const ids = new Set((sets[key] ?? []).map((d) => d.id));
    const fresh = list.filter((d) => !ids.has(d.id));
    added += fresh.length;
    if (fresh.length) sets[key] = [...(sets[key] ?? []), ...fresh];
  }
  return {
    presets: { layouts: add(presets.layouts, incoming.layouts), templates: add(presets.templates, incoming.templates) },
    drawings: sets,
    counts: { layouts: incoming.layouts.length, templates: incoming.templates.length, drawings: added },
  };
}
