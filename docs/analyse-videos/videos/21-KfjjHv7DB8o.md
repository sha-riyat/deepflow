# 21 — Ultimate Beginner Guide to Pro Trading

- Lien : https://www.youtube.com/watch?v=KfjjHv7DB8o
- Durée : 4:55:45
- Présentateur : l'associé de Fabio Valentini (il parle de « mon partenaire Fabio » ; ce n'est donc probablement pas Fabio lui-même qui présente ; chaîne « World Class Edge » citée)
- Transcription : [../transcriptions/KfjjHv7DB8o.txt](../transcriptions/KfjjHv7DB8o.txt)

Transcription lue en entier (538 lignes). Ses horodatages sont en mm:ss au-delà de 60 min ; ils sont convertis ici en h:mm:ss.

La transcription automatique déforme les noms propres. Corrections probables :
- « Patrick Mill / Nil / Neil » → Patrick Nill ;
- « Tobby Crrael » → Toby Crabel ;
- « Tom Hogart » → Tom Hougaard ;
- « Meil Lynch » → Merrill Lynch.

« Tom Forvault / Forvald / Forvville » et « Enri Costuki » restent incertains.

## 1. Plan de la formation

| Début | Chapitre |
|---|---|
| 0:00:00 | Introduction, références du présentateur, promesses |
| 0:04:21 | Ce qu'est le trading ; définition de l'avantage statistique (« edge ») |
| 0:09:46 | Trois façons d'avoir un avantage : algorithmique, discrétionnaire, hybride |
| 0:15:07 | Styles de trading : scalping et intrajournalier, swing, investissement |
| 0:17:18 | Les 5 questions (quoi, qui, pourquoi, comment, où, quand) ; les participants du marché |
| 0:29:53 | Théorie de l'enchère de liquidité : mécanique du carnet |
| 0:34:47 | Auction Market Theory (AMT) |
| 0:42:27 | Volume profile |
| 0:44:06 | Démonstration DeepCharts : DOM, footprint, types d'ordres |
| 0:50:44 | Teneurs de marché, algorithmes d'appariement, retrait de liquidité aux annonces |
| 1:01:04 | Fondamentaux des actions, dark pools, options, SqueezeMetrics |
| 1:16:28 | Crypto |
| 1:19:47 | Matières premières |
| 1:24:48 | Macro : PIB, emploi, inflation, PMI |
| 1:34:32 | Création monétaire et cycles de dette |
| 1:41:38 | Banques centrales : taux, bilan, QE/QT |
| 2:00:51 | Le cycle économique et ses exemples historiques ; le marché anticipe de 6 à 9 mois |
| 2:14:02 | Obligations et courbe des taux |
| 2:28:15 | Politique budgétaire, dette/PIB |
| 2:36:31 | Forex et carry trade |
| 2:44:08 | Or et argent |
| 2:48:32 | Usages des fondamentaux, rapport COT (fin du tournage du jour 1 à 2:52:59) |
| 2:53:33 | Rotation sectorielle, horloge d'investissement Merrill Lynch |
| 2:56:50 | Liste de contrôle macro, scénarios, « narrative » |
| 3:07:26 | Modèle swing : AMT + COT + sentiment des particuliers |
| 3:16:13 | Day trading, validation statistique |
| 3:24:57 | Cinq stratégies mécaniques |
| 3:31:29 | Lecture de l'order flow |
| 3:46:22 | Enchère de moyen terme : sessions, MOO/MOC, value area |
| 3:57:01 | Synthèse, combinaison ORB et footprint |
| 4:05:11 | Enchères ratées et cassures qualifiées |
| 4:11:16 | Options et grecs |
| 4:37:22 | Couverture dynamique des teneurs de marché, gamma, SqueezeMetrics, SpotGamma |
| 4:52:22 | Conclusion |

## 2. Contenu chapitre par chapitre

