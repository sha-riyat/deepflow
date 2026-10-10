'use client';
// Rail d'icônes à droite et zone des panneaux : chaque icône ouvre ou ferme un panneau, deux au
// plus sont empilés (le plus ancien est remplacé) ; largeur et partage se règlent à la souris.
import type { ReactNode } from 'react';
import {
  Activity01Icon, BookOpen01Icon, Cancel01Icon, LayoutListIcon, Notebook01Icon, LeftToRightListStar01Icon, Notification03Icon, TransactionHistoryIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from './ui';
import type { Rail as RailLayout } from '@/lib/layout';

export const PANELS: Record<string, [string, IconSvgElement]> = {
  flow: ['Flux', Activity01Icon],
  dom: ['DOM', LayoutListIcon],
  tape: ['Trades', TransactionHistoryIcon],
  markets: ['Marchés', LeftToRightListStar01Icon],
  alerts: ['Alertes', Notification03Icon],
  journal: ['Journal', Notebook01Icon],
  learn: ['Apprendre', BookOpen01Icon],
};

type RailState = RailLayout;

export function toggleOpen(open: string[], id: string): string[] {
  return open.includes(id) ? open.filter((x) => x !== id) : [...open, id].slice(-2);
}

export function Rail({ rail, badges, onToggle }: { rail: RailState; badges: Set<string>; onToggle: (id: string) => void }) {
  const entries = Object.entries(PANELS);
  const button = ([id, [label, ico]]: [string, [string, IconSvgElement]]) => (
    <button key={id} type="button" className={`rail-btn${rail.open.includes(id) ? ' on' : ''}`} title={label} onClick={() => onToggle(id)}>
      <Icon icon={ico} size={18} />
      {badges.has(id) && <i className="badge-dot" />}
    </button>
  );
  return (
    <nav id="rail" aria-label="Panneaux">
      {entries.slice(0, 4).map(button)}
      <span className="rail-sep" />
      {entries.slice(4).map(button)}
    </nav>
  );
}

function drag(e: React.MouseEvent, onMove: (dx: number, dy: number) => void) {
  e.preventDefault();
  let last = { x: e.clientX, y: e.clientY };
  const move = (ev: MouseEvent) => {
    onMove(ev.clientX - last.x, ev.clientY - last.y);
    last = { x: ev.clientX, y: ev.clientY };
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}

export function Panels({ rail, setRail, onToggle, render }: {
  rail: RailState;
  setRail: (r: RailState) => void;
  onToggle: (id: string) => void;
  render: (id: string) => ReactNode;
}) {
  if (rail.open.length === 0) return <div id="panels" className="empty" />;
  let state = rail;
  const set = (patch: Partial<RailState>) => {
    state = { ...state, ...patch };
    setRail(state);
  };
  const panel = (id: string, grow: number) => (
    <div className="panel" style={{ flex: `${grow} 1 0` }} key={id}>
      <div className="panel-head">
        <h2>{PANELS[id][0]}</h2>
        <button type="button" className="tb-btn icon" title="Fermer" onClick={() => onToggle(id)}>
          <Icon icon={Cancel01Icon} size={16} />
        </button>
      </div>
      <div className="panel-body">{render(id)}</div>
    </div>
  );
  return (
    <div id="panels" style={{ width: rail.width }}>
      <div className="panels-resize" onMouseDown={(e) => drag(e, (dx) => set({ width: Math.min(760, Math.max(260, state.width - dx)) }))} />
      <div className="panels-stack">
        {rail.open.length === 1 ? (
          panel(rail.open[0], 1)
        ) : (
          <>
            {panel(rail.open[0], rail.split)}
            <div className="panel-split" onMouseDown={(e) => {
              const h = (e.currentTarget.parentElement as HTMLElement).clientHeight;
              drag(e, (_, dy) => set({ split: Math.min(0.85, Math.max(0.15, state.split + dy / h)) }));
            }} />
            {panel(rail.open[1], 1 - rail.split)}
          </>
        )}
      </div>
    </div>
  );
}
