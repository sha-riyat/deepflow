// Check-list avant trade gardée dans le navigateur (voir shared/checklist.js) : cases cochées, et dernière
// note proposée (reprise par le formulaire du journal). Stockage indisponible : rien n'est gardé.
import { checklistSummary, cleanChecked } from '@shared/checklist.js';

const KEY = 'deepflow.checklist';

export function loadChecked(): string[] {
  try {
    return cleanChecked(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

export function saveChecked(checked: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(checked));
  } catch {
    // stockage indisponible : la liste reste dans la fenêtre seulement
  }
}

// Note A / B / C proposée par la check-list actuelle, ou null si rien n'est coché.
export function checklistGrade(): 'A' | 'B' | 'C' | null {
  const checked = loadChecked();
  return checked.length ? (checklistSummary(checked).grade as 'A' | 'B' | 'C') : null;
}
