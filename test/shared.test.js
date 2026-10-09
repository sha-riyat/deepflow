// Tests des briques partagées : tous les types de bougies, footprint, transformations, profils.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BarBuilder, footprintStats, klineToWire } from '../shared/bars.js';
import { heikinAshi, lineBreak, kagi, pointFigure } from '../shared/transforms.js';
import { SessionProfiler, tpoProfile } from '../shared/profile.js';

// Rejoue une liste de trades [t, p, q, side] et retourne les bougies closes + la courante.
function build(spec, trades) {
  const b = new BarBuilder(spec);
  const out = [];
  trades.forEach(([t, p, q, s], i) => out.push(...b.push(t, p, q, s, i)));
  const cur = b.current();
  return { closed: out, cur, all: cur ? [...out, cur] : out };
}

test('bougies temps : OHLC, volumes acheteur/vendeur, delta, VWAP', () => {
  const { closed, cur } = build({ type: 'time', param: 60_000 }, [
    [1000, 100, 1, 1],
    [2000, 102, 2, -1],
    [3000, 99, 1, 1],
    [61_000, 101, 3, 1],
  ]);
  assert.equal(closed.length, 1);
  const b = closed[0];
  assert.deepEqual([b.t0, b.o, b.h, b.l, b.c], [0, 100, 102, 99, 99]);
  assert.deepEqual([b.v, b.b, b.s, b.n], [4, 2, 2, 3]);
  assert.equal(b.pv, 100 + 204 + 99);
  assert.equal(cur.t0, 60_000);
  assert.equal(cur.x, 0);
});

test('footprint : cellules par tranche, vendeurs/acheteurs et nombre de trades', () => {
  const { cur } = build({ type: 'time', param: 60_000, fpBucket: 10 }, [
    [1, 101, 1, 1],
    [2, 105, 2, -1],
    [3, 111, 1, 1],
    [4, 119, 4, 1],
  ]);
  const rows = Object.fromEntries(cur.fp.map(([r, sv, bv, sn, bn]) => [r, [sv, bv, sn, bn]]));
  assert.deepEqual(rows[10], [2, 1, 1, 1]);
  assert.deepEqual(rows[11], [0, 5, 0, 2]);
  const st = footprintStats(cur.fp);
  assert.equal(st.poc, 11);
  assert.equal(st.max, 5);
});

test('bougies ticks, volume et delta : fermeture au seuil', () => {
  const trades = Array.from({ length: 10 }, (_, i) => [i, 100 + i, 1, i % 3 === 0 ? -1 : 1]);
  assert.equal(build({ type: 'tick', param: 4 }, trades).closed.length, 2);
  assert.equal(build({ type: 'volume', param: 5 }, trades).closed.length, 2);
  const delta = build({ type: 'delta', param: 3 }, trades.map(([t, p, q]) => [t, p, q, 1]));
  assert.equal(delta.closed.length, 3);
  assert.ok(delta.closed.every((b) => b.b - b.s === 3));
});

test('bougies range : amplitude jamais dépassée', () => {
  const prices = [100, 101, 103, 104, 102, 99, 98, 105, 106];
  const { all } = build({ type: 'range', param: 3 }, prices.map((p, i) => [i, p, 1, 1]));
  assert.ok(all.length >= 3);
  assert.ok(all.every((b) => b.h - b.l <= 3 + 1e-9), JSON.stringify(all.map((b) => [b.l, b.h])));
});

test('renko : briques de taille fixe, renversement après deux briques', () => {
  const prices = [100, 104, 111, 121, 118, 112, 108, 99, 125];
  const { closed } = build({ type: 'renko', param: 10 }, prices.map((p, i) => [i, p, 1, 1]));
  for (const b of closed) assert.equal(Math.abs(b.c - b.o), 10);
  const dirs = closed.map((b) => (b.c > b.o ? 'U' : 'D')).join('');
  assert.equal(dirs, 'UUDU', dirs); // 100->110->120, renversement sous 100 (110->100), puis 110->120 ; 130 non atteint
});

test('raccord historique / direct : un trade déjà intégré est ignoré', () => {
  const b = new BarBuilder({ type: 'time', param: 60_000 });
  b.push(1000, 100, 1, 1, 5);
  assert.deepEqual(b.push(1500, 101, 1, 1, 5), []);
  assert.equal(b.current().v, 1);
  const r = new BarBuilder({ type: 'time', param: 60_000 });
  r.restore(b.current(), { lastId: 5 });
  r.push(2000, 102, 2, -1, 4); // plus ancien : ignoré
  r.push(3000, 103, 2, -1, 6);
  assert.equal(r.current().v, 3);
});

