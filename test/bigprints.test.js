import test from 'node:test';
import assert from 'node:assert/strict';
import { groupBigPrints } from '../shared/bigprints.js';

const MIN = 60_000;
const bars = [0, 1, 2].map((k) => ({ t0: k * 5 * MIN, t1: (k + 1) * 5 * MIN }));

test('gros prints : plusieurs ordres au même niveau de la même bougie sont additionnés', () => {
  // Quatre achats de 72, 61, 60 et 62 à 100,2 – 100,8 (même ligne de 1) dans la bougie 0.
  const prints = [[1000, 100.2, 72, 1], [2000, 100.4, 61, 1], [3000, 100.6, 60, 1], [4000, 100.8, 62, 1]];
  const [g, ...rest] = groupBigPrints(prints, bars, 1);
  assert.equal(rest.length, 0);
  assert.equal(g[2], 255); // quantité sommée
  assert.equal(g[3], 1);
  assert.equal(g[4], 4); // nombre d'ordres
  assert.equal(g[5], 0); // bougie 0
  assert.ok(Math.abs(g[1] - (100.2 * 72 + 100.4 * 61 + 100.6 * 60 + 100.8 * 62) / 255) < 1e-9); // prix pondéré
  assert.ok(g[0] > 1000 && g[0] < 4000); // instant moyen
});

test('gros prints : côtés, lignes de prix et bougies différents restent séparés', () => {
  const prints = [
    [1000, 100.2, 10, 1],
    [1500, 100.4, 10, -1], // autre côté
    [2000, 101.5, 10, 1], // autre ligne
    [5 * MIN + 10, 100.3, 10, 1], // autre bougie
  ];
  const out = groupBigPrints(prints, bars, 1);
  assert.equal(out.length, 4);
  assert.deepEqual(out.map((g) => g[5]).sort(), [0, 0, 0, 1]);
});

test('gros prints : sans ligne de regroupement, un ordre = un groupe ; avant la première bougie, index -1', () => {
  const prints = [[1000, 100.2, 5, 1], [2000, 100.2, 7, 1], [-5, 100, 1, 1]];
  const out = groupBigPrints(prints, bars, 0);
  assert.deepEqual(out.map((g) => g[4]), [1, 1, 1]);
  assert.equal(out[2][5], -1);
  assert.deepEqual(groupBigPrints([], bars, 1), []);
});
