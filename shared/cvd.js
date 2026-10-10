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

// Divergences prix / CVD de session, sur des sommets et creux confirmés (`k` bougies de chaque côté) :
//  - baissière : nouveau plus haut du prix, CVD plus bas qu'au sommet précédent (achat qui s'épuise) ;
//  - haussière : nouveau plus bas du prix, CVD plus haut qu'au creux précédent (vente qui s'épuise).
// Les deux sommets (ou creux) doivent appartenir à la même session (le CVD y repart de zéro).
export function cvdDivergences(items, cvd, k = 5) {
  const out = [];
  const pivot = (i, key, better) => {
    for (let j = i - k; j <= i + k; j++) if (j !== i && (j < 0 || j >= items.length || better(items[j][key], items[i][key]))) return false;
    return true;
  };
  let lastHigh = null;
  let lastLow = null;
  for (let i = k; i < items.length - k; i++) {
    if (sessionStart(items, i)) (lastHigh = null), (lastLow = null);
    if (pivot(i, 'h', (a, b) => a > b)) {
      if (lastHigh !== null && !crosses(items, lastHigh, i) && items[i].h > items[lastHigh].h && cvd[i] < cvd[lastHigh]) out.push({ from: lastHigh, to: i, type: 'bear' });
      lastHigh = i;
    }
    if (pivot(i, 'l', (a, b) => a < b)) {
      if (lastLow !== null && !crosses(items, lastLow, i) && items[i].l < items[lastLow].l && cvd[i] > cvd[lastLow]) out.push({ from: lastLow, to: i, type: 'bull' });
      lastLow = i;
    }
  }
  return out;
}

// Vrai si une nouvelle session commence entre a (exclu) et b (inclus).
function crosses(items, a, b) {
  for (let i = a + 1; i <= b; i++) if (sessionStart(items, i)) return true;
  return false;
}
