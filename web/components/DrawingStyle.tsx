'use client';
// Barre flottante du dessin sélectionné (en haut du graphique) : couleur, épaisseur, trait, suppression.
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon, MenuButton } from './ui';
import { engine } from '@/lib/engine';
import { useLive, type DrawStyle as Style } from '@/lib/store';
import { DRAW_COLORS, DRAW_DASHES, DRAW_WIDTHS } from '@shared/drawings.js';

const DASH_LABELS: Record<string, string> = { solid: 'Plein', dash: 'Tirets', dot: 'Pointillés' };
const DASH_SVG: Record<string, string> = { solid: '', dash: '6 4', dot: '2 3' };

// Aperçu d'un trait (épaisseur et motif) dans les menus.
function Stroke({ width, dash }: { width: number; dash: string }) {
  return (
    <svg width={34} height={12} className="ico">
      <line x1={2} y1={6} x2={32} y2={6} stroke="currentColor" strokeWidth={width} strokeDasharray={DASH_SVG[dash]} />
    </svg>
  );
}

export function DrawingStyle() {
  const draw = useLive((s) => s.draw);
  const style = draw.style;
  if (!draw.sel || !style) return null;
  const set = (patch: Partial<Style>) => engine.chart?.drawings.setStyle(patch);
  return (
    <div id="drawstyle" onMouseDown={(e) => e.stopPropagation()}>
      <MenuButton title="Couleur" caret={false} label={<i className="swatch" style={{ background: style.color }} />}>
        {(close) => (
          <div className="swatches">
            {DRAW_COLORS.map((c) => (
              <button key={c} type="button" className={c === style.color ? 'on' : ''} title={c} style={{ background: c }}
                onClick={() => (set({ color: c }), close())} />
            ))}
          </div>
        )}
      </MenuButton>
      <MenuButton title="Épaisseur" caret={false} label={<Stroke width={style.width} dash="solid" />}>
        {(close) => DRAW_WIDTHS.map((w) => (
          <button key={w} type="button" className={`pop-item${w === style.width ? ' on' : ''}`} onClick={() => (set({ width: w }), close())}>
            <Stroke width={w} dash="solid" />
            <span>{String(w).replace('.', ',')} px</span>
          </button>
        ))}
      </MenuButton>
      <MenuButton title="Trait" caret={false} label={<Stroke width={1.5} dash={style.dash} />}>
        {(close) => DRAW_DASHES.map((d) => (
          <button key={d} type="button" className={`pop-item${d === style.dash ? ' on' : ''}`} onClick={() => (set({ dash: d }), close())}>
            <Stroke width={1.5} dash={d} />
            <span>{DASH_LABELS[d]}</span>
          </button>
        ))}
      </MenuButton>
      <span className="ds-sep" />
      <button type="button" className="tb-btn icon" title="Supprimer (Suppr)" onClick={() => engine.chart?.drawings.removeSelected()}>
        <Icon icon={Delete02Icon} size={16} />
      </button>
    </div>
  );
}
