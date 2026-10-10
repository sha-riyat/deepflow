// Tests des calculs du graphique (modules du navigateur, sans dessin).
import test from 'node:test';
import assert from 'node:assert/strict';
import { imbalances, stacks, unfinished, mergeRows } from '../shared/footprint.js';

test('footprint : déséquilibres diagonaux, cases opposées à zéro ignorées par défaut', () => {
  // [ligne, ventes, achats] : achats de la ligne N comparés aux ventes de la ligne N - 1.
  const fp = [[10, 5, 0], [11, 0, 20], [12, 0, 9], [13, 4, 1]];
  const strict = imbalances(fp, 3);
  assert.deepEqual([...strict.buy], [11]); // 20 ≥ 3 × 5 ; lignes 12 et 13 face à 0 vente : zero prints
  assert.deepEqual([...strict.sell], []);
  const loose = imbalances(fp, 3, 'count');
  assert.deepEqual([...loose.buy].sort(), [11, 12, 13]);
  assert.deepEqual(stacks(new Set([3, 4, 5, 9]), 3), [[3, 5]]);
});

test('footprint : enchère inachevée et regroupement de lignes', () => {
  const fp = [[10, 1, 2], [11, 0, 3], [12, 2, 1]];
  assert.deepEqual(unfinished(fp, 1).map((u) => u.high), [true, false]); // achats et ventes aux deux extrêmes
  assert.deepEqual(mergeRows(fp, 2), [[5, 1, 5, 0, 0], [6, 2, 1, 0, 0]]);
});
