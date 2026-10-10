// Tests du replay : rien ne doit dépasser l'heure rejouée (pas de « futur » visible).
import test from 'node:test';
import assert from 'node:assert/strict';
import { TradeStore } from '../server/history/store.js';
import * as Q from '../server/queries.js';

const MIN = 60_000;

// Session de replay minimale : magasin hors ligne rempli de 30 min de trades, horloge à 10 min.
function replaySession(clock) {
  const store = new TradeStore({ market: 'futures', symbol: 'TESTUSDT', dir: '/nonexistent', rest: null, offline: true });
  const t0 = Date.UTC(2026, 9, 5, 12);
  for (let i = 0; i < 30 * 6; i++) store.appendLive(t0 + i * 10_000, 100 + (i % 7), 1, i % 2 ? 1 : -1, i);
  return { mode: 'replay', store, cfg: { symbol: 'TESTUSDT', market: 'futures', footprint: { bucket: 1 } }, flow: { bigThreshold: Infinity }, now: () => t0 + clock, t0 };
}

test('replay : bougies, bulles et profils arrêtés à l’heure rejouée', async () => {
  const s = replaySession(10 * MIN);
  const r = await Q.bars(s, { type: 'time', param: String(MIN), to: String(s.t0 + 60 * MIN) });
  assert.equal(r.bars.length, 10); // minutes 0 à 9 : la plage [début, présent) exclut le présent
  assert.ok(r.bars.every((b) => b.t0 <= s.now()));
  assert.equal(r.serverT, s.now());
  const b = await Q.bubbles(s, { from: String(s.t0), to: String(s.t0 + 60 * MIN), slot: '60000' });
  assert.ok(b.rows.every(([t]) => t <= s.now()));
  const p = await Q.profiles(s, { mode: 'range', from: String(s.t0), to: String(s.t0 + 60 * MIN), bucket: '1' });
  assert.ok(p.sessions[0].hi <= 106 && p.sessions[0].t1 <= s.now());
});
