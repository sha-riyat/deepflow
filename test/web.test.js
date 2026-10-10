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

test('CVD de session : remis à zéro à 00:00 UTC', async () => {
  const { sessionCvd, sessionStart } = await import('../shared/cvd.js');
  const day = 86_400_000;
  const items = [{ t0: day - 120_000, b: 5, s: 1 }, { t0: day - 60_000, b: 1, s: 3 }, { t0: day, b: 2, s: 0 }, { t0: day + 60_000, b: 0, s: 1 }];
  assert.deepEqual(sessionCvd(items), [4, 2, 2, 1]);
  assert.deepEqual(items.map((_, i) => sessionStart(items, i)), [true, false, true, false]);
});

test('footprint : absorption et épuisement lus dans les trades', async () => {
  const { flowMarks } = await import('../shared/footprint.js');
  // Ventes massives sur le bas (ligne 10) mais clôture en haut de bougie : absorption acheteuse.
  const fp = [[10, 30, 2], [11, 3, 3], [12, 2, 4], [13, 2, 3], [14, 1, 2]];
  const marks = flowMarks(fp, { o: 12, h: 15, l: 10, c: 14.5 }, 1);
  assert.deepEqual(marks.map((m) => [m.kind, m.side, m.row]), [['absorption', 1, 10]]);
  // Bougie haussière dont la ligne haute n’a presque plus d’acheteurs : épuisement des acheteurs.
  const ex = flowMarks([[10, 3, 3], [11, 3, 4], [12, 2, 5], [13, 3, 4], [14, 1, 0]], { o: 10.5, h: 15, l: 10, c: 14.8 }, 1);
  assert.deepEqual(ex.map((m) => [m.kind, m.side]), [['exhaustion', -1]]);
  assert.deepEqual(flowMarks(fp.slice(0, 3), { o: 1, h: 2, l: 0, c: 1 }, 1), []);
});
