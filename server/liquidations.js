// Liquidations reçues en direct, conservées en mémoire et sur disque (Binance ne publie pas
// d'historique public des liquidations : l'historique commence au premier lancement).
// Format d'une ligne : [temps, prix, quantité, côté] ; côté -1 = position longue liquidée.
import fs from 'node:fs';
import path from 'node:path';

const MAX_MEMORY = 200_000;

export class LiquidationStore {
  constructor(dir, market, symbol) {
    this.file = path.join(dir, `liquidations-${symbol}-${market}.ndjson`);
    this.rows = [];
    if (fs.existsSync(this.file)) {
      for (const line of fs.readFileSync(this.file, 'utf8').split('\n')) {
        if (!line) continue;
        try {
          this.rows.push(JSON.parse(line));
        } catch {
          // ligne tronquée (arrêt brutal) : ignorée
        }
      }
      this.rows.sort((a, b) => a[0] - b[0]);
      if (this.rows.length > MAX_MEMORY) this.rows = this.rows.slice(-MAX_MEMORY);
    }
  }

  add(l) {
    const row = [l.t, l.p, l.q, l.side];
    this.rows.push(row);
    if (this.rows.length > MAX_MEMORY) this.rows.shift();
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.appendFileSync(this.file, JSON.stringify(row) + '\n');
  }

  range(from, to) {
    return this.rows.filter(([t]) => t >= from && t < to);
  }
}
