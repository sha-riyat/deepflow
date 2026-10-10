// Tests des dessins : conversions (heure, prix) <-> pixels, test du clic, format sauvegardé.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  indexOfTime, timeOfIndex, toPixel, fromPixel, movePoints, shapeOf, hitTest, distToSegment, parseDrawings, serializeDrawings, cleanStyle, setHandle,
} from '../shared/drawings.js';

// Échelle minimale (mêmes formules que web/lib/chart/scale.js).
function scale(mode) {
  return {
    mode, w: 1000, h: 500, tRight: 100_000, msPerPx: 100, iRight: 10, pxPerBar: 20, pTop: 110, pBottom: 100,
    xOfTime(t) { return this.w - (this.tRight - t) / this.msPerPx; },
    timeOfX(x) { return this.tRight - (this.w - x) * this.msPerPx; },
    xOfIndex(i) { return this.w - (this.iRight - i) * this.pxPerBar; },
    indexOfX(x) { return this.iRight - (this.w - x) / this.pxPerBar; },
    yOfPrice(p) { return ((this.pTop - p) / (this.pTop - this.pBottom)) * this.h; },
    priceOfY(y) { return this.pTop - (y / this.h) * (this.pTop - this.pBottom); },
  };
}

// Bougies d'activité de durées inégales (ticks, renko...).
const bars = [{ t0: 0, t1: 1000 }, { t0: 1000, t1: 4000 }, { t0: 4000, t1: 5000 }];

test('dessins : heure <-> position sur un axe de bougies d’activité, prolongé hors des données', () => {
  assert.equal(indexOfTime(bars, 0), -0.5);
  assert.equal(indexOfTime(bars, 2500), 1); // milieu de la deuxième bougie
  assert.equal(indexOfTime(bars, 5000), 2.5);
  assert.equal(indexOfTime(bars, 5000 + 5000 / 3), 3.5); // une durée moyenne après la fin
  for (const t of [-2000, 0, 700, 1000, 3999, 4500, 9000]) assert.ok(Math.abs(timeOfIndex(bars, indexOfTime(bars, t)) - t) < 1e-6, `t = ${t}`);
});

test('dessins : un point garde sa place quel que soit le mode de l’échelle', () => {
  for (const mode of ['time', 'index']) {
    const s = scale(mode);
    const pt = { t: 2500, p: 104.2 };
    const [x, y] = toPixel(s, bars, pt);
    const back = fromPixel(s, bars, x, y);
    assert.equal(back.t, pt.t);
    assert.ok(Math.abs(back.p - pt.p) < 1e-9);
  }
  const moved = movePoints(scale('time'), bars, [{ t: 50_000, p: 105 }], 10, -50);
  assert.deepEqual(moved, [{ t: 51_000, p: 106 }]); // 10 px = 1 s, -50 px = +1 de prix
});

test('dessins : clic sur une ligne, sur une poignée, à côté', () => {
  assert.equal(distToSegment(5, 3, 0, 0, 10, 0), 3);
  assert.equal(distToSegment(-4, 3, 0, 0, 10, 0), 5); // au-delà de l'extrémité
  const shapes = [shapeOf({ type: 'trend' }, [[0, 0], [100, 100]]), shapeOf({ type: 'trend' }, [[0, 100], [100, 0]])];
  assert.deepEqual(hitTest(shapes, 50, 50), { index: 1, handle: -1 }); // croisement : la plus récente
  assert.deepEqual(hitTest(shapes, 20, 24), { index: 0, handle: -1 });
  assert.equal(hitTest(shapes, 50, 80), null);
  assert.deepEqual(hitTest(shapes, 98, 103, 6, 0), { index: 0, handle: 1 }); // poignée du dessin sélectionné
});

test('dessins : sauvegarde versionnée, lecture tolérante', () => {
  const d = { id: 'a', type: 'trend', pts: [{ t: 1, p: 2 }, { t: 3, p: 4 }], style: { color: '#ffffff' } };
  const sets = parseDrawings(serializeDrawings({ 'futures:BTCUSDT': [d], 'spot:ETHUSDT': [] }));
  assert.deepEqual(Object.keys(sets), ['futures:BTCUSDT']); // jeux vides non écrits
  assert.equal(sets['futures:BTCUSDT'][0].style.color, '#ffffff');
  assert.equal(sets['futures:BTCUSDT'][0].style.width, 1.5); // style complété par défaut
  assert.equal(JSON.parse(serializeDrawings(sets)).v, 1);
  const bad = JSON.stringify({ v: 1, sets: { k: [d, { id: 'b', type: 'inconnu', pts: [] }, { ...d, id: 'c', pts: [{ t: 1, p: null }, { t: 1, p: 1 }] }] } });
  assert.deepEqual(parseDrawings(bad).k.map((x) => x.id), ['a']);
  assert.deepEqual(parseDrawings('{pas du json'), {});
  assert.deepEqual(parseDrawings(null), {});
});

