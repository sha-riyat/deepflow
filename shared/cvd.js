// CVD (delta cumulé) remis à zéro à chaque session UTC : une origine fixe et comparable d'un jour à
// l'autre, au lieu de la première bougie chargée (origine arbitraire qui fausse les divergences).
const DAY = 86_400_000;

// Valeurs du CVD de session pour les éléments [0, upto] ; delta(b) donne le delta d'une bougie.
export function sessionCvd(items, upto = items.length - 1, delta = (b) => b.b - b.s) {
  const out = new Array(Math.max(0, upto + 1));
  let day = null;
  let cum = 0;
  for (let i = 0; i <= upto; i++) {
    const d = Math.floor(items[i].t0 / DAY);
    if (d !== day) {
      day = d;
      cum = 0;
    }
    cum += delta(items[i]);
    out[i] = cum;
  }
  return out;
}

// Vrai si l'élément i ouvre une nouvelle session (le tracé du CVD y est interrompu).
export const sessionStart = (items, i) => i === 0 || Math.floor(items[i].t0 / DAY) !== Math.floor(items[i - 1].t0 / DAY);
