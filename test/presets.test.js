// Tests des mises en page et modèles nommés, et du fichier d'export / import.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  templateOf, cleanName, parsePresets, serializePresets, upsert, removeNamed, uniqueName, exportFile, readExport, mergeImport, NAME_MAX,
} from '../shared/presets.js';

const line = (id) => ({ id, type: 'hline', pts: [{ t: 1, p: 100 }], style: { color: '#ffffff' } });

test('modèle d’indicateurs : réglages d’affichage sans symbole ni intervalle', () => {
  const prefs = { type: 'time', param: 60000, style: 'candles', fpMode: 'delta', panes: ['cvd'], layers: { heat: true }, opts: {}, legend: true, gamma: 1 };
  assert.deepEqual(templateOf(prefs), { style: 'candles', fpMode: 'delta', panes: ['cvd'], layers: { heat: true }, opts: {}, gamma: 1 });
  assert.deepEqual(templateOf(null), {});
});

test('noms : espaces nettoyés, longueur bornée, doublons numérotés', () => {
  assert.equal(cleanName('  Scalping   BTC '), 'Scalping BTC');
  assert.equal(cleanName(42), '');
  assert.equal(cleanName('x'.repeat(80)).length, NAME_MAX);
  const list = [{ name: 'Scalping', value: {} }, { name: 'Scalping (2)', value: {} }];
  assert.equal(uniqueName(list, 'Scalping'), 'Scalping (3)');
  assert.equal(uniqueName(list, 'Swing'), 'Swing');
  assert.equal(uniqueName(list, '  '), 'Sans nom');
});

test('liste nommée : ajout, remplacement du même nom, suppression', () => {
  let list = upsert([], 'A', { n: 1 });
  list = upsert(list, 'B', { n: 2 });
  list = upsert(list, ' A ', { n: 3 });
  assert.deepEqual(list.map((x) => [x.name, x.value.n]), [['A', 3], ['B', 2]]);
  assert.equal(upsert(list, '', {}), list); // nom vide : rien
  assert.deepEqual(removeNamed(list, 'A').map((x) => x.name), ['B']);
});

test('stockage : versionné, lecture tolérante', () => {
  const p = { layouts: [{ name: 'Deux écrans', value: { grid: '2' } }], templates: [{ name: 'Footprint', value: { fpMode: 'delta' } }] };
  assert.deepEqual(parsePresets(serializePresets(p)), p);
  assert.equal(JSON.parse(serializePresets(p)).v, 1);
  const bad = JSON.stringify({ layouts: [{ name: '', value: {} }, { name: 'ok', value: 'x' }, { name: 'ok', value: { a: 1 } }, null], templates: 'non' });
  assert.deepEqual(parsePresets(bad), { layouts: [{ name: 'ok', value: { a: 1 } }], templates: [] });
  assert.deepEqual(parsePresets('{pas du json'), { layouts: [], templates: [] });
  assert.deepEqual(parsePresets(null), { layouts: [], templates: [] });
});

test('export / import : fichier reconnu, dessins fusionnés, doublons renommés', () => {
  const mine = { layouts: [{ name: 'Matin', value: { grid: '1' } }], templates: [] };
  const theirs = { layouts: [{ name: 'Matin', value: { grid: '4' } }], templates: [{ name: 'Delta', value: { fpMode: 'delta' } }] };
  const file = readExport(exportFile(theirs, { 'futures:BTCUSDT': [line('a'), line('b')] }));
  const out = mergeImport(mine, { 'futures:BTCUSDT': [line('a')] }, file);
  assert.deepEqual(out.presets.layouts.map((x) => x.name), ['Matin', 'Matin (2)']);
  assert.equal(out.presets.layouts[1].value.grid, '4');
  assert.deepEqual(out.presets.templates.map((x) => x.name), ['Delta']);
  assert.deepEqual(out.drawings['futures:BTCUSDT'].map((d) => d.id), ['a', 'b']); // « a » déjà présent : gardé une fois
  assert.deepEqual(out.counts, { layouts: 1, templates: 1, drawings: 1 });
  assert.throws(() => readExport('{"layouts":[]}'), /pas un export deepflow/);
  assert.throws(() => readExport('pas du json'), /illisible/);
});
