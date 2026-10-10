import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../server/config.js';
import { Flow } from '../server/flow.js';

const DAY = 86_400_000;
const day = 20_000 * DAY;

// Carnet de 21 tranches de 1 autour de 100 (r0 = 90) : 5 par niveau, mur de 100 au bid à 95.
function frame(t, tr) {
  const b = Array.from({ length: 21 }, (_, i) => (i <= 10 ? 5 : 0));
  const a = Array.from({ length: 21 }, (_, i) => (i >= 10 ? 5 : 0));
  b[5] = 100;
  return { t, bid: 100, ask: 100.5, r0: 90, b, a, tr, liq: [] };
}

test('flux : CVD, delta, VWAP du jour (remis à zéro à minuit), déséquilibre et mur', () => {
  const flow = new Flow(config.flow, 1, config.flow.deltaWinMs);
  let an = flow.update(frame(day + 1000, [[100, 2, 1, day + 1000], [101, 1, -1, day + 1000]]));
  assert.equal(an.cvd, 1);
  assert.equal(an.delta, 1);
  assert.equal(an.vwap, Math.round(((100 * 2 + 101) / 3) * 100) / 100);
  assert.ok(an.imb > 0, 'carnet plus chargé au bid');
  for (let t = 2000; t <= 12_000; t += 1000) an = flow.update(frame(day + t, []));
  assert.deepEqual(an.walls.map(([price, q, side]) => [price, q, side]), [[95, 100, 1]]);
  // Nouveau jour : le VWAP repart de zéro, le CVD continue.
  an = flow.update(frame(day + DAY, [[110, 1, -1, day + DAY]]));
  assert.equal(an.vwap, 110);
  assert.equal(an.cvd, 0);
});
