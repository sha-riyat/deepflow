// Tests des étiquettes mises en attente : celles des calques tracés sous les bougies sont dessinées après.
import test from 'node:test';
import assert from 'node:assert/strict';
import { drawHeldLabels, holdLabels, pill, releaseLabels } from '../web/lib/theme.js';

// Contexte de dessin minimal : retient les textes écrits.
function fakeCtx() {
  const texts = [];
  return {
    texts,
    measureText: (t) => ({ width: t.length * 6 }),
    beginPath() {}, roundRect() {}, fill() {},
    fillText: (t) => texts.push(t),
  };
}

test('étiquettes : mises en attente pendant le tracé du dessous, dessinées ensuite dans l’ordre', () => {
  const ctx = fakeCtx();
  holdLabels();
  const w = pill(ctx, 10, 20, 'VAH J-1 100', { bg: '#000' });
  pill(ctx, 10, 40, 'VAL J-1 90', { bg: '#000' });
  assert.equal(w, 'VAH J-1 100'.length * 6 + 14); // la largeur reste connue de l'appelant
  assert.deepEqual(ctx.texts, []); // rien n'est dessiné pendant l'attente
  const list = releaseLabels();
  assert.equal(list.length, 2);
  pill(ctx, 0, 0, 'immédiat', { bg: '#000' }); // après la fin de l'attente : dessin direct
  assert.deepEqual(ctx.texts, ['immédiat']);
  drawHeldLabels(ctx, list);
  assert.deepEqual(ctx.texts, ['immédiat', 'VAH J-1 100', 'VAL J-1 90']);
  assert.deepEqual(releaseLabels(), []); // plus rien en attente
});
