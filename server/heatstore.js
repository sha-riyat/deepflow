// Mémoire de la heatmap : une colonne de carnet par seconde sur plusieurs heures, plus les
// dernières minutes à pleine résolution (100 ms). `raster` produit une grille quantifiée
// (2 octets par cellule : acheteurs, vendeurs) pour la portion de graphique affichée.
const FINE_FRAMES = 3000; // 5 min à 100 ms

export class HeatStore {
  constructor({ bucket, hours = 4 }) {
    this.bucket = bucket;
    this.maxSeconds = hours * 3600;
    this.seconds = [];
    this.fine = [];
    this.lastSecond = -1;
  }

  add(f) {
    const col = { t: f.t, r0: f.r0, b: Float32Array.from(f.b), a: Float32Array.from(f.a) };
    this.fine.push(col);
    if (this.fine.length > FINE_FRAMES) this.fine.shift();
    const sec = Math.floor(f.t / 1000);
    if (sec > this.lastSecond) {
      this.lastSecond = sec;
      this.seconds.push(col);
      if (this.seconds.length > this.maxSeconds) this.seconds.shift();
    }
  }

  get start() {
    return this.seconds.length ? this.seconds[0].t : null;
  }

  // Grille [cols x rows] couvrant [from, to] et les tranches [rowLo, rowHi].
  raster({ from, to, cols, rowLo, rowHi }) {
    cols = Math.max(1, Math.min(4096, Math.floor(cols)));
    const span = rowHi - rowLo + 1;
    const step = Math.max(1, Math.ceil(span / 1024));
    const rows = Math.max(1, Math.ceil(span / step));
    const grid = new Float32Array(cols * rows * 2);
    const dt = (to - from) / cols;
    const src = dt < 1000 && this.fine.length && this.fine[0].t <= from ? this.fine : this.seconds;
    if (src.length === 0) return { buf: Buffer.alloc(0), cols, rows, step, scale: 1 };

    let i = lowerBound(src, from);
    for (let c = 0; c < cols; c++) {
      const end = from + (c + 1) * dt;
      let j = i;
      while (j < src.length && src[j].t < end) j++;
      // Colonnes source de la tranche ; à défaut, le dernier instantané s'il est récent.
      let k0 = i;
      let k1 = j;
      if (j === i) {
        const prev = src[i - 1];
        if (!prev || end - prev.t > Math.max(2 * dt, 2000)) continue;
        k0 = i - 1;
        k1 = i;
      }
      i = j;
      for (let k = k0; k < k1; k++) {
        const s = src[k];
        // Seules les lignes recouvrant la colonne source sont parcourues.
        const rStart = Math.max(0, Math.floor((s.r0 - rowLo) / step));
        const rEnd = Math.min(rows, Math.ceil((s.r0 + s.b.length - rowLo) / step));
        for (let r = rStart; r < rEnd; r++) {
          let bMax = 0;
          let aMax = 0;
          for (let x = 0; x < step; x++) {
            const idx = rowLo + r * step + x - s.r0;
            if (idx < 0 || idx >= s.b.length) continue;
            if (s.b[idx] > bMax) bMax = s.b[idx];
            if (s.a[idx] > aMax) aMax = s.a[idx];
          }
          const o = (r * cols + c) * 2;
          if (bMax > grid[o]) grid[o] = bMax;
          if (aMax > grid[o + 1]) grid[o + 1] = aMax;
        }
      }
    }

    // Échelle robuste : percentile 99 des cellules non vides (évite qu'un mur écrase tout).
    const sample = [];
    for (let k = 0; k < grid.length; k += Math.max(1, Math.floor(grid.length / 20000))) if (grid[k] > 0) sample.push(grid[k]);
    sample.sort((x, y) => x - y);
    const scale = sample.length ? sample[Math.floor(sample.length * 0.99)] || 1 : 1;
    const buf = Buffer.alloc(grid.length);
    for (let k = 0; k < grid.length; k++) buf[k] = Math.min(255, Math.round((grid[k] / scale) * 255));
    return { buf, cols, rows, step, scale };
  }
}

function lowerBound(arr, t) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
