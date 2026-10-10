// Tests des composants serveur : alertes, heatmap, trades en colonnes, zip et CSV Binance Vision.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { Readable } from 'node:stream';
import { Alerts } from '../server/alerts.js';
import { HeatStore } from '../server/heatstore.js';
import { LiquidationStore } from '../server/liquidations.js';
import { Trades } from '../server/history/trades.js';
import { openSingleEntry } from '../server/history/zip.js';
import { parseAggTradesCsv } from '../server/history/vision.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'deepflow-test-'));
const frame = (t, mid, extra = {}) => ({ t, bid: mid - 0.05, ask: mid + 0.05, r0: 0, b: [], a: [], tr: [], liq: [], ...extra });
const flow = { walls: [], imb: 0, deltaZ: () => null };

test('alertes : franchissement de prix, une seule fois', () => {
  const a = new Alerts(path.join(tmp(), 'alerts.json'));
  a.add({ symbol: 'BTCUSDT', type: 'price', params: { price: 100 }, once: true });
  const fired = [];
  a.on('fired', (e) => fired.push(e));
  a.evaluate({ symbol: 'BTCUSDT', f: frame(1, 99), flow, base: 'BTC' });
  a.evaluate({ symbol: 'BTCUSDT', f: frame(2, 101), flow, base: 'BTC' });
  a.evaluate({ symbol: 'BTCUSDT', f: frame(70_000, 99), flow, base: 'BTC' });
  assert.equal(fired.length, 1);
  assert.match(fired[0].text, /au-dessus de 100/);
  assert.equal(a.list().items[0].enabled, false);
});

test('alertes : liquidation au-delà d’un montant, gros print, validation', () => {
  const a = new Alerts(path.join(tmp(), 'alerts.json'));
  a.add({ symbol: 'ETHUSDT', type: 'liquidation', params: { notional: 50_000 }, once: false });
  a.add({ symbol: 'ETHUSDT', type: 'bigprint', params: { qty: 10 }, once: true });
  const fired = [];
  a.on('fired', (e) => fired.push(e));
  a.evaluate({ symbol: 'ETHUSDT', f: frame(1, 2500, { liq: [[2500, 10, -1, 1]] }), flow, base: 'ETH' }); // 25 k : non
  a.evaluate({ symbol: 'ETHUSDT', f: frame(2, 2500, { liq: [[2500, 30, -1, 2]], tr: [[2500, 6, 1, 2], [2500, 5, 1, 2]] }), flow, base: 'ETH' });
  assert.equal(fired.length, 2);
  assert.match(fired.find((e) => e.type === 'liquidation').text, /Liquidation longue de 75/);
  assert.match(fired.find((e) => e.type === 'bigprint').text, /11 ETH/); // deux fills du même ordre regroupés
  assert.throws(() => a.add({ symbol: 'ETHUSDT', type: 'price', params: { price: -1 } }), /hors bornes/);
  assert.throws(() => a.add({ symbol: 'x', type: 'nope', params: {} }), /inconnu/);
});

test('heatmap : grille quantifiée, côtés acheteur/vendeur, dernière photo conservée', () => {
  const h = new HeatStore({ bucket: 1, hours: 1 });
  for (let s = 0; s < 10; s++) h.add({ t: s * 1000, r0: 100, b: [5, 0, 0], a: [0, 0, s === 9 ? 10 : 2] });
  const r = h.raster({ from: 0, to: 10_000, cols: 10, rowLo: 100, rowHi: 102 });
  assert.equal(r.rows, 3);
  assert.equal(r.buf.length, 10 * 3 * 2);
  const cell = (c, row, ch) => r.buf[(row * 10 + c) * 2 + ch];
  assert.ok(cell(0, 0, 0) > 0 && cell(0, 0, 1) === 0); // bid au niveau 100
  assert.ok(cell(9, 2, 1) === 255); // plus gros niveau = saturé
  assert.equal(cell(5, 1, 0) + cell(5, 1, 1), 0); // niveau vide
});

test('trades en colonnes : ajout, tranche, sérialisation binaire', () => {
  const t = new Trades(2);
  for (let i = 0; i < 5; i++) t.push(1000 + i, 100 + i, 0.5 * i, i % 2 ? 1 : -1, 10 + i);
  const s = t.slice(1001, 1004);
  assert.equal(s.n, 3);
  assert.equal(s.p[0], 101);
  const back = Trades.fromBuffer(t.toBuffer());
  assert.equal(back.n, 5);
  assert.deepEqual([back.t[4], back.p[4], back.q[4], back.s[4], back.id[4]], [1004, 104, 2, -1, 14]);
  assert.equal(Trades.concat([s, back.slice(1003, 2000)]).n, 5);
});

