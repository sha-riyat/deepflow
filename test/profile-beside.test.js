// Tests du placement des profils de session « à côté des bougies » (profil d'une ou deux bougies).
import test from 'node:test';
import assert from 'node:assert/strict';
import { profilesBeside } from '../web/lib/layers/beside.js';

const H = 3_600_000;
const st = (range = 'day', place = 'auto', on = true, style = 'candles') => ({ layers: { profile: on }, opts: { profile: { range, place } }, style });
const tf = (ms) => ({ type: 'time', param: ms });

test('profils à côté des bougies : seulement quand un profil couvre une ou deux bougies', () => {
  assert.equal(profilesBeside(st('day'), tf(24 * H)), true); // 1J : un profil par bougie
  assert.equal(profilesBeside(st('day'), tf(12 * H)), true); // 12h : deux bougies par profil
  assert.equal(profilesBeside(st('day'), tf(4 * H)), false); // 4h : six bougies, profil sur les bougies
  assert.equal(profilesBeside(st('day'), tf(5 * 60_000)), false); // 5m : classique
  assert.equal(profilesBeside(st('week'), tf(7 * 24 * H)), true); // semaine en 1S
  assert.equal(profilesBeside(st('week'), tf(24 * H)), false); // semaine en 1J : sept bougies
  assert.equal(profilesBeside(st('sessions'), tf(4 * H)), true); // séances en 4h
  assert.equal(profilesBeside(st('sessions'), tf(H)), false);
});

test('profils à côté des bougies : pas pour les profils épinglés, ni si désactivé, ni hors bougies temps', () => {
  for (const r of ['visible', 'c5', 'c10']) assert.equal(profilesBeside(st(r), tf(24 * H)), false); // épinglés au bord droit
  assert.equal(profilesBeside(st('day', 'over'), tf(24 * H)), false); // réglage « Toujours sur les bougies »
  assert.equal(profilesBeside(st('day', 'auto', false), tf(24 * H)), false); // calque éteint
  assert.equal(profilesBeside(st('day', 'auto', true, 'tpo'), tf(24 * H)), false); // vue TPO
  assert.equal(profilesBeside(st('day'), { type: 'volume', param: 1000 }), false); // bougies d'activité
  assert.equal(profilesBeside({ layers: { profile: true }, opts: {}, style: 'candles' }, tf(24 * H)), true); // réglages par défaut
});

test('profils à côté des bougies : la bougie et son profil tiennent dans le même créneau', async () => {
  const { BESIDE_BODY, BESIDE_SHIFT, besideBox } = await import('../web/lib/layers/beside.js');
  const slot = 120;
  const left = 1000; // bord gauche du créneau
  const center = left + slot / 2 - slot * BESIDE_SHIFT; // centre décalé de la bougie
  const { start, width } = besideBox(center, slot);
  assert.ok(start > center + (slot * BESIDE_BODY) / 2, 'le profil commence après le corps de la bougie');
  assert.ok(start + width < left + slot, 'le profil s’arrête avant le créneau suivant');
  assert.ok(width >= slot * 0.4, `largeur utile : ${width}`);
  assert.equal(besideBox(0, 4).width, 8); // largeur minimale au fort dézoom
});
