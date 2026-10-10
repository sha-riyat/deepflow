// Configuration, surchargeable par variables d'environnement pour les réglages courants.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

const market = env.MARKET ?? 'futures'; // 'futures' (perpétuels USD-M) | 'spot'

export const config = {
  market,
  symbol: (env.SYMBOL ?? 'BTCUSDT').toUpperCase(),
  bucket: env.BUCKET ? Number(env.BUCKET) : null, // tranche de la heatmap ; null = automatique selon le prix
  domLevels: 30, // niveaux affichés de chaque côté dans le DOM
  heatHours: num(env.HEAT_HOURS, 4), // profondeur de la heatmap gardée en mémoire
  rangeBuckets: num(env.RANGE, 150), // tranches envoyées de chaque côté du mid
  frameMs: num(env.FRAME_MS, 100), // durée d'une colonne de heatmap
  historyFrames: 2048, // colonnes renvoyées à un navigateur qui se connecte
  host: '127.0.0.1',
  port: num(env.COLLECTOR_PORT, 8787), // le port 3000 est celui de l'interface Next.js
  record: env.RECORD === '1', // enregistre les frames (gzip) pour les rejouer
  dataDir: path.resolve(ROOT, env.DATA_DIR ?? 'data'),
  replay: env.REPLAY ?? null, // chemin d'un enregistrement .ndjson.gz à rejouer
  speed: num(env.SPEED, 1), // vitesse du replay
  venues: env.VENUES !== '0', // CVD multi-plateformes : trades Bybit et OKX en direct (futures)

  footprint: {
    bucket: env.FP_BUCKET ? Number(env.FP_BUCKET) : null, // tranche d'une cellule ; null = 2 × heatmap
  },

  flow: {
    imbBuckets: 10, // profondeur (en tranches) du déséquilibre du carnet
    bigPrintPct: 0.995, // un print est « gros » au-delà de ce percentile
    bigPrintMinSamples: 300, // prints observés avant d'activer la détection
    wallMult: 5, // mur = niveau ≥ wallMult × médiane des niveaux visibles
    wallMinMs: 10_000, // persistance minimale d'un mur
    lookbackMs: 300_000, // mémoire glissante (5 min)
    deltaWinMs: 10_000, // fenêtre du delta dont on suit le z-score (alertes « delta anormal »)
  },
};

export const ENDPOINTS = {
  // Les flux profondeur et trades peuvent vivre sur des routes distinctes (cas des futures USD-M).
  spot: {
    depthWs: 'wss://stream.binance.com:9443/stream',
    tradeWs: 'wss://stream.binance.com:9443/stream',
    rest: 'https://api.binance.com/api/v3/depth',
    info: 'https://api.binance.com/api/v3/exchangeInfo',
    limit: 5000,
  },
  futures: {
    depthWs: 'wss://fstream.binance.com/public/stream',
    tradeWs: 'wss://fstream.binance.com/market/stream',
    rest: 'https://fapi.binance.com/fapi/v1/depth',
    info: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
    limit: 1000,
  },
};
