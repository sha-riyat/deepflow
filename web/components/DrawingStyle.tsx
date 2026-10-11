'use client';
// Barre flottante du dessin sélectionné (en haut du graphique) : couleur, épaisseur (taille du
// texte pour une note), trait, suppression. La règle n'a pas de style : sa couleur suit le sens ;
// la position propose son capital et son risque.
import { useEffect, useRef, useState } from 'react';
import { Delete02Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { Icon, MenuButton, OptionRows, type OptDefs } from './ui';
import { engine } from '@/lib/engine';
import { useLive, type DrawStyle as Style, type PositionCalc } from '@/lib/store';
import { DEFAULT_STYLE, DRAW_COLORS, DRAW_DASHES, DRAW_WIDTHS, POSITIONS, PROFILE_KINDS, textSize } from '@shared/drawings.js';

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

// Gestion du stop : point mort (frais compris), gain verrouillé en R, stop suiveur (dernière mèche, dernier
// gros print), retour au stop initial. Le stop ne
// se déplace que vers le gain ; sinon un message le dit.
function StopMenu({ calc }: { calc: PositionCalc }) {
  const [msg, setMsg] = useState('');
  const run = (close: () => void, action: string, arg?: number) => {
    const res = engine.chart?.drawings.manageStop(action, arg);
    if (res === 'ok') setMsg('');
    else if (res === 'nodata') setMsg(action === 'print' ? 'Aucun gros print favorable depuis l’entrée (activez les gros prints)' : 'Aucune bougie fermée depuis l’entrée');
    else setMsg(action === 'reset' ? 'Le stop est déjà le stop initial' : 'Le stop est déjà plus protecteur');
    close();
  };
  const items: [string, string, number?][] = [['be', 'Point mort (frais compris)'], ['lock', 'Verrouiller +0,5 R', 0.5], ['lock', 'Verrouiller +1 R', 1], ['lock', 'Verrouiller +2 R', 2], ['wick', 'Sous la dernière mèche'], ['print', 'Sous le dernier gros print']];
  return (
    <>
      <MenuButton title="Déplacer le stop vers le gain : point mort, gain verrouillé" caret label={<span className="ds-size">Stop</span>}>
        {(close) => (
          <>
            {items.map(([action, text, arg]) => (
              <button key={text} type="button" className="pop-item" onClick={() => run(close, action, arg)}><span>{text}</span></button>
            ))}
            {calc.stop0 != null && <button type="button" className="pop-item" onClick={() => run(close, 'reset')}><span>Revenir au stop initial</span></button>}
          </>
        )}
      </MenuButton>
      {msg && <span className="ds-note">{msg}</span>}
    </>
  );
}

// Plan de la position (fenêtre de réglages) : sortie partielle (part sortie à TP1, en R du risque initial),
// renforts (entrées de même taille, stop et cible communs), taux de financement.
function PositionPlan({ id, calc }: { id: string; calc: PositionCalc }) {
  const set = (patch: Partial<PositionCalc>) => engine.chart?.drawings.setCalc(patch, id);
  return (
    <>
      <NumField label="Part sortie à TP1 (0 : aucune)" value={calc.partial?.pct ?? 0} unit="%" zero
        onChange={(pct) => set({ partial: pct > 0 ? { pct, r: calc.partial?.r ?? 1 } : null })} />
      <NumField label="TP1 : multiple du risque initial" value={calc.partial?.r ?? 1} unit="R"
        onChange={(r) => set({ partial: { pct: calc.partial?.pct ?? 50, r } })} />
      <NumField label="Taux de financement par 8 h (positif : les longs paient)" value={calc.funding ?? 0.01} unit="% / 8 h" zero onChange={(funding) => set({ funding })} />
      <div className="ds-row">
        <button type="button" className="pop-item" onClick={() => engine.chart?.drawings.manageEntry('add')}><span>Renfort au prix actuel{calc.adds?.length ? ` (${calc.adds.length})` : ''}</span></button>
        {Boolean(calc.adds?.length) && <button type="button" className="pop-item" onClick={() => engine.chart?.drawings.manageEntry('remove')}><span>Retirer le dernier renfort</span></button>}
      </div>
    </>
  );
}

function PositionFields({ id, calc }: { id: string; calc: PositionCalc }) {
  const set = (patch: Partial<PositionCalc>) => engine.chart?.drawings.setCalc(patch, id);
  return (
    <>
      <NumField label="Capital" value={calc.capital} unit="$" onChange={(capital) => set({ capital })} />
      <NumField label="Risque" value={calc.risk} unit="%" onChange={(risk) => set({ risk })} />
      <NumField label="Frais" value={calc.fees} unit="% / ordre" zero onChange={(fees) => set({ fees })} />
      <StopMenu calc={calc} />
      <span className="ds-sep" />
    </>
  );
}

const TOOL_NAMES: Record<string, string> = {
  trend: 'Ligne de tendance', hline: 'Ligne horizontale', hray: 'Rayon horizontal', vline: 'Ligne verticale', rect: 'Rectangle',
  fib: 'Retracement de Fibonacci', text: 'Texte / note', ruler: 'Règle de mesure', long: 'Position longue', short: 'Position courte',
  avwap: 'VWAP ancré', vp: 'Volume Profile à plage fixe',
};

// Fenêtre de réglages d'un dessin (roue dentée) : tous ses réglages au même endroit, communs (couleur,
// épaisseur, trait) puis propres à l'outil (profil : type, prolongement, pics et creux, totaux ;
// position : capital, risque, frais).
function SettingsPanel({ id, type, style, calc, set }: { id: string | null; type: string; style: Style; calc: PositionCalc | null; set: (patch: Partial<Style>) => void }) {
  const isNote = type === 'text';
  const styled = type !== 'ruler' && !POSITIONS.includes(type);
  const defs: OptDefs = {};
  if (styled) defs.width = { label: isNote ? 'Taille du texte' : 'Épaisseur', choices: DRAW_WIDTHS.map((v) => [v, isNote ? `${textSize(v)} px` : `${String(v).replace('.', ',')} px`]) };
  if (styled && !isNote) defs.dash = { label: 'Trait', choices: DRAW_DASHES.map((v) => [v, DASH_LABELS[v]]) };
  if (type === 'vp') {
    defs.kind = { label: 'Type de profil', choices: PROFILE_KINDS.map((v) => [v, KIND_LABELS[v]]) };
    defs.extend = { label: 'Niveaux prolongés vers la droite', choices: [['off', 'Non'], ['on', 'Oui']] };
    defs.nodes = { label: 'Pics et creux de volume (HVN / LVN)', choices: [['on', 'Affichés'], ['off', 'Masqués']] };
    defs.totals = { label: 'Étiquette de totaux', choices: [['on', 'Affichée'], ['off', 'Masquée']] };
    defs.deltaMax = { label: 'Niveaux de delta maximal (plus fort achat, plus forte vente)', choices: [['off', 'Masqués'], ['on', 'Affichés']] };
  }
  const values: Record<string, number | string> = {
    width: style.width, dash: style.dash, kind: style.kind ?? 'volume',
    extend: style.extend ? 'on' : 'off', nodes: style.nodes === false ? 'off' : 'on', totals: style.totals === false ? 'off' : 'on',
    deltaMax: style.deltaMax ? 'on' : 'off',
  };
  const change = (key: string, v: number | string) => set({ [key]: ['extend', 'nodes', 'totals', 'deltaMax'].includes(key) ? v === 'on' : v } as Partial<Style>);
  const reset = () => set({ color: DEFAULT_STYLE.color, width: DEFAULT_STYLE.width, dash: DEFAULT_STYLE.dash, kind: undefined, extend: undefined, nodes: undefined, totals: undefined, deltaMax: undefined });
  return (
    <div className="ds-panel">
      <div className="pop-title">Réglages · {TOOL_NAMES[type] ?? type}</div>
      {styled && (
        <div className="lg-opt">
          <span>Couleur</span>
          <div className="swatches">
            {DRAW_COLORS.map((c) => (
              <button key={c} type="button" className={c === style.color ? 'on' : ''} title={c} style={{ background: c }} onClick={() => set({ color: c })} />
            ))}
          </div>
        </div>
      )}
      <OptionRows defs={defs} values={values} onChange={change} />
      {id && calc && POSITIONS.includes(type) && <div className="ds-fields"><PositionFields key={`${id}${JSON.stringify(calc)}`} id={id} calc={calc} /></div>}
      {id && calc && POSITIONS.includes(type) && <div className="ds-fields"><PositionPlan key={`plan${id}${JSON.stringify(calc)}`} id={id} calc={calc} /></div>}
      {type === 'ruler' && <p className="note">La couleur de la règle suit le sens du mouvement : verte si le prix monte, rouge s’il baisse.</p>}
      {POSITIONS.includes(type) && <p className="note">Les zones de stop et de cible gardent leurs couleurs ; le calcul est affiché seulement, aucun ordre n’est passé.</p>}
      {styled && <button type="button" className="pop-item" onClick={reset}><span>Rétablir le style par défaut</span></button>}
    </div>
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
      <MenuButton icon={Settings02Icon} caret={false} align="right" title="Réglages du dessin">
        {() => <SettingsPanel id={draw.id} type={draw.type ?? ''} style={draw.style as Style} calc={draw.calc} set={set} />}
      </MenuButton>
      <button type="button" className="tb-btn icon" title="Supprimer (Suppr)" onClick={() => engine.chart?.drawings.removeSelected()}>
        <Icon icon={Delete02Icon} size={16} />
      </button>
    </div>
  );
}
