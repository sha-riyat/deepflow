// Génère un enregistrement fictif (de 00:00 UTC à maintenant, une frame par seconde) pour tester
// l'interface hors ligne : node gen-enregistrement.mjs data/rec.ndjson.gz, puis
// REPLAY=data/rec.ndjson.gz SPEED=0 npm run collector (Binance n'est alors pas contacté pour le flux).
import fs from 'node:fs';
import zlib from 'node:zlib';
const out = process.argv[2];
const end = Date.now();
const start = Math.floor(end / 86400000) * 86400000;
let p = 60000, id = 1, seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const lines = [JSON.stringify({ meta: true, symbol: 'BTCUSDT', market: 'futures', bucket: 5, frameMs: 1000 })];
for (let t = start; t < end; t += 1000) {
  const tr = [];
  const n = 1 + Math.floor(rnd() * 4);
  for (let k = 0; k < n; k++) {
    p += (rnd() - 0.5) * 12;
    tr.push([Math.round(p * 10) / 10, Math.round(rnd() * 2000) / 1000 + 0.001, rnd() > 0.5 ? 1 : -1, t + k * 100, id++]);
  }
  const mid = Math.round(p / 5) - 150;
  const b = Array.from({ length: 150 }, () => Math.round(rnd() * 30 * 1000) / 1000);
  const a = Array.from({ length: 150 }, () => Math.round(rnd() * 30 * 1000) / 1000);
  lines.push(JSON.stringify({ t, bid: Math.round(p * 10) / 10 - 0.1, ask: Math.round(p * 10) / 10, r0: mid, b: [...b, ...Array(150).fill(0)], a: [...Array(150).fill(0), ...a], tr, liq: [] }));
}
fs.writeFileSync(out, zlib.gzipSync(lines.join('\n') + '\n'));
console.log(lines.length, 'lignes');
