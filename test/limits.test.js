// Tests des garde-fous : fenêtres horaires (heure d'été / d'hiver) et limites de risque.
import test from 'node:test';
import assert from 'node:assert/strict';
import { activeWindow, riskGate } from '../server/engine/limits.js';

const WINDOWS = [
  { name: 'Londres', tz: 'Europe/London', from: '08:00', to: '11:00' },
  { name: 'New York', tz: 'America/New_York', from: '09:30', to: '12:30' },
];

test('fenêtres : Londres 07:00 UTC en été, 08:00 UTC en hiver ; New York 13:30 / 14:30 UTC', () => {
  // Jeudi 8 octobre 2026 (heure d'été) et jeudi 5 novembre 2026 (heure d'hiver des deux côtés).
  assert.equal(activeWindow(Date.UTC(2026, 9, 8, 7, 0), WINDOWS)?.name, 'Londres');
  assert.equal(activeWindow(Date.UTC(2026, 10, 5, 7, 0), WINDOWS), null);
  assert.equal(activeWindow(Date.UTC(2026, 10, 5, 8, 0), WINDOWS)?.name, 'Londres');
  assert.equal(activeWindow(Date.UTC(2026, 9, 8, 13, 30), WINDOWS)?.name, 'New York');
  assert.equal(activeWindow(Date.UTC(2026, 10, 5, 13, 30), WINDOWS), null);
  assert.equal(activeWindow(Date.UTC(2026, 10, 5, 14, 30), WINDOWS)?.name, 'New York');
  assert.equal(activeWindow(Date.UTC(2026, 9, 10, 8, 0), WINDOWS), null); // samedi
});

test('limites : 2 trades ou 2 pertes par jour, -1 % / jour, -3 % / semaine, -6 % / mois', () => {
  const risk = { equity: 1000, limits: { tradesPerDay: 2, lossesPerDay: 2, dayPct: 1, weekPct: 3, monthPct: 6 } };
  const t = Date.UTC(2026, 9, 8, 14, 0); // jeudi
  const trade = (dt, R, pnl) => ({ t: t - dt, resultR: R, pnlUsd: pnl });
  assert.equal(riskGate([], null, t, risk), null);
  assert.match(riskGate([], { id: 1 }, t, risk), /déjà en cours/);
  assert.match(riskGate([trade(3600e3, 1, 5), trade(1800e3, 1, 5)], null, t, risk), /2 trades/);
  assert.match(riskGate([trade(3600e3, -1, -11)], null, t, risk), /perte du jour/);
  assert.match(riskGate([trade(2 * 86_400_000, -1, -31)], null, t, risk), /semaine/);
  assert.match(riskGate([trade(4 * 86_400_000, -1, -61)], null, t, risk), /mois/); // dimanche 4 : semaine précédente, même mois
});
