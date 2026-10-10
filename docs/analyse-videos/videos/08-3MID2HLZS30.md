# 08 — I Analyzed 1.000 "Stop Hunts" with Orderflow… Here's What I Found Out

- Vidéo : https://www.youtube.com/watch?v=3MID2HLZS30
- Durée : 13:16
- Chaîne : Fabervaale ENG
- Présentateur : très probablement Fabio Valentini (il conclut par « ciao » ; non nommé dans la transcription)
- Transcription : ../transcriptions/3MID2HLZS30.txt

## 1. Résumé

La vidéo veut démonter l'idée que « les banques chassent les stops des particuliers ». L'auteur passe en
revue, au footprint, les dépassements de hauts et de bas sur le contrat ES à partir du « 19 mars » (année
non précisée). Sa conclusion : la plupart de ces dépassements ne sont pas des déclenchements de stops
(« stop runs ») mais des **enchères ratées** (le prix dépasse un extrême, personne ne suit, il revient).
Pour lui, la vraie liquidité s'échange dans les zones de consolidation, pas au-delà des extrêmes. Le cadre
vient de Wyckoff (orthographié « wov » dans la transcription) ; il présente ICT comme une redite de ces
idées, « là depuis 100 ans ».

## 2. Outils et indicateurs

- Footprint bid×ask avec déséquilibres (« imbalances ») ; l'agression vendeuse apparaît en violet.
- Delta par bougie (cité : « delta 14 », « 10 % de delta », « delta bien au-dessus de 50 % »).
- Volume total par bougie (« 9k, 12k contrats », « 10k contrats », « 53 000 contrats »).
- Volume profile de la séance, pour montrer où le volume s'est réellement échangé.
- Données MBO (ordre par ordre) citées comme nécessaires pour qualifier certains cas (04:21).
- Aucun réglage donné : ni unité de temps, ni seuil de déséquilibre, ni définition chiffrée d'un « haut ».

## 3. Règles et « étude »

- **Sa définition d'un stop run** (08:12-09:51). Un stop de vente déclenché devient un ordre au marché
  qui frappe le bid et « balaie » le carnet (*book sweeping*) : le mot « run » désigne la vitesse du
  mouvement, pas une chasse. On doit donc voir, au-delà du niveau, beaucoup d'agression d'un seul côté
  (déséquilibres), une bougie très colorée, un delta fort (« bien au-dessus de 50 % ») et un « sprint » :
  des lignes à 0 contrat dans la bougie, le côté opposé presque vide.
- **Ce qui n'en est pas.** Si peu de volume s'échange au-delà du niveau (« 2 000 contrats, des miettes »,
  06:00), ou s'il y a autant de ventes que d'achats (« delta 14 », 02:44), c'est une enchère ratée ou un
  épuisement, pas un stop run.
- **Le stop run n'alimente pas le mouvement suivant.** « 1 000 contrats » au-delà du bas ne financent pas
  un mouvement de plusieurs centaines de milliers de contrats ; la contrepartie ne « carbure » pas le
  mouvement, elle donne seulement un meilleur prix (09:51-10:25).
- **La vraie « prise de liquidité ».** C'est une phase entière d'accumulation ou de distribution sous ou
  au-dessus des extrêmes (11:31-12:03), pas une mèche : « plus le prix passe de temps sous un ou plusieurs
  bas, plus il prend de liquidité ».
- **Dernière bougie de séance.** 53 000 contrats, delta équilibré : il y voit une absorption massive par
  les teneurs de marché, avec sorties des algorithmes intraday et achats « obligatoires par la loi » des
  ETF. C'est une affirmation simplifiée : il s'agit plutôt des ordres à la clôture des fonds indiciels.
- **Affirmation non chiffrée :** « ce schéma a un avantage » (07:39), sans aucune mesure.
- Aucune règle d'entrée, de stop ou de cible : c'est une lecture, pas une stratégie.

**Jugement sur l'« étude des 1 000 ».** **Le chiffre 1 000 n'apparaît nulle part dans la vidéo.** On voit
environ 12 à 15 cas, choisis et commentés à l'œil sur quelques séances d'un seul contrat. Il n'y a :

- aucune statistique, aucun pourcentage, aucun groupe témoin ;
- aucune définition chiffrée de ce qu'est un « haut » (swing de combien de bougies ? haut du jour ?) ;
- aucun seuil de volume ou de delta qui sépare « stop run » et « enchère ratée ».

