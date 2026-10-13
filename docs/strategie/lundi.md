# Stratégie du lundi

Suis les étapes dans l'ordre. Chaque ligne dit : **quel outil**, **quel réglage**, **ce que tu vois**, **ce que tu lis**, **ce que tu fais**.
Les noms entre « » sont ceux de l'application. Heures en UTC (c'est l'heure de ton axe). Réglages à faire une seule fois : [`00-installation.md`](00-installation.md).

**À vérifier en premier**
- Jour férié américain (Wall Street fermée) : **pas de trade**.
- Du 1er au 3 du mois : ignore « Ouv. M », lis « Haut M-1 » et « Bas M-1 » à la place.
- Semaine de changement d'heure (mars, fin octobre) : vérifie que le trait vertical « NY » tombe dans « Mes heures de trading ».

**Ce qui change le lundi**
- « J-1 » est dimanche (peu d'échanges) : n'utilise **ni** « Value area de la veille » (éteins-la, étape 0), **ni** « Haut J-1 » / « Bas J-1 », **ni** « Ouv. S » (née à 00:00).
- La référence du jour est la zone de valeur de **vendredi**, que tu traces avec « Volume Profile à plage fixe » (étape 0).
- N'utilise pas « Période » = « Semaine » (vide le lundi).
- Avant l'ouverture de New York, l'ORB affiché est celui de vendredi.
- Tu remplis la « Fiche de la semaine ».

---

## Étape 0 — Tracer la zone de valeur de vendredi · avant tout le reste

Pourquoi : « la veille » est dimanche, avec très peu d'échanges. La référence du lundi est **vendredi**. L'indicateur « Profil de session » ne la nomme pas (tirets sans nom) et « Value area de la veille » donnerait dimanche : il faut l'outil de dessin.

1. Menu « Indicateurs » : **éteins** « Value area de la veille » (aujourd'hui seulement).
2. Graphique **1h**. Barre de gauche ▸ **« Volume Profile à plage fixe »** (raccourci Alt + P).
3. Premier clic sur la première bougie 1h de **vendredi** (00:00), second clic sur la dernière bougie 1h de vendredi (23:00). Une bougie d'écart ne change rien.
4. Clique sur le dessin, puis sur la roue dentée « Réglages du dessin » : « Niveaux prolongés vers la droite » = **« Oui »**, « Pics et creux de volume (HVN / LVN) » = « Affichés », « Étiquette de totaux » = « Affichée ».

**Tu vois** : des étiquettes **écrites** à droite : « POC 61 125 », « VAH 61 300 », « VAL 60 950 » ; des « HVN … » et « LVN … » ; sous le dessin une ligne « Volume … · Δ … · forme … » ; et « Depuis la fin de la plage : … » (l'état du prix depuis vendredi soir).
Ce dessin sert toute la journée.

---

## Étape 1 — Le fond · graphique **1J** · 5 minutes

But : un **biais** (haussier, baissier ou neutre) et les niveaux qui comptent.

### 1a. « Profil de session » · « Période » = « Jour UTC »

**Tu vois** : à droite de chaque bougie 1J, un profil (barres grises) et trois traits **sans nom** : trait orange plein = POC ; tiret gris du haut = VAH ; tiret gris du bas = VAL. Aucun nombre n'est écrit ici.
**Tu fais** : compare la hauteur des deux tirets gris de **mercredi, jeudi et vendredi** (ignore samedi et dimanche, trop peu d'échanges).

| Les tirets gris, d'un jour à l'autre | Ça veut dire |
|---|---|
| De plus en plus hauts, qui se recouvrent peu | Biais haussier |
| De plus en plus bas, qui se recouvrent peu | Biais baissier |
| À la même hauteur | Équilibre : jouer les bords |

### 1b. « Profil de session » · « Période » = « Composite 5 j »

**Tu vois** : un seul profil épinglé à droite (les 5 derniers jours finis, ensemble) et trois traits sur toute la largeur, **sans nom**. Les étiquettes « HVN … » et « LVN … » sont écrites.
**Tu lis** : la **légende** (ligne « Profil de session ») : « Composite 5 j · POC 61 125 · VA 60 950–61 300 · forme … » (1er nombre de « VA » = bas, 2e = haut).

| La légende dit | Ça veut dire | Tu cherches |
|---|---|---|
| « forme D (équilibre) » | Le prix tourne dans une zone | Acheter près du bas de « VA », vendre près du haut |
| « forme P (rachat de shorts) » | La hausse s'essouffle : le volume est en haut | Plutôt des ventes ; des achats seulement si le prix reste au-dessus du haut de « VA » |
| « forme b (liquidation de longs) » | La baisse s'essouffle : le volume est en bas | Plutôt des achats ; des ventes seulement si le prix reste sous le bas de « VA » |
| « forme double distribution (tendance) » | Deux zones séparées par un creux de volume | Le sens de la dernière zone ; ne jamais entrer dans le creux |

| Le prix (étiquette de couleur sur l'axe de droite) est | Ça veut dire |
|---|---|
| Au-dessus du 2e nombre de « VA » | Les acheteurs ont la main |
| Entre les deux nombres | Rotation : le prix tourne, joue les bords |
| Sous le 1er nombre de « VA » | Les vendeurs ont la main |

Prix à moins de 0,2 % d'un des deux nombres : compte-le « entre les deux ». La sortie se confirme à l'étape 4.

### 1c. Le profil de vendredi · outil « Volume Profile à plage fixe » (tracé à l'étape 0)

**Tu vois** : « POC … », « VAH … », « VAL … » (étiquettes écrites) et, sous le dessin, « … · forme … ».
**Tu lis** : la « forme » (même tableau que 1b), puis le prix face à ces étiquettes :

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de l'étiquette « VAH » | Les acheteurs ont la main |
| Entre « VAL » et « VAH » | Rotation : le prix tourne, joue les bords |
| Sous l'étiquette « VAL » | Les vendeurs ont la main |

Prix à moins de 0,2 % d'un bord : compte-le « entre les deux ». La sortie se confirme à l'étape 4.

### 1d. « Niveaux clés » · « Afficher » = « Ouvertures et hauts / bas »

**Tu vois** : des étiquettes écrites à droite : « Ouv. M », « Haut S-1 », « Bas S-1 », « Haut M-1 », « Bas M-1 » (et « Ouv. S », « Haut J-1 », « Bas J-1 » : **ignore ces trois-là aujourd'hui**, ils datent de dimanche ou viennent de naître).
**Tu lis** : « Ouv. M » : prix au-dessus = acheteurs du mois gagnants, en dessous = vendeurs gagnants. Puis « Haut S-1 » / « Bas S-1 » (s'ils ne sont pas à l'écran, dézoome l'échelle des prix) :

| Sur ce haut ou ce bas, le prix | Ça veut dire |
|---|---|
| Passe au-delà puis revient en deçà | Balayage : les stops placés derrière ont été pris, piège possible dans l'autre sens |
| Reste au-delà (2 clôtures de 30 min : à compter sur le graphique **30m**) | Cassure acceptée : le mouvement continue |

### 1e. « POC non testés »

**Tu vois** : des pointillés orange « nPOC 61 125 · 10/10 » (prix et jour). Ignore ceux datés du samedi ou du dimanche.
**Tu lis** : les « nPOC » les plus proches du prix. Au-dessus du prix : cible possible d'un achat, frein pour la hausse. Sous le prix : cible possible d'une vente. Pas une entrée.

### 1f. Conclusion : écris une ligne

« Biais **haussier / baissier / neutre**. Niveaux : … , … , … » (les 3 niveaux les plus proches du prix).
Les lectures vont dans le même sens : biais net. Elles se contredisent : biais neutre, tu ne joues que les bords.
Cette étape ne donne **jamais** une entrée.

---

## Étape 2 — Les niveaux du jour · graphique **1h** · 5 minutes

But : lister où le prix peut réagir aujourd'hui. Note les niveaux à **moins d'1 %** du prix. Deux niveaux à moins de 0,2 % l'un de l'autre = une seule **zone** (plus solide).

### 2a. « Volume Profile à plage fixe » (le dessin de vendredi)

**Tu vois** : « POC … », « VAH … », « VAL … », « HVN … », « LVN … » (étiquettes écrites).
**Tu fais** : note ces prix. « POC » = prix le plus échangé vendredi : le prix y ralentit souvent, cible naturelle depuis un bord.

| Le prix est | Ça veut dire | Tu surveilles |
|---|---|---|
| Entre « VAL » et « VAH » | Le marché accepte encore les prix de vendredi | Les deux bords |
| Au-dessus de « VAH » | Le marché cherche plus haut | Un retour sur « VAH » (le bord devient un appui) |
| Sous « VAL » | Le marché cherche plus bas | Un retour sur « VAL » (le bord devient une résistance) |

### 2b. « Niveaux clés » et « POC non testés »

Mêmes étiquettes qu'à l'étape 1 : utilise « Ouv. M », « Haut S-1 », « Bas S-1 », « nPOC … ». Ignore « Ouv. S », « Haut J-1 », « Bas J-1 ».

### 2c. « VWAP » · « Période » = « Jour UTC » · « Bandes » = « ±1σ et ±2σ »

**Tu vois** : une ligne pâle épaisse (le VWAP) et des tirets (±1σ, ±2σ). **Aucun nom n'est écrit.** Lundi tôt, le VWAP est peu fiable (peu d'échanges depuis 00:00).
**Tu lis** : la légende, ligne « VWAP » : son prix.

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus du VWAP | Avantage aux achats |
| Sous le VWAP | Avantage aux ventes |
| Sur un tiret ±2σ | Prix étiré : retour vers le VWAP fréquent en équilibre ; **ne vends pas la bande +2σ en tendance** |

### 2d. Le plan

1. Panneau « Journal » ▸ « Fiche de la semaine » : remplis « Scénario haussier : que doit-il se passer ? », « Scénario baissier : que doit-il se passer ? » et « Scénario neutre (range) : où ? » avec les **prix** de 2a à 2c. Exemple : « Acceptation au-dessus de VAH (61 300), retest tenu : achats, cible Haut S-1. »
2. Panneau « Alertes » ▸ « Nouvelle alerte » ▸ type « Prix franchi » ▸ champ « Prix » : une alerte au prix « VAH », une au prix « VAL » (de vendredi).

---

## Étape 3 — L'ouverture · graphique **5m**

### 3a. « Repères horaires »

**Tu vois** : un trait vertical orange en tirets, écrit « NY » en bas : l'ouverture de la Bourse de New York (13 h 30 UTC en heure d'été américaine, 14 h 30 en hiver).
**Tu fais** : aucun trade avant ce trait.

### 3b. « Mes heures de trading »

**Tu vois** : le graphique grisé en dehors de tes heures. **Tu lis** : la légende : « 13 h – 15 h · dans vos heures » ou « … · hors de vos heures ». Hors de vos heures : pas de trade.

### 3c. « Range d'ouverture (ORB) » · « Ouverture » = « New York » · « Durée du range » = « 15 min »

**Tu vois** : deux traits écrits « ORB haut » et « ORB bas » (avec « (en cours) » tant que le range se forme), puis « ORB milieu » quand il est fini.
**Tu lis** : la légende, ligne « Range d'ouverture (ORB) ».

| La légende dit | Tu fais |
|---|---|
| « New York 15 min : 61 000 – 61 400 · ouvert à 13:30 UTC » **avant** le trait « NY » d'aujourd'hui | C'est le range d'un jour précédent : ignore-le |
| « New York 15 min : en formation jusqu'à 13:45 UTC » | **Rien** : pas de trade |
| « New York 15 min : 61 000 – 61 400 · ouvert à 13:30 UTC » **après** le trait « NY » | Range fini : lis la suite |

| Après la fin du range, le prix | Ça veut dire |
|---|---|
| Sort une **première** fois | Première poussée : **pas de trade**, attends la seconde |
| Rentre, puis ressort du même côté avec du delta et du volume | Seconde poussée : ce camp prend la main |
| Sort, rentre et file vers l'autre bord | Cassure ratée : cible « ORB milieu », puis l'autre bord |

### 3d. « Ouverture du jour » : lis seulement le prix après « NY »

**Tu lis** : la légende, ligne « Ouverture du jour » : « 60 005 · … · NY 61 200 : … ». **Retiens seulement le prix qui suit « NY »** (61 200 dans l'exemple). Ignore le reste de la phrase : lundi, elle compare à dimanche.
**Tu fais** : place ce prix face aux étiquettes « VAH » et « VAL » du dessin de vendredi :

| Le prix de l'ouverture de New York est | Journée probable | Tu cherches |
|---|---|---|
| Entre « VAL » et « VAH » | Rotation | Les bords (break-in) |
| Au-dessus de « VAH » ou sous « VAL », mais sur des prix où les bougies de vendredi ont traité | Le marché doit se faire accepter hors de la zone | Acceptation (étape 4) ou retour dedans |
| Au-dessus du plus haut ou sous le plus bas des bougies de vendredi | Déséquilibre net | La continuation, au retest |

---

## Étape 4 — L'état du marché · le dessin de vendredi + clôtures de 30 min

**Outil** : « Volume Profile à plage fixe » (dessin de vendredi, « Niveaux prolongés vers la droite » = « Oui »). **Tu lis** : l'étiquette « Depuis la fin de la plage : … » sous le dessin.
Attention : elle compte aussi le week-end. **Confirme toujours sur le graphique 30m** : regarde les 2 dernières clôtures de 30 min face à « VAH » et « VAL ».

| L'étiquette dit | État | Setup à chercher (étape 6) |
|---|---|---|
| « dans la valeur du profil » | Équilibre | Break-in ou enchère ratée aux bords |
| « sortie au-dessus de la VAH en cours (1/2) » ou « sortie sous la VAL en cours (1/2) » | Sortie pas confirmée | **Attendre** la 2e clôture de 30 min |
| « acceptation au-dessus de la VAH (2 × 30 min) » ou « … sous la VAL … » | Déséquilibre accepté | Cassure puis retest, dans le sens de la sortie |
| « retour dans la valeur en cours (1/2) » | Retour pas confirmé | **Attendre** |
| « rejet par le haut, retour dans la valeur (2 × 30 min) » ou « rejet par le bas … » | Sortie refusée | Break-in vers l'autre bord |

L'« extrême de la sortie » n'est pas écrit lundi : repère-le toi-même (le plus haut ou le plus bas atteint hors de la zone) sur les bougies.

---

## Étape 5 — Le lieu · graphique **5m**

On ne trade **que** sur l'un de ces niveaux :

| Niveau | Outil | Étiquette écrite sur le graphique |
|---|---|---|
| VAH ou VAL de vendredi | « Volume Profile à plage fixe » | « VAH 61 300 », « VAL 60 950 » |
| POC de vendredi | « Volume Profile à plage fixe » | « POC 61 125 » |
| Creux de volume (LVN) de vendredi | « Volume Profile à plage fixe » ▸ « Pics et creux de volume (HVN / LVN) » = « Affichés » | « LVN 61 000 » |
| Haut ou bas de la semaine dernière | « Niveaux clés » | « Haut S-1 », « Bas S-1 » |
| Ouverture du mois | « Niveaux clés » | « Ouv. M » |
| POC non testé | « POC non testés » | « nPOC 61 125 · 10/10 » (prix et jour) |
| VWAP du jour | « VWAP » | Aucune : ligne pâle épaisse ; la valeur est dans la légende, ligne « VWAP » |
| Haut ou bas du range d'ouverture | « Range d'ouverture (ORB) » | « ORB haut », « ORB bas » |

| Le prix | Tu fais |
|---|---|
| Touche un niveau, ou en est à moins d'une bougie 5m moyenne | Étape 6 |
| Est sur une **zone** (deux niveaux à moins de 0,2 %) | Étape 6, lieu de meilleure qualité |
| Est au milieu de la zone de valeur, sur un pic de volume (HVN) ou loin de tout | **Pas de trade** |

---

## Étape 6 — Le setup · graphique **5m**

Bords de la zone aujourd'hui : **« VAH »** (haut), **« VAL »** (bas), **« POC »** (POC).

| Setup | Conditions, dans l'ordre | Entrée | Stop | Cible | Invalidé si |
|---|---|---|---|---|---|
| **Break-in** (le setup de départ) | 1. Sortie sous le bas (ou au-dessus du haut). 2. Une bougie 5m **clôture de nouveau dans la zone**. 3. **Retest** du bord | Au retest | Au-delà de l'extrême de la sortie | L'autre bord | Pas de clôture dedans, ou pas de retest |
| **Cassure** | 1. Sortie avec delta et volume forts. 2. **Deux bougies** clôturent dehors (ou une à très fort volume). 3. Retest du bord | Au retest | De l'autre côté du bord | Prochain niveau de l'étape 5 | La cassure rentre aussitôt |
| **Enchère ratée** | 1. Le prix dépasse un bord **avec peu de volume**. 2. Grosse bougie qui rentre dans la zone | À la clôture de rentrée | Au-delà de l'extrême | L'autre bord | La sortie repart avec du volume |
| **Retournement complet** | Après une cassure, l'autre bord casse avec initiative | Au retest de ce bord | De l'autre côté | Début de l'impulsion | Le prix reprend le bord cassé |

Les ventes sont le miroir des achats (haut à la place du bas).

**Le break-in pas à pas (achat)** :

| Condition | Où la voir |
|---|---|
| 1. Sortie sous le bas | Bougies 5m sous l'étiquette « VAL » du dessin de vendredi |
| 2. Clôture de retour | Le corps d'une bougie **5m** clôture au-dessus de « VAL » |
| 3. Retest | Le prix retouche « VAL » et **ne clôture pas** dessous |
| Stop | Sous le plus bas de la sortie (lu sur les bougies 5m) |
| Cible | « VAH » ; « POC » en sortie partielle (TP1) |

Après l'entrée, une clôture 5m de nouveau sous « VAL » = échec : **sors**, même avant le stop.

---

## Étape 7 — La confirmation par le flux · graphique **5m** (le **1m** pour vérifier)

| Outil | Réglage | Tu vois | Tu lis |
|---|---|---|---|
| Menu « Footprint » | « Affichage dans les bougies » = « Bid × Ask » | Dans chaque bougie, les ventes agressives à gauche et les achats à droite, à chaque prix ; des marques **A** et **E** | **A** = absorption, **E** = épuisement (voir plus bas) |
| « Gros prints » | « Seuil par session » = « Ajusté » | Des cercles : plein = le prix a suivi le gros ordre ; **anneau creux** = il n'a pas suivi | Anneau creux contre toi au niveau = absorption |
| Panneau « Statistiques » | — | Colonnes par bougie, lignes « Delta % », « Vol. × », « Gros Δ » | « Delta % » en couleur pleine = un camp mène (au-delà de 10 %) ; « Vol. × » en orange = volume ×2 ou plus |
| Panneau « CVD (session) » | — | Le delta cumulé depuis 00:00 UTC | Pente du CVD |

| Il faut voir, sur le niveau | Pour quel setup |
|---|---|
| **Absorption** : gros prints contre toi en anneau creux, ou marque **A**, et le prix ne passe pas | Break-in, enchère ratée |
| **Initiative** : « Delta % » en couleur dans ton sens, « Vol. × » en orange, CVD qui suit le prix | Cassure, retournement |
| **Épuisement** : marque **E**, « Vol. × » qui baisse bougie après bougie | Enchère ratée |
| « Vol. × » fort à la sortie, faible pendant le retour, fort à la rentrée | Break-in |

« Delta % » fort **contre** toi pendant que le prix avance contre toi, ou rien de tout ça : **pas de trade**.

---

## Étape 8 — Poser la position · barre de gauche ▸ « Position longue » (Alt + L) ou « Position courte » (Alt + S)

1. Clic au prix d'entrée sur le 5m. Glisse la poignée du **stop** et celle de la **cible** aux prix de l'étape 6.
2. Roue dentée « Réglages du dessin » ▸ « Note du setup » : **A** (tout est réuni), **B** (un élément secondaire manque, risque × 0,5), **C** (douteux, risque × 0,25).
3. Lis le texte écrit sur la position, par exemple « R:R 2,76 · 0,005 BTC (401 $) · levier ×4 · risque 1 % · frais 0,05 % » :

| Tu lis | Tu fais |
|---|---|
| « R:R » au moins 2 | Continue |
| « R:R » sous 2 | **Pas de trade** |
| Dans « Cible … » : « frais trop lourds » ou « les frais mangent le gain » (orange) | **Pas de trade** |
| La quantité (« 0,005 BTC ») | C'est la taille de l'ordre sur Binance |

---

## Étape 9 — Check-list, puis l'ordre

Panneau « Apprendre » ▸ onglet « Check-list » : coche les cases. **Une case ★ non cochée = pas de trade** (niveau, flux, stop, R:R, taille).
Les autres cases règlent la note proposée : **A** à 90 % de cases cochées, **B** à 70 %, sinon **C**.
Puis passe l'ordre sur Binance avec la quantité de l'étape 8 : ordre « Limit » au prix du retest, puis le stop et la cible dans les champs « TP/SL ».

---

## Étape 10 — Gérer le trade · position ▸ menu « Stop »

| Moment | Action dans le menu « Stop » |
|---|---|
| +1 R environ **et** une bougie 5m confirme | « Point mort (frais compris) » |
| Un niveau intermédiaire est atteint (POC, VWAP) | « Verrouiller +0,5 R » ou « Verrouiller +1 R » |
| Le mouvement continue | « Sous la dernière mèche » ou « Sous le dernier gros print » |
| Le setup est invalidé (colonne « Invalidé si » de l'étape 6) | Sors |

Le stop ne va que vers le gain.

---

## Étape 11 — Après le trade · panneau « Journal »

1. Clique la position sur le graphique pour la sélectionner. Panneau « Journal » ▸ « Noter un trade » ▸ « Reprendre l'outil position sélectionné » ; choisis le setup ; « Reprendre la note de la check-list » ; coche les erreurs éventuelles ; mets les heures d'entrée et de sortie ; « Enregistrer ».
2. **Ferme les graphiques** si : 3 trades faits, 2 pertes d'affilée, « Limite de perte du jour atteinte » affiché dans « Budget du jour », ou ta fenêtre de 60 à 90 min est finie.

---

## Pas de trade si

- « Mes heures de trading » dit « hors de vos heures », ou le range d'ouverture est « en formation », ou c'est la première poussée.
- Le prix est loin de tous les niveaux de l'étape 5.
- Aucune confirmation par le flux (étape 7).
- « R:R » sous 2, avertissement de frais, ou case ★ non cochée.
- 3 trades faits, 2 pertes d'affilée, ou limite de perte atteinte.
- Un setup sur un niveau de dimanche (« Haut J-1 », « Bas J-1 »).

Rien de cette stratégie n'est prouvé : valide-la en « Replay » sur au moins 30 trades notés avant le réel. Ce n'est pas un conseil financier.
