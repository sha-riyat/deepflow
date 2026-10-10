// Tests des repères horaires : ouverture de New York (heure d'été), heures de financement, périodes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMarkers, nyOpen, periodEnd, periodStart, timeMarkers, usDst } from '../shared/sessions.js';

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
