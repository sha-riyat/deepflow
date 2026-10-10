<img src="assets/logo.svg" width="72" alt="Logo deepflow : profil de volume, POC en orange">

# deepflow

Terminal d'analyse order flow, Volume Profile et TPO pour les cryptos, gratuit et local (dans
l'esprit d'ATAS, DeepCharts, Exocharts ou Sierra Chart). Ces plateformes sont payantes parce que
les données d'order flow le sont sur les marchés classiques ; Binance publie gratuitement chaque
trade, le carnet d'ordres et les liquidations, ce qui rend l'outil possible.

Chacun ouvre son graphique, choisit ses indicateurs et fait son analyse. **Aucun signal automatique :
l'analyse et l'exécution (sur Binance) restent manuelles.** Ce n'est pas un conseil financier.

## Architecture

| Partie | Rôle | Techno |
|---|---|---|
| `server/` | Collecteur : WebSockets Binance, carnet local, historique (archives Binance Vision + REST), heatmap en mémoire, analyse du flux en direct, alertes, API et flux SSE (port 8787) | Node.js 22, sans dépendance |
| `shared/` | Construction des bougies, profils et transformations, commune au serveur et au navigateur | JavaScript ES |
| `web/` | Interface (port 3000) : barre d'outils, grille de graphiques, panneaux, recherche de symbole | Next.js 16, React 19, TypeScript, Hugeicons, Inter |
| `web/lib/` | Moteur de graphique Canvas 2D + WebGL2 (heatmap), piloté hors de React | JavaScript ES |

Next.js relaie `/api` et `/stream` vers le collecteur : le navigateur ne parle qu'à `localhost:3000`.

## Installation pas à pas

Chacun installe deepflow sur son ordinateur : rien à héberger, aucun compte. L'historique est
téléchargé depuis Binance au fil de l'utilisation (dossier `data/`). Binance peut être bloqué dans
certains pays (erreur 451) : il faut alors un accès qui l'autorise.

### Windows

1. Installer **Node.js** (version LTS, 22 ou plus récente) depuis https://nodejs.org : télécharger
   l'installateur Windows, puis « Suivant » jusqu'au bout (options par défaut).
2. Récupérer deepflow : sur la page GitHub du projet, bouton **Code** puis **Download ZIP**, et
   extraire le dossier (clic droit → « Extraire tout ») à un endroit simple, par exemple
   `Documents\deepflow`. Avec Git : `git clone` du dépôt.
3. Double-cliquer sur **`deepflow.cmd`** dans ce dossier. La première fois, il installe
   l'interface puis la construit (quelques minutes, connexion Internet requise) ; ensuite le
   démarrage prend quelques secondes. Le navigateur s'ouvre sur http://localhost:3000.
4. Laisser la fenêtre noire ouverte pendant l'utilisation ; la fermer (ou Ctrl+C) arrête deepflow.

Si Windows affiche « Windows a protégé votre ordinateur », cliquer sur « Informations
complémentaires » puis « Exécuter quand même » (le fichier ne fait que lancer `node`).

### Mac

