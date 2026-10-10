// Replay des archives : rejoue les trades d'une journée passée (archives Binance Vision, via le
// magasin de trades) comme le direct, avec une horloge virtuelle : lecture à vitesse réglable,
// pause, avance jusqu'à une heure donnée (« +1 bougie »). Binance n'archive pas le carnet
// d'ordres : les frames ne portent que les trades, bid et ask valant le dernier prix.
// Convention : l'horloge est le présent exclu ; seuls les trades antérieurs sont « arrivés ».
import { EventEmitter } from 'node:events';

const DAY = 86_400_000;
export const SPEEDS = [1, 5, 20, 60, 300];
export const JUMP_MS = 5000; // au-delà, l'avance est silencieuse : le navigateur recharge ensuite

export class ArchiveSource extends EventEmitter {
  // loadDay(d) : promesse des trades du jour UTC d ; end : fin des données (minuit UTC du jour
  // en cours, dont l'archive n'existe pas encore).
  constructor({ loadDay, from, end, speed = 1, frameMs = 100 }) {
    super();
    Object.assign(this, { loadDay, end, frameMs });
    this.speed = SPEEDS.includes(speed) ? speed : 1;
    this.clock = from;
    this.playing = false; // départ en pause : le temps de préparer son analyse
    this.day = null; // { d, trades, i } : jour en cours de lecture
    this.last = null; // dernier prix rejoué
    this.busy = false;
    this.stopped = false;
  }

  start() {
    this.emit('status', 'replay en pause : lancer la lecture');
    this.timer = setInterval(() => {
      if (this.playing) this.#run(this.clock + this.frameMs * this.speed, false);
    }, this.frameMs);
    this.#state();
  }

  stop() {
    this.stopped = true;
    clearInterval(this.timer);
  }

  ladder() {
    return null; // pas de carnet d'ordres en replay
  }

  play() {
    this.playing = this.clock < this.end;
    this.#status();
    this.#state();
  }

  pause() {
    this.playing = false;
    this.#status();
    this.#state();
  }

  setSpeed(speed) {
    if (SPEEDS.includes(speed)) this.speed = speed;
    this.#status();
    this.#state();
  }

  // Texte d'état affiché en haut de l'interface.
  #status() {
    this.emit('status', this.playing ? `replay en lecture ×${this.speed}` : 'replay en pause');
  }

  // Avance jusqu'à `t` (au plus la fin des données), en pause comme en lecture ; attend la fin du
  // pas de lecture en cours.
  async advanceTo(t) {
    while (this.busy) await new Promise((r) => setTimeout(r, 10));
    return this.#run(t, t - this.clock > JUMP_MS);
  }

  // Joue les trades de [horloge, to). En lecture : une frame ; en avance silencieuse : une frame
  // par seconde, sans diffusion (le navigateur recharge à la fin, sur 'jumped').
  async #run(to, silent) {
    if (this.busy || this.stopped) return;
    this.busy = true;
    try {
      to = Math.min(to, this.end);
      while (this.clock < to && !this.stopped) {
        const d = Math.floor(this.clock / DAY) * DAY;
        if (this.day?.d !== d) {
          const trades = await this.loadDay(d);
          this.day = { d, trades, i: trades.lowerBound(this.clock) };
        }
        const stepEnd = Math.min(to, d + DAY, silent ? this.clock + 1000 : to);
        this.#frame(this.#take(stepEnd), stepEnd, silent);
        this.clock = stepEnd;
      }
      if (this.clock >= this.end && this.playing) {
        this.playing = false;
        this.emit('status', 'fin des archives : retour au direct possible');
      }
      if (silent) this.emit('jumped');
    } catch (err) {
      this.playing = false;
      this.emit('status', `replay interrompu : ${err.message}`);
    } finally {
      this.busy = false;
      this.#state();
    }
  }

  // Trades du jour en cours antérieurs à `end`, émis un par un (magasin, volume du DOM).
  #take(end) {
    const { trades } = this.day;
    const tr = [];
    for (; this.day.i < trades.n && trades.t[this.day.i] < end; this.day.i++) {
      const i = this.day.i;
      const t = { t: trades.t[i], p: trades.p[i], q: trades.q[i], side: trades.s[i], id: trades.id[i] };
      this.emit('trade', t);
      tr.push([t.p, t.q, t.side, t.t, t.id]);
      this.last = t.p;
    }
    return tr;
  }

  #frame(tr, t, silent) {
    if (this.last === null) return; // aucun prix encore
    this.emit('frame', { t, bid: this.last, ask: this.last, r0: null, b: [], a: [], tr, liq: [], silent });
  }

  // État du replay (barre de replay de l'interface).
  #state() {
    this.emit('replay', { t: this.clock, speed: this.speed, playing: this.playing, end: this.end });
  }
}
