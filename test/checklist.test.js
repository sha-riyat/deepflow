// Tests de la check-list avant trade : intégrité de la liste, bilan, note indicative.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECKLIST, PHASES, checklistSummary, cleanChecked } from '../shared/checklist.js';
import { article } from '../web/lib/help/index.js';

const ids = CHECKLIST.map((s) => s.id);
const core = CHECKLIST.filter((s) => s.core).map((s) => s.id);

test('check-list : identifiants uniques, fiches d’aide existantes, phases dans l’ordre de la routine', () => {
  assert.equal(new Set(ids).size, ids.length);
  for (const s of CHECKLIST) {
    assert.ok(s.label && s.phase && s.where, s.id); // chaque case dit où trouver l'outil
    if (s.help) assert.ok(article(s.help), `${s.id} → fiche ${s.help}`);
  }
  assert.deepEqual(PHASES, ['Avant la séance', 'Ouverture', 'État du marché', 'Lieu', 'Confirmation', 'Plan et risque']);
  assert.ok(core.length >= 4 && core.length < ids.length);
});

test('check-list : bilan, cases essentielles et note indicative', () => {
  const none = checklistSummary([]);
  assert.deepEqual([none.done, none.total, none.ready, none.grade], [0, ids.length, false, 'C']);
  assert.equal(none.coreMissing.length, core.length);
  const all = checklistSummary(ids);
  assert.deepEqual([all.done, all.ready, all.grade, all.missing.length], [ids.length, true, 'A', 0]);
  // essentielles seules : prêt à entrer, mais moins de 70 % cochées → note C
  const onlyCore = checklistSummary(core);
  assert.equal(onlyCore.ready, true);
  assert.equal(onlyCore.grade, 'C');
  // une essentielle manquante empêche d'être prêt, même avec presque tout coché
  const almost = checklistSummary(ids.filter((id) => id !== core[0]));
  assert.deepEqual([almost.ready, almost.grade, almost.coreMissing.map((s) => s.id)], [false, 'C', [core[0]]]);
  // toutes les essentielles plus la moitié des autres (entre 70 % et 90 %) → B
  const others = ids.filter((id) => !core.includes(id));
  const b = checklistSummary([...core, ...others.slice(0, Math.ceil(others.length * 0.7))]);
  assert.ok(b.share >= 0.7 && b.share < 0.9 && b.ready, String(b.share));
  assert.equal(b.grade, 'B');
  // identifiants inconnus ignorés par le bilan
  assert.equal(checklistSummary(['inconnu']).done, 0);
});

test('check-list : lecture tolérante du stockage', () => {
  assert.deepEqual(cleanChecked(['pl-rr', 'inconnu', 'pl-rr', 'lo-zone']), ['pl-rr', 'lo-zone']);
  assert.deepEqual(cleanChecked(null), []);
  assert.deepEqual(cleanChecked('abc'), []);
});
