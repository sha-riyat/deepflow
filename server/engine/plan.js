// Transforme un candidat en plan de trade complet : entrée, stop, cibles, taille, frais.
// Retourne { plan } ou { rejected: raison }.
const fmt = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const decimalsOf = (step) => Math.max(0, Math.round(-Math.log10(step)));

function roundTo(value, step, mode) {
  const d = decimalsOf(step);
  const n = value / step;
  const k = mode === 'up' ? Math.ceil(n - 1e-9) : mode === 'down' ? Math.floor(n + 1e-9) : Math.round(n);
  return Number((k * step).toFixed(d));
}

export function buildPlan(cand, { f, risk, info, atr, walls, mark = null }) {
  const { dir } = cand;
  const tick = info.tickSize;
  const entry = dir > 0 ? f.ask : f.bid; // entrée au marché
  const notes = [];

  // Stop : niveau structurel, élargi si nécessaire au minimum (frais / bruit).
  let stop = cand.stop;
  const minDist = Math.max((entry * risk.minStopPct) / 100, atr ? 0.5 * atr : 0);
  if (dir * (entry - stop) < minDist) {
    stop = entry - dir * minDist;
    notes.push(`Stop structurel trop serré, élargi à ${fmt((minDist / entry) * 100, 2)} % du prix (bruit + frais)`);
  }
  stop = roundTo(stop, tick, dir > 0 ? 'down' : 'up');
  const dist = Math.abs(entry - stop);

  const targets = [
    { R: risk.t1R, pct: 50 },
    { R: risk.t2R, pct: 50 },
  ].map((t) => ({ ...t, price: roundTo(entry + dir * dist * t.R, tick, dir > 0 ? 'down' : 'up'), hit: false }));

  // Un mur opposé avant la première cible rend l'objectif peu probable.
  const blocking = walls.find(
    (w) => w.side === (dir > 0 ? 'ask' : 'bid') && dir * (w.price - entry) > 0 && dir * (w.price - targets[0].price) < 0,
  );
  if (blocking) return { rejected: `mur opposé de ${fmt(blocking.q, 3)} à ${fmt(blocking.price)} avant la cible 1` };

  // Taille : risque fixe en % du capital, plafonnée par le levier max et arrondie au pas.
  const riskBudget = (risk.equity * risk.riskPct) / 100;
  let qty = riskBudget / dist;
  const maxNotional = risk.equity * risk.maxLeverage;
  if (qty * entry > maxNotional) {
    qty = maxNotional / entry;
    notes.push(`Taille plafonnée par le levier max (${risk.maxLeverage}×) : risque réel inférieur au budget`);
  }
  qty = roundTo(qty, info.stepSize, 'down');
  const notional = qty * entry;
  if (qty < info.minQty || notional < info.minNotional) {
    return { rejected: `taille ${qty} sous le minimum Binance (${info.minQty} / ${info.minNotional} ${info.quote}) : capital ou risque trop faible` };
  }

  const riskUsd = qty * dist;
  // Financement (futures) : coût si le trade le paie et qu'une échéance tombe avant la sortie forcée.
  if (mark && mark.funding * dir > 0 && mark.nextFunding - f.t < risk.maxHoldMs) {
    const cost = notional * Math.abs(mark.funding);
    notes.push(`Financement ${fmt(mark.funding * 100, 4)} % à payer dans ${Math.round((mark.nextFunding - f.t) / 60_000)} min : ${fmt(cost)} ${info.quote} (${fmt(cost / riskUsd, 2)}R)`);
  }
  const feesUsd = notional * risk.takerFee * 2; // aller-retour au marché, hypothèse prudente
  const feeR = feesUsd / riskUsd;
  if (feeR > risk.maxFeeR) {
    return { rejected: `frais estimés ${fmt(feeR, 2)}R > ${risk.maxFeeR}R : stop trop serré pour ces frais` };
  }

  return {
    plan: {
      entry,
      entryType: 'marché',
      stop,
      dist,
      targets,
      qty,
      notional,
      leverage: notional / risk.equity,
      riskUsd,
      riskPctEff: (riskUsd / risk.equity) * 100,
      feesUsd,
      feeR,
      maxHoldMs: risk.maxHoldMs,
      notes,
    },
  };
}