**Edge, de 0:07:04 à 0:09:46**
- **Espérance** : elle dépend du taux de réussite (TR) et du rapport gain / risque (R).
- **Profit factor** : somme des gains divisée par la somme des pertes. Il doit dépasser 1.
- **Ligne d'équilibre** : TR = 1 / (1 + R). Avec R = 1, il faut 50 % ; avec R = 2, il faut 33,3 %. Au hasard, on reste sous cette ligne à cause des frais.
- Selon lui, les systèmes algorithmiques font un profit factor de 1,2 à 2.
- **Voie hybride** : des règles mécaniques auxquelles on ajoute son interprétation. C'est celle qu'il recommande aux débutants.

**Styles, à 0:15:07**
- Le day trading demande 4 à 5 h par jour devant l'écran.
- Devenir rentable en moins d'un an est jugé irréaliste.
- Pour quelqu'un qui a un emploi salarié, il conseille le swing.

**Participants**
- **Big money** : banques centrales, fonds de pension…
- **Smart money** : hedge funds, banques d'investissement, firmes HFT. Elle cherche un « alpha d'exécution » avec des algorithmes VWAP, TWAP, participation au volume ou exécution à la clôture.
- **Small money** : particuliers, petites firmes.
- **Teneurs de marché** : ils gagnent le spread.

**Mécanique et AMT**
- **Carnet d'ordres** : limites passives d'un côté, agresseurs de l'autre. Le prix bouge quand un agresseur accepte une offre. Appariement FIFO (premier arrivé, premier servi).
- **Principe de l'AMT** : la smart money préfère les marchés lents et liquides et fractionne ses ordres. Le marché alterne entre balance (« juste valeur ») et déséquilibre (découverte de prix, qu'il rapproche du « fair value gap »). Une enchère ratée est une sortie de la balance suivie d'un retour.
- Pour lui, les figures chartistes sont des « rationalisations ratées » de ce mécanisme.

**DeepCharts**
- Footprint : vert = agresseurs acheteurs, violet = agresseurs vendeurs.
- On lit l'enchère **en diagonale** : il y a toujours un vendeur un tick au-dessus et un acheteur un tick en dessous.
- Le stop est décrit comme un ordre gardé par la plateforme puis exécuté au marché.

**Appariement**
- Deux modèles : FIFO pur, et FIFO avec teneur de marché principal (LMM), avec l'exemple d'une priorité de 40 % du volume agressif réservée au LMM.
- Aux annonces (FOMC, CPI, NFP), les teneurs de marché retirent leurs ordres. Le spread s'élargit, et des colonnes de zéros apparaissent dans le footprint.

**Actions**
- Secteurs cycliques ou défensifs, appétit pour le risque, résultats trimestriels.
- Dark pools « autour de 40 % » du volume.
- Les options 0DTE (expirant le jour même) feraient la majorité du volume.
- La couverture des teneurs de marché d'options ferait 10 à 15 % du volume.
- DIX et GEX (SqueezeMetrics) : GEX positive = volatilité comprimée, GEX négative = volatilité amplifiée.

**Crypto, à 1:16:28**
- Le BTC est un actif risqué, souvent corrélé au S&P, avec un récit de « réserve de valeur ».
- On peut faire de l'analyse on-chain ; les memecoins sont un casino.
- Pour les cryptos liquides, il juge les modèles AMT applicables.

**Macro**
- Indicateurs : PIB, chômage (environ 4 % aux États-Unis, plus de 4 à 5 % est inquiétant), NFP et ADP, CPI, PCE, PPI (qui précède le CPI), PMI.
- Création monétaire par la dette, réserves fractionnaires, monnaie fiduciaire depuis 1971.
- Cycles longs (75 à 100 ans) et cycles courts.
- Fed : fourchette des fed funds, rémunération des réserves (IORB), taux d'escompte. QE et QT agissent sur les réserves bancaires.
- Le marché anticipe l'économie de 6 à 9 mois ; il faut suivre la « narrative » du moment (inflation, tarifs).

**Obligations**
- Prime de risque, prime de terme, courbe des taux.
- Inversion de la courbe 10 ans – 2 ans : précède les récessions selon l'historique FRED.
- Dette/PIB : sain sous 100 % ; hyperinflation au-delà de 100 % par an.

