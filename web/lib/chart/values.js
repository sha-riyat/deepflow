// Valeurs courantes des indicateurs, affichées dans la légende à côté de leur nom.
import { compact as money, fmt, qty, sgn } from '../fmt.js';
import { optionSummary } from '../indicators.js';
import { bigMin } from './requests.js';
import { cvdDivergences, sessionCvd } from '@shared/cvd.js';
import { vwapStart } from '../layers/vwap.js';
import { compositeOf, nakedList, weeklySessions } from '../layers/volprofile.js';
import { prevAndToday } from '../layers/levels.js';
import { MAX_SESSION_TF, SESSION_STYLE, rangesOf } from '../layers/marketsessions.js';
import { RELATION_LABEL, SHAPE_LABEL, auctionLabel, auctionState, openLocation, openZoneLabel, profileShape, valueRelation } from '@shared/auction.js';
import { nextMarkers, periodStart } from '@shared/sessions.js';
import { formatDuration } from '@shared/measures.js';
import { ibLevels, nyOpenPrice, openType, openTypeLabel } from '@shared/opening.js';
import { QUADRANT_LABEL, oiChange } from '@shared/oiflow.js';
import { orbLabel } from '../layers/orb.js';
import { hoursLabel } from '../layers/hours.js';
import { clockNow } from '../clock.js';

const DAY = 86_400_000;

