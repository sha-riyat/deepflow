// Vérification sur données réelles Binance (réseau requis) : compare nos calculs aux sources
// officielles. Usage : npm run verify [-- SYMBOL] (futures USD-M, veille UTC).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BinanceRest } from '../server/history/rest.js';
import { TradeStore, DAY } from '../server/history/store.js';
import { BinanceFeed } from '../server/binance.js';
import { BarBuilder, klineToWire } from '../shared/bars.js';
import { SessionProfiler, tpoProfile } from '../shared/profile.js';
import { bubbles, vwapAnchor } from '../server/queries.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const symbol = (process.argv[2] ?? 'BTCUSDT').toUpperCase();
const market = 'futures';
const rest = new BinanceRest(market);
const day = Math.floor(Date.now() / DAY) * DAY - DAY; // veille UTC, archive publiée
const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${name} — ${detail}`);
};

// 1. Bougies 1 min reconstruites depuis les trades d'archive vs klines officielles.
const store = new TradeStore({ market, symbol, dir: path.join(root, 'data'), rest });
console.log(`Archive ${new Date(day).toISOString().slice(0, 10)} ${symbol} (téléchargée si absente)…`);
const trades = await store.day(day);
const builder = new BarBuilder({ type: 'time', param: 60_000 });
const ours = new Map();
for (let i = 0; i < trades.n; i++) for (const b of builder.push(trades.t[i], trades.p[i], trades.q[i], trades.s[i])) ours.set(b.t0, b);
const last = builder.current();
if (last) ours.set(last.t0, last);
const klines = [];
for (let t = day; t < day + DAY; t += 1500 * 60_000) {
  klines.push(...(await rest.klines(symbol, '1m', { startTime: t, endTime: Math.min(t + 1500 * 60_000, day + DAY) - 1, limit: 1500 })));
}
// Un trade agrégé porte l'heure de son premier fill : quand un ordre s'exécute à cheval sur
// deux minutes, Binance répartit ses fills entre les deux klines, nous le gardons entier dans
// la première. Les écarts doivent donc rester rares et minimes en volume.
let ohlcBad = 0;
let movedVol = 0;
let totalVol = 0;
let movedBuy = 0;
for (const k of klines) {
  const ref = klineToWire(k, true);
  const b = ours.get(ref.t0) ?? { o: 0, h: 0, l: 0, c: 0, v: 0, b: 0 };
  if (b.o !== ref.o || b.h !== ref.h || b.l !== ref.l || b.c !== ref.c) ohlcBad++;
  movedVol += Math.abs(b.v - ref.v);
  movedBuy += Math.abs(b.b - ref.b);
  totalVol += ref.v;
}
const pct = (x) => `${((x / totalVol) * 100).toFixed(3)} %`;
check('Bougies 1 min (OHLC) vs klines', ohlcBad / klines.length < 0.1, `${klines.length} minutes, ${ohlcBad} écart(s) dus aux ordres à cheval sur deux minutes`);
check('Volume par minute vs klines', movedVol / totalVol < 0.005, `volume déplacé entre minutes voisines : ${pct(movedVol / 2)} du total`);
check('Volume acheteur (delta) vs klines', movedBuy / totalVol < 0.005, `volume acheteur déplacé : ${pct(movedBuy / 2)} du total`);

// 2. Pagination REST des trades vs archive, sur 10 minutes de la veille.
const from = day + 12 * 3_600_000;
const to = from + 10 * 60_000;
let restN = 0;
let restQ = 0;
let firstId = null;
let lastId = null;
await rest.aggTrades(symbol, from, to, (rows) => {
  for (const r of rows) {
    restN++;
    restQ += Number(r.q);
    firstId ??= r.a;
    lastId = r.a;
  }
});
const slice = trades.slice(from, to);
let sliceQ = 0;
for (let i = 0; i < slice.n; i++) sliceQ += slice.q[i];
check('Trades REST vs archive (10 min)', restN === slice.n && firstId === slice.id[0] && lastId === slice.id[slice.n - 1],
  `${restN} vs ${slice.n} trades, ids ${firstId}…${lastId} vs ${slice.id[0]}…${slice.id[slice.n - 1]}`);
check('Quantités REST vs archive', Math.abs(restQ - sliceQ) / sliceQ < 1e-6, `${restQ.toFixed(3)} vs ${sliceQ.toFixed(3)}`);

// 3. Profil de session : volume total = somme des klines du jour.
const prof = new SessionProfiler(10);
for (let i = 0; i < trades.n; i++) prof.push(trades.t[i], trades.p[i], trades.q[i], trades.s[i]);
const [session] = prof.list();
const klVol = klines.reduce((a, k) => a + Number(k[5]), 0);
check('Profil de session : volume total', Math.abs(session.total - klVol) / klVol < 1e-6, `${session.total} vs ${klVol.toFixed(3)} ; POC ${session.poc * 10}, VA ${session.val * 10}–${(session.vah + 1) * 10}`);

// 3 bis. TPO : 48 périodes de 30 min, POC dans la value area, IB = première heure.
const tpo = tpoProfile(session, 5);
check('TPO de la session', session.periods.length === 48 && tpo.val <= tpo.poc && tpo.poc <= tpo.vah && tpo.ibLo >= tpo.lo && tpo.ibHi <= tpo.hi,
  `${session.periods.length} périodes, POC ${tpo.poc * tpo.bucket}, VA ${tpo.val * tpo.bucket}–${(tpo.vah + 1) * tpo.bucket}, ${tpo.singles.length} simple(s) impression(s)`);

// 3 ter. Bulles par minute : VWAP (volume en quote / volume) et volume acheteur des klines.
const fake = { mode: 'live', store: { getRange: async () => ({ trades, partial: false }) }, flow: { bigThreshold: Infinity }, now: () => Date.now() };
const bub = new Map((await bubbles(fake, { from: day, to: day + DAY, slot: 60_000 })).rows.map((r) => [r[0], r]));
let vwapBad = 0;
let buyBad = 0;
for (const k of klines) {
  const r = bub.get(k[0]);
  const vwap = Number(k[7]) / Number(k[5]);
  if (!r || Math.abs(r[1] - vwap) / vwap > 1e-5) vwapBad++;
  if (!r || Math.abs(r[2] - Number(k[9])) > 1e-6 * Number(k[5]) + 1e-9) buyBad++;
}
check('Bulles 1 min : VWAP et volume acheteur vs klines', vwapBad / klines.length < 0.1 && buyBad / klines.length < 0.1,
  `${klines.length - vwapBad}/${klines.length} VWAP et ${klines.length - buyBad}/${klines.length} volumes acheteurs identiques (écarts : ordres à cheval sur deux minutes)`);

// 3 quater. VWAP du jour ancré : klines avant midi + trades après midi = VWAP des klines du jour.
const noon = day + 12 * 3_600_000;
const anchor = await vwapAnchor({ mode: 'live', rest, cfg: { symbol }, now: () => Date.now() }, { t: noon });
let [apv, av] = [anchor.pv, anchor.v];
for (let i = 0; i < trades.n; i++) {
  if (trades.t[i] < noon) continue;
  apv += trades.p[i] * trades.q[i];
  av += trades.q[i];
}
const refVwap = klines.reduce((a, k) => a + Number(k[7]), 0) / klVol;
check('VWAP du jour ancré (klines + trades) vs klines', Math.abs(apv / av - refVwap) / refVwap < 1e-6, `${(apv / av).toFixed(2)} vs ${refVwap.toFixed(2)}`);

// 4. Carnet local synchronisé vs instantané REST (même identifiant de mise à jour).
const feed = new BinanceFeed({ market, symbol });
feed.start();
await new Promise((r) => setTimeout(r, 15_000));
const snap = await fetch(`https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=1000`).then((r) => r.json());
// On attend que le carnet local ait dépassé l'instantané, puis on compare les niveaux proches.
const top = (side, desc) => [...side].sort((a, b) => (desc ? b[0] - a[0] : a[0] - b[0])).slice(0, 20);
const ourBids = top(feed.book.bids, true);
const ourAsks = top(feed.book.asks, false);
const refBids = new Map(snap.bids.map(([p, q]) => [Number(p), Number(q)]));
const refAsks = new Map(snap.asks.map(([p, q]) => [Number(p), Number(q)]));
const same = (levels, ref) => levels.filter(([p, q]) => ref.get(p) === q).length;
const match = same(ourBids, refBids) + same(ourAsks, refAsks);
const gap = Math.abs(feed.book.lastUpdateId - snap.lastUpdateId);
feed.stop();
check('Carnet local vs instantané REST (40 meilleurs niveaux)', feed.synced !== undefined && match >= 28,
  `${match}/40 niveaux identiques (décalage de ${gap} mises à jour entre les deux photos)`);

console.log(`\n${results.filter(Boolean).length}/${results.length} vérifications réussies`);
process.exit(results.every(Boolean) ? 0 : 1);
