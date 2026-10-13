// Check-list avant de prendre un trade : la routine d'analyse (avant la séance, ouverture, état, lieu, confirmation,
// plan, risque) en cases à cocher à la main. Rien n'est coché automatiquement et rien n'est un signal :
// la liste sert à ne pas sauter d'étape. Les cases « essentielles » doivent toutes être cochées avant
// d'entrer ; la part de cases cochées propose une note A / B / C indicative pour le journal.

// phase, libellé, où le trouver (noms exacts de l'application), fiche d'aide liée (id de web/lib/help),
// essentielle ou non. Même ordre que les fiches de docs/strategie/.
export const CHECKLIST = [
  { id: 'ctx-va', phase: 'Avant la séance', label: 'J’ai noté la forme du profil et où est la valeur d’hier (VAH, VAL, POC)', where: 'Indicateurs ▸ Profils et niveaux ▸ « Value area de la veille » et « Profil de session »', help: 'prev' },
  { id: 'ctx-levels', phase: 'Avant la séance', label: 'Je connais les niveaux proches : hauts et bas d’hier, POC non testés, ouvertures de semaine et de mois', where: 'Indicateurs ▸ Profils et niveaux ▸ « Niveaux clés » et « POC non testés »', help: 'keys' },
  { id: 'ctx-plan', phase: 'Avant la séance', label: 'J’ai écrit mes scénarios (haussier, baissier, neutre) et posé mes alertes sur les niveaux', where: 'Panneau « Journal » ▸ « Fiche de la semaine » ; panneau « Alertes » ▸ « Prix franchi »', help: 'journal' },
  { id: 'ctx-hours', phase: 'Avant la séance', label: 'Je suis dans ma fenêtre de trading et j’ai fait moins de 3 trades aujourd’hui', where: 'Indicateurs ▸ Sessions et horaires ▸ « Mes heures de trading » ; panneau « Journal » ▸ « Budget du jour »', help: 'hours' },
  { id: 'op-open', phase: 'Ouverture', label: 'Je sais où le prix a ouvert par rapport à hier : dans la valeur, dans le range, ou hors du range', where: 'Indicateurs ▸ Profils et niveaux ▸ « Ouverture du jour » (lis sa légende)', help: 'open' },
  { id: 'op-orb', phase: 'Ouverture', label: 'Le range d’ouverture de 15 minutes est fini et je ne prends pas la première poussée', where: 'Indicateurs ▸ Profils et niveaux ▸ « Range d’ouverture (ORB) »', help: 'orb' },
  { id: 'st-state', phase: 'État du marché', label: 'J’ai décidé : le prix tourne dans la valeur d’hier, ou il en sort et y reste (déséquilibre)', where: 'Légende de « Value area de la veille » : dans la valeur, acceptation, rejet', help: 'prev' },
  { id: 'lo-zone', phase: 'Lieu', label: 'Le prix est sur un niveau important : VAH ou VAL d’hier, creux de volume, POC non testé, haut ou bas d’hier, VWAP', where: '« Value area de la veille », « Profil de session » (HVN / LVN), « POC non testés », « Niveaux clés », « VWAP »', help: 'pbd', core: true },
  { id: 'lo-setup', phase: 'Lieu', label: 'Je peux nommer mon setup (pour débuter : le break-in)', where: 'Panneau « Apprendre » ▸ onglet « Fiches » ▸ « Méthode PBD »', help: 'pbd' },
  { id: 'cf-flow', phase: 'Confirmation', label: 'Le flux confirme sur ce niveau : absorption ou initiative', where: 'Menu « Footprint » (« Bid × Ask », marques A et E), « Gros prints », panneau « Statistiques »', help: 'effort-result', core: true },
  { id: 'cf-close', phase: 'Confirmation', label: 'J’ai une clôture de confirmation (corps plein au-delà du niveau, ou retour dans la zone), puis un retest', where: 'Graphique en 5m ; 1m seulement pour vérifier le déclencheur', help: 'scalp' },
  { id: 'cf-volume', phase: 'Confirmation', label: 'Le volume suit : fort à la sortie, faible puis fort à la rentrée', where: 'Panneaux « Statistiques » (volume, delta %) et « Volume »', help: 'pbd' },
  { id: 'pl-stop', phase: 'Plan et risque', label: 'Mon stop est là où l’idée est fausse', where: 'Barre de gauche ▸ « Position longue » (Alt + L) ou « Position courte » (Alt + S)', help: 'position', core: true },
  { id: 'pl-target', phase: 'Plan et risque', label: 'Ma cible est un niveau : autre bord de la valeur, POC de l’équilibre précédent, haut ou bas d’hier', where: 'Poignée de la cible de l’outil « Position longue » / « Position courte »', help: 'scalp' },
  { id: 'pl-rr', phase: 'Plan et risque', label: 'Rapport gain / risque d’au moins 2, et aucun avertissement orange sur les frais', where: 'Texte affiché sur l’outil position (R:R)', help: 'position', core: true },
  { id: 'rk-size', phase: 'Plan et risque', label: 'Ma taille vient du stop : j’ai réglé « Capital » et « Risque », et choisi la note A, B ou C', where: 'Barre flottante de la position ; roue dentée « Réglages du dessin » ▸ « Note du setup »', help: 'position', core: true },
  { id: 'rk-budget', phase: 'Plan et risque', label: 'Je suis dans mon budget du jour (un setup plus risqué seulement avec les gains du jour)', where: 'Panneau « Journal » ▸ « Budget du jour »', help: 'journal' },
  { id: 'rk-journal', phase: 'Plan et risque', label: 'Je noterai ce trade dans le journal, avec sa note A, B ou C', where: 'Panneau « Journal » ▸ « Noter un trade »', help: 'journal' },
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
