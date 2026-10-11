# Stratégie d'analyse et de prise de position dans deepflow

Document de référence : de l'analyse de fond jusqu'à la prise de position, avec les règles, les scénarios, ce
qu'ils impliquent ou non, les unités de temps et les outils de deepflow à chaque étape.

Ce n'est pas un conseil financier. deepflow est un outil d'analyse et d'apprentissage : il ne donne aucun signal
et ne passe aucun ordre. C'est toi qui décides.

## 0. Cadre et honnêteté

- **Ce que c'est** : une grille de lecture manuelle, à suivre dans l'ordre, qui s'appuie sur les outils de deepflow.
- **Ce qui vient des vidéos** (analyse de 23 vidéos, voir `docs/analyse-videos/`) : la méthode PBD, la routine de
  scalping, les règles de risque, la lecture effort / résultat.
- **Ce qui est une adaptation** : le passage aux futures crypto (24 h / 24, jour UTC) et le choix de certaines unités
  de temps de deepflow. Ces points sont marqués « proposition ».
- **Rien n'est prouvé** : aucun taux de réussite des vidéos n'est vérifié (exemples choisis après coup, pas de
  statistiques). C'est à toi de les mesurer, en replay puis en petit réel, avec ton journal.

## 1. Vue d'ensemble : on descend de l'échelle de temps

