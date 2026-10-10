// Suivi « papier » des signaux : cibles, stop, sortie forcée, résultat en R net de frais.
// Les signaux clôturés sont ajoutés à un fichier NDJSON pour les statistiques.
import fs from 'node:fs';
import path from 'node:path';

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export class Tracker {
  constructor(file = null) {
    this.file = file;
    this.history = [];
    this.active = null;
    if (file && fs.existsSync(file)) {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        if (line.trim()) this.history.push(JSON.parse(line));
      }
    }
  }

  open(sig) {
    Object.assign(sig, { status: 'open', stopCurrent: sig.stop, remainingPct: 100, realizedR: 0, unrealizedR: 0 });
    sig.events = [{ t: sig.t, text: `Entrée ${sig.entryType} à ${sig.entry}` }];
    this.active = sig;
  }

  // Retourne 'event' (cible, stop déplacé), 'closed', 'tick' ou null.
  update(f) {
    const s = this.active;
    if (!s) return null;
    const d = s.dir;
    const px = d > 0 ? f.bid : f.ask; // prix de sortie réaliste
    const r = (price) => (d * (price - s.entry)) / s.dist;

    if (d * (px - s.stopCurrent) <= 0) {
      return this.#close(s, px, f.t, s.targets[0].hit ? 'breakeven' : 'stop');
    }
    let event = false;
    for (const [i, tg] of s.targets.entries()) {
      if (tg.hit || d * (px - tg.price) < 0) continue;
      tg.hit = true;
      s.realizedR += (tg.R * tg.pct) / 100;
      s.remainingPct -= tg.pct;
      s.events.push({ t: f.t, text: `Cible ${i + 1} touchée à ${tg.price} (+${tg.R}R sur ${tg.pct} %)` });
      if (i === 0) {
        s.stopCurrent = s.entry;
        s.events.push({ t: f.t, text: `Stop remonté au point d'entrée (${s.entry})` });
      }
      event = true;
    }
    if (s.remainingPct <= 0) return this.#close(s, px, f.t, 'target');
    if (f.t - s.t >= s.maxHoldMs) return this.#close(s, px, f.t, 'time');
    s.unrealizedR = round(s.realizedR + (r(px) * s.remainingPct) / 100);
    return event ? 'event' : 'tick';
  }

  // Sortie décidée par le moteur (clôture de 30 min de l'autre côté, fin de fenêtre…), au marché.
  exit(f, outcome, text) {
    const s = this.active;
    if (!s) return null;
    s.events.push({ t: f.t, text });
    return this.#close(s, s.dir > 0 ? f.bid : f.ask, f.t, outcome);
  }

  #close(s, price, t, outcome) {
    const labels = { stop: 'Stop touché', breakeven: "Sortie au point d'entrée", target: 'Toutes les cibles atteintes', time: 'Sortie forcée (durée max)', early: 'Sortie anticipée', window: 'Sortie en fin de fenêtre' };
    s.realizedR += (((s.dir * (price - s.entry)) / s.dist) * s.remainingPct) / 100;
    s.remainingPct = 0;
    s.status = 'closed';
    s.outcome = outcome;
    s.closedAt = t;
    s.exitPrice = price;
    s.resultR = round(s.realizedR - s.feeR);
    s.pnlUsd = round(s.resultR * s.riskUsd);
    s.unrealizedR = 0;
    s.events.push({ t, text: `${labels[outcome]} à ${price} → ${s.resultR >= 0 ? '+' : ''}${s.resultR}R net de frais` });
    this.history.push(s);
    this.active = null;
    if (this.file) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(s) + '\n');
    }
    return 'closed';
  }

  stats() {
    const h = this.history;
    const n = h.length;
    let wins = 0;
    let totalR = 0;
    let pnl = 0;
    let peak = 0;
    let maxDD = 0;
    for (const s of h) {
      if (s.resultR > 0) wins++;
      totalR += s.resultR;
      pnl += s.pnlUsd;
      peak = Math.max(peak, totalR);
      maxDD = Math.max(maxDD, peak - totalR);
    }
    return {
      n,
      wins,
      winRate: n ? round((wins / n) * 100, 1) : 0,
      avgR: n ? round(totalR / n) : 0,
      totalR: round(totalR),
      pnlUsd: round(pnl),
      maxDDR: round(maxDD),
    };
  }
}
