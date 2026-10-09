// Requêtes d'historique : bougies (klines ou trades), bulles de trades, profils de session,
// heatmap, open interest, tickers.
import { BarBuilder, BAR_TYPES, klineToWire } from '../shared/bars.js';
import { SessionProfiler } from '../shared/profile.js';

const HOUR = 3_600_000;
const DAY = 86_400_000;
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
  // Premier affichage : seulement les trades déjà en mémoire (réponse immédiate) ; l'historique
  // plus ancien (archives à télécharger) est demandé ensuite, page par page.
  if (q.recent === '1' && s.store.memStart !== null) from = Math.max(from, s.store.memStart);
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

// Bulles à la Bookmap : une par créneau de temps, au VWAP du créneau, avec le volume acheteur et
// vendeur (camembert) ; plus les gros prints (ordres agresseurs regroupés) de la plage : au-delà
// du seuil automatique (0,5 % des ordres les plus gros, celui du moteur en direct) ou, si `min`
// est fourni, au-delà de ce montant en devise de cotation.
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
    const k = Math.floor(t.t[i] / slot);
    const g = slots.get(k) ?? [0, 0, 0];
    g[0] += t.p[i] * t.q[i];
    g[side > 0 ? 1 : 2] += t.q[i];
    slots.set(k, g);
    const pk = t.t[i] * 2 + (side > 0 ? 1 : 0);
    const pr = prints.get(pk) ?? [0, 0];
    pr[0] += t.p[i] * t.q[i];
    pr[1] += t.q[i];
    prints.set(pk, pr);
  }
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const rows = [...slots].map(([k, [pq, buy, sell]]) => [k * slot, pq / (buy + sell), r3(buy), r3(sell)]);
  const live = s.engine.flow.bigThreshold;
  const sizes = [...prints.values()].map((p) => p[1]).sort((a, b) => a - b);
  const threshold = Number.isFinite(live) ? live : sizes[Math.floor(sizes.length * 0.995)] ?? Infinity;
  const min = Math.max(0, num(q.min, 0));
  const big = [...prints]
    .filter(([, [pq, qty]]) => (min > 0 ? pq >= min : qty >= threshold))
    .map(([k, [pq, qty]]) => [Math.floor(k / 2), pq / qty, r3(qty), k % 2 ? 1 : -1])
    .slice(-3000);
  return { slot, rows, big, min, threshold: Number.isFinite(threshold) ? threshold : null };
}

// Profils des journées terminées, mis en cache par magasin de trades et par taille de tranche :
// seule la session du jour est recalculée à chaque requête.
const profileCache = new WeakMap();

export async function profiles(s, q) {
  const now = nowOf(s);
  const to = Math.min(num(q.to, now), now);
  const bucket = num(q.bucket, s.cfg.footprint.bucket);
  if (q.mode === 'range') return rangeProfile(s, { from: num(q.from, to - HOUR), to, bucket });
  const from = Math.floor(Math.max(num(q.from, to - DAY), to - 14 * DAY) / DAY) * DAY;
  if (!profileCache.has(s.store)) profileCache.set(s.store, new Map());
  const cache = profileCache.get(s.store);
  const sessions = [];
  let partial = false;
  for (let d = from; d < to; d += DAY) {
    const key = `${bucket}:${d}`;
    const done = d + DAY <= now;
    if (done && cache.has(key)) {
      sessions.push(cache.get(key));
      continue;
    }
    // Jour d'archive pas encore téléchargé : chargement lancé en tâche de fond, les sessions
    // disponibles sont renvoyées tout de suite (le client redemande toutes les 15 s).
    const store = s.store;
    if (store.backFrom !== null && d < store.backFrom && !store.hasDay(d)) {
      partial = true;
      if (!store.offline) store.day(d).catch(() => {});
      continue;
    }
    const r = await s.store.getRange(d, Math.min(to, d + DAY), { maxDays: 1 });
    partial ||= r.partial;
    const prof = new SessionProfiler(bucket);
    const t = r.trades;
    for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
    const [session] = prof.list();
    if (!session) continue;
    if (done && !r.partial) cache.set(key, session);
    sessions.push(session);
  }
  return { bucket, partial, sessions };
}

// Profil unique de la plage visible (3 jours au plus), comme le « visible range » de TradingView.
async function rangeProfile(s, { from, to, bucket }) {
  const r = await s.store.getRange(from, to, { maxDays: 3 });
  const prof = new SessionProfiler(bucket, { range: [from, to] });
  const t = r.trades;
  for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
  return { bucket, partial: r.partial, sessions: prof.list() };
}

// Ancrage du VWAP journalier : sommes Σ p·q, Σ p²·q et Σ q de 00:00 UTC jusqu'à `t` (début de la
// première bougie chargée), tirées des klines 1 min (volume en cotation / volume = VWAP exact de la
// minute). Sans lui, le VWAP du jour ne partirait que de la première bougie chargée.
export async function vwapAnchor(s, q) {
  const t = Math.floor(num(q.t, nowOf(s)) / 60_000) * 60_000;
  const day = Math.floor(t / DAY) * DAY;
  if (t <= day) return { day, t: day, pv: 0, p2v: 0, v: 0 };
  const rows = await s.rest.klines(s.cfg.symbol, '1m', { startTime: day, endTime: t - 1, limit: 1500 });
  let pv = 0;
  let p2v = 0;
  let v = 0;
  for (const k of rows) {
    const vol = Number(k[5]);
    if (!(vol > 0)) continue;
    const quote = Number(k[7]);
    pv += quote;
    p2v += (quote * quote) / vol; // VWAP de la minute² × volume (variance intra-minute ignorée)
    v += vol;
  }
  return { day, t, pv, p2v, v };
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
