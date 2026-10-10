// Tests de la lecture d'enchère : HVN / LVN, forme du profil, acceptation / rejet, composite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auctionLabel, auctionState, compositeSession, openLocation, profileShape, profileTotals, rangeBucket, volumeNodes } from '../shared/auction.js';

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

test('ouverture du jour face à la value area de la veille', () => {
  const prev = { bucket: 1, val: 100, vah: 109 }; // VAL 100, VAH 110
  assert.deepEqual(openLocation(prev, { open: 112 }), { open: 112, where: 'above' });
  assert.equal(openLocation(prev, { open: 110 }).where, 'inside'); // sur la VAH : encore dans la valeur
  assert.equal(openLocation(prev, { open: 99.5 }).where, 'below');
  assert.equal(openLocation(prev, null), null);
});

test('taille des lignes d’un profil de plage : ~30 lignes sur la hauteur, jamais plus fin que la tranche', () => {
  assert.equal(rangeBucket(82_918, 83_138, 5), 10); // 220 $ / 30 = 7,3 → 10 $ (22 lignes)
  assert.equal(rangeBucket(82_000, 83_000, 5), 50); // 1 000 $ / 30 = 33 → 50 $
  assert.equal(rangeBucket(82_990, 83_010, 5), 5); // 20 $ / 30 = 0,7 → la tranche du collecteur
  assert.equal(rangeBucket(100, 100, 5), 5); // plage sans hauteur
  assert.equal(rangeBucket(0, 3_000, 10, 30), 100); // 100 $ : multiple de la tranche
});

test('totaux d’un profil : volume, achats, ventes, delta et delta en % du volume', () => {
  const s = { rows: [[10, 6, 2], [11, 1, 5], [12, 3, 3]] };
  const t = profileTotals(s);
  assert.deepEqual([t.volume, t.buy, t.sell, t.delta], [20, 10, 10, 0]);
  assert.equal(t.deltaPct, 0);
  const u = profileTotals({ rows: [[1, 15, 5]] });
  assert.deepEqual([u.volume, u.delta, u.deltaPct], [20, 10, 50]);
  assert.deepEqual(profileTotals({ rows: [] }), { volume: 0, buy: 0, sell: 0, delta: 0, deltaPct: 0 });
});

test('HVN / LVN : le pic est sur la ligne de plus gros volume, pas sur son voisin après lissage', () => {
  // Profil réel d'une plage de BTC (lignes de 10 $, du bas vers le haut) : pic de 159 à l'indice 17,
  // voisin d'un creux de 46 (indice 18) ; la moyenne lissée du creux (94) dépasse celle du pic (89).
  const vols = [33, 25, 79, 342, 60, 57, 23, 48, 91, 30, 75, 81, 103, 60, 103, 56, 62, 159, 46, 76];
  const rows = vols.map((v, i) => [i, v / 2, v / 2]);
  const { hvn, lvn } = volumeNodes(rows);
  assert.ok(hvn.includes(3), 'le POC est un HVN');
  assert.ok(hvn.includes(17), 'le pic de 159 est sur sa propre ligne');
  assert.ok(!hvn.includes(18), 'pas sur la ligne creuse voisine (46)');
  assert.deepEqual(lvn, [6]); // le creux de 23, entre les deux pics
});

test('profil dessiné comme zone de référence : acceptation puis rejet, périodes de 30 min depuis la fin de la plage', () => {
  const MIN = 60_000;
  // Profil d'une plage : value area 100–110 (VAH ligne 109, VAL ligne 100), POC 104, lignes de 1.
  const ref = { vah: 109, val: 100, poc: 104, bucket: 1 };
  // Suite de la plage qui démarre à 10:07 (pas alignée sur une demi-heure) : périodes [k, bas, haut, clôture].
  const t0 = Date.parse('2026-10-10T10:07:00Z');
  const after = (periods) => ({ t0, tpoMs: 30 * MIN, bucket: 1, periods });
  // Deux clôtures de suite au-dessus de la VAH (110) : acceptation.
  const acc = auctionState(ref, after([[0, 108, 112, 111], [1, 110, 113, 112]]), t0 + 2 * 30 * MIN + 1);
  assert.deepEqual([acc.state, acc.side, acc.count], ['accepted', 1, 2]);
  assert.equal(auctionLabel(acc, 'du profil'), 'acceptation au-dessus de la VAH (2 × 30 min)');
  // Sortie par le haut puis deux clôtures de retour dans la valeur : rejet.
  const rej = auctionState(ref, after([[0, 108, 113, 111], [1, 105, 111, 107], [2, 104, 108, 106]]), t0 + 3 * 30 * MIN + 1);
  assert.deepEqual([rej.state, rej.side], ['rejected', 1]);
  // Sans sortie : dans la valeur du profil (et non « de la veille »).
  const inside = auctionState(ref, after([[0, 103, 107, 105]]), t0 + 30 * MIN + 1);
  assert.equal(auctionLabel(inside, 'du profil'), 'dans la valeur du profil');
  assert.equal(auctionLabel(inside), 'dans la valeur de la veille');
});
