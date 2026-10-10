// Souris et molette :
//  - glisser dans le graphique : déplacement (et prix si l'échelle auto est coupée) ;
//  - glisser sur l'axe des prix : zoom vertical ; double-clic : échelle automatique ;
//  - glisser sur l'axe du temps : zoom horizontal ;
//  - molette : zoom horizontal autour du curseur ; Maj + molette : zoom vertical ;
//  - double-clic dans le graphique : retour au direct ;
//  - dessins (lib/drawings/editor.js) : prioritaires dans le tracé principal sur le déplacement.
export function attachInteractions(chart) {
  const el = chart.crossCanvas;
  let drag = null;

  const zone = (x, y) => {
    const s = chart.scale;
    if (y >= chart.timeTop) return 'time';
    if (x >= s.w) return y < s.h ? 'price' : 'none';
    return y < s.h ? 'plot' : 'pane';
  };
  const pos = (e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  el.addEventListener('mousedown', (e) => {
    const p = pos(e);
    const z = zone(p.x, p.y);
    if (e.button === 0 && z === 'plot' && chart.drawings.down(p)) {
      drag = { ...p, zone: 'draw' };
      return;
    }
    drag = { ...p, zone: z };
    el.style.cursor = drag.zone === 'price' ? 'ns-resize' : drag.zone === 'time' ? 'ew-resize' : 'grabbing';
  });

  window.addEventListener('mouseup', (e) => {
    if (drag?.zone === 'draw') chart.drawings.up(pos(e));
    drag = null;
    el.style.cursor = 'crosshair';
  });

  el.addEventListener('mousemove', (e) => {
    const p = pos(e);
    chart.mouse = p;
    if (!drag || drag.zone === 'draw') {
      chart.drawings.move(p);
      el.style.cursor = (zone(p.x, p.y) === 'plot' && chart.drawings.cursor(p)) || 'crosshair';
      return;
    }
    const s = chart.scale;
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    drag.x = p.x;
    drag.y = p.y;
    if (drag.zone === 'plot' || drag.zone === 'pane') {
      s.panX(dx);
      if (dx > 0) s.follow = false;
      if (!s.autoScale && drag.zone === 'plot') s.panPrice(dy);
    } else if (drag.zone === 'price') {
      s.zoomPrice(Math.exp(dy * 0.005), (s.pTop + s.pBottom) / 2);
    } else if (drag.zone === 'time') {
      s.zoomX(Math.exp(-dx * 0.005), s.w);
    }
    chart.invalidate();
  });

  el.addEventListener('mouseleave', () => {
    chart.mouse = null;
  });

  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = pos(e);
      const s = chart.scale;
      // Zoom proportionnel au déplacement (molette crantée comme pavé tactile).
      const raw = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 33 : 1);
      const k = Math.exp(Math.max(-1000, Math.min(1000, raw)) * 0.0012);
      if (e.shiftKey || zone(p.x, p.y) === 'price') s.zoomPrice(k, s.priceOfY(Math.min(p.y, s.h)));
      else s.zoomX(k, s.follow ? s.w * 0.92 : Math.min(p.x, s.w));
      chart.invalidate();
    },
    { passive: false },
  );

  el.addEventListener('dblclick', (e) => {
    const p = pos(e);
    if (chart.drawings.busy()) return;
    const s = chart.scale;
    if (zone(p.x, p.y) === 'price') s.autoScale = true;
    else {
      s.follow = true;
      s.autoScale = true;
    }
    chart.invalidate();
  });
}
