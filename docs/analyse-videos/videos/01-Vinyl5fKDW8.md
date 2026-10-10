# 01 — Complete Guide on Futures Contracts (Orderflow Full Course EP.1)

- Vidéo : https://www.youtube.com/watch?v=Vinyl5fKDW8
- Durée : 21:18
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription (auteur de la chaîne)
- Transcription : [../transcriptions/Vinyl5fKDW8.txt](../transcriptions/Vinyl5fKDW8.txt)

Remarque : la plateforme utilisée à l'écran (DeepCharts selon le contexte de la chaîne) n'est jamais nommée
dans la transcription : « this is the order flow platform I'm using ». Aucun outil nommé (Deep Trades,
Imbalance Tracker…) n'apparaît. L'épisode ne donne aucune stratégie : la « stratégie de manipulation »
annoncée à 00:00 est promise pour la suite de la série.

## 1. Résumé de ce qui est enseigné

- **Pourquoi l'order flow** (00:00-02:43) : métaphores de l'arc balistique et de la lunette de vision
  nocturne ; les notions ICT / SMC (order blocks, fair value gaps, chasses aux stops) seraient des « motifs
  d'order flow » qu'on rendrait objectifs en voyant les vrais ordres.
- **Plan du cours** (02:43-03:48) : mécanique du marché et appariement CME, footprint, heatmaps, zones de
  liquidité, motifs, mise en contexte, puis plateformes, courtiers et prop firms.
- **Order flow = flux d'ordres d'achat et de vente** (offre et demande) ; il faut un **marché centralisé**
  (NASDAQ pour Nvidia, CME pour les futures). Le forex au comptant est interbancaire, donc sans volume
  centralisé (03:48-04:54).
- **Actif sous-jacent contre dérivé** (04:54-07:39) : classes d'actifs ; dérivés (CFD, futures, options).
  Correspondances : EURUSD → 6E, GBPUSD → 6B (les futures de devises commencent par « 6 », seulement
  contre le dollar) ; XAUUSD → GC ; US500 → ES. Rapport BIS : environ 30 % comptant, environ 15 % terme sec,
  la majorité en swaps de change, 2 % swaps de devises ; options et « autres » (dont CFD) une petite part.
- **Futures contre CFD** (07:39-11:57) :
  - futures : un seul lieu d'échange, donc vrai volume ; régulés, transparents, pas de marge ajoutée sur
    l'écart ; inconvénients : marge un peu plus haute, flux de données payant, plateforme nécessaire ;
  - CFD : réseau décentralisé, courtier souvent contrepartie (« B-book »), écart, swap de nuit ;
  - conflit d'intérêts : commissions seulement en futures ; commissions, écart, swap et gain de
    contrepartie en CFD.
- **Origine des futures** (11:57-13:36) : outil de couverture (exemple d'Ikea et du bois), CFTC, rapport
  COT (catégorie « commercial »).
- **Échéance et roulement** (13:36-15:16) : échéance trimestrielle de l'ES ; codes mois H (mars), M (juin),
  U (septembre), Z (décembre), J (avril), K (mai), N (juillet) ; roulement (« rollover ») ; « Opex »
  (échéance des options) et volatilité quand elle coïncide avec l'échéance des futures.
- **Tick** (15:16-16:24) : l'ES bouge par 0,25 point ; 1 point = 4 ticks ; valeur du tick ES 12,5 $.
  Micro-contrats conseillés aux petits capitaux (commission relative plus chère, taille mieux maîtrisée).
- **Compensation des positions** (16:24-18:02) : +1 puis +1 donne +2 au prix moyen ; vendre 1 ramène à +1.
  Pas de couverture possible dans le même contrat ; il faut un autre contrat (long ES, short MES).
- **Ordres de sortie** (18:02-19:07) : pour un long, la cible est un « sell limit » au-dessus du prix et le
  stop un « sell stop » en dessous ; l'inverse pour un short.
- **Démonstration** (19:07-20:45) : compte simulé, vente de 5 contrats, buy stop et buy limit posés à la
  main ; l'ordre restant doit être annulé à la main ; d'où la stratégie **OCO** (« one cancels other »).

## 2. Outils, graphiques et réglages montrés

- Aucun indicateur d'order flow n'est expliqué dans cet épisode (les bougies « différentes » sont
  renvoyées à l'épisode suivant, 19:07).
- TradingView : recherche « 6 » pour les futures de devises, menu des échéances ES et 6E.
- Rapport BIS (PDF, page 6 : « Foreign Exchange Market turnover by instrument »).
- Plateforme d'order flow en compte simulé :
  - boutons Buy Market / Sell Market, quantité réglée à **5 contrats** ;
  - stratégie OCO nommée « **test** » : stop à **5 ticks**, cible à **10 ticks**.
- Aucune unité de temps, couleur ni seuil n'est cité.

## 3. Stratégies ou règles concrètes

- Aucune règle d'entrée, de confirmation ni de filtre de contexte.
- Règles pratiques seulement :
  - petit capital : micro-contrats ;
  - toujours sortir par un bracket OCO pour ne pas laisser un stop orphelin après la cible ;
  - éviter la volatilité anormale lors des échéances trimestrielles (Opex et futures) — dit comme
    observation, pas comme règle chiffrée.

## 4. Moments clés horodatés (vérification visuelle)

- 05:26 — TradingView, liste des futures de devises commençant par « 6 ».
- 06:00 — PDF du BIS, page 6, répartition du volume des changes par instrument.
- 07:06 — exemples GC / ES face aux CFD XAUUSD / US500.
- 14:10 — menu des échéances ES (mars 2025, juin, septembre, décembre…, codes M, U, Z, H).
- 14:42 — échéances du 6E (J, K, M, N).
- 15:16-15:51 — zoom sur l'ES : le prix avance par 0,25.
- 16:24-17:30 — schéma : +1, +1 = +2 au prix moyen, puis −1.
- 18:02-19:07 — schéma sell limit (cible) / sell stop (stop) et inverse pour un short.
- 19:07-19:40 — plateforme : vente de 5 contrats, buy stop au-dessus du plus haut.
- 19:40 — buy limit de 5 en cible ; position à zéro mais le stop reste en place.
- 20:13 — création du bracket OCO « test » (5 ticks / 10 ticks), puis stop touché et cible annulée.

## 5. Évaluation critique de la maîtrise

**Correct ou démontré**
- Netting des positions, codes mois, tick de l'ES et valeur 12,5 $, roulement.
- Absence de volume centralisé sur le forex au comptant ; nécessité d'une bourse pour l'order flow.
- Chiffres BIS cohérents avec le rapport triennal 2022 (environ 28-30 % comptant, 15 % terme, swaps
  majoritaires, 2 % swaps de devises).
- Rôle de couverture des futures et rapport COT.
- Démonstration OCO concrète.

**Erreurs factuelles**
- « Le micro contrat du S&P, qui est l'ES » : faux, l'ES est l'E-mini ; le micro est le MES.
- Valeur du tick MES « 11,25 $ » : faux, c'est **1,25 $** (probable lapsus, mais à corriger).
- « Les options mensuelles cessent de coter le vendredi et expirent le samedi » : obsolète, l'expiration
  se fait le vendredi.
- « En futures il n'y a pas de stop loss ni de take profit, ce sont des noms de CFD » : jeu de mots ; les
  termes sont universels, ce sont simplement des ordres stop et limite.
- « Les CFD ne sont pas régulés » : faux dans l'UE et au Royaume-Uni (encadrés par l'ESMA, la FCA).
- « Échéance habituellement de 3 mois » : vrai pour l'ES et le 6E, pas pour tous (GC, CL ont des
  échéances plus fréquentes).

