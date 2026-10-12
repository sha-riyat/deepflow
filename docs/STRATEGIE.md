# Stratégie deepflow : les étapes à suivre

Objectif : 1 à 3 trades par jour, dans une fenêtre de 60 à 90 min, puis graphiques fermés.
Setup de départ : le **break-in** (étape 6). Notation : « nom exact dans l'application », ▸ = chemin pour le trouver.

**Pour trader, suivre la fiche du jour** : [lundi](strategie/lundi.md), [mardi](strategie/mardi.md),
[mercredi](strategie/mercredi.md), [jeudi](strategie/jeudi.md), [vendredi](strategie/vendredi.md). Ce document-ci
explique le pourquoi de chaque règle.

---

## Étape 0 — Préparer l'écran (une seule fois)

1. Barre du haut ▸ icône « Grille de graphiques » ▸ **2 graphiques**. Graphique de gauche en **1h**, graphique de droite
   en **5m** (boutons d'intervalle de la barre du haut).
2. Barre du haut ▸ « Indicateurs », **allumer** :
   - colonne *Profils et niveaux* : « Profil de session », « Value area de la veille », « Ouverture du jour »,
     « Range d'ouverture (ORB) », « Niveaux clés », « POC non testés », « VWAP » ;
   - colonne *Flux d'ordres* : « Gros prints » ;
   - colonne *Sessions et horaires* : « Mes heures de trading », « Repères horaires » ;
   - *Panneaux sous le graphique* : « Delta », « CVD (session) », « Statistiques ».
3. « Indicateurs », **éteindre** : « Heatmap de liquidité », « Bulles de trades », « Liquidations », « Bid / ask »,
   « OI par prix », « Divergences CVD ».
4. Régler (légende en haut à gauche du graphique ▸ bouton « Réglages » de la ligne) :
   - « Profil de session » : « Période » = « Jour UTC », « HVN / LVN » = « Affichés » ;
   - « Range d'ouverture (ORB) » : « Ouverture » = « New York », « Durée du range » = « 15 min » ;
   - « VWAP » : « Période » = « Jour UTC » ;
   - « Mes heures de trading » : « De » / « À » = ta fenêtre, en heure de ton ordinateur ;
   - « Gros prints » : « Seuil par session » = « Ajusté », puis « Seuil » réglé pour voir quelques bulles par heure.
5. Graphique 5m ▸ menu « Footprint » ▸ **« Bid × Ask »** (visible en zoomant sur les bougies).
6. Barre de gauche ▸ « Position longue » : dans la barre flottante, régler « Capital », « Risque » (en %) et « Frais ».
7. Panneau « Journal » ▸ « Budget du jour » : « Limite de perte » = 3 R.
8. Barre du haut ▸ icône « Mises en page et modèles d'indicateurs » ▸ **Enregistrer** la mise en page.

---

## Selon le jour et l'heure : ce qui compte

Certains niveaux viennent de naître ou reposent sur des journées creuses : ils pèsent moins. Avant l'étape 1,
regarder quel jour on est et quelle heure il est (UTC), puis lire les étapes avec ces tableaux en tête.

### Le jour de la semaine

| Jour | « J-1 » est | Ce qui compte | Ce qui compte moins |
|---|---|---|---|
| **Lundi** | dimanche | « Haut S-1 » / « Bas S-1 » (semaine précédente) ; la value area de **vendredi** (profil à côté de la bougie de vendredi, étape 1a) ; « Ouv. M » | « Haut J-1 », « Bas J-1 », « VAH / VAL / POC J-1 » (dimanche, peu d'échanges) ; « Ouv. S » (née à 00:00 UTC, c'est l'ouverture de la bougie du jour) ; profil « Semaine » (vide) ; nPOC de samedi et dimanche |
| **Mardi** | lundi | « J-1 » redevient fiable ; « Haut S-1 » / « Bas S-1 » ; « Ouv. S » commence à compter | La forme du profil « Semaine » (1 jour de données) |
| **Mercredi, jeudi** | la veille | Tout : profil « Semaine » et sa forme lisibles, « Ouv. S » pleinement valable | — |
| **Vendredi** | jeudi | Tout ; le profil « Semaine » est le plus complet ; la place du prix face à « Ouv. S » décide la couleur de la bougie de la semaine | — |
| **Samedi, dimanche** | la veille | — | Pas d'ouverture de New York, donc **pas de fenêtre de cette stratégie** : pas de trade (s'entraîner en « Replay ») ; l'ORB New York affiché est celui de vendredi ; peu d'échanges |

### Le moment du mois

| Moment | Ce qui compte | Ce qui compte moins |
|---|---|---|
| **1er au 3 du mois** | « Haut M-1 » / « Bas M-1 » (mois précédent) | « Ouv. M » (vient de naître, même remarque que « Ouv. S » le lundi) |
| **Reste du mois** | « Ouv. M » : prix au-dessus = acheteurs du mois gagnants, en dessous = vendeurs gagnants | — |
| **Derniers jours du mois** | « Ouv. M » décide la couleur de la bougie du mois : le prix est souvent disputé autour | — |

Un lundi qui est aussi le 1er du mois : « Ouv. S » et « Ouv. M » sont le même prix, sans valeur de repère ce jour-là.

### L'heure de l'analyse (UTC)

| Tu analyses | Fiable | Pas encore fiable |
|---|---|---|
| **00:00 à l'ouverture de Londres** (vers 7 h – 8 h) | Étape 1 (jours terminés) ; niveaux d'hier (étape 2) | Profil du jour (presque vide) ; légende de « Value area de la veille » (peu de clôtures de 30 min) ; l'ORB affiché est **celui d'hier** (le lundi : de vendredi) |
| **Londres jusqu'à l'ouverture de New York** | Étapes 1 et 2 ; l'état de l'étape 4 commence à compter | L'ORB New York affiché est encore celui d'hier : ses étiquettes partent de la veille |
| **15 premières minutes de New York** | — | ORB « en formation » : **rien** |
| **Ta fenêtre de 60 à 90 min** | Tout | — |
| **Après ta fenêtre** | Relire le journal (étape 11) | **Pas de trade** |

**Changements d'heure** : l'ouverture de New York passe de 13 h 30 UTC (heure d'été américaine) à 14 h 30 UTC
(hiver). Les États-Unis et l'Europe ne changent pas d'heure le même week-end : ces semaines-là (mars, fin octobre),
vérifier que « Mes heures de trading » couvre bien l'ouverture (trait « NY » des « Repères horaires »).

**Jours fériés américains** : le trait « NY » s'affiche quand même, mais Wall Street est fermée : moins de volume à
l'ouverture, ORB peu fiable. Vérifier le calendrier.

---

## Étape 1 — Le fond · graphique **1J** · 5 min

**But** : savoir si le marché monte, baisse ou tourne en rond, et repérer les niveaux qui comptent. Cette étape
donne un **biais** (le sens à privilégier), jamais une entrée.

### 1a. « Profil de session » · « Période » = « Jour UTC »

**Où lire** : sur le graphique, le profil à droite de chaque bougie journalière : cadre de la value area (VAH en
haut, VAL en bas), trait orange = POC.

**Lire** : les cadres des 3 à 5 derniers jours, l'un par rapport à l'autre.

| Tu vois | Ça veut dire | Tu cherches |
|---|---|---|
| Cadres de plus en plus **hauts**, qui se recouvrent peu | Biais haussier | Surtout des achats |
| Cadres de plus en plus **bas**, qui se recouvrent peu | Biais baissier | Surtout des ventes |
| Cadres à la **même hauteur**, qui se recouvrent | Équilibre, rotation | Les deux bords de la zone commune |

### 1b. « Période » = « Composite 5 j »

**Où lire** : légende, ligne « Profil de session » : « Composite 5 j · POC … · VA …–… · forme … ».

**Lire** : la **forme**, puis la place du prix par rapport à « VA ».

| La légende dit | Ça veut dire | Tu cherches |
|---|---|---|
| « forme D (équilibre) » | 5 jours de range | Acheter près de la VAL, vendre près de la VAH du composite |
| « forme P (rachat de shorts) » | La hausse s'essouffle, le volume est en haut | Des ventes en priorité ; des achats seulement si le prix tient au-dessus de la VAH |
| « forme b (liquidation de longs) » | La baisse s'essouffle, le volume est en bas | Des achats en priorité ; des ventes seulement si le prix tient sous la VAL |
| « forme double distribution (tendance) » | Deux zones séparées par un creux de volume (LVN) | Le sens de la dernière zone ; le creux est traversé vite, on n'y entre pas |

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de la VAH du composite | Les acheteurs ont la main |
| Dans la VA du composite | Rotation : les bords comptent plus que le sens |
| Sous la VAL du composite | Les vendeurs ont la main |

Tout se lit en **1J**, sans descendre en 5m. **Le prix** = l'étiquette en couleur sur l'axe de droite. Dans la
légende, « VA 60 950–61 300 » se lit : VAL = 60 950 (bas), VAH = 61 300 (haut). Prix à moins de 0,2 % d'un bord : le
compter « dans la VA » ; la sortie se confirme à l'étape 4 (2 clôtures de 30 min).

### 1c. « Période » = « Semaine »

**Où lire** : légende : « Semaine · POC … · VA …–… · forme … ».

**Lire** : la place du prix par rapport à la VA de la semaine (même tableau et même lecture que 1b, en 1J) et le POC de la semaine, qui
attire souvent le prix. Lundi et mardi, la semaine a trop peu de données : ignorer sa forme.

### 1d. « POC non testés »

**Où lire** : légende : « 3 · le plus proche 61 125 » ; graphique : pointillés orange « nPOC 61 125 · 10/10 »
(prix et jour de la séance).

**Lire** : les nPOC les plus proches du prix. Le prix revient souvent les toucher.

| Le nPOC est | Ça sert de |
|---|---|
| Au-dessus du prix | Cible possible pour un achat, frein pour la hausse |
| Sous le prix | Cible possible pour une vente, frein pour la baisse |

Un nPOC n'est **pas** une entrée : c'est une cible ou un endroit où le prix peut réagir. Les nPOC de samedi et
dimanche, journées creuses, comptent moins que ceux de la semaine (la date est dans l'étiquette).

### 1e. « Niveaux clés »

**Où lire** : graphique, étiquettes à droite : « Ouv. S » et « Ouv. M » (ouvertures de la semaine et du mois,
tirets), « Haut J-1 » / « Bas J-1 » (veille, gris), « Haut S-1 » / « Bas S-1 » (semaine précédente, violet),
« Haut M-1 » / « Bas M-1 » (mois précédent, orange). Légende : « Ouv. S … · Ouv. M … · J-1 bas – haut ».

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de « Ouv. S » **et** de « Ouv. M » | Acheteurs de la semaine et du mois gagnants : biais haussier renforcé |
| Sous les deux | Vendeurs gagnants : biais baissier renforcé |
| Entre les deux | Pas d'accord : biais neutre |

| Sur un haut ou un bas précédent, le prix | Ça veut dire |
|---|---|
| Passe au-delà puis revient en deçà | Balayage : les stops placés derrière ont été pris, piège possible dans l'autre sens |
| Reste au-delà (au moins 2 clôtures de 30 min) | Cassure acceptée : le mouvement continue |

Les 2 clôtures de 30 min ne se voient pas sur la bougie 1J : passer en **30m** (ou 5m) pour les compter.

Deux niveaux à moins de 0,2 % l'un de l'autre (souvent « Ouv. S » et « Ouv. M ») forment **une seule zone**.

**Le lundi** : « Ouv. S » est l'ouverture de la bougie du jour (elle vient de naître : peu de poids) et « J-1 » est
dimanche (peu d'échanges : niveaux faibles). Lire plutôt « Haut S-1 » / « Bas S-1 » ; s'ils ne sont pas à l'écran,
ils sont plus loin : dézoomer l'échelle des prix. Voir « Selon le jour et l'heure ».

**Exemple (un lundi)** : « Ouv. S » 83 723, « Ouv. M » 83 577, « Haut J-1 » 84 180, « Bas J-1 » 82 751, prix 82 438.
- Prix sous « Ouv. S » et « Ouv. M » : biais baissier. Les deux ouvertures forment la zone 83 577 – 83 723.
- La mèche a dépassé « Haut J-1 » puis le prix est retombé : balayage du haut.
- Prix sous « Bas J-1 » : à confirmer en 30m. 2 clôtures dessous = cassure acceptée ; retour au-dessus = balayage du
  bas, remontée possible vers la zone des ouvertures.
- Ligne à écrire : « Biais baissier. Niveaux : Bas J-1 82 751, zone 83 577 – 83 723, Haut J-1 84 180 (balayé). »

### Conclusion de l'étape 1

Écrire une ligne : **biais** (haussier, baissier ou neutre) + les **3 niveaux** les plus proches du prix.

- 1a, 1b et 1e disent la même chose : biais net, on privilégie ce sens.
- Ils se contredisent : biais neutre, on ne joue que les bords des zones.

Remettre ensuite « Période » = « Jour UTC ».

---

## Étape 2 — Les niveaux et le plan · graphique **1h** · 5 min

**But** : savoir où le prix peut réagir aujourd'hui et écrire quoi faire dans chaque cas, avant que ça arrive.

### 2a. « Value area de la veille »

**Où lire** : graphique, étiquettes « VAH J-1 … », « POC J-1 … » (orange), « VAL J-1 … » prolongées sur la journée.

| Le prix est | Ça veut dire | Tu surveilles |
|---|---|---|
| Dans la value area d'hier | Le marché accepte encore les prix d'hier | Les deux bords : VAH J-1 et VAL J-1 |
| Au-dessus de « VAH J-1 » | Le marché cherche plus haut | Un retour sur la VAH J-1 (le bord devient support) |
| Sous « VAL J-1 » | Le marché cherche plus bas | Un retour sur la VAL J-1 (le bord devient résistance) |

Le « POC J-1 » est le prix le plus échangé hier : le prix y ralentit souvent, c'est une cible naturelle depuis un bord.

**Le lundi**, « VAH / POC / VAL J-1 » sont ceux de dimanche (peu d'échanges) : leur préférer la value area de
vendredi, lue sur le graphique 1J (étape 1a), et « Haut S-1 » / « Bas S-1 ».

### 2b. « VWAP » · « Période » = « Jour UTC »

**Où lire** : légende, ligne « VWAP » (sa valeur) ; graphique, la ligne et ses bandes (±1σ, ±2σ).

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus du VWAP | Les acheteurs du jour gagnent en moyenne : avantage aux achats |
| Sous le VWAP | Les vendeurs du jour gagnent en moyenne : avantage aux ventes |
| Sur la bande ±2σ | Prix étiré : retour vers le VWAP fréquent en équilibre, mais **ne pas** vendre la bande +2σ en tendance |

### 2c. Les niveaux proches

**Lire** : tous les niveaux à **moins d'1 %** du prix :

- « VAH J-1 », « POC J-1 », « VAL J-1 » (2a) ;
- « Haut J-1 », « Bas J-1 » (« Niveaux clés », étape 1e) ;
- « nPOC … » (« POC non testés », étape 1d) ;
- « LVN … » du « Profil de session » (creux de volume : le prix les traverse vite ou y rebondit) ;
- le VWAP (2b).

Deux niveaux très proches (moins de 0,2 % d'écart) = une seule **zone**, plus solide.

### 2d. Le plan · panneau « Journal » ▸ « Fiche de la semaine »

Remplir les trois cases avec des **prix** :

| Case | Exemple de contenu |
|---|---|
| « Scénario haussier : que doit-il se passer ? » | « Acceptation au-dessus de VAH J-1 (61 300), retest tenu → achats, cible Haut J-1 (62 000) » |
| « Scénario baissier : que doit-il se passer ? » | « Sortie sous VAL J-1 (60 100) acceptée → ventes au retest, cible nPOC 59 500 » |
| « Scénario neutre (range) : où ? » | « Entre VAL J-1 et VAH J-1 : break-in aux bords, cible l'autre bord » |

Le scénario qui va **dans le sens du biais de l'étape 1** est le scénario principal ; les autres sont des plans B.

### 2e. Les alertes · panneau « Alertes » ▸ « Nouvelle alerte » ▸ « Prix franchi »

Une alerte sur la « VAH J-1 », une sur la « VAL J-1 ». Tu n'as plus besoin de regarder l'écran en continu : l'alerte
te dit quand le prix arrive sur un bord.

### Conclusion de l'étape 2

Tu as : la liste des niveaux proches, un scénario principal et deux plans B, deux alertes posées.

---

## Étape 3 — L'ouverture · **15 min** puis graphique **5m**

**But** : savoir quel genre de journée s'annonce, et ne pas trader le bruit du début.

### 3a. « Repères horaires » et « Mes heures de trading »

**Où lire** : légende, « NY dans … » (compte à rebours) ; graphique, trait vertical « NY » ; légende de « Mes heures de
trading » : « … · dans vos heures » ou « … · hors de vos heures » (graphique grisé).

« hors de vos heures » = **pas de trade**.

### 3b. « Range d'ouverture (ORB) » · New York, 15 min

**Où lire** : légende « New York 15 min : … » ; graphique, « ORB haut » et « ORB bas » (puis « ORB milieu »,
« ORB ×1,5 », « ORB ×2 »).

| La légende dit | Ça veut dire | Tu fais |
|---|---|---|
| « en formation jusqu'à 13:45 UTC » (étiquettes « (en cours) ») | Le range n'est pas fini | **Rien** : pas de trade |
| « … · ouvert à 13:30 UTC » **avant** l'heure d'ouverture du jour | C'est le range d'**hier** (le lundi et le week-end : de vendredi) | L'ignorer jusqu'à l'ouverture |
| « 61 000 – 61 400 · ouvert à 13:30 UTC » | Le range est fini | Tu peux lire la suite |

| Après le range, le prix | Ça veut dire |
|---|---|
| Sort une **première** fois | Première poussée : souvent reprise. **Pas de trade**, attendre la seconde |
| Sort, revient dans le range, puis ressort du même côté avec delta et volume | Seconde poussée : le camp qui sort prend la main |
| Sort puis rentre et file vers l'autre bord | Cassure ratée : cible « ORB milieu » puis l'autre bord |
| Range très étroit | Énergie accumulée : la sortie peut être vive |
| Range très large (plus que la moitié du range d'hier) | Le mouvement du jour est peut-être déjà fait : prudence |

### 3c. « Ouverture du jour »

**Où lire** : légende : « 60 005 · dans la valeur de la veille · NY 61 200 : au-dessus du range de la veille ». Le
premier prix est l'ouverture de 00:00 UTC, la partie « NY … » est l'ouverture de New York : **lis d'abord la partie
NY**, c'est celle de ta fenêtre.

| La légende dit | Ça veut dire | Tu cherches |
|---|---|---|
| « dans la valeur de la veille » | Journée de rotation plus probable | Les bords de la valeur (break-in) |
| « dans le range de la veille, au-dessus de la valeur » | Le marché doit d'abord se faire accepter au-dessus de la VAH | Acceptation (étape 4) ou retour dans la valeur |
| « dans le range de la veille, sous la valeur » | Miroir : acceptation sous la VAL ou retour dedans | Idem, en miroir |
| « au-dessus du range de la veille » | Déséquilibre net vers le haut | La continuation : achats au retest |
| « sous le range de la veille » | Déséquilibre net vers le bas | La continuation : ventes au retest |

### Conclusion de l'étape 3

Tu sais si la journée part en **rotation** (ouverture dans la valeur) ou en **déséquilibre** (ouverture hors du
range), et tu attends la fin du range et la seconde poussée.

---

## Étape 4 — L'état du marché · légende, clôtures de **30 min**

**But** : savoir si le prix tourne dans la valeur d'hier (équilibre) ou s'il en sort pour de bon (déséquilibre). C'est
ce qui choisit le setup.

**Où lire** : légende de « Value area de la veille » (mise à jour à chaque clôture de 30 min) ; graphique, étiquette
« extrême de la sortie … » pendant une sortie.

| La légende dit | État | Setup à chercher (étape 6) |
|---|---|---|
| « dans la valeur de la veille » | Équilibre | Break-in ou enchère ratée aux bords |
| « sortie au-dessus de la VAH en cours (1/2) » / « sortie sous la VAL en cours (1/2) » | Sortie pas encore confirmée | **Attendre** la 2e clôture de 30 min |
| « acceptation au-dessus de la VAH (2 × 30 min) » / « acceptation sous la VAL (2 × 30 min) » | Déséquilibre accepté | Cassure puis retest, dans le sens de la sortie |
| « retour dans la valeur en cours (1/2) » | Retour pas encore confirmé | **Attendre** la 2e clôture de 30 min |
| « rejet par le haut, retour dans la valeur (2 × 30 min) » / « rejet par le bas, … » | Sortie refusée | Break-in vers l'autre bord de la valeur |

L'« extrême de la sortie » est le point le plus loin atteint dehors : c'est là que va le **stop** d'un break-in.

**Fin de la légende** : comment la valeur du jour (en construction) se place face à celle d'hier.

| La légende finit par | Ça veut dire |
|---|---|
| « valeur plus haute (en cours) » | La valeur migre vers le haut : tendance haussière |
| « valeur plus basse (en cours) » | La valeur migre vers le bas : tendance baissière |
| « valeur qui chevauche en haut » / « en bas » | Hésitation, légère pente dans ce sens |
| « valeur intérieure (en cours) » | Équilibre, journée de range |
| « valeur extérieure (en cours) » | L'intérêt s'élargit des deux côtés : journée agitée |

### Conclusion de l'étape 4

Un mot : **équilibre** (break-in, enchère ratée) ou **déséquilibre** (cassure, retournement). Pas encore confirmé
(« 1/2 ») : on attend.

---

## Étape 5 — Le lieu · graphique **5m**

**But** : ne trader que là où d'autres traders regardent aussi. **On ne trade que sur un de ces niveaux** :

| Niveau | Outil | Où le lire |
|---|---|---|
| VAH ou VAL d'hier | « Value area de la veille » | Étiquettes « VAH J-1 », « VAL J-1 » |
| Creux de volume (LVN) | « Profil de session », « HVN / LVN » = « Affichés » | Étiquettes « LVN … » |
| POC non testé | « POC non testés » | Étiquettes « nPOC … » |
| Haut ou bas d'hier | « Niveaux clés » | Étiquettes « Haut J-1 », « Bas J-1 » |
| VWAP du jour | « VWAP » | La ligne, valeur dans la légende |
| Haut ou bas du range d'ouverture | « Range d'ouverture (ORB) » | Étiquettes « ORB haut », « ORB bas » |

| Le prix est | Tu fais |
|---|---|
| Sur un niveau (il le touche, ou en est à moins d'une bougie 5m moyenne) | Étape 6 : chercher le setup |
| Sur une **zone** de deux niveaux proches (étape 2c) | Étape 6, lieu de meilleure qualité |
| Sur un HVN (pic de volume) ou au milieu de la value area, loin de tout niveau | **Pas de trade** : le prix y tourne sans direction |

---

## Étape 6 — Le setup · graphique **5m**

**But** : une suite précise d'événements, avec entrée, stop, cible et invalidation connus **avant** d'entrer.

| Setup | Conditions, dans l'ordre | Entrée | Stop | Cible | Invalidé si |
|---|---|---|---|---|---|
| **Break-in** (à apprendre en premier) | 1. Le prix sort sous la VAL (ou au-dessus de la VAH). 2. Une bougie **clôture de nouveau dans la value area**. 3. Le prix revient tester la VAL (le **retest**) | Au retest | Sous l'extrême de la sortie, ou sous le POC | L'autre bord de la value area | Pas de clôture dans la zone, ou pas de retest |
| **Cassure** | 1. Sortie avec force (delta et volume forts). 2. **Deux bougies** clôturent dehors, ou une à très fort volume. 3. Retest du bord cassé | Au retest | De l'autre côté du bord cassé | Prochain niveau (haut / bas d'hier, POC non testé) | La cassure rentre aussitôt dans la zone |
| **Enchère ratée** | 1. Le prix dépasse un bord **avec peu de volume**. 2. Grosse bougie qui rentre dans la zone | À la clôture de rentrée | Au-delà de l'extrême | L'autre bord | La sortie repart avec du volume |
| **Retournement complet** | Après une cassure, l'autre bord de la zone casse avec initiative | Au retest de ce bord | De l'autre côté | Début de l'impulsion | Le prix reprend le bord cassé |

Les setups vendeurs sont le miroir des setups acheteurs (VAH à la place de VAL).

### Le break-in pas à pas (achat sur la VAL)

| Condition | Où la voir |
|---|---|
| 1. Sortie sous la VAL | Bougies 5m sous « VAL J-1 » ; légende « sortie sous la VAL en cours (1/2) » ; étiquette « extrême de la sortie … » |
| 2. Clôture de retour | Une bougie **5m** dont le corps clôture au-dessus de « VAL J-1 » (la légende, elle, ne change qu'à la clôture de 30 min) |
| 3. Retest | Le prix redescend toucher « VAL J-1 » et **ne clôture pas** dessous |
| Stop | Sous l'« extrême de la sortie » (ou sous « POC J-1 » si la sortie est loin) |
| Cible | « VAH J-1 » ; « POC J-1 » comme cible partielle (TP1) |

Une clôture 5m de nouveau sous la VAL après l'entrée = le break-in a échoué : on sort, même avant le stop.

---

## Étape 7 — La confirmation par le flux · graphique **5m** (le **1m** pour vérifier)

**But** : voir que des acteurs défendent vraiment le niveau, au moment du setup. Le niveau dit **où**, le flux dit
**si**.

**Outils et où lire** :

| Outil | Ce que tu lis |
|---|---|
| Menu « Footprint » ▸ « Bid × Ask » | À chaque prix de la bougie : ventes agressives à gauche, achats à droite. Marque **A** (absorption) ou **E** (épuisement) sur un extrême. Delta de la bougie sous elle |
| « Gros prints » | Cercle plein : le prix a suivi le gros ordre. **Anneau creux** : il n'a pas suivi (absorbé). « ×4 » : quatre gros ordres au même prix |
| Panneau « Statistiques » | « Delta % » en couleur pleine au-delà de 10 % ; « Vol. × » en orange à ×2 et plus ; « Gros Δ » : delta des seuls gros ordres |
| Panneau « CVD (session) » | Pente du delta cumulé depuis 00:00 UTC |

| Lecture | Ce qu'on voit sur le niveau | Pour quel setup |
|---|---|---|
| **Absorption** | Gros prints **contre** toi en anneau creux, ou marque **A**, et le prix **ne passe pas** le niveau | Break-in, enchère ratée |
| **Initiative** | « Delta % » en couleur dans ton sens, « Vol. × » orange, clôture pleine, CVD qui suit le prix | Cassure, retournement |
| **Épuisement** | Marque **E** à l'extrême, « Vol. × » qui baisse bougie après bougie | Enchère ratée |
| **Volume du break-in** | « Vol. × » fort à la sortie, faible pendant le retour, fort à la rentrée | Break-in |

| Signal contraire | Ça veut dire |
|---|---|
| « Delta % » fort **contre** toi et le prix avance contre toi | Le niveau cède : pas de trade |
| Prix qui monte avec un CVD qui baisse (ou l'inverse) | Mouvement porté par du passif : méfiance sur une cassure |
| Aucun gros print, « Delta % » gris (sous 10 %) | Personne ne défend le niveau |

Rien de tout ça au niveau : **pas de trade**.

---

## Étape 8 — Poser la position · outil « Position longue » / « Position courte »

1. Barre de gauche ▸ « Position longue » (Alt + L) ou « Position courte » (Alt + S), clic au prix d'entrée sur le 5m.
2. Glisser la poignée du **stop** à l'endroit prévu à l'étape 6.
3. Glisser la poignée de la **cible** sur le niveau prévu à l'étape 6.
4. Roue dentée « Réglages du dessin » ▸ « Note du setup » : **A** (tout est réuni), **B** (il manque un élément
   secondaire, risque × 0,5), **C** (douteux, risque × 0,25).

**Où lire** : le texte affiché à droite de la position, par exemple
« R:R 2,35 · 0,012 BTC (742 $) · levier ×1,5 · risque 1,00 % (note A) · frais … % », et les textes « Cible … » et
« Stop … ».

| Tu lis | Ça veut dire | Tu fais |
|---|---|---|
| « R:R » au moins 2 | Le gain possible vaut au moins deux fois le risque | Continuer |
| « R:R » sous 2 | Pas assez de gain pour le risque | **Pas de trade** (ou une cible plus loin si un niveau le justifie) |
| « 0,012 BTC (742 $) » | La quantité à acheter pour ne perdre que ton risque au stop | C'est la taille de l'ordre |
| « risque 1,00 % (note A) » | Part du capital perdue au stop, selon la note | Vérifier que c'est voulu |
| Dans « Cible … » : « frais trop lourds : cible = … × les frais aller-retour » (orange) | Les frais mangent une grosse part du gain | **Pas de trade** |
| Dans « Cible … » : « les frais mangent le gain » | Le trade perd même à la cible | **Pas de trade** |

---

## Étape 9 — Check-list, puis entrée

Panneau « Apprendre » ▸ onglet « Check-list » : cocher chaque case. **Une case ★ non cochée = pas de trade.**

Les 5 cases ★ :

1. « Le prix est sur un niveau important… » (étape 5) ;
2. « Le flux confirme sur ce niveau : absorption ou initiative » (étape 7) ;
3. « Mon stop est là où l'idée est fausse » (étapes 6 et 8) ;
4. « Rapport gain / risque d'au moins 2, et aucun avertissement orange sur les frais » (étape 8) ;
5. « Ma taille vient du stop… » (étape 8).

Les autres cases règlent la note proposée : **A** si au moins 90 % des cases sont cochées, **B** à partir de 70 %,
sinon **C**. Une case non ★ manquante n'interdit pas le trade, mais baisse la note, donc le risque (étape 8).

Puis passer l'ordre sur Binance avec la quantité affichée par la position.

---

## Étape 10 — Gérer le trade · menu « Stop » de la position

**Où lire** : le texte « Stop … » de la position (« point mort proche · risque restant … » une fois le stop remonté)
et le message affiché sous le menu « Stop ».

| Moment | Action (menu « Stop ») |
|---|---|
| Le prix a avancé d'environ 1 R **et** une nouvelle bougie 5m confirme | « Point mort (frais compris) » |
| Le prix a atteint un niveau intermédiaire (POC J-1, VWAP) | « Verrouiller +0,5 R » ou « Verrouiller +1 R » |
| Le mouvement continue | « Sous la dernière mèche », ou « Sous le dernier gros print » |
| Sortie partielle prévue | Roue dentée ▸ « Part sortie à TP1 » et « TP1 : multiple du risque initial » |

| Message sous le menu | Ça veut dire |
|---|---|
| « Le stop est déjà plus protecteur » | Le stop actuel protège déjà mieux : rien à faire |
| « Aucune bougie fermée depuis l'entrée » | Attendre la clôture d'une bougie |
| « Aucun gros print favorable depuis l'entrée… » | Pas de gros ordre dans ton sens : garder le stop |

**Sortir avant le stop** si le setup est invalidé (étape 6, colonne « Invalidé si »), par exemple une clôture 5m de
nouveau hors de la valeur sur un break-in.

Le stop ne se déplace que vers le gain. Pas de point mort avant une confirmation.

---

## Étape 11 — Après le trade · panneau « Journal »

1. « Noter un trade » ▸ « Reprendre l'outil position sélectionné ».
2. Setup, « Reprendre la note de la check-list », erreurs éventuelles, heures d'entrée et de sortie, « Enregistrer ».
3. « Budget du jour » : si « Limite de perte du jour atteinte (−3 R) : fin de séance. » s'affiche, on ferme.
4. Fermer les graphiques si : 3 trades faits, 2 pertes d'affilée, ou limite de perte atteinte.

**Chaque semaine**, relire le panneau « Journal » :

| Tu lis | Ça veut dire |
|---|---|
| « … R par trade » positif | La méthode gagne en moyenne (l'espérance) |
| « … % gagnants » face à « équilibre à … % » | Au-dessus de l'équilibre : la méthode gagne avec ce payoff |
| Courbe en R qui monte par paliers réguliers | Résultats stables |
| « Par » setup / heure : une ligne nettement négative | Arrêter ce setup ou cette heure |
| « Coût des erreurs » : l'erreur la plus chère | La règle à travailler la semaine suivante |
| « Moins de 5 trades sur certaines lignes : indication seulement. » | Trop peu de trades pour conclure |

Remplir aussi « Bilan de fin de semaine : ce qui s'est vraiment passé » dans la « Fiche de la semaine ».

---

## Pas de trade si

- Hors de ta fenêtre (graphique grisé par « Mes heures de trading »).
- Le week-end (pas d'ouverture de New York, peu d'échanges).
- Avant la fin du range d'ouverture, ou sur la première poussée.
- Prix loin de tout niveau de l'étape 5.
- Pas de confirmation par le flux (étape 7).
- R:R < 2 ou avertissement frais.
- Une case ★ de la check-list non cochée.
- 3 trades faits, 2 pertes d'affilée, ou limite de perte du jour atteinte.

---

## Récapitulatif des réglages

| Élément | Valeur |
|---|---|
| Fond | 1J, « Profil de session » en « Jour UTC », puis « Composite 5 j » et « Semaine » |
| Niveaux et plan | 1h |
| Ouverture | « Range d'ouverture (ORB) » New York, 15 min |
| Lieu, setup, entrée | 5m |
| Vérification du déclencheur | 1m |
| État (acceptation / rejet) | Clôtures de 30 min (légende de « Value area de la veille ») |
| Fenêtre | 60 à 90 min dès l'ouverture de New York (13 h 30 UTC en été américain, 14 h 30 en hiver) |
| R:R minimal | 2 |
| Risque par trade | À régler dans la position (vidéos : 0,25 % ; deepflow par défaut : 1 %) |
| Maximum | 3 trades par jour, arrêt après 2 pertes d'affilée ou −3 R |

---

## Ne pas confondre

| Outil | Ce que c'est | Usage ici |
|---|---|---|
| « Profil de session » (Indicateurs ▸ Profils et niveaux) | Profil de volume calculé automatiquement, réglage « Période » | Tous les jours |
| « Volume Profile à plage fixe » (barre de gauche, Alt + P) | Profil tracé à la main sur un range choisi | Pour le profil d'un range précis |
| « Vue TPO par session » (Indicateurs ▸ Market Profile) | Vue en lettres par 30 min | Non utilisée |
| Panneau « Open interest » | Courbe des positions ouvertes, en bas | Optionnel |
| « OI par prix » (Flux d'ordres) | Positions ouvertes / fermées par prix, sur le graphique | Non utilisé |
| « Ouverture du jour » | Prix de 00:00 UTC et sa position face à hier | Étape 3 |
| « Initial balance et ouverture » | Range de la première heure UTC | Non utilisé |
| « Range d'ouverture (ORB) » | Range des N premières minutes de l'ouverture choisie | Étapes 3 et 5 |
| Panneau « CVD (session) » | Delta cumulé de la séance | Étape 7 |
| « CVD spot / perp », « CVD multi-plateformes » | Comparaisons avancées | Non utilisés |

## Lexique

- **Value area** : zone où s'est fait 70 % du volume. **VAH** = haut, **VAL** = bas. **POC** : prix le plus échangé.
- **LVN** : creux de volume, le prix y passe vite. **HVN** : pic de volume, le prix y ralentit.
- **Delta** : achats agressifs − ventes agressives. **Delta %** : delta / volume de la bougie. **CVD** : delta cumulé.
- **Retest** : retour du prix sur le niveau qu'il vient de franchir.
- **R** : le risque pris au stop. +2 R = gain de deux fois le risque.

Rien de cette stratégie n'est prouvé : à valider en « Replay » sur au moins 30 trades notés avant le réel.
Ce n'est pas un conseil financier.
