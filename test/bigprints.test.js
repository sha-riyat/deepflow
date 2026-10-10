import test from 'node:test';
import assert from 'node:assert/strict';
import { bySession, groupBigPrints } from '../shared/bigprints.js';

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

test('suite d’un gros print : le prix avance, ou le gros ordre est absorbé', async () => {
  const { printFollow } = await import('../shared/bigprints.js');
  const bar = (k, h, l, c) => ({ t0: k * 5 * MIN, t1: (k + 1) * 5 * MIN, h, l, c });
  // Bougie 0 : achat de 20 à 100. Ensuite le prix monte à 100,3 (suite) ou reste sous 100,02 (absorbé).
  const up = [bar(0, 100.1, 99.9, 100), bar(1, 100.3, 100, 100.2), bar(2, 100.2, 100.1, 100.1), bar(3, 100.2, 100, 100.1), bar(4, 100, 100, 100)];
  const flat = [bar(0, 100.1, 99.9, 99.95), bar(1, 100.02, 99.9, 100), bar(2, 100.01, 99.9, 99.9), bar(3, 100, 99.8, 99.9), bar(4, 100, 100, 100)];
  const buy = [10, 100, 20, 1, 1, 0];
  assert.equal(printFollow(buy, up, { bars: 3, move: 0.5 }), 'follow'); // +0,3 ≥ ½ × 0,2 (amplitude moyenne)
  assert.equal(printFollow(buy, flat, { bars: 3, move: 0.5 }), 'absorbed'); // +0,02 < ½ × 0,2
  // Vente : le prix doit baisser.
  assert.equal(printFollow([10, 100, 20, -1, 1, 0], flat, { bars: 3, move: 0.5 }), 'follow'); // bas à 99,8 : -0,2
  assert.equal(printFollow([10, 100, 20, -1, 1, 0], up, { bars: 3, move: 0.5 }), 'absorbed');
  // Fenêtre pas terminée (la dernière bougie est peut-être ouverte) ou hors bougies : pas de jugement.
  assert.equal(printFollow(buy, up.slice(0, 3), { bars: 3 }), null);
  assert.equal(printFollow([10, 100, 20, 1, 1, -1], up, { bars: 3 }), null);
  assert.equal(printFollow(buy, up, { bars: 0 }), null);
});

test('seuil par session : plus bas en Asie, plus haut à New York', () => {
  const day = Date.parse('2026-10-09T00:00:00Z'); // vendredi, heure d'été
  const h = (hh) => day + hh * 3_600_000;
  // Ordres de 40 000 $ (400 × 100) : au seuil de base de 50 000 $, seul l'Asie (seuil 25 000 $) les garde.
  const prints = [[h(3), 100, 400, 1], [h(9), 100, 400, 1], [h(13), 100, 400, 1], [h(22), 100, 400, -1]];
  assert.deepEqual(bySession(prints, 50_000).map((p) => p[0]), [h(3), h(22)]); // Asie ×0,5 et hors session ×0,5
  // Un ordre de 120 000 $ passe partout, même à New York (seuil 100 000 $).
  assert.equal(bySession([[h(14), 100, 1200, 1]], 50_000).length, 1);
  assert.equal(bySession([[h(14), 100, 900, 1]], 50_000).length, 0); // 90 000 $ < 100 000 $
});

test('suite d’un gros print : le seuil suit l’amplitude des bougies de l’unité de temps', async () => {
  const { avgRange, printFollow } = await import('../shared/bigprints.js');
  const flat = { h: 100, l: 100, c: 100 };
  assert.equal(avgRange([{ h: 12, l: 2 }, { h: 6, l: 2 }, { h: 5, l: 1 }], 2), 6); // (10 + 4 + 4) / 3
  // Achat à 100 dans une bougie d'amplitude `range` ; la bougie suivante monte de 5.
  const follow = (range) => {
    const bars = [{ ...flat, h: 100 + range / 2, l: 100 - range / 2 }, { ...flat, h: 105 }, flat, flat, flat].map((b, k) => ({ ...b, t0: k * MIN, t1: (k + 1) * MIN }));
    return printFollow([10, 100, 20, 1, 1, 0], bars, { bars: 3, move: 0.5 });
  };
  assert.equal(follow(4), 'follow'); // +5 ≥ ½ × 4 : sur de petites bougies, le prix a bien suivi
  assert.equal(follow(40), 'absorbed'); // +5 < ½ × 40 : sur de grandes bougies, ce n'est pas une vraie avancée
});

test('au plus k gros prints par bougie : les plus gros restent, les autres bougies sont épargnées', async () => {
  const { topPerBar } = await import('../shared/bigprints.js');
  // [t, prix, quantité, côté, nombre, index de bougie] : la bougie 0 en porte 4, la bougie 1 en porte 1.
  const groups = [[0, 100, 5, 1, 1, 0], [0, 101, 9, -1, 1, 0], [0, 102, 7, 1, 1, 0], [0, 103, 3, 1, 1, 0], [9, 100, 4, 1, 1, 1]];
  const out = topPerBar(groups, 2);
  assert.deepEqual(out.map((g) => g[2]), [9, 7, 4]); // 9 et 7 pour la bougie 0, 4 pour la bougie 1 ; trié par taille
  assert.equal(topPerBar(groups, 0).length, 5); // sans plafond : tous
  assert.equal(topPerBar([[0, 100, 5, 1, 1, -1], [0, 100, 6, 1, 1, -1]], 1).length, 2); // hors bougies : gardés
});
