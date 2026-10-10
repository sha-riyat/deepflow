// Stratégie du cours « Value Area de la veille + confirmation order flow » :
//  - Setup 1 (rejet) : sortie de la VA d'hier, retour avec 2 clôtures de 30 min dedans, signe
//    d'order flow à l'extrémité (absorption, épuisement, divergence de CVD, gros prints contre la
//    sortie), entrée sur une bougie 5 min proche du bord avec un delta dans le sens du trade ;
//    stop au-delà de l'extrême + 0,1 %, cible 1 = POC d'hier, cible 2 = bord opposé.
//  - Setup 2 (acceptation) : cassure portée (delta franc ou déséquilibres empilés), 2 clôtures de
//    30 min dehors, bon côté du VWAP, retest du niveau cassé confirmé (absorption ou gros prints) ;
//    stop sous le repli et au moins 0,2 % dans la VA, cible 1 = 1R, cible 2 = prochain HVN /
//    POC non testé / extrême de la veille au-delà de 1,5R.
// Les niveaux viennent des sessions journalières (fournies par la session en direct, ou calculées
// ici à partir des trades en backtest). Évaluation à la clôture de chaque bougie de 5 min.
import { BarBuilder } from '../../shared/bars.js';
import { SessionProfiler, nakedPocs } from '../../shared/profile.js';
import { auctionState, compositeSession, rowBucket, volumeNodes } from '../../shared/auction.js';
import { flowMarks, imbalances, mergeRows, stacks } from '../../shared/footprint.js';
import { cvdDivergences, sessionCvd } from '../../shared/cvd.js';

const DAY = 86_400_000;
const PERIOD = 30 * 60_000;
const fmt = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });

export class ValueAreaStrategy {
  constructor(cfg, { fpBucket }) {
    this.cfg = cfg;
    this.fpBucket = fpBucket;
    this.days = new Map(); // début de session -> session journalière terminée (ou fournie)
    this.external = null; // session du jour fournie par le collecteur (complète depuis 00:00)
    this.day = null;
    this.k = null;
    this.profiler = null;
    this.bucket = null;
    this.bars5 = new BarBuilder({ type: 'time', param: cfg.barMs, fpBucket });
    this.today5 = [];
    this.state = null;
    this.ev = null;
    this.used = new Set();
  }

  // Sessions journalières fournies par le collecteur (historique complet, session du jour incluse).
  setSessions(list, now) {
    for (const s of list) {
      if (s.t0 + DAY <= now) this.days.set(s.t0, s);
      else this.external = s;
    }
  }

  today() {
    if (this.external && this.external.t0 === this.day) return this.external;
    return this.#session(this.day);
  }

