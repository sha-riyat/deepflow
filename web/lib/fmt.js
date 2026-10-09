// Formatage partagé de l'interface.
export const fmt = (v, d = 2) =>
  v === null || v === undefined || !Number.isFinite(Number(v)) ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });

export const sgn = (v, d = 2) => (v === null || v === undefined ? '—' : (v >= 0 ? '+' : '') + fmt(v, d));

// Quantité avec un nombre de décimales adapté à sa taille.
export const qty = (v) => {
  const a = Math.abs(v);
  return fmt(v, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
};

// Montant abrégé : 1,25 M, 830,4 k, 950.
export const compact = (n) => {
  const a = Math.abs(n);
  return a >= 1e9 ? `${fmt(n / 1e9, 2)} Md` : a >= 1e6 ? `${fmt(n / 1e6, 2)} M` : a >= 1e3 ? `${fmt(n / 1e3, 1)} k` : fmt(n, 0);
};

export const time = (t) => new Date(t).toLocaleTimeString('fr-FR');

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
