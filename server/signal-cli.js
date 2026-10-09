// Affiche dans le terminal l'état du moteur en cours d'exécution : signal actif,
// dernier setup refusé et statistiques. Usage : npm run signal
import { config } from './config.js';
import { formatSignal, formatStats, formatRejection } from './format.js';

const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d }));

let state;
try {
  const res = await fetch(`http://127.0.0.1:${config.port}/api/state`);
  state = await res.json();
} catch {
  console.error(`Serveur injoignable sur le port ${config.port} : lancez d'abord « npm start ».`);
  process.exit(1);
}

console.log(`${state.symbol} ${state.market} · bid ${fmt(state.price?.bid)} · ask ${fmt(state.price?.ask)}`);
if (state.warmup) console.log(`Échauffement du moteur : ${state.warmupPct} % (signaux possibles à 100 %)`);
if (state.flow) {
  const f = state.flow;
  console.log(`CVD ${fmt(f.cvd, 3)} · déséquilibre ${fmt(f.imbalance)} · z delta ${fmt(f.deltaZ, 1)} · VWAP ${fmt(f.vwap)}`);
  for (const w of f.walls.slice(0, 4)) console.log(`  mur ${w.side} ${fmt(w.qty, 3)} à ${fmt(w.price)} (${w.ageS} s)`);
}
console.log('');
console.log(state.active ? formatSignal(state.active) : 'Aucun signal actif.');
if (state.lastRejection) console.log('\n' + formatRejection(state.lastRejection));
console.log('\n' + formatStats(state.stats));