export function indicatorValues(chart, items) {
  const { layers: L, opts, style } = chart.settings;
  const data = chart.data;
  const out = {};
  const last = data.bars[data.bars.length - 1];

  if (L.vwap && last) {
    // VWAP de la période (jour, semaine ou mois UTC) de la dernière bougie, cumulé comme sur le graphique.
    const { period } = opts.vwap;
    const start = periodStart(last.t0, period);
    let pv = 0;
    let v = 0;
    let i = data.bars.length - 1;
    for (; i >= 0 && periodStart(data.bars[i].t0, period) === start; i--) {
      pv += data.bars[i].pv ?? 0;
      v += data.bars[i].v;
    }
    const [apv, , av] = vwapStart(data.vwapAnchor, data.bars[i + 1], period);
    pv += apv;
    v += av;
    if (v > 0) out.vwap = fmt(pv / v);
  }
  const range = opts.profile.range;
  const list = range === 'week' ? weeklySessions(data.profiles) : data.profiles;
  const s = range.startsWith('c') ? compositeOf(data.dailySessions, range) : list[list.length - 1];
  if (L.profile && style !== 'tpo' && s && s.poc !== null) {
    const what = range === 'sessions' ? `Séance ${SESSION_STYLE[s.kind]?.[0] ?? ''}` : { day: 'Jour', week: 'Semaine', visible: 'Visible', c5: 'Composite 5 j', c10: 'Composite 10 j' }[range] ?? '';
    const shape = profileShape(s);
    out.profile = `${what} · POC ${fmt((s.poc + 0.5) * s.bucket)} · VA ${fmt(s.val * s.bucket)}–${fmt((s.vah + 1) * s.bucket)}${shape ? ` · forme ${SHAPE_LABEL[shape]}` : ''}`;
  }
  if (L.prev && style !== 'tpo') {
    const { prev, today } = prevAndToday(data.dailySessions);
    const rel = valueRelation(prev, today);
    out.prev = prev ? (today ? `${auctionLabel(auctionState(prev, today))}${rel ? ` · ${RELATION_LABEL[rel]} (en cours)` : ''}` : 'session du jour en attente') : 'chargement…';
  }
  if (L.open && style !== 'tpo') {
    const { prev, today } = prevAndToday(data.dailySessions);
    const loc = openLocation(prev, today);
    const nyPrice = nyOpenPrice(today, clockNow());
    const ny = nyPrice === null ? null : openLocation(prev, today, nyPrice);
    out.open = loc ? `${fmt(loc.open)} · ${openZoneLabel(loc)}${ny ? ` · NY ${fmt(ny.open)} : ${openZoneLabel(ny)}` : ''}` : today ? fmt(today.open) : data.dailySessions.length ? 'session du jour en attente' : 'chargement…';
  }
  if (L.ib && style !== 'tpo') {
    const { today } = prevAndToday(data.dailySessions);
    const ib = ibLevels(today, clockNow());
    const open = openType(today, clockNow());
    if (!ib) out.ib = data.dailySessions.length ? 'session du jour en attente' : 'chargement…';
    else if (!ib.done) out.ib = `en formation jusqu’à ${new Date(ib.end).toISOString().slice(11, 16)} UTC`;
    else out.ib = `${fmt(ib.lo)} – ${fmt(ib.hi)}${open ? ` · ${openTypeLabel(open)}` : ''}`;
  }
  if (L.hours) out.hours = hoursLabel(clockNow(), opts.hours);
  if (L.orb && style !== 'tpo') out.orb = orbLabel(data, clockNow(), opts.orb);
  if (L.oiprof) {
    // Dernière heure : variation du prix et de l'OI, et le cas correspondant.
    const now = clockNow();
    const c = chart.meta?.market === 'futures' ? oiChange(data.oi, data.bars, now - 3_600_000, now) : null;
    out.oiprof = chart.meta?.market !== 'futures' ? 'futures uniquement' : c
      ? `1 h : prix ${sgn(c.dPrice, 2)} %, OI ${sgn(c.dOi, 2)} % · ${QUADRANT_LABEL[c.quadrant]}` : 'chargement de l’OI…';
  }
  if (L.keys && style !== 'tpo') {
    const k = data.keyLevels;
    const parts = k && [k.weekOpen !== null && `Ouv. S ${fmt(k.weekOpen)}`, k.monthOpen !== null && `Ouv. M ${fmt(k.monthOpen)}`, k.prevDay && `J-1 ${fmt(k.prevDay.lo)} – ${fmt(k.prevDay.hi)}`];
    out.keys = k ? parts.filter(Boolean).join(' · ') : 'chargement…';
  }
  if (L.sessions) {
    // Session en cours, sinon la dernière terminée, avec son range.
    const now = clockNow();
    const tf = chart.spec.type === 'time' ? chart.spec.param : Infinity;
    const list = rangesOf(data.bars, now - DAY, now, opts.sessions.show, now);
    const cur = list.filter((x) => !x.done).pop() ?? list[list.length - 1];
    const [name] = cur ? SESSION_STYLE[cur.kind] : [];
    out.sessions = tf > MAX_SESSION_TF ? 'intervalle d’1 h au plus' : cur ? `${name}${cur.done ? ' (terminée)' : ' en cours'} · ${fmt(cur.lo)} – ${fmt(cur.hi)}` : 'aucune session en vue';
  }
  if (L.heat && chart.meta?.archive) out.heat = 'indisponible en replay (carnet non archivé par Binance)';
  if (L.times) {
    // Prochains repères : délai avant l'ouverture de New York et avant le financement.
    const show = opts.times.show;
    const now = clockNow();
    const next = nextMarkers(now, { ny: show !== 'funding', funding: show !== 'ny' && chart.meta?.market === 'futures' });
    const parts = [];
    if (next.ny) parts.push(`NY dans ${formatDuration(next.ny - now)}`);
    if (next.funding) parts.push(`financement dans ${formatDuration(next.funding - now)}`);
    out.times = parts.join(' · ');
  }
  if (L.naked && style !== 'tpo') {
    const list = nakedList(data.dailySessions, data.bars);
    const near = last && list.length ? list.reduce((a, b) => (Math.abs(b.price - last.c) < Math.abs(a.price - last.c) ? b : a)) : null;
    // Sans bougie chargée (changement de série en cours), pas de prix de référence : le nombre seul.
    out.naked = near ? `${list.length} · le plus proche ${fmt(near.price)}` : list.length ? String(list.length) : data.dailySessions.length ? 'aucun' : 'chargement…';
  }
  if (L.div && !['linebreak', 'kagi', 'pnf', 'tpo'].includes(style) && items.length >= 12) {
    const divs = cvdDivergences(items, sessionCvd(items));
    const lastDiv = divs[divs.length - 1];
    out.div = lastDiv ? `${divs.length} · dernière ${lastDiv.type === 'bear' ? 'baissière' : 'haussière'}` : 'aucune';
  }
  if (L.bubbles) out.bubbles = style === 'tpo' ? 'masquées en vue TPO' : optionSummary('bubbles', opts.bubbles);
  const min = bigMin(chart);
  if (L.big) out.big = min ? `≥ ${money(min)} $${opts.big.sess === 'on' ? ' par session' : ''}` : data.bubbles.threshold ? `auto ≥ ${qty(data.bubbles.threshold)}` : '';
  if (L.liq) {
    if (chart.meta?.market !== 'futures') out.liq = 'futures uniquement';
    else {
      const [t0, t1] = visibleTimes(chart, items);
      let longs = 0;
      let shorts = 0;
      for (const [t, p, q, side] of data.liqs) {
        if (t < t0 || t > t1) continue;
        if (side < 0) longs += p * q;
        else shorts += p * q;
      }
      out.liq = `L ${money(longs)} · S ${money(shorts)}`;
    }
  }
  if (L.alerts) out.alerts = chart.alerts.length ? `${chart.alerts.length} active${chart.alerts.length > 1 ? 's' : ''}` : 'aucune';
  return out;
}

function visibleTimes(chart, items) {
  const s = chart.scale;
  if (s.mode === 'time') return [s.tLeft, s.tRight];
  const a = items[Math.max(0, Math.floor(s.indexOfX(0)))];
  const b = items[Math.min(items.length - 1, Math.ceil(s.indexOfX(s.w)))];
  return [a?.t0 ?? 0, b?.t1 ?? clockNow()];
}
