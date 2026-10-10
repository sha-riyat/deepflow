// Horloge des graphiques : l'heure réelle en direct ; en replay des archives, l'heure rejouée envoyée
// par le collecteur, prolongée entre deux messages selon la vitesse (lecture) ou figée (pause).
// Chaque graphique a la sienne (un graphique peut rejouer pendant que les autres sont en direct) :
// il la rend « courante » au début de chaque image, et le code de dessin et de requêtes, appelé
// pendant l'image, lit clockNow().

// État de replay d'une source (données d'un graphique) : { t, speed, playing, at } ou null.
export function setReplayClock(src, st) {
  src.replay = st ? { t: st.t, speed: st.speed, playing: st.playing, at: performance.now() } : null;
}

// Heure d'une source : réelle, ou rejouée et prolongée (au plus 1 s réelle : sans nouvelles du
// collecteur, on n'invente pas le futur).
export function nowOf(src) {
  const r = src?.replay;
  if (!r) return Date.now();
  if (!r.playing) return r.t;
  return r.t + Math.min(1000, performance.now() - r.at) * r.speed;
}

let current = null;

// Source dont l'heure fait foi pour le code appelé ensuite (début d'image d'un graphique).
export function useClockOf(src) {
  current = src;
}

export function clockNow() {
  return nowOf(current);
}
