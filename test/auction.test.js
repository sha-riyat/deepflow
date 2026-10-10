// Tests de la lecture d'enchère : HVN / LVN, forme du profil, acceptation / rejet, composite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auctionLabel, auctionState, compositeSession, profileShape, volumeNodes } from '../shared/auction.js';

// Profil à partir d'une liste de volumes par ligne (lignes 100, 101, ...).
const prof = (vols, extra = {}) => {
  const rows = vols.map((v, i) => [100 + i, v / 2, v / 2]);
  let poc = 0;
  vols.forEach((v, i) => v > vols[poc] && (poc = i));
  return { rows, poc: 100 + poc, bucket: 1, ...extra };
};

test('HVN / LVN : deux bosses séparées par un creux, petites bosses filtrées', () => {
  const bimodal = [1, 3, 8, 10, 8, 3, 1, 1, 2, 7, 12, 7, 2, 1];
  const n = volumeNodes(prof(bimodal).rows, { smooth: 1 });
  assert.deepEqual(n.hvn, [103, 110]);
  assert.equal(n.lvn.length, 1);
  assert.ok(n.lvn[0] >= 106 && n.lvn[0] <= 107);
  // Bruit de ± 1 sur une seule bosse : un seul HVN, aucun LVN.
  const noisy = [2, 4, 6, 9, 8, 9, 10, 9, 6, 4, 2];
  assert.deepEqual(volumeNodes(prof(noisy).rows, { smooth: 3 }).lvn, []);
});

test('forme du profil : D, P, b et double distribution', () => {
  assert.equal(profileShape(prof([1, 2, 4, 8, 10, 8, 4, 2, 1])), 'D');
  assert.equal(profileShape(prof([1, 1, 1, 1, 2, 4, 9, 12, 8])), 'P');
  assert.equal(profileShape(prof([8, 12, 9, 4, 2, 1, 1, 1, 1])), 'b');
  assert.equal(profileShape(prof([1, 3, 8, 10, 8, 3, 1, 1, 2, 7, 12, 7, 2, 1]), undefined), 'double');
});

test('acceptation / rejet face à la value area de la veille (2 périodes de 30 min)', () => {
  const prev = { bucket: 1, val: 100, vah: 109, poc: 104 }; // VAL 100, VAH 110
  const day = (periods) => ({ t0: 0, bucket: 1, tpoMs: 1_800_000, periods });
  const now = 10 * 1_800_000;
  // Sortie au-dessus (plus haut 114), puis deux clôtures dans la valeur → rejet par le haut.
  const rej = auctionState(prev, day([[0, 104, 106, 105], [1, 106, 113, 112], [2, 107, 113, 108], [3, 103, 108, 104]]), now);
  assert.deepEqual([rej.state, rej.side, rej.extreme, rej.count], ['rejected', 1, 114, 2]);
  assert.equal(rej.at, 4 * 1_800_000);
  assert.match(auctionLabel(rej), /rejet par le haut/);
  // Deux clôtures sous la VAL → acceptation sous la valeur.
  const acc = auctionState(prev, day([[0, 101, 103, 102], [1, 96, 101, 97], [2, 94, 98, 95]]), now);
  assert.deepEqual([acc.state, acc.side, acc.count], ['accepted', -1, 2]);
  // Une seule clôture dehors : sortie en cours ; période en cours ignorée.
  const out = auctionState(prev, day([[0, 101, 103, 102], [1, 108, 112, 111], [2, 109, 115, 114]]), 2 * 1_800_000 + 5);
  assert.deepEqual([out.state, out.count], ['outside', 1]);
  // Retour après une sortie mais une seule clôture dedans : retour en cours.
  const back = auctionState(prev, day([[0, 108, 112, 111], [1, 105, 111, 106]]), now);
  assert.equal(back.state, 'returning');
  assert.equal(auctionState(prev, day([[0, 102, 106, 104]]), now).state, 'inside');
});

test('profil composite : volumes fusionnés, POC et value area recalculés', () => {
  const a = { t0: 0, t1: 86_400_000, bucket: 1, rows: [[100, 5, 5], [101, 1, 1]], hi: 102, lo: 100 };
  const b = { t0: 86_400_000, t1: 172_800_000, bucket: 1, rows: [[101, 6, 6], [102, 1, 0]], hi: 103, lo: 101 };
  const c = compositeSession([a, b]);
  assert.deepEqual(c.rows, [[100, 5, 5], [101, 7, 7], [102, 1, 0]]);
  assert.equal(c.poc, 101);
  assert.deepEqual([c.lo, c.hi, c.days], [100, 103, 2]);
  assert.equal(compositeSession([a, b], 1).poc, 101);
});
