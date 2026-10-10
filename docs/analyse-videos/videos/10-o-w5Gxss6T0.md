# 10 — 3 Order-flow Trading Tricks Exposed!

- Vidéo : https://www.youtube.com/watch?v=o-w5Gxss6T0
- Durée : 8:35
- Chaîne : Fabervaale ENG
- Présentateur : Fabio Valentini (il se présente par son palmarès ; nom non prononcé dans la transcription)
- Transcription : ../transcriptions/o-w5Gxss6T0.txt

## 1. Résumé

Courte vidéo promotionnelle pour le lancement de DeepCharts, sur le NQ. Trois « astuces » :

- lire le delta et le volume chiffrés de chaque bougie ;
- remplacer le « fair value gap » d'ICT par le creux de volume d'un profil à plage fixe ;
- lire la « pression » via la relation entre le CVD et le prix.

Fabio y annonce « plus de 500 % sur 12 mois » et « classé 4 fois » à la compétition la plus célèbre.

## 2. Outils et indicateurs

- « Order flow values » : delta et volume total affichés sous chaque bougie, avec couleur selon
  l'agression.
- Filtre petits / gros traders (« filtrer les petits traders du smart money »).
- Profil à plage fixe tiré d'un point A à un point B, avec value area à 70 % et **bougies masquées**
  (« removing the price action »).
- CVD (delta cumulé), présenté comme indicateur de « pression ».
- Aucun réglage donné (unité de temps, seuil du filtre).

## 3. Règles

- **Astuce 1, absorption puis cassure (19 septembre 2025, 01:07-03:25).** Les acheteurs défendent 24 800,
  les vendeurs 24 825-24 826. Plusieurs poussées acheteuses sont absorbées : 599 de delta pour 2 800 de
  volume, puis 332 depuis le bas. Vient ensuite une bougie record (« all-time high » de volume : 4 600, avec
  812 de delta). Il en conclut qu'une cassure à la hausse va suivre, et le prix « décolle » sans revenir
  dans la zone. **Ce passage est ambigu.** Une absorption par les vendeurs annonce plutôt un rejet ; ici il
  en tire une cassure, sans dire quelle règle les départage (probablement l'agression record qui finit par
  passer, mais ce n'est pas dit).
- **Astuce 2, le « vrai » fair value gap (03:25-05:06).** Tracer un profil à plage fixe sur l'impulsion
  A→B et masquer les bougies. Dans la value area, la ligne de plus faible volume (24 318-24 317, un seul
  tick, « même pas une zone ») est le vrai déséquilibre, et le prix y rejette « des milliers de fois ». Ce
  dernier point n'est pas chiffré.
- **Astuce 3, la pression (05:06-08:24).** Le CVD fait un plus bas plus bas alors que le prix reste au même
  niveau : c'est une absorption par des acheteurs passifs. Avec une enchère ratée, cela donne un long et le
  biais du jour. En tendance, une bougie vendeuse qui tente un plus bas sans résultat (« toute cette
  pression, zéro résultat ») signale une entrée dans le sens de la tendance. Il ne donne ni stop ni cible.

## 4. Moments clés

- 00:00 — Palmarès annoncé (plus de 500 % sur 12 mois).
- 01:07 — Zone 24 800 / 24 825 sur le graphique en bougies.
- 01:40-02:51 — Valeurs delta / volume colorées sous les bougies : 599 / 2 800, puis 812 / 4 600.
- 02:51 — Le prix casse et ne revient pas dans la zone défendue ; annonce du lancement de DeepCharts.
- 03:25 — Bougies avec « fair value gap » au sens price action.
- 03:59-04:33 — Profil à plage fixe A→B, bougies masquées, creux à 24 317-24 318.
- 06:11-06:43 — CVD en plus bas plus bas, prix à plat : absorption.
- 07:51 — Absorption vendeuse en tendance : bougie qui tente un plus bas sans résultat.

## 5. Évaluation critique de la maîtrise

- **Démontré :** les concepts sont corrects et montrés à l'écran (valeurs delta / volume, profil à plage
  fixe, divergence CVD / prix).
- **Faible :** trois exemples choisis après coup, aucune règle de stop ou de cible, aucune statistique. La
  logique de l'astuce 1 n'est pas expliquée.
- **Affirmé sans preuve :** les rejets « des milliers de fois », les 500 %.
- **Promotion :** c'est surtout une publicité (« save your spot » pour DeepCharts).

## 6. Transposabilité au crypto Binance

- Tout est faisable sur Binance : delta et volume exacts grâce au côté agresseur des trades agrégés,
  profil à plage fixe, CVD.
- Le volume réparti par ligne de prix suffit pour trouver le creux de volume ; pas besoin de MBO.
- Choisir une taille de ligne (`row × bucket`) assez fine : un creux « d'un seul tick » dépend fortement
  du regroupement des prix.

## 7. Ce qui manque dans deepflow (hors notes.md), par utilité

1. **Creux de volume dans la value area d'un profil à plage fixe.** Aujourd'hui, `vp()` dans
   `web/lib/layers/drawtools.js` n'affiche que le POC, la VAH et la VAL. Il faut y appeler `volumeNodes` /
   `drawNodes` (`shared/auction.js`, `web/lib/layers/levels.js`, déjà utilisés pour les profils de
   session), plus un repère sur la ligne de plus faible volume entre la VAL et la VAH.
2. **Divergence d'« absorption » au CVD.** `cvdDivergences` (`shared/cvd.js`) exige un nouvel extrême du
   prix. Il faut ajouter un type où le prix fait un creux égal ou plus haut (à N lignes près) pendant que le
   CVD fait un plus bas plus bas, et l'inverse aux sommets ; affichage dans
   `web/lib/layers/divergence.js`.
3. **Option « masquer les bougies »** pour lire un profil seul, en un clic (`web/lib/layers/candles.js`,
   préférence dans `web/lib/store.ts`).
4. **Bougie record de la séance.** Marquer la bougie dont le volume (ou le |delta|) est le plus élevé
   depuis le début de la session UTC (panneau statistiques par bougie, `web/lib/chart/panes.js`).
