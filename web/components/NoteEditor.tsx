'use client';
// Saisie d'une note sur le graphique : zone de texte posée sur la note. Entrée valide, Maj + Entrée
// passe à la ligne, Échap annule ; quitter la zone valide aussi.
import { useRef } from 'react';
import { engine } from '@/lib/engine';
import { useLive } from '@/lib/store';

export function NoteEditor() {
  const edit = useLive((s) => s.draw.edit);
  const done = useRef(false);
  if (!edit) return null;
  const finish = (text: string | null) => {
    if (done.current) return;
    done.current = true;
    engine.chart?.drawings.setText(text);
  };
  const lines = edit.text.split('\n');
  return (
    <textarea
      key={edit.id}
      className="note-edit"
      autoFocus
      defaultValue={edit.text}
      placeholder="Note…"
      rows={Math.max(1, lines.length)}
      style={{ left: edit.at[0], top: edit.at[1], color: edit.color, fontSize: edit.size }}
      onFocus={() => (done.current = false)}
      onInput={(e) => {
        const t = e.currentTarget;
        t.rows = Math.max(1, t.value.split('\n').length);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          finish(e.currentTarget.value);
        } else if (e.key === 'Escape') finish(null);
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
    />
  );
}
