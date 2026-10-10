'use client';
// Menu « Mises en page » de la barre du haut : mises en page nommées (grille, graphiques, liens,
// panneaux), modèles d'indicateurs appliqués au graphique actif, export et import d'un fichier
// (sauvegarde, passage à un autre ordinateur ou à un ami).
import { useRef, useState } from 'react';
import { Bookmark01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Icon, MenuButton } from './ui';
import { downloadExport, importFile, loadPresets, savePresets, type Named, type Presets } from '@/lib/presets';
import { removeNamed, upsert } from '@shared/presets.js';

type Item = Named<Record<string, unknown>>;
type ListKey = 'layouts' | 'templates';

interface Props {
  current: (what: ListKey) => Record<string, unknown>; // mise en page, ou modèle du graphique actif
  onApply: (what: ListKey, value: Record<string, unknown>) => void;
}

// Une liste nommée : un clic applique, la croix supprime ; champ pour enregistrer l'état actuel.
function Section({ title, hint, items, placeholder, onApply, onSave, onRemove }: {
  title: string;
  hint: string;
  items: Item[];
  placeholder: string;
  onApply: (it: Item) => void;
  onSave: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [name, setName] = useState('');
  return (
    <>
      <div className="pop-title">{title}</div>
      {items.length === 0 && <p className="muted pop-note">{hint}</p>}
      {items.map((it) => (
        <div key={it.name} className="preset-row">
          <button type="button" className="pop-item" onClick={() => onApply(it)}>{it.name}</button>
          <button type="button" className="preset-del" title={`Supprimer « ${it.name} »`} onClick={() => onRemove(it.name)}>
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      ))}
      <form className="pop-param" onSubmit={(e) => (e.preventDefault(), name.trim() && (onSave(name), setName('')))}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} maxLength={40} aria-label={placeholder} />
        <button type="submit" className="btn small">Enregistrer</button>
      </form>
    </>
  );
}

export function PresetsMenu({ current, onApply }: Props) {
  const [presets, setPresets] = useState<Presets>(loadPresets);
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const change = (p: Presets) => {
    savePresets(p);
    setPresets(p);
  };
  const section = (what: ListKey) => ({
    items: presets[what],
    onSave: (name: string) => change({ ...presets, [what]: upsert(presets[what], name, current(what)) }),
    onRemove: (name: string) => change({ ...presets, [what]: removeNamed(presets[what], name) }),
  });

  return (
    <MenuButton icon={Bookmark01Icon} caret={false} align="right" title="Mises en page et modèles d’indicateurs">
      {(close) => (
        <div className="presets" onMouseEnter={() => setPresets(loadPresets())}>
          <Section title="Mises en page" placeholder="Nom (ex. Scalping 4 écrans)" {...section('layouts')}
            hint="Grille, graphiques (symbole, intervalle, indicateurs), liens et panneaux, rappelés en un clic."
            onApply={(it) => (onApply('layouts', it.value), close())} />
          <div className="pop-sep" />
          <Section title="Modèles d’indicateurs" placeholder="Nom (ex. Footprint delta)" {...section('templates')}
            hint="Type de graphique, footprint, indicateurs et panneaux du graphique actif, à réappliquer sur n’importe quel symbole."
            onApply={(it) => (onApply('templates', it.value), close())} />
          <div className="pop-sep" />
          <button type="button" className="pop-item" onClick={() => downloadExport(presets)}>Exporter dans un fichier…</button>
          <button type="button" className="pop-item" onClick={() => file.current?.click()}>Importer un fichier…</button>
          <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            importFile(f, presets).then(({ presets: p, text }) => (setPresets(p), setMsg({ text })), (err: Error) => setMsg({ text: err.message, err: true }));
          }} />
          {msg && <p className={`pop-note ${msg.err ? 'neg' : 'muted'}`}>{msg.text}</p>}
          <p className="muted pop-note">L’export contient aussi vos dessins de tous les symboles.</p>
        </div>
      )}
    </MenuButton>
  );
}
