// Backtest : rejoue un enregistrement à vitesse maximale dans le moteur et affiche
// chaque signal puis les statistiques. Usage : npm run backtest -- data/<fichier>.ndjson.gz
import { config } from './config.js';
import { loadSymbolInfo } from './symbol.js';
import { readRecording } from './recorder.js';
import { Engine } from './engine/engine.js';
import { formatSignal, formatStats } from './format.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage : npm run backtest -- <enregistrement.ndjson.gz>');
  process.exit(1);
}

let engine = null;
let frames = 0;
let rejections = 0;
let first = null;
let last = null;

for await (const obj of readRecording(file)) {
  if (obj.meta) {
    Object.assign(config, { symbol: obj.symbol, market: obj.market, bucket: obj.bucket, frameMs: obj.frameMs });
    const info = await loadSymbolInfo(config.market, config.symbol);
    engine = new Engine(config, info);
    engine.on('signal', (s) => {
      if (s.status === 'closed') console.log(formatSignal(s) + '\n');
    });
    engine.on('rejection', () => rejections++);
    continue;
  }
  if (!engine) throw new Error('Enregistrement sans métadonnées');
  first ??= obj.t;
  last = obj.t;
  engine.onFrame(obj);
  frames++;
}

if (!engine) process.exit(1);
const hours = ((last - first) / 3_600_000).toFixed(2);
console.log(`${frames} frames · ${hours} h de marché · ${rejections} setups refusés par le plan de risque`);
if (engine.tracker.active) console.log(`Signal encore ouvert en fin de fichier :
${formatSignal(engine.tracker.active)}
`);
console.log(formatStats(engine.tracker.stats()));
