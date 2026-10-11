// Stop suiveur : prix proposés pour remonter le stop d'une position (jamais exécutés) — sous la
// dernière mèche, ou sous le dernier gros print favorable. Le résultat doit encore passer par
// moveStop (position.js), qui refuse un stop moins protecteur que l'actuel.

// Dernière bougie fermée commencée à partir de `from` : son plus bas moins `buffer` pour un long, son
// plus haut plus `buffer` pour un court. null s'il n'y en a pas encore.
export function wickStop(side, bars, from, buffer = 0) {
  for (let i = bars.length - 1; i >= 0; i--) {
    const b = bars[i];
    if (b.t0 < from) break;
    if (b.x) return side === 'long' ? b.l - buffer : b.h + buffer;
  }
  return null;
}

// Dernier gros print favorable depuis `from` (achat agressif pour un long, vente agressive pour un
// court) : un gros ordre qui défend un niveau. Stop `buffer` en deçà. Un gros print est
// [temps, prix, quantité, côté] ; null s'il n'y en a pas.
export function printStop(side, prints, from, buffer = 0) {
  const want = side === 'long' ? 1 : -1;
  let last = null;
  for (const [t, p, , s] of prints) if (t >= from && Math.sign(s) === want && (!last || t >= last[0])) last = [t, p];
  if (!last) return null;
  return side === 'long' ? last[1] - buffer : last[1] + buffer;
}
