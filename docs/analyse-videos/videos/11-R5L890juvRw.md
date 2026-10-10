# 11 — The Indicator Banks ACTUALLY Use - Full Guide to VWAP

- Lien : https://www.youtube.com/watch?v=R5L890juvRw
- Durée : 10:31
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription. C'est probablement Fabio (Fabervaale) : plateforme « my platform », formule « ciao » à la fin.
- Transcription : [../transcriptions/R5L890juvRw.txt](../transcriptions/R5L890juvRw.txt)

Aucune image (storyboard) n'est disponible pour cette vidéo : la colonne « à l'écran » est déduite du texte seul.

## 1. Résumé

- **Point de départ.** Les banques, fonds et grands acteurs traitent des montants énormes. S'ils achetaient d'un coup, ils feraient monter le prix contre eux. Ils découpent donc leurs ordres en petits morceaux, injectés progressivement par des algorithmes. Il appelle cela l'« execution alpha » : l'avantage gagné sur la qualité d'exécution.
- **Le VWAP.** Le VWAP (volume weighted average price, prix moyen pondéré par le volume) serait l'algorithme le plus courant.
- **Le parallèle avec la cloche.** Il compare :
  - la courbe en cloche (loi normale) ;
  - la value area d'un volume profile, qu'il présente comme « 1 écart-type, 68 %, arrondi à 70 % » ;
  - le VWAP et ses bandes d'écart-type.
- **Lecture proposée.**
  - Sous le VWAP : zone « discount » (bon marché).
  - Au-dessus : zone « premium » (cher).
  - Cette lecture serait plus objective que le premium / discount à 50 % d'une impulsion façon ICT.
  - Les bandes d'écart-type seraient les prix « optimaux » où les institutions remplissent leurs ordres fragmentés.
- **Démonstration.** Plusieurs sessions sur son graphique DeepCharts, avec VWAP de session et bandes.

## 2. Outils / indicateurs et réglages

- **Menu DeepCharts (05:53).** « Volume by Price values » → « vwap » → « developing vwap ».
- **Ancrage.** Le VWAP repart de zéro « à chaque nouvelle session » (06:26). Il ne précise pas laquelle : Globex, cash ou jour calendaire.
- **Autres périodes.** Il cite un VWAP journalier et un VWAP hebdomadaire comme références d'exécution (« daily vwap or the weekly vwap », 04:48).
- **Bandes (07:32) : passage ambigu.** Il dit textuellement « the first standard deviation is one, the second here is 1.5 standard deviation, usually I just keep it at two which is the third, and even the third standard deviation ». Lecture la plus probable : bandes à 1σ, 1,5σ (qu'il passe d'habitude à 2σ) et 3σ.
- **Non précisé.** Couleurs, unité de temps du graphique, méthode de calcul de l'écart-type.
- **Contexte d'exécution (01:04, 04:16).**
  - Un tableau oppose algorithmes « price driven » et « volume driven ».
  - Les algorithmes VWAP (pilotés par le volume) conviendraient aux ordres de longue durée, de 30 min à 1 jour.
  - Le volume suit une courbe en U dans la journée : pic à l'ouverture, creux au milieu, remontée vers la clôture.
- **Heatmap (00:32).** Zoomée, elle montrerait souvent de petits ordres « parfaitement cadencés », signe d'exécution fragmentée.

## 3. Stratégies / règles concrètes

- **Rôle du VWAP (06:26–07:32).**
  - Le VWAP sert de support / résistance dynamique.
  - Loin du VWAP, le prix tend à y revenir. À la cassure, il le reteste souvent une ou deux fois avant de partir. Parfois il le traverse sans réagir.
  - À l'ouverture de New York, il est souvent testé plusieurs fois une fois la « juste valeur » établie.
- **Rôle des bandes (07:32–08:05).**
  - Elles donneraient des niveaux de rebond « très précis ».
  - Plus le prix va loin dans les bandes extérieures, plus un retour vers la juste valeur serait probable.
  - Il y a un peu de résistance sur la 1re bande, davantage sur la 2e.
  - En tendance forte, le marché continue pourtant d'acheter à des prix élevés (« premium ») : le VWAP « ne marche pas toujours ».
- **Il faut un contexte (08:05–08:38).** Ne jamais trader le VWAP seul.
- **Scénario long (08:38) : passage ambigu.**
  1. Biais acheteur décidé avant la séance.
  2. Ouverture de New York « sur la juste valeur », puis le prix monte.
  3. Attendre que le prix atteigne au moins la 1re, voire la 2e bande. Il ne dit pas laquelle : haute ou basse.
  4. Des ordres et du volume s'accumulent « en dessous » ; le VWAP s'infléchit un peu vers le bas.
  5. Après cassure puis retest (on comprend : du VWAP), on prend le long.
  6. Cibles : 2e et 3e bande.