**Forex et or**
- Le forex suit les écarts de taux **anticipés** ; carry trade sur le yen.
- Or : corrélation inverse avec les taux réels (taux 5 ans moins l'inflation anticipée).

**Méthode swing**
- Liste de contrôle : politique monétaire et budgétaire, chômage, inflation, données d'enquête, en regardant leur **vitesse de variation**.
- On construit 3 scénarios, puis on regarde ce que le marché « price » via le DXY, le S&P, les obligations et l'or.
- Une nouvelle donnée confirme le scénario (tendance qui continue, ou « vendre la nouvelle » si tout est déjà intégré au prix), est neutre, ou le contredit (retournement possible).
- Timing : profil à plage fixe tracé du début de la dernière impulsion à maintenant, value area à 70 % (ou 100 %).
- **Break-in** : enchère ratée puis retour vers l'autre bord. **Breakout** : cassure avec volume, puis retest.
- Confirmation par le COT (non-commerciaux, via tradingster) et par le sentiment des particuliers (Myfxbook) pris à contre-pied.

**Validation statistique, à 3:19:29**
- Hypothèse → test sur l'historique (règles fixes d'entrée, stop, cible, avec un tableur) → ajustement raisonnable (par exemple exclure le vendredi) sans surajustement → test en conditions réelles (démo, petit compte, prop firm) → passage en réel.

**Les cinq stratégies**
- **Oops (Larry Williams)** : ouverture au-delà du haut ou du bas de la veille, avec un gap d'au moins 20 points ; entrée quand le prix réintègre le niveau ; stop fixe ou au-delà. Testé sur le DAX de 2012 à 2024.
- **Gap fill (Patrick Nill)** : 65 à 70 % des gaps du S&P seraient comblés, davantage sur le Nasdaq. Entrée sur cassure de structure.
- **ORB** : range des 15 premières minutes après 9:30 heure de New York ; entrée sur clôture d'une bougie 5 min au-delà ; stop de l'autre côté ; cible à R = 2.
- **Règle des 4 (Tom Hougaard)** : après le NFP ou le FOMC, sur DAX et FTSE ; range des 4 premières bougies 5 min, entrée sur sa cassure.
- **PBD** : profil en P (haussier), b (baissier) ou D (range). Variantes : break-in, breakout, retournement sur double cassure, aller-retour entre les bords d'un range.

**Order flow**
- Time & Sales avec filtre à 25 contrats ou plus ; « vitesse du tape ».
- Footprint : la couleur de fond indique le delta horizontal ; le texte coloré signale un déséquilibre diagonal d'au moins 200 % (zéros ignorés).
- Une cellule anormale (1 600 contrats quand les autres en ont environ 100) signale un gros intervenant qui absorbe.
- Valeurs par bougie : volume, delta, delta % (par exemple 957 / 4 000 ≈ 24 %).
- **Enchère responsive** : vert foncé en haut des bougies (absorption), delta % souvent sous 10, volume faible.
- **Enchère initiative** : clusters d'au moins 3 déséquilibres, volume et delta élevés. Pendant un repli, le volume sèche.

**Enchère de moyen terme**
- Session cash 9:30–16:00 heure de New York ; profils séparés pour la session cash et pour la nuit.
- Le volume forme un U : enchère d'ouverture, creux, enchère de clôture. Déséquilibres MOO/MOC publiés sur FinancialJuice.
- Value area à 70 %, assimilée à 1 écart-type. POC = mode du profil ; HVN et LVN = pics et creux.
- On prolonge VAH et VAL sur les sessions suivantes.
- Au début d'une nouvelle balance, la plupart des cassures échouent.
- **Enchère ratée** : volume décroissant hors de la zone, puis volume qui revient en réintégrant.
- **Cassure qualifiée** : volume croissant, puis au retest une absorption ou un épuisement. Une cassure dans le sens de la tendance permet d'être plus agressif.

