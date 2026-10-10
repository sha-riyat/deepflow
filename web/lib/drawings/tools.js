// Outils de dessin proposés dans la barre de gauche. Raccourci : Alt + lettre (les lettres seules
// ouvrent la recherche de symbole).
export const TOOLS = {
  trend: { label: 'Ligne de tendance', key: 'T' },
  hline: { label: 'Ligne horizontale', key: 'H' },
  hray: { label: 'Rayon horizontal', key: 'J' },
  vline: { label: 'Ligne verticale', key: 'V' },
  rect: { label: 'Rectangle (zone)', key: 'R' },
  fib: { label: 'Retracement de Fibonacci', key: 'F' },
  text: { label: 'Texte / note', key: 'N' },
  ruler: { label: 'Règle de mesure', key: 'M' },
  long: { label: 'Position longue', key: 'L' },
  short: { label: 'Position courte', key: 'S' },
};

// Outil d'un raccourci : la lettre tapée fait foi (claviers AZERTY) ; sur Mac, Option + lettre
// produit un autre caractère, on se rabat alors sur la position de la touche.
export function toolForKey(key, code) {
  const letter = /^[a-z]$/i.test(key) ? key.toUpperCase() : code?.startsWith('Key') ? code.slice(3) : null;
  return Object.keys(TOOLS).find((id) => TOOLS[id].key === letter) ?? null;
}
