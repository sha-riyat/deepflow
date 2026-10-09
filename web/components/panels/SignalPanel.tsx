'use client';
// Panneau Signal : signal actif ou récent (WHY / ENTRY / EXIT / POS SIZE) et surveillance du flux.
import { fmt, sgn, qty, time } from '@/lib/fmt.js';
import { useLive } from '@/lib/store';
import type { EngineState, Signal } from '@/lib/types';

const OUTCOMES: Record<string, string> = { stop: 'stop', breakeven: 'point d’entrée', target: 'cibles', time: 'durée max' };
const RECENT_MS = 120_000;
const cls = (v?: number | null) => (v === undefined || v === null ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const dur = (ms: number) => (ms >= 60_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 1000)} s`);

function Row({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="row">
      <span>{label}</span>
      <b className={tone}>{value}</b>
    </div>
  );
}

function SignalCard({ s }: { s: Signal }) {
  const side = s.dir > 0 ? 'long' : 'short';
  const stop = s.stopCurrent ?? s.stop;
  const stopR = (s.dir * (stop - s.entry)) / s.dist;
  const pct = (p: number) => fmt((Math.abs(p - s.entry) / s.entry) * 100, 2);
  return (
    <>
      <div className="sig-head">
        <span className={`badge ${side}`}>{s.side}</span>
        <span className="setup">{s.label}</span>
        <time>{time(s.t)}</time>
      </div>
      <div className="hero">{fmt(s.entry)}</div>
      <div className="hero-sub">
        {s.status === 'open' ? (
          <>Entrée au {s.entryType} · R latent <b className={cls(s.unrealizedR)}>{sgn(s.unrealizedR ?? 0)}R</b></>
        ) : (
          <>Clôturé ({OUTCOMES[s.outcome ?? 'stop']}) · <b className={cls(s.resultR)}>{sgn(s.resultR ?? 0)}R</b> · {fmt(s.pnlUsd)} {s.quote}</>
        )}
      </div>
      <div className="label">WHY</div>
      <ul className="why">
        {s.why.map((w) => <li key={w}>{w}</li>)}
        {s.notes.map((n) => <li key={n} className="warn">{n}</li>)}
      </ul>
      <div className="label">EXIT</div>
      <table className="levels">
        <tbody>
          <tr className="stop">
            <td>Stop{stop !== s.stop ? ' (déplacé)' : ''}</td><td>{fmt(stop)}</td><td className={cls(stopR)}>{sgn(stopR, 1)}R</td><td>{pct(stop)} %</td><td>{s.remainingPct ?? 100} %</td>
          </tr>
          {s.targets.map((t, i) => (
            <tr key={i} className={`target${t.hit ? ' hit' : ''}`}>
              <td>Cible {i + 1}{t.hit ? ' ✓' : ''}</td><td>{fmt(t.price)}</td><td>+{fmt(t.R)}R</td><td>{pct(t.price)} %</td><td>{t.pct} %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Après la cible 1, stop au point d’entrée. Sortie forcée après {dur(s.maxHoldMs)}.</p>
      <div className="label">POS SIZE</div>
      <div className="size">{fmt(s.qty, 6)} <small>{s.base}</small></div>
      <Row label="Notionnel" value={`${fmt(s.notional)} ${s.quote}`} />
      <Row label="Levier" value={`${fmt(s.leverage, 2)}×`} />
      <Row label="Risque" value={`${fmt(s.riskUsd)} ${s.quote} · ${fmt(s.riskPctEff, 2)} %`} />
      <Row label="Frais estimés" value={`${fmt(s.feesUsd)} ${s.quote} · ${fmt(s.feeR, 2)}R`} />
      <details>
        <summary>Journal</summary>
        <ul>{s.events.map((e, i) => <li key={i}>{time(e.t)} · {e.text}</li>)}</ul>
      </details>
    </>
  );
}

export function SignalPanel({ st }: { st: EngineState | null }) {
  const history = useLive((s) => s.history);
  if (!st) return <div className="block note">Connexion au moteur…</div>;
  const recent = st.recent[st.recent.length - 1];
  const shown = st.active ?? (recent && st.t && st.t - (recent.closedAt ?? 0) < RECENT_MS ? recent : null);
  const f = st.flow;
  const parts: string[] = [];
  if (history?.backfill?.total && history.backfill.done < history.backfill.total) parts.push(`Rattrapage du jour : ${history.backfill.done}/${history.backfill.total} h`);
  if (history?.loading?.length) parts.push(`Téléchargement de ${history.loading.length} jour(s) d’archives Binance`);
  return (
    <>
      <section className="block">
        {shown ? <SignalCard s={shown} /> : (
          <>
            <div className="empty-title">Aucun signal actif</div>
            <p className="note">Les conditions sont surveillées en continu.</p>
          </>
        )}
      </section>
      <section className="block">
        <h3>Surveillance</h3>
        {st.warmup && (
          <>
            <div className="warmup"><div style={{ width: `${st.warmupPct}%` }} /></div>
            <p className="note">Échauffement {st.warmupPct} % : le moteur observe le marché avant d’émettre des signaux.</p>
          </>
        )}
        {f && (
          <>
            <Row label="Déséquilibre carnet" value={sgn(f.imbalance)} tone={cls(f.imbalance)} />
            <Row label="Z-score delta 10 s" value={sgn(f.deltaZ, 1)} tone={cls(f.deltaZ)} />
            <Row label="VWAP du jour" value={fmt(f.vwap)} />
            <Row label="Seuil gros print" value={f.bigPrintThreshold === null ? '—' : qty(f.bigPrintThreshold)} />
            <Row label="ATR bougies" value={fmt(st.atr)} />
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
          </>
        )}
        {st.lastRejection && (
          <>
            <div className="label">Dernier setup refusé · {time(st.lastRejection.t)}</div>
            <p className="note">{st.lastRejection.label} {st.lastRejection.dir > 0 ? 'LONG' : 'SHORT'} : {st.lastRejection.reason}</p>
          </>
        )}
        {parts.length > 0 && <p className="note">{parts.join(' · ')}</p>}
      </section>
    </>
  );
}