**Options**
- Calls et puts, diagramme de gains, chaîne d'options, dans / à / hors de la monnaie, straddle.
- Analogie de l'assurance incendie : la volatilité implicite et le temps restant font le prix.
- Grecs : delta, vega, thêta, rho, gamma.
- Teneur de marché court en gamma : il amplifie les mouvements et aide les cassures. Long en gamma : il comprime la volatilité.
- Les 0DTE représenteraient environ la moitié du volume d'options en 2024, ce qui rend la GEX « naïve » (calculée sur l'intérêt ouvert) moins fiable. Il recommande l'outil TRACE de SpotGamma (GEX 0DTE par strike).

## 3. La méthode, pas à pas

1. **Préparation** : choisir son style selon le temps disponible. Valider chaque règle sur l'historique puis en conditions réelles, en tenant un tableur (sens, résultat, date, heure, cibles, confirmations, captures avant / après, notes).
2. **Contexte macro (swing)** : situer le cycle, écrire 3 scénarios, regarder ce que les marchés intègrent déjà, recouper avec le COT et le sentiment des particuliers.
3. **Contexte du jour** : savoir où est la balance (value area de la veille, profil à plage fixe), dans quelle session on est et où le volume se concentre, et s'il y a une annonce à venir.
4. **Zones** : VAH, VAL, POC, LVN, hauts et bas du range d'ouverture, haut et bas de la veille, gap.
5. **Déclencheurs** : la stratégie mécanique (ORB, Oops, gap, règle des 4, PBD), puis une enchère responsive suivie d'une initiative (absorption puis clusters de déséquilibres avec volume en hausse).
6. **Entrée** : à la clôture de la bougie de cassure ou au retest.
7. **Stop** : de l'autre côté du range, ou « généreusement » au-delà de la zone.
8. **Cible** : l'autre bord du range, ou un R de 1 à 3.
9. **Gestion** : presque rien. On place la cible en ordre limite et le stop en ordre stop. Aucune règle de stop au point mort ni de suivi du stop dans cette vidéo.
10. **Psychologie** : renvoyée à une vidéo future.
11. **Journal** : le tableur de test.

**Ce qui manque à la méthode** : aucune règle de taille de position, ni de risque en pourcentage par trade ou par jour.

## 4. Moments clés (h:mm:ss, ce qu'on devrait voir)

- 0:08:40 — Graphe taux de réussite × R avec la ligne d'équilibre et les zones perte / profit.
- 0:31:31 — Animation d'un carnet : achat au marché de 3 BTC servi par niveaux, puis une vente.
- 0:38:08 — Schéma balance → déséquilibre (« fair value gap ») → balance.
- 0:44:06 — DOM avancé DeepCharts sur le contrat ES, profil de volume remis à zéro.
- 0:47:26 — Flux de données coupé : bougie footprint avec 9 / 2 et des 0 en diagonale.
- 0:57:51 — Footprint du FOMC du 17 septembre : colonnes de zéros.
- 1:13:44 — Graphique SqueezeMetrics (S&P, DIX, GEX).
- 2:04:10 — TradingView : S&P, fed funds, inflation et chômage superposés.
- 2:22:42 — Courbe des taux animée, d'avril 2021 jusqu'à l'inversion de 2023.
- 2:26:01 — FRED : écart 10 ans – 2 ans et récessions en gris.
- 2:46:52 — Or contre taux réels à 5 ans.
- 3:10:42 — Profil à plage fixe tracé sur la dernière impulsion du GBPUSD, value area en surbrillance.
- 3:13:58 — Rapport COT sur tradingster.
- 3:20:34 — Tableur de test sur l'historique.
- 3:26:02 — Exemple Oops sur le DAX.
- 3:28:12 — ORB : bougie de 15 min, puis cassure en 5 min.
- 3:29:50 — Schéma des cas P / b / D.
- 3:31:29 — Time & Sales avec filtre à 25 contrats.
- 3:33:06 — Footprint : fond = delta horizontal, texte = déséquilibre diagonal d'au moins 200 %.
- 3:35:52 — Cellule de 1 600 contrats (absorption).
- 3:38:37 — S&P du 21 octobre : zooms sur une phase responsive et une phase initiative.
- 3:49:09 — FinancialJuice : déséquilibres MOO et MOC.
- 3:53:38 — VAH et VAL prolongés, respectés par la session suivante.
- 4:05:45 — Dessin des 4 scénarios autour d'une nouvelle value area.
- 4:50:10 — SpotGamma TRACE : carte de la GEX par strike, zones « chaudes » et « froides ».

