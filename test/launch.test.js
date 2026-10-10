// Tests des vérifications du lanceur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { needsBuild, nodeOk, openCommand } from '../scripts/checks.js';

test('lanceur : version de Node', () => {
  assert.equal(nodeOk('v22.4.0'), true);
  assert.equal(nodeOk('v22.11.1'), true);
  assert.equal(nodeOk('v24.0.0'), true);
  assert.equal(nodeOk('v22.3.9'), false);
  assert.equal(nodeOk('v20.18.0'), false);
});

test('lanceur : reconstruction de l’interface et ouverture du navigateur', () => {
  assert.equal(needsBuild(null, [1]), true);
  assert.equal(needsBuild(10, [5, 9]), false);
  assert.equal(needsBuild(10, [5, 11]), true);
  assert.deepEqual(openCommand('darwin', 'http://x'), ['open', ['http://x']]);
  assert.equal(openCommand('win32', 'http://x')[0], 'cmd');
  assert.equal(openCommand('linux', 'http://x')[0], 'xdg-open');
});
