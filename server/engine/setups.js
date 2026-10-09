// Setups de trading. Chaque setup reçoit le contexte et un sens (1 = long, -1 = short)
// et retourne null ou un candidat { dir, setup, label, why[], stop } où `stop` est
// le niveau structurel qui invalide l'idée.
const fmt = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const sgn = (v, d = 2) => (v >= 0 ? '+' : '') + fmt(v, d);

// Contexte crypto : liquidations récentes. À l'absorption, celles du camp qui capitule (longues
// liquidées sur un mur acheteur) ; à la cassure, celles du camp piégé (courtes liquidées à la
// hausse), qui alimentent le mouvement. Information seulement, ne conditionne pas le signal.
function liquidationContext(flow, ms, side) {
  const n = flow.liquidated(ms, side);
  if (n <= 0) return [];
  const who = side < 0 ? 'longues' : 'courtes';
  return [`${fmt(n, 0)} de positions ${who} liquidées en ${ms / 1000} s`];
}

// Absorption : un mur encaisse une agression anormale sans céder, puis le delta se retourne.
export function absorption({ f, flow, cfg, bucket, base }, dir) {
  const best = dir > 0 ? f.bid : f.ask;
  const wall = flow.walls.find((w) => {
    if (w.side !== (dir > 0 ? 'bid' : 'ask')) return false;
    const edge = dir > 0 ? (w.row + 1) * bucket : w.row * bucket; // bord du mur côté prix
    const dist = dir * (best - edge);
    return dist >= -bucket && dist <= cfg.nearBuckets * bucket;
  });
  if (!wall) return null;
  if (wall.q < cfg.minWallKeep * wall.peak) return null; // mur en train d'être retiré

  const aggSide = dir > 0 ? 'sell' : 'buy';
  const [lo, hi] = dir > 0 ? [wall.row, wall.row + cfg.nearBuckets] : [wall.row - cfg.nearBuckets, wall.row];
  const hit = flow.volAt(cfg.windowMs, lo, hi, aggSide);
  const normal = flow.avgVolume(cfg.windowMs, aggSide);
  if (hit <= 0 || normal <= 0 || hit < cfg.volMult * normal) return null;

  // Le mur a tenu : pas d'échange au-delà d'une tranche de l'autre côté.
  const extreme = dir > 0 ? flow.minBid(cfg.windowMs) : flow.maxAsk(cfg.windowMs);
  const limit = dir > 0 ? wall.row * bucket - bucket : (wall.row + 1) * bucket + bucket;
  if (dir * (extreme - limit) < 0) return null;

  const confirm = flow.delta(cfg.confirmMs);
  if (dir * confirm <= 0) return null;

  const who = dir > 0 ? 'acheteur' : 'vendeur';
  const aggr = dir > 0 ? 'vendus' : 'achetés';
  return {
    dir,
    setup: 'absorption',
    label: 'Absorption sur mur',
    stop: limit,
    why: [
      `Mur ${who} de ${fmt(wall.q, 3)} ${base} à ${fmt(wall.price)}, présent depuis ${Math.round(wall.ageMs / 1000)} s`,
      `${fmt(hit, 3)} ${base} ${aggr} agressivement dessus en ${cfg.windowMs / 1000} s, soit ${fmt(hit / normal, 1)}× la normale`,
      `Le mur n'a pas cédé : extrême touché ${fmt(extreme)}, mur encore à ${Math.round((wall.q / wall.peak) * 100)} % de sa taille max`,
      `Delta ${cfg.confirmMs / 1000} s retourné dans le sens du trade (${sgn(confirm, 3)} ${base})`,
      `Déséquilibre du carnet ${sgn(flow.imb)}`,
      ...liquidationContext(flow, cfg.windowMs, -dir),
    ],
  };
}

// Cassure : sortie du range récent portée par un delta anormal, de gros prints et le carnet.
export function breakout({ f, flow, cfg, bucket, base }, dir) {
  const { high, low, n } = flow.range(cfg.rangeMs, cfg.excludeMs);
  if (n === 0) return null;
  const px = dir > 0 ? f.bid : f.ask;
  const level = dir > 0 ? high : low;
  if (dir * (px - level) <= 0) return null;

  const z = flow.deltaZ();
  if (z === null || dir * z < cfg.deltaZ) return null;
  const bigs = flow.bigPrints(cfg.windowMs, dir);
  if (bigs.length === 0) return null;
  if (dir * flow.imb < cfg.minImb) return null;
  const vwap = flow.vwap;
  if (cfg.vwapFilter && vwap !== null && dir * (px - vwap) <= 0) return null;

  const biggest = bigs.reduce((x, y) => (y.q > x.q ? y : x));
  const side = dir > 0 ? 'acheteurs' : 'vendeurs';
  const why = [
    `Cassure du plus ${dir > 0 ? 'haut' : 'bas'} des ${Math.round(cfg.rangeMs / 60_000)} dernières minutes (${fmt(level)})`,
    `Delta ${cfg.windowMs / 1000} s de ${sgn(flow.delta(cfg.windowMs), 3)} ${base}, z-score ${sgn(z, 1)} : impulsion anormale`,
    `${bigs.length} gros print(s) ${side}, le plus gros ${fmt(biggest.q, 3)} ${base} à ${fmt(biggest.p)}`,
    `Carnet déséquilibré dans le sens du trade (${sgn(flow.imb)})`,
  ];
  if (vwap !== null) why.push(`Prix ${dir > 0 ? 'au-dessus' : 'en dessous'} du VWAP du jour (${fmt(vwap)})`);
  why.push(...liquidationContext(flow, cfg.windowMs, dir)); // cassure haussière : courtes liquidées (achats forcés)
  return {
    dir,
    setup: 'breakout',
    label: 'Cassure confirmée par le flux',
    stop: dir > 0 ? level - bucket : level + bucket,
    why,
  };
}

export const SETUPS = { absorption, breakout };
