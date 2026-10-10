// Point d'entrée : sessions (une par symbole suivi en direct, replay des archives, ou enregistrement
// rejoué) -> navigateurs (SSE) + API locale.
import path from 'node:path';
import { config } from './config.js';
import { readMeta } from './recorder.js';
import { Hub } from './hub.js';
import { Session } from './session.js';
import { Alerts } from './alerts.js';
import { Sessions } from './sessions.js';
import { createServer } from './http.js';

const mode = config.replay ? 'replay' : 'live';
if (config.replay) {
  const meta = await readMeta(config.replay);
  if (!meta) throw new Error(`Enregistrement sans métadonnées : ${config.replay}`);
  Object.assign(config, { symbol: meta.symbol, market: meta.market, bucket: meta.bucket, frameMs: meta.frameMs });
}

const alerts = new Alerts(path.join(config.dataDir, 'alerts.json'));
const sessions = new Sessions(config, alerts);
if (config.replay) {
  // Enregistrement rejoué : une seule session, servie pour toute clé.
  sessions.recording = new Session(config, { mode, rest: sessions.rests[config.market], hub: new Hub(), alerts });
  sessions.recording.key = 'replay';
}

alerts.on('fired', (event) => {
  console.log(`ALERTE ${event.symbol} · ${event.label} · ${event.text}`);
  sessions.event('alert', event);
  sessions.state('alerts', alerts.list());
});

const server = createServer({ cfg: config, sessions, alerts });
server.listen(config.port, config.host, async () => {
  console.log(`deepflow ${mode} ${config.market} → http://${config.host}:${config.port}`);
  if (sessions.recording) await sessions.recording.start(config.symbol);
  else {
    sessions.get(); // session par défaut (symbole de départ), puis celles des alertes actives
    sessions.watchAlerts();
  }
});

process.on('SIGINT', () => {
  for (const s of [sessions.recording, ...sessions.map.values()]) s?.stop();
  setTimeout(() => process.exit(0), 200); // laisse gzip vider son tampon
});