test('liquidations : persistance et relecture', () => {
  const dir = tmp();
  const store = new LiquidationStore(dir, 'futures', 'BTCUSDT');
  store.add({ t: 5, p: 100, q: 2, side: -1 });
  store.add({ t: 9, p: 101, q: 1, side: 1 });
  const again = new LiquidationStore(dir, 'futures', 'BTCUSDT');
  assert.deepEqual(again.range(0, 10), [[5, 100, 2, -1], [9, 101, 1, 1]]);
  assert.deepEqual(again.range(6, 10), [[9, 101, 1, 1]]);
});

// Archive zip à une entrée, comme celles de Binance Vision.
function makeZip(name, content) {
  const data = zlib.deflateRawSync(Buffer.from(content));
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const cdOffset = local.length + nameBuf.length + data.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + nameBuf.length, 12);
  end.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([local, nameBuf, data, central, nameBuf, end]);
}

test('Binance Vision : lecture zip + CSV futures (avec entête) et spot (microsecondes)', async () => {
  const futures = 'agg_trade_id,price,quantity,first_trade_id,last_trade_id,transact_time,is_buyer_maker\n1,100.5,2,10,11,1700000000000,true\n2,101,0.5,12,12,1700000000001,false\n';
  const { name, stream } = openSingleEntry(makeZip('BTCUSDT-aggTrades.csv', futures));
  assert.equal(name, 'BTCUSDT-aggTrades.csv');
  const t = await parseAggTradesCsv(stream);
  assert.equal(t.n, 2);
  assert.deepEqual([t.p[0], t.q[0], t.s[0], t.id[0], t.t[0]], [100.5, 2, -1, 1, 1700000000000]);
  assert.equal(t.s[1], 1);
  const spot = '7,50,1,1,1,1735689600000000,False,True\n';
  const s = await parseAggTradesCsv(Readable.from([spot]));
  assert.equal(s.t[0], 1735689600000); // microsecondes -> millisecondes
  assert.equal(s.s[0], 1);
});

test('historique : pas de jours antérieurs tant que le rattrapage du jour n’est pas fini', async () => {
  const { TradeStore, DAY } = await import('../server/history/store.js');
  const pending = { aggTrades: () => new Promise(() => {}) }; // rattrapage qui ne se termine jamais
  const store = new TradeStore({ market: 'futures', symbol: 'TESTUSDT', dir: tmp(), rest: pending });
  const t0 = 20 * DAY + 10 * 3_600_000; // 10 h UTC
  for (let i = 0; i < 5; i++) store.appendLive(t0 + i * 1000, 100, 1, 1, i);
  const r = await store.getRange(t0 - 2 * DAY, t0 + 10_000);
  assert.equal(r.partial, true);
  assert.equal(r.trades.n, 5); // uniquement la mémoire, aucun téléchargement d'archive
  store.stop();
});

test('bulles : une par créneau au VWAP, volumes acheteur / vendeur, gros prints regroupés', async () => {
  const { bubbles } = await import('../server/queries.js');
  const tr = new Trades(16);
  tr.push(1_000, 100, 1, 1, 1);
  tr.push(1_500, 102, 3, -1, 2);
  tr.push(1_500, 102, 2, -1, 3); // même ordre agresseur que le précédent
  tr.push(2_200, 101, 4, 1, 4);
  const s = { mode: 'live', store: { getRange: async () => ({ trades: tr, partial: false }) }, flow: { bigThreshold: 5 }, now: () => Date.now() };
  const r = await bubbles(s, { from: 0, to: 3_000, slot: 1000 });
  const [a, b] = r.rows;
  assert.deepEqual([a[0], a[2], a[3]], [1000, 1, 5]);
  assert.equal(a[1], (100 + 102 * 5) / 6); // VWAP du créneau
  assert.deepEqual(b, [2000, 101, 4, 0]);
  assert.deepEqual(r.big, [[1500, 102, 5, -1]]); // 3 + 2 du même ordre ≥ seuil de 5
  // Seuil en montant : 510 USDT pour l'ordre de 5, 404 pour celui de 4.
  assert.deepEqual((await bubbles(s, { from: 0, to: 3_000, slot: 1000, min: 500 })).big, [[1500, 102, 5, -1]]);
  assert.deepEqual((await bubbles(s, { from: 0, to: 3_000, slot: 1000, min: 400 })).big.length, 2);
  assert.deepEqual((await bubbles(s, { from: 0, to: 3_000, slot: 1000, min: 600 })).big, []);
});

