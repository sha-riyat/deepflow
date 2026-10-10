# 05 — How Banks Hide their Orders Behind Price: a Guide on Icebergs

- Lien : https://www.youtube.com/watch?v=WPAP7JaVzF4
- Durée : 13:25
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription (auteur de la chaîne)
- Transcription : [../transcriptions/WPAP7JaVzF4.txt](../transcriptions/WPAP7JaVzF4.txt)

Remarque : le mot « DeepCharts » n'apparaît pas dans la transcription. On parle seulement de
« this platform » et d'une « iceberg indicator ».

## 1. Ce qui est enseigné

- Un **iceberg** est un gros ordre limite dont on n'affiche qu'une petite partie, par exemple 20
  contrats.
- Il se recharge en quelques millisecondes à chaque exécution, jusqu'à par exemple 800 contrats
  exécutés sur un seul prix.
- Sur le graphique, on voit une immobilité du prix malgré une forte agression.
- L'iceberg peut être une prise de profit, une entrée, ou « le même opérateur qui échange avec
  lui-même » (rééquilibrage, changement d'échéance).
- Le prix touche l'iceberg, recule, revient plusieurs fois, puis finit souvent par le casser.

## 2. Outils, graphiques, indicateurs

- **Footprint** : volume par prix, POC de la bougie, Delta.
- **Indicateur iceberg** développé « with the developers of the software » : affiche l'iceberg dès
  son début, avec alerte et popup.
- Paramètre unique cité : **« minimum cluster of volume »**, réglé à « 400 of 300 contracts »
  (formulation ambiguë, sans doute 300).
- Il faut **adapter ce seuil à la session** : 300 contrats « is not close to be enough » à New
  York.
- La logique interne de l'indicateur n'est pas expliquée.

## 3. Stratégies et règles concrètes

**Repérage, sur le footprint :**
- un volume anormal à un seul prix (223, puis « 1119 », ambigu : sans doute 1 119 contrats) ;
- ce niveau est le **POC** de la bougie ;
- **gros Delta sans progression du prix** ;
- le niveau n'est pas cassé.

**Avantage n°1 :** vendre contre l'iceberg, stop au-dessus, pour « a couple ticks ».
- La cible est volontairement non donnée (« homework »).
- On recommence tant que le prix rebondit.

**Avantage n°2 :** acheter la cassure quand l'iceberg cède.
- C'est présenté comme fonctionnant « a good 60-70% of the time ».
- Le passage est ambigu : on ne sait pas exactement ce qui réussit à 60-70 %.

**Signal de cassure :** 1 000 contrats, jamais vus avant, puis la bougie suivante à 0 contrat
(« liquidity void »), puis hausse toute la session.

**Filtre :** les sessions Asie / Londres, peu liquides, où un gros ordre est une anomalie. À New
York, 2 000 contrats sont absorbés en quelques millisecondes.

**Fréquence annoncée :** « once or twice a month ».

**Cas d'échec :** l'iceberg cède un moment puis le prix repart. Cela ressemble à une prise de
liquidité, mais c'est une enchère ratée (failed auction) : l'opérateur s'est mis à vendre au
marché une fois sa position remplie.

## 4. Moments clés à vérifier à l'écran

- 01:39-02:12 — schéma du carnet et construction de la bougie.
- 03:17-04:56 — schéma d'iceberg à 20 contrats rechargé.
- 07:35 — footprint ES (session de Londres) : 223 puis 1 119 contrats à un prix.
- 08:10 — premier short ; date « 19 avril » (année non précisée).
- 08:42-09:14 — 1 000 contrats, puis bougie à 0 (vide de liquidité).
- 10:17 — indicateur iceberg avec alerte.
- 10:49 — 2e exemple, iceberg « déplacé ».
- 11:22 — notification et réglage du seuil 300 / 400.

## 5. Évaluation critique

- **Correct :** le principe de l'iceberg (taille affichée et recharge), le fait que la liquidité
  dépende de la session, et l'adaptation du seuil.
- **Confusion importante :** la méthode montrée (gros volume, POC, Delta, pas de progression)
  détecte de l'**absorption**. Ce n'est pas la preuve d'un iceberg : beaucoup de petits ordres
  limites différents produisent la même image. Seul un carnet ordre par ordre (MBO) ou la
  comparaison exécuté / affiché permet de soupçonner une recharge.
- **Douteux :** « exchanging contracts with itself » pour rééquilibrer ou changer d'échéance. Les
  transactions avec soi-même sont en principe interdites sur le CME, et le changement d'échéance
  passe par des spreads calendaires.
- **Non étayé :** le « 60-70 % », la fréquence et l'avantage ne reposent sur aucune statistique ;
  seulement deux exemples choisis.
- **Promotion forte :**
  - liste d'attente pour la plateforme ;
  - vidéo du « prop firm challenge » promise à 1 000 likes ;
  - « l'avantage va disparaître » parce qu'il en a parlé.

## 6. Transposition au crypto Binance

**Côté données :** Binance Spot accepte nativement des ordres iceberg (paramètre `icebergQty`).
Pour les Futures, c'est à vérifier.

**Approximation honnête sans MBO, appelée « recharge probable » plutôt qu'iceberg.** Sur un prix
exact (tick, pas ligne agrégée), au meilleur ask ou bid :
- volume agressif exécuté à ce prix sur la fenêtre ≥ **k × quantité maximale affichée** (par
  exemple k ≥ 3) ;
- le prix ne franchit pas ce niveau ;
- la quantité affichée **remonte** après chaque baisse dans les 100 à 500 ms suivantes (on compte
  les remontées) ;
- seuil de volume minimal relatif à la session (centile ou z-score), comme le conseille la vidéo.

**Limites :**
- les recharges en moins de 100 ms sont invisibles ;
- impossible de distinguer un iceberg de teneurs de marché qui recotent au même prix ;
- pas de lien entre un trade et un ordre précis ;
- flux de carnet et flux de trades seulement alignés par horodatage ;
- les lignes agrégées de deepflow (`row × bucket`) masquent le tick exact.

## 7. Ce qui manque dans deepflow

Déjà présent : les marques A (absorption) et E (épuisement) de `flowMarks` dans
`shared/footprint.js`. Elles ne regardent que les deux lignes extrêmes de la bougie, uniquement
dans les trades (pas le carnet), avec un seuil fixe de 2,5 × la ligne moyenne.

Classement par utilité pour un débutant :

1. **Marque « recharge »** : nouvelle couche qui croise aggTrades et profondeur au tick (calcul
   côté `server/flow.js`, affichage dans `web/lib/layers`). Elle affiche « ×k exécuté / affiché »
   et compte les remontées. C'est l'outil le plus pédagogique.
2. **Seuil adapté à la session** : le volume minimal d'absorption ou de recharge calculé en
   centile par session Asie / Londres / New York, plutôt que le facteur fixe de `flowMarks`.
3. **Alerte « niveau qui tient »** : X touches au même prix avec un volume cumulé ≥ seuil, à
   ajouter aux alertes existantes (alerte manuelle, pas un signal de trade).
4. **Repère « vide de liquidité »** : une bougie ou une ligne presque vide juste après une cassure
   à très gros volume, mise en évidence sur le footprint (`shared/footprint.js`).