test('dessins : style vérifié, valeurs inconnues remplacées par défaut', () => {
  assert.deepEqual(cleanStyle({ color: '#E0685F', width: 3, dash: 'dot' }), { color: '#E0685F', width: 3, dash: 'dot' });
  assert.deepEqual(cleanStyle({ color: 'red; x', width: 40, dash: 'wavy' }), { color: '#479ffa', width: 1.5, dash: 'solid' });
  assert.deepEqual(cleanStyle(undefined), cleanStyle({}));
  // Type de profil (profil à plage fixe) : conservé s'il est valide, absent sinon (= volume).
  assert.equal(cleanStyle({ kind: 'delta' }).kind, 'delta');
  assert.equal(cleanStyle({ kind: 'bidask' }).kind, 'bidask');
  assert.equal('kind' in cleanStyle({ kind: 'n’importe quoi' }), false);
  assert.equal('kind' in cleanStyle({ color: '#ffffff' }), false);
  // Niveaux prolongés (profil à plage fixe) : conservés seulement s'ils valent vrai.
  assert.equal(cleanStyle({ extend: true }).extend, true);
  assert.equal('extend' in cleanStyle({ extend: false }), false);
  assert.equal('extend' in cleanStyle({ extend: 'oui' }), false);
  // Pics / creux et totaux : affichés par défaut, le style ne garde que le choix de les masquer.
  assert.equal(cleanStyle({ nodes: false, totals: false }).nodes, false);
  assert.equal(cleanStyle({ nodes: false, totals: false }).totals, false);
  assert.equal('nodes' in cleanStyle({ nodes: true }), false);
  assert.equal('totals' in cleanStyle({}), false);
});

test('dessins : horizontale, rayon et verticale prolongés jusqu’aux bords du tracé', () => {
  const view = { w: 800, h: 400 };
  assert.deepEqual(shapeOf({ type: 'hline' }, [[300, 120]], view).segs, [[0, 120, 800, 120]]);
  assert.deepEqual(shapeOf({ type: 'hray' }, [[300, 120]], view).segs, [[300, 120, 800, 120]]);
  assert.deepEqual(shapeOf({ type: 'vline' }, [[300, 120]], view).segs, [[300, 0, 300, 400]]);
  const shapes = [shapeOf({ type: 'hray' }, [[300, 120]], view)];
  assert.equal(hitTest(shapes, 200, 120), null); // à gauche de l'origine du rayon
  assert.deepEqual(hitTest(shapes, 700, 123), { index: 0, handle: -1 });
});

test('dessins : rectangle, clic à l’intérieur et coins opposés', () => {
  const r = shapeOf({ type: 'rect' }, [[100, 50], [300, 150]]);
  assert.deepEqual(r.handles, [[100, 50], [300, 150], [100, 150], [300, 50]]);
  assert.deepEqual(hitTest([r], 200, 100), { index: 0, handle: -1 }); // à l'intérieur
  assert.equal(hitTest([r], 400, 100), null);
  const d = { type: 'rect', pts: [{ t: 1, p: 10 }, { t: 5, p: 20 }] };
  assert.deepEqual(setHandle(d, 2, { t: 0, p: 25 }), [{ t: 0, p: 10 }, { t: 5, p: 25 }]); // coin (t du 1er, p du 2e)
  assert.deepEqual(setHandle(d, 3, { t: 9, p: 5 }), [{ t: 1, p: 5 }, { t: 9, p: 20 }]);
  assert.deepEqual(setHandle({ type: 'trend', pts: d.pts }, 1, { t: 7, p: 8 }), [{ t: 1, p: 10 }, { t: 7, p: 8 }]);
  assert.deepEqual(d.pts, [{ t: 1, p: 10 }, { t: 5, p: 20 }]); // l'original n'est pas modifié
});

