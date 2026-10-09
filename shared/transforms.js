// Types de graphiques dérivés d'une série de bougies (calculés à l'affichage) :
// Heikin Ashi, Line break, Kagi, Point & Figure.

// Heikin Ashi : bougies lissées (prix synthétiques).
export function heikinAshi(bars) {
  const out = [];
  let prev = null;
  for (const b of bars) {
    const c = (b.o + b.h + b.l + b.c) / 4;
    const o = prev ? (prev.o + prev.c) / 2 : (b.o + b.c) / 2;
    const ha = { ...b, o, c, h: Math.max(b.h, o, c), l: Math.min(b.l, o, c) };
    out.push(ha);
    prev = ha;
  }
  return out;
}

// Line break (n lignes) : nouvelle ligne si la clôture dépasse la dernière ligne ;
// renversement seulement si elle dépasse l'extrême des n dernières lignes.
export function lineBreak(bars, n = 3) {
  const lines = [];
  for (const b of bars) {
    if (lines.length === 0) {
      lines.push({ o: b.o, c: b.c, t0: b.t0, t1: b.t1, up: b.c >= b.o });
      continue;
    }
    const last = lines[lines.length - 1];
    const top = Math.max(last.o, last.c);
    const bottom = Math.min(last.o, last.c);
    const recent = lines.slice(-n);
    const hi = Math.max(...recent.map((l) => Math.max(l.o, l.c)));
    const lo = Math.min(...recent.map((l) => Math.min(l.o, l.c)));
    if (last.up && b.c > top) lines.push({ o: top, c: b.c, t0: b.t0, t1: b.t1, up: true });
    else if (!last.up && b.c < bottom) lines.push({ o: bottom, c: b.c, t0: b.t0, t1: b.t1, up: false });
    else if (last.up && b.c < lo) lines.push({ o: bottom, c: b.c, t0: b.t0, t1: b.t1, up: false });
    else if (!last.up && b.c > hi) lines.push({ o: top, c: b.c, t0: b.t0, t1: b.t1, up: true });
  }
  return lines;
}

// Kagi : la ligne change de sens quand le prix revient de `rev` depuis l'extrême.
// Épaisse (yang) au-dessus du dernier sommet, fine (yin) sous le dernier creux.
export function kagi(bars, rev) {
  if (bars.length === 0) return [];
  const segs = [];
  let dir = 0;
  let start = bars[0].c;
  let ext = start;
  let t0 = bars[0].t0;
  let lastHigh = -Infinity;
  let lastLow = Infinity;
  let thick = true;
  for (const b of bars) {
    const p = b.c;
    if (dir >= 0 && p > ext) ext = p;
    else if (dir <= 0 && p < ext) ext = p;
    if (dir === 0 && Math.abs(p - start) >= rev) dir = p > start ? 1 : -1;
    const reversal = (dir > 0 && p <= ext - rev) || (dir < 0 && p >= ext + rev);
    if (!reversal) continue;
    if (dir > 0 && ext > lastHigh) thick = true;
    if (dir < 0 && ext < lastLow) thick = false;
    segs.push({ from: start, to: ext, t0, t1: b.t0, thick });
    if (dir > 0) lastHigh = ext;
    else lastLow = ext;
    start = ext;
    ext = p;
    dir = -dir;
    t0 = b.t0;
  }
  segs.push({ from: start, to: ext, t0, t1: bars[bars.length - 1].t1, thick, open: true });
  return segs;
}

// Point & Figure : colonnes de X (hausse) et de O (baisse) en cases de `box`,
// renversement après `rev` cases. Utilise haut et bas de chaque bougie.
export function pointFigure(bars, box, rev = 3) {
  if (bars.length === 0) return [];
  const cols = [];
  let col = null;
  for (const b of bars) {
    if (!col) {
      const base = Math.floor(b.c / box);
      col = { up: true, lo: base, hi: base, t0: b.t0, t1: b.t1 };
      cols.push(col);
      continue;
    }
    const hiBox = Math.floor(b.h / box);
    const loBox = Math.ceil(b.l / box);
    if (col.up) {
      if (hiBox > col.hi) col.hi = hiBox;
      else if (loBox <= col.hi - rev) {
        col = { up: false, hi: col.hi - 1, lo: loBox, t0: b.t0, t1: b.t1 };
        cols.push(col);
      }
    } else if (loBox < col.lo) col.lo = loBox;
    else if (hiBox >= col.lo + rev) {
      col = { up: true, lo: col.lo + 1, hi: hiBox, t0: b.t0, t1: b.t1 };
      cols.push(col);
    }
    col.t1 = b.t1;
  }
  return cols;
}
