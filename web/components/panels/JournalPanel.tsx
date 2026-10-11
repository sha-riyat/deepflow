'use client';
// Panneau Journal : trades notés (symbole, sens, niveaux, setup, notes, capture), résultat en R
// et statistiques (taux de réussite, R moyen par trade, total, facteur de profit), export CSV.
// Relire son journal chaque semaine est la meilleure école : quels setups marchent vraiment ?
import { useCallback, useEffect, useState } from 'react';
import { Delete02Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui';
import { JournalCharts } from './JournalCharts';
import { JournalForm } from './JournalForm';
import { ERRORS, journalStats, plannedRR, toCsv, tradeR } from '@shared/journal.js';
import { errorCosts } from '@shared/journalstats.js';
import { fmt } from '@/lib/fmt.js';
import { deleteEntry, download, listEntries, putEntry, type JournalEntry } from '@/lib/journal';

const SESSION_NAMES: Record<string, string> = { asia: 'Asie', london: 'Londres', ny: 'New York' };
const date = (t: number) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const signed = (v: number) => `${v >= 0 ? '+' : ''}${fmt(v, 2)}`;

function Stats({ list }: { list: JournalEntry[] }) {
  const s = journalStats(list);
  if (!s.trades) return <p className="muted pop-note">{list.length ? `${list.length} trade(s) en cours, aucun clôturé.` : 'Aucun trade noté. Notez chaque trade, même en replay : c’est votre meilleure source de progrès.'}</p>;
  return (
    <div className="journal-stats">
      <span><b>{s.trades}</b> clôturés{s.open ? ` · ${s.open} en cours` : ''}</span>
      <span><b>{fmt((s.winRate ?? 0) * 100, 0)} %</b> gagnants</span>
      <span><b className={(s.avgR ?? 0) >= 0 ? 'pos' : 'neg'}>{signed(s.avgR ?? 0)} R</b> par trade</span>
      <span>total <b className={s.totalR >= 0 ? 'pos' : 'neg'}>{signed(s.totalR)} R</b></span>
      {s.profitFactor !== null && <span>facteur de profit <b>{fmt(s.profitFactor, 2)}</b></span>}
    </div>
  );
}

// Coût de chaque erreur étiquetée (total en R des trades concernés), comparé aux trades sans erreur.
function Errors({ list }: { list: JournalEntry[] }) {
  const { rows, clean } = errorCosts(list);
  if (!rows.length) return null;
  return (
    <div className="journal-stats journal-errors">
      <b>Coût des erreurs</b>
      {rows.map((r) => (
        <span key={r.key}>{ERRORS[r.key as keyof typeof ERRORS]} : <b className={r.totalR >= 0 ? 'pos' : 'neg'}>{signed(r.totalR)} R</b> ({r.count} trade{r.count > 1 ? 's' : ''})</span>
      ))}
      {clean.count > 0 && <span>Sans erreur : <b className={clean.totalR >= 0 ? 'pos' : 'neg'}>{signed(clean.totalR)} R</b> ({clean.count} trade{clean.count > 1 ? 's' : ''}, {signed(clean.avgR ?? 0)} R par trade)</span>}
    </div>
  );
}

function Entry({ e, open, onToggle, onEdit, onDelete }: { e: JournalEntry; open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const r = tradeR(e);
  const rr = plannedRR(e);
  return (
    <div className={`journal-entry${open ? ' open' : ''}`}>
      <button type="button" className="journal-row" onClick={onToggle}>
        <span className="muted">{date(e.t)}</span>
        <b>{e.symbol}</b>
        <span className={`tag ${e.side === 'long' ? 'pos' : 'neg'}`}>{e.side === 'long' ? 'Long' : 'Short'}</span>
        <span className="journal-setup">{e.grade && <b className="tag">{e.grade}</b>} {e.setup}</span>
        <b className={r === null ? 'muted' : r >= 0 ? 'pos' : 'neg'}>{r === null ? 'en cours' : `${signed(r)} R`}</b>
      </button>
      {open && (
        <div className="journal-detail">
          <p>
            Entrée {e.entry ?? '—'} · stop {e.stop ?? '—'} · cible {e.target ?? '—'} · sortie {e.exit ?? '—'}
            {rr !== null && ` · R:R prévu ${fmt(rr, 2)}`}
          </p>
          {e.snap && (
            <p className="muted">
              À la saisie : volume {fmt(e.snap.volume ?? 0, 0)} · delta {signed(e.snap.deltaPct ?? 0)} %
              {e.snap.relVolume !== null && ` · volume ×${fmt(e.snap.relVolume, 1)}`} · {e.snap.utc} UTC ({e.snap.ny} à New York{e.snap.session && e.snap.session !== 'off' ? `, séance ${SESSION_NAMES[e.snap.session]}` : ''})
            </p>
          )}
          {e.mae !== null && e.mfe !== null && (
            <p className="muted" title="MAE : jusqu'où le prix est allé contre vous ; MFE : jusqu'où il est allé pour vous (en R, entre l'entrée et la sortie)">
              Excursions : MAE −{fmt(e.mae, 2)} R · MFE +{fmt(e.mfe, 2)} R
            </p>
          )}
          {e.errors.length > 0 && <p className="neg">Erreurs : {e.errors.map((k) => ERRORS[k as keyof typeof ERRORS]).join(', ')}</p>}
          {e.notes && <p className="journal-notes">{e.notes}</p>}
          {e.shot && <img src={e.shot} alt={`Graphique ${e.symbol} au moment du trade`} />}
          <div className="jf-row">
            <button type="button" className="tb-btn" onClick={onEdit}><Icon icon={PencilEdit02Icon} size={14} /><span>Modifier / clôturer</span></button>
            <button type="button" className="tb-btn" onClick={onDelete}><Icon icon={Delete02Icon} size={14} /><span>Supprimer</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function JournalPanel() {
  const [list, setList] = useState<JournalEntry[]>([]);
  const [edit, setEdit] = useState<JournalEntry | 'new' | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => listEntries().then(setList, () => setError('Journal indisponible : stockage du navigateur bloqué.')), []);
  useEffect(() => {
    reload();
  }, [reload]);

  if (edit) {
    return (
      <JournalForm entry={edit === 'new' ? null : edit} onCancel={() => setEdit(null)}
        onSave={(e) => putEntry(e).then(() => (setEdit(null), setOpen(e.id), reload()), () => setError('Enregistrement impossible (stockage plein ?).'))} />
    );
  }
  return (
    <div className="journal">
      <div className="jf-row">
        <button type="button" className="btn small" onClick={() => setEdit('new')}>Noter un trade</button>
        <button type="button" className="tb-btn" disabled={!list.length} onClick={() => download(`journal-deepflow-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(list), 'text/csv')}>
          Exporter (CSV)
        </button>
      </div>
      {error && <p className="neg pop-note">{error}</p>}
      <Stats list={list} />
      <JournalCharts list={list} />
      <Errors list={list} />
      {list.map((e) => (
        <Entry key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} onEdit={() => setEdit(e)}
          onDelete={() => window.confirm(`Supprimer le trade ${e.symbol} du ${date(e.t)} ?`) && deleteEntry(e.id).then(reload)} />
      ))}
      <p className="muted pop-note">Gardé dans ce navigateur. Ce n’est pas un conseil financier.</p>
    </div>
  );
}
