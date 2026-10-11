// Tests du journal de trading : résultat en R, statistiques, export CSV.
import test from 'node:test';
import assert from 'node:assert/strict';
import { errorCosts } from '../shared/journalstats.js';
import { SETUPS, cleanEntry, journalStats, plannedRR, toCsv, tradeR } from '../shared/journal.js';

const e = (o) => cleanEntry({ id: Math.random().toString(36), symbol: 'btcusdt', ...o });

test('journal : entrée vérifiée', () => {
  const x = e({ side: 'short', entry: '100', stop: 'x', shot: 'javascript:alert(1)', notes: 'n'.repeat(5000) });
  assert.equal(x.symbol, 'BTCUSDT');
  assert.equal(x.side, 'short');
  assert.deepEqual([x.entry, x.stop, x.shot], [100, null, null]);
  assert.equal(x.notes.length, 2000);
  assert.equal(cleanEntry({ id: 'a' }), null); // sans symbole
  assert.equal(e({ grade: 'B' }).grade, 'B');
  assert.equal(e({ grade: 'Z' }).grade, null); // note inconnue : ignorée
  assert.equal(e({}).grade, null);
  assert.ok(SETUPS.length >= 10 && new Set(SETUPS).size === SETUPS.length);
  assert.equal(cleanEntry(null), null);
});

test('journal : résultat en R et R:R prévu', () => {
  assert.equal(tradeR(e({ side: 'long', entry: 100, stop: 98, exit: 104 })), 2);
  assert.equal(tradeR(e({ side: 'short', entry: 100, stop: 102, exit: 102 })), -1);
  assert.equal(tradeR(e({ side: 'long', entry: 100, stop: 98 })), null); // pas encore clôturé
  assert.equal(tradeR(e({ side: 'long', entry: 100, stop: 101, exit: 103 })), null); // stop du mauvais côté
  assert.equal(plannedRR(e({ side: 'short', entry: 100, stop: 101, target: 97 })), 3);
  assert.equal(plannedRR(e({ side: 'long', entry: 100, stop: 99, target: 99.5 })), null);
});

test('journal : statistiques en R', () => {
  const list = [
    e({ entry: 100, stop: 99, exit: 102 }), // +2
    e({ entry: 100, stop: 99, exit: 99 }), // −1
    e({ entry: 100, stop: 99, exit: 101.5 }), // +1,5
    e({ entry: 100, stop: 99 }), // ouvert
  ];
  const s = journalStats(list);
  assert.deepEqual([s.trades, s.open, s.wins], [3, 1, 2]);
  assert.equal(s.winRate, 2 / 3);
  assert.equal(s.totalR, 2.5);
  assert.equal(s.avgR, 2.5 / 3);
  assert.equal(s.profitFactor, 3.5);
  assert.deepEqual(journalStats([]), { trades: 0, open: 0, wins: 0, winRate: null, avgR: null, totalR: 0, profitFactor: null });
});

test('journal : export CSV', () => {
  const csv = toCsv([e({ t: 0, entry: 100, stop: 99, exit: 102, setup: 'Rejet VAH', notes: 'a;b "c"' })]);
  const [head, row] = csv.split('\n');
  assert.equal(head, 'date;symbole;marché;sens;entrée;stop;cible;sortie;R;setup;notes;note;erreurs');
  assert.equal(row, '1970-01-01T00:00:00.000Z;BTCUSDT;futures;long;100;99;;102;2.00;Rejet VAH;"a;b ""c""";;');
  assert.ok(toCsv([e({ t: 0, entry: 100, stop: 99, grade: 'A' })]).endsWith(';A;'));
});

test('journal : étiquettes d’erreur et coût cumulé en R', () => {
  assert.deepEqual(e({ errors: ['hors_plan', 'inconnue', 'hors_plan', 'hors_horaire'] }).errors, ['hors_plan', 'hors_horaire']);
  assert.deepEqual(e({}).errors, []);
  const list = [
    e({ entry: 100, stop: 99, exit: 99, errors: ['hors_plan'] }), // −1
    e({ entry: 100, stop: 99, exit: 99, errors: ['hors_plan', 'hors_horaire'] }), // −1
    e({ entry: 100, stop: 99, exit: 100.5, errors: ['hors_horaire'] }), // +0,5
    e({ entry: 100, stop: 99, exit: 103 }), // +3 sans erreur
    e({ entry: 100, stop: 99, errors: ['hors_plan'] }), // ouvert : ignoré
  ];
  const c = errorCosts(list);
  assert.deepEqual(c.rows.map((r) => [r.key, r.count, r.totalR]), [['hors_plan', 2, -2], ['hors_horaire', 2, -0.5]]);
  assert.equal(c.rows[0].avgR, -1);
  assert.deepEqual(c.clean, { count: 1, totalR: 3, avgR: 3 });
  assert.deepEqual(errorCosts([]), { rows: [], clean: { count: 0, totalR: 0, avgR: null } });
  assert.ok(toCsv([list[1]]).endsWith('Hors plan (sans zone ni confirmation) + Hors de mes heures'));
});