## 5. Évaluation critique

**Ce qui est solide** : la mécanique du carnet et des agresseurs, le footprint (diagonale, delta, delta %), la lecture balance / déséquilibre, la ligne d'équilibre de l'espérance, le danger du surajustement, la logique de couverture gamma (vulgarisée correctement), les liens taux réels – or et écarts de taux – forex.

**Erreurs ou approximations**
- La value area à 70 % n'est pas un écart-type. On l'obtient en ajoutant des niveaux autour du POC ; le parallèle avec la courbe de Gauss est une analogie.
- « 0,25 point de base » : il fallait dire 25 points de base.
- La réserve obligatoire de 2 % est un exemple, pas la règle : aux États-Unis elle est à 0 % depuis 2020.
- L'objectif de la Fed est 2 % d'inflation, pas « sous 2 % ».
- Les termes « backwardation » et « contango », qui viennent des contrats à terme, sont mal appliqués à la courbe des taux.
- Les bénéfices ne sont pas « distribués à parts égales » aux actionnaires : seule une partie l'est, sous forme de dividendes.
- « Fiat » ne veut pas dire « foi » en latin, mais « que cela soit ».
- Charles Dow a travaillé à la fin du XIXe siècle, pas au XVIIIe.
- Le dénouement du carry trade sur le yen date d'août 2024, pas 2023.
- L'affirmation que des Juifs auraient « inventé les banques » est historiquement fausse et relève du stéréotype.
- Le seuil de 100 % par an pour l'hyperinflation est une simplification.
- L'exemple de priorité de 40 % au LMM est présenté comme celui du CME. Or l'ES est, à ma connaissance, en FIFO pur : à vérifier.
- Vers 4:42, l'explication de la couverture « short call / short put » se contredit, peut-être à cause de la transcription.
- Sur Fabio, la vidéo dit « 4 fois dans le top mondial à la Robbins Cup », puis « 4 victoires au championnat de scalping » : c'est incohérent.

**Affirmations sans preuve ni source** :
- rendements de « 2 à 4 chiffres » par an ;
- 99 % des captures d'écran seraient fausses ;
- 90 % des traders échouent ;
- 40 % du volume en dark pools ;
- couverture des teneurs de marché = 10 à 20 % du volume ;
- 65 à 70 % des gaps comblés ;
- l'ORB « marche toujours » sur les actions ;
- appel GBPUSD de 4 000 pips ;
- « des centaines de trades avec un taux de réussite élevé » ;
- titres de champion du monde ;
- tests sur l'historique montrés sans méthode (DAX, l'ami « Luke »).

Les cas présentés sont choisis : il le dit lui-même (« un exemple exemplaire »).

**Promotion** : Telegram, sessions en direct « World Class Edge », lancement de DeepCharts avec un bootcamp, DXfeed, FinancialJuice, SqueezeMetrics, SpotGamma, Thinkorswim, OptionStrat, tradingster, Myfxbook, et le palmarès des mentors.

**Absences** : aucune règle de taille de position, de risque maximal par jour ou de gestion après l'entrée ; la psychologie est renvoyée à plus tard.

## 6. Transposition au crypto sur Binance

