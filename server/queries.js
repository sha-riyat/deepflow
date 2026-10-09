// Requêtes d'historique : bougies (klines ou trades), bulles de trades, profils de session,
// heatmap, open interest, tickers.
import { BarBuilder, BAR_TYPES, klineToWire } from '../shared/bars.js';
import { SessionProfiler } from '../shared/profile.js';

const HOUR = 3_600_000;
export const KLINE = {
  1000: '1s', 60_000: '1m', 180_000: '3m', 300_000: '5m', 900_000: '15m', 1_800_000: '30m',
  3_600_000: '1h', 7_200_000: '2h', 14_400_000: '4h', 21_600_000: '6h', 43_200_000: '12h',
  86_400_000: '1d', 604_800_000: '1w',
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));

// Instant « présent » : l'horloge en direct, le dernier trade rejoué en replay.
const nowOf = (s) => (s.mode === 'replay' ? (s.store.live.last ?? Date.now()) : Date.now());

export async function bars(s, q) {
  const type = BAR_TYPES.includes(q.type) ? q.type : 'time';
  const param = num(q.param, 60_000);
  if (!(param > 0)) throw new Error('paramètre invalide');
  const fp = Math.max(0, num(q.fp, 0));
  const now = nowOf(s);
  const to = Math.min(num(q.to, now), now);
  const count = clamp(num(q.count, 600), 10, 3000);

  // Bougies temps sans footprint : klines Binance, profondeur illimitée.
  const interval = KLINE[param];
  const klinesOk = interval && (s.cfg.market === 'spot' || param >= 60_000);
  if (type === 'time' && !fp && klinesOk && s.mode === 'live') {
    const rows = await s.rest.klines(s.cfg.symbol, interval, { endTime: to, limit: count });
    return { source: 'klines', partial: false, serverT: now, bars: rows.map((k) => klineToWire(k, k[6] < now)) };
  }

  let from = num(q.from, type === 'time' ? to - count * param : to - 6 * HOUR);
  if (type === 'time') from = Math.floor(from / param) * param;
  const { trades: t, partial } = await s.store.getRange(from, to, { maxDays: 3 });
  const builder = new BarBuilder({ type, param, fpBucket: fp });
  const out = [];
  for (let i = 0; i < t.n; i++) {
    const closed = builder.push(t.t[i], t.p[i], t.q[i], t.s[i], t.id[i]);
    for (const b of closed) out.push(b);
  }
  const cur = builder.current();
  if (cur) {
    if (to < now - 1000) cur.x = 1; // plage passée : la dernière bougie est complète
    out.push(cur);
  }
  return {
    source: 'trades',
    partial,
    serverT: now,
    from: t.n ? t.t[0] : from,
    bars: out.slice(-5000),
    lastT: t.n ? t.t[t.n - 1] : null,
    lastId: t.n ? t.id[t.n - 1] : null,
  };
}

// Volume agrégé par créneau et par côté (bulles), plus les gros prints de la plage.
export async function bubbles(s, q) {
  const now = nowOf(s);
  const to = Math.min(num(q.to, now), now);
  const from = num(q.from, to - HOUR);
  const slot = clamp(num(q.slot, 1000), 100, 3_600_000);
  const { trades: t } = await s.store.getRange(from, to, { maxDays: 1 });
  const slots = new Map();
  const prints = new Map();
  for (let i = 0; i < t.n; i++) {
    const side = t.s[i];
    const k = Math.floor(t.t[i] / slot) * 2 + (side > 0 ? 1 : 0);
    const g = slots.get(k) ?? [0, 0];
    g[0] += t.p[i] * t.q[i];
    g[1] += t.q[i];
    slots.set(k, g);
    const pk = t.t[i] * 2 + (side > 0 ? 1 : 0);
    const pr = prints.get(pk) ?? [0, 0];
    pr[0] += t.p[i] * t.q[i];
    pr[1] += t.q[i];
    prints.set(pk, pr);
  }
  const rows = [...slots].map(([k, [pq, qty]]) => [Math.floor(k / 2) * slot, pq / qty, Math.round(qty * 1000) / 1000, k % 2 ? 1 : -1]);
  const live = s.engine.flow.bigThreshold;
  const sizes = [...prints.values()].map((p) => p[1]).sort((a, b) => a - b);
  const threshold = Number.isFinite(live) ? live : sizes[Math.floor(sizes.length * 0.995)] ?? Infinity;
  const big = [...prints]
    .filter(([, [, qty]]) => qty >= threshold)
    .map(([k, [pq, qty]]) => [Math.floor(k / 2), pq / qty, Math.round(qty * 1000) / 1000, k % 2 ? 1 : -1])
    .slice(-3000);
  return { slot, rows, big, threshold: Number.isFinite(threshold) ? threshold : null };
}

export async function profiles(s, q) {
  const now = nowOf(s);
  const to = Math.min(num(q.to, now), now);
  const from = num(q.from, to - 86_400_000);
  const bucket = num(q.bucket, s.cfg.footprint.bucket);
  const { trades: t, partial } = await s.store.getRange(from, to, { maxDays: 7 });
  const prof = new SessionProfiler(bucket);
  for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
  return { bucket, partial, sessions: prof.list() };
}

export function heatmap(s, q) {
  const now = nowOf(s);
  const to = num(q.to, now);
  const from = num(q.from, to - 300_000);
  const rowLo = Math.floor(num(q.rowLo, 0));
  const rowHi = Math.floor(num(q.rowHi, rowLo + 300));
  if (rowHi < rowLo || rowHi - rowLo > 20_000) throw new Error('plage de prix invalide');
  return s.heat.raster({ from, to, cols: num(q.cols, 800), rowLo, rowHi });
}

export async function openInterest(s, q) {
  if (s.cfg.market !== 'futures') return { rows: [] };
  const period = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'].includes(q.period) ? q.period : '5m';
  const rows = await s.rest.openInterest(s.cfg.symbol, period, { endTime: num(q.to, undefined), limit: 500 });
  return { period, rows: rows.map((r) => [r.timestamp, Number(r.sumOpenInterest)]) };
}

let tickerCache = { t: 0, data: null };
export async function tickers(rest) {
  if (Date.now() - tickerCache.t < 5000 && tickerCache.data) return tickerCache.data;
  const rows = await rest.tickers();
  const data = rows
    .filter((r) => r.symbol.endsWith('USDT') && Number(r.quoteVolume) > 0)
    .map((r) => ({ symbol: r.symbol, last: Number(r.lastPrice), change: Number(r.priceChangePercent), volume: Number(r.quoteVolume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 200);
  tickerCache = { t: Date.now(), data };
  return data;
}

// Liquidations enregistrées sur la plage (direct uniquement : pas d'historique public Binance).
export function liquidations(s, q) {
  const now = nowOf(s);
  const to = Math.min(num(q.to, now), now);
  const from = num(q.from, to - 86_400_000);
  return { rows: s.liqs.range(from, to), since: s.liqs.rows[0]?.[0] ?? null };
}
