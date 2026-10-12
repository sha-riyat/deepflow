# Stratégie deepflow : les étapes à suivre

Objectif : 1 à 3 trades par jour, dans une fenêtre de 60 à 90 min, puis graphiques fermés.
Setup de départ : le **break-in** (étape 6). Notation : « nom exact dans l'application », ▸ = chemin pour le trouver.

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

## Étape 1 — Le fond · graphique **1J** · 5 min

**Outils** : « Profil de session » avec « Période » = « Composite 5 j » (puis « Semaine ») ; « POC non testés » ;
« Niveaux clés ».

**Faire** : lire la **forme** du profil dans sa légende et comparer les zones de valeur des derniers jours.

| Tu vois | Ça veut dire | Tu cherches |
|---|---|---|
| Zones de valeur qui **montent** | Biais haussier | Surtout des achats |
| Zones de valeur qui **descendent** | Biais baissier | Surtout des ventes |
| Zones qui **se chevauchent**, forme **D** | Équilibre, rotation | Les deux bords |
| Forme **P** (zone en haut) / **b** (zone en bas) | Fin de hausse / fin de baisse | Le bord opposé en priorité |

Remettre ensuite « Période » = « Jour UTC ».

---

## Étape 2 — Les niveaux et le plan · graphique **1h** · 5 min

**Outils** : « Value area de la veille » (VAH, VAL, POC d'hier) ; « Niveaux clés » (haut et bas d'hier, ouvertures de
semaine et de mois) ; « POC non testés » ; « VWAP ».

**Faire** :
1. Noter les **niveaux** à moins d'1 % du prix : VAH, VAL, POC d'hier, haut et bas d'hier, POC non testés.
2. Panneau « Journal » ▸ « Fiche de la semaine » : un scénario haussier, un baissier, un neutre.
3. Panneau « Alertes » ▸ « Nouvelle alerte » ▸ type « Prix franchi » : une alerte sur la **VAH** et une sur la **VAL**
   d'hier.

---

## Étape 3 — L'ouverture · **15 min** puis graphique **5m**

**Outils** : légende de « Ouverture du jour » ; « Range d'ouverture (ORB) ».

**Faire** : attendre la fin du range d'ouverture (15 min). **Pas de trade avant. Pas de trade sur la première
poussée** : attendre la seconde.

| La légende de « Ouverture du jour » dit | Ça veut dire |
|---|---|
| « dans la valeur de la veille » | Journée de rotation plus probable : jouer les bords de la valeur |
| « dans le range de la veille, au-dessus / sous la valeur » | Le marché doit d'abord être accepté hors de la valeur : surveiller le retour dedans |
| « au-dessus / sous le range de la veille » | Déséquilibre net : chercher la continuation |

La même légende donne aussi la position à l'ouverture de New York (« NY … »).

---

## Étape 4 — L'état du marché · légende, clôtures de **30 min**

**Outil** : légende de « Value area de la veille ».

| La légende dit | État | Setup à chercher (étape 6) |
|---|---|---|
| « dans la valeur de la veille » | Équilibre | Break-in ou enchère ratée aux bords |
| « sortie au-dessus de la VAH / sous la VAL en cours (1/2) » | Sortie pas encore confirmée | Attendre la 2e clôture de 30 min |
| « acceptation au-dessus de la VAH / sous la VAL » | Déséquilibre accepté (2 clôtures de 30 min dehors) | Cassure puis retest, dans le sens de la sortie |
| « retour dans la valeur en cours (1/2) » | Retour pas encore confirmé | Attendre la 2e clôture de 30 min |
| « rejet par le haut / par le bas, retour dans la valeur » | Sortie refusée (2 clôtures de retour dedans) | Break-in vers l'autre bord de la valeur |

Fin de la légende : relation de la valeur du jour avec celle d'hier. « valeur plus haute » ou « valeur plus basse » = la
valeur migre (tendance) ; « valeur qui chevauche » = hésitation ; « valeur intérieure » = équilibre ; « valeur
extérieure » = l'intérêt s'élargit.

---

## Étape 5 — Le lieu · graphique **5m**

**On ne trade que sur un de ces niveaux** :

| Niveau | Outil |
|---|---|
| VAH ou VAL d'hier | « Value area de la veille » |
| Creux de volume (LVN) | « Profil de session », « HVN / LVN » = « Affichés » |
| POC non testé | « POC non testés » |
| Haut ou bas d'hier | « Niveaux clés » |
| VWAP du jour | « VWAP » |
| Haut ou bas du range d'ouverture | « Range d'ouverture (ORB) » |

Prix au milieu de la value area, loin de tout niveau : **pas de trade**.

---

## Étape 6 — Le setup · graphique **5m**

