# 13 — My Favorite Orderflow Indicator: Beginners Guide to CVD

- Lien : https://www.youtube.com/watch?v=Ni6quY00dcw
- Durée : 14:15
- Chaîne : Fabervaale ENG
- Présentateur : celui de la chaîne (non nommé dans la vidéo) ; plateforme : DeepCharts (non nommée ici, mêmes
  footprints que dans la vidéo 07)
- Transcription : ../transcriptions/Ni6quY00dcw.txt

Images : aucune vignette n'est disponible pour cette vidéo. Les descriptions d'écran viennent uniquement de la
narration.

## 1. Résumé

La vidéo fait partie de la série sur l'order flow. Elle définit :

- le **delta** d'une bougie : volume exécuté à l'ask moins volume exécuté au bid ;
- le **delta %** : delta divisé par le volume, multiplié par 100 ;
- le **CVD** (cumulative volume delta) : la somme des deltas au fil des bougies.

Selon le présentateur, ce n'est « pas un oscillateur, c'est de l'order flow brut ». Il explique deux familles de
divergences entre le prix et le CVD :

- **divergence d'absorption** : le prix ne casse pas, le CVD casse ;
- **divergence de manque de participation (épuisement)** : le prix casse ou égale, le CVD ne suit pas.

Il insiste sur trois limites :

- le CVD mesure à la fois l'agression et l'absorption ;
- les divergences ne valent qu'à **court terme** (1 min, quelques oscillations), pas sur une séance entière ;
- il faut toujours les replacer dans le contexte du footprint. Exemple : une bougie à fort delta acheteur dont les
  acheteurs ont été absorbés par un iceberg (gros ordre caché qui se recharge) annonce une **poursuite** de la baisse,
  pas un retournement.

## 2. Outils et réglages exacts

- **Footprint** bid × ask : partie gauche = vendeurs agressifs exécutés sur les acheteurs passifs (bid), partie
  droite = acheteurs agressifs exécutés sur les vendeurs passifs (ask).
- **Formule** (01:39) : delta = ask − bid. Exemple : ask = 5 + 1 + 2 + 3 = 11, bid = 15, volume = 26, delta = −4.
  Le delta % = delta / volume × 100 donne « environ 15 % » (−15,4 % exactement).
- **Indicateur « orderflow values »** (03:17), sous chaque bougie : volume total, delta, delta %.
- **CVD affiché en bougies** (04:58) : chaque bougie du CVD a une ouverture, un plus haut, un plus bas et une clôture
  du delta cumulé pendant la bougie. Il le choisit « parce que c'est plus facile à lire » que la ligne.
- **Unité de temps** : 1 min pour les divergences (11:03).
- **Moment d'usage** : début de session (12:08).
- La remise à zéro du CVD n'est pas précisée (**ambigu**) : les exemples restent à l'intérieur d'une séance.

## 3. Règles concrètes et patterns

- **Bougie d'initiative** : |delta %| d'au moins **10 %**. C'est « ma façon de juger », un seuil personnel. Exemple
  d'initiative typique : 26 % (03:17). Une bougie à 4 % n'est « pas vraiment déséquilibrée » (03:51).
- **Divergence dans la bougie** : bougie haussière avec un delta faible, ou bougie baissière avec un delta acheteur.
  « Quelque chose commence à changer dans l'enchère » (03:51).
