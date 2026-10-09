// Règles de cotation du symbole (pas de prix, pas de quantité, minimums) via exchangeInfo.
import { ENDPOINTS } from './config.js';

const FALLBACK = { tickSize: 0.01, stepSize: 0.001, minQty: 0.001, minNotional: 5 };

export async function loadSymbolInfo(market, symbol) {
  const ep = ENDPOINTS[market];
  const url = market === 'spot' ? `${ep.info}?symbol=${symbol}` : ep.info;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const s = body.symbols.find((x) => x.symbol === symbol);
    if (!s) throw new Error(`symbole ${symbol} introuvable`);
    const f = Object.fromEntries(s.filters.map((x) => [x.filterType, x]));
    const notional = f.MIN_NOTIONAL ?? f.NOTIONAL ?? {};
    const lot = f.LOT_SIZE; // MARKET_LOT_SIZE a un stepSize nul en spot
    return {
      symbol,
      base: s.baseAsset,
      quote: s.quoteAsset,
      tickSize: Number(f.PRICE_FILTER.tickSize),
      stepSize: Number(lot.stepSize),
      minQty: Number(lot.minQty),
      minNotional: Number(notional.notional ?? notional.minNotional ?? FALLBACK.minNotional),
    };
  } catch (err) {
    console.warn(`exchangeInfo indisponible (${err.message}), règles par défaut utilisées`);
    return { symbol, base: symbol.replace(/USDT$|USDC$/, ''), quote: 'USDT', ...FALLBACK };
  }
}
