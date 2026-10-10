// Axes (prix à droite, temps en bas), réticule et légende OHLC.
import { fmt, qty } from '../fmt.js';
import { C, alpha, font, pill } from '../theme.js';

const TIME_STEPS = [1e3, 5e3, 1e4, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 72e5, 144e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6];

export function niceStep(min) {
  const k = 10 ** Math.floor(Math.log10(min));
  return [1, 2, 2.5, 5, 10].map((m) => m * k).find((v) => v >= min);
}

const pad = (n) => String(n).padStart(2, '0');
function timeLabel(t, step) {
  const d = new Date(t);
  if (step >= 864e5) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  if (d.getHours() === 0 && d.getMinutes() === 0 && step >= 36e5) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return step < 6e4 ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function drawPriceAxis(ctx, scale, axisW, last, countdown = null) {
  const x0 = scale.w;
  ctx.fillStyle = alpha(C.ink, 0.92);
  ctx.fillRect(x0, 0, axisW, scale.h);
  ctx.fillStyle = alpha(C.white, 0.07);
  ctx.fillRect(x0, 0, 1, scale.h);
  const step = niceStep(40 / scale.pxPerPrice);
  ctx.font = font(11);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (let p = Math.ceil(scale.pBottom / step) * step; p <= scale.pTop; p += step) {
    const y = scale.yOfPrice(p);
    ctx.fillStyle = alpha(C.white, 0.035);
    ctx.fillRect(0, Math.round(y), scale.w, 1); // grille discrète
    ctx.fillStyle = C.graphite;
    ctx.fillText(fmt(p, step < 1 ? 4 : 2), x0 + 10, y);
  }
  if (last) {
    const y = Math.min(scale.h - 18, Math.max(8, scale.yOfPrice(last.c)));
    const bg = last.c >= last.o ? C.growth : C.loss;
    pill(ctx, x0 + 4, y, fmt(last.c), { bg, size: 11, weight: 600 });
    // Compte à rebours avant la clôture de la bougie (bougies temps).
    if (countdown) pill(ctx, x0 + 4, y + 18, countdown, { bg: alpha(bg, 0.25), fg: C.white, size: 10, weight: 500 });
  }
}

export function drawTimeAxis(ctx, scale, items, top, height, axisW) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, top, scale.w + axisW, height);
  ctx.fillStyle = alpha(C.white, 0.07);
  ctx.fillRect(0, top, scale.w + axisW, 1);
  ctx.font = font(11);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = C.graphite;
  if (scale.mode === 'time') {
    const step = TIME_STEPS.find((s) => s / scale.msPerPx >= 90) ?? TIME_STEPS[TIME_STEPS.length - 1];
    const tz = new Date().getTimezoneOffset() * 60_000; // graduations alignées sur l'heure locale
    for (let t = Math.ceil((scale.tLeft - tz) / step) * step + tz; t <= scale.tRight; t += step) {
      ctx.fillText(timeLabel(t, step), scale.xOfTime(t), top + height / 2);
    }
  } else {
    const every = Math.max(1, Math.ceil(110 / scale.pxPerBar));
    const i0 = Math.max(0, Math.ceil(scale.indexOfX(0) / every) * every);
    for (let i = i0; i < items.length && scale.xOfIndex(i) <= scale.w; i += every) {
      const daily = items[i].t1 - items[i].t0 >= 864e5; // sessions de la vue TPO
      ctx.fillText(timeLabel(items[i].t0, daily ? 864e5 : 6e4), scale.xOfIndex(i), top + height / 2);
    }
  }
  ctx.textAlign = 'left';
}

export function drawCrosshair(ctx, scale, { x, y, totalH, timeTop, axisW, item }) {
  ctx.strokeStyle = alpha(C.mist, 0.35);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, 0);
  ctx.lineTo(Math.round(x) + 0.5, timeTop);
  if (y <= scale.h) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(scale.w, Math.round(y) + 0.5);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (y <= scale.h) pill(ctx, scale.w + 4, y, fmt(scale.priceOfY(y)), { bg: C.pale, fg: C.ink, size: 11, weight: 600 });
  const t = scale.mode === 'time' ? scale.timeOfX(x) : item?.t0;
  if (t) {
    const d = new Date(t);
    const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    ctx.font = font(11, 600);
    const wl = ctx.measureText(label).width + 14;
    pill(ctx, Math.min(scale.w + axisW - wl, Math.max(0, x - wl / 2)), timeTop + (totalH - timeTop) / 2, label, { bg: C.pale, fg: C.ink, size: 11, weight: 600 });
  }
}

// Réticule d'un autre graphique (synchronisé) : trait vertical à la même heure.
export function drawSyncLine(ctx, scale, items, t, timeTop) {
  const x = Math.round(scale.xAt(t, items)) + 0.5;
  if (!(x >= 0 && x <= scale.w)) return;
  ctx.strokeStyle = alpha('#479ffa', 0.55);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, timeTop);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawLegend(ctx, { title, item, status }) {
  ctx.font = font(12, 600);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  ctx.fillText(title, 12, 10);
  let x = 12 + ctx.measureText(title).width + 14;
  if (item) {
    const up = item.c >= item.o;
    const parts = [['O', fmt(item.o)], ['H', fmt(item.h)], ['B', fmt(item.l)], ['C', fmt(item.c)], ['Vol', qty(item.v)], ['Δ', qty(item.b - item.s)]];
    ctx.font = font(12);
    for (const [k, v] of parts) {
      ctx.fillStyle = C.graphite;
      ctx.fillText(k, x, 10);
      x += ctx.measureText(k).width + 4;
      ctx.fillStyle = k === 'Δ' ? (item.b >= item.s ? C.growth : C.loss) : up ? C.growth : C.loss;
      ctx.fillText(v, x, 10);
      x += ctx.measureText(v).width + 12;
    }
  }
  if (status) {
    ctx.font = font(11);
    ctx.fillStyle = C.ember;
    ctx.fillText(status, 12, 28);
  }
}

// Réticule dans un panneau : ligne horizontale et valeur du panneau à cette hauteur.
export function drawPaneCrosshair(ctx, scale, y, text) {
  ctx.strokeStyle = alpha(C.mist, 0.35);
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, Math.round(y) + 0.5);
  ctx.lineTo(scale.w, Math.round(y) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  pill(ctx, scale.w + 4, y, text, { bg: C.pale, fg: C.ink, size: 11, weight: 600 });
}