**Simplement affirmé**
- « 99,9 % des courtiers ECN n'en sont pas », « le seul sans dealing desk dont je suis sûr est LMAX ».
- « 90 % des particuliers ignorent ces outils », « les pros et institutionnels utilisent surtout ces
  graphiques ».
- « 100 % d'objectivité » et « voir si c'est un gros stop d'un hedge fund ou d'une banque » : le flux est
  anonyme, on voit des tailles, pas l'identité des acteurs.
- « Order blocks, FVG, chasses aux stops sont des motifs d'order flow » : idée défendue, non démontrée.

**Promotion**
- Annonce de la plateforme (« je vous montrerai laquelle j'utilise »), futurs épisodes sur courtiers et
  prop firms, appels répétés à s'abonner.

**Ambiguïtés**
- Le nom de la plateforme n'est pas prononcé ; il n'est peut-être visible qu'à l'écran.

## 6. Transposabilité au crypto Binance

- **Possible** : Binance est un marché centralisé, donc le volume et le côté agresseur de chaque trade
  sont publics (avantage annoncé des futures, gratuit ici). Tick : chaque symbole a son pas de prix
  (`tickSize` dans `exchangeInfo`).
- **Différent** : les perpétuels n'ont ni échéance ni roulement ; le **financement** (funding, toutes les
  8 h) remplace le swap / la base. Les contrats trimestriels Binance existent mais sont peu utilisés.
- **Netting** : vrai en mode « one-way » ; le mode « hedge » de Binance permet au contraire un long et un
  short simultanés sur le même contrat (différence avec le CME).
- **Pas de rapport COT** : l'open interest, le ratio long / short et les liquidations en sont des
  substituts partiels (déjà dans deepflow).
- **OCO** : n'a pas de sens dans deepflow, qui ne passe pas d'ordres (analyse et exécution manuelles).

## 7. Ce qui manque dans deepflow (par utilité pour un débutant)

Déjà présent : outil position long / short (R:R, taille au risque, frais, levier), panneau prime et
financement, OI.

1. **Fiche d'aide « Types d'ordres et position »** (marché, limite, stop, stop-limite, OCO, netting,
   mode one-way / hedge) : ajouter un article dans `web/lib/help/flow.js` (groupe « Bases »), avec les
   mêmes champs `what` / `read` / `traps`.
2. **Coût du financement dans l'outil position** : estimer le coût de détention (taux courant ×
   notionnel × nombre de fenêtres de 8 h choisi) et l'afficher à côté des frais dans
   `web/lib/layers/drawtools.js` (calcul dans le même module que `d.calc.fees`).
3. **Fiche du contrat** (pas de prix, valeur d'un tick pour la taille calculée, quantité minimale) : lire
   `exchangeInfo` côté serveur et l'afficher dans la boîte de l'outil position ou une info-bulle du
   symbole.
4. **Prix de liquidation approximatif dans l'outil position** (la fiche dit déjà que le levier
   « rapproche la liquidation ») : formule simplifiée marge isolée, affichée à titre indicatif dans
   `drawtools.js`.
