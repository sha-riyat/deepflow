# 00 — The Only Orderflow Guide You'll Ever Need

- Lien : https://www.youtube.com/watch?v=Pz8f0wWW12M
- Durée : 41:04 — chaîne Fabervaale ENG — présentateur : Fabio Valentini (Fabervaale)
- Transcription : ../transcriptions/Pz8f0wWW12M.txt (anglais), ../transcriptions/Pz8f0wWW12M.fr.vtt (traduction automatique)
- Images : planches YouTube 320 × 180 vérifiées (06:07–07:56, 37:05–40:47)

## 1. Résumé

Cours complet d'order flow, du mécanisme du carnet jusqu'à la méthode d'exécution de l'auteur :
- deux forces : agressives (ordres au marché) et passives (ordres limites) ;
- comment le prix bouge (consommation des niveaux, glissement) ;
- lecture effort / résultat (absorption, initiative, balayage, épuisement) ;
- delta, profil delta ;
- Volume Profile et théorie des enchères pour le biais ;
- vue « Deep Trades » de DeepCharts pour l'exécution.

## 2. Contenu détaillé (horodaté)

- **01:07–03:22 Mécanique.** Ordre au marché de 25 contrats face à 33 contrats passifs au meilleur ask 101 : il en reste 8, le prix monte. Le footprint enregistre les exécutions : bid (vendeurs agressifs) à gauche, ask (acheteurs agressifs) à droite.
- **03:22–05:04 Liquidité insuffisante.** 75 contrats au marché : 8 au 101, puis 102, puis 103. Glissement de 3 ticks.
- **05:04–06:10 Résumé.**
  - Ordres limites : autorité sur le prix, certitude du prix, incertitude d'exécution.
  - Ordres au marché : autorité et certitude d'exécution, incertitude du prix.
- **06:10–09:36 En direct sur DeepCharts** (footprint et DOM, vérifié à l'image : footprint bid × ask coloré, DOM avec histogramme des volumes exécutés récents au bord droit).
  - Vendeurs agressifs à 6 841, case jaune de 53 contrats : niveau de contrôle des vendeurs.
  - Carnet plus épais au-dessus : 28 et 33 contre 10.
  - **« Chemin de moindre résistance »** : le côté où le carnet est le plus mince.
  - Range de Londres entre le niveau de contrôle des vendeurs (6 841,5) et celui des acheteurs (6 840).
- **10:12–11:22 Pression contre résistance.** Le rôle des agresseurs est de créer la pression, celui des passifs de créer la résistance. Exemple : un bloc de 122 contrats contre 273 contrats dans le carnet, le côté de 122 se perce plus facilement.
- **11:22–14:12 Effort / résultat.**
  - **Absorption** : gros effort acheteur en haut, aucun résultat, bougie qui clôture en baisse. Delta probablement positif mais clôture négative.
  - **Agression / initiative** : effort important et récompensé, clôture pleine.
  - **Balayage du carnet** : peu d'effort, gros résultat, car il n'y a pas de vendeurs limites dans la zone.
- **14:12–15:52 Delta.**
  - Horizontal : profil delta du footprint (« delta footprint profile »), exemple d'absorption avec un delta très vendeur et une bougie qui clôture en hausse.
  - Vertical : delta par bougie, absorption en consolidation, continuation.
- **15:52–17:00 Initiative.** Agression acheteuse constante, déséquilibres d'un seul côté (« one side print »), delta fort et clôture haussière, volume au-dessus de la moyenne. Signal pour un trader de tendance.
- **17:00–19:10 Absorption au milieu de la bougie et épuisement.**
  - Épuisement : volume décroissant pendant que le prix monte, déséquilibre contraire au sommet, puis retour à la valeur.
  - Assèchement du volume en vertical.
- **19:10–22:31 Volume Profile.** Distribution « gaussienne », value area à 68 % (il dit 68 %), POC, LVN. Sortie de la value area = début de tendance. Les LVN sont des zones de rééquilibrage avant de reprendre la direction.
- **22:31–28:40 Théorie des enchères et structure.**
  - Le prix revient rééquilibrer les LVN.
  - La VAH devient un point de rejet.
  - Continuation : glissement de la VAH à la VAL.
  - **« Hook »** : enchère ratée aux bords.
  - **Forme P** : acheteurs agressifs, clôture haute, journée directionnelle le lendemain.
  - Fausse cassure de la VAH.
  - Prime / décote par rapport à la value area.
- **28:40–36:55 Méthode de cadrage par profils** (Nasdaq, profil de la séance cash uniquement, du 20 novembre à deux mois plus tard).
  - Chaque jour, couleur du biais : vert (haussier), orange (alerte, possible changement), bleu (indécision).
  - **Fusion des profils** de jours qui se chevauchent : profil de deux ou trois jours pour une VAL plus précise.
  - Formes P et double distribution.
  - Zones de rejet grisées sous la VAL.
  - Une série de tests de la VAH donne autant de shorts.
- **36:55–40:47 Exécution, vue « Deep Trades ».**
  - Filtre ne montrant que les gros ordres exécutés. À l'image : bougies vertes et violettes, cercles verts (gros acheteurs) et violets (gros vendeurs) placés au prix exact, taille proportionnelle, zone qualifiée en jaune.
  - Absorption confirmée par plusieurs gros ordres au même prix : 72 + 61 + 60 + 62 ≈ 300 contrats.
  - Mise au point mort 3 min plus tard.
  - Long : 105 puis 101 contrats absorbés au même niveau à plusieurs reprises.
  - Stop au point mort à la cassure, cible 1:2 à 1:5.
  - Stop suiveur (« momentum model ») à chaque nouvelle impulsion.
  - À l'image à 39:54 : outil position (zone verte et rouge).

## 3. Règles à retenir

1. **Biais** par le Volume Profile (acceptation de la valeur, forme, VAH/VAL, LVN), sur la séance cash.
2. **Zone qualifiée** : bord de value area, LVN, zone de rejet.
3. **Confirmation par le flux sur la zone** : absorption (gros ordres répétés au même prix sans résultat) ou initiative.
4. **Entrée et gestion** : point mort dès que le marché confirme, suivi du stop sur les impulsions.

## 4. Évaluation critique

- **Pédagogie** : solide sur la mécanique du carnet et l'effort / résultat.
- **Value area à 68 %** : il parle d'une distribution gaussienne. C'est inexact, la convention est 70 % et le calcul part du POC.
- **Exemples** : choisis après coup, sans statistique.
- **Promotion** : forte, pour DeepCharts et Telegram.
- **Contradiction** avec le direct de 3 h 34, où il dit ne jamais regarder les ordres limites.

## 5. Transposition à Binance

Tout est transposable : côté agresseur exact dans les aggTrades, carnet en profondeur (heatmap), profils.

Il n'y a pas de séance cash. Pour le crypto, on prend le jour UTC, ou un profil de séance New York à créer.

## 6. Manques pour deepflow (repris dans PLAN.md)

- Fusion de profils de plusieurs jours choisis (composite à la carte).
- Profil de la séance New York seule.
- Couleur de biais par jour.
- Gros trades sommés par niveau dans la bougie (Deep Trades).
- « Chemin de moindre résistance » : comparer la profondeur au-dessus et en dessous du prix.
- Stop suiveur dans l'outil position.

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/00-Pz8f0wWW12M/ (nom du fichier = heure de la première image).
- Images clés : ../references/00-deep-trades-fenetre-de-reglages.jpg, ../references/00-deep-trades-gros-ordres-par-prix.jpg, ../references/00-footprint-et-dom-deepcharts.jpg, ../references/00-outil-position.jpg
