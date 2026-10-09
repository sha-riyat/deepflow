// Archives quotidiennes gratuites de Binance (data.binance.vision) : téléchargement,
// vérification SHA-256, décompression et conversion des trades agrégés en colonnes.
import crypto from 'node:crypto';
import readline from 'node:readline';
import { openSingleEntry } from './zip.js';
import { Trades } from './trades.js';

const ROOT = 'https://data.binance.vision/data';

export function visionUrl(market, symbol, day) {
  const path = market === 'spot' ? 'spot' : 'futures/um';
  return `${ROOT}/${path}/daily/aggTrades/${symbol}/${symbol}-aggTrades-${day}.zip`;
}

// Retourne les trades du jour, ou null si l'archive n'est pas (encore) publiée.
export async function fetchVisionDay(market, symbol, day) {
  const url = visionUrl(market, symbol, day);
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Binance Vision HTTP ${res.status} pour ${day}`);
  const zip = Buffer.from(await res.arrayBuffer());

  const sum = await fetch(`${url}.CHECKSUM`).then((r) => (r.ok ? r.text() : null));
  if (sum) {
    const expected = sum.trim().split(/\s+/)[0];
    const actual = crypto.createHash('sha256').update(zip).digest('hex');
    if (expected !== actual) throw new Error(`somme de contrôle invalide pour ${day}`);
  }
  return parseAggTradesCsv(openSingleEntry(zip).stream);
}

// Colonnes : id, prix, quantité, premier id, dernier id, temps, acheteur maker[, best match].
// Les archives spot récentes donnent le temps en microsecondes.
export async function parseAggTradesCsv(stream) {
  const out = new Trades(1 << 20);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const c0 = line.charCodeAt(0);
    if (!(c0 >= 48 && c0 <= 57)) continue; // entête ou ligne vide
    const f = line.split(',');
    let t = Number(f[5]);
    if (t > 1e14) t = Math.floor(t / 1000);
    const maker = f[6] === 'true' || f[6] === 'True';
    out.push(t, Number(f[1]), Number(f[2]), maker ? -1 : 1, Number(f[0]));
  }
  return out;
}
