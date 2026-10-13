# Installation : à faire une seule fois

But : allumer les bons outils, les régler, et savoir **ce que chacun écrit sur le graphique** (certains ne portent aucun nom).
Les noms entre « » sont ceux de l'application. Les heures sont en UTC, comme ton axe (si ton ordinateur est dans un autre fuseau, fie-toi au trait « NY » pour l'ouverture de New York).

## 1. Deux graphiques

Barre du haut ▸ icône « Grille de graphiques » ▸ **2 graphiques**. Graphique de gauche : intervalle **1h** (boutons « 1m 5m 15m 1h 4h 1J » de la barre du haut). Graphique de droite : **5m**.
Clique sur un graphique pour l'activer : le menu « Indicateurs » règle le graphique actif. Pour l'étape 1 des fiches, passe le graphique de gauche en **1J**, puis reviens en 1h.

## 2. Indicateurs à allumer et à éteindre

Barre du haut ▸ « Indicateurs » (deux colonnes). Sur le graphique de gauche :

| Colonne | Titre | **Allume** |
|---|---|---|
| Droite | « Profils et niveaux » | « Profil de session », « Value area de la veille », « Ouverture du jour », « Range d'ouverture (ORB) », « Niveaux clés », « POC non testés », « VWAP » |
| Droite | « Sessions et horaires » | « Mes heures de trading », « Repères horaires » |
| Gauche | « Flux d'ordres » | « Gros prints » |
| Gauche | « Panneaux sous le graphique » | « Volume », « Delta », « CVD (session) », « Statistiques » |

**Éteins** : « Heatmap de liquidité », « Bulles de trades », « Liquidations », « Bid / ask », « OI par prix », « Divergences CVD » (colonne de gauche) ; « Sessions Asie / Londres / NY » et « Initial balance et ouverture » (colonne de droite).
« Sessions Asie / Londres / NY » dessine un cadre coloré « New York » qui commence 1 h 30 avant l'ouverture de la Bourse : ne le confonds pas avec elle.

Sur le graphique de droite (5m) : les mêmes, sauf « Profil de session » **éteint** (il encombre les bougies).

## 3. Réglages

Pour régler un indicateur : survole sa ligne dans la légende (en haut à gauche du graphique), puis clique l'icône « Réglages » (les curseurs).

| Outil | Réglage | Valeur |
|---|---|---|
| « Profil de session » | « Période » | Change selon l'étape : « Jour UTC », « Composite 5 j » ou « Semaine ». Remets « Jour UTC » après l'étape 1 |
| « Profil de session » | « HVN / LVN » | « Affichés » |
| « Value area de la veille » | « HVN / LVN d'hier » | « Prolongés sur la journée » |
| « Niveaux clés » | « Afficher » | « Ouvertures et hauts / bas » |
| « VWAP » | « Période » | « Jour UTC » |
| « VWAP » | « Bandes » | « ±1σ et ±2σ » |
| « Range d'ouverture (ORB) » | « Ouverture » | « New York » |
| « Range d'ouverture (ORB) » | « Durée du range » | « 15 min » |
| « Range d'ouverture (ORB) » | « Extensions » | « Range seul » |
| « Repères horaires » | « Afficher » | « Ouverture NY » |
| « Mes heures de trading » | « De » et « À » | « 13 h » et « 15 h » (heure de ton ordinateur). Après le passage à l'heure d'hiver américaine (1er novembre) : « 14 h » et « 16 h » |
| « Gros prints » | « Seuil par session » | « Ajusté (Asie ×0,5, Londres ×1, New York ×2) » |

**Footprint** (graphique 5m) : barre du haut ▸ « Footprint » ▸ « Affichage dans les bougies » ▸ « Bid × Ask ». Les cases se voient en zoomant sur les bougies.

## 4. Position

Barre de gauche ▸ « Position longue » (Alt + L). Dans la barre flottante : « Capital » = ton capital réel (pas celui du compte de démo), « Risque » = part du capital perdue au stop (1 % par défaut ; 0,25 % dans les vidéos), « Frais » = 0,05 % / ordre.