test('dessins : retracement de Fibonacci (0 sur la fin du mouvement, 1 sur son début)', async () => {
  const { fibLevels } = await import('../shared/measures.js');
  const lv = fibLevels(100, 200); // hausse de 100 à 200
  assert.deepEqual(lv.map((l) => l.level), [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]);
  assert.equal(lv[0].price, 200);
  assert.equal(lv[3].price, 150);
  assert.ok(Math.abs(lv[4].price - 138.2) < 1e-9);
  assert.equal(lv[6].price, 100);
  const f = shapeOf({ type: 'fib' }, [[300, 400], [100, 200]]);
  assert.deepEqual(f.segs[0], [100, 200, 300, 200]); // niveau 0 au second point, de gauche à droite
  assert.deepEqual(f.segs[6], [100, 400, 300, 400]);
  assert.deepEqual(hitTest([f], 200, 300), { index: 0, handle: -1 }); // sur la diagonale (guide)
});

test('dessins : note (texte obligatoire et borné, boîte de clic selon la taille)', async () => {
  const { textBox } = await import('../shared/drawings.js');
  const note = { id: 'n', type: 'text', pts: [{ t: 1, p: 2 }], text: 'Support\nà surveiller', style: { width: 2 } };
  const ok = parseDrawings(serializeDrawings({ k: [note, { ...note, id: 'x', text: undefined }, { ...note, id: 'y', text: 'a'.repeat(501) }] }));
  assert.deepEqual(ok.k.map((d) => d.id), ['n']);
  const box = textBox(note.text, 2);
  assert.equal(box.size, 15);
  assert.equal(box.lines.length, 2);
  const shape = shapeOf(note, [[100, 50]]);
  assert.deepEqual(hitTest([shape], 110, 60), { index: 0, handle: -1 });
  assert.equal(hitTest([shape], 90, 60), null);
});

test('dessins : règle (écart, %, bougies, durée)', async () => {
  const { rulerStats, formatDuration } = await import('../shared/measures.js');
  const st = rulerStats({ t: 0, p: 60_000 }, { t: 15 * 60_000, p: 60_300 }, { tf: 60_000 });
  assert.equal(st.dp, 300);
  assert.equal(st.pct, 0.5);
  assert.equal(st.bars, 15);
  assert.equal(rulerStats({ t: 500, p: 10 }, { t: 2500, p: 9 }, { columns: (t) => indexOfTime(bars, t) }).bars, 1); // milieu à milieu : 1 colonne
  assert.equal(rulerStats({ t: 0, p: 10 }, { t: 1, p: 9 }).bars, null);
  assert.deepEqual([45e3, 12 * 6e4, 135 * 6e4, 120 * 6e4, (3 * 24 + 4) * 36e5, 2 * 864e5].map(formatDuration), ['45 s', '12 min', '2 h 15', '2 h', '3 j 4 h', '2 j']);
});

