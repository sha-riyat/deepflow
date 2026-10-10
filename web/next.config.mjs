// Next.js sert l'interface ; le collecteur Node (port 8787) garde les WebSockets Binance,
// l'historique et l'API. /api et /stream lui sont relayés, l'interface reste sur une seule origine.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const collector = `http://127.0.0.1:${process.env.COLLECTOR_PORT ?? 8787}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La compression gzip met le flux SSE en tampon (les événements arrivent par paquets) ;
  // inutile de toute façon pour une application locale.
  compress: false,
  devIndicators: false,
  // Sinon `next dev` écrit AGENTS.md et CLAUDE.md dans web/ à chaque lancement.
  agentRules: false,
  // Le code partagé (../shared) est hors du dossier de l'application.
  turbopack: { root },
  outputFileTracingRoot: root,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${collector}/api/:path*` },
      { source: '/stream', destination: `${collector}/stream` },
    ];
  },
};

export default nextConfig;