## 5. Journal

Panneau « Journal » ▸ « Budget du jour » ▸ « Limite de perte » = 3 R.

## 6. Enregistrer

Barre du haut ▸ icône « Mises en page et modèles d'indicateurs » ▸ enregistre la mise en page.

---

## Qui écrit quoi sur le graphique

C'est la source de la plupart des confusions : certains traits n'ont **pas de nom**.

| Tu vois | C'est | Outil | Nom écrit ? |
|---|---|---|---|
| Barres grises à droite d'une bougie, ou à droite de l'écran | Le volume échangé à chaque prix | « Profil de session » | — |
| Trait orange plein | **POC** : le prix le plus échangé | « Profil de session » | **Non.** Son prix est dans la légende (« POC … ») |
| Deux tirets gris | **VAH** (haut) et **VAL** (bas) : la zone où s'est fait 70 % du volume | « Profil de session » | **Non.** Les prix sont dans la légende : « VA bas–haut » |
| « VAH J-1 61 300 », « POC J-1 … », « VAL J-1 … » | La zone de valeur **d'hier** | « Value area de la veille » | Oui |
| « POC 61 125 », « VAH 61 300 », « VAL 60 950 » | La zone de valeur de la **plage que tu as tracée** | « Volume Profile à plage fixe » (barre de gauche, Alt + P) | Oui |
| « HVN … » et « LVN … » | Pics de volume (le prix ralentit) et creux de volume (le prix passe vite) | « Value area de la veille » (réglage « HVN / LVN d'hier »), « Volume Profile à plage fixe », ou « Profil de session » en « Composite 5 j » | Oui. Dans les autres périodes de « Profil de session » : petit trait orange et tirets bleus **sans nom** |
| « Haut J-1 », « Bas J-1 », « Ouv. S », « Ouv. M », « Haut S-1 », « Bas S-1 », « Haut M-1 », « Bas M-1 » | Extrêmes de la veille, de la semaine et du mois précédents ; ouvertures de la semaine et du mois | « Niveaux clés » | Oui |
| « nPOC 61 125 · 10/10 » | POC d'un jour passé que le prix n'a pas retouché | « POC non testés » | Oui |
| « Ouv. J 60 005 » | Le prix de 00:00 UTC | « Ouverture du jour » | Oui |
| « ORB haut », « ORB bas », « ORB milieu » | Le range des 15 premières minutes de New York | « Range d'ouverture (ORB) » | Oui |
| Trait vertical orange « NY » | L'ouverture de la Bourse de New York | « Repères horaires » | Oui |
| Ligne pâle épaisse, avec des tirets au-dessus et en dessous | Le **VWAP** (prix moyen pondéré par le volume) et ses bandes ±1σ, ±2σ | « VWAP » | **Non.** Le prix est dans la légende (« VWAP ») |

### Lire un nombre dans la légende

La légende est en haut à gauche du graphique : clique « N indicateurs » pour la déplier. Exemple : « Composite 5 j · POC 61 125 · VA 60 950–61 300 · forme D (équilibre) ».
Dans « VA 60 950–61 300 », le 1er nombre est le **bas** (VAL) et le 2e le **haut** (VAH).
Avec « Période » = « Jour UTC » ou « Semaine », la légende ne donne que le profil le plus récent (celui d'aujourd'hui, en construction).

## Lexique

- **Value area (zone de valeur)** : la zone de prix où s'est fait 70 % du volume. **VAH** = son haut, **VAL** = son bas, **POC** = le prix le plus échangé.
- **HVN** : pic de volume. **LVN** : creux de volume. **nPOC** : POC jamais retouché.
- **Delta** : achats agressifs moins ventes agressives. « Delta % » : delta divisé par le volume de la bougie. **CVD** : delta cumulé.
- **Retest** : retour du prix sur le niveau qu'il vient de franchir.
- **R** : le risque pris au stop. +2 R = un gain égal à deux fois le risque.
