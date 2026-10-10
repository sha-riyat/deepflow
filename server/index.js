// Point d'entrée : session (direct ou replay) -> navigateur (SSE) + API locale.
import path from 'node:path';
import { config } from './config.js';
import { readMeta } from './recorder.js';
import { Hub } from './hub.js';
import { Session } from './session.js';
import { Alerts } from './alerts.js';
import { BinanceRest } from './history/rest.js';
import { createServer } from './http.js';

const mode = config.replay ? 'replay' : 'live';
if (config.replay) {
  const meta = await readMeta(config.replay);
  if (!meta) throw new Error(`Enregistrement sans métadonnées : ${config.replay}`);
  Object.assign(config, { symbol: meta.symbol, market: meta.market, bucket: meta.bucket, frameMs: meta.frameMs });
}

const hub = new Hub();
const rest = new BinanceRest(config.market);
const alerts = new Alerts(path.join(config.dataDir, 'alerts.json'));
const session = new Session(config, { mode, rest, hub, alerts });

alerts.on('fired', (event) => {
  console.log(`ALERTE ${event.symbol} · ${event.label} · ${event.text}`);
  hub.event('alert', event);
  hub.state('alerts', alerts.list());
});
hub.state('alerts', alerts.list());

const server = createServer({ cfg: config, hub, session, alerts, rest });
server.listen(config.port, config.host, async () => {
  console.log(`deepflow ${mode} ${config.market} → http://${config.host}:${config.port}`);
  await session.start(config.symbol);
});

process.on('SIGINT', () => {
  session.stop();
  setTimeout(() => process.exit(0), 200); // laisse gzip vider son tampon
});
