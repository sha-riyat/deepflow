// Tests de la fiche hebdomadaire : clé de semaine, vérification des champs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BIASES, cleanSheet, emptySheet, isEmptySheet, weekKey } from '../shared/weeksheet.js';

test('fiche hebdomadaire : une fiche par semaine UTC (lundi 00:00)', () => {
  const mon = Date.UTC(2026, 9, 5);
  assert.equal(weekKey(mon), mon);
  assert.equal(weekKey(mon + 6 * 86_400_000 + 86_399_000), mon); // dimanche soir : encore la même semaine
  assert.equal(weekKey(mon + 7 * 86_400_000), mon + 7 * 86_400_000);
  assert.equal(weekKey(mon - 1), mon - 7 * 86_400_000);
});

test('fiche hebdomadaire : champs vérifiés et bornés', () => {
  assert.deepEqual(cleanSheet(null), emptySheet());
  assert.deepEqual(cleanSheet('abc'), emptySheet());
  const s = cleanSheet({ bias: 'bull', bull: 'x'.repeat(2000), bear: 5, data: 'CPI jeudi', evil: 'ignoré' });
  assert.equal(s.bias, 'bull');
  assert.equal(s.bull.length, 600);
  assert.equal(s.bear, ''); // pas un texte
  assert.equal(s.data, 'CPI jeudi');
  assert.equal('evil' in s, false);
  assert.equal(cleanSheet({ bias: 'inconnu' }).bias, 'none');
  assert.deepEqual(Object.keys(BIASES), ['none', 'bull', 'bear', 'range']);
  assert.equal(isEmptySheet(emptySheet()), true);
  assert.equal(isEmptySheet(cleanSheet({ bias: 'bear' })), false);
  assert.equal(isEmptySheet(cleanSheet({ review: 'a' })), false);
});
