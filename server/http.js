// Serveur HTTP local du collecteur : flux SSE et API (état du flux, historique, heatmap,
// symbole, alertes). N'écoute que sur 127.0.0.1.
import http from 'node:http';
import * as Q from './queries.js';

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

async function route(req, res, ctx) {
  const { hub, session, alerts, rest } = ctx;
  const url = new URL(req.url, 'http://localhost');
  const q = Object.fromEntries(url.searchParams);
  const key = `${req.method} ${url.pathname}`;
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/tickers' && !session.flow) {
    return json(res, 503, { error: 'session en cours de démarrage' });
  }
  switch (key) {
    case 'GET /stream':
      return hub.attach(req, res);
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
      return json(res, 200, await Q.tickers(rest));
    case 'GET /api/heatmap': {
      const r = Q.heatmap(session, q);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'X-Heat': JSON.stringify({ cols: r.cols, rows: r.rows, step: r.step, scale: r.scale, start: session.heat.start }),
      });
      return res.end(r.buf);
    }
    case 'POST /api/symbol': {
      if (session.mode !== 'live') throw new Error('changement de symbole indisponible en replay');
      const { symbol } = await readJson(req);
      const s = String(symbol ?? '').toUpperCase();
      if (!/^[A-Z0-9]{2,20}$/.test(s)) throw new Error('symbole invalide');
      await session.start(s);
      return json(res, 200, session.meta());
    }
    case 'GET /api/alerts':
      return json(res, 200, alerts.list());
    case 'POST /api/alerts': {
      const item = alerts.add(await readJson(req));
      hub.state('alerts', alerts.list());
      return json(res, 200, item);
    }
    case 'DELETE /api/alerts':
      alerts.remove(String(q.id));
      hub.state('alerts', alerts.list());
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