test('dessins : position longue / courte (taille selon le risque, R:R)', async () => {
  const { positionStats, positionPoints, cleanCalc } = await import('../shared/measures.js');
  // Long à 60 000, stop 59 400 (-1 %), cible 61 200 (+2 %), capital 1 000 $, risque 1 % = 10 $.
  const st = positionStats({ side: 'long', entry: 60_000, stop: 59_400, target: 61_200, capital: 1000, risk: 1 });
  assert.equal(st.valid, true);
  assert.equal(st.rr, 2);
  assert.equal(st.riskAmount, 10);
  assert.ok(Math.abs(st.qty - 10 / 600) < 1e-12); // 0,0167 BTC
  assert.ok(Math.abs(st.notional - 1000) < 1e-9);
  assert.ok(Math.abs(st.leverage - 1) < 1e-12);
  assert.ok(Math.abs(st.gain - 20) < 1e-9);
  assert.equal(st.stopPct, 1);
  assert.equal(st.targetPct, 2);
  // Court : stop au-dessus, cible en dessous.
  const sh = positionStats({ side: 'short', entry: 100, stop: 105, target: 90, capital: 500, risk: 2 });
  assert.equal(sh.rr, 2);
  assert.equal(sh.qty, 2); // 10 $ risqués / 5 $ par unité
  // Stop du mauvais côté : calcul refusé.
  assert.equal(positionStats({ side: 'long', entry: 100, stop: 101, target: 110, capital: 1000, risk: 1 }).valid, false);
  assert.deepEqual(positionPoints({ t: 0, p: 100 }, 'short', 2, 50), [{ t: 0, p: 100 }, { t: 50, p: 102 }, { t: 50, p: 96 }]);
  assert.deepEqual(cleanCalc({ capital: -5, risk: 'x' }), { capital: 1000, risk: 1, fees: 0.05 });
  assert.equal(cleanCalc({ capital: 1, risk: 1, fees: 0 }).fees, 0); // sans frais : accepté
  // Frais de 0,05 % par ordre : la perte au stop reste de 10 $ frais compris, la taille baisse.
  const net = positionStats({ side: 'long', entry: 100, stop: 99, target: 102, capital: 1000, risk: 1, fees: 0.05 });
  const qty = 10 / (1 + 0.0005 * 199); // 9,095
  assert.ok(Math.abs(net.qty - qty) < 1e-9);
  assert.ok(Math.abs(net.qty * (1 + 0.0005 * 199) - 10) < 1e-9); // perte au stop frais compris
  assert.ok(Math.abs(net.gain - qty * (2 - 0.0005 * 202)) < 1e-9);
  assert.ok(Math.abs(net.rr - net.gain / 10) < 1e-12 && net.rr < 2);
  // Poignées : stop et cible ne bougent qu'en prix, la fin qu'en heure.
  const d = { type: 'long', pts: positionPoints({ t: 0, p: 100 }, 'long', 2, 50) };
  assert.deepEqual(setHandle(d, 1, { t: 99, p: 97 })[1], { t: 50, p: 97 });
  assert.deepEqual(setHandle(d, 3, { t: 80, p: 1 }).map((q) => q.t), [0, 80, 80]);
  const sh2 = shapeOf(d, [[100, 200], [300, 220], [300, 160]]);
  assert.deepEqual(sh2.areas, [[100, 160, 300, 200], [100, 200, 300, 220]]); // cible, stop
});

test('dessins : aimant sur l’ouverture, le plus haut, le plus bas ou la clôture', async () => {
  const { snapToBar } = await import('../shared/measures.js');
  const bar = { t0: 60_000, t1: 119_000, o: 100, h: 110, l: 95, c: 105 };
  const yOf = (p) => (200 - p) * 4; // 1 de prix = 4 px
  const pt = { t: 70_000, p: 108.9 };
  assert.deepEqual(snapToBar(bar, pt, yOf(108.9), yOf, { tf: 60_000 }), { t: 90_000, p: 110 }); // plus haut, milieu de la minute
  assert.deepEqual(snapToBar(bar, { t: 70_000, p: 104 }, yOf(104), yOf), { t: 89_500, p: 105 }); // clôture, milieu de t0 – t1
  assert.deepEqual(snapToBar(bar, { t: 1, p: 140 }, yOf(140), yOf), { t: 1, p: 140 }); // trop loin (120 px) : libre
  assert.deepEqual(snapToBar(null, pt, 0, yOf), pt);
});

test('dessins : VWAP ancré (cumul depuis la bougie d’ancrage)', async () => {
  const { anchoredVwap } = await import('../shared/measures.js');
  const k = [
    { t0: 0, t1: 59, pv: 100 * 1, v: 1 },
    { t0: 60, t1: 119, pv: 110 * 3, v: 3 },
    { t0: 120, t1: 179, pv: 0, v: 0 },
    { t0: 180, t1: 239, pv: 90 * 4, v: 4 },
  ];
  const { points, partial } = anchoredVwap(k, 60);
  assert.equal(partial, false);
  assert.deepEqual(points.map((q) => q.vwap), [110, 110, (330 + 360) / 7]); // bougie sans volume : valeur reprise
  assert.equal(anchoredVwap(k, -100).partial, true); // ancre avant les données chargées
  assert.deepEqual(anchoredVwap(k, 1000).points, []);
  assert.equal(anchoredVwap(k, 90).points[0].vwap, 110); // ancre au milieu d'une bougie : elle est incluse
  // Forme : la poignée est le premier point de la courbe, les segments hors de la vue sont ignorés.
  const sh = shapeOf({ type: 'avwap' }, [[0, 0]], { w: 100, h: 100 }, { curve: [[-50, 10], [-20, 12], [10, 14], [40, 15], [150, 16], [200, 16]] });
  assert.deepEqual(sh.handles, [[-50, 10]]);
  assert.equal(sh.segs.length, 3);
});
