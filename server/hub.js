// Diffusion SSE vers les navigateurs, avec un historique renvoyé à chaque connexion :
// derniers ticks (prix + trades), signaux, et dernier état de chaque type
// (status, stats, rejection, dom, history, alert).
const TICK_BACKLOG = 3000; // 5 min à 100 ms

export class Hub {
  constructor() {
    this.clients = new Set();
    this.reset();
  }

  // Nouveau symbole : on oublie tout et les navigateurs repartent de zéro.
  reset() {
    this.ticks = [];
    this.signals = new Map();
    this.latest = {};
    this.meta = null;
    this.#broadcast('reset', '{}');
  }

  attach(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    if (this.meta) this.#send(res, 'meta', this.meta);
    for (const [event, data] of Object.entries(this.latest)) this.#send(res, event, data);
    for (const tick of this.ticks) this.#send(res, 'tick', tick);
    for (const sig of this.signals.values()) this.#send(res, 'signal', sig);
    this.#send(res, 'ready', '{}');
    this.clients.add(res);
    req.on('close', () => this.clients.delete(res));
  }

  setMeta(meta) {
    this.meta = JSON.stringify(meta);
    this.#broadcast('meta', this.meta);
  }

  tick(tick) {
    const data = JSON.stringify(tick);
    this.ticks.push(data);
    if (this.ticks.length > TICK_BACKLOG) this.ticks.shift();
    this.#broadcast('tick', data);
  }

  signal(sig) {
    const data = JSON.stringify(sig);
    this.signals.set(sig.id, data);
    if (this.signals.size > 30) this.signals.delete(this.signals.keys().next().value);
    this.#broadcast('signal', data);
  }

  // Événement ponctuel, non rejoué aux nouveaux clients.
  event(name, value) {
    this.#broadcast(name, JSON.stringify(value));
  }

  state(event, value) {
    const data = JSON.stringify(value);
    this.latest[event] = data;
    this.#broadcast(event, data);
  }

  #send(res, event, data) {
    res.write(`event: ${event}\ndata: ${data}\n\n`);
  }

  #broadcast(event, data) {
    for (const res of this.clients) this.#send(res, event, data);
  }
}
