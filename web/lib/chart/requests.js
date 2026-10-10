// Requêtes de données dépendant de la vue (heatmap, bulles, profils, historique plus ancien),
// limitées à 4 par seconde.
import { rowBucket } from '@shared/auction.js';
import { bySession } from '@shared/bigprints.js';
import { clockNow } from '../clock.js';
import { periodStart } from '@shared/sessions.js';
import { INDEXED } from './plot.js';

const DAY = 86_400_000;
const OI_PERIODS = [['5m', 3e5], ['15m', 9e5], ['30m', 18e5], ['1h', 36e5], ['2h', 72e5], ['4h', 144e5], ['6h', 216e5], ['12h', 432e5], ['1d', 864e5]];
const PREMIUM = [['1m', 6e4], ['5m', 3e5], ['15m', 9e5], ['1h', 36e5], ['4h', 144e5], ['1d', 864e5]];
const SLOTS = [100, 200, 500, 1e3, 2e3, 5e3, 1e4, 15e3, 3e4, 6e4, 12e4, 3e5, 6e5, 9e5, 18e5, 36e5];

// Créneau des bulles : environ `px` pixels, et en bougies temps un diviseur ou un multiple de
// l'intervalle, pour que chaque bulle tombe dans une seule bougie.
export function bubbleSlot(msPerPx, px, tf = null) {
  const target = msPerPx * px;
  if (tf && target >= tf) return tf * Math.max(1, Math.round(target / tf));
  const fits = SLOTS.filter((v) => !tf || tf % v === 0);
  return fits.find((v) => v >= target) ?? fits[fits.length - 1] ?? SLOTS[0];
}

// Taille des lignes des profils de volume : pourcentage du prix arrondi à un pas « rond »
// (0,05 % ≈ 50 $ sur BTC, 1 à 2 $ sur ETH), jamais plus fin que la tranche du footprint.
export function profileBucket(chart) {
  const { meta } = chart;
  const last = chart.data.bars[chart.data.bars.length - 1];
  return rowBucket(last?.c, meta.fpBucket, chart.settings.opts.profile.row);
}

// Seuil des gros prints en devise de cotation : « selon l'actif » = valeurs de départ du cours
// (50 k $ sur BTC, 25 k $ ailleurs, à calibrer pour ne voir que quelques bulles par heure).
export function bigMin(chart) {
  const v = chart.settings.opts.big.min;
  if (v !== -1) return v;
  return chart.meta?.symbol?.startsWith('BTC') ? 50_000 : 25_000;
}

// Montant demandé au serveur : avec un seuil ajusté par session, le plus bas des seuils (Asie ×0,5) ;
// le navigateur filtre ensuite session par session.
export function bigRequestMin(chart) {
  const min = bigMin(chart);
  return min > 0 && chart.settings.opts.big.sess === 'on' ? min * 0.5 : min;
}

// Gros prints à montrer : ceux de la plage chargée et du direct, au seuil de session si activé.
export function bigPool(chart) {
  const all = chart.data.bigPrints();
  const min = bigMin(chart);
  return chart.settings.opts.big.sess === 'on' && min > 0 ? bySession(all, min) : all;
}

