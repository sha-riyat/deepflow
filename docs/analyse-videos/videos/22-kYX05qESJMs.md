# 22 — I Got Funded 150.000$ with This Strategy

- Vidéo : https://www.youtube.com/watch?v=kYX05qESJMs
- Durée : 29:59
- Chaîne : Fabervaale ENG
- Présentateur : l'auteur parle à la première personne (ses propres challenges de prop firm) ; son
  nom n'est pas prononcé dans la transcription.
- Transcription : [../transcriptions/kYX05qESJMs.txt](../transcriptions/kYX05qESJMs.txt)
- Pas d'images extraites pour cette vidéo : ce qui est « à l'écran » est déduit du texte.

## 1. Résumé

L'auteur raconte quatre mois de challenges de prop firm sur le **ES** (futures CME), avec trois
stratégies :

- **stop run** : la principale, « mécanique » ;
- **iceberg** : « mécanique » aussi ;
- **divergence d'order flow** : plus discrétionnaire.

Il décrit une étude manuelle de 349 trades, puis un forward test réel avec un risque moyen de 0,20 %.
Il est **disqualifié deux fois** chez OneUp :

- une position restée ouverte après 15:15 un jour férié ;
- une position « fantôme » qu'il attribue à un bug Rithmic et qu'il qualifie d'arnaque, ce qui reste
  son allégation.

Il passe ensuite à The Trading Pit. Il obtient le contrat, mais le premier retrait est **plafonné à
900 $**. Il conclut qu'il abandonne les prop firms pour des options chez Schwab.

**Le titre « funded 150 000 $ » est donc trompeur** : il y a bien un contrat, mais quasiment aucun
gain retirable.

## 2. Les stratégies, pas à pas

### A. Stop run (ES, session de Londres seulement)

- **Contexte** : liquidité faible. Les stop runs « n'existent pas » à New York, où ce sont des
  absorptions. Il critique au passage la lecture ICT / SMC (cassure, retest d'un *fair value gap*,
  puis tendance toute la séance).
- **Mécanisme** : les ordres au marché vident le carnet au-delà d'un haut ou d'un bas (*book
  sweeping*). Un trou de liquidité reste derrière, donc le chemin le plus facile est le retour. C'est
  un trade très court, pas un retournement de séance.