| Étape | Question | Unité de temps | Outils deepflow |
|---|---|---|---|
| A. Biais de fond | Où est la valeur, vers où migre-t-elle ? | **1 J** (semaine, 5 à 10 jours) | Profil (Jour, Semaine, Composite 5 j ou 10 j), POC non testés, Niveaux clés, panneaux Financement et OI |
| B. Plan de séance | Quels scénarios, quels niveaux ? | **1 h / 30 min** | Value area de la veille, ouverture, IB, fiche de la semaine, Mes heures de trading |
| C. Ouverture | Comment la séance démarre-t-elle ? | **5 min** (range d'ouverture : **15 min**) | Range d'ouverture (ORB), type d'ouverture (Dalton), légende de l'ouverture |
| D. État du marché | Équilibre ou déséquilibre ? | **30 min** (clôtures) | État d'acceptation ou de rejet, relation de valeur |
| E. Lieu | Suis-je sur une zone qualifiée ? | **5 min** | Niveaux de la veille, LVN, POC non testés, VWAP et bandes, IB |
| F. Confirmation | Le flux confirme-t-il ici ? | **1 min** (et 5 min) | Footprint, gros prints, delta %, CVD, heatmap |
| G à I. Entrée, plan, gestion | Où entrer, où sortir, quelle taille ? | **1 min** | Outil position, alertes, journal |

Les vidéos descendent du journalier à 5 min puis 1 min. Le filtre d'ouverture est le range des 15 premières minutes.
L'acceptation se compte en périodes de 30 minutes (choix de deepflow).

## 2. Les étapes en détail

### A. Biais de fond (1 J)

- **Outils** : calque Profil en « Semaine » ou « Composite 5 j / 10 j » ; POC non testés ; Niveaux clés ; panneaux
  Financement et OI.
- **Ce que tu relèves** : la forme du profil. D = équilibre, P = hausse puis zone en haut, b = baisse puis zone en bas.
  Tu notes aussi si les zones de valeur montent ou descendent d'un jour à l'autre.
- **Ce que ça implique** : des zones qui montent suggèrent un biais haussier, des zones qui descendent un biais
  baissier, des zones qui se chevauchent une rotation.
- **Ce que ça n'implique pas** : le biais n'est pas un signal d'entrée. Il sert à choisir de quel côté chercher des
  setups.
- **Sur Binance** : pas de séance cash, donc le profil se fait sur le jour UTC, une séance de bureau (Asie, Londres,
  New York) ou une plage tracée.

### B. Plan de séance (1 h / 30 min)

- **Outils** : Value area de la veille (VAH, VAL, POC) ; fiche de la semaine (journal) ; Mes heures de trading.
- Écrire trois scénarios (haussier, baissier, neutre) et ce qui les confirmerait ou les contredirait. Fixer ses
  niveaux. Ne trader que dans sa plage horaire.

### C. Ouverture (5 min, range d'ouverture 15 min)

- **Outils** : légende de « Ouverture du jour » ; range d'ouverture (ORB) ; type d'ouverture de Dalton (visible
  une fois l'IB faite, après 1 h).
- **Trois cas pour la position de l'ouverture** :
  - dans la value area d'hier : une journée de rotation est plus probable ;
  - dans le range d'hier mais hors value area : il faut d'abord que le marché y soit accepté, surveiller le retour
    dedans ;
  - hors du range d'hier : déséquilibre plus net.
- **Règles des vidéos** : pas de trade avant l'ouverture ; ne pas prendre la première poussée, attendre la seconde ;
  la direction se clarifie 15 à 30 minutes après l'ouverture.
- **Sur Binance** : l'ancre du range d'ouverture se choisit (00:00 UTC, Londres, New York). En semaine, New York
  ouvre à 13 h 30 ou 14 h 30 UTC selon l'heure d'été ; le week-end, seul 00:00 UTC existe.

### D. État du marché (30 min)

L'état se lit dans la légende de la value area de la veille :

| État | Ce que ça veut dire | Conduite |
|---|---|---|
| Dans la valeur | Le prix trouve un prix « juste » | Jouer les bords : enchères ratées, break-in |
| Sortie puis acceptation (2 clôtures de 30 min dehors) | Le marché accepte de travailler ailleurs | Suivre : cassure et retest |
| Sortie puis rejet (retour dedans, 2 clôtures) | Le marché refuse la sortie | Break-in vers l'autre bord de la valeur |

- La « règle des 80 % » (un rejet traverse la valeur) vient des futures classiques : empirique, à vérifier sur ton
  journal.
- Relation de la valeur du jour avec celle de la veille : plus haute ou plus basse (la valeur migre, tendance),
  chevauchement (hésitation), intérieure (équilibre), extérieure (l'intérêt s'élargit). Elle est « en cours » : tôt
  dans la journée, elle peut encore changer.

### E. Lieu (5 min)

Une zone qualifiée est l'une de ces choses : un bord de value area, un LVN (creux de volume, le prix y passe vite),
un POC non testé, le haut ou le bas d'hier, le VWAP ou ses bandes, une extension de l'IB. On n'agit pas en plein
milieu du range.

### F. Confirmation (1 min, puis 5 min)

La confirmation ne se cherche qu'une fois dans la zone.

- **Outils** : footprint (déséquilibres, marques A et E, profil delta), gros prints regroupés par prix, delta % et
  volume relatif sous la bougie, CVD en bougies et ses divergences, heatmap pour les murs d'ordres.

| Lecture | Ce qu'on voit | Ce que ça suggère |
|---|---|---|
| Absorption | Gros effort, pas de résultat (delta fort, bougie qui ne bouge pas) | Un passif encaisse : retournement possible |
| Initiative | Agression d'un seul côté, delta fort, clôture pleine, volume au-dessus de la moyenne | Celui qui pousse gagne : suivre |
| Balayage | Peu d'effort, gros résultat | Peu de liquidité sur le chemin : le prix glisse |
| Épuisement | Le volume baisse, un déséquilibre contraire apparaît à l'extrême | La poussée s'arrête |

- **Filtre de volume (PBD)** pour un retour dans la zone : le volume monte à la sortie, s'assèche, puis remonte à la
  rentrée.
- **Gros prints** : le seuil de deepflow est en dollars et s'ajuste par séance (Asie ×0,5, Londres ×1, New York ×2).
  À calibrer pour voir quelques bulles par heure. Les « 30 contrats » des vidéos concernent le contrat ES et ne se
  transposent pas.
- **Ce que ça n'implique pas** : un delta se lit toujours avec le résultat du prix. Les seuils chiffrés des vidéos
  sont des repères, pas des lois.

### G. Les setups PBD et leurs scénarios

Chaque forme (P, b, D) donne quatre setups ; les setups b sont le miroir exact des setups P.

| Setup | Scénario, étape par étape | Invalidation |
|---|---|---|
| Break-in (le plus fiable selon l'auteur, sans statistique) | Le prix sort sous la VAL. Une bougie clôture de nouveau dans la zone. Retest, entrée, cible à l'autre bord. | Pas de clôture dans la zone, ou pas de retest |
| Cassure | Sortie avec force, deux bougies dehors ou une à fort volume, puis retest et entrée. | La cassure rentre aussitôt : enchère ratée, on ne la joue pas |
| Enchère ratée (moins fiable) | Cassure sans participation, puis grosse bougie qui rentre. Cible : l'autre bord. | La cassure repart avec du volume |
| Retournement complet | Après une cassure, l'autre bord de la zone casse avec initiative. | Le prix reprend le bord cassé |
| Range (D) | Vendre les enchères ratées en haut, acheter celles du bas. | Une cassure avec force, volume et initiative |

Scénario d'ouverture (ORB) : attendre la cassure du range des 15 premières minutes, puis suivre le sens si le flux
confirme.

### H. Entrée, stop, cible, taille

- **Entrée** : ordre en attente sur le retest (il peut ne pas être touché), ou ordre limite sur le déséquilibre laissé
  par la cassure. Exiger une clôture de confirmation (corps plein) ; chaque rejet rend la règle plus stricte.
- **Stop** : là où l'idée est fausse. En PBD, sous le POC du range, ou plus prudent sous toute la zone. En scalping,
  derrière la grosse agression.
- **Cible** : l'autre bord de la value area, ou le POC de l'équilibre précédent, ou le haut d'hier.
- **Rapport gain / risque** d'au moins 2, avec une cible d'au moins 3 fois les frais aller-retour (l'outil position
  avertit).
- **Taille** : calculée à partir du stop et du risque choisi, jamais l'inverse. Noter le setup A, B ou C : le risque
  est réduit pour B (moitié) et C (quart).
- **Risque cité dans les vidéos** : 0,25 % par trade sur un compte personnel, 2 % de perte maximale par jour. La
  valeur par défaut de deepflow est 1 % ; c'est toi qui règles.
- **Cas où l'on ne trade pas** : la cassure rentre aussitôt, pas de clôture dans la zone suivie d'un retest, marché
  trop étendu, hors de ses heures, limite de perte du jour atteinte.

### I. Gestion

- **Point mort** après une confirmation, pas avant : trop tôt, on sort sur le premier retour du prix.
- **Stop suiveur** : sous la dernière mèche, ou sous le dernier gros print.
- **Sortie partielle** à TP1 (en R), le reste vers la cible ; le R global est recalculé.
- **Budget du jour** : un setup plus risqué seulement avec les gains du jour, et arrêt à la limite de perte.
- **Après** : journal avec setup, note et erreurs ; relecture chaque semaine.

## 3. Unités de temps : le résumé

| Usage | Unité conseillée |
|---|---|
| Biais et profils de fond | **1 J**, avec Semaine et Composite 5 à 10 jours |
| Value area, IB, séances | **1 h / 30 min** |
| Range d'ouverture | **15 min** (réglable : 5, 15, 30, 60) |
| Acceptation ou rejet | **30 min** (clôtures) |
| Lieu et contexte d'entrée | **5 min** |
| Exécution et confirmation | **1 min** (footprint, gros prints) |

Journalier, 5 min et 1 min viennent des vidéos. Le choix du 30 min pour l'acceptation est celui de deepflow. Le reste
est une proposition à valider.

## 4. Ce que la stratégie n'implique pas

- Elle ne garantit rien : les taux de réussite et les cibles de 1:3 à 1:5 des vidéos ne sont pas mesurés.
- Elle ne dit pas quoi faire sans contexte : le VWAP, un delta ou un niveau ne sont jamais un signal à eux seuls.
- Elle n'a pas été testée sur Binance : tout reste à valider.
- Elle n'est ni un backtest ni un signal automatique : l'analyse et l'exécution restent manuelles.

## 5. Comment la valider

1. Rejouer des jours passés (bouton Replay) et noter chaque trade dans le journal, avec sa note A / B / C et ses
   erreurs.
2. Atteindre au moins 30 trades par setup avant de lui faire confiance.
3. Lire la courbe en R et le graphique taux de réussite contre payoff : au-dessus de la ligne d'équilibre, la
   stratégie gagne (avant frais).
4. Ne passer au réel qu'en petite taille, et garder le replay séparé du réel (filtre Tous / Réel / Replay).

## 6. Pour aller plus loin

- Panneau **Apprendre** : une fiche par étape (effort et résultat, PBD, routine de scalping, espérance…) et la
  **check-list avant trade** qui reprend cette routine en 18 cases à cocher à la main.
- `docs/analyse-videos/` : l'analyse détaillée des 23 vidéos, le plan d'intégration et les images de référence.