export function requestData(chart, items) {
  // `now` : présent du graphique (heure rejouée en replay) pour les plages de données ; `real` :
  // heure réelle pour le rythme des requêtes (4 par seconde au plus, rafraîchissements).
  const now = clockNow();
  const real = Date.now();
  if (real - chart.requests.t < 250) return;
  chart.requests.t = real;
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
  const tpo = chart.settings.style === 'tpo';
  if ((layers.bubbles || layers.big) && !tpo) {
    const span = Math.max(1000, tR - tL);
    const slot = bubbleSlot(span / s.w, chart.settings.opts.bubbles.density, s.mode === 'time' && chart.spec.type === 'time' ? chart.spec.param : null);
    const min = bigRequestMin(chart);
    const key = `${Math.floor(tL / slot)}:${Math.floor(tR / (slot * 20))}:${slot}:${min}`;
    if (key !== chart.requests.bubbles && span <= 86_400_000) {
      chart.requests.bubbles = key;
      chart.data.loadBubbles(Math.max(tL, tR - 86_400_000), tR, slot, min);
    }
  }
  // Composite : calculé côté navigateur à partir des sessions journalières (pas de requête de profil).
  const composite = layers.profile && chart.settings.opts.profile.range.startsWith('c');
  if ((layers.profile && !composite) || tpo) {
    // Vue TPO : les N dernières sessions ; profil : sessions visibles (7 jours au plus), depuis le
    // lundi pour la semaine, ou un profil unique de la plage visible (3 jours au plus).
    const { tpo: T, profile: P } = chart.settings.opts;
    const visible = !tpo && P.range === 'visible';
    let from = tpo ? Math.floor(now / DAY) * DAY - (T.days - 1) * DAY : Math.floor(Math.max(tL, tR - 7 * DAY) / DAY) * DAY;
    if (!tpo && P.range === 'week') from = Math.floor((from - 4 * DAY) / (7 * DAY)) * 7 * DAY + 4 * DAY;
    if (visible) from = Math.max(tL, tR - 3 * DAY);
    const to = tpo ? now : tR;
    const params = { tpo: tpo ? T.period : 30, ...(visible ? { mode: 'range' } : {}) };
    // Plage visible : rechargée quand la vue bouge d'un dixième de sa largeur.
    const step = visible ? Math.max(60_000, (tR - tL) / 10) : DAY;
    const bucket = tpo ? meta.fpBucket : profileBucket(chart);
    const key = `${Math.floor(from / step)}:${Math.floor(to / step)}:${Math.floor(real / 15_000)}:${bucket}:${JSON.stringify(params)}`;
    if (key !== chart.requests.profiles) {
      chart.requests.profiles = key;
      chart.data.loadProfiles(from, to, bucket, params);
    }
  }
  if ((layers.naked || layers.prev || layers.open || layers.ib || composite) && !tpo) {
    // Sessions journalières (10 jours + aujourd'hui), quelle que soit la vue : POC non testés, value
    // area de la veille et état d'acceptation, ouverture du jour, profils composites.
    const from = Math.floor(now / DAY) * DAY - 10 * DAY;
    const bucket = profileBucket(chart);
    const key = `${from}:${Math.floor(real / 15_000)}:${bucket}`;
    if (key !== chart.requests.daily) {
      chart.requests.daily = key;
      chart.data.loadDaily(from, now, bucket);
    }
  }
  if (((layers.liq && !tpo) || chart.settings.panes.includes('liq')) && meta.market === 'futures') {
    const key = `${Math.floor(tL / 60_000)}:${Math.floor(tR / 60_000)}:${Math.floor(real / 30_000)}`;
    if (key !== chart.requests.liqs) {
      chart.requests.liqs = key;
      chart.data.loadLiquidations(tL, tR);
    }
  }
  if (chart.settings.panes.includes('spot')) {
    // CVD spot : klines spot du même actif (bougies temps uniquement, 1000 bougies par requête).
    const param = chart.spec.type === 'time' ? chart.spec.param : 0;
    if (!param || meta.market !== 'futures') {
      chart.data.spot.error = 'CVD spot : bougies temps sur un marché futures uniquement';
    } else {
      if (chart.data.spot.error?.startsWith('CVD spot : bougies')) chart.data.spot.error = null;
      const key = `${param}:${Math.floor(tL / (param * 500))}:${Math.floor(real / 20_000)}`;
      if (key !== chart.requests.spot) {
        chart.requests.spot = key;
        chart.data.loadSpot(param, Math.max(tL, tR - 999 * param), tR + param);
      }
    }
  }
  if (chart.settings.panes.includes('venues')) {
    const key = `${Math.floor(tL / 60_000)}:${Math.floor(tR / 60_000)}:${Math.floor(real / 10_000)}`;
    if (key !== chart.requests.venues) {
      chart.requests.venues = key;
      chart.data.loadVenues(tL - 86_400_000, tR); // depuis la veille : CVD de session complet
    }
  }
  if (chart.settings.panes.includes('funding') && meta.market === 'futures') {
    // Indice de prime à l'intervalle Binance le plus proche (1 min au minimum), 1000 bougies.
    const tf = chart.spec.type === 'time' ? chart.spec.param : 0;
    const [interval, ms] = PREMIUM.find(([, p]) => p >= tf) ?? PREMIUM[PREMIUM.length - 1];
    const key = `${interval}:${Math.floor(tR / (ms * 500))}:${Math.floor(real / 30_000)}`;
    if (key !== chart.requests.funding) {
      chart.requests.funding = key;
      chart.data.loadFunding(interval, Math.min(now, tR + ms * 100));
    }
  }
  if ((chart.settings.panes.includes('oi') || layers.oiprof) && meta.market === 'futures') {
    // Période Binance la plus proche de l'intervalle des bougies (5 min au minimum, 30 jours d'historique).
    const tf = chart.spec.type === 'time' ? chart.spec.param : 0;
    const [period, ms] = OI_PERIODS.find(([, p]) => p >= tf) ?? OI_PERIODS[OI_PERIODS.length - 1];
    const key = `${period}:${Math.floor(tR / (ms * 100))}:${Math.floor(real / 60_000)}`;
    if (key !== chart.requests.oi) {
      chart.requests.oi = key;
      chart.data.loadOI(period, Math.min(now, tR + ms * 50));
    }
  }
  const first = chart.data.bars[0];
  if (layers.keys && !tpo) {
    const key = `${Math.floor(now / DAY)}:${Math.floor(real / 300_000)}`; // chaque jour, nouvel essai toutes les 5 min
    if (key !== chart.requests.levels) {
      chart.requests.levels = key;
      chart.data.loadLevels();
    }
  }
  const { period } = chart.settings.opts.vwap;
  if (layers.vwap && first && first.t0 !== periodStart(first.t0, period) && chart.requests.vwap !== `${period}:${first.t0}`) {
    chart.requests.vwap = `${period}:${first.t0}`; // VWAP de la période : ancrage avant la première bougie chargée
    chart.data.loadVwapAnchor(first.t0, period);
  }
  if (items.length && chart.scale.xAt(items[0].t0, items) > -50 && !INDEXED.includes(chart.settings.style)) chart.data.loadOlder();
}
