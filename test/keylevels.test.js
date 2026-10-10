// Tests des niveaux clés : ouvertures de la semaine et du mois, hauts et bas précédents.
import test from 'node:test';
import assert from 'node:assert/strict';
import { keyLevels, levelLines } from '../shared/keylevels.js';

const DAY = 86_400_000;
const utc = (s) => Date.parse(`${s}T00:00:00Z`);
// Bougies journalières du 1er septembre au 7 octobre 2026 (mercredi) : prix = jour du mois.
const days = [];
for (let t = utc('2026-09-01'); t <= utc('2026-10-07'); t += DAY) {
  const d = new Date(t).getUTCDate();
  days.push({ t0: t, o: 100 + d, h: 200 + d, l: d });
}

test('niveaux clés : ouvertures, veille, semaine et mois précédents', () => {
  const k = keyLevels(days, utc('2026-10-07'));
  assert.equal(k.dayOpen, 107);
  assert.equal(k.weekOpen, 105); // lundi 5 octobre
  assert.equal(k.monthOpen, 101); // 1er octobre
  assert.deepEqual(k.prevDay, { hi: 206, lo: 6 });
  assert.deepEqual(k.prevWeek, { hi: 230, lo: 1 }); // 28 sept. – 4 oct. : plus haut le 30, plus bas le 1er
  assert.deepEqual(k.prevMonth, { hi: 230, lo: 1 }); // septembre
  assert.deepEqual(k.starts, { week: utc('2026-10-05'), month: utc('2026-10-01') });
});

test('niveaux clés : données manquantes et choix des lignes', () => {
  const k = keyLevels(days.slice(-3), utc('2026-10-07')); // 5, 6, 7 octobre seulement
  assert.equal(k.monthOpen, null);
  assert.equal(k.prevWeek, null);
  assert.deepEqual(levelLines(k).map((l) => l[0]), ['wo', 'dh', 'dl']);
  assert.deepEqual(levelLines(k, 'opens').map((l) => l[0]), ['wo']);
  assert.deepEqual(levelLines(k, 'prev').map((l) => l[1]), ['Haut J-1', 'Bas J-1']);
  assert.deepEqual(levelLines(null), []);
});
