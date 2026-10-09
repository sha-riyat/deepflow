// Graphique unifié : un seul système de coordonnées pour la heatmap, les bougies, le footprint,
// les profils, les marques et les panneaux. Dessine à la demande et pilote le chargement des données.
import { Scale } from './scale.js';
import { drawPriceAxis, drawTimeAxis, drawCrosshair, drawPaneCrosshair } from './axes.js';
import { drawPane, paneValues } from './panes.js';
import { attachInteractions } from './interact.js';
import { requestData } from './requests.js';
import { indicatorValues } from './values.js';
import { HeatLayer } from '../layers/heat.js';
import { drawSeries, drawLineBreak, drawKagi, drawPointFigure } from '../layers/candles.js';
import { drawFootprint, MIN_SLOT } from '../layers/footprint.js';
import { drawVolumeProfiles, drawVwap } from '../layers/profile.js';
import { drawTpoView, tpoItems } from '../layers/tpo.js';
import { drawBubbles, drawBigPrints, drawQuotes, drawSignals, drawAlertLines, drawLiquidations } from '../layers/marks.js';
import { heikinAshi, lineBreak, kagi, pointFigure } from '@shared/transforms.js';
import { defaultOptions } from '../indicators.js';
import { C } from '../theme.js';

const AXIS_W = 84;
const TIME_H = 24;
const DERIVED = ['linebreak', 'kagi', 'pnf'];
const INDEXED = [...DERIVED, 'tpo']; // vues sans échelle de temps continue

