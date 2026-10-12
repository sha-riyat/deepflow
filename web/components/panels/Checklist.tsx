'use client';
// Check-list avant de prendre un trade : la routine d'analyse en cases à cocher à la main, par phase.
// Les cases marquées « essentielle » doivent toutes être cochées avant d'entrer ; la part cochée propose
// une note A / B / C pour le journal. Aucun signal : la liste sert à ne sauter aucune étape.
import { useState } from 'react';
import { CHECKLIST, PHASES, checklistSummary } from '@shared/checklist.js';
import { loadChecked, saveChecked } from '@/lib/checklist';

export function Checklist({ onHelp }: { onHelp: (id: string) => void }) {
  const [checked, setChecked] = useState<string[]>(loadChecked);
  const set = (next: string[]) => {
    setChecked(next);
    saveChecked(next);
  };
  const toggle = (id: string) => set(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]);
  const s = checklistSummary(checked);
  return (
    <div className="checklist">
      <div className={`journal-stats checklist-sum ${s.ready ? 'ready' : ''}`}>
        <b>{s.done} / {s.total} cases</b>
        {s.ready
          ? <span className="pos">Cases essentielles cochées : prêt à entrer. Note proposée : <b>{s.grade}</b> (indicatif)</span>
          : <span className="neg">À ne pas entrer : il manque {s.coreMissing.length} case{s.coreMissing.length > 1 ? 's' : ''} essentielle{s.coreMissing.length > 1 ? 's' : ''} (marquées ★).</span>}
        <button type="button" className="tb-btn" disabled={!checked.length} onClick={() => set([])}>Tout décocher</button>
      </div>
      {PHASES.map((phase) => (
        <div key={phase}>
          <div className="pop-title">{phase}</div>
          {CHECKLIST.filter((c) => c.phase === phase).map((c) => (
            <div key={c.id} className="check-row">
              <label>
                <input type="checkbox" checked={checked.includes(c.id)} onChange={() => toggle(c.id)} />
                <span>{c.core && <b title="Essentielle : à cocher avant d’entrer">★ </b>}{c.label}<small className="check-where">{c.where}</small></span>
              </label>
              {c.help && <button type="button" className="tb-btn" title="Ouvrir la fiche liée" onClick={() => onHelp(c.help as string)}>?</button>}
            </div>
          ))}
        </div>
      ))}
      <p className="muted pop-note">Cochez à la main, trade par trade. La note proposée peut être reprise dans le journal. Ce n’est pas un conseil financier.</p>
    </div>
  );
}
