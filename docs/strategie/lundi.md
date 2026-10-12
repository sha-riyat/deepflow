# Stratégie du lundi

Fiche à suivre dans l'ordre, du haut vers le bas. Le pourquoi de chaque règle est dans
[`docs/STRATEGIE.md`](../STRATEGIE.md). Heures en UTC. Notation : « nom exact dans l'application », ▸ = chemin.

**À vérifier en premier**
- Jour férié aux États-Unis : **pas de trade** (Wall Street fermée, ouverture sans volume).
- Du 1er au 3 du mois : ignorer « Ouv. M » ; lire « Haut M-1 » / « Bas M-1 » à la place.
- Semaine de changement d'heure (mars, fin octobre) : vérifier que « Mes heures de trading » couvre le trait « NY ».

**Ce qui change le lundi**
- « J-1 » est dimanche (peu d'échanges) : « Value area de la veille », « Haut J-1 », « Bas J-1 » ne servent pas.
- « Ouv. S » vient de naître (c'est l'ouverture de la bougie du jour) : ne sert pas.
- La référence du jour est **vendredi** et **la semaine dernière** : on les trace avec « Volume Profile à plage fixe ».
- Avant l'ouverture de New York, l'ORB affiché est celui de vendredi.
- C'est le jour où l'on remplit la « Fiche de la semaine ».

---

## 1. Préparer · avant l'ouverture de New York

1. « Indicateurs » : **éteindre** « Value area de la veille » (aujourd'hui seulement).
2. Supprimer les profils à plage fixe de la semaine d'avant (cliquer dessus, puis Suppr).
3. Graphique 1h ▸ barre de gauche ▸ « Volume Profile à plage fixe » (Alt + P) : cliquer sur la bougie de **lundi
   dernier 00:00**, puis sur celle de **dimanche 23:00**. Roue dentée « Réglages du dessin » : « Niveaux prolongés
   vers la droite » = « Oui », couleur violette. C'est le **profil de la semaine dernière** (il sert toute la
   semaine).
4. Même outil, de **vendredi 00:00** à **vendredi 23:00**, prolongé, couleur bleue : **profil de vendredi** (il sert
   aujourd'hui).
5. Panneau « Journal » ▸ « Fiche de la semaine » : un scénario haussier, un baissier, un neutre, avec les prix des
   niveaux de l'étape 3.
6. Panneau « Alertes » ▸ « Nouvelle alerte » ▸ « Prix franchi » : une sur la VAH, une sur la VAL **de vendredi**.

---

## 2. Le fond · graphique **1J** · 5 min

**a. Profil de la semaine dernière** (étiquette sous la plage : « … · forme … ») :

| L'étiquette dit | Ça veut dire | Tu cherches |
|---|---|---|
| « forme D (équilibre) » | Range | Acheter près de la VAL, vendre près de la VAH |
| « forme P (rachat de shorts) » | La hausse s'essouffle | Des ventes en priorité ; des achats seulement si le prix tient au-dessus de la VAH |
| « forme b (liquidation de longs) » | La baisse s'essouffle | Des achats en priorité ; des ventes seulement si le prix tient sous la VAL |
| « forme double distribution (tendance) » | Deux zones séparées par un creux | Le sens de la dernière zone ; on n'entre pas dans le creux |

Puis le prix face à ses VAH / VAL :

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de la VAH | Les acheteurs ont la main |
| Dans la value area | Rotation : jouer les bords |
| Sous la VAL | Les vendeurs ont la main |

**b. « Profil de session » · « Période » = « Jour UTC »** : comparer les cadres VAH / VAL de **mercredi, jeudi,
vendredi** (ignorer samedi et dimanche).

| Les cadres VAH / VAL | Ça veut dire |
|---|---|
| Montent, se recouvrent peu | Biais haussier |
| Descendent, se recouvrent peu | Biais baissier |
| Restent à la même hauteur | Équilibre : jouer les bords |

**c. « Niveaux clés »** : « Ouv. M » (prix au-dessus = acheteurs du mois gagnants, en dessous = vendeurs gagnants),
puis « Haut S-1 » / « Bas S-1 » (s'ils ne sont pas à l'écran : dézoomer l'échelle des prix) :

| Sur ce haut ou ce bas, le prix | Ça veut dire |
|---|---|
| Passe au-delà puis revient en deçà | Balayage : piège possible dans l'autre sens |
| Reste au-delà (2 clôtures de 30 min, à compter en **30m**) | Cassure acceptée : le mouvement continue |

**Écrire une ligne** : biais (haussier, baissier ou neutre) + les 3 niveaux les plus proches du prix. Les lectures
d'accord = biais net ; en désaccord = biais neutre, on ne joue que les bords.

---

## 3. Les niveaux du jour · graphique **1h**

Noter ceux à **moins d'1 %** du prix. Deux niveaux à moins de 0,2 % l'un de l'autre = **une zone**.

| Niveau | Où le lire |
|---|---|
| VAH, POC, VAL de vendredi | Profil à plage fixe de vendredi (bleu) |
| VAH, POC, VAL de la semaine dernière | Profil à plage fixe de la semaine (violet) |
| « Haut S-1 », « Bas S-1 » | « Niveaux clés » |
| « Ouv. M » | « Niveaux clés » |
| « nPOC … » (jours ouvrés) | « POC non testés » |
| VWAP du jour | « VWAP » (valeur dans la légende) |
| « LVN … » | « Profil de session » |
| « ORB haut », « ORB bas » (une fois le range fini) | « Range d'ouverture (ORB) » |

**À ignorer aujourd'hui** : « Haut J-1 », « Bas J-1 », « Ouv. S », « VAH / POC / VAL J-1 » (dimanche), les nPOC datés de samedi ou dimanche.

---

## 4. L'ouverture · **15 min** puis graphique **5m**

**Heure** : ouverture de New York à 13 h 30 UTC (heure d'été américaine) ou 14 h 30 (hiver), trait « NY ». Légende
de « Mes heures de trading » : « … · hors de vos heures » = **pas de trade**.

**« Range d'ouverture (ORB) »** (légende « New York 15 min : … », étiquettes « ORB haut », « ORB bas ») :

| La légende dit | Tu fais |
|---|---|
| « … · ouvert à 13:30 UTC » **avant** l'ouverture d'aujourd'hui | C'est le range d'un jour précédent : l'ignorer |
| « en formation jusqu'à … » | **Rien** : pas de trade |
| « 61 000 – 61 400 · ouvert à 13:30 UTC » après l'ouverture | Range fini : lire la suite |

| Après le range, le prix | Ça veut dire |
|---|---|
| Sort une **première** fois | Première poussée : **pas de trade**, attendre la seconde |
| Rentre puis ressort du même côté avec delta et volume | Seconde poussée : ce camp prend la main |
| Sort, rentre et file vers l'autre bord | Cassure ratée : cible « ORB milieu » puis l'autre bord |

**Ouverture** : ne pas lire la légende de « Ouverture du jour » (elle compare à dimanche). Placer le prix de
l'ouverture de New York face au **profil de vendredi** :

| Le prix à l'ouverture de New York est | Journée probable | Tu cherches |
|---|---|---|
| Dans la value area de vendredi | Rotation | Les bords (break-in) |
| Hors de la valeur de vendredi, dans celle de la semaine dernière | Le marché doit se faire accepter | Acceptation (étape 5) ou retour dedans |
| Hors de la value area de la semaine dernière | Déséquilibre net | La continuation, au retest |

---

## 5. L'état du marché · clôtures de **30 min**

**Où lire** : graphique **30m**, clôtures depuis lundi 00:00, face à la VAH / VAL **de vendredi**. (L'étiquette
« Depuis la fin de la plage : … » du profil compte aussi le week-end : ne pas s'y fier aujourd'hui.)

| Sur le 30m | État | Setup |
|---|---|---|
| Les clôtures restent dans la valeur de vendredi | Équilibre | Break-in ou enchère ratée aux bords |
| 1 clôture dehors | Pas confirmé | **Attendre** |
| 2 clôtures de suite dehors | Acceptation | Cassure puis retest, dans le sens de la sortie |
| Après une sortie, 2 clôtures de suite de retour dedans | Rejet | Break-in vers l'autre bord |

---

## 6. Le lieu · graphique **5m**

On ne trade **que** sur un niveau de la liste de l'étape 3 (pas sur ceux « À ignorer »).

| Le prix | Tu fais |
|---|---|
| Touche un niveau, ou en est à moins d'une bougie 5m moyenne | Étape 7 |
| Est sur une zone (deux niveaux à moins de 0,2 %) | Étape 7, lieu de meilleure qualité |
| Est au milieu de la value area, sur un pic de volume (HVN) ou loin de tout | **Pas de trade** |

---

## 7. Le setup · graphique **5m**

Bords de la valeur aujourd'hui : **la VAH de vendredi** (haut), **la VAL de vendredi** (bas), **le POC de vendredi** (POC).

| Setup | Conditions, dans l'ordre | Entrée | Stop | Cible | Invalidé si |
|---|---|---|---|---|---|
| **Break-in** (le setup de départ) | 1. Sortie sous la VAL (ou au-dessus de la VAH). 2. Une bougie 5m **clôture de nouveau dans la valeur**. 3. **Retest** du bord | Au retest | Sous l'extrême de la sortie (ou sous le POC) | L'autre bord | Pas de clôture dedans, ou pas de retest |
| **Cassure** | 1. Sortie avec delta et volume forts. 2. **Deux bougies** clôturent dehors (ou une à très fort volume). 3. Retest du bord | Au retest | De l'autre côté du bord | Prochain niveau de l'étape 3 | La cassure rentre aussitôt |
| **Enchère ratée** | 1. Le prix dépasse un bord **avec peu de volume**. 2. Grosse bougie qui rentre | À la clôture de rentrée | Au-delà de l'extrême | L'autre bord | La sortie repart avec du volume |
| **Retournement complet** | Après une cassure, l'autre bord casse avec initiative | Au retest de ce bord | De l'autre côté | Début de l'impulsion | Le prix reprend le bord cassé |

Ventes = miroir des achats (VAH à la place de VAL).

**Break-in pas à pas (achat)** :

| Condition | Où la voir |
|---|---|
| 1. Sortie sous la VAL | Bougies 5m sous la VAL de vendredi |
| 2. Clôture de retour | Corps d'une bougie **5m** qui clôture au-dessus de la VAL de vendredi |
| 3. Retest | Le prix retouche la VAL de vendredi et **ne clôture pas** dessous |
| Stop | Sous le plus bas de la sortie |
| Cible | la VAH de vendredi ; le POC de vendredi en sortie partielle (TP1) |

Après l'entrée, une clôture 5m de nouveau sous la VAL de vendredi = échec : **sortir**, même avant le stop.

---

## 8. Le flux · graphique **5m** (1m pour vérifier)

| Outil | Ce que tu lis |
|---|---|
| Menu « Footprint » ▸ « Bid × Ask » | Marque **A** (absorption) ou **E** (épuisement) sur un extrême ; delta sous la bougie |
| « Gros prints » | Cercle plein = le prix a suivi ; **anneau creux** = absorbé |
| Panneau « Statistiques » | « Delta % » en couleur pleine (au-delà de 10 %) ; « Vol. × » en orange (×2 et plus) |
| Panneau « CVD (session) » | Pente du delta cumulé |

| Il faut voir, sur le niveau | Pour |
|---|---|
| **Absorption** : gros prints contre toi en anneau creux, ou marque A, et le prix ne passe pas | Break-in, enchère ratée |
| **Initiative** : « Delta % » en couleur dans ton sens, « Vol. × » orange, CVD qui suit le prix | Cassure, retournement |
| **Épuisement** : marque E, « Vol. × » qui baisse bougie après bougie | Enchère ratée |
| « Vol. × » fort à la sortie, faible au retour, fort à la rentrée | Break-in |

« Delta % » fort contre toi qui fait avancer le prix, ou rien de tout ça : **pas de trade**.

---

## 9. La position · « Position longue » (Alt + L) / « Position courte » (Alt + S)

1. Clic au prix d'entrée sur le 5m ; poignée du **stop** et de la **cible** aux prix de l'étape 7.
2. Roue dentée « Réglages du dessin » ▸ « Note du setup » : **A** (tout réuni), **B** (un élément secondaire
   manque), **C** (douteux).
3. Lire le texte de la position (« R:R … · quantité · risque … ») :

| Tu lis | Tu fais |
|---|---|
| « R:R » au moins 2 | Continuer |
| « R:R » sous 2 | **Pas de trade** |
| « frais trop lourds… » ou « les frais mangent le gain » (orange) | **Pas de trade** |
| La quantité (« 0,012 BTC (742 $) ») | C'est la taille de l'ordre |

---

## 10. Check-list, puis entrée

Panneau « Apprendre » ▸ « Check-list » : cocher. **Une case ★ non cochée = pas de trade** (niveau, flux, stop,
R:R, taille). Puis ordre sur Binance avec la quantité affichée.

---

## 11. Gérer · menu « Stop » de la position

| Moment | Action |
|---|---|
| +1 R environ **et** une bougie 5m confirme | « Point mort (frais compris) » |
| Niveau intermédiaire atteint (POC, VWAP) | « Verrouiller +0,5 R » ou « Verrouiller +1 R » |
| Le mouvement continue | « Sous la dernière mèche » ou « Sous le dernier gros print » |
| Setup invalidé (étape 7, « Invalidé si ») | Sortir |

Le stop ne va que vers le gain.

---

## 12. Après le trade · panneau « Journal »

1. « Noter un trade » ▸ « Reprendre l'outil position sélectionné », setup, « Reprendre la note de la check-list »,
   erreurs, heures, « Enregistrer ».
2. **Fermer les graphiques** si : 3 trades faits, 2 pertes d'affilée, « Limite de perte du jour atteinte » dans
   « Budget du jour », ou fin de ta fenêtre de 60 à 90 min.

---

## Pas de trade si

- Hors de tes heures, avant la fin de l'ORB, ou sur la première poussée.
- Prix loin des niveaux de l'étape 3, ou pas de flux qui confirme.
- R:R sous 2, avertissement de frais, case ★ non cochée.
- 3 trades, 2 pertes d'affilée, ou limite de perte atteinte.
- Setup sur un niveau de dimanche (« Haut J-1 », « Bas J-1 », « VAH / VAL J-1 »).

Rien de cette stratégie n'est prouvé : à valider en « Replay » sur au moins 30 trades notés avant le réel. Ce
n'est pas un conseil financier.
