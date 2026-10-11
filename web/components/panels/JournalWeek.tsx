'use client';
// Fiche de la semaine (option) : trois scénarios, données attendues, biais, et bilan de fin de semaine.
// Une fiche par semaine UTC, gardée dans le navigateur ; à écrire avant d'ouvrir le graphique.
import { useState } from 'react';
import { BIASES, cleanSheet, emptySheet, isEmptySheet, weekKey } from '@shared/weeksheet.js';

const KEY = 'deepflow.journal.weeks';
const FIELDS: [string, string][] = [
  ['bull', 'Scénario haussier : que doit-il se passer ?'], ['bear', 'Scénario baissier : que doit-il se passer ?'],
  ['range', 'Scénario neutre (range) : où ?'], ['data', 'Données et événements attendus (dates, niveaux)'], ['review', 'Bilan de fin de semaine : ce qui s’est vraiment passé'],
];

type Sheet = ReturnType<typeof emptySheet>;

function read(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function write(all: Record<string, unknown>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // stockage indisponible : la fiche reste dans la fenêtre seulement
  }
}

export function JournalWeek() {
  const key = weekKey(Date.now());
  const [sheet, setSheet] = useState<Sheet>(() => cleanSheet(read()[String(key)]));
  const [open, setOpen] = useState(false);
  const update = (patch: Partial<Sheet>) => {
    const next = cleanSheet({ ...sheet, ...patch });
    setSheet(next);
    const all = read();
    if (isEmptySheet(next)) delete all[String(key)];
    else all[String(key)] = next;
    write(all);
  };
  const label = new Date(key).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  return (
    <div className="journal-stats journal-week">
      <button type="button" className="tb-btn" onClick={() => setOpen(!open)}>{open ? 'Masquer' : 'Fiche de la semaine'} du {label}{isEmptySheet(sheet) ? '' : ' ✓'}</button>
      {open && (
        <>
          <div className="seg">{Object.entries(BIASES).map(([k, text]) => <button key={k} type="button" className={sheet.bias === k ? 'on' : ''} onClick={() => update({ bias: k })}>{text}</button>)}</div>
          {FIELDS.map(([k, text]) => (
            <label key={k} className="jf-field">
              <span className="muted">{text}</span>
              <textarea rows={2} maxLength={600} value={(sheet as Record<string, string>)[k]} onChange={(e) => update({ [k]: e.target.value })} />
            </label>
          ))}
          <span className="muted">Un biais n’est pas un signal : il sert à repérer ce qui le contredirait.</span>
        </>
      )}
    </div>
  );
}
