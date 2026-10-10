# 12 — My Top 3 Trades from the Competition

- Lien : https://www.youtube.com/watch?v=0jM5Y31YJak
- Durée : 8:19
- Chaîne : Fabervaale ENG
- Présentateur : Fabio (Fabervaale). Il se nomme lui-même (« Fabio, we are going down », 03:19) et parle de son « business partner » en commentaire en direct.
- Transcription : [../transcriptions/0jM5Y31YJak.txt](../transcriptions/0jM5Y31YJak.txt)

Aucune image (storyboard) n'est disponible pour cette vidéo : la colonne « à l'écran » est déduite du texte seul.

## 1. Résumé

- **Le cadre.** Fabio se présente :
  - trois fois classé au championnat du monde de trading, catégorie day trading ;
  - deux fois vice-champion ;
  - +350 % sur 9 mois.
- **La compétition.** Il l'appelle « quarterly world cup of robins » ; c'est probablement le Robbins World Cup Trading Championship (transcription incertaine).
- **Ce qu'il montre réellement.** Malgré le titre, il décrit **une seule séance** :
  - le NASDAQ (NQ) « en train de s'effondrer » ;
  - le 30 décembre (« if I'm not wrong »), dans les derniers jours de la compétition ;
  - au coude-à-coude avec un concurrent, « Nazaran » (nom incertain) ;
  - environ 5 à 6 positions short, présentées comme sa séance la plus rentable de la compétition.
- **Méthode.** Il veut montrer la différence entre regarder le prix seul et ajouter le volume :
  - le CVD (cumulative volume delta : achats agressifs moins ventes agressives, cumulés) ;
  - la « volume spread analysis » (effort / résultat : pression du volume comparée au déplacement du prix) ;
  - l'indicateur propriétaire « deep trades » / « big trades » de DeepCharts ;
  - le footprint en profil delta.
- **Découpage en « 3 trades ».** Le découpage ci-dessous est **mon interprétation** : le contenu ne correspond pas proprement à trois trades.

## 2. Outils / indicateurs et réglages

- **Volume profile** tracé sur la zone d'équilibre (00:33, 01:40) : la juste valeur au milieu, pas de direction claire.
- **CVD** comparé au prix (01:40–02:13). Pendant que le prix reste dans l'équilibre, le CVD baisse fortement : « pression qui se construit ». Il appelle cela « distribution ».
- **« Deep trades model » / « big trades » (02:45).** Indicateur « en développement dans notre plateforme propriétaire », censé montrer « où les gros pousseront le prix ». Il apparaît sous deux noms. Aucun seuil ni réglage n'est donné ; on peut supposer un affichage des gros ordres agressifs, comparable aux « Deep Trades » de la vidéo Pz8f0wWW12M (gros ordres sommés par niveau), mais ce n'est pas dit ici.
- **« Delta profile footprint » avec le CVD (06:36–07:10).** Footprint en profil delta, utilisé pour lire l'effort / résultat d'une bougie précise.
- **Non précisé.** Unité de temps, couleurs, seuils.

## 3. Stratégies / règles concrètes — les trades

### Contexte de la séance (00:00–03:19)
- Vers « 12, heure d'Europe centrale » (phrase confuse : « almost uh 12 uh central central European time »), avant le départ de la séance, le marché est en équilibre.
- Il tente de casser par le haut, puis par le bas. Un trader qui ne regarde que le prix est « confus » et attend.
- Le CVD, lui, montre une forte pression vendeuse avant la cassure : « le volume précède le prix ». C'est son « premier jalon » ; la confirmation big trades est le second.

### Trade 1 — cassure d'un équilibre, avec renforts (03:19–05:30)
- **Contexte.** CVD en baisse dans l'équilibre (« distribution »).
- **Déclencheur.** La première bougie où le volume « suit » (big trades vendeurs) et où le prix confirme la cassure par le bas : première position short.
- **Stop.** Au-delà de la zone (« the first stop loss was here », 04:24) : le niveau n'est pas chiffré.
- **Gestion.**
  - Le marché « explose » dans son sens : stop remonté au point mort immédiatement.
  - Quand une nouvelle confirmation vendeuse arrive, soit il clôture la position 1 et en ouvre une nouvelle financée par son gain, soit il renforce dans le sens de la tendance.
  - Positions 2 et 3 ajoutées.
- **Sortie.** Tout est clôturé dans la « deuxième phase d'accumulation », quand les big trades « ne poussent plus le prix vers le bas » (« redistribution »).
- **Résultat.** Il annonce un gain de 1 pour 3 à 1 pour 5 sur la position 1 (« almost 1 to three even more 1:5 »), sans montant.

### Trade 2 — reprise après redistribution (05:30–06:36)
- **Budget de risque.** Il prend une partie des gains et remet « la moitié de ces gains » en risque.
- **Déclencheur.** Nouvelle cassure du prix et big trades dans le sens de la tendance.
- **Justification.** Selon la théorie des enchères (AMT), c'est un « sell model day », une journée vendeuse.
- **Sortie.** « Another huge take profit ». Il compte « cinq positions différentes », suivies (trailing) au fil du mouvement.
- **Ambigu.** Stop et prix non donnés. Il dit avoir « clôturé la séance vers 4 », sans dire l'heure exacte.

### Trade 3 — absorption sur un rebond (06:36–08:00)
- **Contexte.** Le marché casse vers le bas. Les acheteurs tentent un retracement ; les big trades vendeurs « tiennent ».
- **Déclencheur (07:10).** Footprint en profil delta et CVD : sur une bougie précise, la pression acheteuse (delta) est nette mais le résultat en prix est « presque zéro ». Les acheteurs « tapent dans un mur » : c'est l'effort / résultat de la VSA.
- **Entrée.** Short (« again a short position »).
- **Gestion.** À l'approche du plus bas du jour, les gros vendeurs continuent de pousser : il met « le risque à zéro » (stop au point mort).
- **Sortie.** Take profit au plus bas du jour. Pas de nouvelles positions le soir, car il était déjà en très gros gain.
- **Ce qui manque.** Aucun prix, stop en ticks, taille ou P&L chiffré n'est donné.

### Règles générales de gestion
- Garder un drawdown très faible.
- Construire le gain de la journée, puis ne risquer que ce gain.
- Chercher les séances « explosives ».
- Pyramider dans le sens de la tendance avec le stop au point mort.
- Sortir quand les gros cessent de pousser.

## 4. Moments clés horodatés

| Temps | Ce qu'on devrait voir à l'écran |
|---|---|
| 00:00 | Présentation : classements et +350 % en 9 mois |
| 00:33 | NQ en équilibre avant la séance ; tentatives de cassure des deux côtés |
| 01:40 | Volume profile tracé sur la zone d'équilibre, juste valeur au centre |
| 02:13 | CVD en forte baisse pendant que le prix reste plat (« distribution ») |
| 02:45 | Le CVD est retiré, passage à la vue Deep / Big Trades |
| 03:19 | Bougie de cassure avec gros trades vendeurs : première entrée short |
| 04:24 | Premier stop montré, puis déplacé au point mort ; zone de clôture de la position 1 (1 pour 3 à 1 pour 5) |
| 04:57 | Positions 1, 2 et 3 marquées ; clôture dans la 2e accumulation |
| 05:30–06:03 | Redistribution, puis nouvelle cassure avec big trades vendeurs ; nouveau short |
| 06:36 | Retracement acheteur ; big trades vendeurs qui tiennent |
| 07:10 | Footprint en profil delta et CVD, zoom sur la bougie d'absorption (delta acheteur, prix immobile) |
| 07:43 | Approche du plus bas du jour, stop au point mort, take profit au plus bas |
| 08:16 | Conclusion, appel aux commentaires |

## 5. Évaluation critique

- **Démontré.** Une seule séance particulièrement favorable (tendance baissière nette), choisie comme la meilleure de la compétition. Lue après coup.
- **Rétrospectif.** Le CVD qui « baisse dans l'équilibre » est lu après la cassure ; on ne voit pas les fois où ce signal a échoué.
- **Rien de vérifiable.**
  - Les gains de 1 pour 3 à 1 pour 5 sont donnés de mémoire (« if I'm not wrong »).
  - Les +350 % et les classements ne sont pas vérifiables dans la vidéo.
  - Un compte de compétition pousse à prendre des risques élevés : ce n'est pas un modèle de gestion du risque pour un compte réel.
- **Contradiction.** « Top 3 trades » ne correspond pas au contenu : une seule séance, environ 5 à 6 positions.
- **Vocabulaire Wyckoff.** Accumulation, distribution et redistribution sont employés de façon floue : la « deuxième phase d'accumulation » d'un mouvement baissier serait plutôt une pause ou une redistribution. Aucun critère objectif n'est donné.
- **« Le volume précède le prix ».** Affirmé comme une loi.
- **Promotion.** Forte pour l'indicateur propriétaire « Deep / Big Trades », présenté comme un « edge » sans définition (seuil, regroupement, affichage).
- **Ce qui est solide (déjà dans notes.md).**
  - L'idée d'effort / résultat : delta acheteur sans progression du prix = absorption.
  - Le stop au point mort suivi d'un trailing.
  - Le renforcement dans le sens de la tendance.

## 6. Transposabilité au crypto Binance

- **Bonne.** Le CVD, le footprint en profil delta et les gros prints existent dans deepflow, avec le côté agresseur exact.
- **Différences.**
  - **Pas de séance cash.** Il n'y a pas d'« équilibre avant l'ouverture » au sens CME : il faut raisonner sur les sessions UTC (Asie / Londres / New York) ou sur une zone d'équilibre choisie à la main.
  - **« Big trades » sur Binance** = trades agrégés regroupés. Un gros acteur peut fragmenter son ordre par algorithme ; à l'inverse, une cascade de liquidations produit de « gros prints » qui ne sont pas des décisions volontaires.
  - **En perpétuel**, une baisse du CVD peut venir de liquidations de longs : à croiser avec le panneau liquidations, l'open interest (OI) et le CVD spot / perp. Si le CVD spot ne suit pas, la pression vendeuse est moins solide.
- **Gestion.** La règle de pyramidage avec stop au point mort se transpose, mais il faut compter les frais et le financement pour les positions longues (le coût du financement est déjà noté dans notes.md).

## 7. Ce qui manque dans deepflow (absent de notes.md), par utilité

Déjà présents (donc non listés) : CVD de session et divergences CVD, gros prints, footprint en profil delta, marques A (absorption) et E (épuisement), outil position long / short (R:R), journal.

1. **CVD ancré au clic.** Un outil de dessin, comme le VWAP ancré, qui remet le CVD à zéro au début d'une zone d'équilibre et le trace en surimpression ou dans un sous-panneau.
   - Calcul : `shared/cvd.js`.
   - Outil : `web/lib/drawings/tools.js`, `web/lib/drawings/editor.js`.
   - Dessin : `web/lib/layers/drawtools.js`.
2. **Outil position avec renforts et point mort.** Permettre plusieurs entrées dans un même dessin long / short : prix moyen, stop commun déplaçable au point mort, risque restant, gain réalisé par tranche. Fichiers : `web/lib/drawings/editor.js`, `web/lib/layers/drawtools.js` (fonction `position`).
3. **Budget de risque du jour dans le journal.** Afficher le P&L réalisé de la journée et un « risque autorisé » égal à une fraction réglable des gains (par exemple 50 %). Ce n'est qu'un affichage, sans blocage ni ordre ; préférence dans `web/lib/store.ts`.
4. **Delta des gros prints par bougie.** Un sous-panneau qui somme, par bougie, les gros prints acheteurs moins vendeurs. Il servirait à voir quand « les gros ne poussent plus ». Calcul avec les gros prints du collecteur (`server/flow.js`), panneau dans `web/lib/chart/panes.js`.
5. **Superposition prix / CVD normalisés.** Les deux courbes ramenées à la même échelle (min / max de la plage visible) pour repérer « prix plat, CVD en baisse ». Les divergences actuelles (`web/lib/layers/divergence.js`) ne comparent que les sommets et les creux.
6. **Repère « zone d'équilibre ».** Un rectangle tracé à la main qui affiche à la fois le profil de la zone, le CVD de la zone et le delta des gros prints. Il élargit le « total/delta d'un profil à plage fixe » déjà noté dans notes.md.
7. **Fiche d'aide Wyckoff (accumulation, distribution, redistribution).** Dans `web/lib/help/flow.js` : critères observables (CVD, OI, gros prints, profil), limites de ce vocabulaire, et le piège des liquidations en perpétuel.

## Points ambigus

- **Découpage en « 3 trades ».** Non explicite : une seule séance, environ 5 à 6 positions.
- **Heures.** « 12 heure d'Europe centrale » (avant le départ de quelle séance ?) et « clôturé la séance vers 4 » (16 h ? fuseau non précisé).
- **Noms.** Celui du concurrent (« Nazaran ») et celui de la compétition (« world cup of robins ») sont probablement mal transcrits.
- **Indicateur.** « Deep trades » et « big trades » désignent apparemment le même outil ; son fonctionnement n'est pas expliqué.
- **Chiffres approximatifs.** Le R:R de la position 1 (« almost 1 to three even more 1:5 ») et la date (« if I'm not wrong, 30 of December ») sont incertains.
- **Wyckoff.** « Deuxième phase d'accumulation » dans un mouvement baissier : usage du terme discutable ou mal transcrit.

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/12-0jM5Y31YJak/ (nom du fichier = heure de la première image).
