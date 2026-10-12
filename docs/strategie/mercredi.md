# Stratégie du mercredi

Fiche à suivre dans l'ordre, du haut vers le bas. Le pourquoi de chaque règle est dans
[`docs/STRATEGIE.md`](../STRATEGIE.md). Heures en UTC. Notation : « nom exact dans l'application », ▸ = chemin.

**À vérifier en premier**
- Jour férié aux États-Unis : **pas de trade** (Wall Street fermée, ouverture sans volume).
- Du 1er au 3 du mois : ignorer « Ouv. M » ; lire « Haut M-1 » / « Bas M-1 » à la place.
- Semaine de changement d'heure (mars, fin octobre) : vérifier que « Mes heures de trading » couvre le trait « NY ».

**Ce qui change le mercredi**
- Tout fonctionne : « J-1 » est un jour ouvré, « Ouv. S » compte pleinement.
- Le profil « Semaine » a deux jours : sa forme devient lisible.
- On compare la valeur de cette semaine à celle de la semaine dernière (profil tracé lundi).

---

## 1. Préparer · avant l'ouverture de New York

1. Garder le profil à plage fixe **de la semaine dernière** tracé lundi (niveaux prolongés).
2. Panneau « Journal » ▸ « Fiche de la semaine » : relire, corriger si besoin.
3. Panneau « Alertes » ▸ « Prix franchi » : une sur « VAH J-1 », une sur « VAL J-1 » (supprimer celles d'hier).

---

## 2. Le fond · graphique **1J** · 5 min

**a. « Profil de session » · « Période » = « Semaine »** (légende « Semaine · POC … · VA … · forme … ») :

| L'étiquette dit | Ça veut dire | Tu cherches |
|---|---|---|
| « forme D (équilibre) » | Range | Acheter près de la VAL, vendre près de la VAH |
| « forme P (rachat de shorts) » | La hausse s'essouffle | Des ventes en priorité ; des achats seulement si le prix tient au-dessus de la VAH |
| « forme b (liquidation de longs) » | La baisse s'essouffle | Des achats en priorité ; des ventes seulement si le prix tient sous la VAL |
| « forme double distribution (tendance) » | Deux zones séparées par un creux | Le sens de la dernière zone ; on n'entre pas dans le creux |

Puis le prix face à la VAH / VAL de la semaine :

Rester en **1J** (pas besoin du 5m ici). **Le prix** = l'étiquette en couleur sur l'axe de droite. **VAH / VAL** :
légende « Semaine · POC … · VA 60 950–61 300 · … » : le premier nombre est la VAL (bas), le second la VAH (haut).

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de la VAH | Les acheteurs ont la main |
| Dans la value area | Rotation : jouer les bords |
| Sous la VAL | Les vendeurs ont la main |

Prix à moins de 0,2 % de la VAH ou de la VAL : le compter « dans la value area ». La sortie se confirme à l'étape 5
(2 clôtures de 30 min).

**b. Cette semaine face à la semaine dernière** : la value area de la semaine (légende « VA … ») face au profil de
la semaine dernière.

| La value area de la semaine est | Ça veut dire |
|---|---|
| Au-dessus de celle de la semaine dernière | Tendance haussière de fond |
| En dessous | Tendance baissière de fond |
| À l'intérieur, ou les deux se chevauchent | Équilibre : jouer les bords |

**c. « Période » = « Jour UTC »** : comparer les cadres de **vendredi, lundi, mardi**.

| Les cadres VAH / VAL | Ça veut dire |
|---|---|
| Montent, se recouvrent peu | Biais haussier |
| Descendent, se recouvrent peu | Biais baissier |
| Restent à la même hauteur | Équilibre : jouer les bords |

**d. « Niveaux clés »** : « Ouv. S » et « Ouv. M » :

| Le prix est | Ça veut dire |
|---|---|
| Au-dessus de « Ouv. S » **et** de « Ouv. M » | Biais haussier renforcé |
| Sous les deux | Biais baissier renforcé |
| Entre les deux | Biais neutre |

Puis « Haut J-1 » / « Bas J-1 » :

| Sur ce haut ou ce bas, le prix | Ça veut dire |
|---|---|
| Passe au-delà puis revient en deçà | Balayage : piège possible dans l'autre sens |
| Reste au-delà (2 clôtures de 30 min, à compter en **30m**) | Cassure acceptée : le mouvement continue |

Remettre « Période » = « Jour UTC ».

**Écrire une ligne** : biais (haussier, baissier ou neutre) + les 3 niveaux les plus proches du prix. Les lectures
d'accord = biais net ; en désaccord = biais neutre, on ne joue que les bords.

---

## 3. Les niveaux du jour · graphique **1h**

Noter ceux à **moins d'1 %** du prix. Deux niveaux à moins de 0,2 % l'un de l'autre = **une zone**.

| Niveau | Où le lire |
|---|---|
| « VAH J-1 », « POC J-1 », « VAL J-1 » | « Value area de la veille » |
| « Haut J-1 », « Bas J-1 » | « Niveaux clés » |
| « Ouv. S » | « Niveaux clés » |
| « Ouv. M » | « Niveaux clés » |
| VAH, POC, VAL de la semaine dernière | Profil à plage fixe tracé lundi |
| « nPOC … » (jours ouvrés) | « POC non testés » |
| VWAP du jour | « VWAP » (valeur dans la légende) |
| « LVN … » | « Profil de session » |
| « ORB haut », « ORB bas » (une fois le range fini) | « Range d'ouverture (ORB) » |

**À ignorer aujourd'hui** : les nPOC datés de samedi ou dimanche.

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

**« Ouverture du jour »** : lire la partie « NY … : … » de sa légende (prix à l'ouverture de New York).

| Elle dit | Journée probable | Tu cherches |
|---|---|---|
| « dans la valeur de la veille » | Rotation | Les bords (break-in) |
| « dans le range de la veille, au-dessus de / sous la valeur » | Le marché doit se faire accepter hors de la valeur | Acceptation (étape 5) ou retour dedans |
| « au-dessus du / sous le range de la veille » | Déséquilibre net | La continuation, au retest |

---

## 5. L'état du marché · clôtures de **30 min**

**Où lire** : légende de « Value area de la veille » ; étiquette « extrême de la sortie … » sur le graphique.

| La légende dit | État | Setup |
|---|---|---|
| « dans la valeur de la veille » | Équilibre | Break-in ou enchère ratée aux bords |
| « sortie … en cours (1/2) » | Pas confirmé | **Attendre** la 2e clôture de 30 min |
| « acceptation au-dessus de la VAH (2 × 30 min) » / « … sous la VAL … » | Déséquilibre | Cassure puis retest, dans le sens de la sortie |
| « retour dans la valeur en cours (1/2) » | Pas confirmé | **Attendre** |
| « rejet par le haut / par le bas, retour dans la valeur (2 × 30 min) » | Sortie refusée | Break-in vers l'autre bord |

Fin de la légende : « valeur plus haute » / « plus basse » = tendance ; « intérieure » = range ; « qui chevauche » =
hésitation ; « extérieure » = journée agitée.

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

Bords de la valeur aujourd'hui : **« VAH J-1 »** (haut), **« VAL J-1 »** (bas), **« POC J-1 »** (POC).

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
| 1. Sortie sous la VAL | Bougies 5m sous « VAL J-1 » ; légende « sortie sous la VAL en cours (1/2) » ; étiquette « extrême de la sortie » |
| 2. Clôture de retour | Corps d'une bougie **5m** qui clôture au-dessus de « VAL J-1 » |
| 3. Retest | Le prix retouche « VAL J-1 » et **ne clôture pas** dessous |
| Stop | Sous le plus bas de la sortie |
| Cible | « VAH J-1 » ; « POC J-1 » en sortie partielle (TP1) |

Après l'entrée, une clôture 5m de nouveau sous « VAL J-1 » = échec : **sortir**, même avant le stop.

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

Rien de cette stratégie n'est prouvé : à valider en « Replay » sur au moins 30 trades notés avant le réel. Ce
n'est pas un conseil financier.
