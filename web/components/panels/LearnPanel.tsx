'use client';
// Panneau Apprendre : fiches de chaque indicateur, panneau, mode du footprint et outil (ce que
// c'est, comment le lire, les pièges), recherche, et la routine d'analyse. Le bouton « ? » d'une
// ligne de légende ou d'un panneau ouvre directement sa fiche.
import { useEffect, useState } from 'react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../ui';
import { Checklist } from './Checklist';
import { ARTICLES, LEVELS, article, searchArticles } from '@/lib/help/index.js';

type Article = (typeof ARTICLES)[number] & { see?: string[] };

function ArticleView({ a, onBack, onOpen }: { a: Article; onBack: () => void; onOpen: (id: string) => void }) {
  return (
    <div className="learn-article">
      <button type="button" className="tb-btn learn-back" onClick={onBack}>
        <Icon icon={ArrowLeft01Icon} size={14} />
        <span>Toutes les fiches</span>
      </button>
      <h3>{a.title}</h3>
      <span className={`learn-level ${a.level}`}>{LEVELS[a.level as keyof typeof LEVELS]}</span>
      <p>{a.what}</p>
      {a.read.length > 0 && (
        <>
          <h4>Comment le lire</h4>
          <ul>{a.read.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      {a.traps.length > 0 && (
        <>
          <h4>Pièges</h4>
          <ul className="traps">{a.traps.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      {a.see && a.see.length > 0 && (
        <>
          <h4>Voir aussi</h4>
          <div className="learn-see">{a.see.map((id: string) => article(id) && <button key={id} type="button" className="pop-item" onClick={() => onOpen(id)}><span>{article(id)?.title}</span></button>)}</div>
        </>
      )}
      <p className="muted learn-note">Outil d’analyse et d’apprentissage : ce n’est pas un conseil financier.</p>
    </div>
  );
}

export function LearnPanel({ topic }: { topic: { id: string; n: number } | null }) {
  const [id, setId] = useState<string | null>(topic?.id ?? null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'help' | 'check'>('help');
  useEffect(() => setId(topic?.id ?? null), [topic]);
  const a = id ? article(id) : null;
  if (a) return <ArticleView a={a} onBack={() => setId(null)} onOpen={setId} />;
  if (tab === 'check') {
    return (
      <div className="learn">
        <div className="seg">
          <button type="button" onClick={() => setTab('help')}>Fiches</button>
          <button type="button" className="on">Check-list</button>
        </div>
        <Checklist onHelp={(h) => (setTab('help'), setId(h))} />
      </div>
    );
  }
  const list = searchArticles(q);
  const groups = [...new Set(list.map((x) => x.group))];
  return (
    <div className="learn">
      <div className="seg">
        <button type="button" className="on">Fiches</button>
        <button type="button" onClick={() => setTab('check')}>Check-list</button>
      </div>
      <input className="learn-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (delta, VWAP, absorption…)" aria-label="Rechercher une fiche" />
      {groups.map((g) => (
        <div key={g}>
          <div className="pop-title">{g}</div>
          {list.filter((x) => x.group === g).map((x) => (
            <button key={x.id} type="button" className="pop-item" onClick={() => setId(x.id)}>
              <span>{x.title}</span>
              <i className={`learn-dot ${x.level}`} title={LEVELS[x.level as keyof typeof LEVELS]} />
            </button>
          ))}
        </div>
      ))}
      {!list.length && <p className="muted pop-note">Aucune fiche ne correspond.</p>}
    </div>
  );
}
