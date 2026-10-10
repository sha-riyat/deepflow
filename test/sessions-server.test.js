// Tests du collecteur multi-symboles : sessions à la demande, arrêt des sessions inactives, replay
// à part, flux SSE partagé (événements préfixés par la clé de session).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Sessions, parseKey } from '../server/sessions.js';
import { Hub } from '../server/hub.js';

// Session simulée : enregistre ses démarrages et arrêts, sans réseau.
class FakeSession {
  constructor(cfg, { hub }) {
    Object.assign(this, { cfg, hub, started: [], stopped: false });
  }

  async start(symbol, archive = null) {
    this.cfg.symbol = symbol;
    this.started.push([symbol, archive]);
  }

  stop() {
    this.stopped = true;
  }
}

const make = (alerts = []) => new Sessions({ market: 'futures', symbol: 'BTCUSDT', footprint: {} }, { items: alerts }, { rests: {}, SessionClass: FakeSession });

test('clés de session', () => {
  assert.deepEqual(parseKey('futures:ETHUSDT'), { market: 'futures', symbol: 'ETHUSDT' });
  assert.deepEqual(parseKey('spot:BTCUSDT'), { market: 'spot', symbol: 'BTCUSDT' });
  assert.deepEqual(parseKey('replay'), { replay: true });
  assert.equal(parseKey('margin:BTC'), null);
  assert.equal(parseKey('futures:btc;rm'), null);
});

test('sessions : une par marché et symbole, démarrée à la demande, marché propre', () => {
  const s = make();
  const a = s.get();
  assert.equal(a.key, 'futures:BTCUSDT');
  assert.equal(s.get('futures:BTCUSDT'), a); // même session
  const b = s.get('spot:ETHUSDT');
  assert.notEqual(b, a);
  assert.equal(b.cfg.market, 'spot');
  assert.equal(a.cfg.market, 'futures'); // configuration copiée, pas partagée
  assert.deepEqual(b.started, [['ETHUSDT', null]]);
  assert.equal(s.get('replay'), null); // pas de replay en cours
  assert.throws(() => s.get('nimporte'), /session invalide/);
  for (let i = 0; i < 6; i++) s.get(`futures:X${i}USDT`);
  assert.throws(() => s.get('futures:TROPUSDT'), /au plus 8/);
  clearInterval(s.timer);
});

test('sessions : arrêt après inactivité, sauf session par défaut ou alerte active', () => {
  const s = make([{ enabled: true, symbol: 'SOLUSDT' }]);
  const now = Date.now();
  const def = s.get();
  const eth = s.get('futures:ETHUSDT');
  const sol = s.get('futures:SOLUSDT');
  for (const x of [def, eth, sol]) x.hub.idleSince = now - 10 * 60_000;
  s.gc(now);
  assert.equal(eth.stopped, true);
  assert.equal(s.map.has('futures:ETHUSDT'), false);
  assert.equal(def.stopped, false);
  assert.equal(sol.stopped, false); // surveillée par une alerte
  clearInterval(s.timer);
});

test('replay : session à part, remplacée par un nouveau replay', () => {
  const s = make();
  const live = s.get();
  const r1 = s.startReplay({ market: 'futures', symbol: 'ETHUSDT', from: 1, speed: 20 });
  assert.equal(s.get('replay'), r1);
  assert.deepEqual(r1.started, [['ETHUSDT', { from: 1, speed: 20 }]]);
  const r2 = s.startReplay({ market: 'spot', symbol: 'BTCUSDT', from: 2, speed: 1 });
  assert.equal(r1.stopped, true);
  assert.equal(s.get('replay'), r2);
  assert.equal(live.stopped, false); // le direct continue
  s.stopReplay();
  assert.equal(s.get('replay'), null);
  clearInterval(s.timer);
});

test('flux partagé : événements préfixés par la clé, abonnés comptés', () => {
  const a = new Hub();
  const b = new Hub();
  a.setMeta({ symbol: 'BTCUSDT' });
  const req = new EventEmitter();
  const out = [];
  const res = { write: (s) => out.push(s) };
  a.attach(req, res, 'futures:BTCUSDT|');
  b.attach(req, res, 'spot:ETHUSDT|');
  b.tick({ t: 1 });
  assert.ok(out.some((s) => s.startsWith('event: futures:BTCUSDT|meta\n')));
  assert.ok(out.some((s) => s.startsWith('event: spot:ETHUSDT|ready\n')));
  assert.ok(out.some((s) => s.startsWith('event: spot:ETHUSDT|tick\n')));
  assert.equal(a.idleSince, null);
  req.emit('close');
  assert.ok(a.idleSince > 0 && b.idleSince > 0);
  assert.equal(a.clients.size, 0);
});
