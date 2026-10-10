# 15 — How to ACTUALLY Make your first $10k Trading

- Lien : https://www.youtube.com/watch?v=3Zs52kfCwiU
- Durée : 33:27
- Chaîne : Fabervaale ENG
- Présentateur : Andrea (prénom cité dans la vidéo à 12:03 : « Well, Andrea… »)
- Transcription : ../transcriptions/3Zs52kfCwiU.txt

Avertissement : sous-titres automatiques, horodatages par blocs (précision ≈ 30 s). Aucune image
extraite pour cette vidéo : le contenu « à l'écran » est déduit de la parole.

## 1. Résumé

Vidéo de parcours et de finance générale, **pas d'order flow**. Étapes proposées :

- gagner un premier capital avec un emploi saisonnier (Suisse, Côte d'Azur), en épargnant 50 à
  75 % (« pay yourself first »), puis vivre dans un pays à bas coût (Indonésie, 500-600 $/mois) ;
- ne jamais tout miser (« burn the boats ») : le trading est un « jeu systématique contrôlé »,
  lent ; d'abord un fonds d'urgence ;
- juger une méthode par rapport à l'achat-conservation de l'indice : rendement annuel moyen
  (CAGR), perte maximale depuis un sommet (drawdown), ratio de Sharpe (rendement rapporté au
  risque) ;
- l'avantage du petit trader est sa petite taille (pas de contrainte de liquidité) ;
- les institutions découpent leurs gros ordres (« méta-ordres ») avec des algorithmes VWAP, POV
  (pourcentage du volume) ou TWAP, en partie passifs, en partie agressifs ; d'où une
  **autocorrélation du flux** (des achats entraînent d'autres achats) et des tendances durables
  (« dérives ») ;
- deux stratégies : dérive après publication de résultats (PEAD, actions, swing) et cassure de la
  plage d'ouverture (ORB, Nasdaq, intraday) ;
- puis prop firm ou courtier, multiplication des comptes, diversification (bots, options, macro,
  order flow).

## 2. Outils et réglages utilisés

- DeepCharts : son « IVB model » (une ORB intégrée) et son **gestionnaire de risque** (perte
  maximale par jour fixée à l'avance, impossible à dépasser).
- Aucun footprint, heatmap ni profil n'est montré.

## 3. Règles concrètes et chiffres cités

- **Statistiques de départ (08:08)** : sur 100 traders ayant déposé 5 000 $, 90 % ont tout perdu,
  7 % à l'équilibre, 2 % un peu gagnants, moins de 1 % rentables. Non sourcé.
- **Achat-conservation (09:17)** : « 0 % ont perdu, 100 % ont presque doublé » sur un an (année
  non précisée). S&P 500 : 7-8 %/an net d'inflation ; Nasdaq 100 : 10-12 %/an. Drawdown pouvant
  atteindre 50 % (plus de 80 % en 1929 et 2000 ; 83 % pour le Nasdaq après 2000, 20 ans pour
  revenir). Sharpe ≈ 0,5. 80 % des fonds actions ne battent pas l'indice.
- **Taux sans risque (10:58)** : obligation américaine à 30 ans, « 5 %/an, presque sans risque ».
- **Portefeuille diversifié (14:16)** : 20 % or, 10 % alternatifs, 40 % obligations, 30 % actions
  → 6 %/an, drawdown 19 %, Sharpe 0,7-0,8.
- **Contrainte de liquidité (15:53)** : 5 000 $ de BTC achetés et revendus 2 h plus tard passent
  inaperçus ; 5 milliards $ « perdraient immédiatement 1,5 milliard ». Non démontré.
- **PEAD (20:16)** : acheter après une bonne surprise de résultats et garder 60 jours. Chiffres
  annoncés : 60 % de trades gagnants, gain/risque moyen 1 à 1,5, facteur de profit > 2,
  ≈ 15 %/an, drawdown moyen < 15 %, Sharpe > 1, moins de 100 trades/an. **Aucun stop mentionné.**
- **ORB 30 min (22:26), achat seulement** :
  - tracer le haut et le bas de la première bougie de 30 min ;
  - acheter à la clôture d'une bougie au-dessus du haut ;
  - stop sous la bougie de cassure ;
  - cible : il dit d'abord « 1:0,5, la cible à la moitié du stop », puis « à la même distance que
    le stop, donc 1:1 ». **Contradictoire.**
  - Risque « 1 à … % par trade » (chiffre manquant dans la transcription).
- **Variante 15 min (23:32)**, achat et vente, plus « scalp » : stop au-delà de la bougie de
  cassure, 1:0,5. Chiffres : Sharpe 1,84, ≈ 30 %/an, drawdown max 10 %, sur les 6 dernières
  années. Le taux de réussite manque (« around win rate »). **Ambigu** : on ne sait pas si ces
  chiffres valent pour la variante 15 min ou pour l'ORB 30 min.
- **Prop firm (26:49)** :
  - préférer un compte « financement instantané » à un challenge ;
  - 5 000 $ donnent jusqu'à 200 000 $ de compte, perte maximale ≈ 5 % = 10 000 $ de risque ;
  - 80 % des gains pour le trader ;
  - ORB ≈ 2,5 %/mois → « 5 000 $ par mois », premiers 10 000 $ en 2-3 mois. Le calcul donne
    plutôt 4 000 $ après partage à 80 % ;
  - risque de 0,4 à 0,5 % par trade (800 à 1 000 $).
- **Courtier (27:53)** : les 5 000 $ sont un premier versement sur ≈ 50 000 $ prévus en 5 ans ;
  risque de **5 % par trade**, soit ≈ 250 $ ; 4 fois plus lent, jusqu'à 1 an pour 10 000 $.
- **Mise à l'échelle (30:37)** : trois prop firms à 500 000 $ chacune = 1,5 M$, 1-2 %/mois =
  15 000 à 30 000 $/mois, versés sur un compte courtier jusqu'à 150 000 $, puis 1-2 % de risque
  par trade ; portefeuille visé avec un Sharpe de 2.

## 4. Moments clés horodatés

- 00:00 — « 3 ans pour faire mes premiers 10 000 $ ».
- 01:36 — trouver un emploi bien payé, saisonnier.
- 02:41 — épargne forcée, 5 000-10 000 $ en 3 mois.
- 03:13 — pays à bas coût.
- 03:46 — le trading n'est pas un « tout ou rien ».
- 08:08 — statistiques 90 / 7 / 2 / < 1 %.
- 09:17 — comparaison avec l'achat-conservation du Nasdaq.
- 10:58 — obligation à 30 ans, taux sans risque.
- 11:30 à 12:37 — CAGR S&P et Nasdaq, drawdown ≈ 50 %.
- 13:10 à 13:44 — Sharpe ≈ 0,5.
- 14:49 — portefeuille diversifié : 6 %, drawdown 19 %, Sharpe 0,7-0,8.
- 15:53 — exemple des 5 milliards $ de BTC.
- 17:30 à 18:36 — méta-ordres, dark pools cités, VWAP / POV / TWAP, flux passif et agressif.
- 19:09 — autocorrélation du flux, dérives.
- 20:16 à 21:21 — PEAD et ses chiffres.
- 22:26 à 23:00 — ORB 30 min : on devrait voir la plage tracée sur la première bougie.
- 23:32 à 24:07 — variante 15 min, Sharpe 1,84.
- 25:45 à 26:16 — DeepCharts : IVB = ORB, gestionnaire de risque.
- 26:49 à 27:21 — prop firm, financement instantané.
- 28:27 à 29:33 — courtier, 5 % de risque.
- 30:06 — renvoi vers son Telegram.
- 30:37 — plusieurs prop firms, 1,5 M$.
- 31:44 à 32:47 — diversification, bots, options.

## 5. Évaluation critique

- **Sain** : coussin financier, risque fixe, refus du « tout miser », comparaison au placement
  passif. L'autocorrélation du flux et le découpage des méta-ordres sont des notions réelles de la
  recherche.
- **Affirmé, non démontré** : aucun backtest montré, aucune source ; les chiffres PEAD et ORB sont
  donnés oralement.
- **Erreurs ou approximations** :
  - le Sharpe expliqué comme « 50 cents de plus par dollar risqué » est faux : c'est l'excès de
    rendement divisé par la volatilité ;
  - une obligation à 30 ans n'est pas « presque sans risque » (risque de taux) ; le taux sans
    risque se mesure d'habitude sur des bons à court terme ;
  - « 100 % ont presque doublé en un an » n'est pas vérifiable sans l'année ;
  - ORB : contradiction 1:0,5 / 1:1 ;
  - prop firm : 2,5 % de 200 000 $ à 80 % font 4 000 $, pas 5 000 $.
- Conseiller **5 % de risque par trade** à un débutant est contestable.
- **Promotion** : DeepCharts (IVB, gestionnaire de risque), Telegram, prop firms.

## 6. Transposabilité au crypto (Binance)

- La PEAD ne s'applique pas (pas de résultats trimestriels).
- L'ORB est applicable au BTC, mais le crypto n'a pas d'ouverture de marché : il faut choisir une
  ancre (00:00 UTC, ouverture des actions de New York à 13:30 ou 14:30 UTC selon l'heure d'été,
  ouverture de Londres).
- C'est une règle mécanique : deepflow ne doit fournir que le tracé de la plage, pas de signal
  (signaux automatiques exclus par le projet).
- L'autocorrélation du flux existe aussi en crypto (gros acheteurs fractionnés).

## 7. Manques dans deepflow (absents de notes.md), par utilité

1. **Plage d'ouverture réglable** (5, 15, 30 ou 60 min) ancrée à une heure choisie. Aujourd'hui
   l'IB est figée sur la première heure UTC (`shared/opening.js`, `web/lib/layers/ib.js`,
   réglage `ib` dans `web/lib/indicators.js`). Ajouter des paramètres de début et de durée, et
   prolonger le haut et le bas jusqu'au bord droit. Tracé seulement.
2. **Courbe de capital du journal en R**, avec drawdown maximal et plus longue série de pertes. Le
   journal calcule déjà taux de réussite, espérance et facteur de profit (`shared/journal.js`).
   Cumuler les R par date et ajouter un petit graphique dans le panneau du journal.
3. **Fiche d'aide « juger une méthode »** (espérance, drawdown, Sharpe, coûts et frais) dans
   `web/lib/help`.

## Images de référence

- Planches de 12 images horodatées couvrant toute la vidéo : ../images/15-3Zs52kfCwiU/ (nom du fichier = heure de la première image).
