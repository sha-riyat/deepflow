// Tests des dessins : conversions (heure, prix) <-> pixels, test du clic, format sauvegardé.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  indexOfTime, timeOfIndex, toPixel, fromPixel, movePoints, shapeOf, hitTest, distToSegment, parseDrawings, serializeDrawings,
} from '../shared/drawings.js';

// Échelle minimale (mêmes formules que web/lib/chart/scale.js).
function scale(mode) {
  return {
    mode, w: 1000, h: 500, tRight: 100_000, msPerPx: 100, iRight: 10, pxPerBar: 20, pTop: 110, pBottom: 100,
    xOfTime(t) { return this.w - (this.tRight - t) / this.msPerPx; },
    timeOfX(x) { return this.tRight - (this.w - x) * this.msPerPx; },
    xOfIndex(i) { return this.w - (this.iRight - i) * this.pxPerBar; },
    indexOfX(x) { return this.iRight - (this.w - x) / this.pxPerBar; },
    yOfPrice(p) { return ((this.pTop - p) / (this.pTop - this.pBottom)) * this.h; },
    priceOfY(y) { return this.pTop - (y / this.h) * (this.pTop - this.pBottom); },
  };
}

// Bougies d'activité de durées inégales (ticks, renko...).
const bars = [{ t0: 0, t1: 1000 }, { t0: 1000, t1: 4000 }, { t0: 4000, t1: 5000 }];

test('dessins : heure <-> position sur un axe de bougies d’activité, prolongé hors des données', () => {
  assert.equal(indexOfTime(bars, 0), -0.5);
  assert.equal(indexOfTime(bars, 2500), 1); // milieu de la deuxième bougie
  assert.equal(indexOfTime(bars, 5000), 2.5);
  assert.equal(indexOfTime(bars, 5000 + 5000 / 3), 3.5); // une durée moyenne après la fin
  for (const t of [-2000, 0, 700, 1000, 3999, 4500, 9000]) assert.ok(Math.abs(timeOfIndex(bars, indexOfTime(bars, t)) - t) < 1e-6, `t = ${t}`);
});

test('dessins : un point garde sa place quel que soit le mode de l’échelle', () => {
  for (const mode of ['time', 'index']) {
    const s = scale(mode);
    const pt = { t: 2500, p: 104.2 };
    const [x, y] = toPixel(s, bars, pt);
    const back = fromPixel(s, bars, x, y);
    assert.equal(back.t, pt.t);
    assert.ok(Math.abs(back.p - pt.p) < 1e-9);
  }
  const moved = movePoints(scale('time'), bars, [{ t: 50_000, p: 105 }], 10, -50);
  assert.deepEqual(moved, [{ t: 51_000, p: 106 }]); // 10 px = 1 s, -50 px = +1 de prix
});

test('dessins : clic sur une ligne, sur une poignée, à côté', () => {
  assert.equal(distToSegment(5, 3, 0, 0, 10, 0), 3);
  assert.equal(distToSegment(-4, 3, 0, 0, 10, 0), 5); // au-delà de l'extrémité
  const shapes = [shapeOf({ type: 'trend' }, [[0, 0], [100, 100]]), shapeOf({ type: 'trend' }, [[0, 100], [100, 0]])];
  assert.deepEqual(hitTest(shapes, 50, 50), { index: 1, handle: -1 }); // croisement : la plus récente
  assert.deepEqual(hitTest(shapes, 20, 24), { index: 0, handle: -1 });
  assert.equal(hitTest(shapes, 50, 80), null);
  assert.deepEqual(hitTest(shapes, 98, 103, 6, 0), { index: 0, handle: 1 }); // poignée du dessin sélectionné
});

test('dessins : sauvegarde versionnée, lecture tolérante', () => {
  const d = { id: 'a', type: 'trend', pts: [{ t: 1, p: 2 }, { t: 3, p: 4 }], style: { color: '#fff' } };
  const sets = parseDrawings(serializeDrawings({ 'futures:BTCUSDT': [d], 'spot:ETHUSDT': [] }));
  assert.deepEqual(Object.keys(sets), ['futures:BTCUSDT']); // jeux vides non écrits
  assert.equal(sets['futures:BTCUSDT'][0].style.color, '#fff');
  assert.equal(sets['futures:BTCUSDT'][0].style.width, 1.5); // style complété par défaut
  assert.equal(JSON.parse(serializeDrawings(sets)).v, 1);
  const bad = JSON.stringify({ v: 1, sets: { k: [d, { id: 'b', type: 'inconnu', pts: [] }, { ...d, id: 'c', pts: [{ t: 1, p: null }, { t: 1, p: 1 }] }] } });
  assert.deepEqual(parseDrawings(bad).k.map((x) => x.id), ['a']);
  assert.deepEqual(parseDrawings('{pas du json'), {});
  assert.deepEqual(parseDrawings(null), {});
});