- **Qualification**, signalée par un **indicateur propriétaire DeepCharts** (qui donne aussi le
  nombre de contrats) :
  - **pic de volume** par rapport aux bougies précédentes (exemple : 300 → 169 → 1 200) ;
  - **delta ≥ environ 1/3 du volume** de la bougie (« au moins 1/3 d'agression nette ») ;
  - volume **> 1 300 contrats** ;
  - **avant 7:00 heure de New York** ;
  - de préférence, balayage d'un **haut ou d'un bas important** ;
  - **seulement en phase d'épuisement**, jamais au début d'une impulsion (son erreur à −800 $,
    10:18).
- **Entrée** : **à la clôture de la bougie**, à contre-sens : achat après un balayage sous des bas,
  vente après un balayage au-dessus de hauts.
- **Stop** : juste derrière l'extrême.
- **Cible** : **le début du stop run**.
- **Gestion** : prendre l'essentiel au premier objectif (TP1), passer le stop au point mort, laisser
  parfois un contrat courir vers le **VWAP**. Re-tenter si un second balayage plus net suit.
- **Ambiguïté** à 05:22 : il dit « bullish stop run » puis « je vends au sommet ». Il veut sûrement
  dire un balayage par le haut.

### B. Iceberg (Londres)

- **Signe** : le prix pousse sur **un seul tick** et les acheteurs y sont absorbés, le niveau se
  recharge. Exemples : 2 000 à 3 000 contrats sur un tick, contre 200 à 300 contrats par minute en
  moyenne à Londres ; ou « 283 / 75 contrats », « 75 absorbés, déséquilibre 165, POC au sommet ».
- **Confirmation** : heatmap et footprint, plus l'indicateur de « clusters de volume » de DeepCharts
  (promu).
- **Entrée** : **1 tick devant l'iceberg**, **stop 1 tick derrière**, cible de 2 ou 3 ticks.
- **Répétition** : rejouer à chaque retour, **1 à 3 fois**, puis arrêter, car il attend une
  « momentum ignition » qui finit par traverser le niveau.
- **Variante préférée** : niveau cassé, puis iceberg sur le retest.
- **Interdit** : à New York, où l'iceberg est « traversé comme du beurre ».
- Il dit ne pas avoir eu besoin de backtest, la figure étant rare et souvent observée.

### C. Divergence d'order flow (ouverture de New York, discrétionnaire)

- Absorption à un extrême (beaucoup de volume au bas ou au haut des bougies).
- **Divergence du CVD** : la jambe de prix a moins de delta que la précédente.
- Prix sur la **2e bande σ du VWAP**, parfois la 1re ; zone de volume.
- Puis bougie d'**initiative** à fort delta (exemple : 7 000 contrats), où il entre.
- **Stop suiveur** derrière le dernier bas, ou derrière une **grappe de déséquilibres** : si elle
  casse, il sort.
- **Cible** : l'autre côté du VWAP.
- Il ré-entre après un stop si la divergence se confirme.

Mentionné une seule fois : un setup de comblement de gap (*gap fill*) avant l'ouverture de New York.

### Risque et règles prop

- 0,20 % en moyenne par trade.
- 10 à 15 contrats (ES ou MES : non précisé).
- 95 $ de commission « à chaque fois ».
- Règle de constance (*consistency*) de la prop firm.
- Pas de position après 15:15.
- Iceberg : 1 à 3 trades, puis arrêter.

## 3. Outils

- DeepCharts.
- Statistiques par bougie (volume, delta).
- Indicateurs propriétaires « stop run » (qui donne aussi la taille de position) et « volume
  clusters ».
- Heatmap, footprint.
- CVD.
- VWAP et ses bandes σ.
- Journal tenu sous tableur avec : volume, taille de bougie, delta, cible atteinte ou non, MAE
  (excursion défavorable maximale), trois types de cibles.

## 4. Moments clés (écran déduit du texte)

- 01:36 — schéma du balayage du carnet.
- 04:51 — rangée de stats sous les bougies (volume, delta ≥ 1/3).
- 06:27 — iceberg « 75 / 165 / POC ».
- 06:59 — journal de 349 trades, filtre à 1 300 contrats.
- 07:32 — filtres « avant 7:00 » et « haut important » (80 %).
- 09:44 — iceberg 283 / 75, 15 contrats.
- 10:18 — erreur en début d'impulsion.
- 12:35 — bougie de delta 7 000 sur la 2e σ du VWAP.
- 14:46 — erreur de clic : achat au lieu de vente.
- 18:57 — sortie sur la grappe de déséquilibres.
- 19:30 — bilan de phase 1 : 52 % de réussite, profit factor (PF) de 1,2.
- 20:02 — disqualification pour 15:15.
- 21:04 — iceberg de 1 800 contrats.
- 23:54 — position « fantôme ».
- 27:43 — retrait plafonné à 900 $.
- 27:43 à 28:17 — statistiques globales.

## 5. Évaluation critique

- **Le plus concret de la série** : seuils chiffrés, horaires, erreurs avouées, courbe de résultats.
- Mais la démarche relève du **sur-ajustement** : filtres choisis après coup sur l'échantillon, et
  l'on passe de 48–55 % à 66 %, puis 80 % sur un sous-ensemble. **Il n'y a pas de test hors
  échantillon séparé** ; il appelle forward test le compte réel.
- En réel, le résultat est modeste (52 %, PF 1,2 en phase 1).
- Le bilan final est **incohérent tel que transcrit** : « 34 000 $ de gains, 50 000 $ de pertes,
  profit factor 2,2 ». C'est impossible ; il s'agit probablement de 15 000 $ de pertes.
- Des pertes de 800 à 1 000 $ par trade semblent loin de 0,20 % de 150 000 $ (300 $).
- Plus d'une centaine de trades sur 4 mois, avec un gain de 10 % et un drawdown maximal de 2,15 % :
  c'est invérifiable.
- **Promotion** : indicateurs DeepCharts « bientôt disponibles » (lien de pré-inscription), OneUp,
  The Trading Pit, Schwab.

## 6. Transposabilité au crypto Binance

- **Stop run ≈ cascade de liquidations** : bonne analogie, avec le delta en % et les liquidations.
- Mais le **seuil de 1 300 contrats et « Londres » ne se transposent pas tels quels** : il faut
  recalibrer en BTC ou en $ et par heure (creux de l'Asie, week-end).
- **Iceberg** : il n'y a pas de flux ordre par ordre (MBO) ; on ne peut déduire qu'une recharge
  probable.
- **Pour les scalps de 2 ou 3 ticks** : avec un tick de 0,1 sur BTCUSDT et des frais preneur
  d'environ 0,04 à 0,05 %, une cible de 2 ou 3 ticks est **mangée par les frais**. Il faut une cible
  en lignes regroupées, ou ne pas faire ce scalp.
- **Divergence + VWAP** : bien transposable.
- **Gap** : il n'existe pas sur les perpétuels (seulement sur le futur CME BTC, absent des données
  Binance).
- Il n'y a pas de clôture : la règle 15:15 devient une **heure limite personnelle** ou le **prochain
  financement**.

## 7. Comment deepflow peut aider (absent de `notes.md`)

Classé du plus utile au moins utile. Une vérification dans le code a montré qu'une piste de mon
premier rapport existe déjà ; elle est signalée en fin de liste.

1. **Journal enrichi automatiquement** à l'enregistrement d'un trade :
   - instantané du volume, du delta en % et du multiple de volume à l'entrée ;
   - heure UTC et heure de New York ;
   - MAE et MFE (excursions défavorable et favorable maximales) calculées depuis les trades archivés
     entre l'entrée et la sortie.

   Aujourd'hui une entrée n'a que : date, symbole, marché, sens, entrée, stop, cible, sortie, R,
   setup, notes (`shared/journal.js`). Ajouter les champs dans `cleanEntry` et l'export CSV ; les
   remplir depuis `shared/barstats.js` ; MAE et MFE via une requête au collecteur
   (`server/queries.js`).
2. **Étiquettes d'erreur dans le journal** (hors horaire, début d'impulsion, mauvais sens, hors plan)
   avec le coût cumulé de chaque type d'erreur. Simple champ à choix, plus une somme en R dans les
   statistiques. Fichiers : `shared/journal.js`, `web/lib/journal.ts`.
