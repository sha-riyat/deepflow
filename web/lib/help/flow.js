// Fiches d'aide : flux d'ordres (qui agresse, où, avec quelle taille) et carnet d'ordres.
// Statut : 'fact' (donnée mesurée), 'rule' (règle empirique, non prouvée), 'context' (repère).

export const FLOW_ARTICLES = [
  {
    id: 'basics',
    group: 'Bases',
    title: 'Agresseurs, bid, ask et delta',
    level: 'fact',
    what: 'Chaque trade réunit un ordre passif (posé dans le carnet, « maker ») et un ordre agressif (« taker ») qui le prend. Acheter au marché prend l’ask (prix demandé) : c’est un achat agresseur. Vendre au marché frappe le bid (prix offert) : vente agresseur. Le delta est le volume acheteur agresseur moins le volume vendeur agresseur.',
    read: [
      'Delta positif : les acheteurs pressés ont dominé ; négatif : les vendeurs pressés.',
      'Le prix monte quand les achats agresseurs consomment les offres plus vite qu’elles ne sont remplacées.',
      'Binance publie le côté agresseur de chaque trade : c’est une mesure exacte, pas une estimation.',
    ],
    traps: [
      'Un delta positif ne garantit pas une hausse : un gros vendeur passif (ordres limites) peut tout absorber.',
      'Le passif (ordres limites) est souvent le « gros » : l’agressif montre l’urgence, pas forcément la force.',
    ],
  },
  {
    id: 'heat',
    group: 'Flux d’ordres',
    title: 'Heatmap de liquidité',
    level: 'fact',
    what: 'Image du carnet d’ordres dans le temps : plus une case est claire, plus il y avait d’ordres limites en attente à ce prix à cet instant.',
    read: [
      'Bandes claires horizontales : grosses quantités posées (murs), qui peuvent freiner le prix.',
      'Un mur qui disparaît juste avant d’être touché était peut-être un leurre (spoofing).',
      'Un mur touché qui tient pendant que le prix bute dessus, avec beaucoup de volume : absorption.',
    ],
    traps: [
      'Les ordres affichés peuvent être retirés à tout moment : un mur n’est pas un support garanti.',
      'Profondeur limitée à la mémoire du collecteur (4 h par défaut) ; rien en replay (Binance n’archive pas le carnet).',
    ],
  },
  {
    id: 'bubbles',
    group: 'Flux d’ordres',
    title: 'Bulles de trades',
    level: 'fact',
    what: 'Une bulle par petit créneau de temps, placée au prix moyen des trades du créneau ; sa taille suit le volume, sa couleur la part d’achats et de ventes agresseurs. Les bulles d’une même bougie sont empilées sur sa colonne (réglage « Position horizontale » pour les étaler à l’heure exacte).',
    read: [
      'Grosses bulles à un extrême suivies d’un retournement : activité forte rejetée (piège possible).',
      'Grosses bulles qui poussent le prix dans leur sens : initiative, le mouvement a de l’élan.',
    ],
    traps: ['La taille est relative aux bulles visibles : comparez dans la même vue, pas d’un zoom à l’autre.'],
  },
  {
    id: 'big',
    group: 'Flux d’ordres',
    title: 'Gros prints (lire les gros ordres)',
    level: 'fact',
    what: 'Ordres agresseurs de grande taille (plusieurs fills regroupés en un seul ordre), au-delà d’un seuil : par défaut 50 000 $ sur BTC et 25 000 $ ailleurs. Cercle plein vert = achat agresseur, rouge = vente ; plus il est gros, plus l’ordre est gros. Par défaut, les gros ordres du même côté, au même niveau de prix de la même bougie sont additionnés (« ×4 » : quatre ordres). Maj + G masque ou réaffiche d’un coup les bulles et les gros prints, pour lire le prix seul. Les cercles sont centrés sur la colonne de leur bougie (seul le prix varie) ; le réglage « Position horizontale » permet de les placer à l’heure exacte.',
    read: [
      'Cercle plein : le prix a avancé dans le sens du gros ordre pendant les bougies suivantes (3 par défaut). Anneau creux : le prix n’a pas suivi, c’est une lecture d’absorption (règle empirique : un acteur passif a encaissé l’ordre). « Avancer » se mesure en fraction de l’amplitude moyenne d’une bougie : le critère s’adapte à l’unité de temps.',
      'Plusieurs gros prints du même côté à un niveau : un acteur important y montre son intérêt.',
      'Acheteurs à droite et vendeurs à gauche de la mèche ; au plus 3 cercles par bougie (les plus gros), pour garder une colonne lisible : réglable avec « Maximum par bougie ».',
      'Le réglage « Seuil par session » baisse le seuil en Asie (×0,5) et le monte à New York (×2), pour comparer des activités comparables.',
      'La ligne « Gros Δ » du panneau Statistiques donne le delta des seuls gros prints de chaque bougie : un prix qui monte alors que ce delta faiblit montre que les gros ne poussent plus.',
    ],
    traps: [
      'Un gros ordre peut être un rachat forcé (liquidation) et non une conviction.',
      'Binance publie des trades agrégés, pas les ordres un par un : un « gros ordre » est un ordre agresseur, et deux ordres distincts au même instant peuvent être comptés comme un seul. Le « ×n » est donc le nombre d’ordres agrégés, pas de participants.',
      'L’anneau creux est jugé sur les bougies déjà terminées : un print récent n’est pas encore jugé (il reste plein), et un prix qui n’avance pas peut avancer plus tard.',
      'Lisibilité : n’affichez pas à la fois les bulles de trades et les gros prints, ou réduisez le nombre affiché ; Maj + G masque les deux d’un coup.',
    ],
  },
  {
    id: 'liq',
    group: 'Flux d’ordres',
    title: 'Liquidations',
    level: 'fact',
    what: 'Positions à levier fermées de force par la plateforme. Long liquidé = vente forcée ; short liquidé = achat forcé.',
    read: [
      'Une cascade de liquidations longues accélère la baisse puis s’épuise souvent : la vente forcée est finie.',
      'Après une purge, le prix revient fréquemment vers la zone de départ (règle empirique).',
    ],
    traps: ['Binance n’envoie qu’une liquidation par seconde et par symbole : c’est un échantillon, pas le total.'],
  },
  {
    id: 'quotes',
    group: 'Flux d’ordres',
    title: 'Bid / ask',
    level: 'fact',
    what: 'Meilleur prix offert (bid) et meilleur prix demandé (ask) récents, visibles au zoom serré. L’écart entre les deux est le spread.',
    read: ['Un spread qui s’élargit signale une liquidité qui se retire : mouvements plus brusques possibles.'],
    traps: [],
  },
  {
    id: 'div',
    group: 'Flux d’ordres',
    title: 'Divergences CVD',
    level: 'rule',
    what: 'Le prix fait un nouveau sommet (ou creux) mais le CVD (delta cumulé) ne le confirme pas.',
    read: [
      'Nouveau haut sans nouveau haut du CVD : les acheteurs agresseurs s’essoufflent.',
      'Nouveau bas sans nouveau bas du CVD : les vendeurs agresseurs s’essoufflent (ou des acheteurs passifs absorbent).',
    ],
    traps: ['Une divergence peut durer longtemps : c’est un avertissement, pas un signal d’entrée à elle seule.'],
  },
  {
    id: 'oiprof',
    group: 'Flux d’ordres',
    title: 'Open interest par prix et lecture prix / OI',
    level: 'rule',
    what: 'L’open interest (OI) compte les contrats ouverts. S’il monte, des positions s’ouvrent ; s’il baisse, des positions se ferment. Croisé avec le prix, il dit qui entre et qui sort.',
    read: [
      'Prix ↑ et OI ↑ : nouveaux longs. Prix ↓ et OI ↑ : nouveaux shorts.',
      'Prix ↑ et OI ↓ : rachats de shorts (la hausse peut s’essouffler une fois les shorts sortis).',
      'Prix ↓ et OI ↓ : sorties de longs (liquidations ou prises de bénéfices).',
      'Profil : niveaux où beaucoup de positions ont été ouvertes = positions à défendre (ou à liquider plus tard).',
    ],
    traps: ['OI Binance par paliers de 5 min au mieux, rangé au prix de clôture de la bougie : attribution approximative.'],
  },
  {
    id: 'absorption',
    group: 'Footprint',
    title: 'Absorption (A) et épuisement (E)',
    level: 'rule',
    what: 'Absorption : beaucoup d’agression à un extrême de bougie (au moins 1,5 fois une ligne moyenne) sans que le prix aille plus loin (un passif encaisse). Épuisement : presque plus d’agression à l’extrême alors que la ligne voisine était bien fournie : le volume s’assèche net, plus personne ne pousse. Chaque marque touche quelques pourcents des bougies ; si vous n’en voyez pas, c’est normal : elles sont rares.',
    read: [
      'A sur un bas, puis reprise à la hausse : des acheteurs passifs ont tenu le niveau.',
      'E sur un haut : la poussée s’arrête faute d’acheteurs ; un retour est possible.',
    ],
    traps: ['Marques calculées par règle simple : à confirmer par la bougie suivante et le contexte (niveau clé ?).'],
  },
  {
    id: 'imbalance',
    group: 'Footprint',
    title: 'Déséquilibres et enchères inachevées',
    level: 'rule',
    what: 'Déséquilibre diagonal : à un prix, les achats agresseurs dépassent (par défaut 3 fois) les ventes du prix juste en dessous (ou l’inverse). Empilés sur plusieurs niveaux, ils forment une zone d’initiative. Enchère inachevée : acheteurs et vendeurs présents sur l’extrême de la bougie.',
    read: [
      'Déséquilibres acheteurs empilés : zone où les acheteurs ont pris l’initiative, souvent défendue au retour.',
      'Enchère inachevée sur un haut : le marché revient souvent la « finir » plus tard.',
    ],
    traps: ['Sur un actif peu liquide, les déséquilibres apparaissent partout : montez le ratio.'],
  },
];

// Modes du footprint (sous-titres du menu et fiches).
export const FOOTPRINT_HELP = {
  bidask: 'Ventes agresseurs (au bid) à gauche, achats (à l’ask) à droite, à chaque prix',
  ladder: 'Bid × ask en barres horizontales : les déséquilibres sautent aux yeux',
  delta: 'Achats moins ventes à chaque prix : où la pression a dominé',
  volume: 'Volume total à chaque prix : le profil de la bougie',
  trades: 'Nombre de trades à chaque prix : beaucoup de petits ordres ou quelques gros',
  voldelta: 'Volume et delta côte à côte',
  profile: 'Profil achats / ventes de chaque bougie',
  deltaprofile: 'Profil du delta de chaque bougie',
};
