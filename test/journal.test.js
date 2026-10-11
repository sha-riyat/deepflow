// Tests du journal de trading : résultat en R, statistiques, export CSV.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bySource, breakEvenWinRate, breakdown, edgeStats, equityCurve, errorCosts, longestLosingStreak, maxDrawdown } from '../shared/journalstats.js';
import { SETUPS, cleanEntry, entrySnapshot, excursions, journalStats, plannedRR, toCsv, tradeR } from '../shared/journal.js';

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
  assert.equal(head, 'date;symbole;marché;sens;entrée;stop;cible;sortie;R;setup;notes;note;erreurs;MAE;MFE;replay');
  assert.equal(row, '1970-01-01T00:00:00.000Z;BTCUSDT;futures;long;100;99;;102;2.00;Rejet VAH;"a;b ""c""";;;;;');
  assert.ok(toCsv([e({ t: 0, entry: 100, stop: 99, grade: 'A' })]).endsWith(';A;;;;'));
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
  assert.ok(toCsv([list[1]]).endsWith('Hors plan (sans zone ni confirmation) + Hors de mes heures;;;'));
});

test('journal : instantané de la bougie au moment de la saisie', () => {
  const H = 3_600_000;
  const day = Date.UTC(2026, 9, 8); // jeudi : heure d'été américaine (UTC − 4), séance New York 12 h – 21 h UTC
  // 25 bougies d'une heure de 100 de volume, la dernière de 300 (achats 200, ventes 100)
  const bars = Array.from({ length: 25 }, (_, i) => ({ t0: day - 12 * H + i * H, v: 100, b: 50, s: 50 }));
  bars[24] = { t0: day + 12 * H, v: 300, b: 200, s: 100 };
  const t = day + 13 * H + 45 * 60_000; // 13:45 UTC
  assert.equal(entrySnapshot(bars, day + 12 * H + 1000)?.utc, '12:00');
  const s = entrySnapshot(bars, day + 12 * H + 30 * 60_000);
  assert.deepEqual([s.volume, s.utc, s.ny, s.session], [300, '12:30', '08:30', 'ny']);
  assert.ok(Math.abs(s.deltaPct - (100 / 300) * 100) < 1e-9);
  assert.equal(s.relVolume, 3); // 300 / moyenne 100 des 20 précédentes
  assert.equal(entrySnapshot(bars, day - 100 * H), null); // avant les bougies chargées
  assert.equal(entrySnapshot([], t), null);
  // heure d'hiver : UTC − 5
  const winter = Date.UTC(2026, 11, 3, 15, 10);
  assert.equal(entrySnapshot([{ t0: winter - 60_000, v: 1, b: 1, s: 0 }], winter)?.ny, '10:10');
  // stockage : instantané valide gardé, champs invalides écartés
  assert.deepEqual(e({ snap: s }).snap, s);
  assert.equal(e({ snap: { utc: 'abc' } }).snap, null);
  assert.equal(e({ snap: { utc: '09:30', volume: 'x', session: 'mars' } }).snap.volume, null);
  assert.equal(e({}).snap, null);
});

test('journal : excursions MAE / MFE en R entre l’entrée et la sortie', () => {
  const bars = [
    { t0: 0, t1: 60, h: 101, l: 99.5 }, // avant l'entrée : ignorée
    { t0: 60, t1: 120, h: 102, l: 99.2 }, // le prix recule à 99,2 (−0,8 R pour un stop à 99)
    { t0: 120, t1: 180, h: 103, l: 100.5 }, // monte à 103 (+3 R)
    { t0: 180, t1: 240, h: 110, l: 90 }, // après la sortie : ignorée
  ];
  const long = e({ side: 'long', entry: 100, stop: 99, exit: 102, tIn: 60, tOut: 180 });
  const x = excursions(long, bars);
  assert.ok(Math.abs(x.mae - 0.8) < 1e-9 && Math.abs(x.mfe - 3) < 1e-9);
  // court : miroir
  const short = e({ side: 'short', entry: 100, stop: 101, exit: 98, tIn: 60, tOut: 180 });
  const y = excursions(short, [{ t0: 0, t1: 60, h: 100, l: 100 }, { t0: 60, t1: 180, h: 100.4, l: 97 }]);
  assert.ok(Math.abs(y.mae - 0.4) < 1e-9 && Math.abs(y.mfe - 3) < 1e-9);
  // jamais négatif : le prix n'est jamais allé contre l'entrée
  assert.equal(excursions(long, [{ t0: 0, t1: 200, h: 105, l: 100 }]).mae, 0);
  // sans heures, sans sortie, sortie avant l'entrée, bougies qui ne couvrent pas le début : null
  assert.equal(excursions(e({ entry: 100, stop: 99, exit: 102 }), bars), null);
  assert.equal(excursions(e({ entry: 100, stop: 99, tIn: 60, tOut: 180 }), bars), null);
  assert.equal(excursions({ ...long, tOut: 30 }, bars), null);
  assert.equal(excursions({ ...long, tIn: -10 }, bars), null);
  assert.equal(excursions(long, []), null);
  assert.deepEqual(e({ tIn: '5', mae: 'x' }).tIn, 5);
  assert.equal(e({ mae: 'x' }).mae, null);
});