- **Contexte avant tout** (04:25) : une bougie à fort delta acheteur dont les acheteurs sont absorbés à un niveau
  signifie que les vendeurs gardent le contrôle. Il évoque aussi une « momentum ignition » des acheteurs (tentative
  d'allumage de tendance) avant qu'ils abandonnent.
- **Divergence d'absorption** (05:31–07:11) :
  - le prix ne fait pas de plus bas plus bas, alors que le CVD en fait un ;
  - variante : le prix monte alors que les creux du CVD descendent ;
  - lecture : les vendeurs font l'effort de pousser, mais des acheteurs passifs absorbent tout.
  - Signature d'un **iceberg** : le prix bute toujours au même niveau pendant que le CVD continue de monter
    (08:49–09:23).
- **Divergence de manque de participation (épuisement)** (07:44–08:49) :
  - le prix fait un plus bas égal ou plus bas, mais le CVD ne descend pas autant : moins d'effort, moins d'intérêt ;
  - exemple explicite avec des **creux égaux** du prix et un CVD bien différent ;
  - même chose au sommet : épuisement des acheteurs.
- **Stop run / enchère ratée** (09:56) : le CVD monte fortement, car il y a à la fois beaucoup d'agression et
  beaucoup d'absorption, puis le prix se retourne.
- **Règle générale** (10:29) : « le CVD veut toujours dire agression ET absorption ». Il faut toujours le replacer
  dans le contexte du prix.
- **Horizon** (11:03–11:35) : seulement des divergences de court terme. Une séance entière qui baisse pendant que le
  delta monte n'oblige pas le marché à remonter : cela peut simplement vouloir dire que l'activité institutionnelle
  était surtout passive.
- **Entrée** : après une divergence d'absorption, attendre la **bougie d'initiative** suivante. C'est « le premier
  signal d'achat » (07:11) ou « peut être un signal d'entrée » (13:48).
- **Stop et cible** : non donnés.
- **Exemple de début de session** (12:08–13:14) :
  - POC de bougie au plus haut, delta acheteur, case très verte, donc iceberg vendeur qui absorbe ;
  - malgré la « divergence », il lit de la **force vendeuse**, à la fois agressive et passive, donc poursuite à la
    baisse ;
  - toute la séance est baissière.

## 4. Moments clés horodatés

- 01:05 — rappel du footprint : côté bid, côté ask.
- 01:39 — formule du delta et exemple chiffré (11 / 15 / 26 / −4).
- 02:12 — delta % ≈ 15 %.
- 03:17 — ajout des « orderflow values » sous les bougies ; initiative à 26 %.
- 03:51 — bougie de vente avec 4 % de delta acheteur ; règle des 10 %.
- 04:25 — fort delta acheteur absorbé ; momentum ignition.
- 04:58 — CVD en bougies sous le graphique.
- 05:31 — bougie de 1 min qui a bougé de 8 ticks seulement (pic sur faible liquidité) ; première divergence
  d'absorption.
- 06:38 — prix qui monte, creux du CVD qui descendent.
- 07:11 — bougie d'initiative = premier signal d'achat.
- 07:44 — creux égaux du prix, CVD divergent : manque de participation.
- 08:49 — schéma « absorption » (pas de plus haut pour le prix, plus haut pour le CVD) ; iceberg.
- 09:23 — schéma « manque de participation ».
- 09:56 — schéma « stop run ».
- 10:29 — agression ET absorption.
- 11:03 — critique des divergences sur 5 ou 6 oscillations ou sur une séance entière.
- 12:08 — début de session, iceberg vendeur.
- 13:14 — fin de session : divergence, convergence, nouvelle divergence, puis bougie d'initiative = entrée.
- 13:48 — appel aux retours de « backtest ».

## 5. Évaluation critique

**Correct**

- Les formules du delta et du delta %, et le calcul de l'exemple.
- La distinction entre divergence d'absorption et divergence d'épuisement.
- L'avertissement que le CVD mêle agression et absorption.
- L'avertissement sur les divergences de long terme, très sain : il contredit beaucoup de contenus en ligne.
- Le contre-exemple de l'iceberg, qui montre la limite d'une lecture mécanique.

**Approximations**

- « Environ 15 % » pour −15,4 %, sans le signe.
- La remise à zéro du CVD n'est pas précisée.
- Le passage 06:38 est confus (« why if price is rising the pressure is actually sellers? »).

**Affirmé sans preuve**

- Le seuil de 10 % : présenté comme personnel, mais jamais mesuré.
- « L'activité institutionnelle passive » comme explication des divergences d'une séance entière : plausible, non
  démontré.
- Les exemples sont choisis après coup.

**Promotion** : faible (playlist, abonnement).

## 6. Transposabilité au crypto Binance

- **Delta exact** : les aggTrades donnent le côté agresseur, le delta et le CVD sont donc exacts **par plateforme**.
- **Fragmentation** : le CVD Binance perp ne voit ni le spot ni les autres plateformes. Une « divergence » peut venir
  d'un flux ailleurs. deepflow a déjà le CVD spot / perp et le CVD multi-plateformes pour vérifier.
- **Liquidations** : ce sont des ordres au marché forcés. Elles gonflent le delta au moment des stop runs, ce qui
  colle au schéma de 09:56. À croiser avec le calque des liquidations.
- **Bruit** : le 1 min est bruité par les robots, et les petits altcoins sont peu liquides. Il vaut mieux des pivots
  un peu plus larges ou du 1–3 min.
- **Séance** : pas de « session » au sens CME. Le CVD de deepflow repart à zéro à minuit UTC
  (`shared/cvd.js`, `sessionCvd`). Pour son usage « début de session », un CVD ancré à l'ouverture de Londres ou de
  New York serait plus proche (voir notes.md : « CVD ancré au clic »).

## 7. Ce qui manque dans deepflow (absent de notes.md), par utilité

Vérifié dans `shared/cvd.js`, `web/lib/layers/divergence.js`, `web/lib/chart/panes.js`, `shared/bars.js`,
`web/lib/indicators.js` et `web/lib/help/flow.js`.

1. **CVD en bougies.** Le panneau CVD de `panes.js` est une ligne, et les bougies de `shared/bars.js` ne gardent pas
   les extrêmes du delta cumulé pendant la bougie (seulement `b` et `s`). Piste :
   - dans `shared/bars.js`, suivre le delta courant de la bougie et garder ses plus haut et plus bas (`dh`, `dl`) à
     chaque trade ;
   - dans `panes.js`, style « bougies » du CVD : ouverture = CVD de la bougie précédente, plus haut et plus bas
     = ouverture + `dh` / `dl`, clôture = CVD ;
   - réglage du style dans le menu du panneau.
2. **Divergences dessinées aussi dans le panneau CVD.** Aujourd'hui, `drawDivergences` ne trace le segment que sur
   le prix. Piste : réutiliser `cvdDivergences` dans le panneau CVD pour relier les deux sommets ou creux du CVD.
   C'est ce que fait la vidéo, et c'est bien plus lisible pour un débutant.
3. **Sensibilité réglable et distance maximale entre pivots.** `cvdDivergences(items, cvd, k = 5)` a un pivot fixe et
   relie deux pivots quelle que soit la distance qui les sépare dans la séance. Piste : `OPTIONS.div` dans
   `indicators.js` avec k (2 / 3 / 5 / 10) et un écart maximal (par exemple 30 bougies). Cela applique la règle
   « court terme seulement » de 11:03.
4. **Creux et sommets égaux avec une tolérance.** `cvdDivergences` exige un nouveau plus bas strict
   (`items[i].l < items[lastLow].l`), alors que l'exemple de 07:44 utilise des creux égaux. Piste : tolérance en
   lignes (`row × bucket`) dans `shared/cvd.js`, plus un test unitaire.
5. **Marque « bougie divergente »** : bougie haussière à delta négatif ou baissière à delta positif, ou |delta %|
   sous un seuil sur une bougie de grande amplitude. Piste : fonction pure dans `shared/measures.js` et petite marque
   sous la bougie (calque `marks.js` ou cellule du panneau Statistiques).
6. **Seuil d'initiative réglable** : surligner la case « Delta % » du panneau Statistiques quand |delta %| atteint un
   seuil (10 % par défaut d'après la vidéo). Attention, l'aide `web/lib/help/panes.js` dit « plus de 30 % » : à
   harmoniser ou à expliquer (le seuil dépend de l'unité de temps).
7. **Compléter la fiche d'aide « Divergences CVD »** (`web/lib/help/flow.js`, entrée `div`). Ajouter :
   - les deux familles (absorption : le prix tient, le CVD casse ; épuisement : le prix casse, le CVD ne suit pas) ;
   - « le CVD = agression ET absorption » ;
   - le piège des divergences sur une séance entière ;
   - le contre-exemple de l'iceberg (fort delta absorbé = poursuite).

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/13-Ni6quY00dcw/ (nom du fichier = heure de la première image).
- Images clés : ../references/13-cvd-divergence-absorption.jpg, ../references/13-cvd-en-bougies.jpg, ../references/13-valeurs-sous-bougies-delta-pct.jpg
