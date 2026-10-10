// Repères horaires (voir shared/sessions.js) : traits verticaux à l'ouverture de New York et aux
// heures de financement, avec une étiquette en bas du tracé. Un repère trop proche du précédent
// (dézoom) n'est pas dessiné.
import { timeMarkers } from '@shared/sessions.js';
import { C, alpha, font } from '../theme.js';

const STYLE = {
  ny: { color: C.ember, text: 'NY', dash: [4, 4], a: 0.45 },
  funding: { color: C.graphite, text: 'Fin.', dash: [2, 4], a: 0.5 },
};

export function drawTimeMarkers(ctx, scale, items, { show = 'all', futures = true } = {}) {
  const from = scale.mode === 'time' ? scale.tLeft : items[0]?.t0;
  const to = scale.mode === 'time' ? scale.tRight : items[items.length - 1]?.t1;
  if (!(to > from)) return;
  const list = timeMarkers(from, to, { ny: show !== 'funding', funding: show !== 'ny' && futures });
  const last = { ny: -Infinity, funding: -Infinity };
  ctx.font = font(10, 600);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (const m of list) {
    const x = Math.round(scale.xAt(m.t, items)) + 0.5;
    if (x < 0 || x > scale.w || x - last[m.kind] < 14) continue;
    last[m.kind] = x;
    const st = STYLE[m.kind];
    ctx.strokeStyle = alpha(st.color, st.a);
    ctx.lineWidth = 1;
    ctx.setLineDash(st.dash);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, scale.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = st.color;
    ctx.fillText(st.text, x, scale.h - 3);
  }
}
