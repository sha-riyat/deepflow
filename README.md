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
| `web/` | Interface (port 3000) : barre d'outils, graphique, panneaux, recherche de symbole | Next.js 16, React 19, TypeScript, Hugeicons, Inter |
| `web/lib/` | Moteur de graphique Canvas 2D + WebGL2 (heatmap), piloté hors de React | JavaScript ES |

Next.js relaie `/api` et `/stream` vers le collecteur : le navigateur ne parle qu'à `localhost:3000`.

## Lancer

Node.js 22.4 ou plus récent.

```bash
nvm use
npm install --prefix web
npm run dev
```

Ouvrir http://localhost:3000. Chacun installe deepflow sur son ordinateur (rien à héberger, aucun
compte) ; l'historique est téléchargé depuis Binance au fil de l'utilisation (dossier `data/`).

| Commande | Rôle |
|---|---|
| `npm run dev` | Collecteur + interface en développement |
| `npm run web:build` puis `npm start` | Version optimisée |
| `npm run collector` | Collecteur seul |
| `npm test` | Tests unitaires (flux, bougies, profils, TPO, enchère, footprint, bulles, alertes, historique) |
| `npm run verify [-- SYMBOL]` | Compare nos calculs aux données officielles Binance de la veille (réseau requis) |

## Interface

- **Barre du haut** : recherche de symbole (ou taper des lettres sur le graphique), intervalles
  favoris et menu complet (secondes, minutes, heures, jours, bougies ticks, volume, range, delta,
  renko), style (bougies, creuses, barres, Heikin Ashi, volume, ligne, aire, baseline, escalier,
  colonnes, haut-bas, Line break, Kagi, Point & Figure, TPO), footprint (6 modes), Indicateurs,
  Alerte, réglages, plein écran.
- **Indicateurs** (menu sur deux colonnes) : flux d'ordres (heatmap, bulles de trades, gros prints,
  liquidations, bid/ask, divergences CVD), alertes de prix, vue Market Profile (TPO), profils et niveaux
  (profil de session, value area de la veille, POC non testés, VWAP), panneaux
  (volume, delta, CVD de session, CVD spot / perp, open interest, liquidations).
- **Légende** : une ligne par indicateur actif avec sa valeur courante (VWAP, POC et value area,
  liquidations longues / courtes en vue, seuil des gros prints, état de l'enchère…) ; au survol,
  réglages et retrait. Les réglages sont mémorisés dans le navigateur.
- **Panneaux** : au survol, valeurs de la bougie sous le curseur (volume, achats, ventes ; delta et
  % du volume ; CVD ; open interest en contrats et en dollars avec sa variation ; liquidations
  longues et courtes) et ligne horizontale avec la valeur du panneau à cette hauteur.
- **Graphique** : historique défilable à l'infini, zoom à la molette ou par les commandes du bas
  (visibles quand la souris s'en approche), compte à rebours de clôture.
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
- **CVD** : remis à zéro à chaque session UTC ; divergences prix / CVD entre deux sommets ou deux
  creux de la même session ; panneau CVD spot / perp (klines spot du même actif) pour distinguer
  une hausse portée par l'achat réel d'une hausse portée par les seuls dérivés.
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
  murs actifs), DOM, Trades, Marchés, Alertes (deux panneaux empilés au plus).
- **Barre d'état** : plages 1J, 5J, 1M, 3M, 1A, état de l'historique, heure UTC.

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
- VWAP du jour ancré à 00:00 UTC : les sommes antérieures à la première bougie chargée viennent des
  klines 1 min (volume en cotation / volume = VWAP exact), quelle que soit la profondeur chargée.
- Open interest : historique Binance (`openInterestHist`), 30 derniers jours, période adaptée à
  l'intervalle des bougies (5 min au minimum).
- `npm run verify` contrôle sur la veille : bougies 1 min, volume et volume acheteur, trades REST
  vs archive, volume du profil, TPO, bulles (VWAP et volume acheteur), VWAP ancré, carnet local vs
  instantané.

## Feuille de route

1. **Outils de dessin** : lignes, horizontales, rayons, rectangles, Fibonacci, texte, règle de
   mesure, outil position longue / courte (stop, cible, rapport gain / risque), Volume Profile à
   plage fixe tracé à la souris, VWAP ancré au clic ; dessins sauvegardés par symbole, aimant sur
   les prix.
2. **Espace de travail** : grilles de 1, 2 ou 4 graphiques, fenêtres détachables (plusieurs
   écrans), symbole et intervalle liés ou indépendants, réticule synchronisé, plusieurs symboles en
   direct (spot et futures), mises en page et modèles d'indicateurs sauvegardés.
3. **Indicateurs complémentaires** : bandes du VWAP, ouvertures du jour / de la semaine / du mois,
   ranges des sessions Asie / Londres / New York, historique du financement et de la prime perp /
   spot, CVD et volume agrégés sur plusieurs plateformes gratuites (Bybit, OKX).
4. **Apprentissage** : explication de chaque indicateur dans l'interface, mode replay (rejouer une
   journée passée bougie par bougie pour s'entraîner).

Le moteur de signaux automatiques (stratégie « Value Area de la veille », limites de risque,
backtest) a été retiré de l'application et archivé sur la branche `archive/moteur-strategie`.

## Configuration (variables d'environnement du collecteur)

| Variable | Défaut | Rôle |
|---|---|---|
| `MARKET` | `futures` | `futures` (USD-M) ou `spot` |
| `SYMBOL` | `BTCUSDT` | Symbole au démarrage (modifiable dans l'interface) |
| `BUCKET` / `FP_BUCKET` | auto | Tranches de la heatmap et du footprint (sinon selon le prix) |
| `HEAT_HOURS` | `4` | Profondeur de la heatmap en mémoire |
| `RECORD` | désactivé | `1` : enregistre le carnet dans `data/*.ndjson.gz` |
| `REPLAY`, `SPEED` | — , `1` | Rejouer un enregistrement |
| `COLLECTOR_PORT` | `8787` | Port du collecteur (l'interface est sur 3000) |

## Limites connues

- Binance ne publie pas de flux ordre par ordre : pas de détection d'icebergs fiable.
- Un aggTrade porte l'heure de son premier fill : environ 0,01 % du volume tombe dans la minute
  voisine par rapport aux klines Binance (écart visible sur quelques bougies et bulles).
- Binance n'envoie qu'une liquidation par seconde et par symbole (la plus récente) : les
  liquidations affichées sont un échantillon, pas le total.
- Nombre de trades : les klines comptent les trades individuels, nos bougies construites depuis les
  trades comptent les aggTrades (un ordre agresseur regroupé) ; les deux ne sont pas comparables.

Logo : profil de volume stylisé, le POC (niveau le plus échangé) en orange ; fichiers dans `assets/`
(icône, version simplifiée, monochrome, logo + nom) et favicon dans `web/app/icon.svg`.

Icônes : Hugeicons (jeu gratuit, licence MIT).
