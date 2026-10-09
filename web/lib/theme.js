// Palette et typographie partagées par les dessins Canvas (miroir des variables de styles.css).
export const C = {
  ink: '#0b0b0b',
  obsidian: '#131313',
  charcoal: '#191919',
  surface: '#111111',
  white: '#ffffff',
  pale: '#e6e6e6',
  mist: '#cccccc',
  graphite: '#868f97',
  smoke: '#525252',
  ember: '#ffa16c',
  growth: '#4ebe96',
  loss: '#e0685f',
};

// rgba() à partir d'une couleur hexadécimale de la palette.
export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Famille de police du document (Inter servie par next/font sous un nom généré).
let family = "Inter, 'Segoe UI', system-ui, sans-serif";
export function setFontFamily(f) {
  if (f) family = f;
}
export const font = (size, weight = 400) => `${weight} ${size}px ${family}`;

// Étiquette en pilule (fond plein, texte centré verticalement).
export function pill(ctx, x, y, text, { bg, fg = C.white, size = 11, weight = 500, align = 'left' }) {
  ctx.font = font(size, weight);
  const w = ctx.measureText(text).width + 14;
  const h = size + 8;
  const left = align === 'right' ? x - w : x;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(left, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, left + 7, y + 0.5);
  return w;
}
