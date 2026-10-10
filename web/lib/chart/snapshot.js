// Image d'un graphique pour le journal : fond, heatmap (zone du tracé) puis tracé, axes et
// panneaux, en JPEG de 1280 px de large au plus (quelques centaines de ko).
import { C } from '../theme.js';

export function composeSnapshot(chart) {
  const k = Math.min(1, 1280 / chart.W);
  const out = document.createElement('canvas');
  out.width = Math.round(chart.W * k);
  out.height = Math.round(chart.H * k);
  const c = out.getContext('2d');
  c.fillStyle = C.ink;
  c.fillRect(0, 0, out.width, out.height);
  c.drawImage(chart.heatCanvas, 0, 0, chart.scale.w * k, chart.scale.h * k);
  c.drawImage(chart.mainCanvas, 0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.8);
}
