// Système de coordonnées du graphique, partagé par toutes les couches et tous les panneaux.
// Mode 'time' : x proportionnel au temps (bougies temps, heatmap).
// Mode 'index' : une colonne par élément (bougies d'activité, renko, kagi, P&F...).
export class Scale {
  constructor() {
    this.mode = 'time';
    this.w = 1; // largeur du tracé (sans l'axe des prix)
    this.h = 1; // hauteur du graphique principal
    this.tRight = Date.now();
    this.msPerPx = 1000;
    this.iRight = 0;
    this.pxPerBar = 8;
    this.pTop = 1;
    this.pBottom = 0;
    this.autoScale = true;
    this.follow = true;
  }

  // --- axe horizontal ---
  xOfTime(t) {
    return this.w - (this.tRight - t) / this.msPerPx;
  }

  timeOfX(x) {
    return this.tRight - (this.w - x) * this.msPerPx;
  }

  xOfIndex(i) {
    return this.w - (this.iRight - i) * this.pxPerBar;
  }

  indexOfX(x) {
    return this.iRight - (this.w - x) / this.pxPerBar;
  }

  get tLeft() {
    return this.timeOfX(0);
  }

  // Position d'un instant quelconque, y compris en mode index (interpolé dans sa bougie).
  xAt(t, items) {
    if (this.mode === 'time') return this.xOfTime(t);
    let lo = 0;
    let hi = items.length - 1;
    if (hi < 0) return NaN;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (items[mid].t0 <= t) lo = mid;
      else hi = mid - 1;
    }
    const b = items[lo];
    const span = Math.max(1, b.t1 - b.t0);
    const frac = Math.min(1, Math.max(0, (t - b.t0) / span));
    return this.xOfIndex(lo - 0.5 + frac);
  }

  // --- axe vertical (prix) ---
  yOfPrice(p) {
    return ((this.pTop - p) / (this.pTop - this.pBottom)) * this.h;
  }

  priceOfY(y) {
    return this.pTop - (y / this.h) * (this.pTop - this.pBottom);
  }

  get pxPerPrice() {
    return this.h / (this.pTop - this.pBottom);
  }

  setPriceRange(lo, hi) {
    if (!(hi > lo)) hi = lo + 1;
    this.pTop = hi;
    this.pBottom = lo;
  }

  // Zoom vertical autour d'un prix pivot.
  zoomPrice(factor, pivot) {
    this.pTop = pivot + (this.pTop - pivot) * factor;
    this.pBottom = pivot - (pivot - this.pBottom) * factor;
    this.autoScale = false;
  }

  panPrice(dy) {
    const dp = dy / this.pxPerPrice;
    this.pTop += dp;
    this.pBottom += dp;
  }

  // Zoom horizontal autour d'une abscisse.
  zoomX(factor, x) {
    if (this.mode === 'time') {
      const t = this.timeOfX(x);
      this.msPerPx = Math.min(86_400_000, Math.max(5, this.msPerPx * factor));
      this.tRight = t + (this.w - x) * this.msPerPx;
    } else {
      const i = this.indexOfX(x);
      this.pxPerBar = Math.min(400, Math.max(1, this.pxPerBar / factor));
      this.iRight = i + (this.w - x) / this.pxPerBar;
    }
  }

  panX(dx) {
    if (this.mode === 'time') this.tRight -= dx * this.msPerPx;
    else this.iRight -= dx / this.pxPerBar;
  }
}
