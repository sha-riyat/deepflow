// Fiches d'apprentissage : lire le flux (effort et résultat, responsive et initiative, stop run,
// icebergs) et bases du marché (ordres et file d'attente, VWAP, Wyckoff). Issues de l'analyse des
// vidéos d'order flow (docs/analyse-videos/) : chaque fiche dit ce qui est mesuré, ce qui est une
// règle empirique et ce qui n'est pas prouvé.

export const THEORY_ARTICLES = [
  {
    id: 'effort-result',
    group: 'Lire le flux',
    title: 'Effort et résultat : absorption, initiative, balayage, épuisement',
    level: 'rule',
    what: 'L’effort, c’est le volume exécuté par les agresseurs (ordres au marché) ; le résultat, la distance parcourue par le prix. Les comparer dit qui contrôle : un gros effort sans résultat n’a pas le même sens qu’un petit effort qui déplace tout.',
    read: [
      'Absorption : gros effort, peu ou pas de résultat. Un ordre limite passif encaisse : par exemple un delta très acheteur et une bougie qui clôture en baisse. Les acheteurs poussent, un vendeur plus gros les attend.',
      'Initiative : effort récompensé. Agression d’un seul côté, déséquilibres, delta fort, clôture pleine, volume au-dessus de la moyenne. Celui qui pousse gagne.',
      'Balayage du carnet : peu d’effort, gros résultat. Il y avait peu d’ordres limites sur le chemin, le prix glisse.',
      'Épuisement : le volume diminue pendant que le prix monte, et un déséquilibre contraire apparaît au sommet. Plus personne ne pousse.',
      'Dans deepflow : delta % et volume relatif sous les bougies, gros prints regroupés par prix, marques A (absorption) et E (épuisement) du footprint, mode Stats.',
    ],
    traps: [
      'Aucun seuil universel : ceux des vidéos (par exemple delta de 10 % du volume) sont des repères, pas des lois.',
      'Facile à voir après coup sur un graphique choisi : testez la lecture en replay avant d’y croire.',
    ],
  },
  {
    id: 'responsive-initiative',
    group: 'Lire le flux',
    title: 'Enchère responsive et initiative (schéma R&I)',
    level: 'rule',
    what: 'Une enchère responsive répond au prix : on achète bas, on vend haut, le prix revient vers la valeur. Une enchère d’initiative pousse le prix hors de la valeur. Les vidéos enchaînent souvent les deux.',
    read: [
      'Schéma décrit : initiative au-dessus des plus hauts, puis épuisement et déséquilibres vendeurs au sommet, puis absorption (un gros vendeur passif encaisse tout), puis initiative vendeuse.',
      'Zone à surveiller : du niveau d’absorption jusqu’au groupe de déséquilibres laissé par l’impulsion. Au retest de cette zone, de nouveaux déséquilibres dans le même sens sont le déclencheur.',
      'Repères cités : un delta inférieur à 10 % du volume signale une bougie équilibrée ; au moins trois déséquilibres d’affilée au retest ; un volume qui s’assèche au repli. Les retests sont plus fréquents au début de l’impulsion qu’à la fin.',
    ],
    traps: [
      '« Trois déséquilibres d’affilée = signal à très forte probabilité » est affirmé sans mesure, et sans stop ni cible chiffrés.',
      'La notion de « vrai FVG d’order flow » (partie à faible volume d’une grosse bougie) est floue : aucune règle chiffrée.',
    ],
  },
  {
    id: 'stoprun',
    group: 'Lire le flux',
    title: 'Stop run ou enchère ratée ?',
    level: 'rule',
    what: 'Un stop déclenché devient un ordre au marché : il laisse une trace d’agression. Au-delà d’un haut ou d’un bas, beaucoup d’agression d’un seul côté, un delta fort et des lignes presque vides dans la bougie (un « sprint ») indiquent un vrai balayage de stops. Peu de volume ou un delta équilibré indiquent une enchère ratée : le prix dépasse, personne ne suit, il revient.',
    read: [
      'Regardez le volume échangé au-delà du niveau, pas la longueur de la mèche : quelques miettes de contrats ne « chassent » rien.',
      'Un stop run ne finance pas le mouvement suivant : la contrepartie donne seulement un meilleur prix. La vraie prise de liquidité est une phase entière passée au-delà des extrêmes, pas une mèche.',
      'En crypto, les liquidations de positions à levier sont des stops visibles : le panneau Liquidations montre les cascades. Une cascade de liquidations longues accélère la baisse, puis s’épuise souvent : la vente forcée est finie.',
    ],
    traps: [
      'La vidéo « 1 000 stop hunts » n’en montre qu’une quinzaine de cas choisis, sans statistique ni seuil chiffré qui sépare les deux cas.',
      'Les cas ambigus (annonce, séance particulière) demandent des données par ordre (MBO) que Binance ne publie pas.',
    ],
  },
  {
    id: 'iceberg',
    group: 'Lire le flux',
    title: 'Icebergs et données MBO',
    level: 'context',
    what: 'Un iceberg est un gros ordre limite dont on n’affiche qu’une petite pointe (par exemple 20 contrats), rechargée à chaque exécution : le prix reste immobile malgré une forte agression. Les données par ordre (MBO) donnent un identifiant à chaque ordre : c’est ainsi qu’on prouve qu’une recharge vient du même gros acteur. Les données par prix (MBP) donnent seulement la quantité totale à chaque niveau.',
    read: [
      'Binance publie chaque trade et le carnet par prix, pas le carnet par ordre : un iceberg ne peut qu’être soupçonné, jamais prouvé.',
      'Indice indirect : un prix qui ne bouge pas malgré un gros delta à un niveau, un POC de bougie très chargé, un carnet qui se recharge après chaque exécution.',
      'Usages cités : vendre contre l’iceberg avec un stop juste au-dessus, ou acheter la cassure quand il cède (annoncé à 60-70 % de réussite, passage ambigu). Les séances Asie et Londres, peu liquides, rendent un gros ordre anormal.',
    ],
    traps: [
      'Un même opérateur peut échanger avec lui-même (rééquilibrage, changement d’échéance) : ce n’est pas forcément une prise de position.',
      'Cas d’échec : l’iceberg cède un moment puis le prix repart ; cela ressemble à une prise de liquidité mais c’est une enchère ratée.',
      'deepflow ne détecte pas les icebergs : les indicateurs de ce type sont des signaux automatiques, hors du cadre du projet (analyse manuelle).',
    ],
  },
  {
    id: 'orders',
    group: 'Bases du marché',
    title: 'Types d’ordres, file d’attente (FIFO) et teneurs de marché',
    level: 'fact',
    what: 'Un ordre limite se pose dans le carnet et attend : on choisit le prix, pas l’exécution. Un ordre au marché prend ce qui est disponible : exécution certaine, prix incertain (glissement). Le carnet se lit du meilleur prix d’achat (best bid) au meilleur prix de vente (best ask) ; l’écart entre les deux est le spread.',
    read: [
      'Les agresseurs (ordres au marché, stops déclenchés) déplacent le prix en acceptant un moins bon prix ; les passifs (ordres limites) créent la résistance. Là où il n’y a pas de liquidité, il n’y a pas de marché.',
      'File d’attente FIFO : à un même prix, le premier ordre posé est servi le premier. Certaines places ajoutent un teneur de marché principal qui obtient une priorité en échange de liquidité garantie.',
      'Les teneurs de marché gagnent le spread à chaque aller-retour : ils aiment un prix qui reste en range et retirent leurs ordres autour des annonces, d’où un carnet presque vide et des mouvements violents.',
    ],
    traps: [
      'La règle d’appariement dépend de la plateforme : vérifiez-la dans sa documentation plutôt que sur un exemple de vidéo (les chiffres d’une priorité de 40 % pour le teneur principal y sont à vérifier).',
      'Un ordre limite affiché peut être retiré avant d’être touché (spoofing) : les ordres exécutés sont plus fiables que le carnet affiché.',
    ],
  },
  {
    id: 'vwap-theory',
    group: 'Bases du marché',
    title: 'VWAP : une moyenne pondérée, pas une moyenne mobile',
    level: 'rule',
    what: 'Le VWAP est le prix moyen de tout ce qui a été échangé depuis un point de départ (début de session, de semaine, ou une bougie choisie), chaque prix pesant son volume. Il repart de zéro à chaque période. Une moyenne mobile, elle, glisse sur un nombre fixe de bougies sans tenir compte du volume. Les bandes sont des écarts-types autour du VWAP ; ce n’est pas la value area, qui s’obtient en ajoutant des niveaux autour du POC jusqu’à 70 % du volume.',
    read: [
      'Lecture des vidéos : le VWAP sert de support ou de résistance dynamique ; loin de lui, le prix tend à y revenir, et il le reteste souvent une ou deux fois après l’avoir cassé.',
      'Plus le prix va loin dans les bandes extérieures, plus un retour vers le VWAP est probable ; la cible du retour est le VWAP central.',
      'Les algorithmes d’exécution VWAP découpent de gros ordres sur 30 minutes à une journée : le volume suit une courbe en U (pic à l’ouverture, creux au milieu, remontée vers la clôture).',
    ],
    traps: [
      'En tendance forte, le prix reste en haut des bandes : vendre la bande +2σ est un piège classique. Ne tradez jamais le VWAP seul, sans contexte.',
      'Les « prix institutionnels optimaux » sur les bandes ne sont pas mesurés ; la vidéo ne donne ni stop, ni taille, ni résultat chiffré.',
    ],
  },
  {
    id: 'wyckoff',
    group: 'Bases du marché',
    title: 'Wyckoff : accumulation et distribution',
    level: 'context',
    what: 'Cadre de Richard Wyckoff : le marché alterne accumulation (de gros acteurs achètent dans un range bas), hausse, distribution (ils vendent dans un range haut) et baisse. C’est une grille de lecture, pas une méthode chiffrée.',
    read: [
      'Ce qu’on peut observer : un range prolongé après une tendance (une zone de volume dense dans le profil), des enchères ratées aux bords (une sortie du range sans suite, puis retour : « spring » en bas, « upthrust » en haut), de l’absorption à l’extrême.',
      'La vraie prise de liquidité est le temps passé au-delà des extrêmes, pas une mèche ; la vidéo sur les stops fait ce lien avec les accumulations et les distributions.',
      'Dans deepflow : formes de profil P, b et D, double distribution, acceptation ou rejet de la value area, absorption, déséquilibres.',
    ],
    traps: [
      'Les phases se reconnaissent surtout après coup. Un range n’est pas forcément une accumulation : il peut se résoudre dans les deux sens.',
      'Aucune règle d’entrée ni de stop chiffrée dans les vidéos : à construire et à tester soi-même, en replay puis dans le journal.',
    ],
  },
];