test('profils : plage libre (profil visible) et sous-période TPO', async () => {
  const { profiles } = await import('../server/queries.js');
  const tr = new Trades(16);
  const day = 86_400_000 * 20_000;
  tr.push(day + 1_000, 100.5, 2, 1, 1);
  tr.push(day + 3_700_000, 101.5, 1, -1, 2);
  const store = { getRange: async () => ({ trades: tr, partial: false }), backFrom: null, hasDay: () => true };
  const s = { mode: 'live', store, cfg: { footprint: { bucket: 1 } }, now: () => Date.now() };
  const r = await profiles(s, { mode: 'range', from: day, to: day + 7_200_000, bucket: 1, tpo: 60 });
  assert.equal(r.sessions.length, 1);
  const [p] = r.sessions;
  assert.deepEqual([p.t0, p.t1, p.total, p.poc, p.tpoMs], [day, day + 7_200_000, 3, 100, 3_600_000]);
  assert.deepEqual(p.periods.map((x) => x[0]), [0, 1]); // une période par heure
  assert.equal(p.dev.length, 2);
});

test('ancrage du VWAP par période : heures entières en 1 h, reste en 1 min', async () => {
  const { vwapAnchor } = await import('../server/queries.js');
  const H = 3_600_000;
  const monday = Date.parse('2026-10-05T00:00:00Z');
  const t = monday + 2 * 86_400_000 + 3 * H + 25 * 60_000; // mercredi 03:25
  const calls = [];
  // Kline : [début, o, h, l, c, volume, fin, volume en cotation]
  const rest = { klines: async (sym, iv, o) => (calls.push([iv, o.startTime, o.endTime]), iv === '1h' ? [[0, 0, 0, 0, 0, '2', 0, '200']] : [[0, 0, 0, 0, 0, '1', 0, '110']]) };
  const s = { rest, cfg: { symbol: 'BTCUSDT' }, now: () => t + 60_000 };
  const w = await vwapAnchor(s, { t, period: 'week' });
  assert.deepEqual(calls, [['1h', monday, t - 25 * 60_000 - 1], ['1m', t - 25 * 60_000, t - 1]]);
  assert.deepEqual([w.period, w.start, w.pv, w.v], ['week', monday, 310, 3]);
  assert.equal(w.p2v, 200 * 200 / 2 + 110 * 110);
  calls.length = 0;
  const d = await vwapAnchor(s, { t: monday + 2 * 86_400_000 + 20 * 60_000, period: 'inconnue' }); // jour, première heure
  assert.deepEqual(calls.map((c) => c[0]), ['1m']);
  assert.equal(d.period, 'day');
  calls.length = 0;
  await vwapAnchor(s, { t: monday, period: 'week' }); // début de période : rien à demander
  assert.equal(calls.length, 0);
});

test('niveaux clés : bougies journalières jusqu’à aujourd’hui, calcul gardé pour la journée', async () => {
  const { levels } = await import('../server/queries.js');
  const today = Date.parse('2026-10-07T00:00:00Z');
  const calls = [];
  const rest = { klines: async (sym, iv, o) => (calls.push([iv, o.endTime]), [[today - 86_400_000, '10', '12', '9'], [today, '11', '99', '1']]) };
  const s = { rest, cfg: { symbol: 'BTCUSDT' }, now: () => today + 5 * 3_600_000 };
  const k = await levels(s);
  assert.deepEqual(calls, [['1d', today]]);
  assert.deepEqual([k.dayOpen, k.prevDay], [11, { hi: 12, lo: 9 }]); // plus haut / bas du jour ignorés
  await levels(s);
  assert.equal(calls.length, 1);
});

test('prime et financement : futures seulement, rien après l’heure rejouée', async () => {
  const { funding } = await import('../server/queries.js');
  const now = 10 * 300_000;
  const rest = {
    premiumKlines: async () => [[now - 600_000, '0', '0', '0', '0.0001', 0, now - 300_001], [now - 300_000, '0', '0', '0', '0.0003', 0, now - 1], [now, '0', '0', '0', '0.0009', 0, now + 299_999]],
    fundingRates: async () => [{ fundingTime: now - 3_600_000, fundingRate: '0.00010000' }],
  };
  const replay = { mode: 'archive', rest, cfg: { symbol: 'BTCUSDT', market: 'futures' }, now: () => now };
  const r = await funding(replay, { interval: '5m' });
  assert.deepEqual(r.premium, [[now - 600_000, 0.0001], [now - 300_000, 0.0003]]); // bougie en cours écartée
  assert.deepEqual(r.rates, [[now - 3_600_000, 0.0001]]);
  assert.equal((await funding({ ...replay, mode: 'live' }, { interval: 'x' })).interval, '5m');
  assert.equal((await funding({ ...replay, mode: 'live' }, {})).premium.length, 3);
  assert.deepEqual(await funding({ ...replay, cfg: { market: 'spot' } }, {}), { interval: null, premium: [], rates: [] });
});