export class Chart {
  constructor(root, data) {
    this.root = root;
    this.data = data;
    this.scale = new Scale();
    this.meta = null;
    this.signals = [];
    this.alerts = [];
    this.title = '';
    this.settings = {
      style: 'candles',
      fpMode: 'off',
      gamma: 0.9,
      paneH: 90,
      panes: ['volume', 'delta'],
      layers: { heat: true, bubbles: true, big: true, quotes: true, profile: false, naked: true, vwap: false, signals: true, alerts: true, liq: true },
      opts: defaultOptions(), // réglages par indicateur (voir indicators.js)
    };
    const mk = (cls) => {
      const c = document.createElement('canvas');
      c.className = cls;
      root.appendChild(c);
      return c;
    };
    this.heatCanvas = mk('heat');
    this.mainCanvas = mk('main');
    this.crossCanvas = mk('cross');
    this.heat = new HeatLayer(this.heatCanvas);
    this.ctx = this.mainCanvas.getContext('2d');
    this.cctx = this.crossCanvas.getContext('2d');
    this.mouse = null;
    this.dirty = true;
    this.onHover = null; // (bougie survolée ou dernière) -> légende HTML
    this.onPaneValues = null; // (valeurs des panneaux pour cette bougie) -> légendes des panneaux
    this.paneScales = [];
    this.onFollow = null; // (suivi du direct actif ?) -> bouton « Direct »
    this.onLayout = null; // (positions des panneaux, hauteur du tracé) -> commandes HTML
    this.onValues = null; // (valeurs courantes des indicateurs) -> légende HTML
    this.lastHover = undefined;
    this.lastFollow = undefined;
    this.requests = { heat: '', bubbles: '', profiles: '', t: 0 };
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(root);
    attachInteractions(this);
    // Une erreur de dessin ne doit pas arrêter la boucle : elle est signalée, l'image suivante réessaie.
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      try {
        this.#frame();
      } catch (err) {
        if (!this.lastError || this.lastError.message !== err.message) console.error(err);
        this.lastError = err;
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  // Libère la boucle de rendu, l'observateur et les canvas (démontage du composant).
  destroy() {
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    for (const c of [this.heatCanvas, this.mainCanvas, this.crossCanvas]) c.remove();
  }

  get spec() {
    return this.data.spec;
  }

  invalidate() {
    this.dirty = true;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: W, clientHeight: H } = this.root;
    this.dpr = dpr;
    this.W = W;
    this.H = H;
    for (const c of [this.mainCanvas, this.crossCanvas]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    this.#layout();
    this.invalidate();
  }

  #layout() {
    if (!this.W) return; // pas encore mesuré
    const s = this.scale;
    const panes = this.settings.panes.length;
    // Les panneaux partagent au plus 42 % de la hauteur : le tracé principal reste lisible.
    this.paneH = panes ? Math.max(48, Math.min(this.settings.paneH, Math.floor((this.H - TIME_H) * 0.42 / panes))) : 0;
    s.w = Math.max(50, this.W - AXIS_W);
    s.h = Math.max(80, this.H - TIME_H - panes * this.paneH);
    this.timeTop = s.h + panes * this.paneH;
    const dpr = window.devicePixelRatio || 1;
    Object.assign(this.heatCanvas.style, { width: `${s.w}px`, height: `${s.h}px` });
    this.heatCanvas.width = Math.round(s.w * dpr);
    this.heatCanvas.height = Math.round(s.h * dpr);
    if (this.W) this.onLayout?.(this.paneRects(), s.h);
  }

  // Remet la vue à zéro après un changement de série ou de style.
  resetView() {
    if (!this.W) this.resize(); // la vue dépend de la largeur réelle du graphique
    const s = this.scale;
    s.mode = this.spec.type === 'time' && !INDEXED.includes(this.settings.style) ? 'time' : 'index';
    s.follow = true;
    s.autoScale = true;
    if (s.mode === 'time') s.msPerPx = (this.spec.param * 120) / s.w;
    else if (this.settings.style === 'tpo') s.pxPerBar = Math.max(240, Math.min(560, s.w / 2.6)); // ~2 sessions et demie
    else s.pxPerBar = 8;
    this.#layout();
    this.invalidate();
  }

  // Série affichée : bougies brutes ou transformées selon le style.
  items() {
    const bars = this.data.bars;
    const { style } = this.settings;
    const box = this.meta?.fpBucket ?? 1;
    if (style === 'tpo') {
      if (this.tpoSource !== this.data.profiles) {
        this.tpoSource = this.data.profiles;
        this.tpoCache = tpoItems(this.data.profiles);
      }
      return this.tpoCache;
    }
    if (style === 'heikin') return heikinAshi(bars);
    if (style === 'linebreak') return lineBreak(bars, 3);
    if (style === 'kagi') return kagi(bars, box * 4);
    if (style === 'pnf') return pointFigure(bars, box * 2, 3);
    return bars;
  }

  geometry(items) {
    const s = this.scale;
    if (s.mode === 'time') {
      const tf = this.spec.param;
      const x = (b) => s.xOfTime(b.t0 + tf / 2);
      let i0 = items.findIndex((b) => b.t0 + tf >= s.tLeft);
      if (i0 < 0) i0 = items.length;
      let i1 = items.length - 1;
      while (i1 >= i0 && items[i1].t0 > s.tRight) i1--;
      return { x, slot: tf / s.msPerPx, range: [i0, i1] };
    }
    const i0 = Math.max(0, Math.floor(s.indexOfX(0)) - 1);
    const i1 = Math.min(items.length - 1, Math.ceil(s.indexOfX(s.w)) + 1);
    return { x: (b, i) => s.xOfIndex(i), slot: s.pxPerBar, range: [i0, i1] };
  }

  #follow(items) {
    const s = this.scale;
    if (!s.follow) return;
    if (s.mode === 'time') s.tRight = Date.now() + s.w * 0.08 * s.msPerPx;
    else s.iRight = items.length - 1 + (s.w * 0.08) / s.pxPerBar;
  }