3. **Position avec sorties partielles** (TP1 sur x %, reste vers une cible liée au VWAP du moment),
   dessinée par l'outil position. La cible se recalcule à chaque mise à jour du VWAP. Fichiers :
   `shared/drawings.js` (types `long` / `short`, 3 points aujourd'hui), `shared/measures.js`,
   `web/lib/layers/drawtools.js`.
4. **Compteur de touches d'une horizontale** (nombre de retours au niveau et volume échangé à chaque
   passage), pour la règle « 1 à 3 fois puis stop ». Calcul sur les bougies chargées, affiché dans
   l'étiquette du dessin `hline`.
5. **Volume au tick rapporté au volume moyen par minute de la session**, affiché dans l'infobulle du
   footprint, pour juger si une recharge est une anomalie. Cela complète les seuils par session de
   `notes.md`. Fichiers : `shared/footprint.js`, `web/lib/layers/footprint.js`.
6. **Avertissement frais / cible** dans l'outil position : si la cible est inférieure à x fois les
   frais aller-retour, afficher un message. Les frais sont déjà calculés par l'outil position
   (`shared/measures.js`).
7. **Alerte d'heure limite** : une position dessinée reste ouverte après l'heure de fin choisie, ou
   avant le prochain financement. Fichiers : `server/alerts.js` ou alerte locale côté navigateur.

Limite à faire valider : comparer plusieurs cibles hypothétiques sur des trades passés, comme le fait
l'auteur, ressemble à un backtest. Je ne le propose donc pas sans accord du propriétaire.

Déjà présents :

- Le **multiple de volume par rapport aux bougies précédentes** (« Vol. × », moyenne des 20
  précédentes) et le **delta en %** sont déjà dans le panneau de statistiques par bougie
  (`shared/barstats.js`, `web/lib/chart/statspane.js`). Ce sont les deux critères chiffrés du stop
  run (pic de volume, delta ≥ 33 %) : il suffit de les lire, sans nouveau développement.
- Liquidations, CVD et divergences CVD, VWAP ±1/2/3σ, heatmap, footprint, marques d'absorption :
  la stratégie de divergence se prépare déjà avec les outils existants.

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/22-kYX05qESJMs/ (nom du fichier = heure de la première image).
- Images clés : ../references/22-stats-sous-bougies-stop-run.jpg
