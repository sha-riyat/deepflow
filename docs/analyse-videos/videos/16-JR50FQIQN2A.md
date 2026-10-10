# 16 — EXPOSING How Banks Hide their Trades

- Lien : https://www.youtube.com/watch?v=JR50FQIQN2A
- Durée : 30:15
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la vidéo ; présumé Andrea (même narrateur que la vidéo 15). Il cite
  Enrico Stucky, Fabio Valentini (« mes mentors en order flow ») et Carmine Rosato.
- Transcription : ../transcriptions/JR50FQIQN2A.txt

Avertissement : sous-titres automatiques, horodatages par blocs (précision ≈ 30 s). Aucune image
extraite pour cette vidéo : le contenu « à l'écran » est déduit de la parole.

## 1. Résumé

- Critique de la liquidité « à la ICT » (stops au-dessus des hauts) : ce n'est que ≈ 10 % de la
  réalité. La vraie liquidité est **passive** (ordres limites, teneurs de marché) et **agressive**
  (ordres au marché, preneurs).
- Carnet d'ordres schématique, puis exemple de glissement de prix (slippage).
- Découpage des gros ordres : fractionner puis optimiser la part passive et agressive.
- Heatmap : le prix est attiré par les zones de forte liquidité.
- Types de données : niveau 1 (meilleur prix seulement, suffisant pour footprint, profil, delta),
  niveau 2 MBP (quantité totale par prix, nécessaire pour la heatmap), MBO (ordre par ordre, que
  certains appellent « niveau 3 »).
- Détection d'icebergs (ordres dont seule une petite partie est visible) avec **DeepDOM**, module
  DeepCharts, puis trade de démonstration en replay.

**Mécanismes réellement couverts :**

- **Icebergs** : seul mécanisme détaillé.
- TWAP, VWAP, POV et implementation shortfall : seulement cités (10:28), **sans méthode de
  détection**.
- Dark pools et blocs : **non abordés** (les dark pools sont cités dans la vidéo 15, à 17:30).
- Le titre promet donc plus que le contenu.

**Comment il détecte un iceberg :** avec des données MBO, les petites recharges (par exemple
8 contrats) portent **le même identifiant d'ordre** ; on voit donc un seul gros acteur et non une
foule.

## 2. Outils et réglages utilisés (DeepDOM)

- Heatmap de liquidité avec bulles (trades agressifs).
- Clic droit → Source settings : passer de MBP à **MBO**.
- Properties → section Heat map DOM levels → Display mode **« biggest order and total »** : le
  plus gros ordre unique du niveau s'affiche à côté du total.
- Indicateur **Deep Iceberg Tracker** ; filtre de taille minimale **> 150 contrats** ; couleurs
  plus vives (rouge / vert) ; icebergs « actifs » = pas encore entièrement exécutés.
- Options → Replay en incluant le MBO.
- Panneau de trading en compte de test, quantité calculée en mode **« risque »** (montant risqué
  au stop) plutôt qu'en nombre de contrats.
- Fournisseurs cités : Rithmic et dxFeed (MBO), CQG (MBP).

## 3. Exemples et trade montré

**Carnet schématique (03:50 à 07:44)** : 33 au premier prix vendeur 101, puis 42, 56, 64 ;
41 au premier prix acheteur 99, puis 33 à 98, 51 à 97, 60 à 96. Un acheteur de 25 laisse 8 à 101 ;
un vendeur de 25 laisse 16 à 99 ; un acheteur de 75 consomme 8, puis 42, puis 25 au niveau
suivant : c'est le glissement de prix.

**Exemples sur la heatmap :**

- 12:40 — ordre de 465 contrats au-dessus du prix : le prix monte très vite le chercher, puis un
  second ordre est pris.
- 19:14 — « biggest order » : 795 contrats ; « 400 = un seul acteur » ; 94 sur 135.
- 19:46 — iceberg vendeur de 125 contrats, accumulé en plusieurs endroits, le prix baisse avant
  une annonce ; bataille acheteur / vendeur pendant l'annonce (jour férié).
- 21:24 — filtre > 150 : un gros iceberg fait le **plus haut de la séance**, puis le prix chute.
- 21:58 — le creux est fait sur une zone de liquidité **plus** un iceberg de 160 contrats rechargé
  2 par 2.
