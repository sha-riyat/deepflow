// Tests de « mes heures de trading » (heure locale : les attentes sont construites en heure locale,
// elles valent donc quel que soit le fuseau de la machine).
import test from 'node:test';
import assert from 'node:assert/strict';
import { inTradingHours, outsideWindows, tradingWindows } from '../shared/hours.js';

const at = (d, h) => new Date(2026, 9, d, h).getTime(); // octobre 2026, heure locale

test('mes heures : plage dans la journée, hors plage à griser', () => {
  assert.deepEqual(tradingWindows(at(8, 0), at(9, 0), 14, 18), [[at(8, 14), at(8, 18)]]);
  assert.deepEqual(outsideWindows(at(8, 0), at(9, 0), 14, 18), [[at(8, 0), at(8, 14)], [at(8, 18), at(9, 0)]]);
  // vue qui commence et finit à l'intérieur de la plage : rien avant, rien après
  assert.deepEqual(outsideWindows(at(8, 15), at(8, 17), 14, 18), []);
  // vue sur plusieurs jours : un trou par nuit
  assert.deepEqual(outsideWindows(at(8, 12), at(10, 12), 14, 18), [
    [at(8, 12), at(8, 14)], [at(8, 18), at(9, 14)], [at(9, 18), at(10, 12)],
  ]);
});

test('mes heures : plage qui passe minuit (22 h → 2 h)', () => {
  assert.deepEqual(outsideWindows(at(8, 0), at(9, 0), 22, 2), [[at(8, 2), at(8, 22)]]);
  assert.deepEqual(outsideWindows(at(8, 20), at(9, 3), 22, 2), [[at(8, 20), at(8, 22)], [at(9, 2), at(9, 3)]]);
});

test('mes heures : début = fin → pas de grisé ; inTradingHours', () => {
  assert.deepEqual(outsideWindows(at(8, 0), at(9, 0), 9, 9), []);
  assert.equal(inTradingHours(at(8, 12), 9, 9), true);
  assert.equal(inTradingHours(at(8, 14), 14, 18), true);
  assert.equal(inTradingHours(at(8, 18), 14, 18), false); // la fin est exclue
  assert.equal(inTradingHours(at(8, 13), 14, 18), false);
  assert.equal(inTradingHours(at(9, 1), 22, 2), true);
});