test('kline Binance -> bougie : delta depuis le volume acheteur taker', () => {
  const k = [0, '100', '110', '95', '105', '10', 59_999, '1000', 42, '6', '600', '0'];
  const b = klineToWire(k, true);
  assert.deepEqual([b.o, b.h, b.l, b.c, b.v, b.b, b.s, b.n, b.x], [100, 110, 95, 105, 10, 6, 4, 42, 1]);
});

test('Heikin Ashi, line break, kagi, point & figure', () => {
  const bars = [100, 102, 101, 105, 104, 98, 97, 103, 108].map((c, i) => ({ t0: i, t1: i, o: c - 1, h: c + 1, l: c - 2, c }));
  const ha = heikinAshi(bars);
  assert.equal(ha[0].c, (99 + 101 + 98 + 100) / 4);
  assert.ok(ha.every((b) => b.h >= Math.max(b.o, b.c) && b.l <= Math.min(b.o, b.c)));
  const lb = lineBreak(bars, 3);
  assert.ok(lb.length >= 3 && lb.every((l) => (l.up ? l.c > l.o : l.c < l.o)));
  const kg = kagi(bars, 4);
  assert.ok(kg.length >= 2);
  const pf = pointFigure(bars, 2, 3);
  assert.ok(pf.length >= 2 && pf.every((c) => c.hi >= c.lo));
  assert.ok(pf.some((c) => !c.up));
});

test('profil de session : POC, value area 70 % et TPO', () => {
  const p = new SessionProfiler(1);
  const day = 86_400_000 * 10;
  // Volume concentré autour de 100, quelques trades aux extrêmes.
  for (let i = 0; i < 50; i++) p.push(day + i * 1000, 100.5, 2, 1);
  for (let i = 0; i < 10; i++) p.push(day + 3_600_000 + i, 105.5, 1, -1);
  for (let i = 0; i < 10; i++) p.push(day + 7_200_000 + i, 95.5, 1, 1);
  const [s] = p.list();
  assert.equal(s.poc, 100);
  assert.ok(s.val <= 100 && s.vah >= 100);
  assert.equal(s.total, 120);
  assert.deepEqual(s.periods.map((x) => x[0]), [0, 2, 4]);
  assert.equal(s.ibLo, 100);
  // POC en développement : figé à la fin de chaque sous-période (0, 2 puis 4 en cours).
  assert.deepEqual(s.dev.map((d) => d[0]), [0, 2, 4]);
  assert.equal(s.dev[0][1], 100);
  // Sous-période d'une heure : périodes 0, 1, 2 ; initial balance = première période.
  const h = new SessionProfiler(1, { tpoMs: 3_600_000 });
  h.push(day, 100.5, 1, 1);
  h.push(day + 3_600_000, 105.5, 1, 1);
  const [s2] = h.list();
  assert.deepEqual([s2.ibN, s2.ibLo, s2.ibHi], [1, 100, 100]);
  // Plage libre : un seul profil sur deux jours.
  const r = new SessionProfiler(1, { range: [day, day + 2 * 86_400_000] });
  r.push(day, 100.5, 1, 1);
  r.push(day + 86_400_000 + 5, 101.5, 1, -1);
  assert.equal(r.list().length, 1);
  assert.equal(r.list()[0].total, 2);
});

test('TPO : POC et value area sur le nombre de périodes, simples impressions, regroupement', () => {
  const s = { bucket: 1, open: 100.5, close: 103.5, periods: [[0, 100, 102], [1, 101, 103], [2, 101, 101], [3, 95, 104]] };
  const t = tpoProfile(s);
  assert.equal(t.total, 17);
  assert.equal(t.poc, 101);
  assert.deepEqual([t.val, t.vah], [100, 104]); // 12 TPO sur 17 ≥ 70 %
  assert.deepEqual(t.singles, [96, 97, 98, 99]);
  assert.deepEqual([t.ibLo, t.ibHi], [100, 103]);
  assert.deepEqual([t.openRow, t.closeRow], [100, 103]);
  assert.deepEqual(t.letters.get(101), [0, 1, 2, 3]);
  const g = tpoProfile(s, 2);
  assert.equal(g.bucket, 2);
  assert.equal(g.poc, 50);
  assert.deepEqual(g.letters.get(50), [0, 1, 2, 3]);
  // Égalité : le POC est le prix le plus proche du centre de l'étendue.
  assert.equal(tpoProfile({ bucket: 1, open: 0, close: 3, periods: [[0, 0, 3]] }).poc, 1);
});

test('klines : VWAP exact à partir du volume en devise de cotation', () => {
  const b = klineToWire([0, '100', '104', '99', '103', '10', 59_999, '1015', 42, '6'], true);
  assert.equal(b.pv, 1015); // Σ p·q fourni par Binance
  assert.equal(b.pv / b.v, 101.5); // VWAP, et non (H + B + C) / 3
  assert.equal(b.p2v, (1015 * 1015) / 10);
  assert.deepEqual([b.b, b.s], [6, 4]);
});