| Setup | Conditions, dans l'ordre | Entrée | Stop | Cible | Invalidé si |
|---|---|---|---|---|---|
| **Break-in** (à apprendre en premier) | 1. Le prix sort sous la VAL (ou au-dessus de la VAH). 2. Une bougie **clôture de nouveau dans la value area**. 3. Le prix revient tester la VAL (le **retest**) | Au retest | Sous l'extrême de la sortie, ou sous le POC | L'autre bord de la value area | Pas de clôture dans la zone, ou pas de retest |
| **Cassure** | 1. Sortie avec force (delta et volume forts). 2. **Deux bougies** clôturent dehors, ou une à très fort volume. 3. Retest du bord cassé | Au retest | De l'autre côté du bord cassé | Prochain niveau (haut / bas d'hier, POC non testé) | La cassure rentre aussitôt dans la zone |
| **Enchère ratée** | 1. Le prix dépasse un bord **avec peu de volume**. 2. Grosse bougie qui rentre dans la zone | À la clôture de rentrée | Au-delà de l'extrême | L'autre bord | La sortie repart avec du volume |
| **Retournement complet** | Après une cassure, l'autre bord de la zone casse avec initiative | Au retest de ce bord | De l'autre côté | Début de l'impulsion | Le prix reprend le bord cassé |

Les setups vendeurs sont le miroir des setups acheteurs (VAH à la place de VAL).

---

## Étape 7 — La confirmation par le flux · graphique **5m** (le **1m** pour vérifier)

**Outils** : menu « Footprint » (« Bid × Ask », marques **A** et **E**) ; « Gros prints » ; panneau « Statistiques »
(delta %, volume) ; panneau « CVD (session) ».

À chercher **sur le niveau, au moment du setup** :

| Lecture | Ce qu'on voit | Pour quel setup |
|---|---|---|
| **Absorption** | Gros prints ou gros delta contre toi au niveau, et le prix **ne passe pas** ; marque **A** du footprint | Break-in, enchère ratée |
| **Initiative** | Delta % fort dans ton sens (en couleur dans « Statistiques » au-delà de 10 %), clôture pleine, volume au-dessus de la moyenne | Cassure, retournement |
| **Épuisement** | Volume qui baisse à l'extrême, marque **E** | Enchère ratée |
| **Volume du break-in** | Fort à la sortie, faible pendant le retour, fort à la rentrée | Break-in |

Rien de tout ça au niveau : **pas de trade**.

---

## Étape 8 — Poser la position · outil « Position longue » / « Position courte »

1. Barre de gauche ▸ « Position longue » (Alt + L) ou « Position courte » (Alt + S), clic au prix d'entrée sur le 5m.
2. Glisser la poignée du **stop** à l'endroit prévu à l'étape 6.
3. Glisser la poignée de la **cible** sur le niveau prévu à l'étape 6.
4. Lire le texte de la position :
   - **R:R au moins 2** ;
   - **pas d'avertissement orange** sur les frais ;
   - la **quantité** affichée est la taille à prendre.
5. Roue dentée « Réglages du dessin » ▸ « Note du setup » : **A** (tout est réuni), **B** (il manque un élément
   secondaire, risque × 0,5), **C** (douteux, risque × 0,25).

R:R < 2 ou avertissement orange : **pas de trade**.

---

## Étape 9 — Check-list, puis entrée

Panneau « Apprendre » ▸ onglet « Check-list » : cocher chaque case. **Une case ★ non cochée = pas de trade.**
Puis passer l'ordre sur Binance avec la quantité affichée par la position.

---

## Étape 10 — Gérer le trade · menu « Stop » de la position

| Moment | Action (menu « Stop ») |
|---|---|
| Le prix a avancé d'environ 1 R **et** une nouvelle bougie confirme | « Point mort (frais compris) » |
| Le mouvement continue | « Sous la dernière mèche », ou « Sous le dernier gros print » |
| Sortie partielle prévue | Roue dentée ▸ « Part sortie à TP1 » et « TP1 : multiple du risque initial » |

Le stop ne se déplace que vers le gain. Pas de point mort avant une confirmation.

---

## Étape 11 — Après le trade · panneau « Journal »

1. « Noter un trade » ▸ « Reprendre l'outil position sélectionné ».
2. Setup, « Reprendre la note de la check-list », erreurs éventuelles, heures d'entrée et de sortie, « Enregistrer ».
3. Fermer les graphiques si : 3 trades faits, 2 pertes d'affilée, ou « Budget du jour » à la limite de perte.

Chaque semaine : relire « Journal » (courbe en R, statistiques « Par » setup et heure).

---

## Pas de trade si

- Hors de ta fenêtre (graphique grisé par « Mes heures de trading »).
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
| Fond | 1J, « Profil de session » en « Composite 5 j » |
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