Il renvoie à une vidéo précédente « appuyée sur des données » (00:32), absente d'ici. Plusieurs cas restent
incertains de son propre aveu : « probablement le FOMC » (04:54), « il faudrait les données MBO » (04:21).
Biais évidents : sélection des cas, lecture après coup, un seul marché, quelques jours. Rien n'est
vérifiable en l'état. Le titre est de l'appât à clics. En revanche, le raisonnement de fond est juste : un
stop déclenché devient un ordre au marché, donc il laisse une trace d'agression, et l'absence de volume
au-delà du niveau contredit l'idée d'une « chasse ».

## 4. Moments clés

- 01:04 — Footprint d'un sommet balayé à 4 h (session Asie) : déséquilibres acheteurs absorbés par des
  vendeurs passifs, lignes à 0 contrat (« sprint »).
- 01:37 — Bas balayé à Londres : peu de delta, peu de déséquilibres. Enchère ratée, pas un stop run.
- 02:11 — Premier stop run probable juste au-dessus d'un haut, vite réabsorbé, puis la hausse continue.
- 02:44 — Cassure d'un haut avec delta 14 : beaucoup de ventes agressives, déséquilibre vendeur au sommet.
- 05:28 — Cassure d'un haut sur une bougie de 10k contrats, bien plus que les précédentes.
- 06:00 — Série de hauts égaux dépassée avec seulement environ 2 000 contrats échangés.
- 06:33 — Volume profile : l'essentiel du volume est dans la consolidation, presque rien au-dessus.
- 07:06 — Dernière bougie de séance : 53 000 contrats, équilibrée.
- 08:46-09:19 — Le vrai stop run : bloc violet de ventes agressives sous les bas, côté droit de la bougie
  vide, delta supérieur à 50 %.
- 10:58 — Cassure sous plusieurs bas : déséquilibres, mais seulement 10 % de delta.
- 12:03 — Phase de consolidation sous plusieurs bas : la « vraie » prise de liquidité (accumulation).
- 12:36 — Bas après le FOMC : très peu de contrats sous le niveau.

## 5. Évaluation critique de la maîtrise

- **Démontré :** la mécanique est bien expliquée et visible à l'écran (ordre stop qui devient un ordre au
  marché, balayage du carnet, effort / résultat, comparaison au volume profile).
- **Affirmé sans preuve :** le « 1 000 » du titre, l'« avantage » du schéma, la vidéo précédente
  « appuyée sur des données ».
- **Approximations :** « liquidations » sur un future CME (10:58), ETF obligés « par la loi » d'acheter à
  la clôture, FOMC seulement supposé.
- **Promotion :** discrète (abonnement à la chaîne, renvoi aux autres vidéos). Ton polémique contre ICT.

## 6. Transposabilité au crypto Binance

- Elle est meilleure qu'au CME. Les trades agrégés donnent le côté agresseur exact : delta, footprint et
  « lignes vides » fonctionnent pareil.
- Les **liquidations** (échantillon) et la **baisse de l'OI** sont des stops forcés observables : c'est une
  preuve directe que Fabio n'a pas sur l'ES, où les stops restent invisibles.
- L'absence de MBO est la même limite que la sienne.
- Il n'y a pas de bougie de clôture en crypto (marché 24 h / 24). Équivalents possibles : 00:00 UTC
  (session deepflow), l'heure du financement, l'ouverture cash de New York.

## 7. Ce qui manque dans deepflow (hors notes.md), par utilité

1. **Bilan au-delà d'un niveau.** Sur une horizontale (ou un haut / bas J-1), afficher le volume, le delta
   et le delta % échangés *au-delà* du prix depuis le franchissement, avec le ratio face au volume moyen
   par ligne de la séance. Implémentation : sommer les lignes du footprint situées au-delà du niveau
   (calcul dans `shared/`, affichage dans `web/lib/layers/drawtools.js`). C'est différent du total d'un
   profil à plage fixe, qui découpe par le temps, pas par le prix.
2. **Zones de hauts / bas égaux.** Regrouper les sommets ou creux pivots distants de moins de N lignes en
   une bande annotée « ×4 ». Implémentation : réutiliser la détection de pivots de `shared/cvd.js`, nouveau
   calque dans `web/lib/layers/`, réglage dans `web/lib/indicators.js`.