test('journal : courbe de capital en R, repli maximal, série de pertes, équilibre taux × payoff', () => {
  const T = (t, exit) => e({ entry: 100, stop: 99, exit, t }); // exit 102 : +2 R, 99 : −1 R, 100 : 0 R
  const list = [T(5, 99), T(1, 102), T(2, 99), T(3, 99), T(4, 102), T(6, 99), T(7, 100)];
  // par date : +2, −1, −1, +2, −1 (t = 5), −1 (t = 6), 0 (t = 7)
  const curve = equityCurve(list);
  assert.deepEqual(curve.map((p) => p.r), [2, -1, -1, 2, -1, -1, 0]);
  assert.deepEqual(curve.map((p) => p.cum), [2, 1, 0, 2, 1, 0, 0]);
  assert.equal(maxDrawdown(curve), 2); // de 2 à 0
  assert.equal(longestLosingStreak(list), 2);
  assert.equal(maxDrawdown([]), 0);
  assert.equal(longestLosingStreak([]), 0);
  assert.equal(longestLosingStreak([T(1, 99), T(2, 100), T(3, 99)]), 1); // un trade à 0 R rompt la série
  // l'heure de sortie prime sur l'heure de saisie
  assert.deepEqual(equityCurve([e({ entry: 100, stop: 99, exit: 102, t: 9, tOut: 1 }), T(5, 99)]).map((p) => p.r), [2, -1]);
  assert.equal(equityCurve([e({ entry: 100, stop: 99 })]).length, 0); // ouvert : ignoré
  // taux de réussite et payoff
  const s = edgeStats([T(1, 102), T(2, 104), T(3, 99), T(4, 99), T(5, 99), T(6, 99)]); // 2 gains de +2 et +4, 4 pertes de −1
  assert.deepEqual([s.trades, s.winRate, s.avgWin, s.avgLoss, s.payoff], [6, 1 / 3, 3, 1, 3]);
  assert.equal(s.breakEven, 0.25);
  assert.equal(breakEvenWinRate(2), 1 / 3);
  assert.deepEqual(edgeStats([T(1, 102)]), { trades: 1, winRate: 1, avgWin: 2, avgLoss: null, payoff: null, breakEven: null });
  assert.equal(edgeStats([]).winRate, null);
});

test('journal : ventilation par setup, note, heure, jour et séparation replay / réel', () => {
  const H = 3_600_000;
  const mon = Date.UTC(2026, 9, 5); // lundi
  const T = (o) => e({ entry: 100, stop: 99, ...o });
  const list = [
    T({ tIn: mon + 9 * H, exit: 102, setup: 'Absorption', grade: 'A' }), // +2, lundi 09 h
    T({ tIn: mon + 9 * H + 600_000, exit: 99, setup: 'Absorption', grade: 'B' }), // −1, lundi 09 h
    T({ tIn: mon + 86_400_000 + 14 * H, exit: 99, setup: 'Cassure', grade: 'A' }), // −1, mardi 14 h
    T({ tIn: mon + 2 * 86_400_000 + 14 * H, exit: 103 }), // +3, mercredi 14 h, sans setup ni note
    T({ tIn: mon, setup: 'Absorption' }), // ouvert : ignoré
  ];
  const by = (dim) => breakdown(list, dim).map((r) => [r.key, r.trades, r.totalR]);
  assert.deepEqual(by('setup'), [['(sans setup)', 1, 3], ['Absorption', 2, 1], ['Cassure', 1, -1]]); // du plus gagnant au plus perdant
  assert.deepEqual(by('grade'), [['A', 2, 1], ['B', 1, -1], ['(sans note)', 1, 3]]);
  assert.deepEqual(by('hour'), [['09 h UTC', 2, 1], ['14 h UTC', 2, 2]]);
  assert.deepEqual(by('weekday'), [['lundi', 2, 1], ['mardi', 1, -1], ['mercredi', 1, 3]]);
  const abs = breakdown(list, 'setup').find((r) => r.key === 'Absorption');
  assert.deepEqual([abs.wins, abs.winRate, abs.avgR], [1, 0.5, 0.5]);
  assert.deepEqual(breakdown(list, 'inconnue'), []);
  assert.deepEqual(breakdown([], 'setup'), []);
  // dimanche passe en dernier dans la semaine
  assert.deepEqual(breakdown([T({ tIn: mon - 86_400_000, exit: 102 }), T({ tIn: mon, exit: 102 })], 'weekday').map((r) => r.key), ['lundi', 'dimanche']);
  // replay / réel
  const mixed = [T({ exit: 102, replay: true }), T({ exit: 99 }), T({ exit: 103, replay: true })];
  assert.equal(bySource(mixed, 'replay').length, 2);
  assert.equal(bySource(mixed, 'real').length, 1);
  assert.equal(bySource(mixed, 'all').length, 3);
  assert.equal(e({}).replay, false);
  assert.equal(e({ replay: 'oui' }).replay, false); // seulement un vrai booléen
});
