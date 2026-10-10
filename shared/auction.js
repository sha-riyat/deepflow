// Lecture d'enchère sur les profils de session (calculs sans dessin, testables) : état
// d'acceptation ou de rejet par rapport à la value area de la veille et taille des lignes.
// État de l'enchère du jour face à la value area de la veille, sur les clôtures de périodes de
// 30 min terminées (règle d'acceptation du cours : 2 périodes) :
//  - inside : dans la valeur, pas de sortie ;
//  - outside : sortie en cours, pas encore 2 clôtures dehors ;
//  - accepted : 2 clôtures consécutives du même côté hors de la valeur (Setup 2, on suit) ;
//  - returning : retour dans la valeur après une sortie, pas encore 2 clôtures ;
//  - rejected : après une sortie, 2 clôtures consécutives de retour dans la valeur (Setup 1).
// `now` sert à écarter la période en cours. side = 1 (au-dessus de la VAH) ou -1 (sous la VAL).
export function auctionState(prev, today, now = Date.now(), need = 2) {
  if (!prev || prev.vah === null || !today) return null;
  const vah = (prev.vah + 1) * prev.bucket;
  const val = prev.val * prev.bucket;
  const poc = (prev.poc + 0.5) * prev.bucket;
  const tpoMs = today.tpoMs ?? 1_800_000;
  const current = Math.floor((now - today.t0) / tpoMs);
  const res = { state: 'inside', side: 0, count: 0, extreme: null, at: null, vah, val, poc, excursion: 0 };
  let zone = null;
  let run = 0;
  for (const [k, a, b, close] of today.periods) {
    if (k >= current || close === undefined) continue;
    const pHi = (b + 1) * today.bucket;
    const pLo = a * today.bucket;
    if (pHi > vah) {
      if (res.excursion !== 1) res.extreme = null;
      res.excursion = 1;
      res.extreme = Math.max(res.extreme ?? pHi, pHi);
    } else if (pLo < val) {
      if (res.excursion !== -1) res.extreme = null;
      res.excursion = -1;
      res.extreme = Math.min(res.extreme ?? pLo, pLo);
    }
    const z = close > vah ? 1 : close < val ? -1 : 0;
    run = z === zone ? run + 1 : 1;
    zone = z;
    let next;
    if (z !== 0) next = { state: run >= need ? 'accepted' : 'outside', side: z };
    else if (res.excursion === 0) next = { state: 'inside', side: 0 };
    else if (run >= need) next = { state: 'rejected', side: res.excursion };
    else next = res.state === 'rejected' ? { state: 'rejected', side: res.side } : { state: 'returning', side: res.excursion };
    if (next.state !== res.state || next.side !== res.side) res.at = ['accepted', 'rejected'].includes(next.state) ? today.t0 + (k + 1) * tpoMs : null;
    Object.assign(res, next, { count: run });
  }
  return res;
}

export function auctionLabel(st) {
  if (!st) return '';
  const where = st.side > 0 ? 'au-dessus de la VAH' : 'sous la VAL';
  if (st.state === 'accepted') return `acceptation ${where} (${st.count} × 30 min)`;
  if (st.state === 'rejected') return `rejet ${st.side > 0 ? 'par le haut' : 'par le bas'}, retour dans la valeur (${st.count} × 30 min)`;
  if (st.state === 'outside') return `sortie ${where} en cours (${st.count}/2)`;
  if (st.state === 'returning') return `retour dans la valeur en cours (${st.count}/2)`;
  return 'dans la valeur de la veille';
}

// Taille des lignes d'un profil : `pct` du prix arrondi à un pas rond (1, 2, 2,5, 5 × 10^k),
// multiple de la tranche du footprint et jamais plus fin qu'elle.
export function rowBucket(price, fpBucket, pct = 0.05) {
  if (!pct || !(price > 0)) return fpBucket;
  const min = (price * pct) / 100;
  const k = 10 ** Math.floor(Math.log10(min));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * k).find((v) => v >= min);
  return Math.max(fpBucket, Math.round(step / fpBucket) * fpBucket);
}
