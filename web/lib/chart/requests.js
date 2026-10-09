// Requêtes de données dépendant de la vue (heatmap, bulles, profils, historique plus ancien),
// limitées à 4 par seconde.
const DERIVED = ['linebreak', 'kagi', 'pnf'];
const DAY = 86_400_000;
const SLOTS = [100, 200, 500, 1e3, 2e3, 5e3, 1e4, 15e3, 3e4, 6e4, 12e4, 3e5, 6e5, 9e5, 18e5, 36e5];

// Créneau des bulles : environ `px` pixels, et en bougies temps un diviseur ou un multiple de
// l'intervalle, pour que chaque bulle tombe dans une seule bougie.
export function bubbleSlot(msPerPx, px, tf = null) {
  const target = msPerPx * px;
  if (tf && target >= tf) return tf * Math.max(1, Math.round(target / tf));
  const fits = SLOTS.filter((v) => !tf || tf % v === 0);
  return fits.find((v) => v >= target) ?? fits[fits.length - 1] ?? SLOTS[0];
}

export function requestData(chart, items) {
  const now = Date.now();
  if (now - chart.requests.t < 250) return;
  chart.requests.t = now;
  const s = chart.scale;
  const { layers } = chart.settings;
  const meta = chart.meta;
  const tL = s.mode === 'time' ? s.tLeft : items[Math.max(0, Math.floor(s.indexOfX(0)))]?.t0 ?? now;
  const tR = s.mode === 'time' ? Math.min(s.tRight, now) : items[Math.min(items.length - 1, Math.ceil(s.indexOfX(s.w)))]?.t1 ?? now;

  if (layers.heat && s.mode === 'time' && tR > (chart.data.heatStart ?? 0)) {
    // Seule la période couverte par la mémoire de heatmap est demandée.
    const hL = Math.max(tL, chart.data.heatStart ?? tL);
    const p = { from: Math.floor(hL), to: Math.floor(tR), cols: Math.min(2048, Math.max(1, Math.round((tR - hL) / s.msPerPx))), rowLo: Math.floor(s.pBottom / meta.bucket), rowHi: Math.ceil(s.pTop / meta.bucket) };
    const key = JSON.stringify(p);
    if (key !== chart.requests.heat || s.follow) {
      chart.requests.heat = key;
      chart.data.loadHeat(p);
    }
  }
  if (layers.bubbles || layers.big) {
    const span = Math.max(1000, tR - tL);
    const slot = bubbleSlot(span / s.w, 8, s.mode === 'time' && chart.spec.type === 'time' ? chart.spec.param : null);
    const key = `${Math.floor(tL / slot)}:${Math.floor(tR / (slot * 20))}:${slot}`;
    if (key !== chart.requests.bubbles && span <= 86_400_000) {
      chart.requests.bubbles = key;
      chart.data.loadBubbles(Math.max(tL, tR - 86_400_000), tR, slot);
    }
  }
  if (layers.profile || chart.settings.style === 'tpo') {
    const day = 86_400_000;
    const from = Math.floor(Math.max(tL, tR - 7 * day) / day) * day;
    const key = `${from}:${Math.floor(tR / day)}:${Math.floor(now / 15_000)}`;
    if (key !== chart.requests.profiles) {
      chart.requests.profiles = key;
      chart.data.loadProfiles(from, tR, meta.fpBucket);
    }
  }
  if ((layers.liq || chart.settings.panes.includes('liq')) && meta.market === 'futures') {
    const key = `${Math.floor(tL / 60_000)}:${Math.floor(tR / 60_000)}:${Math.floor(now / 30_000)}`;
    if (key !== chart.requests.liqs) {
      chart.requests.liqs = key;
      chart.data.loadLiquidations(tL, tR);
    }
  }
  const first = chart.data.bars[0];
  if (layers.vwap && first && first.t0 % DAY !== 0 && chart.requests.vwap !== first.t0) {
    chart.requests.vwap = first.t0; // VWAP du jour : ancrage avant la première bougie chargée
    chart.data.loadVwapAnchor(first.t0);
  }
  if (items.length && chart.scale.xAt(items[0].t0, items) > -50 && !DERIVED.includes(chart.settings.style)) chart.data.loadOlder();
}
