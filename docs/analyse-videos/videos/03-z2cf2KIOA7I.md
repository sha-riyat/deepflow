# 03 — Full MBO Orderflow Guide (EP3)

- Vidéo : https://www.youtube.com/watch?v=z2cf2KIOA7I
- Durée : 11:02
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription (auteur de la chaîne)
- Transcription : [../transcriptions/z2cf2KIOA7I.txt](../transcriptions/z2cf2KIOA7I.txt)

Remarque : aucun outil DeepCharts nommé ; « des plateformes comme celles-ci » sont annoncées pour un
épisode ultérieur. Artefact de montage : la formule de fin (« ciao ») apparaît dès 00:32.

## 1. Résumé de ce qui est enseigné

- **Accroche** (00:00) : il paie « 1 400 $ par an » un flux **MBO** (Market by Order) qui montre chaque
  ordre, gros ou petit.
- **Rappel** (00:32-01:38) : liquidité passive (buy limits au bid, sell limits à l'ask, best bid / best
  ask) et agressive ; le prix bouge là où les derniers ordres s'exécutent.
- **MBP contre MBO** (01:38-02:44) :
  - **MBP** (Market by Price) : quantité totale posée et exécutée par niveau ; 100 contrats peuvent être
    1 ordre de 100, 2 de 50 ou 100 de 1 ;
  - **MBO** : chaque ordre individuel avec sa taille ; on verrait « avec bien plus de précision comment les
    gros acteurs, la smart money, manipulent le flux ».
