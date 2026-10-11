// Tests des repères horaires : ouverture de New York (heure d'été), heures de financement, périodes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  marketSessions, nextMarkers, nyOpen, periodEnd, periodStart, sessionAt, sessionRanges, sessionSegments, timeMarkers, ukDst, usDst,
} from '../shared/sessions.js';

const utc = (s) => Date.parse(`${s}Z`);

test('ouverture de New York : 13 h 30 UTC en été, 14 h 30 en hiver, rien le week-end', () => {
  assert.equal(nyOpen(utc('2026-10-09T00:00:00')), utc('2026-10-09T13:30:00')); // vendredi, heure d'été
  assert.equal(nyOpen(utc('2026-12-01T05:00:00')), utc('2026-12-01T14:30:00')); // mardi, heure d'hiver
  assert.equal(nyOpen(utc('2026-10-10T00:00:00')), null); // samedi
  // Changements d'heure 2026 : dimanche 8 mars et dimanche 1er novembre.
  assert.equal(usDst(utc('2026-03-06T00:00:00')), false);
  assert.equal(usDst(utc('2026-03-09T00:00:00')), true);
  assert.equal(usDst(utc('2026-10-30T00:00:00')), true);
  assert.equal(usDst(utc('2026-11-02T00:00:00')), false);
});

test('repères d’une plage et prochains repères', () => {
  const list = timeMarkers(utc('2026-10-09T06:00:00'), utc('2026-10-10T09:00:00'));
  assert.deepEqual(list.map((m) => `${new Date(m.t).toISOString().slice(8, 16)} ${m.kind}`), [
    '09T08:00 funding', '09T13:30 ny', '09T16:00 funding', '10T00:00 funding', '10T08:00 funding',
  ]);
  assert.deepEqual(timeMarkers(utc('2026-10-09T00:00:00'), utc('2026-10-09T23:00:00'), { funding: false }).length, 1);
  const next = nextMarkers(utc('2026-10-10T09:00:00')); // samedi matin
  assert.equal(next.funding, utc('2026-10-10T16:00:00'));
  assert.equal(next.ny, utc('2026-10-12T13:30:00')); // lundi
  assert.equal(nextMarkers(utc('2026-10-09T16:00:00')).funding, utc('2026-10-10T00:00:00')); // à l'heure pile : le suivant
});

test('périodes UTC : jour, semaine (lundi), mois', () => {
  const t = utc('2026-10-10T15:42:00'); // samedi
  assert.equal(periodStart(t), utc('2026-10-10T00:00:00'));
  assert.equal(periodStart(t, 'week'), utc('2026-10-05T00:00:00')); // lundi
  assert.equal(periodStart(utc('2026-10-05T00:00:00'), 'week'), utc('2026-10-05T00:00:00'));
  assert.equal(periodStart(utc('2026-10-04T23:59:00'), 'week'), utc('2026-09-28T00:00:00')); // dimanche : semaine d'avant
  assert.equal(periodStart(t, 'month'), utc('2026-10-01T00:00:00'));
  assert.equal(periodEnd(t), utc('2026-10-11T00:00:00'));
  assert.equal(periodEnd(t, 'week'), utc('2026-10-12T00:00:00'));
  assert.equal(periodEnd(utc('2026-12-31T10:00:00'), 'month'), utc('2027-01-01T00:00:00'));
});

