// Lecture d'enchère sur les profils de session (calculs sans dessin, testables) : taille des
// lignes.
// Taille des lignes d'un profil : `pct` du prix arrondi à un pas rond (1, 2, 2,5, 5 × 10^k),
// multiple de la tranche du footprint et jamais plus fin qu'elle.
export function rowBucket(price, fpBucket, pct = 0.05) {
  if (!pct || !(price > 0)) return fpBucket;
  const min = (price * pct) / 100;
  const k = 10 ** Math.floor(Math.log10(min));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * k).find((v) => v >= min);
  return Math.max(fpBucket, Math.round(step / fpBucket) * fpBucket);
}
