'use client';
// Budget de risque du jour (jour UTC), affichage seulement : résultat réalisé en R, « argent du jour »
// dont on peut risquer une part sur un setup plus risqué, et marge avant la limite de perte
// quotidienne. Seuls les trades réels comptent (pas le replay). Réglages gardés dans le navigateur.
import { useState } from 'react';
import { DEFAULT_BUDGET, dayBudget } from '@shared/journalstats.js';
import { fmt } from '@/lib/fmt.js';
import type { JournalEntry } from '@/lib/journal';

const KEY = 'deepflow.journal.budget';
const signed = (v: number) => `${v >= 0 ? '+' : ''}${fmt(v, 2)}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    const share = Number(raw?.share);
    const limitR = Number(raw?.limitR);
    return { share: share >= 0 && share <= 1 ? share : DEFAULT_BUDGET.share, limitR: limitR > 0 && limitR <= 100 ? limitR : DEFAULT_BUDGET.limitR };
  } catch {
    return { ...DEFAULT_BUDGET };
  }
}

export function JournalBudget({ list }: { list: JournalEntry[] }) {
  const [cfg, setCfg] = useState(load);
  const save = (next: typeof cfg) => {
    setCfg(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // stockage indisponible : réglage gardé pour la session seulement
    }
  };
  const b = dayBudget(list, Date.now(), cfg);
  return (
    <div className="journal-stats journal-budget" title="Idée des vidéos : ne prendre un setup plus risqué qu'avec l'argent gagné dans la journée, et s'arrêter à la limite de perte">
      <b>Budget du jour</b>
      <span>{b.trades} trade{b.trades > 1 ? 's' : ''} réel{b.trades > 1 ? 's' : ''} · <b className={b.dayR >= 0 ? 'pos' : 'neg'}>{signed(b.dayR)} R</b></span>
      {b.limitReached
        ? <span className="neg">Limite de perte du jour atteinte (−{fmt(cfg.limitR, 1)} R) : fin de séance.</span>
        : <span>Perte encore permise : {fmt(b.remaining, 2)} R · risque autorisé en plus avec les gains : <b>{fmt(b.allowed, 2)} R</b></span>}
      <span className="jf-row">
        <label>Part des gains risquable <input type="number" min={0} max={100} step={10} value={Math.round(cfg.share * 100)} onChange={(e) => save({ ...cfg, share: Math.min(1, Math.max(0, Number(e.target.value) / 100)) })} /> %</label>
        <label>Limite de perte <input type="number" min={1} step={0.5} value={cfg.limitR} onChange={(e) => Number(e.target.value) > 0 && save({ ...cfg, limitR: Number(e.target.value) })} /> R</label>
      </span>
    </div>
  );
}
