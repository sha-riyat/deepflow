'use client';
// Panneau Compte : résultats du suivi papier, historique des signaux, réglages de risque.
import { useEffect, useState } from 'react';
import { fmt, sgn, time } from '@/lib/fmt.js';
import { useLive } from '@/lib/store';
import type { EngineState } from '@/lib/types';

const OUTCOMES: Record<string, string> = { stop: 'Stop', breakeven: 'Point d’entrée', target: 'Cibles', time: 'Durée max' };
const SETUPS: Record<string, string> = { absorption: 'Absorption', breakout: 'Cassure' };
const cls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const FIELDS = [
  ['equity', 'Capital', 1, undefined, 'any'],
  ['riskPct', 'Risque par trade (%)', 0.01, 5, '0.01'],
  ['maxLeverage', 'Levier max', 1, 125, '1'],
] as const;

export function AccountPanel({ st, sound, setSound }: { st: EngineState | null; sound: boolean; setSound: (v: boolean) => void }) {
  const meta = useLive((s) => s.meta);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (meta) setForm(Object.fromEntries(FIELDS.map(([k]) => [k, String(meta.risk?.[k] ?? '')])));
  }, [meta]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = Object.fromEntries(FIELDS.map(([k]) => [k, Number(form[k])]));
    const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setMsg(res.ok ? 'Enregistré : appliqué aux prochains signaux.' : (await res.json()).error);
  };

  const s = st?.stats;
  return (
    <>
      <section className="block">
        <h3>Résultats <span className="muted">suivi papier</span></h3>
        {!s || !s.n ? (
          <p className="note">Aucun signal clôturé pour le moment.</p>
        ) : (
          <>
            <div className="row"><span>Signaux</span><b>{s.n}</b></div>
            <div className="row"><span>Gagnants</span><b>{s.wins} · {fmt(s.winRate, 1)} %</b></div>
            <div className="row"><span>Moyenne par trade</span><b className={cls(s.avgR)}>{sgn(s.avgR)}R</b></div>
            <div className="row"><span>Total</span><b className={cls(s.totalR)}>{sgn(s.totalR)}R · {fmt(s.pnlUsd)}</b></div>
            <div className="row"><span>Drawdown max</span><b>{fmt(s.maxDDR)}R</b></div>
            <table className="hist">
              <tbody>
                {st!.recent.slice(-10).reverse().map((x) => (
                  <tr key={x.id}>
                    <td className="muted">{time(x.t)}</td>
                    <td className={x.dir > 0 ? 'pos' : 'neg'}>{x.side}</td>
                    <td>{SETUPS[x.setup] ?? x.setup}</td>
                    <td className="muted">{OUTCOMES[x.outcome ?? 'stop']}</td>
                    <td className={cls(x.resultR ?? 0)}>{sgn(x.resultR ?? 0)}R</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
      <section className="block">
        <h3>Risque</h3>
        <form className="form" onSubmit={save}>
          {FIELDS.map(([k, label, min, max, step]) => (
            <label key={k}>
              {label}
              <input type="number" min={min} max={max} step={step} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <button type="submit" className="btn primary">Enregistrer</button>
          {msg && <span className="note">{msg}</span>}
        </form>
      </section>
      <section className="block">
        <label className="check">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Alerte sonore à chaque nouveau signal
        </label>
        <p className="disclaimer">
          Signaux produits par des règles mécaniques, sans garantie de résultat. Ce n’est pas un conseil financier : validez-les en
          suivi papier et en backtest avant d’engager de l’argent réel.
        </p>
      </section>
    </>
  );
}