test('sessions Asie / Londres / New York : heures d’été, week-end exclu', () => {
  // 2026 : heure d'été britannique du 29 mars au 25 octobre, américaine du 8 mars au 1er novembre.
  assert.equal(ukDst(utc('2026-03-28T00:00:00')), false);
  assert.equal(ukDst(utc('2026-03-29T00:00:00')), true);
  assert.equal(ukDst(utc('2026-10-25T00:00:00')), false);
  const h = (s) => [s.kind, new Date(s.t0).toISOString().slice(11, 16), new Date(s.t1).toISOString().slice(11, 16)];
  const july = marketSessions(utc('2026-07-01T00:00:00'), utc('2026-07-01T23:59:00')); // mercredi
  assert.deepEqual(july.map(h), [['asia', '00:00', '09:00'], ['london', '07:00', '16:00'], ['ny', '12:00', '21:00']]);
  // Entre les deux changements d'heure (27 octobre) : Londres à l'heure d'hiver, New York encore en été.
  const gap = marketSessions(utc('2026-10-27T00:00:00'), utc('2026-10-27T23:59:00'));
  assert.deepEqual(gap.map(h).slice(1), [['london', '08:00', '17:00'], ['ny', '12:00', '21:00']]);
  assert.deepEqual(marketSessions(utc('2026-10-10T00:00:00'), utc('2026-10-11T23:00:00')), []); // samedi, dimanche
  assert.deepEqual(marketSessions(utc('2026-07-01T10:00:00'), utc('2026-07-01T11:00:00'), ['london', 'asia']).map((s) => s.kind), ['london']);
});

test('sessions : plus haut et plus bas d’après les bougies qui y commencent', () => {
  const H = 3_600_000;
  const d = utc('2026-07-01T00:00:00');
  const bars = Array.from({ length: 24 }, (_, i) => ({ t0: d + i * H, h: 100 + i, l: 50 - i }));
  const list = marketSessions(d, d + 23 * H);
  const r = sessionRanges(bars, list, d + 15 * H);
  assert.deepEqual(r.map((s) => [s.kind, s.hi, s.lo, s.done]), [['asia', 108, 42, true], ['london', 115, 35, false], ['ny', 120, 30, false]]);
  assert.deepEqual(sessionRanges([], list, d), []);
});

test('session d’un instant : New York prime sur Londres, heures d’été suivies, week-end hors session', () => {
  // Vendredi 2026-10-09 (heure d'été britannique et américaine) : Londres 7–16, New York 12–21 UTC.
  assert.equal(sessionAt(utc('2026-10-09T03:00:00')), 'asia');
  assert.equal(sessionAt(utc('2026-10-09T09:00:00')), 'london');
  assert.equal(sessionAt(utc('2026-10-09T13:00:00')), 'ny'); // chevauchement Londres / New York
  assert.equal(sessionAt(utc('2026-10-09T21:30:00')), 'off');
  // Mardi 2026-12-01 (hiver) : Londres 8–17, New York 13–22 UTC.
  assert.equal(sessionAt(utc('2026-12-01T12:30:00')), 'london');
  assert.equal(sessionAt(utc('2026-12-01T13:00:00')), 'ny');
  assert.equal(sessionAt(utc('2026-10-10T14:00:00')), 'off'); // samedi
});

test('séances sans chevauchement : la séance qui ouvre le plus tard l’emporte, rien le week-end', () => {
  const H = 3_600_000;
  const day = Date.UTC(2026, 9, 8); // jeudi : Londres 7 h – 16 h, New York 12 h – 21 h (heure d'été des deux côtés)
  const seg = (d, list) => list.map(([kind, a, b]) => ({ kind, t0: d + a * H, t1: d + b * H }));
  assert.deepEqual(sessionSegments(day, day + 86_399_000), seg(day, [['asia', 0, 7], ['london', 7, 12], ['ny', 12, 21]]));
  const winter = Date.UTC(2026, 11, 3); // jeudi : Londres 8 h – 17 h, New York 13 h – 22 h
  assert.deepEqual(sessionSegments(winter, winter + 86_399_000), seg(winter, [['asia', 0, 8], ['london', 8, 13], ['ny', 13, 22]]));
  assert.deepEqual(sessionSegments(Date.UTC(2026, 9, 10), Date.UTC(2026, 9, 11, 23)), []); // samedi et dimanche
  // plage qui coupe : seules les séances qui touchent [from, to]
  const part = sessionSegments(day + 13 * H, day + 14 * H);
  assert.deepEqual(part.map((s) => s.kind), ['ny']);
  // chaque instant d'une séance est bien attribué à cette séance par sessionAt
  for (const s of sessionSegments(day, day + 5 * 86_400_000)) assert.equal(sessionAt((s.t0 + s.t1) / 2), s.kind);
});
