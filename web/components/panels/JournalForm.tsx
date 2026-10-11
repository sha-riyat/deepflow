'use client';
// Formulaire d'un trade du journal : symbole, sens, entrée, stop, cible, sortie, setup, notes et
// capture du graphique actif. « Depuis la position » reprend l'outil position sélectionné.
import { useState } from 'react';
import { SETUPS, cleanEntry, plannedRR, tradeR } from '@shared/journal.js';
import { GRADES } from '@shared/position.js';
import { fmt } from '@/lib/fmt.js';
import { engine } from '@/lib/engine';
import { getLive } from '@/lib/store';
import type { JournalEntry } from '@/lib/journal';

const FIELDS: [keyof JournalEntry, string][] = [['entry', 'Entrée'], ['stop', 'Stop'], ['target', 'Cible'], ['exit', 'Sortie']];

type Draft = Record<string, string>;
type Drawing = { id: string; type: string; pts: { p: number }[] };
type ChartExtra = { drawings: { list: Drawing[]; sel: string | null }; snapshot(): string | null };

const toDraft = (e: JournalEntry | null): Draft => {
  const meta = getLive().meta;
  if (!e) return { symbol: meta?.symbol ?? '', market: meta?.market ?? 'futures', side: 'long', entry: '', stop: '', target: '', exit: '', setup: '', grade: '', notes: '' };
  const s = (v: number | null) => (v === null ? '' : String(v));
  return { symbol: e.symbol, market: e.market, side: e.side, entry: s(e.entry), stop: s(e.stop), target: s(e.target), exit: s(e.exit), setup: e.setup, grade: e.grade ?? '', notes: e.notes };
};

export function JournalForm({ entry, onSave, onCancel }: { entry: JournalEntry | null; onSave: (e: JournalEntry) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(entry));
  const [shot, setShot] = useState(!entry?.shot);
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setD((x) => ({ ...x, [k]: v }));
  const chart = engine.chart as unknown as ChartExtra | null;

  // Outil position sélectionné : sens, entrée, stop et cible repris (points : entrée, stop, cible).
  const fromPosition = () => {
    const sel = chart?.drawings.list.find((x) => x.id === chart.drawings.sel);
    if (!sel || (sel.type !== 'long' && sel.type !== 'short')) return setMsg('Sélectionnez d’abord un outil position sur le graphique.');
    const digits = (p: number) => String(Number(p.toPrecision(8)));
    setD((x) => ({ ...x, side: sel.type, entry: digits(sel.pts[0].p), stop: digits(sel.pts[1].p), target: digits(sel.pts[2].p) }));
    setMsg('');
  };

  const draft = cleanEntry({ ...d, id: entry?.id ?? 'x' });
  const rr = draft ? plannedRR(draft) : null;
  const r = draft ? tradeR(draft) : null;

  const save = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = cleanEntry({ ...entry, ...d, id: entry?.id ?? Math.random().toString(36).slice(2, 10), t: entry?.t ?? Date.now(), shot: shot ? chart?.snapshot() ?? entry?.shot : entry?.shot });
    if (!e) return setMsg('Symbole requis.');
    if (e.entry === null || e.stop === null) return setMsg('Entrée et stop requis : le résultat se mesure en multiples du risque (R).');
    onSave(e);
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
