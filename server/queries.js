// Requêtes d'historique : bougies (klines ou trades), bulles de trades, profils de session,
// heatmap, open interest, delta spot, tickers.
import { BarBuilder, BAR_TYPES, klineToWire } from '../shared/bars.js';
import { SessionProfiler } from '../shared/profile.js';
import { rangeBucket } from '../shared/auction.js';
import { PERIODS, periodStart } from '../shared/sessions.js';
import { keyLevels } from '../shared/keylevels.js';
import { BinanceRest } from './history/rest.js';

const HOUR = 3_600_000;
const DAY = 86_400_000;
export const KLINE = {
  1000: '1s', 60_000: '1m', 180_000: '3m', 300_000: '5m', 900_000: '15m', 1_800_000: '30m',
  3_600_000: '1h', 7_200_000: '2h', 14_400_000: '4h', 21_600_000: '6h', 43_200_000: '12h',
  86_400_000: '1d', 604_800_000: '1w',
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));

export async function bars(s, q) {
  const type = BAR_TYPES.includes(q.type) ? q.type : 'time';
  const param = num(q.param, 60_000);
  if (!(param > 0)) throw new Error('paramètre invalide');
  const fp = Math.max(0, num(q.fp, 0));
  const now = s.now();
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
  const now = s.now();
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
  const live = s.flow.bigThreshold;
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

// Sous-périodes TPO acceptées (minutes).
const TPO_MINUTES = [15, 30, 60];

export async function profiles(s, q) {
  const now = s.now();
  const to = Math.min(num(q.to, now), now);
  const bucket = num(q.bucket, s.cfg.footprint.bucket);
  const tpoMs = (TPO_MINUTES.includes(num(q.tpo, 30)) ? num(q.tpo, 30) : 30) * 60_000;
  if (q.mode === 'range') return rangeProfile(s, { from: num(q.from, to - HOUR), to, bucket, tpoMs, rows: num(q.rows, 0) });
  const from = Math.floor(Math.max(num(q.from, to - DAY), to - 14 * DAY) / DAY) * DAY;
  if (!profileCache.has(s.store)) profileCache.set(s.store, new Map());
  const cache = profileCache.get(s.store);
  const sessions = [];
  let partial = false;
  for (let d = from; d < to; d += DAY) {
    const key = `${bucket}:${tpoMs}:${d}`;
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
    const prof = new SessionProfiler(bucket, { tpoMs });
    const t = r.trades;
    for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
    const [session] = prof.list();
    if (!session) continue;
    if (done && !r.partial) cache.set(key, session);
    sessions.push(session);
  }
  return { bucket, partial, sessions };
}

// Profil unique d'une plage libre (profil visible, profil à plage fixe dessiné) : 10 jours au plus,
// comme le « visible range » de TradingView. Les trades sont lus jour par jour, sans jamais réunir la
// plage en mémoire. `rows` > 0 : taille de ligne choisie d'après la hauteur réelle des trades de la
// plage (environ `rows` lignes, jamais plus fines que la tranche du collecteur), ce qui demande une
// première lecture pour trouver le plus haut et le plus bas ; sinon la tranche demandée.
export const RANGE_DAYS = 10;
async function rangeProfile(s, { from, to, bucket, tpoMs, rows }) {
  const opts = { maxDays: RANGE_DAYS };
  if (rows > 0) {
    let lo = Infinity;
    let hi = -Infinity;
    await s.store.forEachChunk(from, to, opts, (t) => {
      for (let i = 0; i < t.n; i++) {
        if (t.p[i] < lo) lo = t.p[i];
        if (t.p[i] > hi) hi = t.p[i];
      }
    });
    if (hi >= lo) bucket = rangeBucket(lo, hi, s.cfg.bucket ?? bucket, rows);
  }
  const prof = new SessionProfiler(bucket, { tpoMs, range: [from, to] });
  const partial = await s.store.forEachChunk(from, to, opts, (t) => {
    for (let i = 0; i < t.n; i++) prof.push(t.t[i], t.p[i], t.q[i], t.s[i]);
  });
  return { bucket, partial, sessions: prof.list() };
}

// Ancrage du VWAP par période (jour, semaine ou mois UTC) : sommes Σ p·q, Σ p²·q et Σ q du début
// de la période jusqu'à `t` (début de la première bougie chargée), tirées des klines (volume en
// cotation / volume = VWAP exact de la kline) : heures entières en 1 h, reste de l'heure en 1 min.
// Sans lui, le VWAP ne partirait que de la première bougie chargée. Les bandes ignorent la
// dispersion à l'intérieur de chaque kline (un peu plus étroites que sur les trades).
export async function vwapAnchor(s, q) {
  const t = Math.floor(Math.min(num(q.t, s.now()), s.now()) / 60_000) * 60_000;
  const period = PERIODS.includes(q.period) ? q.period : 'day';
  const start = periodStart(t, period);
  const out = { period, start, t, pv: 0, p2v: 0, v: 0 };
  const add = (rows) => {
    for (const k of rows) {
      const vol = Number(k[5]);
      if (!(vol > 0)) continue;
      const quote = Number(k[7]);
      out.pv += quote;
      out.p2v += (quote * quote) / vol; // VWAP de la kline² × volume
      out.v += vol;
    }
  };
  const hour = Math.max(start, Math.floor(t / HOUR) * HOUR);
  if (hour > start) add(await s.rest.klines(s.cfg.symbol, '1h', { startTime: start, endTime: hour - 1, limit: 1000 }));
  if (t > hour) add(await s.rest.klines(s.cfg.symbol, '1m', { startTime: hour, endTime: t - 1, limit: 60 }));
  return out;
}

// Niveaux clés (ouvertures de la semaine et du mois, hauts et bas précédents) : bougies
// journalières Binance jusqu'à aujourd'hui (dont seule l'ouverture est gardée : rien du futur en
// replay), calculés une fois par jour et par session.
export async function levels(s) {
  const today = periodStart(s.now(), 'day');
  const key = `${s.cfg.symbol}:${today}`; // la session « replay » change de symbole
  if (s.levelsCache?.key === key) return s.levelsCache.value;
  const rows = await s.rest.klines(s.cfg.symbol, '1d', { endTime: today, limit: 70 });
  const days = rows.map((k) => ({ t0: k[0], o: Number(k[1]), h: Number(k[2]), l: Number(k[3]) }));
  s.levelsCache = { key, value: keyLevels(days, today) };
  return s.levelsCache.value;
}

// Delta du marché spot du même actif (klines spot Binance : volume acheteur taker exact par bougie),
// pour comparer le CVD spot (achat réel) au CVD perp (levier). Lignes [début, achats, ventes].
let spotRest = null;
export async function spotDelta(s, q) {
  const param = num(q.param, 60_000);
  const interval = KLINE[param];
  if (!interval) throw new Error('intervalle non disponible en klines spot');
  spotRest ??= new BinanceRest('spot');
  const to = Math.min(num(q.to, s.now()), s.now());
  const from = Math.max(num(q.from, to - 1000 * param), to - 1000 * param);
  const rows = await spotRest.klines(s.cfg.symbol, interval, { startTime: Math.floor(from), endTime: Math.floor(to), limit: 1000 });
  return { symbol: s.cfg.symbol, rows: rows.map((k) => [k[0], Number(k[9]), Number(k[5]) - Number(k[9])]) };
}

export function heatmap(s, q) {
  const now = s.now();
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
  const now = s.now(); // en replay : rien au-delà de l'heure rejouée
  const rows = await s.rest.openInterest(s.cfg.symbol, period, { endTime: Math.min(num(q.to, now), now), limit: 500 });
  return { period, rows: rows.map((r) => [r.timestamp, Number(r.sumOpenInterest)]) };
}

// Prime et financement (futures) : indice de prime en bougies (écart du perp à l'indice spot,
// ce qui détermine le financement) et taux de financement passés. En replay, rien au-delà de
// l'heure rejouée (bougie de prime en cours écartée).
const PREMIUM = ['1m', '5m', '15m', '1h', '4h', '1d'];
export async function funding(s, q) {
  if (s.cfg.market !== 'futures') return { interval: null, premium: [], rates: [] };
  const interval = PREMIUM.includes(q.interval) ? q.interval : '5m';
  const now = s.now();
  const to = Math.min(num(q.to, now), now);
  const [klines, rates] = await Promise.all([
    s.rest.premiumKlines(s.cfg.symbol, interval, { endTime: to, limit: 1000 }),
    s.rest.fundingRates(s.cfg.symbol, { endTime: to, limit: 1000 }),
  ]);
  const live = s.mode === 'live';
  return {
    interval,
    premium: klines.filter((k) => live || k[6] < now).map((k) => [k[0], Number(k[4])]),
    rates: rates.map((r) => [r.fundingTime, Number(r.fundingRate)]),
  };
}

// CVD multi-plateformes : volumes agressifs par minute de Bybit et d'OKX, depuis le lancement de
// la session en direct (rien en replay).
export function venues(s, q) {
  if (!s.venues) return { since: null, rows: [], status: null };
  const now = s.now();
  const to = Math.min(num(q.to, now), now);
  const from = num(q.from, to - 86_400_000);
  return { since: s.venues.book.since, rows: s.venues.book.range(from, to), status: s.venues.status };
}

// Tickers 24 h du marché (futures ou spot), en cache 5 s par marché.
const tickerCache = new Map();
export async function tickers(rest, market = 'futures') {
  const hit = tickerCache.get(market);
  if (hit && Date.now() - hit.t < 5000) return hit.data;
  const rows = await rest.tickers();
  const data = rows
    .filter((r) => r.symbol.endsWith('USDT') && Number(r.quoteVolume) > 0)
    .map((r) => ({ symbol: r.symbol, last: Number(r.lastPrice), change: Number(r.priceChangePercent), volume: Number(r.quoteVolume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 200);
  tickerCache.set(market, { t: Date.now(), data });
  return data;
}

// Liquidations enregistrées sur la plage (direct uniquement : pas d'historique public Binance).
export function liquidations(s, q) {
  const now = s.now();
  const to = Math.min(num(q.to, now), now);
  const from = num(q.from, to - 86_400_000);
  return { rows: s.liqs.range(from, to), since: s.liqs.rows[0]?.[0] ?? null };
}
