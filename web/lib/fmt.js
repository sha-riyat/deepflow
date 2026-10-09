// Formatage partagé de l'interface.
export const fmt = (v, d = 2) =>
  v === null || v === undefined || !Number.isFinite(Number(v)) ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });

export const sgn = (v, d = 2) => (v === null || v === undefined ? '—' : (v >= 0 ? '+' : '') + fmt(v, d));

// Quantité avec un nombre de décimales adapté à sa taille.
export const qty = (v) => fmt(v, v >= 100 ? 0 : v >= 10 ? 1 : v >= 1 ? 2 : 3);

export const time = (t) => new Date(t).toLocaleTimeString('fr-FR');

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
