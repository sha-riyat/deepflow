// Diffusion SSE d'une session vers les navigateurs, avec un historique renvoyé à chaque abonnement :
// derniers ticks (prix + trades) et dernier état de chaque type (status, dom, history, mark,
// alerts). Un même flux de navigateur peut suivre plusieurs sessions : chaque abonnement a un
// préfixe (« futures:BTCUSDT| ») ajouté au nom des événements.
const TICK_BACKLOG = 3000; // 5 min à 100 ms
const BACKLOG_BYTES = 16 * 1024 * 1024; // plafond (replay rapide : des milliers de trades par tick)

export class Hub {
  constructor() {
    this.clients = new Map(); // réponse SSE -> préfixe
    this.idleSince = Date.now(); // sans abonné depuis (session arrêtée après un délai)
    this.reset();
  }

  // Nouveau symbole : on oublie tout et les navigateurs repartent de zéro.
  reset() {
    this.ticks = [];
    this.tickBytes = 0;
    this.latest = {};
    this.meta = null;
    this.#broadcast('reset', '{}');
  }

  // Abonne une réponse SSE déjà ouverte (en-têtes écrits par l'appelant).
  attach(req, res, prefix = '') {
    const send = (event, data) => res.write(`event: ${prefix}${event}\ndata: ${data}\n\n`);
    if (this.meta) send('meta', this.meta);
    for (const [event, data] of Object.entries(this.latest)) send(event, data);
    for (const tick of this.ticks) send('tick', tick);
    send('ready', '{}');
    this.clients.set(res, prefix);
    this.idleSince = null;
    req.on('close', () => {
      this.clients.delete(res);
      if (this.clients.size === 0) this.idleSince = Date.now();
    });
  }

  setMeta(meta) {
    this.meta = JSON.stringify(meta);
    this.#broadcast('meta', this.meta);
  }

  tick(tick) {
    const data = JSON.stringify(tick);
    this.ticks.push(data);
    this.tickBytes += data.length;
    while (this.ticks.length > TICK_BACKLOG || (this.tickBytes > BACKLOG_BYTES && this.ticks.length > 1)) this.tickBytes -= this.ticks.shift().length;
    this.#broadcast('tick', data);
  }

  // Événement ponctuel, non rejoué aux nouveaux abonnés.
  event(name, value) {
    this.#broadcast(name, JSON.stringify(value));
  }

  state(event, value) {
    const data = JSON.stringify(value);
    this.latest[event] = data;
    this.#broadcast(event, data);
  }

  #broadcast(event, data) {
    for (const [res, prefix] of this.clients) res.write(`event: ${prefix}${event}\ndata: ${data}\n\n`);
  }
}