- **Se transpose directement** : mécanique du carnet, footprint, delta, delta %, absorption et initiative, value area, POC, LVN, enchères ratées, break-in et breakout, profil à plage fixe sur la dernière impulsion. Binance donne le côté agresseur exact. Le retrait de liquidité avant le CPI ou le FOMC s'observe aussi sur BTC.
- **À adapter** : il n'y a pas de session cash. On peut ancrer le range d'ouverture sur l'ouverture de New York (13:30 UTC en été, 14:30 en hiver) ou sur 00:00 UTC. Il n'y a pas de gap en 24/7 : Oops et gap fill n'ont de sens que sur les écarts du CME BTC (le CME a annoncé un passage au 24/7 en 2026, à vérifier). La règle des 4 peut s'appliquer à BTC après le NFP ou le FOMC, mais elle n'a pas été validée sur ce marché.
- **Remplaçants possibles** : sentiment des particuliers → ratios long/short publics de Binance ; COT → rapport CFTC sur les contrats Bitcoin du CME ; GEX → intérêt ouvert des options Deribit, avec les mêmes hypothèses naïves.
- **Ne se transpose pas** : MOO/MOC, DIX et dark pools, 0DTE sur le S&P. La partie macro sert de contexte (le BTC est un actif risqué), sans plus.

## 7. Ce qui manque dans deepflow, du plus au moins utile

1. **Range d'ouverture configurable** (heure et durée, par exemple 15 min à l'ouverture de New York), avec haut, bas et milieu prolongés : un calcul dans `shared/` sur les bougies, ancré sur une heure UTC réglable, à côté de l'IB.
2. **Panneau des ratios long/short Binance** (comptes globaux, top traders, volume acheteur/vendeur agresseur) : interroger côté serveur les endpoints publics `futures/data` toutes les 5 min et les tracer comme l'OI.
3. **Statistiques d'espérance dans le journal** : taux de réussite, R moyen, profit factor, graphe TR × R avec la ligne TR = 1 / (1 + R), et séparation entre trades rejoués et trades réels (« hors échantillon »). C'est un simple calcul sur les entrées existantes, sans aucun test automatique.
4. **Prolonger VAH, VAL et POC d'un profil à plage fixe vers la droite**, avec une value area réglable (70 / 100 %), si ce n'est pas déjà le cas : option du dessin qui projette ses niveaux jusqu'au premier retest.
5. **Cellule anormale du footprint** (volume d'une cellule supérieur ou égal à k fois la médiane des cellules récentes, où qu'elle soit dans la bougie) : un contour sur la cellule, calculé au rendu du footprint.
6. **Fiches d'apprentissage** : (a) enchère et modèle PBD, avec les 4 scénarios et leurs critères de volume ; (b) responsive contre initiative, avec les seuils cités (delta % < 10, au moins 3 déséquilibres) ; (c) espérance, validation et surajustement ; (d) options et gamma. Des pages ajoutées à l'aide intégrée, avec un schéma par fiche.
7. **Fiche « narrative » hebdomadaire dans le journal** (3 scénarios, données attendues, biais, ce que le marché intègre déjà) : un formulaire daté de plus, stocké avec le journal.
8. **Superposition normalisée d'un second symbole Binance** (PAXGUSDT comme approximation de l'or, ETHBTC) pour l'intermarché : une couche de ligne en base 100 depuis le début de la vue.
9. **COT CFTC du Bitcoin CME** (fonds à effet de levier, gérants d'actifs, en net) : récupération hebdomadaire sur l'API publique de la CFTC, affichée en panneau.
10. **Niveaux « gap CME »** : prix Binance aux heures de clôture et de réouverture du CME, tracés en lignes. Utile seulement si le CME n'est pas encore en 24/7 (à vérifier).
11. **GEX naïve par strike à partir de Deribit** : intérêt ouvert et gamma de Black-Scholes, affichés en histogramme latéral, avec un avertissement sur les hypothèses.

## Points ambigus de la transcription

- Les noms propres signalés en tête (Patrick Nill, Toby Crabel, Tom Hougaard, Merrill Lynch ; « Tom Forvault / Forvald / Forvville » et « Enri Costuki » incertains).
- Le chiffre de « 104 » pour l'imbalance MOO (millions de dollars ou nombre d'actions : il hésite lui-même).
- L'explication de la couverture des teneurs de marché vers 4:42, qui se contredit.
- Le nom de la chaîne gratuite (« worldass edge », probablement « World Class Edge »).

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/21-KfjjHv7DB8o/ (nom du fichier = heure de la première image).
- Images clés : ../references/21-footprint-cellule-anormale.jpg, ../references/21-footprint-fond-delta-texte-desequilibre.jpg
