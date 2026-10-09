'use client';
// Panneau Alertes : création (prix, gros print, mur, delta, déséquilibre, signal), liste des
// alertes actives, historique des déclenchements, notifications système.
import { useEffect, useState } from 'react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui';
import { fmt, time } from '@/lib/fmt.js';
import { useLive } from '@/lib/store';
import type { AlertItem } from '@/lib/types';

export const ALERT_FIELDS: Record<string, { label: string; fields: [string, string][] }> = {
  price: { label: 'Prix franchi', fields: [['price', 'Prix']] },
  bigprint: { label: 'Gros print', fields: [['qty', 'Taille min.']] },
  wall: { label: 'Mur proche', fields: [['qty', 'Taille min.'], ['distPct', 'Distance max. (%)']] },
  deltaz: { label: 'Delta anormal', fields: [['z', 'Z-score min.']] },
  imbalance: { label: 'Déséquilibre carnet', fields: [['value', 'Seuil (0 à 1)']] },
  signal: { label: 'Nouveau signal', fields: [] },
};

function describe(a: AlertItem): string {
  const p = a.params;
  if (a.type === 'price') return `Prix ${fmt(p.price)}`;
  if (a.type === 'bigprint') return `Print ≥ ${fmt(p.qty, 3)}`;
  if (a.type === 'wall') return `Mur ≥ ${fmt(p.qty, 3)} à ${fmt(p.distPct)} %`;
  if (a.type === 'deltaz') return `|z| ≥ ${fmt(p.z, 1)}`;
  if (a.type === 'imbalance') return `|déséquilibre| ≥ ${fmt(p.value)}`;
  return 'Nouveau signal';
}

export function AlertsPanel({ preset }: { preset: { price: number; n: number } | null }) {
  const symbol = useLive((s) => s.meta?.symbol ?? '');
  const { items, fired } = useLive((s) => s.alerts);
  const [type, setType] = useState('price');
  const [values, setValues] = useState<Record<string, string>>({});
  const [once, setOnce] = useState(true);
  const [msg, setMsg] = useState('');

  // « Alerte » dans la barre du haut : prix courant prérempli.
  useEffect(() => {
    if (!preset) return;
    setType('price');
    setValues({ price: String(preset.price) });
  }, [preset]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = Object.fromEntries(ALERT_FIELDS[type].fields.map(([k]) => [k, Number(values[k])]));
    const res = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol, type, params, once }) });
    setMsg(res.ok ? 'Alerte créée.' : (await res.json()).error);
  };

  return (
    <>
      <section className="block">
        <h3>Nouvelle alerte <span className="muted">{symbol}</span></h3>
        <form className="form" onSubmit={create}>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(ALERT_FIELDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          {ALERT_FIELDS[type].fields.map(([k, label]) => (
            <label key={k}>
              {label}
              <input type="number" step="any" required value={values[k] ?? ''} onChange={(e) => setValues({ ...values, [k]: e.target.value })} />
            </label>
          ))}
          <label className="check"><input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} /> Une seule fois</label>
          <button type="submit" className="btn primary">Créer l’alerte</button>
          {msg && <span className="note">{msg}</span>}
        </form>
        <div className="al-actions">
          <button type="button" className="btn small" onClick={() => Notification.requestPermission?.()}>Autoriser les notifications système</button>
        </div>
      </section>
      <section className="block">
        <h3>Actives</h3>
        {items.filter((a) => a.enabled).map((a) => (
          <div key={a.id} className="al-item">
            <span><b>{a.symbol}</b> · {describe(a)}{a.once ? '' : ' · répétée'}</span>
            <button type="button" title="Supprimer" onClick={() => fetch(`/api/alerts?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' })}>
              <Icon icon={Delete02Icon} size={16} />
            </button>
          </div>
        ))}
        {!items.some((a) => a.enabled) && <p className="note">Aucune alerte active.</p>}
      </section>
      <section className="block">
        <h3>Déclenchées</h3>
        {fired.slice(0, 20).map((f) => (
          <div key={`${f.id}${f.t}`} className="al-item"><span>{time(f.t)} · <b>{f.symbol}</b> · {f.text}</span></div>
        ))}
        {fired.length === 0 && <p className="note">Rien pour le moment.</p>}
      </section>
    </>
  );
}