  #autoScale(items, geo) {
    const s = this.scale;
    if (!s.autoScale) return;
    let lo = Infinity;
    let hi = -Infinity;
    const [i0, i1] = geo.range;
    for (let i = i0; i <= i1; i++) {
      const b = items[i];
      const l = b.l ?? Math.min(b.o, b.c, b.from ?? Infinity, b.to ?? Infinity);
      const h = b.h ?? Math.max(b.o ?? -Infinity, b.c ?? -Infinity, b.from ?? -Infinity, b.to ?? -Infinity);
      if (this.settings.style === 'pnf') {
        const box = (this.meta?.fpBucket ?? 1) * 2;
        lo = Math.min(lo, b.lo * box);
        hi = Math.max(hi, (b.hi + 1) * box);
      } else {
        lo = Math.min(lo, l);
        hi = Math.max(hi, h);
      }
    }
    if (!Number.isFinite(lo)) return;
    // Marge haute pour la légende ; en vue TPO, marge basse pour les dates des sessions.
    const pad = Math.max((hi - lo) * 0.08, (this.meta?.tickSize ?? 0.01) * 10);
    s.setPriceRange(lo - pad * (this.settings.style === 'tpo' ? 2.5 : 1), hi + pad);
  }

  #frame() {
    // Changement de densité de pixels (zoom du navigateur, autre écran) : on redimensionne.
    if ((window.devicePixelRatio || 1) !== this.dpr) this.resize();
    if (!this.meta || !this.W) return;
    const items = this.items();
    // En suivi du direct, on redessine au plus 10 fois par seconde.
    const now = performance.now();
    if (this.dirty || (this.scale.follow && now - (this.lastRender ?? 0) > 100)) {
      this.lastRender = now;
      this.#follow(items);
      this.#render(items);
      requestData(this, items);
    }
    this.#renderCross(items);
  }

  #render(items) {
    const { ctx, scale: s, settings: st } = this;
    const L = st.layers;
    const dpr = window.devicePixelRatio || 1;
    const geo = this.geometry(items);
    this.#autoScale(items, geo);
    this.dirty = false;
    this.geo = geo;

    const heatOn = L.heat && s.mode === 'time';
    if (heatOn) this.heat.draw(s, this.data.heat, { gamma: st.gamma, bucket: this.meta.bucket });
    else this.heat.clear();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, s.w, s.h);
    ctx.clip();
    const O = st.opts;
    const tpo = st.style === 'tpo';
    if (tpo) drawTpoView(ctx, items, geo, s, { ...O.tpo, naked: L.naked });
    else if (L.profile) drawVolumeProfiles(ctx, this.data.profiles, s, items, { ...O.profile, naked: L.naked });
    // Marques horodatées : sans objet dans la vue TPO (une colonne par jour).
    if (L.bubbles && !tpo) drawBubbles(ctx, s, items, this.data.bubbleRows(), this.data.bubbles.slot, O.bubbles);
    if (L.quotes && s.mode === 'time' && s.msPerPx < 3000) drawQuotes(ctx, s, items, this.data.ticks);

    const fpOn = st.fpMode !== 'off' && this.spec.fp > 0 && !INDEXED.includes(st.style);
    if (st.style === 'linebreak') drawLineBreak(ctx, items, geo, s);
    else if (st.style === 'kagi') drawKagi(ctx, items, geo, s);
    else if (st.style === 'pnf') drawPointFigure(ctx, items, geo, s, (this.meta.fpBucket ?? 1) * 2);
    else if (!tpo && !(fpOn && geo.slot >= MIN_SLOT)) drawSeries(ctx, items, geo, s, st.style === 'heikin' ? 'candles' : st.style);
    if (fpOn) drawFootprint(ctx, items, geo, s, { mode: st.fpMode, bucket: this.meta.fpBucket });
    if (L.vwap && !INDEXED.includes(st.style)) drawVwap(ctx, items, geo, s, O.vwap, this.data.vwapAnchor);
    if (L.big && !tpo) drawBigPrints(ctx, s, items, this.data.bigPrints(), O.big.limit);
    if (L.liq && !tpo) drawLiquidations(ctx, s, items, this.data.liqs, O.liq);
    if (L.alerts) drawAlertLines(ctx, s, this.alerts);
    if (L.signals) drawSignals(ctx, s, items, this.signals);
    ctx.restore();

    drawPriceAxis(ctx, s, AXIS_W, items[items.length - 1], this.#countdown(items));
    this.paneScales = st.panes.map((kind, k) =>
      drawPane(ctx, kind, { y: s.h + k * this.paneH, h: this.paneH }, items, geo, s, { oi: this.data.oi, liqs: this.data.liqs, axisW: AXIS_W }));
    drawTimeAxis(ctx, s, items, this.timeTop, TIME_H, AXIS_W);

    const values = indicatorValues(this, items);
    const key = JSON.stringify(values);
    if (key !== this.lastValues) {
      this.lastValues = key;
      this.onValues?.(values);
    }
  }

  #renderCross(items) {
    const { cctx: ctx, scale: s } = this;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    const m = this.mouse;
    const item = (m ? this.itemAt(items, m.x) : null) ?? items[items.length - 1] ?? null;
    if (item !== this.lastHover) {
      this.lastHover = item;
      this.onHover?.(item);
    }
    if (s.follow !== this.lastFollow) {
      this.lastFollow = s.follow;
      this.onFollow?.(s.follow);
    }
    if (m && m.x < s.w && m.y < this.timeTop) {
      drawCrosshair(ctx, s, { x: m.x, y: m.y, totalH: this.H, timeTop: this.timeTop, axisW: AXIS_W, item });
      const pane = this.paneScales.find((p) => m.y > p.top && m.y < p.top + p.h);
      if (pane?.valueAt) drawPaneCrosshair(ctx, s, m.y, pane.format(pane.valueAt(m.y)));
    }
    this.#reportPanes(items, item);
  }

  // Valeurs des panneaux pour la bougie survolée (ou la dernière), transmises si elles changent.
  #reportPanes(items, item) {
    if (!this.onPaneValues) return;
    const i = item ? items.indexOf(item) : -1;
    const ctx = { oi: this.data.oi, liqs: this.data.liqs };
    const values = Object.fromEntries(this.settings.panes.map((kind) => [kind, i < 0 ? [] : paneValues(kind, items, i, ctx)]));
    const key = JSON.stringify(values);
    if (key === this.lastPaneValues) return;
    this.lastPaneValues = key;
    this.onPaneValues(values);
  }

  // Commandes de navigation : zoom, défilement, retour à la vue standard.
  zoom(factor) {
    const s = this.scale;
    s.zoomX(factor, s.follow ? s.w * 0.92 : s.w / 2);
    this.invalidate();
  }

  pan(fraction) {
    const s = this.scale;
    s.panX(fraction * s.w);
    if (fraction > 0) s.follow = false;
    this.invalidate();
  }

  // Temps restant avant la clôture de la bougie en cours (bougies temps uniquement).
  #countdown(items) {
    if (this.spec.type !== 'time' || !items.length) return null;
    const left = items[items.length - 1].t0 + this.spec.param - Date.now();
    if (left <= 0 || left > 86_400_000) return null;
    const sec = Math.floor(left / 1000);
    const h = Math.floor(sec / 3600);
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  // Position des panneaux (pour leurs légendes HTML).
  paneRects() {
    return this.settings.panes.map((kind, k) => ({ kind, y: this.scale.h + k * this.paneH, h: this.paneH }));
  }

  itemAt(items, x) {
    if (!items.length) return null;
    const s = this.scale;
    if (s.mode === 'index') return items[Math.max(0, Math.min(items.length - 1, Math.round(s.indexOfX(x))))];
    const t = s.timeOfX(x);
    const tf = this.spec.param;
    return items.find((b) => b.t0 <= t && t < b.t0 + tf) ?? null;
  }

}

export { AXIS_W, TIME_H, C };
