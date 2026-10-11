'use client';
// Panneau Journal : trades notés (symbole, sens, niveaux, setup, notes, capture), résultat en R
// et statistiques (taux de réussite, R moyen par trade, total, facteur de profit), export CSV.
// Relire son journal chaque semaine est la meilleure école : quels setups marchent vraiment ?
import { useCallback, useEffect, useState } from 'react';
import { Delete02Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui';
import { JournalForm } from './JournalForm';
import { journalStats, plannedRR, toCsv, tradeR } from '@shared/journal.js';
import { fmt } from '@/lib/fmt.js';
import { deleteEntry, download, listEntries, putEntry, type JournalEntry } from '@/lib/journal';

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
      {list.map((e) => (
        <Entry key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} onEdit={() => setEdit(e)}
          onDelete={() => window.confirm(`Supprimer le trade ${e.symbol} du ${date(e.t)} ?`) && deleteEntry(e.id).then(reload)} />
      ))}
      <p className="muted pop-note">Gardé dans ce navigateur. Ce n’est pas un conseil financier.</p>
    </div>
  );
}
