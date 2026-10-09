// Time & Sales : ordres agresseurs (trades regroupés par horodatage et côté), les plus
// récents en haut, gros prints mis en évidence, filtre de taille minimale.
import { fmt, qty, esc } from '../fmt.js';

const MAX_ROWS = 200;

export class TapeView {
  constructor(el) {
    this.el = el;
    el.innerHTML = `
      <div class="tape-head"><label>Taille min. <input type="number" min="0" step="any" value="0" /></label></div>
      <div class="tape-cols"><span>Heure</span><span>Prix</span><span>Taille</span></div>
      <div class="tape-list"></div>`;
    this.list = el.querySelector('.tape-list');
    this.input = el.querySelector('input');
    this.min = 0;
    this.big = Infinity;
    this.input.addEventListener('input', () => (this.min = Number(this.input.value) || 0));
  }

  clear() {
    this.list.innerHTML = '';
  }

  setBigThreshold(v) {
    this.big = v ?? Infinity;
  }

  push(tick) {
    const groups = new Map();
    for (const [p, q, side, T] of tick.tr) {
      const key = `${T}${side}`;
      const g = groups.get(key) ?? { T, side, pq: 0, q: 0 };
      g.pq += p * q;
      g.q += q;
      groups.set(key, g);
    }
    let html = '';
    for (const g of groups.values()) {
      if (g.q < this.min) continue;
      const d = new Date(g.T);
      const time = `${d.toLocaleTimeString('fr-FR')}.${String(d.getMilliseconds()).padStart(3, '0').slice(0, 1)}`;
      const cls = `${g.side > 0 ? 'buy' : 'sell'}${g.q >= this.big ? ' big' : ''}`;
      html = `<div class="tp ${cls}"><span>${esc(time)}</span><span>${fmt(g.pq / g.q)}</span><span>${qty(g.q)}</span></div>` + html;
    }
    if (!html) return;
    this.list.insertAdjacentHTML('afterbegin', html);
    while (this.list.childElementCount > MAX_ROWS) this.list.lastElementChild.remove();
  }
}
