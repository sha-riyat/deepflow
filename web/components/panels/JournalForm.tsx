'use client';
// Formulaire d'un trade du journal : symbole, sens, entrée, stop, cible, sortie, setup, notes et
// capture du graphique actif. « Depuis la position » reprend l'outil position sélectionné.
import { useState } from 'react';
import { ERRORS, SETUPS, cleanEntry, entrySnapshot, excursions, plannedRR, tradeR } from '@shared/journal.js';
import { GRADES } from '@shared/position.js';
import { fmt } from '@/lib/fmt.js';
import { engine } from '@/lib/engine';
import { clockNow } from '@/lib/clock.js';
import { getLive } from '@/lib/store';
import type { JournalEntry } from '@/lib/journal';

const FIELDS: [keyof JournalEntry, string][] = [['entry', 'Entrée'], ['stop', 'Stop'], ['target', 'Cible'], ['exit', 'Sortie']];

type Draft = Record<string, string>;
type Drawing = { id: string; type: string; pts: { t: number; p: number }[] };
type ChartExtra = { drawings: { list: Drawing[]; sel: string | null }; data: { bars: { t0: number; t1: number; h: number; l: number }[] }; snapshot(): string | null };

// Heure locale du champ « datetime-local » (aaaa-mm-jjThh:mm) et son horodatage.
const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (t: number | null) => {
  if (t === null) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromInput = (s: string) => (s ? new Date(s).getTime() : null);

const toDraft = (e: JournalEntry | null): Draft => {
  const meta = getLive().meta;
  if (!e) return { symbol: meta?.symbol ?? '', market: meta?.market ?? 'futures', side: 'long', entry: '', stop: '', target: '', exit: '', setup: '', grade: '', tIn: '', tOut: '', notes: '' };
  const s = (v: number | null) => (v === null ? '' : String(v));
  return { symbol: e.symbol, market: e.market, side: e.side, entry: s(e.entry), stop: s(e.stop), target: s(e.target), exit: s(e.exit), setup: e.setup, grade: e.grade ?? '', tIn: toInput(e.tIn), tOut: toInput(e.tOut), notes: e.notes };
};

export function JournalForm({ entry, onSave, onCancel }: { entry: JournalEntry | null; onSave: (e: JournalEntry) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(entry));
  const [shot, setShot] = useState(!entry?.shot);
  const [errors, setErrors] = useState<string[]>(entry?.errors ?? []);
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setD((x) => ({ ...x, [k]: v }));
  const chart = engine.chart as unknown as ChartExtra | null;

  // Outil position sélectionné : sens, entrée, stop et cible repris (points : entrée, stop, cible).
  const fromPosition = () => {
    const sel = chart?.drawings.list.find((x) => x.id === chart.drawings.sel);
    if (!sel || (sel.type !== 'long' && sel.type !== 'short')) return setMsg('Sélectionnez d’abord un outil position sur le graphique.');
    const digits = (p: number) => String(Number(p.toPrecision(8)));
    setD((x) => ({ ...x, side: sel.type, entry: digits(sel.pts[0].p), stop: digits(sel.pts[1].p), target: digits(sel.pts[2].p), tIn: toInput(sel.pts[0].t), tOut: toInput(Math.min(sel.pts[1].t, clockNow())) }));
    setMsg('');
  };

  const draft = cleanEntry({ ...d, id: entry?.id ?? 'x' });
  const rr = draft ? plannedRR(draft) : null;
  const r = draft ? tradeR(draft) : null;

  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    // Contexte de la bougie au moment de la saisie (à la première sauvegarde seulement, replay : heure rejouée).
    const replay = entry ? entry.replay : Boolean(getLive().meta?.archive); // pris sur un replay des archives ?
    const snap = entry?.snap ?? (chart ? entrySnapshot(chart.data.bars, clockNow()) : null);
    const e = cleanEntry({ ...entry, ...d, errors, snap, replay, tIn: fromInput(d.tIn), tOut: fromInput(d.tOut), id: entry?.id ?? Math.random().toString(36).slice(2, 10), t: entry?.t ?? Date.now(), shot: shot ? chart?.snapshot() ?? entry?.shot : entry?.shot });
    if (!e) return setMsg('Symbole requis.');
    if (e.entry === null || e.stop === null) return setMsg('Entrée et stop requis : le résultat se mesure en multiples du risque (R).');
    // MAE / MFE : seulement si les bougies chargées couvrent le trade (sinon on garde l'ancienne valeur).
    const ex = chart ? excursions(e, chart.data.bars) : null;
    onSave(ex ? { ...e, mae: ex.mae, mfe: ex.mfe } : e);
  };

  return (
    <form className="journal-form" onSubmit={save}>
      <div className="jf-row">
        <input value={d.symbol} onChange={(e) => set('symbol', e.target.value.toUpperCase())} placeholder="Symbole" aria-label="Symbole" />
        <div className="seg">
          {['long', 'short'].map((s) => (
            <button key={s} type="button" className={d.side === s ? 'on' : ''} onClick={() => set('side', s)}>{s === 'long' ? 'Long' : 'Short'}</button>
          ))}
        </div>
      </div>
      <button type="button" className="tb-btn" onClick={fromPosition}>Reprendre l’outil position sélectionné</button>
      <div className="jf-grid">
        {FIELDS.map(([k, label]) => (
          <label key={k}>
            <span>{label}{k === 'exit' ? ' (à la clôture)' : ''}</span>
            <input type="number" step="any" value={d[k]} onChange={(e) => set(k, e.target.value)} />
          </label>
        ))}
      </div>
      <p className="muted jf-calc">
        {rr !== null ? `R:R prévu ${fmt(rr, 2)}` : 'R:R prévu —'}{r !== null ? ` · résultat ${r >= 0 ? '+' : ''}${fmt(r, 2)} R` : ''}
      </p>
      <div className="jf-grid">
        <label><span>Heure d’entrée</span><input type="datetime-local" value={d.tIn} onChange={(e) => set('tIn', e.target.value)} /></label>
        <label><span>Heure de sortie</span><input type="datetime-local" value={d.tOut} onChange={(e) => set('tOut', e.target.value)} /></label>
      </div>
      <input list="journal-setups" value={d.setup} onChange={(e) => set('setup', e.target.value)} placeholder="Setup (ex. Rejet de la VAH)" aria-label="Setup" />
      <div className="jf-row" title="A : setup de grande qualité (risque plein), B : correct, C : douteux (risque réduit)">
        <span className="muted">Note du setup</span>
        <div className="seg">
          {['', ...GRADES].map((g) => (
            <button key={g || 'none'} type="button" className={d.grade === g ? 'on' : ''} onClick={() => set('grade', g)}>{g || '—'}</button>
          ))}
        </div>
      </div>
      <datalist id="journal-setups">{SETUPS.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="jf-errors" title="Étiquetez après coup ce qui a mal tourné : le coût cumulé de chaque erreur apparaît dans les statistiques">
        <span className="muted">Erreurs (après coup)</span>
        {Object.entries(ERRORS).map(([k, label]) => (
          <label key={k} className="jf-check">
            <input type="checkbox" checked={errors.includes(k)} onChange={(ev) => setErrors((x) => (ev.target.checked ? [...x, k] : x.filter((y) => y !== k)))} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} rows={4} placeholder="Contexte, ce que vous avez vu, émotions, erreurs…" aria-label="Notes" />
      <label className="jf-check">
        <input type="checkbox" checked={shot} onChange={(e) => setShot(e.target.checked)} />
        <span>{entry?.shot ? 'Remplacer la capture par le graphique actuel' : 'Joindre une capture du graphique actif'}</span>
      </label>
      {msg && <p className="neg jf-msg">{msg}</p>}
      <div className="jf-row">
        <button type="submit" className="btn small">Enregistrer</button>
        <button type="button" className="tb-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}
