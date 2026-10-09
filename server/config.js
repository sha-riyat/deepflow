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
  record: env.RECORD === '1', // enregistre les frames (gzip) pour replay et backtest
  dataDir: path.resolve(ROOT, env.DATA_DIR ?? 'data'),
  replay: env.REPLAY ?? null, // chemin d'un enregistrement .ndjson.gz à rejouer
  speed: num(env.SPEED, 1), // vitesse du replay

  footprint: {
    tfMs: num(env.TF_MS, 60_000), // durée d'une bougie footprint
    bucket: env.FP_BUCKET ? Number(env.FP_BUCKET) : null, // tranche d'une cellule ; null = 2 × heatmap
  },

  flow: {
    imbBuckets: 10, // profondeur (en tranches) du déséquilibre du carnet
    bigPrintPct: 0.995, // un print est « gros » au-delà de ce percentile
    bigPrintMinSamples: 300, // prints observés avant d'activer la détection
    wallMult: 5, // mur = niveau ≥ wallMult × médiane des niveaux visibles
    wallMinMs: 10_000, // persistance minimale d'un mur
    lookbackMs: 300_000, // mémoire glissante du moteur (5 min)
  },

  setups: {
    absorption: {
      enabled: true,
      windowMs: 15_000, // fenêtre d'observation de l'agression sur le mur
      nearBuckets: 2, // distance max entre le mur et le meilleur prix
      volMult: 3, // volume agressif ≥ volMult × la normale sur la même durée
      confirmMs: 2_000, // delta de confirmation (doit s'être retourné)
      minWallKeep: 0.5, // le mur doit garder ≥ 50 % de sa taille max
    },
    breakout: {
      enabled: true,
      rangeMs: 300_000, // range de référence (plus haut / plus bas 5 min)
      excludeMs: 10_000, // exclut les dernières secondes du range
      windowMs: 10_000, // fenêtre du delta d'impulsion
      deltaZ: 2, // z-score minimal du delta 10 s
      minImb: 0.15, // déséquilibre minimal du carnet dans le sens du trade
      vwapFilter: true, // long seulement au-dessus du VWAP, short en dessous
    },
  },

  risk: {
    equity: num(env.EQUITY, 1000), // capital du compte (devise de cotation, ex. USDT)
    riskPct: num(env.RISK_PCT, 0.5), // risque par trade en % du capital
    maxLeverage: num(env.MAX_LEV, 5),
    minStopPct: num(env.MIN_STOP_PCT, market === 'spot' ? 0.6 : 0.3), // stop minimal en % du prix
    t1R: 1.5, // première cible (50 % de la position), stop remonté au point d'entrée ensuite
    t2R: 3, // seconde cible (50 % restants)
    maxFeeR: 0.35, // rejette le signal si les frais estimés dépassent cette fraction de R
    takerFee: num(env.TAKER_FEE, market === 'spot' ? 0.001 : 0.0005),
    maxHoldMs: 30 * 60_000, // sortie forcée au-delà
    cooldownMs: 60_000, // délai minimal entre deux signaux
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