  // Session d'un jour donné. Le profileur peut aussi contenir la fin du jour précédent (trades de
  // 23:59:59 arrivés dans une frame horodatée après minuit) : on choisit donc par date.
  #session(t0) {
    return this.profiler?.list().find((s) => s.t0 === t0) ?? null;
  }

  // Un tour par frame ; retourne { candidate, periodClosed } (periodClosed = état après la clôture
  // d'une période de 30 min, pour les sorties anticipées des signaux ouverts).
  onFrame(f, an, ctx) {
    const out = { candidate: null, periodClosed: null };
    const day = Math.floor(f.t / DAY) * DAY;
    if (day !== this.day) this.#newDay(day);
    const closed = [];
    for (const [p, q, side, T, id] of f.tr) {
      if (!this.profiler) {
        this.bucket = rowBucket(p, this.fpBucket, this.cfg.rowPct);
        this.profiler = new SessionProfiler(this.bucket);
      }
      this.profiler.push(T, p, q, side);
      closed.push(...this.bars5.push(T, p, q, side, id ?? -1));
    }
    this.#trackPrints(an?.big ?? [], f);
    const k = Math.floor((f.t - day) / PERIOD);
    if (this.k !== null && k !== this.k) {
      this.state = auctionState(this.days.get(day - DAY), this.today(), f.t, this.cfg.needPeriods);
      out.periodClosed = this.state;
    }
    this.k = k;
    for (const bar of closed) {
      if (Math.floor(bar.t0 / DAY) * DAY !== day) continue;
      this.today5.push(bar);
      this.#evidence(bar);
      out.candidate ??= this.#setups(bar, f, ctx);
    }
    return out;
  }

  #newDay(day) {
    const done = this.#session(this.day);
    if (done && !this.days.has(done.t0)) this.days.set(done.t0, done);
    for (const t of this.days.keys()) if (t < day - 15 * DAY) this.days.delete(t);
    Object.assign(this, { day, k: null, profiler: null, today5: [], state: null, ev: null });
  }

  #levels() {
    const prev = this.days.get(this.day - DAY);
    if (!prev || prev.vah === null) return null;
    return { prev, vah: (prev.vah + 1) * prev.bucket, val: prev.val * prev.bucket, poc: (prev.poc + 0.5) * prev.bucket };
  }

  // Gros prints contre une sortie en cours (ventes au-dessus de la VAH, achats sous la VAL).
  #trackPrints(big, f) {
    const L = this.#levels();
    if (!L || !big.length) return;
    for (const [p, , side] of big) {
      const out = p > L.vah ? 1 : p < L.val ? -1 : 0;
      if (out === 0) continue;
      this.#ev(out);
      if (side === -out) this.ev.against.push(f.t);
      else this.ev.with.push(f.t);
    }
  }

  #ev(side) {
    if (!this.ev || this.ev.side !== side) this.ev = { side, marks: [], divergence: false, against: [], with: [], breakout: false };
    return this.ev;
  }

  // Indices d'order flow collectés pendant une sortie, bougie 5 min par bougie 5 min.
  #evidence(bar) {
    const L = this.#levels();
    if (!L || !bar.fp) return;
    const side = bar.h > L.vah ? 1 : bar.l < L.val ? -1 : 0;
    if (side === 0) return;
    const ev = this.#ev(side);
    const fp = mergeRows(bar.fp, 1);
    for (const m of flowMarks(fp, bar, this.fpBucket)) if (m.side === -side) ev.marks.push(m.kind);
    const divs = cvdDivergences(this.today5, sessionCvd(this.today5), 3);
    const last = divs[divs.length - 1];
    if (last && last.to >= this.today5.length - 4 && (side > 0 ? last.type === 'bear' : last.type === 'bull')) ev.divergence = true;
    // Cassure portée : clôture dehors avec un delta ≥ deltaMult × la moyenne, ou déséquilibres empilés.
    const delta = bar.b - bar.s;
    const avg = this.today5.reduce((a, b) => a + Math.abs(b.b - b.s), 0) / this.today5.length;
    const imb = imbalances(fp, this.cfg.ratio);
    const stacked = stacks(side > 0 ? imb.buy : imb.sell, this.cfg.stack).length > 0;
    const closedOut = side > 0 ? bar.c > L.vah : bar.c < L.val;
    if (closedOut && ((this.today5.length >= 6 && side * delta >= this.cfg.deltaMult * avg) || stacked)) ev.breakout = true;
  }

  #setups(bar, f, ctx) {
    const L = this.#levels();
    const st = this.state;
    if (!L || !st || !this.ev) return null;
    if (st.state === 'rejected') return this.#rejection(bar, f, L, st);
    if (st.state === 'accepted') return this.#acceptance(bar, f, L, st, ctx);
    return null;
  }

  #rejection(bar, f, L, st) {
    const key = `R:${st.at}`;
    const s = st.side;
    const ev = this.ev;
    if (this.used.has(key) || ev.side !== s || f.t - st.at > this.cfg.maxAgeMs) return null;
    const signs = [];
    if (ev.marks.includes('absorption')) signs.push(`absorption ${s > 0 ? 'vendeuse au plus haut' : 'acheteuse au plus bas'} de la sortie`);
    if (ev.marks.includes('exhaustion')) signs.push(`épuisement des ${s > 0 ? 'acheteurs' : 'vendeurs'} à l'extrême`);
    if (ev.divergence) signs.push(`divergence ${s > 0 ? 'baissière' : 'haussière'} prix / CVD`);
    if (ev.against.length) signs.push(`${ev.against.length} gros print(s) ${s > 0 ? 'vendeurs' : 'acheteurs'} contre la sortie`);
    if (!signs.length) return null;
    const width = L.vah - L.val;
    const inside = bar.c <= L.vah && bar.c >= L.val;
    const nearEdge = s > 0 ? bar.h >= L.vah - this.cfg.edgeZone * width : bar.l <= L.val + this.cfg.edgeZone * width;
    const delta = bar.b - bar.s;
    if (!inside || !nearEdge || -s * delta <= 0) return null;
    this.used.add(key);
    const dir = -s;
    const stop = st.extreme * (1 + (s * this.cfg.stopBufferPct) / 100);
    return {
      dir,
      setup: 'rejet',
      label: `Rejet ${s > 0 ? 'au-dessus de la VAH' : 'sous la VAL'} : retour dans la valeur`,
      stop,
      targets: [{ price: L.poc, pct: 50, label: 'POC d’hier' }, { price: s > 0 ? L.val : L.vah, pct: 50, label: s > 0 ? 'VAL d’hier' : 'VAH d’hier' }],
      exit: { type: 'rejet', side: s },
      why: [
        `Sortie ${s > 0 ? 'au-dessus de la VAH' : 'sous la VAL'} d'hier (${fmt(s > 0 ? L.vah : L.val)}), extrême ${fmt(st.extreme)}`,
        `Retour dans la valeur : ${st.count} clôtures de 30 min dedans`,
        ...signs.map((x) => `Order flow : ${x}`),
        `Bougie 5 min proche du bord avec un delta ${dir > 0 ? 'acheteur' : 'vendeur'} (${fmt(delta, 3)})`,
      ],
    };
  }

  #acceptance(bar, f, L, st, ctx) {
    const key = `A:${st.at}`;
    const s = st.side;
    const ev = this.ev;
    if (this.used.has(key) || ev.side !== s || !ev.breakout || f.t - st.at > this.cfg.maxAgeMs) return null;
    const level = s > 0 ? L.vah : L.val;
    const vwap = ctx.vwap;
    if (vwap !== null && s * (bar.c - vwap) <= 0) return null;
    const retest = s > 0 ? bar.l <= level * (1 + this.cfg.retestPct / 100) && bar.c > level : bar.h >= level * (1 - this.cfg.retestPct / 100) && bar.c < level;
    if (!retest) return null;
    const marks = flowMarks(mergeRows(bar.fp, 1), bar, this.fpBucket).filter((m) => m.kind === 'absorption' && m.side === s);
    const prints = ev.with.filter((t) => t >= bar.t0 && t <= bar.t1).length;
    if (!marks.length && !prints) return null;
    const entryRef = s > 0 ? ctx.ask : ctx.bid;
    const inside = level * (1 - (s * this.cfg.insideMinPct) / 100);
    const stop = s > 0 ? Math.min(bar.l * 0.9995, inside) : Math.max(bar.h * 1.0005, inside);
    const dist = Math.abs(entryRef - stop);
    const t2 = this.#nextLevel(s, entryRef, dist);
    if (!t2) return { rejected: 'aucun HVN, POC non testé ou extrême au-delà de 1,5R pour la cible 2', setup: 'acceptation', dir: s };
    this.used.add(key);
    return {
      dir: s,
      setup: 'acceptation',
      label: `Acceptation ${s > 0 ? 'au-dessus de la VAH' : 'sous la VAL'} : retest tenu`,
      stop,
      targets: [{ R: 1, pct: 50, label: '1R' }, { price: t2.price, pct: 50, label: t2.label }],
      exit: { type: 'acceptation', side: s },
      why: [
        `Cassure ${s > 0 ? 'de la VAH' : 'de la VAL'} d'hier (${fmt(level)}) portée par le delta ou des déséquilibres empilés`,
        `Acceptation : ${st.count} clôtures de 30 min dehors, prix ${s > 0 ? 'au-dessus' : 'en dessous'} du VWAP${vwap !== null ? ` (${fmt(vwap)})` : ''}`,
        `Retest du niveau cassé tenu sur la bougie 5 min`,
        marks.length ? `Absorption ${s > 0 ? 'des vendeurs' : 'des acheteurs'} au retest` : `${prints} gros print(s) dans le sens de la cassure`,
        `Cible 2 : ${t2.label} à ${fmt(t2.price)}`,
      ],
    };
  }

  // Prochain niveau au-delà de 1,5R dans le sens du trade : POC non testés, HVN du composite
  // 5 jours, plus haut / plus bas de la veille ; le plus proche l'emporte.
  #nextLevel(s, entry, dist) {
    const done = [...this.days.values()].sort((a, b) => a.t0 - b.t0);
    const today = this.today();
    const list = [];
    for (const p of nakedPocs(today ? [...done, today] : done)) list.push({ price: p.price, label: 'POC non testé' });
    const comp = compositeSession(done, 5);
    if (comp) for (const r of volumeNodes(comp.rows).hvn) list.push({ price: (r + 0.5) * comp.bucket, label: 'HVN du composite 5 j' });
    const prev = done[done.length - 1];
    if (prev) list.push({ price: s > 0 ? prev.hi : prev.lo, label: s > 0 ? 'plus haut d’hier' : 'plus bas d’hier' });
    const ok = list.filter((x) => s * (x.price - entry) >= this.cfg.minRR * dist).sort((a, b) => s * (a.price - b.price));
    return ok[0] ?? null;
  }
}
