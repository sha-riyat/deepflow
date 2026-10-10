// Sauvegarde des dessins dans le stockage du navigateur : dessins par marché et par symbole (format
// versionné, voir shared/drawings.js), dernier style de chaque outil, capital et risque de l'outil
// position, aimant. Un stockage indisponible (navigation privée) ne bloque rien : rien n'est mémorisé.
import { cleanCalc } from '@shared/measures.js';
import { DRAW_TYPES, cleanStyle, parseDrawings, serializeDrawings } from '@shared/drawings.js';

const KEY = 'deepflow.drawings';
const STYLES_KEY = 'deepflow.drawings.styles'; // outil -> dernier style choisi
const CALC_KEY = 'deepflow.drawings.calc'; // capital et risque du dernier outil position
const MAGNET_KEY = 'deepflow.drawings.magnet';

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, text) {
  try {
    localStorage.setItem(key, text);
  } catch {
    // stockage indisponible
  }
}

function readJSON(key) {
  try {
    return JSON.parse(read(key) ?? 'null');
  } catch {
    return null;
  }
}

// Dessins d'un jeu ('marché:SYMBOLE').
export function loadSet(key) {
  return parseDrawings(read(KEY))[key] ?? [];
}

export function saveSet(key, list) {
  const all = parseDrawings(read(KEY));
  all[key] = list;
  write(KEY, serializeDrawings(all));
}

export function loadStyles() {
  const raw = readJSON(STYLES_KEY) ?? {};
  return Object.fromEntries(Object.keys(DRAW_TYPES).filter((t) => raw[t]).map((t) => [t, cleanStyle(raw[t])]));
}

export const saveStyles = (styles) => write(STYLES_KEY, JSON.stringify(styles));
export const loadCalc = () => cleanCalc(readJSON(CALC_KEY));
export const saveCalc = (calc) => write(CALC_KEY, JSON.stringify(calc));
export const loadMagnet = () => readJSON(MAGNET_KEY) === true;
export const saveMagnet = (on) => write(MAGNET_KEY, JSON.stringify(on));
