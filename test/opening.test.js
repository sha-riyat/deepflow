// Tests de l'initial balance (extensions) et des types d'ouverture de Dalton.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ibExtensions, ibLevels, openType, openTypeLabel } from '../shared/opening.js';

const M30 = 1_800_000;
// Session fictive : tranche 1, ouverture `open`, périodes A et B [période, ligne basse, ligne haute, clôture].
function day(open, A, B) {
  const periods = [[0, ...A], [1, ...B]];
  return { t0: 0, bucket: 1, tpoMs: M30, ibN: 2, open, periods, ibLo: Math.min(A[0], B[0]), ibHi: Math.max(A[1], B[1]) };
}

test('IB : niveaux en prix, extensions à 1,5 × et 2 ×, terminée après la première heure', () => {
  const d = day(100, [95, 104, 102], [99, 109, 108]); // IB 95 → 110 (ligne haute 109 incluse)
  const ib = ibLevels(d, 2 * M30);
  assert.deepEqual([ib.lo, ib.hi, ib.range, ib.done], [95, 110, 15, true]);
  assert.equal(ibLevels(d, 2 * M30 - 1).done, false);
  assert.deepEqual(ibExtensions(ib).map((e) => e.price), [117.5, 87.5, 125, 80]);
  assert.equal(ibLevels(null, 0), null);
});

test('types d’ouverture : drive, test-drive, rejection-reverse, auction', () => {
  const t = 2 * M30;
  // Ouverture au bas de l'IB, jamais revenu dessous, clôture en haut : Open-Drive haussier.
  assert.deepEqual(openType(day(100, [99, 105, 105], [104, 109, 109]), t), { type: 'drive', side: 1 });
  // Petit test sous l'ouverture en A, puis départ vers le haut : Open-Test-Drive haussier.
  assert.deepEqual(openType(day(100, [96, 100, 99], [98, 109, 109]), t), { type: 'test', side: 1 });
  // Grosse baisse en A, rejetée, clôture bien au-dessus de l'ouverture : Rejection-Reverse haussier.
  assert.deepEqual(openType(day(100, [90, 100, 92], [92, 106, 106]), t), { type: 'reject', side: 1 });
  // Ouverture au haut de l'IB, chute sans retour : Open-Drive baissier.
  assert.deepEqual(openType(day(100, [94, 100, 95], [90, 96, 91]), t), { type: 'drive', side: -1 });
  // Clôture de l'IB près de l'ouverture : Open-Auction.
  assert.deepEqual(openType(day(100, [96, 104, 101], [97, 103, 100]), t), { type: 'auction', side: 0 });
  assert.equal(openType(day(100, [96, 104, 101], [97, 103, 100]), t - 1), null); // IB pas terminée
  assert.equal(openTypeLabel({ type: 'test', side: -1 }), 'Open-Test-Drive baissier');
  assert.equal(openTypeLabel({ type: 'auction', side: 0 }), 'Open-Auction');
});
