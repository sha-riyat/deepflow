// Tests des statistiques par bougie : delta %, volume relatif, taille moyenne.
import test from 'node:test';
import assert from 'node:assert/strict';
import { avgSize, deltaPct, relativeVolume } from '../shared/barstats.js';

test('statistiques de bougie : delta %, volume relatif, taille moyenne', () => {
  assert.equal(deltaPct({ v: 26, b: 11, s: 15 }).toFixed(1), '-15.4'); // exemple de la vidéo sur le CVD
  assert.equal(deltaPct({ v: 0, b: 0, s: 0 }), 0);
  const items = [10, 10, 10, 10, 10, 40, 10].map((v) => ({ v }));
  assert.equal(relativeVolume(items, 5), 4); // 40 face à 10 de moyenne
  assert.equal(relativeVolume(items, 3), null); // moins de 5 bougies avant
  assert.equal(relativeVolume(items, 6, 2), null);
  assert.equal(relativeVolume(items, 6, 6).toFixed(2), '0.67'); // 10 face à 90 / 6 = 15
  assert.equal(avgSize({ v: 12, n: 4 }), 3);
  assert.equal(avgSize({ v: 12, n: 0 }), null);
});

test('delta des gros prints par bougie : achats moins ventes, vide sans gros print', async () => {
  const { bigDeltas } = await import('../shared/barstats.js');
  const MIN = 60_000;
  const items = [0, 1, 2].map((k) => ({ t0: k * MIN, t1: (k + 1) * MIN }));
  const prints = [[10, 100, 30, 1], [20, 100, 12, -1], [2 * MIN + 5, 100, 7, -1]]; // bougie 0 : +18 ; bougie 2 : -7
  assert.deepEqual(bigDeltas(items, prints), [18, null, -7]);
  assert.deepEqual(bigDeltas(items, []), [null, null, null]);
});