- **Retournement (09:11).**
  - Les bandes extérieures servent de zones de surachat / survente, calculées sur le volume de toute la session et pas seulement sur le prix passé.
  - La cible est le VWAP central : retour à l'équilibre.
- **Exemple de baisse (09:11).** La session ouvre en baisse jusqu'aux bandes basses : « c'est là qu'il faut chercher un trade, le prix le plus intéressant de la session ». Le sens n'est pas clair : il dit « we shorted out of the market », mais l'idée semble être un achat dans les bandes basses.
- **Session en cours (09:44).** Elle « respecte » les niveaux : pic jusqu'au VWAP, test de la 1re bande, passage par toutes les bandes jusqu'à la dernière, retour vers la 1re, retest du VWAP, etc.
- **Absents.** Aucun stop, aucune taille de position, aucun chiffre de résultat. Il conseille seulement de « backtester ».

## 4. Moments clés horodatés

| Temps | Ce qu'on devrait voir à l'écran |
|---|---|
| 00:32 | Heatmap zoomée : petits ordres réguliers (« parfaitement cadencés ») |
| 01:04 | Tableau des types d'algorithmes d'exécution (price driven / volume driven) |
| 01:37–02:40 | Courbe en cloche ; volume profile avec value area surlignée |
| 02:40 | Schéma : VWAP comme ligne centrale |
| 03:12–03:44 | Schéma premium / discount façon ICT (50 % d'une impulsion), comparé au VWAP |
| 04:16 | Image de la courbe de volume intraday (pic à l'ouverture et à la clôture) et du tableau des durées d'ordres (30 min à 1 jour) |
| 05:20 | Schéma des bandes ±1σ et ±2σ autour du VWAP |
| 05:53 | Menu DeepCharts « Volume by Price → VWAP → Developing VWAP » |
| 06:26 | Vue dézoomée : le VWAP repart à chaque session, rejets et retests |
| 07:00 | Nouvelle session après une forte baisse : ouverture de New York, double test du VWAP, rebond en fin de session ; après Londres, le VWAP sert de résistance |
| 07:32 | Activation des bandes (1 / 1,5 ou 2 / 3σ) ; rebonds sur les bandes |
| 08:38 | Scénario long expliqué sur le graphique |
| 09:11 | Session ouverte en baisse jusqu'aux bandes basses |
| 09:44 | Session en cours : passages de bande en bande et retests du VWAP |
| 10:16 | Conclusion, appel à backtester, like / follow |

## 5. Évaluation critique

- **Démontré.** Seulement des exemples choisis après coup sur quelques sessions. Aucune statistique (fréquence de retour au VWAP depuis chaque bande), aucun stop, aucun résultat chiffré.
- **Erreurs ou approximations.**
  - **« Le VWAP est en gros une moyenne mobile ».** C'est faux : le VWAP est une moyenne cumulée depuis une ancre (début de session), pas une fenêtre qui glisse.
  - **« La value area = un écart-type (68 %) ».** Les 70 % sont une convention de Steidlmayer, pas un écart-type. Un profil n'est souvent pas une cloche (double distribution, forme P ou b), et les bandes σ n'ont donc pas de sens probabiliste strict. La distribution des prix n'est pas normale.
  - **Ce que font vraiment les algorithmes VWAP.** Un algorithme VWAP vise à **égaler** le VWAP (référence de performance) : il répartit l'ordre selon la courbe de volume habituelle. Il ne cherche pas à exécuter sur la bande −1σ.
  - **Les bandes, prix « optimaux » des banques ?** L'idée qu'un desk compare son prix moyen au VWAP du jour existe. Mais l'idée que les bandes seraient les prix d'exécution « optimaux » des banques est affirmée sans preuve.
  - **Ordres cadencés.** Les petits ordres réguliers de la heatmap ressemblent plutôt à du TWAP (découpage dans le temps) ou à de la participation, pas forcément à du VWAP.
- **Affirmé, non vérifié.** « Les institutions font bouger le marché » et « les bandes ont une raison plus profonde que Bollinger ». La réaction aux bandes peut aussi venir du simple retour à la moyenne ou de l'auto-réalisation (beaucoup de traders les regardent).
- **Promotion.** Légère : like / follow et « my platform » (DeepCharts).
- **Backtest.** Le conseil est sain, mais deepflow exclut volontairement le backtest de l'application : il faudrait passer par le replay manuel.

## 6. Transposabilité au crypto Binance

- **Calcul.** Identique ; le volume Binance est complet (chaque trade agrégé, côté agresseur exact).
- **Pas de session.** Le crypto tourne 24 h/24, il n'y a pas d'ouverture de bourse. deepflow remet le VWAP à zéro à 00:00 UTC (jour, semaine ou mois). Pour reproduire la vidéo, il faudrait un VWAP ancré à l'ouverture de New York (13:30 UTC, ou 14:30 UTC en hiver).
- **Rythme du volume.** Pas de clôture : la courbe intraday du crypto a ses pics à l'ouverture US et autour des heures de financement (00:00, 08:00, 16:00 UTC).
- **Exécution institutionnelle.** Elle existe en crypto (TWAP, OTC), mais le rôle de « référence des banques » est encore moins établi.
- **Spot ou perpétuel.** Leurs VWAP diffèrent ; il faut savoir lequel on regarde.
- **Conclusion.** La lecture VWAP ± bandes comme repère de valeur dynamique se transpose bien, avec les mêmes réserves.

## 7. Ce qui manque dans deepflow (absent de notes.md), par utilité

Point de départ vérifié dans le code :
- **VWAP de période.** Jour / semaine / mois UTC. Choix de bandes fixes : ±1σ, ±1/2σ, ±1/2/3σ ou aucune (`web/lib/indicators.js`, `vwap.period` et `vwap.bands` ; dessin dans `web/lib/layers/vwap.js`).
- **VWAP ancré.** Le dessin n'affiche que la ligne, le nom à l'ancre et la dernière valeur sur l'axe, **sans bandes** (`web/lib/layers/drawtools.js`, fonction `avwap` ; `web/lib/layers/drawings.js`).

Manques, par utilité :
1. **Bandes sur le VWAP ancré.** Cumuler Σpv, Σp²v et Σv depuis l'ancre, comme `vwapStart` / `drawVwap` dans `web/lib/layers/vwap.js`, et tracer ±1/2/3σ. Le réglage se ferait dans l'éditeur de dessin (`web/lib/drawings/editor.js`).
2. **VWAP ancré sur une session.** Ajouter « ouverture New York », « Londres », « Asie » aux choix de `vwap.period` (`web/lib/indicators.js`), en réutilisant les heures des sessions déjà définies (`sessions`, `web/lib/layers/times.js`, `web/lib/clock.js`).
3. **Multiplicateurs de bandes libres.** Aujourd'hui seuls 1, 2 et 3 sont proposés. Implémentation : trois valeurs numériques (par exemple 1 ; 1,5 ; 2) à la place des choix fixes de `vwap.bands`, enregistrées dans les préférences (`web/lib/store.ts`).
4. **Distance au VWAP en écarts-types.** Une pastille « +1,7σ » près de l'axe des prix, calculée comme (prix − VWAP) / σ de la période, ou une petite ligne dans un panneau optionnel (`web/lib/chart/panes.js`).
5. **Pente du VWAP.** Colorer la ligne selon sa pente sur N bougies : vert si elle monte, rouge si elle baisse, gris si elle est plate. Cela reprend « the VWAP going down a little bit ». Fichier : `web/lib/layers/vwap.js`.
6. **Courbe de volume intraday moyenne (volume relatif par heure).** Un panneau qui compare le volume de chaque tranche de 30 min à la moyenne des N derniers jours à la même heure UTC. Calcul côté collecteur à partir de l'historique Binance Vision (`server/`, fonction partagée dans `shared/`).
7. **VWAP des jours précédents prolongé.** La valeur finale du VWAP J-1 tracée en ligne horizontale jusqu'à son retest, comme les POC non testés.
8. **Marque « ordres cadencés » (TWAP probable).** Détecter dans les trades agrégés une suite de tailles quasi identiques à intervalle régulier, et la marquer comme les gros prints. C'est une observation, pas un signal ; analyse dans `server/flow.js`.
9. **Fiche d'aide « VWAP ≠ moyenne mobile ».** Dans `web/lib/help/levels.js` : moyenne cumulée depuis une ancre, rôle de référence de performance des algorithmes d'exécution, limites des écarts-types (distribution non normale).

## Points ambigus

- **Réglage des bandes (07:32).** « 1 / 1.5 / usually 2 / 3 » : l'ordre exact et le nombre de bandes affichées restent incertains.
- **Session de référence du VWAP.** Non précisée : Globex, cash New York ou jour calendaire.
- **Scénario long (08:38).** La bande à atteindre (haute ou basse) et ce qui est « cassé puis retesté » (VWAP ou bande) ne sont pas explicites.
- **Exemple de 09:11.** « We shorted out of the market » : le sens du trade proposé (achat dans les bandes basses ?) n'est pas clair.
- **Tableau des algorithmes (01:04, 04:16).** Son contenu exact n'est pas lu à l'oral ; sans image, on ne connaît que « price driven » / « volume driven » et la durée de 30 min à 1 jour.

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/11-R5L890juvRw/ (nom du fichier = heure de la première image).
