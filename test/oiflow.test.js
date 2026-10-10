// Tests du croisement prix × open interest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { oiByPrice, oiChange, oiQuadrant, QUADRANT_LABEL } from '../shared/oiflow.js';

const M5 = 300_000;
// Bougies de 5 min : clôtures 100, 101, 102, 101, 99.
const bars = [100, 101, 102, 101, 99].map((c, i) => ({ t0: i * M5, t1: (i + 1) * M5 - 1, c }));
// Relevés d'OI à la fin de chaque bougie.
const oi = [1000, 1010, 1030, 1020, 1000].map((v, i) => [(i + 1) * M5 - 1, v]);

test('prix × OI : les quatre cas', () => {
  assert.equal(oiQuadrant(1, 2), 'longsIn');
  assert.equal(oiQuadrant(-1, 2), 'shortsIn');
  assert.equal(oiQuadrant(1, -2), 'shortsOut');
  assert.equal(oiQuadrant(-1, -2), 'longsOut');
  assert.equal(oiQuadrant(3, 0.05), 'flat');
  assert.equal(QUADRANT_LABEL.shortsOut, 'rachats de shorts');
});

test('prix × OI : ouvertures et fermetures par niveau de prix', () => {
  // +10 à 101, +20 à 102, −10 à 101, −20 à 99 (lignes de 1).
  assert.deepEqual(oiByPrice(oi, bars, 1), [[99, 0, 20], [101, 10, 10], [102, 20, 0]]);
  assert.deepEqual(oiByPrice(oi, bars, 2), [[49, 0, 20], [50, 10, 10], [51, 20, 0]]); // 101 et 102 → lignes 50 et 51
  assert.deepEqual(oiByPrice(oi, bars, 1, 2 * M5), [[99, 0, 20], [101, 0, 10], [102, 20, 0]]); // à partir de la 3e bougie
  assert.deepEqual(oiByPrice([], bars, 1), []);
});

test('prix × OI : variation entre deux instants', () => {
  const c = oiChange(oi, bars, M5 - 1, 3 * M5 - 1); // 100 → 102, OI 1000 → 1030
  assert.equal(c.quadrant, 'longsIn');
  assert.equal(Math.round(c.dPrice * 100) / 100, 2);
  assert.equal(Math.round(c.dOi * 100) / 100, 3);
  assert.equal(oiChange(oi, bars, 3 * M5 - 1, 5 * M5 - 1).quadrant, 'longsOut'); // 102 → 99, OI 1030 → 1000
  assert.equal(oiChange(oi, bars, 0, 0), null);
  assert.equal(oiChange(oi, bars, 3 * M5 - 1, 99 * M5).quadrant, 'longsOut'); // fin bornée à la dernière bougie
  assert.equal(oiChange(oi, [], 0, M5), null);
});