- 22:31 à 23:03 — contre-exemple : un gros acheteur continue d'acheter sans faire le bas
  (prise de profits sur des ventes, ou programme d'achat de la journée).
- 24:08 — autre jour : acheteur caché de 150, puis vendeurs qui accumulent et deviennent
  agressifs.
- 24:40 — accumulation vendeuse sur la value area : « bonne indication » d'une baisse.

**Trade de démonstration (26:18 à 29:37)**, en replay, compte « back test » (pas d'argent réel) :

- **Contexte** : zone d'accumulation sur le nœud de volume le plus élevé de la séance (HVN), bas
  de value area (VAL) en dessous, nœud de faible volume (LVN) surligné en vert.
- **Entrée** : en mode risque, 5 000 $ risqués, stop sous le LVN ; renfort prévu sur le LVN, non
  exécuté.
- **Déclencheur** : iceberg acheteur de **1 000 contrats**, puis 500 de plus ; vendeur de 200
  jugé faible.
- **Gestion** : stop sous le HVN, puis au point mort ; renfort ; vente de **6 contrats** (la
  moitié, donc ≈ 12 au total) quand des vendeurs allègent ; sortie totale sur un nouvel iceberg,
  « un peu trop tôt » selon lui.
- **Suite** : nouveaux icebergs de 500 au creux du mouvement, le prix remonte.
- **Résultat** : aucun montant donné ; passage confus (« cancel and flat »).

## 4. Moments clés horodatés

- 00:33 — heatmap DeepDOM, liquidité « visible » dans le carnet.
- 02:44 — liquidité passive contre agressive.
- 03:50 à 07:44 — carnet dessiné et glissement de prix.
- 09:56 à 10:28 — fractionnement, optimisation, noms des algorithmes.
- 11:35 — le prix est attiré par la liquidité ; principe de la heatmap.
- 12:40 — heatmap réelle, ordre de 465.
- 14:18 — menu Source settings MBP / MBO.
- 15:23 à 17:34 — niveaux 1, 2 et 3 ; fournisseurs.
- 18:08 — même identifiant d'ordre = iceberg.
- 18:43 — **promotion DeepDOM ≈ 300 $** et « liquidity bootcamp ».
- 19:14 — display mode « biggest order and total », 795.
- 19:46 — Deep Iceberg Tracker, 125.
- 21:24 — filtre > 150, sommet de séance.
- 21:58 — creux sur l'iceberg de 160.
- 23:36 — contexte : bords de value area, ORB.
- 24:08 — icebergs actifs, couleurs.
- 25:13 — ouverture 9:30 NY (« 4:30 my time », peu clair) ; plus puissant pendant Londres et
  hors séance selon lui.
- 26:18 — trade de démonstration.
- 27:25 — iceberg de 1 000.
- 28:31 — vente de la moitié.
- 29:37 — conclusion.

## 5. Évaluation critique

- **Juste et pédagogique** : le cours sur le carnet, le glissement de prix et les types de données.
- **Non démontré** : la détection repose sur l'outil vendu ; les exemples sont choisis en replay ;
  il reconnaît que ça ne marche « pas à chaque fois » ; aucune statistique.
- **À vérifier** : le même identifiant ne concerne que les icebergs gérés par la bourse. Les
  icebergs « synthétiques » envoyés par des algorithmes changent d'identifiant à chaque recharge
  et ne seraient pas vus ainsi. L'appellation « niveau 3 » est approximative.
- Il conseille de backtester, ce qui est hors du périmètre de deepflow.
- **Promotion forte** (DeepDOM, bootcamp, prix de lancement « qui vont finir »).

## 6. Transposabilité au crypto (Binance)

- Binance publie un carnet agrégé par prix (MBP), pas de MBO : le « biggest order » et
  l'identifiant d'iceberg sont impossibles.
- Reste l'inférence déjà notée dans notes.md : volume exécuté supérieur à la quantité affichée,
  le niveau tient, la quantité se recharge.
- Icebergs natifs disponibles sur Binance spot (paramètre `icebergQty`).
- **À vérifier** : le flux spot `@trade` publiait autrefois les identifiants d'ordre acheteur et
  vendeur (`b` / `a`). S'ils existent encore, on pourrait reconnaître un même ordre passif servi
  plusieurs fois ; sinon, impossible.
- Binance Futures propose des ordres algorithmiques TWAP et « volume participation » côté client
  (à confirmer).

## 7. Manques dans deepflow (absents de notes.md), par utilité

1. **Replay avec carnet depuis l'interface.** L'enregistrement du carnet existe (`RECORD=1`,
   `server/recorder.js`) et sa relecture aussi (`REPLAY`), mais seulement par variables
   d'environnement ; le bouton Replay ne rejoue que les trades (`server/replay.js` : prix
   acheteur et vendeur = dernier prix). Proposer un enregistrement continu du carnet activable
   dans les réglages, et le choix « jour avec carnet » dans le bouton Replay.
2. **Mode footprint « taille moyenne par ordre agresseur »** (volume ÷ nombre d'aggTrades). Un
   aggTrade regroupe les exécutions d'un même ordre au même prix : cela distingue en partie un
   gros acteur d'une foule. 9e mode calculé dans `shared/footprint.js`.
3. **Statut des icebergs probables** (actif, épuisé, cassé), avec filtre de taille minimale et
   volume caché estimé écrit sur la marque : complète la « marque recharge » notée.
4. **Filtre « près des niveaux seulement »** pour les marques absorption, gros prints et
   recharges : n'afficher que celles proches de la VAH, de la VAL, d'un LVN ou d'un haut / bas de
   la veille. Simple filtre de distance en lignes dans les calques (`web/lib/layers`).

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/16-JR50FQIQN2A/ (nom du fichier = heure de la première image).
- Images clés : ../references/16-deepdom-iceberg-tracker.jpg, ../references/16-reglage-source-mbp-mbo.jpg
