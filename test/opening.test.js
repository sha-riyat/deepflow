// Tests de l'initial balance (extensions) et des types d'ouverture de Dalton.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ibExtensions, ibLevels, openType, openTypeLabel, orbRange, orbStart, orbWindow } from '../shared/opening.js';

const M30 = 1_800_000;
// Session fictive : tranche 1, ouverture `open`, périodes A et B [période, ligne basse, ligne haute, clôture].
function day(open, A, B) {
  const periods = [[0, ...A], [1, ...B]];
  return { t0: 0, bucket: 1, tpoMs: M30, ibN: 2, open, periods, ibLo: Math.min(A[0], B[0]), ibHi: Math.max(A[1], B[1]) };
}

test('IB : niveaux en prix, extensions à 1,5 × et 2 ×, terminée après la première heure', () => {
  const d = day(100, [95, 104, 102], [99, 109, 108]); // IB 95 → 110 (ligne haute 109 incluse)
  const ib = ibLevels(d, 2 * M30);
  assert.deepEqual([ib.lo, ib.hi, ib.range, ib.done], [95, 110, 15, true]);
  assert.equal(ibLevels(d, 2 * M30 - 1).done, false);
  assert.deepEqual(ibExtensions(ib).map((e) => e.price), [117.5, 87.5, 125, 80]);
  assert.equal(ibLevels(null, 0), null);
});

test('types d’ouverture : drive, test-drive, rejection-reverse, auction', () => {
  const t = 2 * M30;
  // Ouverture au bas de l'IB, jamais revenu dessous, clôture en haut : Open-Drive haussier.
  assert.deepEqual(openType(day(100, [99, 105, 105], [104, 109, 109]), t), { type: 'drive', side: 1 });
  // Petit test sous l'ouverture en A, puis départ vers le haut : Open-Test-Drive haussier.
  assert.deepEqual(openType(day(100, [96, 100, 99], [98, 109, 109]), t), { type: 'test', side: 1 });
  // Grosse baisse en A, rejetée, clôture bien au-dessus de l'ouverture : Rejection-Reverse haussier.
  assert.deepEqual(openType(day(100, [90, 100, 92], [92, 106, 106]), t), { type: 'reject', side: 1 });
  // Ouverture au haut de l'IB, chute sans retour : Open-Drive baissier.
  assert.deepEqual(openType(day(100, [94, 100, 95], [90, 96, 91]), t), { type: 'drive', side: -1 });
  // Clôture de l'IB près de l'ouverture : Open-Auction.
  assert.deepEqual(openType(day(100, [96, 104, 101], [97, 103, 100]), t), { type: 'auction', side: 0 });
  assert.equal(openType(day(100, [96, 104, 101], [97, 103, 100]), t - 1), null); // IB pas terminée
  assert.equal(openTypeLabel({ type: 'test', side: -1 }), 'Open-Test-Drive baissier');
  assert.equal(openTypeLabel({ type: 'auction', side: 0 }), 'Open-Auction');
});

test('range d’ouverture : ancres UTC, Londres et New York, week-end, plage de N minutes', () => {
  const utc = (s) => Date.parse(`${s}Z`);
  const wed = utc('2026-07-01T00:00:00'); // mercredi, heure d'été partout
  assert.equal(orbStart(wed, 'utc'), wed);
  assert.equal(orbStart(wed, 'london'), utc('2026-07-01T07:00:00')); // 8 h britanniques = 7 h UTC
  assert.equal(orbStart(wed, 'ny'), utc('2026-07-01T13:30:00'));
  const winter = utc('2026-12-02T00:00:00');
  assert.equal(orbStart(winter, 'london'), utc('2026-12-02T08:00:00'));
  assert.equal(orbStart(winter, 'ny'), utc('2026-12-02T14:30:00'));
  const sat = utc('2026-07-04T00:00:00');
  assert.equal(orbStart(sat, 'ny'), null);
  assert.equal(orbStart(sat, 'london'), null);
  assert.equal(orbStart(sat, 'utc'), sat);
  // Fenêtre : aujourd'hui si l'ouverture est passée, sinon la dernière ouverture (samedi : vendredi).
  assert.deepEqual(orbWindow(utc('2026-07-01T14:00:00'), 'ny', 15), { start: utc('2026-07-01T13:30:00'), end: utc('2026-07-01T13:45:00'), minutes: 15 });
  assert.equal(orbWindow(utc('2026-07-01T10:00:00'), 'ny', 15).start, utc('2026-06-30T13:30:00')); // pas encore ouvert
  assert.equal(orbWindow(utc('2026-07-04T10:00:00'), 'ny', 15).start, utc('2026-07-03T13:30:00')); // samedi
  // Range : seules les bougies qui commencent dans la fenêtre comptent.
  const win = { start: 1000, end: 1900, minutes: 15 };
  const bars = [{ t0: 900, h: 999, l: 1 }, { t0: 1000, h: 105, l: 100 }, { t0: 1300, h: 108, l: 102 }, { t0: 1900, h: 500, l: 2 }];
  const r = orbRange(bars, win, 1500);
  assert.deepEqual([r.hi, r.lo, r.mid, r.range, r.done], [108, 100, 104, 8, false]);
  assert.equal(orbRange(bars, win, 1900).done, true);
  assert.equal(orbRange([], win, 2000), null);
  assert.equal(orbRange(bars, null, 2000), null);
});
