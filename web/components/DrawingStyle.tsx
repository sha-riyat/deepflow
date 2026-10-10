'use client';
// Barre flottante du dessin sélectionné (en haut du graphique) : couleur, épaisseur (taille du
// texte pour une note), trait, suppression. La règle n'a pas de style : sa couleur suit le sens ;
// la position propose son capital et son risque.
import { useEffect, useRef, useState } from 'react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon, MenuButton } from './ui';
import { engine } from '@/lib/engine';
import { useLive, type DrawStyle as Style, type PositionCalc } from '@/lib/store';
import { DRAW_COLORS, DRAW_DASHES, DRAW_WIDTHS, POSITIONS, PROFILE_KINDS, textSize } from '@shared/drawings.js';

const KIND_LABELS: Record<string, string> = { volume: 'Volume', bidask: 'Achats / ventes', delta: 'Delta' };
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

function StyleMenus({ style, note, profile, set }: { style: Style; note: boolean; profile: boolean; set: (patch: Partial<Style>) => void }) {
  return (
    <>
      {profile && (
        <MenuButton title="Prolonger le POC, le VAH et le VAL vers la droite, avec l’état d’acceptation ou de rejet" caret label={<span className="ds-size">{style.extend ? 'Prolongé' : 'Non prolongé'}</span>}>
          {(close) => [[false, 'Non prolongé'], [true, 'Prolongé vers la droite']].map(([v, text]) => (
            <button key={String(v)} type="button" className={`pop-item${Boolean(style.extend) === v ? ' on' : ''}`} onClick={() => (set({ extend: v as boolean }), close())}>
              <span>{text as string}</span>
            </button>
          ))}
        </MenuButton>
      )}
      {profile && (
        <MenuButton title="Type de profil" caret label={<span className="ds-size">{KIND_LABELS[style.kind ?? 'volume']}</span>}>
          {(close) => PROFILE_KINDS.map((k) => (
            <button key={k} type="button" className={`pop-item${k === (style.kind ?? 'volume') ? ' on' : ''}`} onClick={() => (set({ kind: k }), close())}>
              <span>{KIND_LABELS[k]}</span>
            </button>
          ))}
        </MenuButton>
      )}
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
      <MenuButton title={note ? 'Taille du texte' : 'Épaisseur'} caret={false}
        label={note ? <span className="ds-size">{textSize(style.width)}</span> : <Stroke width={style.width} dash="solid" />}>
        {(close) => DRAW_WIDTHS.map((w) => (
          <button key={w} type="button" className={`pop-item${w === style.width ? ' on' : ''}`} onClick={() => (set({ width: w }), close())}>
            {!note && <Stroke width={w} dash="solid" />}
            <span>{note ? `Texte ${textSize(w)} px` : `${String(w).replace('.', ',')} px`}</span>
          </button>
        ))}
      </MenuButton>
      {!note && (
        <MenuButton title="Trait" caret={false} label={<Stroke width={1.5} dash={style.dash} />}>
          {(close) => DRAW_DASHES.map((d) => (
            <button key={d} type="button" className={`pop-item${d === style.dash ? ' on' : ''}`} onClick={() => (set({ dash: d }), close())}>
              <Stroke width={1.5} dash={d} />
              <span>{DASH_LABELS[d]}</span>
            </button>
          ))}
        </MenuButton>
      )}
      <span className="ds-sep" />
    </>
  );
}

const parse = (text: string, zero = false) => {
  const v = Number(text.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(v) && (v > 0 || (zero && v === 0)) ? v : null;
};

// Champ numérique validé à la sortie, par Entrée, ou quand la barre disparaît (un clic sur le
// graphique désélectionne la position avant que le champ ne perde le focus). Une saisie invalide
// reprend la valeur courante. `zero` : zéro accepté (frais).
function NumField({ label, value, unit, zero = false, onChange }: { label: string; value: number; unit: string; zero?: boolean; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  const latest = useRef({ text, value, onChange });
  latest.current = { text, value, onChange };
  useEffect(() => () => {
    const { text: t, value: old, onChange: done } = latest.current;
    const v = parse(t, zero);
    if (v !== null && v !== old) done(v);
  }, [zero]);
  const commit = () => {
    const v = parse(text, zero);
    if (v !== null) onChange(v);
    else setText(String(value));
  };
  return (
    <label className="ds-field" title={label}>
      <span>{label}</span>
      <input value={text} inputMode="decimal" onChange={(e) => setText(e.target.value)} onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
      <i>{unit}</i>
    </label>
  );
}

function PositionFields({ id, calc }: { id: string; calc: PositionCalc }) {
  const set = (patch: Partial<PositionCalc>) => engine.chart?.drawings.setCalc(patch, id);
  return (
    <>
      <NumField label="Capital" value={calc.capital} unit="$" onChange={(capital) => set({ capital })} />
      <NumField label="Risque" value={calc.risk} unit="%" onChange={(risk) => set({ risk })} />
      <NumField label="Frais" value={calc.fees} unit="% / ordre" zero onChange={(fees) => set({ fees })} />
      <span className="ds-sep" />
    </>
  );
}

export function DrawingStyle() {
  const draw = useLive((s) => s.draw);
  if (!draw.sel || !draw.style) return null;
  const set = (patch: Partial<Style>) => engine.chart?.drawings.setStyle(patch);
  return (
    <div id="drawstyle" onMouseDown={(e) => e.stopPropagation()}>
      {draw.id && draw.calc && POSITIONS.includes(draw.type ?? '') && <PositionFields key={`${draw.id}${JSON.stringify(draw.calc)}`} id={draw.id} calc={draw.calc} />}
      {draw.type !== 'ruler' && !POSITIONS.includes(draw.type ?? '') && <StyleMenus style={draw.style} note={draw.type === 'text'} profile={draw.type === 'vp'} set={set} />}
      <button type="button" className="tb-btn icon" title="Supprimer (Suppr)" onClick={() => engine.chart?.drawings.removeSelected()}>
        <Icon icon={Delete02Icon} size={16} />
      </button>
    </div>
  );
}
