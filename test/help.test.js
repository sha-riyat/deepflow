// Tests de l'aide intégrée : chaque indicateur, panneau et mode du footprint a sa fiche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTICLES, FOOTPRINT_HELP, LEVELS, article, helpId, searchArticles } from '../web/lib/help/index.js';
import { LAYERS } from '../web/lib/indicators.js';

test('aide : fiches complètes et identifiants uniques', () => {
  const ids = ARTICLES.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const a of ARTICLES) {
    assert.ok(a.title && a.what && Array.isArray(a.read) && Array.isArray(a.traps), a.id);
    assert.ok(a.level in LEVELS, a.id);
  }
});

test('aide : une fiche par calque, panneau, outil et mode du footprint', () => {
  for (const k of Object.keys(LAYERS)) if (k !== 'alerts') assert.ok(article(helpId(k)), `calque ${k}`);
  for (const k of ['volume', 'delta', 'cvd', 'oi', 'liq', 'stats', 'spot', 'funding', 'venues']) assert.ok(article(helpId(k, 'pane')), `panneau ${k}`);
  for (const k of ['long', 'short', 'avwap', 'vp']) assert.ok(article(helpId(k, 'tool')), `outil ${k}`);
  for (const k of ['bidask', 'ladder', 'delta', 'volume', 'trades', 'voldelta', 'profile', 'deltaprofile']) assert.ok(FOOTPRINT_HELP[k], `footprint ${k}`);
  assert.equal(helpId('inconnu'), null);
});

test('aide : recherche sans accents ni casse', () => {
  assert.ok(searchArticles('ABSORPTION').some((a) => a.id === 'absorption'));
  assert.ok(searchArticles('ecart type').some((a) => a.id === 'vwap')); // « écarts-types »
  assert.equal(searchArticles('').length, ARTICLES.length);
  assert.equal(searchArticles('zzzz').length, 0);
});
