// Backtest de la stratégie du cours (« Value Area de la veille + confirmation order flow ») sur les
// archives quotidiennes de trades Binance (aggTrades), avec le même moteur qu'en direct. Sans carnet
// d'ordres : les frames sont reconstituées à partir des trades (meilleur prix = dernier prix ± un
// tick). Le premier jour sert d'échauffement (il fournit la value area de la veille).
// Usage : npm run backtest:vp -- [SYMBOL] [--days 30] [--frame 250] [--windows off]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../server/config.js';
import { loadSymbolInfo } from '../server/symbol.js';
import { BinanceRest } from '../server/history/rest.js';
import { TradeStore, DAY, dayKey } from '../server/history/store.js';
import { Engine } from '../server/engine/engine.js';
import { niceStep } from '../server/session.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const symbol = (args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'BTCUSDT').toUpperCase();
const days = Number(opt('days', 30));
const frameMs = Number(opt('frame', 250));

const cfg = structuredClone(config);
Object.assign(cfg, { market: 'futures', symbol });
cfg.setups.absorption.enabled = false;
cfg.setups.breakout.enabled = false;
cfg.setups.valuearea.enabled = true;
if (opt('windows', 'on') === 'off') cfg.risk.windows = [];

const info = await loadSymbolInfo('futures', symbol);
const store = new TradeStore({ market: 'futures', symbol, dir: path.join(root, 'data'), rest: new BinanceRest('futures') });
const today = Math.floor(Date.now() / DAY) * DAY;
const first = today - (days + 1) * DAY;
let engine = null;
const closed = [];
const rejections = new Map();
const tick = info.tickSize;

for (let d = first; d < today; d += DAY) {
  process.stdout.write(`${dayKey(d)} : chargement… `);
  const tr = await store.day(d);
  if (!tr.n) {
    console.log('aucun trade');
    continue;
  }
  if (!engine) {
    cfg.bucket = niceStep(tr.p[0] * 0.00005, tick);
    cfg.footprint.bucket = Number((cfg.bucket * 2).toPrecision(6));
    engine = new Engine(cfg, info);
    engine.on('signal', (s) => s.status === 'closed' && closed.push(s));
    engine.on('rejection', (r) => rejections.set(r.reason.replace(/[\d,.]+/g, '#'), (rejections.get(r.reason.replace(/[\d,.]+/g, '#')) ?? 0) + 1));
  }
  // Frames de `frameMs` : trades [prix, qté, côté, temps, id] ; carnet vide.
  let batch = [];
  let end = Math.floor(tr.t[0] / frameMs) * frameMs + frameMs;
  const flush = () => {
    if (!batch.length) return;
    const [p, , side] = batch[batch.length - 1];
    engine.onFrame({ t: end, bid: side > 0 ? p - tick : p, ask: side > 0 ? p : p + tick, r0: 0, b: [], a: [], tr: batch, liq: [] });
    batch = [];
  };
  for (let i = 0; i < tr.n; i++) {
    if (tr.t[i] >= end) {
      flush();
      end = Math.floor(tr.t[i] / frameMs) * frameMs + frameMs;
    }
    batch.push([tr.p[i], tr.q[i], tr.s[i], tr.t[i], tr.id[i]]);
  }
  flush();
  console.log(`${tr.n.toLocaleString('fr-FR')} trades, ${closed.length} trade(s) clôturé(s) au total`);
}

// Statistiques par setup, en R nets de frais (frais taker aller-retour déduits par le suivi).
const stats = (list) => {
  const n = list.length;
  const wins = list.filter((s) => s.resultR > 0);
  const losses = list.filter((s) => s.resultR <= 0);
  const total = list.reduce((a, s) => a + s.resultR, 0);
  let peak = 0;
  let cum = 0;
  let dd = 0;
  for (const s of list) {
    cum += s.resultR;
    peak = Math.max(peak, cum);
    dd = Math.max(dd, peak - cum);
  }
  const avg = (xs) => (xs.length ? xs.reduce((a, s) => a + s.resultR, 0) / xs.length : 0);
  return { n, winRate: n ? (wins.length / n) * 100 : 0, avgWin: avg(wins), avgLoss: avg(losses), expectancy: n ? total / n : 0, totalR: total, maxDD: dd };
};
const r2 = (v) => Math.round(v * 100) / 100;
const report = { symbol, from: dayKey(first + DAY), to: dayKey(today - DAY), frameMs, windows: cfg.risk.windows.length > 0, setups: {}, trades: [] };
console.log(`\nBacktest ${symbol} du ${report.from} au ${report.to} (stratégie du cours, frais taker inclus)`);
for (const name of ['rejet', 'acceptation', 'tous']) {
  const list = name === 'tous' ? closed : closed.filter((s) => s.setup === name);
  const st = stats(list);
  report.setups[name] = Object.fromEntries(Object.entries(st).map(([k, v]) => [k, r2(v)]));
  console.log(
    `${name.padEnd(12)} ${String(st.n).padStart(3)} trades · gagnants ${r2(st.winRate)} % · gain moyen ${r2(st.avgWin)}R · perte moyenne ${r2(st.avgLoss)}R · espérance ${r2(st.expectancy)}R · total ${r2(st.totalR)}R · drawdown max ${r2(st.maxDD)}R`,
  );
}
for (const s of closed) {
  report.trades.push({ t: new Date(s.t).toISOString(), setup: s.setup, side: s.side, entry: s.entry, stop: s.stop, targets: s.targets.map((t) => t.price), outcome: s.outcome, exit: s.exitPrice, R: s.resultR });
}
if (rejections.size) {
  console.log('\nSetups refusés (raisons les plus fréquentes) :');
  for (const [reason, n] of [...rejections].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${String(n).padStart(4)} × ${reason}`);
}
const out = path.join(root, 'data', `backtest-vp-${symbol}-${report.from}-${report.to}${report.windows ? '' : '-24h'}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\nRapport : ${path.relative(root, out)}`);
console.log(closed.length < 50 ? 'Moins de 50 trades : échantillon trop petit pour conclure (condition du cours : 50 trades, espérance positive).' : 'Au moins 50 trades : condition de taille du cours remplie.');
process.exit(0);
