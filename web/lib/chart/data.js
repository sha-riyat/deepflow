// Données du graphique : bougies (historique paginé + direct, raccordés par le même
// constructeur que le serveur), bulles de trades, profils de session, heatmap et open interest.
import { BarBuilder } from '@shared/bars.js';
import { nowOf } from '../clock.js';

const HOUR = 3_600_000;

async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export class DataManager {
  constructor(onChange) {
    this.onChange = onChange;
    this.gen = 0;
    this.spec = { type: 'time', param: 60_000, fp: 0 };
    this.key = ''; // session du collecteur
    this.replay = null; // horloge du replay des archives (voir clock.js)
    this.lastTickT = 0; // dernier tick appliqué (le flux rouvert renvoie les derniers ticks)
    this.reset();
  }

  // URL d'une requête au collecteur, pour la session suivie (`key` : « futures:BTCUSDT », « replay »).
  url(path) {
    return `${path}${path.includes('?') ? '&' : '?'}s=${encodeURIComponent(this.key)}`;
  }

  reset() {
    this.gen++;
    this.lastTickT = 0;
    this.bars = [];
    this.builder = null;
    this.ready = false;
    this.queue = [];
    this.loadingOlder = false;
    this.atStart = false;
    this.retryAt = 0;
    this.status = '';
    this.ticks = [];
    this.bubbles = { rows: [], big: [], slot: 1000, to: 0 };
    this.liveSlots = new Map();
    this.liveBig = [];
    this.profiles = [];
    this.heat = null;
    this.heatBusy = false;
    this.heatNext = null;
    this.oi = [];
    this.spot = { rows: new Map(), param: 0, error: null }; // delta spot par bougie : début -> [achats, ventes]
    this.liqs = []; // [temps, prix, quantité, côté] ; côté -1 = position longue liquidée
    this.liqTo = 0;
    this.venues = null; // CVD multi-plateformes : { since, rows, status } (voir loadVenues)
    this.funding = null; // prime et financement : { interval, premium, rates } (voir loadFunding)
    this.keyLevels = null; // ouvertures semaine / mois, hauts et bas précédents (voir loadLevels)
    this.vwapAnchor = null; // sommes de la période (jour, semaine, mois) avant la première bougie chargée (voir loadVwapAnchor)
    this.dailySessions = []; // sessions journalières des 10 derniers jours (nPOC, veille, composite)
  }

  // Charge la série la plus récente pour un type de bougie donné.
  async setSpec(spec) {
    this.spec = { ...spec };
    const gen = ++this.gen;
    Object.assign(this, { bars: [], ready: false, atStart: false, retryAt: 0, status: 'Chargement…' });
    this.onChange('bars');
    const { type, param, fp } = this.spec;
    const q = new URLSearchParams({ type, param, fp, count: 800, recent: 1 });
    if (type !== 'time') q.set('from', nowOf(this) - 6 * HOUR);
    try {
      const r = await getJSON(this.url(`/api/bars?${q}`));
      if (gen !== this.gen) return;
      this.bars = r.bars;
      this.builder = new BarBuilder({ type, param, fpBucket: fp });
      this.builder.lastId = r.lastId ?? -1;
      const last = this.bars[this.bars.length - 1];
      if (last && !last.x) {
        this.builder.restore(last, { lastT: r.lastT ?? r.serverT, lastId: r.lastId ?? -1 });
      }
      // Les klines incluent déjà les trades antérieurs à leur date de calcul.
      this.skipBefore = r.source === 'klines' ? r.serverT : -Infinity;
      this.status = r.partial ? 'Historique du jour en cours de rattrapage' : '';
      this.ready = true;
      for (const tick of this.queue) this.#apply(tick);
      this.queue = [];
    } catch (err) {
      if (gen === this.gen) this.status = `Erreur : ${err.message}`;
    }
    this.onChange('bars');
  }

  // Ajoute des bougies plus anciennes ; retourne leur nombre.
  async loadOlder() {
    if (this.loadingOlder || this.atStart || !this.ready || this.bars.length === 0) return 0;
    if (Date.now() < this.retryAt) return 0; // historique du jour encore en rattrapage
    this.loadingOlder = true;
    const gen = this.gen;
    const first = this.bars[0];
    const { type, param, fp } = this.spec;
    const to = first.t0 - 1;
    const q = new URLSearchParams({ type, param, fp, to, count: 800 });
    if (type !== 'time') q.set('from', to - 6 * HOUR);
    this.status = fp || type !== 'time' ? 'Chargement de l’historique (archives Binance)…' : 'Chargement…';
    this.onChange('status');
    let added = 0;
    try {
      const r = await getJSON(this.url(`/api/bars?${q}`));
      if (gen !== this.gen) return 0;
      const older = r.bars.filter((b) => b.t0 < first.t0).map((b) => ({ ...b, x: 1 }));
      // Plage vide : soit le début de l'historique, soit un trou en cours de rattrapage.
      if (older.length === 0 && r.partial) this.retryAt = Date.now() + 5000;
      else if (older.length === 0) this.atStart = true;
      this.bars = older.concat(this.bars);
      added = older.length;
      this.status = '';
    } catch (err) {
      this.status = `Erreur : ${err.message}`;
    } finally {
      this.loadingOlder = false;
    }
    this.onChange('older', added);
    return added;
  }

  onTick(tick) {
    if (tick.t <= this.lastTickT) return; // déjà reçu (flux rouvert)
    this.lastTickT = tick.t;
    // Meilleurs prix récents (calque bid / ask) : sans les trades, qui pèsent lourd en replay rapide.
    this.ticks.push({ t: tick.t, bid: tick.bid, ask: tick.ask });
    if (this.ticks.length > 3000) this.ticks.shift();
    const slot = this.bubbles.slot;
    for (const [p, q, side, T] of tick.tr) {
      const t0 = Math.floor(T / slot) * slot;
      const g = this.liveSlots.get(t0) ?? [t0, 0, 0, 0]; // [début, prix × qté, achats, ventes]
      g[1] += p * q;
      g[side > 0 ? 2 : 3] += q;
      this.liveSlots.set(t0, g);
    }
    this.#liveBigPrints(tick);
    for (const [p, q, side, T] of tick.liq ?? []) if (T >= this.liqTo) this.liqs.push([T, p, q, side]);
    if (this.liveBig.length > 2000) this.liveBig.splice(0, this.liveBig.length - 2000);
    if (this.ready) this.#apply(tick);
    else this.queue.push(tick);
  }

  #apply(tick) {
    for (const [p, q, side, T, id] of tick.tr) {
      if (T <= this.skipBefore) continue;
      for (const bar of this.builder.push(T, p, q, side, id ?? -1)) this.#upsert(bar);
    }
    const cur = this.builder.current();
    if (cur) this.#upsert(cur);
  }

  #upsert(bar) {
    const bars = this.bars;
    const last = bars[bars.length - 1];
    if (last && last.t0 === bar.t0 && !last.x) bars[bars.length - 1] = bar;
    else if (!last || bar.t0 >= last.t0) bars.push(bar);
  }

  // Bulles [début, VWAP, achats, ventes] : plage chargée + agrégation du direct au-delà.
  bubbleRows() {
    const live = [...this.liveSlots.values()].filter((g) => g[0] >= this.bubbles.to).map((g) => [g[0], g[1] / (g[2] + g[3]), g[2], g[3]]);
    return this.bubbles.rows.concat(live);
  }

  bigPrints() {
    return this.bubbles.big.concat(this.liveBig.filter((b) => b[0] >= this.bubbles.to));
  }

  // Gros prints du direct : fills d'un même ordre agresseur (même heure, même côté) regroupés,
  // au même seuil que la plage chargée (montant choisi, sinon seuil automatique du serveur).
  #liveBigPrints(tick) {
    const min = this.bubbles.min ?? 0;
    const threshold = this.bubbles.threshold;
    if (!min && threshold === null) {
      for (const [p, q, side] of tick.an?.big ?? []) this.liveBig.push([tick.t, p, q, side]);
      return;
    }
    const orders = new Map();
    for (const [p, q, side, T] of tick.tr) {
      const key = T * 2 + (side > 0 ? 1 : 0);
      const o = orders.get(key) ?? [T, 0, 0, side > 0 ? 1 : -1];
      o[1] += p * q;
      o[2] += q;
      orders.set(key, o);
    }
    for (const [T, pq, q, side] of orders.values()) {
      if (min ? pq >= min : q >= threshold) this.liveBig.push([T, pq / q, q, side]);
    }
  }

  async loadBubbles(from, to, slot, min = 0) {
    try {
      const r = await getJSON(this.url(`/api/bubbles?${new URLSearchParams({ from: Math.floor(from), to: Math.floor(to), slot: Math.round(slot), min })}`));
      if (r.slot !== this.bubbles.slot) this.liveSlots.clear();
      if (r.min !== this.bubbles.min) this.liveBig = []; // seuil changé : le direct repart du nouveau
      // Le créneau en cours à la date de fin reste agrégé en direct : pas de bulle coupée en deux.
      const end = Math.floor(to / r.slot) * r.slot;
      r.rows = r.rows.filter((row) => row[0] < end);
      r.big = r.big.filter((b) => b[0] < end); // au-delà : gros prints du direct
      for (const t0 of this.liveSlots.keys()) if (t0 < end) this.liveSlots.delete(t0);
      this.bubbles = { ...r, to: end };
      this.onChange('bubbles');
    } catch {
      // nouvelle tentative au prochain déplacement
    }
  }

  // Profils : sessions journalières (tpo = sous-période en minutes) ou plage libre (mode 'range').
  async loadProfiles(from, to, bucket, params = {}) {
    const gen = (this.profileGen = (this.profileGen ?? 0) + 1);
    try {
      const r = await getJSON(this.url(`/api/profile?${new URLSearchParams({ from: Math.floor(from), to: Math.floor(to), bucket, ...params })}`));
      if (gen !== this.profileGen) return; // une demande plus récente est partie entre-temps
      this.profiles = r.sessions;
      this.onChange('profiles');
    } catch (err) {
      this.status = `Profils : ${err.message}`;
    }
  }

  // Sessions journalières récentes, indépendantes du profil affiché : POC non testés, value area
  // de la veille et état d'acceptation, profils composites.
  async loadDaily(from, to, bucket) {
    try {
      const r = await getJSON(this.url(`/api/profile?${new URLSearchParams({ from: Math.floor(from), to: Math.floor(to), bucket })}`));
      this.dailySessions = r.sessions;
      this.onChange('profiles');
    } catch {
      // nouvelle tentative au prochain cycle
    }
  }

  // Liquidations de la plage (enregistrées par le collecteur depuis son premier lancement).
  async loadLiquidations(from, to) {
    try {
      const r = await getJSON(this.url(`/api/liquidations?${new URLSearchParams({ from: Math.floor(from), to: Math.floor(to) })}`));
      const live = this.liqs.filter((l) => l[0] >= to);
      this.liqs = r.rows.concat(live);
      this.liqTo = Math.floor(to);
      this.liqSince = r.since;
      this.onChange('liqs');
    } catch {
      // nouvelle tentative au prochain cycle
    }
  }

  // Volumes agressifs par minute de Bybit et d'OKX (collecteur, depuis le lancement de la session).
  async loadVenues(from, to) {
    try {
      this.venues = await getJSON(this.url(`/api/venues?${new URLSearchParams({ from: Math.floor(from), to: Math.floor(to) })}`));
      this.onChange('venues');
    } catch {
      // nouvel essai au prochain cycle
    }
  }

  // Prime et financement (futures) : indice de prime et taux de financement passés.
  async loadFunding(interval, to) {
    try {
      this.funding = await getJSON(this.url(`/api/funding?${new URLSearchParams({ interval, to: Math.floor(to) })}`));
    } catch {
      this.funding = { premium: [], rates: [], error: 'Prime et financement indisponibles (Binance injoignable)' };
    }
    this.onChange('funding');
  }

  // Niveaux clés : bougies journalières Binance, calculés par le collecteur une fois par jour.
  async loadLevels() {
    try {
      this.keyLevels = await getJSON(this.url('/api/levels'));
      this.onChange('levels');
    } catch {
      this.keyLevels = null;
    }
  }

  // Ancrage du VWAP : volume de la période (jour, semaine, mois) antérieur à la première bougie
  // chargée (klines Binance).
  async loadVwapAnchor(t, period = 'day') {
    try {
      const r = await getJSON(this.url(`/api/vwap?t=${Math.floor(t)}&period=${period}`));
      if (this.bars[0]?.t0 !== t) return; // historique prolongé entre-temps : réponse périmée
      this.vwapAnchor = { ...r, first: t };
      this.onChange('vwap');
    } catch {
      this.vwapAnchor = null;
    }
  }

  // Delta du spot du même actif (klines spot), fusionné par début de bougie.
  async loadSpot(param, from, to) {
    if (this.spot.param !== param) this.spot = { rows: new Map(), param, error: null };
    try {
      const r = await getJSON(this.url(`/api/spotdelta?${new URLSearchParams({ param, from: Math.floor(from), to: Math.floor(to) })}`));
      for (const [t, buy, sell] of r.rows) this.spot.rows.set(t, [buy, sell]);
      this.spot.error = null;
      this.onChange('spot');
    } catch (err) {
      this.spot.error = `CVD spot indisponible : ${err.message}`;
    }
  }

  // Open interest Binance (futures) : 500 points au plus, se terminant à `to`.
  async loadOI(period, to) {
    try {
      this.oi = (await getJSON(this.url(`/api/oi?${new URLSearchParams({ period, to: Math.floor(to) })}`))).rows;
      this.onChange('oi');
    } catch {
      this.oi = [];
    }
  }

  // Une seule requête de heatmap à la fois ; la dernière demande en attente est conservée.
  async loadHeat(params) {
    if (this.heatBusy) {
      this.heatNext = params;
      return;
    }
    this.heatBusy = true;
    try {
      const res = await fetch(this.url(`/api/heatmap?${new URLSearchParams(params)}`));
      const head = JSON.parse(res.headers.get('X-Heat') ?? '{}');
      const data = new Uint8Array(await res.arrayBuffer());
      this.heat = { ...params, ...head, data, rowTop: params.rowLo + head.rows * head.step };
      this.heatStart = head.start;
      this.onChange('heat');
    } catch {
      // la heatmap reste sur la dernière grille valide
    } finally {
      this.heatBusy = false;
      if (this.heatNext) {
        const next = this.heatNext;
        this.heatNext = null;
        this.loadHeat(next);
      }
    }
  }
}
