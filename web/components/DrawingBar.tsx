'use client';
// Barre des outils de dessin, à gauche du graphique : curseur, outils (Alt + lettre), suppression
// du dessin sélectionné et effacement de tous les dessins du symbole.
import type { ReactNode } from 'react';
import { Cursor01Icon, Delete02Icon, Eraser01Icon } from '@hugeicons/core-free-icons';
import { Icon } from './ui';
import { engine } from '@/lib/engine';
import { useLive } from '@/lib/store';
import { TOOLS } from '@/lib/drawings/tools.js';

// Icônes des outils (tracés simples, même trait que Hugeicons).
const GLYPHS: Record<string, ReactNode> = {
  trend: (
    <>
      <path d="M6.5 17.5 17.5 6.5" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="5" r="2" />
    </>
  ),
  hline: (
    <>
      <path d="M3 12h7M14 12h7" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  hray: (
    <>
      <path d="M8 12h13" />
      <circle cx="5" cy="12" r="2" />
    </>
  ),
  vline: (
    <>
      <path d="M12 3v7M12 14v7" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
};

function Glyph({ id }: { id: string }) {
  return (
    <svg className="ico" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      {GLYPHS[id]}
    </svg>
  );
}

export function DrawingBar() {
  const draw = useLive((s) => s.draw);
  const ed = () => engine.chart?.drawings;
  return (
    <nav id="drawbar" aria-label="Outils de dessin">
      <button type="button" className={`rail-btn${draw.tool ? '' : ' on'}`} title="Curseur (Échap)" onClick={() => ed()?.setTool(null)}>
        <Icon icon={Cursor01Icon} size={18} />
      </button>
      <span className="rail-sep" />
      {Object.entries(TOOLS).map(([id, t]) => (
        <button key={id} type="button" className={`rail-btn${draw.tool === id ? ' on' : ''}`} title={`${t.label} (Alt+${t.key})`}
          onClick={() => ed()?.setTool(draw.tool === id ? null : id)}>
          <Glyph id={id} />
        </button>
      ))}
      <span className="rail-sep" />
      <button type="button" className="rail-btn" title="Supprimer le dessin sélectionné (Suppr)" disabled={!draw.sel} onClick={() => ed()?.removeSelected()}>
        <Icon icon={Delete02Icon} size={18} />
      </button>
      <button type="button" className="rail-btn" title="Effacer tous les dessins de ce symbole" disabled={!draw.count}
        onClick={() => window.confirm(`Effacer les ${draw.count} dessin(s) de ce symbole ?`) && ed()?.clear()}>
        <Icon icon={Eraser01Icon} size={18} />
      </button>
    </nav>
  );
}
