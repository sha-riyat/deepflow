// Mises en page et modèles d'indicateurs enregistrés (stockage du navigateur, communs à toutes les
// fenêtres), et fichier d'export / import (voir shared/presets.js).
import { exportFile, mergeImport, parsePresets, readExport, serializePresets } from '@shared/presets.js';
import { loadAllSets, saveAllSets } from './drawings/storage.js';

const KEY = 'deepflow.presets';

export interface Named<T> {
  name: string;
  value: T;
}

export interface Presets {
  layouts: Named<Record<string, unknown>>[];
  templates: Named<Record<string, unknown>>[];
}

export function loadPresets(): Presets {
  try {
    return parsePresets(localStorage.getItem(KEY)) as Presets;
  } catch {
    return { layouts: [], templates: [] };
  }
}

export function savePresets(p: Presets): void {
  try {
    localStorage.setItem(KEY, serializePresets(p));
  } catch {
    // stockage indisponible (navigation privée) : rien n'est mémorisé
  }
}

// Fichier téléchargé : mises en page, modèles et dessins de tous les symboles.
export function downloadExport(p: Presets): void {
  const blob = new Blob([exportFile(p, loadAllSets())], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `deepflow-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Import d'un fichier : ajouté à l'existant ; renvoie un résumé (ou lève une erreur lisible).
export async function importFile(file: File, p: Presets): Promise<{ presets: Presets; text: string }> {
  const out = mergeImport(p, loadAllSets(), readExport(await file.text()));
  savePresets(out.presets as Presets);
  saveAllSets(out.drawings);
  const { layouts, templates, drawings } = out.counts;
  return { presets: out.presets as Presets, text: `Importé : ${layouts} mise(s) en page, ${templates} modèle(s), ${drawings} dessin(s).` };
}
