# La stratégie deepflow : du graphique à la prise de position

Ce document dit **quoi regarder, dans quel ordre, avec quel outil de deepflow (nommé comme dans l'application) et sur
quelle unité de temps**, pour prendre **1 à 3 trades par jour** puis fermer les graphiques.

Ce n'est pas un conseil financier. deepflow est un outil d'analyse et d'apprentissage : il ne donne aucun signal et ne
passe aucun ordre. C'est toi qui décides.

Comment lire ce document :
- **« Guillemets »** = le nom exact d'un outil dans l'application.
- **▸** = le chemin pour le trouver. Exemple : *Barre du haut ▸ Indicateurs ▸ Profils et niveaux ▸ « Value area de la veille »*.
- **Vient des vidéos** = tiré de l'analyse des 23 vidéos (`docs/analyse-videos/`). **Proposition** = mon adaptation à ton
  cas (crypto, 1 à 3 trades par jour). Rien n'est prouvé : à valider en replay puis dans ton journal.

---

## 1. La stratégie en une page

1. **Le matin, une fois (10 min)** : je regarde où est la « valeur » d'hier (la zone où les échanges se sont faits) et
   quels niveaux sont proches. J'écris mon plan.
2. **Je ne regarde le marché que pendant ma fenêtre** (60 à 90 min, par exemple autour de l'ouverture de New York).
   Le reste du temps, j'ai des alertes et les graphiques sont fermés.
3. **À l'ouverture**, j'attends le range des 15 premières minutes et je ne prends pas la première poussée.
4. Je me demande : **le prix tourne-t-il dans la valeur d'hier, ou en sort-il et y reste-t-il ?**
5. Je ne cherche un trade que **sur un niveau important** (bord de la valeur d'hier, creux de volume, etc.).
6. Sur ce niveau, j'attends une **confirmation par le flux** : absorption (on pousse, rien ne bouge) ou initiative
   (on pousse, ça avance fort, avec du volume).
7. J'écris le **plan avant d'entrer** : stop, cible, rapport gain / risque d'au moins 2, taille calculée à partir du stop.
8. Je coche la **check-list** (panneau « Apprendre » ▸ onglet « Check-list »). Si une case ★ manque, je n'entre pas.
9. Après le trade, je le note dans le **« Journal »**. Maximum 3 trades par jour ; j'arrête à la limite de perte du jour.

**Pour débuter, n'apprends qu'un seul setup : le « break-in » (§ 7).** Les autres viendront après plusieurs dizaines de
trades notés.

---

## 2. Où trouver chaque outil (et ne pas les confondre)

### 2.1 La barre du haut

| Élément | Ce que c'est |
|---|---|
| Boutons **1m, 5m, 15m, 1h, 4h, 1J** | Les intervalles favoris. Le menu à côté (« Tous les intervalles et bougies d'activité ») donne aussi 1s, 5s, 15s, 30s, 3m, 30m, 2h, 6h, 12h, 1S |
| Menu « Type de graphique » | Bougies (par défaut), Bougies creuses, Heikin Ashi, etc. Garde **« Bougies »** |
| Menu **« Footprint »** | Affiche les échanges prix par prix dans la bougie (voir § 2.5) |
| Menu **« Indicateurs »** | Toutes les couches du graphique (voir § 2.2) |
| Bouton **« Alerte »** | Crée une alerte au prix courant (pour un autre prix : panneau « Alertes », § 2.4) |
| Icône **« Mises en page et modèles d'indicateurs »** (marque-page) | Sauvegarder ta mise en page et tes réglages d'indicateurs |
| Icône **« Grille de graphiques »** | 1, 2, 3 ou 4 graphiques côte à côte |
| Bouton **« Replay »** | Rejouer un jour passé pour s'entraîner |

### 2.2 Le menu « Indicateurs » : deux colonnes

**Colonne de gauche**

*« Flux d'ordres »* : « Heatmap de liquidité », « Bulles de trades », **« Gros prints »**, « OI par prix »,
« Liquidations », « Divergences CVD », « Bid / ask ».

*« Panneaux sous le graphique »* : « Volume », « Delta », **« CVD (session) »**, **« Open interest »**, « Liquidations »,
**« Statistiques »**, « CVD spot / perp », « Prime et financement », « CVD multi-plateformes ».

**Colonne de droite**

*« Market Profile »* : « Vue TPO par session ».

*« Profils et niveaux »* : **« Profil de session »**, **« Value area de la veille »**, **« Ouverture du jour »**,
« Initial balance et ouverture », **« Range d'ouverture (ORB) »**, **« Niveaux clés »**, **« POC non testés »**, **« VWAP »**.

*« Sessions et horaires »* : « Sessions Asie / Londres / NY », **« Mes heures de trading »**, « Repères horaires ».

*« Alertes »* : « Alertes de prix ».

**Les réglages d'un indicateur** : dans la **légende** (la liste en haut à gauche du graphique), chaque ligne a trois
petits boutons : « ? » (comprendre l'indicateur), « Réglages » et « Retirer ».

### 2.3 La barre de gauche (outils de dessin) et leur barre flottante

Les outils (raccourci **Alt + lettre**) : « Ligne de tendance » (T), « Ligne horizontale » (H), « Rayon horizontal »
(J), « Ligne verticale » (V), « Rectangle (zone) » (R), « Retracement de Fibonacci » (F), « Texte / note » (N),
« Règle de mesure » (M), **« Position longue » (L)**, **« Position courte » (S)**, « VWAP ancré » (A),
**« Volume Profile à plage fixe » (P)**. Plus le bouton d'**aimant** (coller les points aux prix et aux niveaux).

Quand tu cliques sur une position dessinée, la **barre flottante** en haut du graphique montre « Capital », « Risque »,
« Frais » et le menu **« Stop »** (point mort, verrouiller +0,5 / +1 / +2 R, sous la dernière mèche, sous le dernier gros
print, revenir au stop initial). La **roue dentée « Réglages du dessin »** donne : part sortie à TP1, multiple du risque
(TP1), renforts, taux de financement, **note du setup (A, B, C)**.

### 2.4 Les panneaux de droite (le rail d'icônes)

« Flux », « DOM », « Trades », « Marchés », **« Alertes »**, **« Journal »**, **« Apprendre »**. Deux panneaux au plus
sont ouverts en même temps.

- **« Alertes »** : « Nouvelle alerte », type **« Prix franchi »** + le prix. deepflow doit rester lancé pour te
  prévenir.
- **« Journal »** : « Noter un trade », budget du jour, fiche de la semaine, statistiques.
- **« Apprendre »** : onglet **« Fiches »** (une fiche par outil) et onglet **« Check-list »**.

### 2.5 Le menu « Footprint »

Modes : « Désactivé », **« Bid × Ask »**, « Échelle bid × ask », « Delta », « Volume », « Trades », « Volume + delta »,
« Profil bid / ask », « Profil delta ». Réglages : « Déséquilibre (diagonal) », « Déséquilibres empilés »,
« Enchères inachevées », **« Absorption (A) et épuisement (E) »**, etc. Le footprint n'apparaît que quand tu zoomes assez
(bougies assez larges). **Pour débuter : « Bid × Ask ».**

### 2.6 Les confusions classiques, tranchées

**« Profil » : il y en a trois, pour trois usages différents**

| Nom exact | Où | À quoi ça sert | Quand l'utiliser |
|---|---|---|---|
| **« Profil de session »** | Indicateurs ▸ Profils et niveaux | Le profil de volume affiché **sur le graphique**, calculé automatiquement. Son réglage **« Période »** : « Jour UTC », « Semaine », « Plage visible », « Séances Asie / Londres / NY », « Composite 5 j », « Composite 10 j » | **C'est lui à utiliser tous les jours.** Mets « Période » sur « Jour UTC » pour la forme du jour, « Composite 5 j » ou « 10 j » pour le fond |
| **« Volume Profile à plage fixe »** | Barre de gauche, outil dessin (Alt + P) | Un profil que **tu traces à la souris** sur la plage de ton choix (par exemple un range précis) | Quand tu veux le profil d'un range précis (la méthode PBD le fait sur un range) |
| **« Vue TPO par session »** | Indicateurs ▸ Market Profile | Une autre vue : des **lettres** par période de 30 min au lieu de bougies | Optionnel, pour apprendre le Market Profile. Pas nécessaire pour la stratégie |

Dans le menu « Footprint », « Profil bid / ask » et « Profil delta » sont autre chose : ce sont des profils **dans
chaque bougie**.

**« Open interest » : il y en a deux**

| Nom exact | Où | À quoi ça sert |
|---|---|---|
| **« Open interest »** | Indicateurs ▸ *Panneaux sous le graphique* | Une courbe **en bas du graphique** : le nombre total de positions ouvertes dans le temps. Elle monte ou descend |
| **« OI par prix »** | Indicateurs ▸ *Flux d'ordres* | Un histogramme **sur le graphique** : à quels prix des positions ont été ouvertes ou fermées, avec la lecture prix / OI de la dernière heure |

À utiliser : le panneau **« Open interest »** pour voir la tendance (le marché se charge-t-il en positions ?), et
« OI par prix » seulement quand tu veux voir à quel prix. Les deux sont **optionnels** pour débuter.

**Les « ouvertures » : il y en a trois**

| Nom exact | Ce que ça montre |
|---|---|
| **« Ouverture du jour »** | Une ligne pointillée au premier prix de 00:00 UTC, et dans la légende **où ce prix se situe par rapport à hier** (dans la valeur, dans le range, hors du range) |
| **« Initial balance et ouverture »** | Le range de la **première heure** de la session UTC (« IB »), ses extensions ×1,5 et ×2, et le type d'ouverture (Dalton) dans la légende |
| **« Range d'ouverture (ORB) »** | Le plus haut et le plus bas des **N premières minutes** d'une ouverture que **tu choisis** (réglage « Ouverture » : New York, Londres, 00:00 UTC ; réglage « Durée du range » : 5, 15, 30 ou 60 min). **C'est celui de la stratégie** |

**Les « CVD » : il y en a quatre**

« **CVD (session)** » (panneau) : delta cumulé de la séance, **c'est celui à utiliser**. « Divergences CVD » (calque) :
marque les sommets / creux du prix non confirmés par le CVD. « CVD spot / perp » et « CVD multi-plateformes » (panneaux) :
comparaisons avancées, à ignorer au début.

**La « balance » (la zone de valeur)** : c'est la **« Value area de la veille »** (Indicateurs ▸ Profils et niveaux). Elle
trace le **VAH** (haut), la **VAL** (bas) et le **POC** (prix le plus échangé) d'hier. Sa **légende** donne l'état du
marché (§ 5, étape D).

**Les chiffres sous la bougie (delta %, volume relatif)** : le panneau **« Statistiques »** (tableau par bougie : delta,
volume, delta %, achats, ventes, trades) et, dans le footprint, « Volume + delta ».

---

## 3. Ton écran de départ (à régler une fois)

1. **Deux graphiques** : icône « Grille de graphiques » ▸ 2 graphiques. Graphique 1 en **1h** (le contexte), graphique 2
   en **5m** (l'exécution). **Proposition.** Sauvegarde ensuite avec l'icône « Mises en page et modèles d'indicateurs ».
2. **À allumer** (Indicateurs) : « Value area de la veille », « Ouverture du jour », « Range d'ouverture (ORB) »,
   « Profil de session » (Période : « Jour UTC »), « POC non testés », « Niveaux clés », « VWAP », « Gros prints »,
   « Mes heures de trading » ; panneaux « Delta », « CVD (session) », « Statistiques ».
3. **À éteindre au début** (moins de bruit) : « Heatmap de liquidité », « Bulles de trades », « Liquidations »,
   « Bid / ask », « OI par prix », « Divergences CVD ».
4. **Menu « Footprint »** : « Bid × Ask », réglages par défaut, sur le graphique 5m seulement.
5. **« Mes heures de trading »** : réglage « De » / « À » (**heure de ton ordinateur**) = ta fenêtre d'action.
6. **« Range d'ouverture (ORB) »** : « Ouverture » = New York, « Durée du range » = 15 min.
7. **« Gros prints »** : réglage « Seuil » = « Selon l'actif », puis ajuste pour voir **quelques bulles par heure**, pas des
   dizaines.

---

## 4. Ton rythme : 1 à 3 trades par jour, puis tu fermes tout

**Proposition** (les vidéos font du scalping sur 1 min ; pour 1 à 3 trades, on monte d'une marche).

| Moment | Durée | Intervalle | Ce que tu fais |
|---|---|---|---|
| **Préparation** (une fois, avant ta fenêtre) | 10 min | **1J** puis **1h** | Étapes A et B (§ 5) : valeur d'hier, niveaux, scénarios. Tu poses des **alertes** sur les niveaux |
| **Fenêtre d'action** | 60 à 90 min | **15 min** (le range d'ouverture), **5m** (le lieu et l'entrée) | Étapes C à F. Le **1m** ne sert qu'à vérifier le déclencheur, à l'instant de l'entrée |
| **Fin** | 3 min | — | « Journal » ▸ « Noter un trade », puis tu fermes |

**Quelle fenêtre ?** Le crypto ne ferme jamais, mais la liquidité suit les horaires des grandes places. Au choix :
- **Ouverture de New York** : 13 h 30 UTC en été américain, 14 h 30 UTC en hiver (la légende de « Repères horaires » le
  dit). Fenêtre conseillée : de l'ouverture à +90 min.
- **Ouverture de Londres** : vers 7 h ou 8 h UTC selon l'heure d'été.
- Évite 00:00 UTC et le week-end au début : peu de liquidité, pas d'ouverture de New York ni de Londres.

Convertis en **ton heure locale** : « Mes heures de trading » utilise l'heure de ton ordinateur.

**Garde-fous** (proposition, à régler dans « Journal » ▸ budget du jour) : **3 trades au maximum** par jour ; arrêt après
**2 pertes d'affilée** ou à la **limite de perte du jour** (3 R par défaut) ; pas de trade hors fenêtre.

**Tu ne peux pas surveiller en continu ?** Pose des **« Alertes »** (panneau « Alertes » ▸ « Prix franchi ») sur le VAH,
la VAL et le haut / bas d'hier. Tu ne reviens qu'au signal, dans ta fenêtre.

---

## 5. Les étapes, avec les outils exacts

### A. Le fond (une fois, avant la fenêtre) — intervalle **1J**

- **Où regarder** : « Profil de session » avec « Période » = « Composite 5 j » (puis « Semaine ») ; « POC non testés » ;
  « Niveaux clés » ; panneaux « Prime et financement » et « Open interest » (optionnels).
- **Ce que tu notes** : la **forme** du profil (D : équilibre, le prix tourne ; P : hausse puis zone en haut ; b : baisse
  puis zone en bas) et si les zones de valeur **montent, descendent ou se chevauchent**. La légende de « Profil de
  session » donne la forme.
- **Ce que ça implique** : zones qui montent = biais haussier ; qui descendent = biais baissier ; qui se chevauchent =
  rotation.
- **Ce que ça n'implique pas** : ce n'est pas un signal d'entrée, seulement le côté où tu cherches.

### B. Le plan de séance (avant la fenêtre) — intervalle **1h**

- **Où regarder** : « Value area de la veille » (VAH, VAL, POC d'hier) ; « Niveaux clés » (hauts et bas d'hier, ouvertures
  de semaine et de mois) ; « POC non testés » ; « VWAP » (réglage « Période » : « Jour UTC » ou « Ouverture New York »).
- **Ce que tu fais** : **« Journal » ▸ « Fiche de la semaine »** : trois scénarios (haussier, baissier, neutre) et ce qui
  les contredirait. Tu poses tes **alertes** (« Alertes » ▸ « Prix franchi ») sur les niveaux.

### C. L'ouverture — intervalles **5m** et **15 min**

- **Où regarder** : « Ouverture du jour » (légende), « Range d'ouverture (ORB) » (15 min, New York), « Initial balance
  et ouverture » (une fois la première heure faite).
- **Trois cas pour la position de l'ouverture** (légende de « Ouverture du jour ») :
  1. **Dans la valeur d'hier** : une journée de rotation est plus probable. Tu joues les bords de la valeur.
  2. **Dans le range d'hier mais hors de la valeur** : le marché doit d'abord y être accepté ; surveille le retour dedans.
  3. **Hors du range d'hier** : déséquilibre plus net.
- **Règles des vidéos** : **pas de trade avant l'ouverture** ; **pas la première poussée**, attends la seconde ; la
  direction se clarifie 15 à 30 minutes après.

### D. L'état du marché : équilibre ou déséquilibre — clôtures de **30 min**

- **Où regarder** : la **légende de « Value area de la veille »**. Elle écrit l'état du prix par rapport à la valeur
  d'hier, et la relation entre la valeur d'aujourd'hui et celle d'hier.

| Ce que dit la légende | Ce que ça veut dire | Ta conduite |
|---|---|---|
| Dans la valeur | Le prix tourne entre VAL et VAH | Jouer les **bords** : enchères ratées, break-in |
| Sortie, puis **acceptation** (2 clôtures de 30 min dehors) | Le marché accepte de travailler ailleurs | **Suivre** : cassure et retest |
| Sortie, puis **rejet** (retour dedans, 2 clôtures) | Le marché refuse la sortie | **Break-in** vers l'autre bord de la valeur |

- **Relation de la valeur du jour avec celle d'hier** (« en cours », elle bouge tôt dans la journée) : plus haute ou plus
  basse = la valeur migre, tendance ; chevauche = hésitation ; intérieure = équilibre ; extérieure = l'intérêt s'élargit.
- La « règle des 80 % » (un rejet traverse la valeur jusqu'à l'autre bord) vient des futures classiques : **empirique**, à
  vérifier sur ton journal.

### E. Le lieu : une zone qualifiée — intervalle **5m**

Tu n'agis que sur l'un de ces niveaux (tous visibles avec les outils de l'écran de départ) :

- le **VAH** ou la **VAL** d'hier (« Value area de la veille ») ;
- un **creux de volume (LVN)** : le prix y passe vite. Il se voit avec « Profil de session », réglage « HVN / LVN » =
  « Affichés » ;
- un **« POC non testé »** ;
- le **haut ou le bas d'hier** (« Niveaux clés ») ;
- le **« VWAP »** ou ses bandes ;
- une extension de l'**« Initial balance et ouverture »**.

Pas de trade en plein milieu du range.

### F. La confirmation par le flux — intervalle **1m** (vérification) et **5m**

La confirmation ne se cherche qu'**une fois dans la zone**.

- **Où regarder** : menu **« Footprint »** (« Bid × Ask », marques A et E), calque **« Gros prints »**, panneau
  **« Statistiques »** (delta %, volume), panneau **« CVD (session) »** et « Divergences CVD » (optionnel).

| Lecture | Ce qu'on voit | Ce que ça suggère |
|---|---|---|
| **Absorption** | Gros effort, pas de résultat : gros delta ou gros prints, la bougie ne bouge pas (marque **A** du footprint) | Un passif encaisse : retournement possible |
| **Initiative** | Agression d'un seul côté, delta % fort (en couleur au-delà de 10 %), clôture pleine, volume au-dessus de la moyenne | Celui qui pousse gagne : suivre |
| **Balayage** | Peu d'effort, gros résultat | Peu de liquidité sur le chemin : le prix glisse |
| **Épuisement** | Le volume baisse, un déséquilibre contraire à l'extrême (marque **E**) | La poussée s'arrête |

- **Filtre de volume** pour un retour dans la zone (vient des vidéos) : le volume monte à la sortie, s'assèche, puis
  remonte à la rentrée.
- **Gros prints** : le « Seuil » est en dollars ; « Seuil par session » = « Ajusté » (Asie ×0,5, Londres ×1, New York ×2).
  Les « 30 contrats » des vidéos concernent le contrat ES et ne se transposent pas.
- **Ce que ça n'implique pas** : un delta se lit toujours avec le résultat du prix. Les seuils chiffrés des vidéos sont des
  repères, pas des lois.

---

## 6. Les trois cas que tu rencontreras (résumé)

| Situation (étapes C et D) | Setup à chercher | Ce que tu attends sur le lieu (E) |
|---|---|---|
| Ouverture **dans la valeur**, le prix tourne | **Enchère ratée** aux bords, ou **break-in** | Prix qui dépasse un bord, personne ne suit (peu de volume), retour dans la valeur |
| Le prix **sort** de la valeur d'hier et **y reste** (acceptation) | **Cassure** puis retest | Volume et delta forts à la sortie, retest qui tient |
| Le prix **sort puis revient** dans la valeur (rejet) | **Break-in** vers l'autre bord | Clôture de retour dans la zone, puis retest |

---

## 7. Les setups PBD (vient des vidéos)

Une zone (range) a trois formes : **P** (hausse puis zone en haut), **b** (baisse puis zone en bas), **D** (range sans
direction). Chaque forme donne quatre setups ; les setups b sont le **miroir** des setups P. On trace le profil du range
(« Profil de session » ou « Volume Profile à plage fixe »), on relève VAH, VAL, POC, puis on descend en 5m et 1m.

| Setup | Scénario, étape par étape | Invalidation |
|---|---|---|
| **Break-in** (le plus fiable selon l'auteur, **sans statistique**) | Le prix sort sous la VAL. Une bougie **clôture de nouveau dans la zone**. On attend un **retest**, on achète, on vise l'autre bord de la zone | Pas de clôture dans la zone, ou pas de retest |
| **Cassure** | Sortie **avec force**. On attend **deux bougies** hors de la zone, ou une bougie à fort volume, puis un **retest** | La cassure rentre aussitôt : enchère ratée, on ne la joue pas |
| **Enchère ratée** (moins fiable) | Cassure avec peu d'achats, puis grosse bougie qui rentre dans la zone. Cible : l'autre bord | La cassure repart avec du volume |
| **Retournement complet** | Après une cassure, l'autre bord de la zone casse avec initiative. On suit jusqu'au début de l'impulsion | Le prix reprend le bord cassé |
| **Range (D)** | Vendre les enchères ratées en haut, acheter celles du bas | Une cassure avec force, volume et initiative |

Scénario d'ouverture (ORB) : attendre la cassure du « Range d'ouverture (ORB) » de 15 minutes, puis suivre le sens si le
flux confirme (étape F).

---

## 8. Entrée, stop, cible, taille : avec l'outil « Position longue » / « Position courte »

**Avant d'entrer, tout est écrit.** Dans la barre de gauche, choisis **« Position longue » (Alt + L)** ou **« Position
courte » (Alt + S)** et clique sur le graphique 5m.

- **Entrée** (vient des vidéos) : ordre en attente sur le **retest**, ou ordre limite sur le déséquilibre laissé par la
  cassure. Exige une **clôture de confirmation** (corps plein). Chaque rejet rend la règle plus stricte.
- **Stop** : déplace la poignée du stop **là où l'idée est fausse**. En PBD : sous le POC du range (ou plus prudent, sous
  toute la zone). En scalping : derrière la grosse agression.
- **Cible** : déplace la poignée de la cible sur **l'autre bord de la value area**, ou le POC de l'équilibre précédent, ou
  le haut / bas d'hier.
- **Rapport gain / risque (R:R)** d'au moins **2**, affiché sur la position. Avec 2, un trade sur trois suffit pour ne pas
  perdre (avant frais).
- **Frais** : la position t'avertit en orange si la cible vaut **moins de 3 fois les frais aller-retour**.
- **Taille** : la position affiche la **quantité** à prendre pour ne perdre que ton « Risque » (en % du « Capital ») si le
  stop est touché, frais compris. Tu règles « Capital », « Risque » et « Frais » dans la barre flottante. **Taille calculée
  à partir du stop, jamais l'inverse.**
- **Note du setup** : roue dentée « Réglages du dessin » ▸ **note A, B ou C** (B : moitié du risque ; C : un quart).
- **Risque cité dans les vidéos** : 0,25 % par trade sur un compte personnel, 2 % de perte maximale par jour. La valeur
  par défaut de deepflow est **1 %** : c'est toi qui règles.

---

## 9. La gestion du trade

- **Point mort** (menu **« Stop »** ▸ « Point mort (frais compris) ») : **après une confirmation**, pas avant. Trop tôt, tu
  sors sur le premier retour du prix.
- **Stop suiveur** (menu « Stop » ▸ « Sous la dernière mèche » ou « Sous le dernier gros print »). Pour le dernier gros
  print, le calque « Gros prints » doit être allumé.
- **Sortie partielle** (roue dentée ▸ « Part sortie à TP1 » et « TP1 : multiple du risque initial ») ; le R:R global est
  recalculé.
- Le stop ne va **que vers le gain**.

## 10. Quand tu ne trades pas

- Hors de ta fenêtre (le graphique est grisé par « Mes heures de trading »).
- La cassure rentre aussitôt ; pas de clôture dans la zone suivie d'un retest ; marché trop étendu.
- Une case ★ de la check-list n'est pas cochée.
- Tu as déjà fait 3 trades, ou la limite de perte du jour est atteinte (« Journal » ▸ « Budget du jour »).

## 11. Après le trade

**« Journal » ▸ « Noter un trade »** : « Reprendre l'outil position sélectionné », setup, **note A / B / C** (bouton
« Reprendre la note de la check-list »), erreurs après coup, heures d'entrée et de sortie. Relis le journal chaque semaine
(courbe en R, statistiques par setup et par heure).

## 12. Ce que la stratégie n'implique pas

- Elle ne garantit rien : les taux de réussite et les cibles de 1:3 à 1:5 des vidéos ne sont pas mesurés.
- Elle ne dit pas quoi faire sans contexte : le VWAP, un delta ou un niveau ne sont jamais un signal à eux seuls.
- Elle n'a pas été testée sur Binance : tout reste à valider.
- Ce n'est ni un backtest ni un signal automatique : l'analyse et l'exécution restent manuelles.

## 13. Comment la valider

1. **Replay** (bouton « Replay » de la barre du haut) : rejoue des jours passés et note chaque trade dans le « Journal ».
2. Au moins **30 trades par setup** avant de lui faire confiance.
3. Lis la **courbe en R** et le graphique **taux de réussite × payoff** du « Journal » : au-dessus de la ligne
   d'équilibre, la stratégie gagne (avant frais).
4. Ne passe au réel qu'en **petite taille** ; le filtre **« Tous / Réel / Replay »** du journal garde l'entraînement
   séparé.

## 14. Petit lexique

- **Value area (zone de valeur)** : la zone où s'est fait 70 % du volume. **VAH** = son haut, **VAL** = son bas.
- **POC** : le prix le plus échangé. **POC non testé** : un POC d'une session passée que le prix n'a pas retouché.
- **HVN / LVN** : pics (le prix ralentit) et creux (le prix traverse vite) de volume dans le profil.
- **Delta** : achats agressifs moins ventes agressives. **Delta %** : le delta en % du volume de la bougie.
- **CVD** : delta cumulé dans le temps.
- **Absorption** : on pousse beaucoup, le prix ne bouge pas (un gros ordre passif encaisse). **Initiative** : on pousse, ça
  avance.
- **Enchère ratée** : le prix dépasse un niveau, personne ne suit, il revient.
- **R** : le risque pris au stop. +2 R = tu as gagné deux fois ce que tu risquais.
- **ORB** : opening range breakout, cassure du range des premières minutes après l'ouverture.

## 15. Pour aller plus loin

- Panneau **« Apprendre »** ▸ onglet « Fiches » : une fiche par outil et par méthode (effort et résultat, PBD, routine de
  scalping, espérance, etc.). Les boutons « ? » des légendes y mènent directement.
- Panneau **« Apprendre »** ▸ onglet **« Check-list »** : la routine de ce document, à cocher à la main.
- `docs/analyse-videos/` : l'analyse détaillée des 23 vidéos et le plan d'intégration.
