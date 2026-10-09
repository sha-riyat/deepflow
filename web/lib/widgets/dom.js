// DOM (carnet en échelle) : volume échangé dans la session, tailles bid et ask par niveau,
// meilleurs prix mis en évidence. Rafraîchi à 4 Hz par le serveur.
import { fmt, qty } from '../fmt.js';
import { C, alpha, font } from '../theme.js';

const ROW = 18;

export class DomView {
  constructor(el) {
    this.el = el;
    this.canvas = document.createElement('canvas');
    el.replaceChildren(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.dom = null;
    this.observer = new ResizeObserver(() => this.render());
    this.observer.observe(el);
  }

  destroy() {
    this.observer.disconnect();
    this.canvas.remove();
  }

  update(dom) {
    this.dom = dom;
    if (this.el.offsetParent) this.render();
  }

  render() {
    const { canvas, ctx, el } = this;
    const dpr = window.devicePixelRatio || 1;
    const W = el.clientWidth;
    const H = el.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    Object.assign(canvas.style, { width: `${W}px`, height: `${H}px` });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.surface;
    ctx.fillRect(0, 0, W, H);
    const d = this.dom;
    if (!d) return;

    const cols = { vol: [0, W * 0.3], bid: [W * 0.3, W * 0.22], price: [W * 0.52, W * 0.26], ask: [W * 0.78, W * 0.22] };
    const head = 22;
    ctx.font = font(10, 500);
    ctx.fillStyle = C.graphite;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (const [k, label] of [['vol', 'Volume'], ['bid', 'Bid'], ['price', 'Prix'], ['ask', 'Ask']]) ctx.fillText(label, cols[k][0] + cols[k][1] / 2, head / 2);

    // Lignes : asks (du plus haut au meilleur) puis bids, centrées sur le spread.
    const fit = Math.floor((H - head) / ROW);
    const half = Math.floor(fit / 2);
    const asks = d.asks.slice(0, half).reverse();
    const bids = d.bids.slice(0, fit - asks.length);
    const vol = new Map(d.vol.map(([p, bv, sv]) => [p, [bv, sv]]));
    let maxQ = 0;
    let maxV = 0;
    for (const [, q] of [...asks, ...bids]) maxQ = Math.max(maxQ, q);
    for (const [, [bv, sv]] of vol) maxV = Math.max(maxV, bv + sv);
    const rows = [...asks.map(([p, q]) => ({ p, q, side: -1 })), ...bids.map(([p, q]) => ({ p, q, side: 1 }))];

    rows.forEach((r, i) => {
      const y = head + i * ROW;
      const best = (r.side < 0 && i === asks.length - 1) || (r.side > 0 && i === asks.length);
      if (best) {
        ctx.fillStyle = alpha(r.side > 0 ? C.growth : C.loss, 0.1);
        ctx.fillRect(0, y, W, ROW);
      }
      const v = vol.get(r.p);
      if (v && maxV > 0) {
        const [bv, sv] = v;
        const wv = (cols.vol[1] - 8) * ((bv + sv) / maxV);
        ctx.fillStyle = alpha(C.growth, 0.35);
        ctx.fillRect(cols.vol[0] + 4, y + 3, wv * (bv / (bv + sv)), ROW - 6);
        ctx.fillStyle = alpha(C.loss, 0.35);
        ctx.fillRect(cols.vol[0] + 4 + wv * (bv / (bv + sv)), y + 3, wv * (sv / (bv + sv)), ROW - 6);
        ctx.font = font(10);
        ctx.fillStyle = C.mist;
        ctx.textAlign = 'left';
        ctx.fillText(qty(bv + sv), cols.vol[0] + 6, y + ROW / 2);
      }
      const [cx, cw] = r.side > 0 ? cols.bid : cols.ask;
      const bw = maxQ > 0 ? (cw - 6) * (r.q / maxQ) : 0;
      ctx.fillStyle = alpha(r.side > 0 ? C.growth : C.loss, 0.45);
      if (r.side > 0) ctx.fillRect(cx + cw - 3 - bw, y + 3, bw, ROW - 6);
      else ctx.fillRect(cx + 3, y + 3, bw, ROW - 6);
      ctx.font = font(11, best ? 600 : 400);
      ctx.fillStyle = C.white;
      ctx.textAlign = r.side > 0 ? 'right' : 'left';
      ctx.fillText(qty(r.q), r.side > 0 ? cx + cw - 6 : cx + 6, y + ROW / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = best ? C.white : C.mist;
      ctx.fillText(fmt(r.p, 6), cols.price[0] + cols.price[1] / 2, y + ROW / 2);
    });
    ctx.textAlign = 'left';
  }
}
