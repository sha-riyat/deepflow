// Valeurs courantes des indicateurs, affichées dans la légende à côté de leur nom.
import { compact as money, fmt, qty } from '../fmt.js';
import { optionSummary } from '../indicators.js';
import { vwapStart } from '../layers/vwap.js';
import { nakedList, weeklySessions } from '../layers/volprofile.js';

const DAY = 86_400_000;

export function indicatorValues(chart, items) {
  const { layers: L, opts, style } = chart.settings;
  const data = chart.data;
  const out = {};
  const last = data.bars[data.bars.length - 1];

  if (L.vwap && last) {
    // VWAP du jour UTC de la dernière bougie, cumulé comme sur le graphique.
    const day = Math.floor(last.t0 / DAY);
    let pv = 0;
    let v = 0;
    let i = data.bars.length - 1;
    for (; i >= 0 && Math.floor(data.bars[i].t0 / DAY) === day; i--) {
      pv += data.bars[i].pv ?? 0;
      v += data.bars[i].v;
    }
    const [apv, , av] = vwapStart(data.vwapAnchor, data.bars[i + 1]);
    pv += apv;
    v += av;
    if (v > 0) out.vwap = fmt(pv / v);
  }
  const range = opts.profile.range;
  const list = range === 'week' ? weeklySessions(data.profiles) : data.profiles;
  const s = list[list.length - 1];
  if (L.profile && style !== 'tpo' && s && s.poc !== null) {
    const what = { day: 'Jour', week: 'Semaine', visible: 'Visible' }[range] ?? '';
    out.profile = `${what} · POC ${fmt((s.poc + 0.5) * s.bucket)} · VA ${fmt(s.val * s.bucket)}–${fmt((s.vah + 1) * s.bucket)}`;
  }
  if (L.naked && style !== 'tpo') {
    const list = nakedList(data.nakedSessions, data.bars);
    const near = last && list.length ? list.reduce((a, b) => (Math.abs(b.price - last.c) < Math.abs(a.price - last.c) ? b : a)) : null;
    // Sans bougie chargée (changement de série en cours), pas de prix de référence : le nombre seul.
    out.naked = near ? `${list.length} · le plus proche ${fmt(near.price)}` : list.length ? String(list.length) : data.nakedSessions.length ? 'aucun' : 'chargement…';
  }
  if (L.bubbles) out.bubbles = style === 'tpo' ? 'masquées en vue TPO' : optionSummary('bubbles', opts.bubbles);
  if (L.big) out.big = opts.big.min ? `≥ ${money(opts.big.min)} $` : data.bubbles.threshold ? `auto ≥ ${qty(data.bubbles.threshold)}` : '';
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
  if (L.signals) {
    const open = chart.signals.find((x) => x.status === 'open');
    out.signals = open ? `${open.side} ouvert à ${fmt(open.entry)}` : 'aucun en cours';
  }
  if (L.alerts) out.alerts = chart.alerts.length ? `${chart.alerts.length} active${chart.alerts.length > 1 ? 's' : ''}` : 'aucune';
  return out;
}

function visibleTimes(chart, items) {
  const s = chart.scale;
  if (s.mode === 'time') return [s.tLeft, s.tRight];
  const a = items[Math.max(0, Math.floor(s.indexOfX(0)))];
  const b = items[Math.min(items.length - 1, Math.ceil(s.indexOfX(s.w)))];
  return [a?.t0 ?? 0, b?.t1 ?? Date.now()];
}
