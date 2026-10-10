// Horloge du graphique : l'heure réelle en direct ; en replay des archives, l'heure rejouée envoyée
// par le collecteur, prolongée entre deux messages selon la vitesse (lecture) ou figée (pause).
// Tout ce qui dépend du « présent » (suivi du direct, sessions, compte à rebours, requêtes) la lit.
let replay = null; // { t, speed, playing, at }

export function setReplayClock(st) {
  replay = st ? { t: st.t, speed: st.speed, playing: st.playing, at: performance.now() } : null;
}

export function clockNow() {
  if (!replay) return Date.now();
  if (!replay.playing) return replay.t;
  // Prolongation bornée à 1 s réelle : sans nouvelles du collecteur, on n'invente pas le futur.
  return replay.t + Math.min(1000, performance.now() - replay.at) * replay.speed;
}