- **Algorithmes d'appariement** (02:44-06:02) :
  - **FIFO** (premier entré, premier sorti) : au best bid, ordres de 15, 5 et 35 contrats posés dans cet
    ordre ; un agresseur est servi d'abord par le 15, puis le 5, puis une partie du 35. Le plus courant ;
  - **FIFO avec LMM** (Lead Market Maker, teneur de marché principal) : un acteur sous contrat avec la
    bourse garantit de la liquidité à chaque niveau et obtient en échange une priorité d'exécution ;
  - modèle du teneur de marché : gagner 1 tick par aller-retour (12,5 $ sur l'ES) ; meilleur cas : prix
    immobile ou en range ; pire cas : prix directionnel et volatil ;
  - les teneurs de marché retirent leurs ordres dans les millisecondes avant et après les annonces (NFP,
    CPI) : carnet presque vide, d'où les mouvements violents ; renvoi au site du CME.
- **Identifiants** (06:02-06:34) : chaque ordre agresseur et chaque ordre posé ont un identifiant, ce qui
  permet de relier les ordres entre eux.
- **Ordres iceberg** (06:34-08:11) : un gros ordre (exemple 2 000 contrats) dont seule une pointe (exemple
  20) est visible et rechargée à chaque exécution, pour ne pas effrayer le marché. Exemple enregistré :
  36 contrats visibles, des centaines exécutés, recharge permanente ; « beaucoup de petites bulles »
  puis le marché abandonne et repart.
- **Iceberg natif ou synthétique** (08:11-09:52) :
  - **natif** : même identifiant dont la quantité est mise à jour, fourni par la bourse ; plus facile à
    repérer par les autres ;
  - **synthétique** : ordres distincts ajoutés à la file, construits par le gros acteur ; on ne peut pas
    être sûr à 100 % que c'est un iceberg.
- **Conclusion** (09:52-10:57) : le MBO sert surtout aux scalpeurs du carnet et de la microstructure ; pour
  un débutant ou un trader intraday, « 100 $ par mois pour ce seul flux est un peu excessif ».

## 2. Outils, graphiques et réglages montrés

- Flux **MBO** (décomposition d'un niveau en ordres individuels).
- **Carnet** avec la quantité affichée et **bulles de trades** au niveau de l'iceberg (enregistrement de
  sa plateforme, 07:06).
- Schémas : file d'attente au best bid, aller-retour du teneur de marché, iceberg.
- Aucun réglage, seuil, couleur ni unité de temps cité.

## 3. Stratégies ou règles concrètes

- **Face à un iceberg natif** : vendre au marché plutôt que se mettre derrière en limite, car « on serait
  en fin de file et jamais exécuté ».
- **Face à un iceberg synthétique** : poser un ordre limite au même niveau ; les recharges passent derrière
  nous, on a des chances d'être servi et on gagne **1 tick**.
- **Gestion** : stop 1 tick au-dessus de l'iceberg ; le tick gagné améliore le rapport gain / risque
  (« 1:3, 1:4 » contre « 1:2 » — passage confus, les chiffres ne sont pas reliés clairement à une cible).
- **Schéma** : nombreuses petites bulles au niveau, absorption, puis retournement ; le trading détaillé de
  ce schéma est renvoyé à un épisode ultérieur.
- **Filtre** : réservé aux scalpeurs expérimentés ; inutile pour des déclencheurs intraday ordinaires.

## 4. Moments clés horodatés (vérification visuelle)

- 00:00 — accroche sur le flux MBO payant.
- 01:05 — rappel : bougie qui tourne au vert après 5 contrats exécutés.
- 01:38-02:11 — 100 contrats en MBP contre décomposition MBO (40, 10, 10…).
- 02:44-03:50 — file au best bid : 15, 5, 35 et l'agresseur servi en FIFO.
- 04:22-04:54 — schéma du LMM qui achète au bid et revend à l'ask, 1 tick.
- 05:28 — carnet vide autour des annonces (explication orale ; image à confirmer).
- 06:02 — identifiants d'ordres agresseurs et posés.
- 07:06-07:39 — iceberg enregistré : 36 contrats visibles, centaines exécutés, recharge.
- 07:39 — petites bulles puis retour du prix vers le haut.
- 08:11-09:19 — schéma natif / synthétique et file d'attente.
- 09:52 — schéma du R:R gagné d'un tick.

## 5. Évaluation critique de la maîtrise

**Correct ou démontré**
- Différence MBP / MBO bien expliquée.
- FIFO (priorité prix puis temps) ; existence au CME d'algorithmes avec LMM.
- Modèle économique simplifié du teneur de marché ; retrait de liquidité autour des annonces (phénomène
  réel et observable).
- Principe de l'iceberg et exemple enregistré.
- Honnêteté finale : le MBO n'est pas prioritaire pour un débutant.

**Erreurs ou incohérences**
- **Calcul FIFO** : « agresseur de 23 contrats → reste 18 → reste 13 ». Le calcul ne tombe juste qu'avec
  **33** (33 − 15 = 18, 18 − 5 = 13). Erreur de parole ou de sous-titre.
- **Prix** : « 1 400 $ par an » puis « 100 $ par mois ».
- **Décomposition** : 40 + 10 + 10 ne font pas 100 ; exemple laissé incomplet.
- **Natif contre synthétique (douteux)** : au CME, quand la partie visible d'un iceberg natif est
  rechargée, elle perd sa priorité et repasse en fin de file. Se placer derrière un iceberg natif n'est
  donc pas forcément inutile ; la règle pourrait être inversée. À vérifier avant toute reprise.
- **LMM** : « autorisé à se retirer seulement dans cette petite fenêtre » simplifie fortement des
  obligations de cotation exprimées en pourcentage de présence.
- Teneur de marché qui « gagne un tick par transaction » : simplification (rabais, risque de sélection
  adverse, gestion d'inventaire).

**Simplement affirmé**
- « Chaque ordre agresseur a un identifiant » dans le flux public : plausible, non vérifié ici.
- « Voir comment la smart money manipule le flux » : affirmation sans démonstration.
- « Avantage informationnel énorme sur les autres traders » : non chiffré.

**Promotion**
- Abonnement au flux mis en avant dès l'accroche ; plateformes annoncées « très bientôt ».

## 6. Transposabilité au crypto Binance

- **Pas de MBO public** sur Binance : ni identifiants des ordres posés, ni position dans la file, ni
  repérage d'un LMM. La décomposition d'un niveau en ordres individuels est impossible.
- **Partiellement possible** :
  - les trades agrégés regroupent les exécutions d'un **même ordre agresseur à un même prix** ; on
    connaît donc en partie la taille des ordres agressifs (deepflow les regroupe déjà en « gros prints ») ;
  - **icebergs** : le spot Binance accepte des icebergs natifs (paramètre `icebergQty`) ; les perpétuels
    USDⓈ-M n'en proposent pas à ma connaissance (à vérifier). Un ordre caché ou rechargé reste détectable
    par heuristique MBP : volume exécuté à un niveau bien supérieur à la baisse de la quantité affichée,
    quantité qui se reconstitue d'une mise à jour à 100 ms à l'autre. Estimation sans certitude ;
  - **appariement** : Binance applique en principe la priorité prix puis temps (à confirmer) ;
  - **retrait de liquidité** autour du CPI ou du FOMC : visible sur la heatmap et le spread.
- **Impossible** : savoir si un iceberg est natif ou synthétique, connaître sa place dans la file,
  observer les annulations entre deux mises à jour de profondeur.

## 7. Ce qui manque dans deepflow (par utilité pour un débutant)

Déjà présent : bulles de trades, gros prints, heatmap, DOM, marques d'absorption (A) dans le footprint,
alertes « mur ». Le README indique que le carnet (heatmap, DOM) n'est pas disponible en replay.

1. **Marque « recharge / iceberg probable »** au best bid ou au best ask : volume exécuté au niveau
   supérieur à k × la quantité affichée, niveau toujours présent après les exécutions. Calcul dans
   `server/flow.js`, dessin dans la couche des bulles (`web/lib/layers/`), fiche d'aide dans
   `web/lib/help/flow.js` qui précise que c'est une estimation (pas de MBO sur Binance).
2. **Enregistrement local du carnet pour le replay** : écrire sur disque des instantanés compressés de la
   heatmap ou du DOM côté serveur (à côté de `server/replay.js`), pour revoir un iceberg ou un mur comme
   le fait la vidéo (07:06).
3. **Repères d'annonces macro** (CPI, NFP, FOMC) en lignes verticales : liste de dates éditable, à côté de
   la fiche « Repères horaires » (`web/lib/help/levels.js`) et des sessions déjà dessinées.
4. **Fiche d'aide « File d'attente et appariement (FIFO) »** : expliquer la priorité prix puis temps,
   pourquoi la file n'est pas visible sur Binance, et ce qu'un iceberg y change ; article dans
   `web/lib/help/flow.js`.
