// Test de bout en bout de la stratégie du cours sur un scénario synthétique (Setup 1, rejet).
import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../server/config.js';
import { ValueAreaStrategy } from '../server/engine/valuearea.js';
import { buildPlan } from '../server/engine/plan.js';

const DAY = 86_400_000;
const MIN = 60_000;
const day = 20_000 * DAY;

test('Setup 1 : sortie au-dessus de la VAH, absorption, retour 2 × 30 min, entrée vendeuse', () => {
  const cfg = { ...structuredClone(config.setups.valuearea), rowPct: 0 };
  const va = new ValueAreaStrategy(cfg, { fpBucket: 1 });
  // Veille : value area 100-110 (VAL ligne 100, VAH ligne 109), POC 104.
  va.setSessions([{ t0: day - DAY, t1: day, bucket: 1, val: 100, vah: 109, poc: 104, rows: [], hi: 112, lo: 96 }], day + 1);
  let id = 0;
  const frames = [];
  const trade = (t, p, q, side) => frames.push({ t, bid: p - 0.1, ask: p, tr: [[p, q, side, t, ++id]] });
  // 00:00-00:30 : dans la valeur.
  for (let m = 0; m < 30; m++) trade(day + m * MIN, 105, 1, m % 2 ? 1 : -1);
  // 00:30-00:50 : montée hors de la valeur jusqu'à 112.
  for (let m = 30; m < 50; m++) trade(day + m * MIN, 106 + (m - 30) * 0.3, 1, 1);
  // 00:50-00:55 : absorption au plus haut : achats agressifs massifs sur 113, encaissés (clôture basse).
  const t0 = day + 50 * MIN;
  [[110.5, 1, 1], [111.5, 1, 1], [112.5, 1, 1], [114.5, 1, 1], [113.5, 20, 1], [113.5, 2, -1], [111, 1, -1]].forEach(([p, q, s], i) => trade(t0 + i * 20_000, p, q, s));
  // 00:55-01:00 : clôture de la période à 112 (dehors).
  for (let m = 55; m < 60; m++) trade(day + m * MIN, 112, 1, -1);
  // 01:00-02:00 : retour dans la valeur, deux clôtures dedans (108 puis 107).
  for (let m = 60; m < 90; m++) trade(day + m * MIN, 108, 1, m % 2 ? 1 : -1);
  for (let m = 90; m < 120; m++) trade(day + m * MIN, 107, 1, m % 2 ? 1 : -1);
  // 02:00-02:05 : repli vers le bord (plus haut 108,5), delta vendeur, clôture 107,8.
  [[108.5, 1, 1], [108, 3, -1], [107.8, 2, -1]].forEach(([p, q, s], i) => trade(day + 120 * MIN + i * 60_000, p, q, s));
  trade(day + 125 * MIN + 1000, 107.8, 0.1, -1); // ouvre la bougie suivante : la 02:00 se clôt

  let cand = null;
  for (const f of frames) cand ??= va.onFrame(f, { big: [] }, { vwap: 106, bid: f.bid, ask: f.ask }).candidate;
  assert.ok(cand, 'un candidat attendu');
  assert.equal(cand.setup, 'rejet');
  assert.equal(cand.dir, -1);
  assert.ok(Math.abs(cand.stop - 115 * 1.001) < 1e-9, `stop ${cand.stop}`); // extrême 115 (haut de la ligne 114) + 0,1 %
  assert.deepEqual(cand.targets.map((t) => t.price), [104.5, 100]);
  assert.ok(cand.why.some((w) => /absorption vendeuse/.test(w)), cand.why.join(' | '));

  // Plan : stop ≤ 1,5 % refusé ici (7 % de distance) ; accepté si le plafond est relevé.
  const info = { symbol: 'T', base: 'T', quote: 'USDT', tickSize: 0.1, stepSize: 0.001, minQty: 0.001, minNotional: 5 };
  const risk = { ...structuredClone(config.risk), equity: 10_000 };
  const f = { t: day + 126 * MIN, bid: 107.8, ask: 107.9 };
  assert.match(buildPlan(cand, { f, risk, info, atr: null, walls: [] }).rejected, /stop/);
  const ok = buildPlan(cand, { f, risk: { ...risk, maxStopPct: 10, minRR: 0.5 }, info, atr: null, walls: [] });
  assert.ok(ok.plan, ok.rejected);
  assert.deepEqual(ok.plan.targets.map((t) => t.price), [104.5, 100]);
});

test('passage de minuit : une frame après minuit avec des trades de la veille ne fait pas perdre la session', () => {
  const cfg = { ...structuredClone(config.setups.valuearea), rowPct: 0 };
  const va = new ValueAreaStrategy(cfg, { fpBucket: 1 });
  let id = 0;
  // Trois jours ; la dernière frame de chaque jour est horodatée à minuit pile (fin de la fenêtre).
  for (let d = 0; d < 3; d++) {
    const t0 = day + d * DAY;
    for (let m = 0; m < 24 * 60; m += 10) va.onFrame({ t: t0 + m * MIN, bid: 99.9, ask: 100, tr: [[100 + d, 1, 1, t0 + m * MIN, ++id]] }, { big: [] }, { vwap: null });
    va.onFrame({ t: t0 + DAY, bid: 99.9, ask: 100, tr: [[100 + d, 1, -1, t0 + DAY - 100, ++id]] }, { big: [] }, { vwap: null });
  }
  va.onFrame({ t: day + 3 * DAY + MIN, bid: 99.9, ask: 100, tr: [[103, 1, 1, day + 3 * DAY + MIN, ++id]] }, { big: [] }, { vwap: null });
  assert.deepEqual([...va.days.keys()].sort(), [day, day + DAY, day + 2 * DAY]);
  assert.equal(va.today().t0, day + 3 * DAY);
});
