import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../server/config.js';
import { Engine } from '../server/engine/engine.js';
import { buildPlan } from '../server/engine/plan.js';
import { Tracker } from '../server/engine/tracker.js';

const INFO = { symbol: 'TESTUSDT', base: 'TEST', quote: 'USDT', tickSize: 0.1, stepSize: 0.001, minQty: 0.001, minNotional: 5 };

function testConfig() {
  const cfg = structuredClone(config);
  cfg.market = 'futures';
  cfg.bucket = 1;
  cfg.rangeBuckets = 50;
  cfg.flow.lookbackMs = 60_000;
  cfg.flow.bigPrintMinSamples = 10;
  cfg.setups.absorption.enabled = true; // setups historiques testés ici ; stratégie du cours à part
  cfg.setups.breakout.enabled = true;
  cfg.setups.valuearea.enabled = false;
  Object.assign(cfg.risk, { maxStopPct: null, minRR: null, limits: null, windows: [] });
  Object.assign(cfg.risk, { equity: 1000, riskPct: 0.5, maxLeverage: 5, minStopPct: 0.3, takerFee: 0.0002 });
  return cfg;
}

// Carnet : 1 lot par tranche, plus un mur acheteur optionnel.
function frame(t, bid, ask, tr, wallRow = null, wallQty = 50) {
  const r0 = Math.floor((bid + ask) / 2) - 50;
  const b = new Array(101).fill(0);
  const a = new Array(101).fill(0);
  for (let i = 0; i < 101; i++) {
    const row = r0 + i;
    if (row <= Math.floor(bid)) b[i] = 1;
    if (row >= Math.floor(ask)) a[i] = 1;
    if (row === wallRow) b[i] = wallQty;
  }
  return { t, bid, ask, r0, b, a, tr };
}

test('plan : stop élargi au minimum, taille au risque, cibles en R', () => {
  const cfg = testConfig();
  const f = frame(0, 999.9, 1000, []);
  const { plan } = buildPlan({ dir: 1, stop: 999 }, { f, risk: cfg.risk, info: INFO, atr: null, walls: [] });
  assert.equal(plan.entry, 1000);
  assert.equal(plan.stop, 997); // 0,3 % de 1000 = 3
  assert.equal(plan.targets[0].price, 1004.5); // +1,5R
  assert.equal(plan.targets[1].price, 1009); // +3R
  assert.equal(plan.qty, 1.666); // 5 USDT / 3, arrondi au pas inférieur
  assert.ok(plan.riskUsd <= 5);
  assert.ok(plan.notes.length === 1);
});

test('plan : refus si frais trop lourds ou taille sous le minimum', () => {
  const cfg = testConfig();
  const f = frame(0, 999.9, 1000, []);
  const ctx = { f, info: INFO, atr: null, walls: [] };
  const fees = buildPlan({ dir: 1, stop: 999 }, { ...ctx, risk: { ...cfg.risk, takerFee: 0.002 } });
  assert.match(fees.rejected, /frais/);
  const tiny = buildPlan({ dir: 1, stop: 999 }, { ...ctx, risk: { ...cfg.risk, equity: 1 } });
  assert.match(tiny.rejected, /minimum/);
});

test('suivi : cible 1, stop au point d’entrée, cible 2', () => {
  const tracker = new Tracker();
  const sig = { t: 0, dir: 1, entry: 1000, stop: 997, dist: 3, feeR: 0.1, riskUsd: 5, maxHoldMs: 1e9, entryType: 'marché', targets: [{ R: 1.5, pct: 50, price: 1004.5, hit: false }, { R: 3, pct: 50, price: 1009, hit: false }] };
  tracker.open(sig);
  assert.equal(tracker.update(frame(1, 1004.6, 1004.7, [])), 'event');
  assert.equal(sig.stopCurrent, 1000);
  assert.equal(tracker.update(frame(2, 1009, 1009.1, [])), 'closed');
  assert.equal(sig.outcome, 'target');
  assert.equal(sig.resultR, 2.15); // 0,75 + 1,5 - 0,1 de frais
  assert.equal(tracker.stats().n, 1);
});

test('suivi : stop touché = -1R moins les frais', () => {
  const tracker = new Tracker();
  const sig = { t: 0, dir: -1, entry: 1000, stop: 1003, dist: 3, feeR: 0.1, riskUsd: 5, maxHoldMs: 1e9, entryType: 'marché', targets: [{ R: 1.5, pct: 50, price: 995.5, hit: false }, { R: 3, pct: 50, price: 991, hit: false }] };
  tracker.open(sig);
  assert.equal(tracker.update(frame(1, 1002.9, 1003, [])), 'closed');
  assert.equal(sig.outcome, 'stop');
  assert.equal(sig.resultR, -1.1);
});

test('moteur : absorption sur un mur acheteur → signal LONG complet', () => {
  const cfg = testConfig();
  cfg.setups.breakout.enabled = false;
  const engine = new Engine(cfg, INFO);
  const signals = [];
  engine.on('signal', (s) => signals.push(s));

  let T = 0;
  for (let t = 0; t <= 62_000; t += 100) {
    const tr = [
      [996.55, 0.05, 1, ++T],
      [996.5, 0.05, -1, ++T],
    ];
    if (t >= 45_000 && t < 58_000) tr.push([996.5, 2, -1, ++T]); // vendeurs agressifs sur le mur
    if (t >= 58_000) tr.push([996.6, 1, 1, ++T]); // retournement du delta
    const f = frame(t, 996.5, 996.6, tr, 995);
    if (t === 50_000) f.liq = [[996.4, 30, -1, t]]; // positions longues liquidées sur le mur
    engine.onFrame(f);
    if (signals.length) break;
  }

  assert.equal(signals.length, 1, 'un signal attendu');
  const s = signals[0];
  assert.equal(s.side, 'LONG');
  assert.equal(s.setup, 'absorption');
  assert.equal(s.entry, 996.6);
  assert.ok(s.stop < 995, 'stop sous le mur');
  assert.ok(s.why.length >= 4);
  assert.ok(s.why.some((w) => /positions longues liquidées/.test(w)), s.why.join(' | '));
  assert.ok(s.qty > 0 && s.riskUsd <= 5);
  assert.equal(s.status, 'open');
});
