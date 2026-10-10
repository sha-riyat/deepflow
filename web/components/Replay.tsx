'use client';
// Replay des archives (entraînement) : fenêtre de lancement dans la barre du haut (symbole, jour,
// heure UTC, vitesse) et commandes dans la barre d'état (lecture, vitesse, +1 bougie, +1 h,
// retour au direct). Le collecteur rejoue chaque trade du jour choisi comme s'il arrivait en direct.
import { useState } from 'react';
import { FastForwardIcon, NextIcon, PauseIcon, PlayIcon, ReplayIcon } from '@hugeicons/core-free-icons';
import { Icon, MenuButton } from './ui';
import { getData } from '@/lib/engine';
import { getLive, useLive } from '@/lib/store';

const DAY = 86_400_000;
export const SPEEDS = [1, 5, 20, 60, 300];

async function post(path: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return res.ok ? null : ((await res.json()).error ?? `HTTP ${res.status}`);
  } catch (err) {
    return (err as Error).message;
  }
}

const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

function Launcher({ close }: { close: () => void }) {
  const meta = useLive((s) => s.meta);
  const yesterday = Math.floor(Date.now() / DAY) * DAY - DAY;
  const [symbol, setSymbol] = useState(meta?.symbol ?? 'BTCUSDT');
  const [day, setDay] = useState(isoDay(yesterday));
  const [time, setTime] = useState('13:00');
  const [speed, setSpeed] = useState(20);
  const [error, setError] = useState('');
  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const from = Date.parse(`${day}T${time}:00Z`);
    const err = await post('/api/replay', { symbol: symbol.trim().toUpperCase(), from, speed });
    if (err) setError(err);
    else close();
  };
  return (
    <form className="form replay-form" onSubmit={start}>
      <div className="pop-title">Replay d’une journée passée (entraînement)</div>
      <label>Symbole <input value={symbol} onChange={(e) => setSymbol(e.target.value)} /></label>
      <label>Jour (UTC) <input type="date" value={day} max={isoDay(yesterday)} onChange={(e) => setDay(e.target.value)} required /></label>
      <label>Heure de départ (UTC) <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></label>
      <label>Vitesse
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => <option key={s} value={s}>×{s}</option>)}
        </select>
      </label>
      <p className="muted">
        Chaque trade du jour est rejoué comme en direct, en pause au départ. L’archive Binance est téléchargée
        une fois (plusieurs dizaines de Mo), puis gardée. Le direct est suspendu pendant le replay ; le carnet
        d’ordres (heatmap, DOM) n’est pas archivé par Binance.
      </p>
      {error && <p className="neg">{error}</p>}
      <button type="submit" className="btn primary">Lancer le replay</button>
    </form>
  );
}

// Bouton de la barre du haut.
export function ReplayLauncher() {
  const archive = useLive((s) => s.meta?.archive);
  return (
    <MenuButton icon={ReplayIcon} label="Replay" caret={false} align="right" active={Boolean(archive)} title="Rejouer une journée passée pour s’entraîner">
      {(close) => <Launcher close={close} />}
    </MenuButton>
  );
}

// Prochaine limite de bougie (bougies temps), sinon une minute plus tard.
function nextBar(t: number): number {
  const { type, param } = getData().spec;
  return type === 'time' ? (Math.floor(t / param) + 1) * param : t + 60_000;
}

// Commandes de la barre d'état, pendant un replay des archives.
export function ReplayControls() {
  const st = useLive((s) => s.replay);
  const archive = useLive((s) => s.meta?.archive);
  const [error, setError] = useState('');
  if (!archive || !st) return null;
  const control = async (action: string, value?: number) => setError((await post('/api/replay/control', { action, value })) ?? '');
  const t = getLive().replay?.t ?? st.t;
  return (
    <span className="replay-ctl">
      <b className="replay-tag">REPLAY</b>
      <button type="button" className="tb-btn icon" title={st.playing ? 'Pause' : 'Lecture'} onClick={() => control(st.playing ? 'pause' : 'play')}>
        <Icon icon={st.playing ? PauseIcon : PlayIcon} size={14} />
      </button>
      {SPEEDS.map((s) => (
        <button key={s} type="button" className={`tb-btn${s === st.speed ? ' on' : ''}`} onClick={() => control('speed', s)}>×{s}</button>
      ))}
      <button type="button" className="tb-btn" title="Avancer jusqu’à la clôture de la bougie en cours" onClick={() => control('step', nextBar(t))}>
        <Icon icon={NextIcon} size={14} />1 bougie
      </button>
      <button type="button" className="tb-btn" title="Avancer d’une heure" onClick={() => control('step', t + 3_600_000)}>
        <Icon icon={FastForwardIcon} size={14} />1 h
      </button>
      <button type="button" className="tb-btn" title="Quitter le replay et revenir au direct" onClick={async () => setError((await post('/api/live', {})) ?? '')}>
        Direct
      </button>
      {error && <span className="neg">{error}</span>}
    </span>
  );
}
