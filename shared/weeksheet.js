// Fiche « narrative » de la semaine (vidéo 21) : avant d'ouvrir le graphique, écrire trois scénarios, les
// données attendues et son biais ; relire en fin de semaine ce qui s'est vraiment passé. Une fiche par
// semaine UTC (lundi 00:00), gardée dans le navigateur.
import { periodStart } from './sessions.js';

export const BIASES = { none: 'Pas de biais', bull: 'Haussier', bear: 'Baissier', range: 'Neutre (range)' };
const MAX = 600;
const text = (v) => (typeof v === 'string' ? v.slice(0, MAX) : '');

// Clé de la semaine (début, lundi 00:00 UTC) qui contient `t`.
export const weekKey = (t) => periodStart(t, 'week');

export const emptySheet = () => ({ bias: 'none', bull: '', bear: '', range: '', data: '', review: '' });

// Fiche complétée et vérifiée (stockage abîmé) : champs texte bornés, biais connu.
export function cleanSheet(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    bias: s.bias in BIASES ? s.bias : 'none',
    bull: text(s.bull), bear: text(s.bear), range: text(s.range), data: text(s.data), review: text(s.review),
  };
}

// Fiche vide ? (rien d'écrit et pas de biais : inutile de la garder)
export const isEmptySheet = (s) => s.bias === 'none' && !s.bull && !s.bear && !s.range && !s.data && !s.review;
