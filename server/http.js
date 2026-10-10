// Serveur HTTP local du collecteur : flux SSE et API (état du flux, historique, heatmap,
// symbole, alertes). N'écoute que sur 127.0.0.1.
import http from 'node:http';
import * as Q from './queries.js';
import { SPEEDS } from './replay.js';
import { MARKETS, REPLAY_KEY } from './sessions.js';

const DAY = 86_400_000;
const FIRST_ARCHIVE = Date.UTC(2019, 8, 1); // premières archives Binance (futures USD-M : sept. 2019)

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// Corps JSON limité ; exiger application/json force un preflight CORS jamais accordé,
// donc un site tiers ne peut pas écrire ici.
function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type']).startsWith('application/json')) return reject(new Error('application/json attendu'));
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
  });
}

// Requêtes sans session (globales) ; les autres visent la session `?s=` (direct par défaut).
const GLOBAL = new Set(['/stream', '/api/tickers', '/api/alerts', '/api/sessions', '/api/replay', '/api/replay/stop']);

// Flux SSE d'un navigateur : une seule connexion pour toutes ses sessions (`?s=clé1,clé2`), les
// événements de chacune préfixés par sa clé (les navigateurs limitent les connexions par site).
function stream(req, res, { sessions }, q) {
  const keys = [...new Set(String(q.s ?? sessions.defaultKey).split(','))].slice(0, 12);
  const hubs = keys.map((k) => [k, sessions.get(k)]);
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  for (const [k, s] of hubs) {
    if (s) s.hub.attach(req, res, `${k}|`);
    else res.write(`event: ${k}|status\ndata: ${JSON.stringify('aucun replay en cours')}\n\n`);
  }
}

async function route(req, res, ctx) {
  const { sessions, alerts } = ctx;
  const url = new URL(req.url, 'http://localhost');
  const q = Object.fromEntries(url.searchParams);
  const key = `${req.method} ${url.pathname}`;
  if (url.pathname === '/stream') return stream(req, res, ctx, q);
  let session = null;
  if (url.pathname.startsWith('/api/') && !GLOBAL.has(url.pathname)) {
    session = sessions.get(q.s ?? sessions.defaultKey);
    if (!session) throw new Error('aucun replay en cours');
    if (!session.flow) return json(res, 503, { error: 'session en cours de démarrage' });
  }
  switch (key) {
    case 'GET /api/sessions':
      return json(res, 200, { default: sessions.recording ? 'replay' : sessions.defaultKey, recording: Boolean(sessions.recording), live: sessions.live().map((s) => s.key) });
    case 'GET /api/state':
      return json(res, 200, { ...session.state(), meta: session.meta(), history: session.store.status(), mark: session.mark });
    case 'GET /api/bars':
      return json(res, 200, await Q.bars(session, q));
    case 'GET /api/bubbles':
      return json(res, 200, await Q.bubbles(session, q));
    case 'GET /api/profile':
      return json(res, 200, await Q.profiles(session, q));
    case 'GET /api/liquidations':
      return json(res, 200, Q.liquidations(session, q));
    case 'GET /api/vwap':
      return json(res, 200, await Q.vwapAnchor(session, q));
    case 'GET /api/spotdelta':
      return json(res, 200, await Q.spotDelta(session, q));
    case 'GET /api/oi':
      return json(res, 200, await Q.openInterest(session, q));
    case 'GET /api/tickers':
      return json(res, 200, await Q.tickers(sessions.rests[MARKETS.includes(q.market) ? q.market : 'futures'], q.market === 'spot' ? 'spot' : 'futures'));
    case 'GET /api/heatmap': {
      const r = Q.heatmap(session, q);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'X-Heat': JSON.stringify({ cols: r.cols, rows: r.rows, step: r.step, scale: r.scale, start: session.heat.start }),
      });
      return res.end(r.buf);
    }
    case 'POST /api/replay': {
      // Replay des archives : session « replay » à part (les graphiques en direct continuent),
      // archive chargée en tâche de fond, état et erreurs diffusés dans son flux.
      if (sessions.recording) throw new Error('déjà en replay d’un enregistrement');
      const body = await readJson(req);
      const market = MARKETS.includes(body.market) ? body.market : 'futures';
      const symbol = String(body.symbol ?? '').toUpperCase();
      if (!/^[A-Z0-9]{2,20}$/.test(symbol)) throw new Error('symbole invalide');
      const from = Math.floor(Number(body.from) / 1000) * 1000;
      const today = Math.floor(Date.now() / DAY) * DAY;
      if (!(from >= FIRST_ARCHIVE && from < today)) throw new Error('date de départ invalide : un jour passé, jusqu’à hier');
      const speed = SPEEDS.includes(Number(body.speed)) ? Number(body.speed) : 1;
      sessions.startReplay({ market, symbol, from, speed });
      return json(res, 202, { ok: true, key: REPLAY_KEY });
    }
    case 'POST /api/replay/stop':
      sessions.stopReplay();
      return json(res, 200, { ok: true });
    case 'POST /api/replay/control': {
      const src = session.source;
      if (!session.archive || !src?.advanceTo) throw new Error('aucun replay des archives en cours');
      const { action, value } = await readJson(req);
      if (action === 'play') src.play();
      else if (action === 'pause') src.pause();
      else if (action === 'speed') src.setSpeed(Number(value));
      else if (action === 'step') {
        const to = Number(value);
        if (!(to > src.clock)) throw new Error('instant invalide');
        await src.advanceTo(to);
      } else throw new Error('action inconnue');
      return json(res, 200, { t: src.clock, speed: src.speed, playing: src.playing });
    }
    case 'GET /api/alerts':
      return json(res, 200, alerts.list());
    case 'POST /api/alerts': {
      const item = alerts.add(await readJson(req));
      sessions.state('alerts', alerts.list());
      sessions.watchAlerts();
      return json(res, 200, item);
    }
    case 'DELETE /api/alerts':
      alerts.remove(String(q.id));
      sessions.state('alerts', alerts.list());
      return json(res, 200, { ok: true });
    default:
      // L'interface est servie par Next.js (dossier web/).
      return json(res, 404, { error: 'not found' });
  }
}

export function createServer(ctx) {
  // Accès local direct, ou relayé par l'interface Next.js (port WEB_PORT, 3000 par défaut).
  const ports = [ctx.cfg.port, Number(process.env.WEB_PORT ?? 3000)];
  const allowedHosts = new Set(ports.flatMap((p) => [`127.0.0.1:${p}`, `localhost:${p}`]));
  return http.createServer((req, res) => {
    // Protège contre le DNS rebinding : seul l'accès local direct est servi.
    if (!allowedHosts.has(req.headers.host)) return json(res, 403, { error: 'host refusé' });
    route(req, res, ctx).catch((err) => {
      if (!res.headersSent) json(res, 400, { error: err.message });
      else res.end();
    });
  });
}
