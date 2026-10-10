// Calques du tracé principal, de part et d'autre des bougies : dessous, les profils, niveaux,
// repères et marques horodatées ; dessus, divergences, VWAP, gros prints, liquidations et alertes.
import { drawVwap } from '../layers/vwap.js';
import { drawNakedPocs, drawVolumeProfiles, nakedList } from '../layers/volprofile.js';
import { drawDayOpen, drawPrevLevels } from '../layers/levels.js';
import { drawKeyLevels } from '../layers/keylevels.js';
import { drawIb } from '../layers/ib.js';
import { drawTimeMarkers } from '../layers/times.js';
import { MAX_SESSION_TF, drawMarketSessions } from '../layers/marketsessions.js';
import { drawDivergences } from '../layers/divergence.js';
import { drawTpoView } from '../layers/tpo.js';
import { drawQuotes, drawAlertLines } from '../layers/marks.js';
import { drawBubbles, drawBigPrints, drawLiquidations } from '../layers/flow.js';
import { clockNow } from '../clock.js';

const DERIVED = ['linebreak', 'kagi', 'pnf'];
export const INDEXED = [...DERIVED, 'tpo']; // vues sans échelle de temps continue

export function drawBehind(chart, ctx, items, geo) {
  const { scale: s, settings: st, data } = chart;
  const L = st.layers;
  const O = st.opts;
  const tpo = st.style === 'tpo';
  if (tpo) drawTpoView(ctx, items, geo, s, { ...O.tpo, naked: L.naked });
  else if (L.profile) drawVolumeProfiles(ctx, data.profiles, s, items, O.profile, data.dailySessions);
  if (L.prev && !tpo) drawPrevLevels(ctx, data.dailySessions, s, items);
  if (L.open && !tpo) drawDayOpen(ctx, data.dailySessions, s, items);
  if (L.ib && !tpo) drawIb(ctx, data.dailySessions, s, items, clockNow(), O.ib);
  if (L.keys && !tpo) drawKeyLevels(ctx, data.keyLevels, s, items, O.keys);
  if (L.sessions && s.mode === 'time' && chart.spec.param <= MAX_SESSION_TF) drawMarketSessions(ctx, s, items, data.bars, clockNow(), O.sessions);
  if (L.times && !INDEXED.includes(st.style)) drawTimeMarkers(ctx, s, items, { show: O.times.show, futures: chart.meta.market === 'futures' });
  if (L.naked && !tpo) drawNakedPocs(ctx, nakedList(data.dailySessions, data.bars), s, items);
  // Marques horodatées : sans objet dans la vue TPO (une colonne par jour).
  if (L.bubbles && !tpo) drawBubbles(ctx, s, items, data.bubbleRows(), data.bubbles.slot, O.bubbles);
  if (L.quotes && s.mode === 'time' && s.msPerPx < 3000) drawQuotes(ctx, s, items, data.ticks);
}

export function drawAbove(chart, ctx, items, geo) {
  const { scale: s, settings: st, data } = chart;
  const L = st.layers;
  const O = st.opts;
  const tpo = st.style === 'tpo';
  if (L.div && !INDEXED.includes(st.style)) drawDivergences(ctx, items, geo, s);
  if (L.vwap && !INDEXED.includes(st.style)) drawVwap(ctx, items, geo, s, O.vwap, data.vwapAnchor);
  if (L.big && !tpo) drawBigPrints(ctx, s, items, data.bigPrints(), O.big);
  if (L.liq && !tpo) drawLiquidations(ctx, s, items, geo, data.liqs, O.liq);
  if (L.alerts) drawAlertLines(ctx, s, chart.alerts);
}
