// Tests de l'aimant sur les niveaux (POC, VAH, VAL, LVN, VWAP, hauts et bas de la veille, gros prints).
import test from 'node:test';
import assert from 'node:assert/strict';
import { levelsOf, nearestLevel, snapPoint } from '../shared/magnet.js';

const labels = (list) => list.map((l) => l.label);
const price = (list, label) => list.find((l) => l.label === label)?.price;

test('niveaux : veille, jour, niveaux clés, VWAP du jour, gros prints', () => {
  const prev = { bucket: 10, poc: 100, val: 98, vah: 103, hi: 1100, lo: 900, rows: [] };
  const today = { t0: 1000, bucket: 10, poc: 101, val: 99, vah: 102, open: 1005 };
  const bars = [{ t0: 1000, pv: 2000, v: 2 }, { t0: 2000, pv: 3000, v: 3 }];
  const out = levelsOf({ prev, today, bars, keyLevels: { weekOpen: 950, monthOpen: null }, prints: [[1, 1010, 5, 1], [2, 1020, 5, -1]] });
  assert.equal(price(out, 'POC J-1'), 1005);
  assert.equal(price(out, 'VAH J-1'), 1040);
  assert.equal(price(out, 'VAL J-1'), 980);
  assert.deepEqual([price(out, 'Haut J-1'), price(out, 'Bas J-1')], [1100, 900]);
  assert.equal(price(out, 'POC J'), 1015);
  assert.equal(price(out, 'Ouv. J'), 1005);
  assert.equal(price(out, 'VWAP J'), 1000); // (2000 + 3000) / 5
  assert.equal(price(out, 'Ouv. S'), 950);
  assert.equal(labels(out).includes('Ouv. M'), false); // niveau absent : ignoré
  assert.deepEqual(out.filter((l) => l.label === 'Gros print').map((l) => l.price), [1010, 1020]);
  // VWAP du jour : écarté si les bougies chargées ne remontent pas jusqu'au début du jour
  assert.equal(price(levelsOf({ today, bars: [{ t0: 1500, pv: 5, v: 1 }] }), 'VWAP J'), undefined);
  assert.deepEqual(levelsOf(), []);
  // LVN de la veille : un creux entre deux pics
  const rows = [[10, 5, 5], [11, 6, 6], [12, 7, 7], [13, 1, 1], [14, 0.5, 0.5], [15, 1, 1], [16, 7, 7], [17, 6, 6], [18, 5, 5]];
  const lvn = levelsOf({ prev: { ...prev, rows } }).filter((l) => l.label === 'LVN J-1');
  assert.ok(lvn.length >= 1 && lvn.every((l) => l.price >= 135 && l.price <= 155), JSON.stringify(lvn));
});

test('aimant : niveau le plus proche en pixels, prix OHLC de la bougie, sinon point libre', () => {
  const yOf = (p) => (200 - p) * 4; // 1 de prix = 4 px
  const levels = [{ label: 'POC J-1', price: 150 }, { label: 'VAH J-1', price: 160 }];
  assert.equal(nearestLevel(levels, yOf(151), yOf)?.label, 'POC J-1');
  assert.equal(nearestLevel(levels, yOf(155), yOf, 4), null); // trop loin (20 px)
  const bar = { t0: 60_000, t1: 119_000, o: 100, h: 110, l: 95, c: 105 };
  const pt = { t: 70_000, p: 0 };
  // niveau plus proche que n'importe quel prix de la bougie : collé au niveau, heure du curseur gardée
  assert.deepEqual(snapPoint(null, pt, yOf(151), yOf, { levels }), { t: 70_000, p: 150, label: 'POC J-1' });
  // OHLC plus proche que le niveau : comportement de snapToBar (milieu de la bougie)
  const lv = [{ label: 'X', price: 112 }];
  assert.deepEqual(snapPoint(bar, pt, yOf(109), yOf, { levels: lv, tf: 60_000 }), { t: 90_000, p: 110 });
  // égalité de portée : le prix de la bougie ; le niveau n'est choisi que s'il est strictement plus proche
  assert.deepEqual(snapPoint(bar, pt, yOf(111), yOf, { levels: lv, tf: 60_000 }), { t: 90_000, p: 110 });
  assert.deepEqual(snapPoint(bar, pt, yOf(111.5), yOf, { levels: lv, tf: 60_000 }), { t: 70_000, p: 112, label: 'X' });
  assert.deepEqual(snapPoint(bar, { t: 5, p: 7 }, yOf(50), yOf, { levels }), { t: 5, p: 7 }); // rien à portée
  assert.deepEqual(snapPoint(null, { t: 5, p: 7 }, 0, yOf), { t: 5, p: 7 });
});
