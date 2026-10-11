// Fiches de méthode tirées des vidéos : la méthode PBD (formes P / b / D et leurs quatre setups), la
// routine de scalping en quatre étapes, et l'espérance d'une stratégie. Rien ici n'est un signal : ce
// sont des grilles de lecture à valider soi-même (replay, puis journal) avant d'y croire.

export const STRATEGY_ARTICLES = [
  {
    id: 'pbd',
    group: 'Méthode',
    title: 'Méthode PBD : formes P, b, D et leurs quatre setups',
    level: 'rule',
    what: 'Le marché alterne équilibre (la zone où se fait l’essentiel du volume) et déséquilibre (mouvement rapide, peu de volume), avec souvent des enchères ratées entre les deux. La méthode ramène tout à trois formes : P (hausse puis zone en haut), b (baisse puis zone en bas), D (range sans direction). On trace un profil de volume sur la zone, on relève la value area (VAH, VAL, POC) puis on descend en 5 min et 1 min pour l’entrée.',
    read: [
      'Break-in (le plus fiable selon l’auteur, sans statistique) : le prix sort sous la VAL, une bougie clôture de nouveau dans la zone ; on attend un retest, on achète, on vise l’autre bord de la zone. Les setups b sont le miroir exact.',
      'Cassure : une bougie sort avec force et initiative ; on attend deux bougies hors de la zone ou une bougie à fort volume, puis un retest. Si la cassure rentre aussitôt, c’est une enchère ratée : on ne la joue pas.',
      'Enchère ratée (retournement, moins fiable) : la cassure se fait avec peu d’achats puis une grosse bougie rentre dans la zone ; on vise l’autre bord.',
      'Retournement complet : après une cassure, les vendeurs cassent l’autre bord avec initiative ; on suit jusqu’au début de l’impulsion. En range (D) : vendre les enchères ratées en haut, acheter celles du bas.',
      'Filtre de volume : pour un retour dans la zone, le volume monte à la sortie, s’assèche, puis remonte pendant la rentrée. Déclencheurs order flow : gros trade sur la cassure, delta fort à la clôture, volume qui progresse de bougie en bougie.',
      'Entrée : ordre en attente sur le retest (qui n’est pas toujours touché), ou ordre limite sur le déséquilibre laissé par la cassure. Stop sous le POC du range (ou, plus prudent, sous toute la zone) ; cible : l’autre bord de la value area.',
      'Filtre intraday : attendre la cassure du range d’ouverture des 15 premières minutes. À ne pas faire : cassure qui rentre aussitôt, pas de clôture dans la zone suivie d’un retest, marché trop étendu.',
    ],
    traps: [
      'Les taux de réussite (« le meilleur taux ») et les cibles de 1:3 à 1:5 sont annoncés sans aucune statistique ; les exemples sont choisis après coup.',
      'Sur Binance, la séance cash n’existe pas : le profil se fait sur le jour UTC, une séance de bureau ou une plage tracée.',
      'La vidéo ne parle ni de point mort ni de renforts, et son passage sur le risque est confus.',
    ],
    see: ['prev', 'effort-result', 'orb', 'scalp'],
  },
  {
    id: 'scalp',
    group: 'Méthode',
    title: 'Routine de scalping en quatre étapes',
    level: 'rule',
    what: 'Routine d’un scalpeur observée en direct (séance de plus de 3 h) : 1) état du marché, 2) lieu, 3) agression, 4) cible. Chaque étape doit être validée avant la suivante.',
    read: [
      '1) État : équilibre ou déséquilibre ? Le marché est-il étendu ? Pas de trade avant l’ouverture ; la direction se clarifie 15 à 30 minutes après.',
      '2) Lieu : un creux de volume (LVN) de la jambe en cours, un bord de value area, le haut ou le bas de la veille. Plutôt une alerte juste avant le niveau qu’un ordre limite posé d’avance.',
      '3) Agression : un gros ordre exécuté (gros prints filtrés) avec suite = initiative ; sans suite = absorption. Ne jamais prendre la première poussée : attendre la seconde. Exiger une clôture de confirmation (corps plein au-delà du niveau) ; chaque rejet rend plus exigeant.',
      '4) Cible : le POC de l’équilibre précédent, ou le plus haut de la veille. Stop derrière la grosse agression (1 à 2 lignes avant l’extrême plutôt que derrière tout le range). Point mort rapide, sauf LVN juste derrière.',
      'Gestion du risque observée : 0,25 % du compte par trade (compte personnel), 0,5 % en compétition, 2 % de perte maximale par jour ; les setups plus risqués seulement avec les gains du jour (« house money »). Arrêter après un échec ou en compression de marché.',
      'Dans deepflow : calque Gros prints (seuil, regroupement par prix), range d’ouverture, niveaux de la veille, outil position (point mort, stop suiveur), alertes de prix, journal avec budget du jour.',
    ],
    traps: [
      'Les chiffres « 70 % des retours au POC » et « le plus haut de la veille : meilleur taux » sont des impressions, pas des mesures.',
      'Contradiction dans la vidéo : « je ne regarde jamais les ordres limites » face au « chemin de moindre résistance » (le côté où le carnet est le plus mince) enseigné ailleurs.',
      'Le stop à 1 ou 2 ticks sur un marché aussi rapide peut sauter par glissement ; les frais pèsent lourd sur un scalp : l’outil position avertit quand la cible vaut moins de 3 fois les frais.',
    ],
    see: ['big', 'position', 'journal', 'pbd'],
  },
  {
    id: 'expectancy',
    group: 'Méthode',
    title: 'Espérance, taux de réussite et surajustement',
    level: 'fact',
    what: 'L’espérance est ce que rapporte un trade en moyenne, en R : taux de réussite × gain moyen − taux de perte × perte moyenne. Le payoff est le gain moyen divisé par la perte moyenne. On ne perd pas d’argent, avant frais, si le taux de réussite dépasse 1 / (1 + payoff) : avec un payoff de 2, un trade sur trois suffit ; avec 1, il en faut un sur deux. Le facteur de profit est le total des gains divisé par le total des pertes.',
    read: [
      'Le journal trace votre point (payoff, taux de réussite) au-dessus ou en dessous de la ligne d’équilibre : c’est la mesure honnête de votre stratégie, bien plus que les captures d’écran.',
      'Surajustement : ajuster des règles jusqu’à ce qu’elles collent à l’historique fabrique de belles courbes qui ne tiennent pas en réel. Valider chaque règle sur des données qu’on n’a pas utilisées pour la trouver : replay, puis petit réel.',
      'Compter les frais et le glissement : un petit gain moyen peut y disparaître, surtout en scalping.',
    ],
    traps: [
      'Avec peu de trades (moins de 30 par setup), le taux de réussite est très instable : une série de gains ou de pertes ne prouve rien.',
      'Les taux de réussite affirmés dans les vidéos (« des centaines de trades avec un taux élevé », « ça marche toujours ») n’ont ni méthode ni source vérifiable.',
    ],
    see: ['journal', 'position'],
  },
];
