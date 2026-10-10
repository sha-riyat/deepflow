'use client';
// Panneau Flux : lecture en direct du flux d'ordres (déséquilibre du carnet, z-score du delta,
// VWAP du jour, seuil des gros prints, murs de liquidité) et état du chargement de l'historique.
import { fmt, sgn, qty } from '@/lib/fmt.js';
import { useLive } from '@/lib/store';
import type { FlowState } from '@/lib/types';

const cls = (v?: number | null) => (v === undefined || v === null ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : '');

function Row({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="row">
      <span>{label}</span>
      <b className={tone}>{value}</b>
    </div>
  );
}

export function FlowPanel({ st }: { st: FlowState | null }) {
  const history = useLive((s) => s.history);
  if (!st) return <div className="block note">Connexion au collecteur…</div>;
  const f = st.flow;
  const parts: string[] = [];
  if (history?.backfill?.total && history.backfill.done < history.backfill.total) parts.push(`Rattrapage du jour : ${history.backfill.done}/${history.backfill.total} h`);
  if (history?.loading?.length) parts.push(`Téléchargement de ${history.loading.length} jour(s) d’archives Binance`);
  return (
    <section className="block">
      <h3>Flux en direct</h3>
      {st.warmup && (
        <>
          <div className="warmup"><div style={{ width: `${st.warmupPct}%` }} /></div>
          <p className="note">Mesures en cours de calibrage ({st.warmupPct} %) : z-score et seuil des gros prints demandent 5 min d’observation.</p>
        </>
      )}
      <Row label="Déséquilibre carnet" value={sgn(f.imbalance)} tone={cls(f.imbalance)} />
      <Row label="Z-score delta 10 s" value={f.deltaZ === null ? '—' : sgn(f.deltaZ, 1)} tone={cls(f.deltaZ)} />
      <Row label="VWAP du jour" value={f.vwap === null ? '—' : fmt(f.vwap)} />
      <Row label="Seuil gros print" value={f.bigPrintThreshold === null ? '—' : qty(f.bigPrintThreshold)} />
      {f.walls.length > 0 && (
        <>
          <div className="label">Murs actifs</div>
          <ul className="walls">
            {f.walls.slice(0, 5).map((w) => (
              <li key={`${w.side}${w.price}`}>
                <span className={w.side === 'bid' ? 'pos' : 'neg'}>{w.side === 'bid' ? 'Achat' : 'Vente'}</span>
                <span>{qty(w.qty)} à {fmt(w.price)}</span>
                <span>{w.ageS} s</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {parts.length > 0 && <p className="note">{parts.join(' · ')}</p>}
    </section>
  );
}
