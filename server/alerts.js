// Alertes : franchissement de prix, gros print, mur proche, delta anormal, déséquilibre
// du carnet, liquidation. Évaluées à chaque frame ; stockées dans data/alerts.json.
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';

const COOLDOWN_MS = 60_000;
const fmt = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });

// Type -> paramètres numériques attendus (avec bornes) et libellé.
export const ALERT_TYPES = {
  price: { params: { price: [0, 1e12] }, label: 'Prix' },
  bigprint: { params: { qty: [0, 1e12] }, label: 'Gros print' },
  wall: { params: { qty: [0, 1e12], distPct: [0.01, 20] }, label: 'Mur proche' },
  deltaz: { params: { z: [0.5, 20] }, label: 'Delta anormal' },
  imbalance: { params: { value: [0.05, 1] }, label: 'Déséquilibre carnet' },
  liquidation: { params: { notional: [0, 1e12] }, label: 'Liquidation' },
};

export class Alerts extends EventEmitter {
  constructor(file) {
    super();
    this.file = file;
    // Les types disparus (ancienne alerte « nouveau signal ») sont ignorés.
    this.items = (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []).filter((a) => ALERT_TYPES[a.type]);
    this.fired = [];
    this.prevMid = new Map();
  }

  #save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.items, null, 2));
  }

  list() {
    return { items: this.items, fired: this.fired };
  }

  add(input) {
    const def = ALERT_TYPES[input.type];
    if (!def) throw new Error(`type d'alerte inconnu : ${input.type}`);
    const params = {};
    for (const [key, [min, max]] of Object.entries(def.params)) {
      const v = Number(input.params?.[key]);
      if (!Number.isFinite(v) || v < min || v > max) throw new Error(`${key} hors bornes [${min}, ${max}]`);
      params[key] = v;
    }
    const symbol = String(input.symbol ?? '').toUpperCase();
    if (!/^[A-Z0-9]{2,20}$/.test(symbol)) throw new Error('symbole invalide');
    const item = { id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, symbol, type: input.type, params, once: input.once !== false, enabled: true, created: Date.now(), lastFired: 0 };
    this.items.push(item);
    this.#save();
    return item;
  }

  remove(id) {
    this.items = this.items.filter((a) => a.id !== id);
    this.#save();
  }

  // ctx : { symbol, f (frame), flow, base }
  evaluate(ctx) {
    const { f, flow, symbol } = ctx;
    const mid = (f.bid + f.ask) / 2;
    const prev = this.prevMid.get(symbol) ?? mid;
    this.prevMid.set(symbol, mid);
    for (const a of this.items) {
      if (!a.enabled || a.symbol !== symbol || (a.lastFired && f.t - a.lastFired < COOLDOWN_MS)) continue;
      const text = this.#check(a, { ...ctx, mid, prev });
      if (!text) continue;
      a.lastFired = f.t;
      if (a.once) a.enabled = false;
      const event = { id: a.id, t: f.t, symbol, type: a.type, label: ALERT_TYPES[a.type].label, text };
      this.fired.unshift(event);
      this.fired.length = Math.min(this.fired.length, 50);
      this.#save();
      this.emit('fired', event);
    }
  }

  #check(a, { f, flow, base, mid, prev }) {
    const p = a.params;
    switch (a.type) {
      case 'price':
        if ((prev < p.price && mid >= p.price) || (prev > p.price && mid <= p.price)) {
          return `Prix ${mid >= p.price ? 'au-dessus' : 'en dessous'} de ${fmt(p.price)} (${fmt(mid)})`;
        }
        return null;
      case 'bigprint': {
        const big = biggestPrint(f.tr);
        return big && big.q >= p.qty ? `Gros print ${big.side > 0 ? 'acheteur' : 'vendeur'} de ${fmt(big.q, 3)} ${base} à ${fmt(big.p)}` : null;
      }
      case 'wall': {
        const w = flow.walls.find((x) => x.q >= p.qty && (Math.abs(x.price - mid) / mid) * 100 <= p.distPct);
        return w ? `Mur ${w.side === 'bid' ? 'acheteur' : 'vendeur'} de ${fmt(w.q, 3)} ${base} à ${fmt(w.price)}` : null;
      }
      case 'deltaz': {
        const z = flow.deltaZ();
        return z !== null && Math.abs(z) >= p.z ? `Delta 10 s anormal (z-score ${fmt(z, 1)})` : null;
      }
      case 'imbalance':
        return Math.abs(flow.imb) >= p.value ? `Carnet déséquilibré à ${fmt(flow.imb)}` : null;
      case 'liquidation': {
        const big = (f.liq ?? []).map(([p, q, side]) => ({ p, q, side, n: p * q })).sort((a, b) => b.n - a.n)[0];
        return big && big.n >= p.notional
          ? `Liquidation ${big.side < 0 ? 'longue' : 'courte'} de ${fmt(big.n, 0)} à ${fmt(big.p)} (${fmt(big.q, 3)} ${base})`
          : null;
      }
      default:
        return null;
    }
  }
}

// Plus gros ordre agresseur de la frame (trades de même horodatage et même côté).
function biggestPrint(tr) {
  const groups = new Map();
  for (const [p, q, side, T] of tr) {
    const key = `${T}${side}`;
    const g = groups.get(key) ?? { pq: 0, q: 0, side };
    g.pq += p * q;
    g.q += q;
    groups.set(key, g);
  }
  let best = null;
  for (const g of groups.values()) if (!best || g.q > best.q) best = { p: g.pq / g.q, q: g.q, side: g.side };
  return best;
}