1. Installer **Node.js** (version LTS) depuis https://nodejs.org (paquet `.pkg`), ou avec nvm.
2. Récupérer deepflow (Download ZIP puis double-clic pour extraire, ou `git clone`).
3. Double-cliquer sur **`deepflow.command`**. Si macOS refuse (« développeur non identifié ») :
   clic droit sur le fichier → **Ouvrir** → **Ouvrir**, une seule fois. Si le fichier n'est pas
   exécutable (cas d'un ZIP), dans le Terminal : `chmod +x deepflow.command`.
4. Même fonctionnement qu'à Windows : laisser la fenêtre du Terminal ouverte.

### Mettre à jour

Remplacer le dossier par la nouvelle version (en gardant `data/` si on veut conserver le cache
d'historique), ou `git pull`. Au lancement suivant, le lanceur reconstruit l'interface si besoin.
Dessins, mises en page et journal restent dans le navigateur (exportables depuis le menu Mises
en page et le panneau Journal) ; les alertes sont dans `data/`.

### Pour développer

```bash
nvm use
npm install --prefix web
npm run dev
```

| Commande | Rôle |
|---|---|
| `npm run launch` | Lanceur (ce que font `deepflow.cmd` et `deepflow.command`) |
| `npm run dev` | Collecteur + interface en développement |
| `npm run web:build` puis `npm start` | Version optimisée |
| `npm run collector` | Collecteur seul |
| `npm test` | Tests unitaires (flux, bougies, profils, TPO, enchère, footprint, bulles, alertes, historique, dessins, replay, sessions, mises en page) |
| `npm run verify [-- SYMBOL]` | Compare nos calculs aux données officielles Binance de la veille (réseau requis) |

## Interface

- **Barre du haut** : recherche de symbole (ou taper des lettres sur le graphique), intervalles
  favoris et menu complet (secondes, minutes, heures, jours, bougies ticks, volume, range, delta,
  renko), style (bougies, creuses, barres, Heikin Ashi, volume, ligne, aire, baseline, escalier,
  colonnes, haut-bas, Line break, Kagi, Point & Figure, TPO), footprint (6 modes), Indicateurs,
  Alerte, mises en page, grille de graphiques, Replay, réglages, plein écran. Ces réglages
  s'appliquent au graphique actif (voir Espace de travail).
- **Indicateurs** (menu sur deux colonnes) : flux d'ordres (heatmap, bulles de trades, gros prints,
  liquidations, bid/ask, divergences CVD, open interest par prix), alertes de prix, vue Market
  Profile (TPO), profils et niveaux (profil de session, value area de la veille, ouverture du jour,
  initial balance et type d'ouverture, niveaux clés, sessions Asie / Londres / New York, repères
  horaires, POC non testés, VWAP), panneaux (volume, delta, CVD de session, CVD spot / perp, CVD
  multi-plateformes, open interest, liquidations, prime et financement, statistiques).
- **Légende** : une ligne par indicateur actif avec sa valeur courante (VWAP, POC et value area,
  liquidations longues / courtes en vue, seuil des gros prints, état de l'enchère…) ; au survol,
  réglages et retrait. Les réglages sont mémorisés dans le navigateur.
- **Panneaux** : au survol, valeurs de la bougie sous le curseur (volume, achats, ventes ; delta et
  % du volume ; CVD ; open interest en contrats et en dollars avec sa variation ; liquidations
  longues et courtes) et ligne horizontale avec la valeur du panneau à cette hauteur.
- **Graphique** : historique défilable à l'infini, zoom à la molette ou par les commandes du bas
  (visibles quand la souris s'en approche), compte à rebours de clôture.
- **Dessins** (barre à gauche, à la TradingView ; raccourci Alt + lettre, les lettres seules
  ouvrant la recherche de symbole) : ligne de tendance (T), horizontale (H), rayon horizontal (J),
  verticale (V), rectangle (R), retracement de Fibonacci (F, zone 0,5 – 0,618 colorée), note (N),
  règle (M : écart en prix et en %, bougies, durée), position longue (L) ou courte (S), VWAP
  ancré (A) et Volume Profile à plage fixe (P).
  - Tracé en deux clics ou en glissant ; Échap annule, Suppr efface le dessin sélectionné, la gomme
    efface tous ceux du symbole. Clic pour sélectionner, glisser pour déplacer, poignées pour
    étirer ; double-clic sur une note pour la modifier.
  - Barre flottante du dessin sélectionné : couleur, épaisseur (taille du texte d'une note), trait
    plein, en tirets ou en pointillés ; le dernier style de chaque outil est repris.
  - Aimant (bouton de la barre) : les points se collent à l'ouverture, au plus haut, au plus bas ou
    à la clôture de la bougie la plus proche (à moins de 30 px).
  - Dessins accrochés à une heure et un prix : ils restent en place au zoom, au défilement et au
    changement d'unité de temps ; sauvegardés dans le navigateur par marché et par symbole. Dans
    les vues sans échelle de temps continue (TPO, Kagi, P&F, Line break), seules les horizontales
    restent affichées.
  - Position : stop et cible par défaut (rapport gain / risque de 2), à déplacer par les poignées ;
    affiche le R:R, la taille de position pour perdre le pourcentage choisi du capital au stop,
    frais compris (1 % de 1 000 $ et 0,05 % de frais par ordre par défaut ; 0,1 % en spot), la
    valeur, le levier implicite et les montants nets au stop et à la cible ; signale une cible dont
    le gain ne couvre pas les frais. Calcul affiché seulement : aucun ordre n'est passé.
  - VWAP ancré : depuis le début de la bougie cliquée jusqu'au direct, valeur courante sur l'axe ;
    signalé « historique incomplet » si l'ancre précède les bougies chargées.
  - Profil à plage fixe : histogramme du volume par prix, POC et value area (70 %) de la plage,
    calculés par le collecteur à partir de chaque trade ; 3 jours au plus (au-delà, les 3 derniers).
- **Bulles de trades** (cercles, à la Bookmap / DeepCharts) : une bulle par créneau de temps
  (environ 8 px, choisi pour tomber dans une seule bougie), placée au VWAP du créneau ; taille
  rapportée à la moyenne des créneaux visibles (échelle racine, linéaire ou logarithmique) ; couleur
  achats / ventes (camembert), delta ou volume seul ; filtre par rapport à la moyenne.
- **Gros prints** (carrés, à la ATAS / DeepCharts) : fills d'un même ordre agresseur regroupés
  (même heure, même côté), au prix moyen de l'ordre ; seuil automatique (0,5 % des ordres les plus
  gros), selon l'actif (50 k $ sur BTC, 25 k $ ailleurs, à calibrer) ou en montant (25 k $ à
  1 M $) ; nombre affiché et étiquettes réglables.
- **Liquidations** (losanges, à la Exocharts / Kiyotaka) : au prix moyen d'exécution, regroupées par
  bougie et par côté (cascades) ou une par liquidation ; montant minimum en dollars.
- **Footprint** (menu Footprint, modes d'ATAS / LuxAlgo / Exocharts) : bid × ask, échelle bid × ask,
  delta, volume, trades, volume + delta, profil bid / ask, profil delta. Cases en déséquilibre
  diagonal encadrées (ratio 150 à 400 %, 300 % par défaut ; une case face à zéro est ignorée par
  défaut, comme Flowsurface), déséquilibres empilés (2 à 5 niveaux) en zones prolongées jusqu'au
  retest, enchères inachevées (acheteurs et vendeurs sur l'extrême) prolongées jusqu'au retour du
  prix, badges A (absorption : agression massive encaissée à l'extrême) et E (épuisement :
  agression quasi nulle à l'extrême), bougie à gauche ou au centre entre bid et ask, delta sous
  chaque bougie, lignes regroupées automatiquement au dézoom.
- **Profil de volume** : par jour UTC, par semaine (depuis lundi), sur la plage visible (épinglé à
  droite, comme le « visible range » de TradingView) ou composite des 5 / 10 derniers jours ; lignes
  de 0,05 % ou 0,1 % du prix (ou celles du footprint) ; type volume, achats / ventes ou delta ;
  value area en zone et lignes ; POC et value area en développement (en escalier) ; HVN et LVN
  (profil lissé, extrêmes locaux suffisamment marqués) et forme du profil (D, P, b, double
  distribution) dans la légende.
- **Value area de la veille** : VAH, VAL et POC de la session précédente prolongés sur la journée,
  avec l'état de l'enchère dans la légende (dans la valeur, sortie, retour, acceptation ou rejet
  après 2 clôtures de 30 min) et l'extrême de la sortie en cours.
- **Ouverture du jour** : premier prix de la session UTC, en pointillés depuis 00:00, et sa
  position dans la légende (au-dessus, dans ou sous la valeur de la veille).
- **Initial balance (IB) et ouverture** : plus haut et plus bas de la première heure de la session
  UTC, extensions à 1,5 × et 2 × (option 3 ×) en tirets ; dans la légende, le type d'ouverture de
  Dalton lu sur l'IB : Open-Drive (départ sans retour sur l'ouverture, conviction forte),
  Open-Test-Drive (petit test d'un côté puis départ de l'autre), Open-Rejection-Reverse (départ
  rejeté, retour au-delà de l'ouverture), Open-Auction (rotation, pas de direction). Règle
  simplifiée : lecture indicative.
- **Niveaux clés** : ouvertures de la semaine (lundi) et du mois, plus haut et plus bas de la
  veille, de la semaine et du mois précédents (bougies journalières Binance), chacun depuis le
  début de la période où il sert.
- **Sessions Asie / Londres / New York** : zone du plus haut au plus bas de chaque session, heures
  de bureau locales (Tokyo 9 h – 18 h, Londres et New York 8 h – 17 h, heures d'été comprises ; du
  lundi au vendredi), plus haut et plus bas prolongés jusqu'à minuit UTC ; intervalle d'1 h au plus.
- **Repères horaires** : traits verticaux à l'ouverture de New York (9 h 30 là-bas : 13 h 30 UTC
  en heure d'été américaine, 14 h 30 en hiver ; du lundi au vendredi, jours fériés non gérés) et aux
  heures de financement des perpétuels (0 h, 8 h, 16 h UTC) ; délai avant les prochains dans la
  légende. Les heures de l'axe du temps sont en heure locale, la session reste en UTC.
- **CVD** : remis à zéro à chaque session UTC ; divergences prix / CVD entre deux sommets ou deux
  creux de la même session ; panneau CVD spot / perp (klines spot du même actif) pour distinguer
  une hausse portée par l'achat réel d'une hausse portée par les seuls dérivés ; panneau CVD
  multi-plateformes (Binance, Bybit, OKX sur le même perpétuel, chacun à son échelle) pour voir si
  un mouvement est suivi par tout le marché. Bybit et OKX : en direct seulement, depuis le
  lancement du collecteur (rien en replay).
- **VWAP** : du jour, de la semaine (depuis lundi) ou du mois UTC, bandes à ±1, ±2 et ±3 écarts-types.
- **Open interest par prix** : profil à droite du tracé, positions ouvertes (vert) et fermées
  (rouge) par niveau de prix sur la plage visible ; dans la légende, la lecture prix / OI de la
  dernière heure : nouveaux longs (prix ↑, OI ↑), nouveaux shorts (prix ↓, OI ↑), rachats de shorts
  (prix ↑, OI ↓), sorties de longs (prix ↓, OI ↓).
- **Prime et financement** (panneau, futures) : indice de prime (écart du perpétuel à l'indice spot)
  et taux de financement payés, avec leur équivalent annuel ; positifs, les longs paient les shorts.
- **POC non testés** : POC des 7 dernières sessions UTC qu'aucun prix ultérieur n'a retouché (étendue
  complète des sessions suivantes et direct), indépendants du profil affiché ; trait jusqu'au bord
  droit, ou étiquette fléchée en haut / en bas quand le niveau est hors de l'échelle de prix.
- **Vue TPO** : une colonne par session UTC, une lettre par sous-période (30 min, 15 min ou 1 h ;
  A à X puis a à x), lettres, blocs ou vue éclatée (chaque période dans sa colonne), couleurs selon
  la value area ou par période ; lignes regroupées selon le zoom. POC et value area (70 %) au
  nombre de TPO, POC le plus proche du centre en cas d'égalité ; initial balance (première heure)
  en barre orange, simples impressions en trait bleu prolongées jusqu'au retest, poor high / poor
  low (au moins deux TPO à l'extrême), ouverture et clôture en triangles, profil de volume à
  droite, POC / VAH / VAL de la session en cours et POC non testés prolongés.
- **Panneau Statistiques** : tableau par bougie (delta, volume, delta %, achats, ventes, trades),
  fond d'intensité relative à la vue, valeurs dès que la colonne est assez large.
- **Rail à droite** : Flux (déséquilibre du carnet, z-score du delta, VWAP, seuil des gros prints,
  murs actifs), DOM, Trades, Marchés, Alertes, Journal, Apprendre (deux panneaux empilés au plus).
- **Barre d'état** : plages 1J, 5J, 1M, 3M, 1A, état de l'historique, heure UTC.

## Espace de travail

- **Grilles** (bouton à côté de Replay) : 1 graphique, 2 côte à côte, 2 l'un sous l'autre, 1 grand
  et 2 petits, ou 4. Chaque graphique a son symbole (spot ou futures), son intervalle, ses
  indicateurs et ses dessins ; un clic le rend actif (liseré bleu) : barre du haut, barre d'état,
  panneaux du rail et outils de dessin agissent sur lui. Les graphiques retirés d'une grille sont
  gardés pour un retour à une grille plus grande.
- **Plusieurs symboles en direct** : le collecteur suit chaque symbole affiché (8 au plus), et
  arrête ceux qui ne sont plus regardés depuis 3 minutes (sauf alerte active sur le symbole).
- **Liens par couleur** (pastille en haut à droite de chaque graphique) : les graphiques d'une même
  couleur partagent le symbole, l'intervalle, ou les deux (choix dans le même menu). Exemple : deux
  graphiques bleus en 5 min et 1 h sur le même symbole, qui changent de symbole ensemble.
- **Réticule synchronisé** : l'heure sous la souris est tracée (trait pointillé vertical) sur les
  autres graphiques, y compris ceux des fenêtres détachées.
- **Fenêtres détachables** (menu de la pastille, « Ouvrir dans une nouvelle fenêtre ») : copie du
  graphique dans une fenêtre à part, à poser sur un autre écran ; elle a sa propre grille, garde
  son lien de couleur avec la fenêtre principale, et les dessins d'un même symbole sont partagés.
- **Mises en page et modèles d'indicateurs** (bouton signet) : enregistrer la mise en page
  (grille, graphiques, liens, panneaux) ou les indicateurs du graphique actif (type de graphique,
  footprint, indicateurs et leurs réglages, panneaux) sous un nom, et les rappeler en un clic ; un
  modèle s'applique à n'importe quel symbole et intervalle. **Exporter** crée un fichier `.json`
  (mises en page, modèles et dessins de tous les symboles) ; **Importer** l'ajoute à l'existant
  (sauvegarde, autre ordinateur, partage entre amis).

Tout est mémorisé dans le navigateur (`localStorage`) : rien n'est envoyé ailleurs.

## Apprendre et progresser

- **Panneau Apprendre** (rail à droite) : une fiche par indicateur, panneau, mode du footprint et
  outil : ce que c'est, comment le lire, les pièges, et son statut (donnée mesurée, règle
  empirique non prouvée, ou repère de contexte), plus une routine d'analyse pas à pas. Recherche
  sans accents ; le bouton « ? » d'une ligne de légende ou d'un panneau ouvre directement sa fiche.
  Le menu Footprint décrit chaque mode.
- **Journal de trading** (rail à droite) : noter un trade (symbole, sens, entrée, stop, cible,
  sortie, setup, notes) en reprenant l'outil position sélectionné, avec une capture du graphique
  actif ; résultat en R (multiples du risque pris au stop), statistiques (taux de réussite, R moyen
  par trade, total, facteur de profit) et export CSV. Gardé dans le navigateur (IndexedDB).
- **Replay** : voir ci-dessous ; idéal pour s'entraîner et remplir le journal sans risque.

## Replay (entraînement)

Bouton **Replay** de la barre du haut : symbole, jour passé (jusqu'à hier), heure de départ en UTC
et vitesse. Le collecteur rejoue chaque trade de la journée (archives Binance Vision, téléchargées
une fois puis gardées dans `data/cache`) comme s'il arrivait en direct : bougies, footprint, CVD,
bulles, gros prints, profils, value area de la veille et état de l'enchère, panneau Flux et repères
se construisent sous les yeux, sans rien laisser voir de la suite (toutes les requêtes s'arrêtent à
l'heure rejouée).

- Départ en pause ; commandes dans la barre d'état : lecture / pause, vitesse ×1, ×5, ×20, ×60 ou
  ×300, « 1 bougie » (jusqu'à la clôture de la bougie en cours), « 1 h », « Direct » (fin du replay).
  La journée suivante est enchaînée à minuit, jusqu'à hier.
- Le replay s'affiche dans le graphique actif ; les autres graphiques restent en direct. Un seul
  replay à la fois ; les alertes ne sont évaluées que sur le direct.
- Dessins du replay séparés de ceux du direct.
- Indisponible en replay : carnet d'ordres (heatmap, DOM), que Binance n'archive pas ;
  liquidations, sauf les jours où le collecteur tournait.

## Historique

- Bougies temps sans footprint : klines Binance, depuis la cotation de la paire.
- Footprint, bougies d'activité, profils, bulles : trades agrégés des archives quotidiennes
  Binance Vision (cache dans `data/cache`) et, pour le jour en cours, rattrapage REST.
- Heatmap : mémoire du collecteur (4 h par défaut) ; au-delà, seul `RECORD=1` conserve le carnet.
- Profils et TPO : sessions des jours terminés mises en cache ; un jour d'archive absent est
  téléchargé en arrière-plan et apparaît au rafraîchissement suivant (15 s).
- Liquidations (futures) : flux `forceOrder` enregistré par le collecteur depuis son premier
  lancement (`data/liquidations-*.ndjson`) ; pas d'historique antérieur côté Binance.

## Spécificités crypto (futures USD-M)

- Session = jour UTC (00:00 → 24:00), comme la bougie journalière de Binance ; marché ouvert en
  continu, donc 48 périodes TPO par session et initial balance de 00:00 à 01:00 UTC.
- Prix de marque et financement (`markPrice@1s`) dans la barre d'état.
- VWAP ancré au début du jour, de la semaine ou du mois UTC : les sommes antérieures à la première
  bougie chargée viennent des klines 1 h puis 1 min (volume en cotation / volume = VWAP exact) ;
  les bandes ignorent la dispersion à l'intérieur de chaque kline (un peu plus étroites).
- Open interest : historique Binance (`openInterestHist`), 30 derniers jours, période adaptée à
  l'intervalle des bougies (5 min au minimum).
- `npm run verify` contrôle sur la veille : bougies 1 min, volume et volume acheteur, trades REST
  vs archive, volume du profil, TPO, bulles (VWAP et volume acheteur), VWAP ancré, carnet local vs
  instantané.

## Feuille de route

1. **Suites possibles** : graphique de replay plus fin (ticks), plus de plateformes pour le CVD,
   historique Bybit / OKX, notes du journal reliées aux dessins.

Le moteur de signaux automatiques (stratégie « Value Area de la veille », limites de risque,
backtest) a été retiré de l'application et archivé sur la branche `archive/moteur-strategie`.

## Configuration (variables d'environnement du collecteur)

| Variable | Défaut | Rôle |
|---|---|---|
| `MARKET` | `futures` | Marché du symbole par défaut : `futures` (USD-M) ou `spot` |
| `SYMBOL` | `BTCUSDT` | Symbole par défaut (premier graphique ; chaque graphique choisit le sien) |
| `BUCKET` / `FP_BUCKET` | auto | Tranches de la heatmap et du footprint (sinon selon le prix) |
| `HEAT_HOURS` | `4` | Profondeur de la heatmap en mémoire |
| `RECORD` | désactivé | `1` : enregistre le carnet dans `data/*.ndjson.gz` |
| `REPLAY`, `SPEED` | — , `1` | Rejouer un enregistrement du carnet (`RECORD=1`) ; pour les trades seuls, le bouton Replay suffit |
| `VENUES` | activé | `0` : pas de connexion à Bybit et OKX (CVD multi-plateformes) |
| `COLLECTOR_PORT` | `8787` | Port du collecteur (l'interface est sur 3000) |

## Limites connues

- Binance ne publie pas de flux ordre par ordre : pas de détection d'icebergs fiable.
- Un aggTrade porte l'heure de son premier fill : environ 0,01 % du volume tombe dans la minute
  voisine par rapport aux klines Binance (écart visible sur quelques bougies et bulles).
- Binance n'envoie qu'une liquidation par seconde et par symbole (la plus récente) : les
  liquidations affichées sont un échantillon, pas le total.
- CVD Bybit et OKX : en mémoire du collecteur (3 jours), perdus à son arrêt ; paires USDT
  seulement, et seulement si le perpétuel existe sur la plateforme.
- Nombre de trades : les klines comptent les trades individuels, nos bougies construites depuis les
  trades comptent les aggTrades (un ordre agresseur regroupé) ; les deux ne sont pas comparables.

Logo : profil de volume stylisé, le POC (niveau le plus échangé) en orange ; fichiers dans `assets/`
(icône, version simplifiée, monochrome, logo + nom) et favicon dans `web/app/icon.svg`.

Icônes : Hugeicons (jeu gratuit, licence MIT).
