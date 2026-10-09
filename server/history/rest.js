// Accès REST à Binance avec une file d'attente qui respecte les limites de poids (en lisant le
// poids consommé renvoyé par Binance) :
// bougies (klines), trades agrégés, open interest, tickers 24 h.
// weightLimit : poids IP par minute autorisé par Binance (exchangeInfo, rateLimits).
const BASE = {
  futures: { api: 'https://fapi.binance.com/fapi/v1', data: 'https://fapi.binance.com/futures/data', minGapMs: 250, weightLimit: 2400 },
  spot: { api: 'https://api.binance.com/api/v3', data: null, minGapMs: 100, weightLimit: 6000 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BinanceRest {
  constructor(market) {
    this.market = market;
    this.base = BASE[market];
    this.queue = Promise.resolve();
    this.lastCall = 0;
    this.pausedUntil = 0;
    this.usedWeight = 0;
  }

  // Les appels sont sérialisés et espacés ; un 429/418 met la file en pause.
  get(path, params = {}, { data = false } = {}) {
    const root = data ? this.base.data : this.base.api;
    if (!root) return Promise.reject(new Error('donnée indisponible sur ce marché'));
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
    const url = `${root}${path}?${qs}`;
    const run = async () => {
      const wait = Math.max(this.lastCall + this.base.minGapMs, this.pausedUntil) - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastCall = Date.now();
      const res = await fetch(url);
      if (res.status === 429 || res.status === 418) {
        const retry = Number(res.headers.get('retry-after') ?? 60) * 1000;
        this.pausedUntil = Date.now() + retry;
        throw new Error(`limite Binance atteinte, pause ${retry / 1000} s`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} sur ${path}`);
      // Poids déjà consommé sur la minute en cours : au-delà de 80 %, pause jusqu'à la minute suivante.
      const used = Number(res.headers.get('x-mbx-used-weight-1m'));
      this.usedWeight = used || this.usedWeight;
      if (used > this.base.weightLimit * 0.8) this.pausedUntil = Math.ceil(Date.now() / 60_000) * 60_000 + 1000;
      return res.json();
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }

  klines(symbol, interval, { endTime, startTime, limit = 1500 } = {}) {
    return this.get('/klines', { symbol, interval, endTime, startTime, limit: this.market === 'spot' ? Math.min(limit, 1000) : limit });
  }

  // Trades agrégés de [from, to) : fenêtre d'une heure puis pagination par identifiant.
  async aggTrades(symbol, from, to, onRows) {
    let cursor = null;
    let windowStart = from;
    for (;;) {
      const params = cursor === null
        ? { symbol, startTime: windowStart, endTime: Math.min(windowStart + 3_599_999, to - 1), limit: 1000 }
        : { symbol, fromId: cursor, limit: 1000 };
      const rows = await this.get('/aggTrades', params);
      if (rows.length === 0) {
        if (cursor !== null || windowStart + 3_600_000 >= to) return;
        windowStart += 3_600_000; // heure sans trade : fenêtre suivante
        continue;
      }
      const kept = rows.filter((r) => r.T >= from && r.T < to);
      if (kept.length) onRows(kept);
      const last = rows[rows.length - 1];
      if (last.T >= to - 1) return;
      if (rows.length < 1000) {
        if (cursor !== null) return; // plus rien après ce point
        windowStart += 3_600_000; // fenêtre épuisée : heure suivante
        if (windowStart >= to) return;
        continue;
      }
      cursor = last.a + 1;
    }
  }

  openInterest(symbol, period, { startTime, endTime, limit = 500 } = {}) {
    return this.get('/openInterestHist', { symbol, period, startTime, endTime, limit }, { data: true });
  }

  tickers() {
    return this.get('/ticker/24hr');
  }
}
