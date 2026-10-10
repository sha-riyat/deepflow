// Tests du replay : rien ne doit dépasser l'heure rejouée (pas de « futur » visible).
import test from 'node:test';
import assert from 'node:assert/strict';
import { TradeStore } from '../server/history/store.js';
import * as Q from '../server/queries.js';
import { Trades } from '../server/history/trades.js';
import { ArchiveSource } from '../server/replay.js';

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

// Archives fictives : un trade toutes les 10 s, prix = minutes depuis minuit.
const DAY = 86_400_000;
const D = Date.UTC(2026, 9, 5);
function fakeDay(d) {
  const t = new Trades(9000);
  for (let k = 0; k < DAY / 10_000; k++) t.push(d + k * 10_000, 100 + k / 6, 1, k % 2 ? 1 : -1, d / 1000 + k);
  return t;
}

test('replay des archives : lecture, avance silencieuse, passage de minuit, fin des données', async () => {
  const loaded = [];
  const src = new ArchiveSource({ loadDay: async (d) => (loaded.push(d), fakeDay(d)), from: D + 12 * 3_600_000, end: D + 2 * DAY });
  const trades = [];
  const frames = [];
  let jumped = 0;
  src.on('trade', (t) => trades.push(t));
  src.on('frame', (f) => frames.push(f));
  src.on('jumped', () => jumped++);
  // Petite avance : une frame diffusée, trades de [12:00:00, 12:00:03) seulement.
  await src.advanceTo(D + 12 * 3_600_000 + 3000);
  assert.deepEqual(trades.map((t) => t.t), [D + 12 * 3_600_000]);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].silent, false);
  assert.equal(src.clock, D + 12 * 3_600_000 + 3000);
  // Grande avance (1 min) : une frame silencieuse par seconde, puis « jumped ».
  await src.advanceTo(D + 12 * 3_600_000 + 63_000);
  assert.equal(jumped, 1);
  assert.equal(frames.filter((f) => f.silent).length, 60);
  assert.equal(trades.length, 7); // un trade toutes les 10 s jusqu'à 12:01:03 exclu
  assert.ok(trades.every((t, i) => i === 0 || t.t > trades[i - 1].t));
  // Passage de minuit : le jour suivant est chargé ; fin des données : arrêt à `end`.
  await src.advanceTo(D + DAY + 5 * 60_000);
  assert.deepEqual(loaded, [D, D + DAY]);
  await src.advanceTo(D + 5 * DAY);
  assert.equal(src.clock, D + 2 * DAY);
  assert.equal(trades[trades.length - 1].t, D + 2 * DAY - 10_000);
  src.stop();
});

test('replay des archives : le magasin connaît le jour jusqu’au départ', async () => {
  const store = new TradeStore({ market: 'futures', symbol: 'TESTUSDT', dir: '/nonexistent', rest: null });
  const from = D + 6 * 3_600_000 + 30 * 60_000; // 06:30
  store.seed(D, from, fakeDay(D));
  store.appendLive(from, 200, 1, 1, 1); // premier trade rejoué
  const r = await store.getRange(D + 5 * 3_600_000, from + 1);
  assert.equal(r.trades.n, 90 * 6 + 1); // 05:00 à 06:30 de l'archive, puis le trade rejoué
  assert.equal(r.trades.t[r.trades.n - 1], from);
});

test('derniers ticks gardés pour les navigateurs : nombre et taille plafonnés', async () => {
  const { Hub } = await import('../server/hub.js');
  const hub = new Hub();
  const big = { t: 1, tr: Array.from({ length: 20_000 }, () => [100000.5, 1.234, 1, 1791550800000, 123456789]) };
  for (let i = 0; i < 40; i++) hub.tick(big); // ~1 Mo chacun
  assert.ok(hub.tickBytes <= 16 * 1024 * 1024);
  assert.ok(hub.ticks.length < 40 && hub.ticks.length > 1);
  assert.equal(hub.tickBytes, hub.ticks.reduce((n, d) => n + d.length, 0));
});
