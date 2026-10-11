// Check-list avant de prendre un trade : la routine d'analyse (contexte, ouverture, lieu, confirmation,
// plan, risque) en cases à cocher à la main. Rien n'est coché automatiquement et rien n'est un signal :
// la liste sert à ne pas sauter d'étape. Les cases « essentielles » doivent toutes être cochées avant
// d'entrer ; la part de cases cochées propose une note A / B / C indicative pour le journal.

// phase, libellé, fiche d'aide liée (id de web/lib/help), essentielle ou non.
export const CHECKLIST = [
  { id: 'ctx-va', phase: 'Contexte', label: 'J’ai noté la value area, le POC et la forme du profil d’hier', help: 'prev' },
  { id: 'ctx-levels', phase: 'Contexte', label: 'Je connais les niveaux proches : hauts et bas d’hier, POC non testés, ouvertures de semaine et de mois, LVN', help: 'keys' },
  { id: 'ctx-news', phase: 'Contexte', label: 'Pas d’annonce majeure imminente, ou je la connais' },
  { id: 'ctx-hours', phase: 'Contexte', label: 'Je suis dans mes heures de trading', help: 'hours' },
  { id: 'st-open', phase: 'État du marché', label: 'Je sais où le prix a ouvert par rapport à la veille (dans la valeur, dans le range, hors du range)', help: 'open' },
  { id: 'st-state', phase: 'État du marché', label: 'J’ai décidé : équilibre (le prix tourne) ou déséquilibre (tendance, valeur qui migre)', help: 'prev' },
  { id: 'st-orb', phase: 'État du marché', label: 'Le range d’ouverture est fini et je ne prends pas la première poussée', help: 'orb' },
  { id: 'lo-zone', phase: 'Lieu', label: 'Le prix est sur une zone qualifiée : bord de value area, LVN, POC non testé, haut ou bas d’hier', help: 'pbd', core: true },
  { id: 'lo-setup', phase: 'Lieu', label: 'Je peux nommer mon setup (break-in, cassure, enchère ratée, retournement, absorption…)', help: 'pbd' },
  { id: 'cf-flow', phase: 'Confirmation', label: 'Le flux confirme à ce niveau : absorption ou initiative (delta %, gros prints, footprint)', help: 'effort-result', core: true },
  { id: 'cf-close', phase: 'Confirmation', label: 'J’ai une clôture de confirmation (corps plein au-delà du niveau, ou retour dans la zone)', help: 'scalp' },
  { id: 'cf-volume', phase: 'Confirmation', label: 'Le volume suit : au-dessus de la moyenne à la sortie, et qui remonte à la rentrée', help: 'pbd' },
  { id: 'pl-stop', phase: 'Plan', label: 'Mon stop est là où l’idée est fausse (derrière la grosse agression ou le POC du range)', help: 'position', core: true },
  { id: 'pl-target', phase: 'Plan', label: 'Ma cible est un niveau : autre bord de la valeur, POC de l’équilibre précédent', help: 'scalp' },
  { id: 'pl-rr', phase: 'Plan', label: 'Rapport gain / risque d’au moins 2, et cible d’au moins 3 fois les frais aller-retour', help: 'position', core: true },
  { id: 'rk-size', phase: 'Risque', label: 'Taille calculée à partir du stop (outil position), jamais l’inverse', help: 'position', core: true },
  { id: 'rk-budget', phase: 'Risque', label: 'Risque dans mon budget du jour (un setup plus risqué seulement avec les gains du jour)', help: 'journal' },
  { id: 'rk-journal', phase: 'Risque', label: 'Je noterai ce trade dans le journal, avec sa note A / B / C', help: 'journal' },
];

export const PHASES = [...new Set(CHECKLIST.map((s) => s.phase))];

// Bilan d'une liste de cases cochées : cochées / total, cases manquantes, cases essentielles manquantes,
// prêt à entrer (toutes les essentielles cochées) et note indicative : A (au moins 90 % et prêt),
// B (au moins 70 % et prêt), sinon C. Les identifiants inconnus sont ignorés.
export function checklistSummary(checked) {
  const ticked = new Set(checked);
  const missing = CHECKLIST.filter((s) => !ticked.has(s.id));
  const coreMissing = missing.filter((s) => s.core);
  const done = CHECKLIST.length - missing.length;
  const share = done / CHECKLIST.length;
  const ready = coreMissing.length === 0;
  return { done, total: CHECKLIST.length, share, missing, coreMissing, ready, grade: ready && share >= 0.9 ? 'A' : ready && share >= 0.7 ? 'B' : 'C' };
}

// Liste lue depuis le stockage : tableau d'identifiants connus, sans doublon.
export function cleanChecked(raw) {
  const known = new Set(CHECKLIST.map((s) => s.id));
  return [...new Set(Array.isArray(raw) ? raw.filter((id) => known.has(id)) : [])];
}
