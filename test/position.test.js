// Tests de la gestion d'une position : point mort, gain verrouillé, déplacements du stop.
import test from 'node:test';
import assert from 'node:assert/strict';
import { breakEvenPrice, calcDefaults, cleanCalc, improves, moveStop, positionPoints, positionStats, resetStop, shiftCalc, stopForR } from '../shared/position.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('point mort : le prix couvre les frais d’entrée et de sortie', () => {
  assert.equal(breakEvenPrice('long', 100, 0), 100);
  near(breakEvenPrice('long', 100, 0.05), 100 * 1.0005 / 0.9995);
  near(breakEvenPrice('short', 100, 0.05), 100 * 0.9995 / 1.0005);
  // sorti à ce prix, le gain net est nul
  const be = breakEvenPrice('long', 100, 0.05);
  near(be - 100 - 0.0005 * (100 + be), 0);
  assert.ok(breakEvenPrice('long', 100, 0.05) > 100 && breakEvenPrice('short', 100, 0.05) < 100);
});

test('gain verrouillé : stop à +r × le risque initial, R verrouillés au stop courant', () => {
  assert.equal(stopForR('long', 100, 98, 1), 102);
  assert.equal(stopForR('long', 100, 98, 0.5), 101);
  assert.equal(stopForR('short', 100, 103, 1), 97);
  // avec frais : le gain verrouillé net de frais vaut bien r R
  for (const [side, stop0] of [['long', 98], ['short', 102]]) {
    for (const r of [0, 0.5, 1, 2]) {
      const stop = stopForR(side, 100, stop0, r, 0.05);
      const st = positionStats({ side, entry: 100, stop, stop0, target: side === 'long' ? 110 : 90, capital: 1000, risk: 1, fees: 0.05 });
      near(st.lockedR, r, 1e-9);
    }
  }
  // long 100, stop initial 98, cible 106, 1 000 $ à 1 % (10 $), sans frais ; stop remonté à 102
  const base = { side: 'long', entry: 100, target: 106, capital: 1000, risk: 1 };
  const moved = positionStats({ ...base, stop: 102, stop0: 98 });
  assert.equal(moved.valid, true);
  assert.equal(moved.riskAmount, 10);
  near(moved.qty, 5); // 10 $ / 2 par unité : la taille reste celle du stop initial
  assert.equal(moved.riskNow, 0);
  near(moved.lockedR, 1); // +2 par unité × 5 = 10 $ = 1 R
  near(moved.rr, 3); // cible : +6 par unité × 5 = 30 $
  near(moved.stopPct, -2);
  // stop initial : rien de verrouillé, tout le risque encore en jeu
  const start = positionStats({ ...base, stop: 98 });
  assert.equal(start.lockedR, 0);
  near(start.riskNow, 10);
  // point mort sans frais : ni risque ni gain verrouillé
  const be = positionStats({ ...base, stop: 100, stop0: 98 });
  assert.equal(be.riskNow, 0);
  assert.equal(be.lockedR, 0);
  // avec frais, le stop à l'entrée perd encore les frais : le vrai point mort est un peu plus haut
  const fee = { ...base, fees: 0.05, stop0: 98 };
  assert.ok(positionStats({ ...fee, stop: 100 }).riskNow > 0);
  near(positionStats({ ...fee, stop: breakEvenPrice('long', 100, 0.05) }).riskNow, 0, 1e-9);
});

test('déplacement du stop : seulement vers le gain, stop initial et historique mémorisés', () => {
  const pts = positionPoints({ t: 0, p: 100 }, 'long', 2, 50); // stop 98, cible 104
  assert.equal(improves('long', 98, 99), true);
  assert.equal(improves('long', 98, 97), false);
  assert.equal(improves('short', 102, 101), true);
  assert.equal(moveStop('long', pts, { capital: 1000, risk: 1, fees: 0 }, 97, 10), null); // plus risqué : refusé
  const a = moveStop('long', pts, { capital: 1000, risk: 1, fees: 0 }, 100, 10);
  assert.deepEqual(a.pts.map((q) => q.p), [100, 100, 104]);
  assert.deepEqual([a.calc.stop0, a.calc.moves], [98, [{ t: 10, p: 100 }]]);
  const b = moveStop('long', a.pts, a.calc, 102, 20); // le stop initial reste celui de départ
  assert.deepEqual([b.calc.stop0, b.calc.moves.length, b.pts[1].p], [98, 2, 102]);
  assert.deepEqual(pts[1], { t: 50, p: 98 }); // l'entrée n'est pas modifiée
  const r = resetStop(b.pts, b.calc);
  assert.deepEqual([r.pts[1].p, 'stop0' in r.calc, 'moves' in r.calc], [98, false, false]);
  assert.equal(resetStop(pts, { capital: 1, risk: 1, fees: 0 }), null);
});

test('réglages : champs de position validés, par défaut du compte sans eux, décalage', () => {
  assert.deepEqual(cleanCalc({ capital: -5, risk: 'x' }), { capital: 1000, risk: 1, fees: 0.05 });
  const c = cleanCalc({ capital: 500, risk: 2, fees: 0.1, stop0: 98, moves: [{ t: 1, p: 99 }, { t: 'x', p: 5 }, { t: 2, p: -1 }] });
  assert.deepEqual([c.stop0, c.moves], [98, [{ t: 1, p: 99 }]]);
  assert.equal('stop0' in cleanCalc({ stop0: 'abc' }), false);
  assert.deepEqual(calcDefaults(c), { capital: 500, risk: 2, fees: 0.1 });
  assert.deepEqual(shiftCalc(c, 10, 5), { ...c, stop0: 103, moves: [{ t: 11, p: 104 }] });
  assert.deepEqual(shiftCalc({ capital: 1, risk: 1, fees: 0 }, 10, 5), { capital: 1, risk: 1, fees: 0 });
  assert.equal(cleanCalc({ moves: Array.from({ length: 40 }, (_, i) => ({ t: i, p: 1 })) }).moves.length, 30);
});

test('stop suiveur : sous la dernière mèche fermée, sous le dernier gros print favorable', async () => {
  const { wickStop, printStop } = await import('../shared/trailing.js');
  const bars = [
    { t0: 0, h: 105, l: 99, x: 1 },
    { t0: 60, h: 108, l: 101, x: 1 },
    { t0: 120, h: 110, l: 103, x: 1 },
    { t0: 180, h: 112, l: 106 }, // en cours : ignorée
  ];
  assert.equal(wickStop('long', bars, 0, 1), 102); // plus bas de la dernière bougie fermée (103) moins 1
  assert.equal(wickStop('short', bars, 0, 1), 111);
  assert.equal(wickStop('long', bars, 120, 0), 103);
  assert.equal(wickStop('long', bars, 180, 0), null); // aucune bougie fermée depuis l'entrée
  assert.equal(wickStop('long', [], 0), null);
  const prints = [[10, 100, 50, 1], [20, 104, 60, -1], [30, 103, 70, 1], [40, 108, 80, -1]]; // [t, prix, qté, côté]
  assert.equal(printStop('long', prints, 0, 2), 101); // dernier achat : 103 − 2
  assert.equal(printStop('short', prints, 0, 2), 110); // dernière vente : 108 + 2
  assert.equal(printStop('long', prints, 31, 0), null); // aucun achat depuis 31
  assert.equal(printStop('short', [], 0), null);
});
