// Tests des repères horaires : ouverture de New York (heure d'été) et heures de financement.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMarkers, nyOpen, timeMarkers, usDst } from '../shared/sessions.js';

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
});
