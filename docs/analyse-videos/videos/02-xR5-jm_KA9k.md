# 02 — The Only Orderflow Basics Video You'll Ever Need (EP.2)

- Vidéo : https://www.youtube.com/watch?v=xR5-jm_KA9k
- Durée : 13:06
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription (auteur de la chaîne)
- Transcription : [../transcriptions/xR5-jm_KA9k.txt](../transcriptions/xR5-jm_KA9k.txt)

Remarque : aucun outil DeepCharts nommé ; la plateforme n'est pas citée. L'épisode est un cours de
mécanique du marché illustré par des dessins, avec deux vues d'un vrai carnet (04:19 et 12:12).

## 1. Résumé de ce qui est enseigné

- **Introduction** (00:00-01:38) : reprise des métaphores (arc balistique, vision nocturne) ; l'order flow
  rendrait objectifs les déséquilibres, les chasses aux stops et la liquidité, et réduirait la part
  d'interprétation d'une stratégie price action.
- **La liquidité, c'est la contrepartie** (01:38-02:42) : tout ordre est de la liquidité. Les traders SMC
  n'y voient que les stops au-dessus des hauts et sous les bas, les traders offre / demande que les ordres
  restés dans une zone : « vrai mais partiel ».
- **Deux liquidités** (02:42-03:47) :
  - **passive** (« market makers ») : ordres limites posés, le « menu » ;
  - **agressive** (« market takers ») : les « clients » qui prennent dans le menu (ordres au marché et
    stops déclenchés).
- **Carnet d'ordres** (03:47-04:53) : CLOB (central limit order book) ou DOM (depth of market). Côté bid
  les buy limits (acheteurs passifs), côté ask les sell limits (vendeurs passifs). Premier niveau de
  chaque côté : **best bid** et **best ask**. Les ordres limites servent aussi de cibles ; les stops
  (sorties de perte ou entrées en cassure) sont de la liquidité agressive.
- **Exemple pas à pas** (04:53-08:44) :
  - achat au marché de 1 : exécuté au best ask, qui passe de 6 à 5 ; « lift the ask » ;
  - le **prix courant** est le dernier prix où au moins un ordre a été exécuté ;
  - l'exécution est notée dans un tableau qui devient le **footprint** ;
  - vente au marché de 1 : exécutée au best bid (« hit the bid ») ; la bougie devient baissière ;
  - achat au marché de 10 : 5 au premier niveau, 5 au suivant ; la bougie devient haussière avec une mèche
    en une milliseconde ;
  - vente de 10 : 4 au best bid, le reste au niveau inférieur ; mèche haute ;
  - le **spread** (écart bid / ask) s'est élargi.
- **Principes** (08:44-10:25) :
  - « là où il n'y a pas de liquidité, il n'y a pas de marché » ;
  - ce sont les agresseurs qui déplacent le prix, en acceptant un prix moins bon ;
  - la vitesse dépend du nombre d'agresseurs **et** de la liquidité passive ;
  - un ordre limite de 100 ou 1 000 contrats est difficile à casser : c'est le premier vrai
    support / résistance, la vraie zone d'offre ou de demande.
- **Footprint** (10:25-10:58) : agresseurs acheteurs à droite, vendeurs à gauche. « Il n'y a pas plus
  d'acheteurs » : chaque contrat a une contrepartie ; le marché n'est pas « long », c'est le prix qui est
  haussier. Le footprint montre **qui a été le plus agressif**.
- **Profil de volume** (10:58-11:31) : bid + ask par niveau (exemple 5, 13, 9, 5) ; **POC** = niveau le
  plus échangé. Sans distinction d'agressivité, certains le jugent « bruité ».
- **Profil delta** (11:31-12:12) : ask − bid par niveau (exemple +5, −1, −1, −5).
- **Limites du carnet brut et heatmap** (12:12-12:46) : le vrai carnet va très vite, les ordres sont
  posés et retirés ; la **heatmap** montre les zones de plus forte liquidité dans le temps (détails
  renvoyés aux épisodes suivants).

## 2. Outils, graphiques et réglages montrés

- **DOM / carnet** (schéma, puis vrai carnet avec prix et ask à 04:19, carnet en direct à 12:12).
- **Footprint bid × ask** (construit à la main à partir des exécutions).
- **Bougie** reconstruite à partir des exécutions (ouverture, mèches, clôture).
- **Profil de volume par bougie** et **POC**.
- **Profil delta** par niveau.
- **Heatmap** : seulement annoncée.
- Aucun réglage, seuil, couleur ni unité de temps cité.

## 3. Stratégies ou règles concrètes

- Aucune entrée, confirmation, stop ni cible.
- Principes de lecture :
  - un gros ordre limite freine ou arrête le prix (« les agresseurs peinent ou abandonnent ») ;
  - un niveau sans liquidité se traverse vite (mèches, spread élargi) ;
  - un delta positif mesure l'agressivité des acheteurs, pas un « marché plus acheteur » ;
  - le carnet brut change trop vite : préférer la heatmap pour repérer les zones de liquidité.

## 4. Moments clés horodatés (vérification visuelle)

- 02:42-03:47 — schéma du « menu » : liquidité passive au centre, clients agresseurs autour.
- 03:47-04:19 — DOM dessiné, best bid / best ask.
- 04:19 — vrai carnet comparé au dessin (« je l'ai dessiné assez fidèlement »).
- 04:53-05:27 — position longue : cible en sell limit, stop en sell stop hors carnet.
- 06:00 — création du tableau footprint, premier contrat à l'ask.
- 06:32 — vente au bid, bougie baissière.
- 07:05-07:38 — achat de 10 contrats sur deux niveaux, bougie haussière avec mèche.
- 07:38-08:11 — vente de 10 contrats, mèche haute.
- 08:11 — spread élargi.
- 09:52 — mur de 1 000 contrats côté bid.
- 10:25 — footprint complété (agresseurs vendeurs à gauche, acheteurs à droite).
- 10:58 — profil de volume calculé (5, 13, 9, 5).
- 11:31 — POC.
- 12:12 — profil delta (+5, −1, −1, −5), puis carnet réel en mouvement rapide.
- 12:46 — mention de la heatmap.

## 5. Évaluation critique de la maîtrise

**Épisode pédagogiquement solide**, le meilleur des trois pour un débutant.

**Correct ou démontré**
- Consommation des niveaux, définition du prix courant, mèches qui naissent d'un seul gros ordre au
  marché, élargissement du spread.
- « Il n'y a pas plus d'acheteurs que de vendeurs » : chaque contrat a deux côtés ; le footprint mesure
  l'agressivité.
- Calculs du profil de volume, du POC et du profil delta.
- Le carnet brut est instable (ordres retirés), d'où l'intérêt de la heatmap.

**Approximations**
- « Market makers = toute la liquidité passive » : réducteur ; n'importe qui peut poser un ordre limite.
- « Mon stop reste chez le courtier » : au CME, beaucoup de stops sont tenus par la bourse ; cela dépend
  du courtier et du type d'ordre.
- Le mur comme « meilleure zone de demande » : il reconnaît lui-même plus loin que ces ordres peuvent être
  retirés (leurres, « spoofing »), ce qui affaiblit l'idée.
- Au profil delta (12:12), il se reprend (« 7 − 6, 6 − 7 = −1 ») : le sens bid / ask de ce niveau est
  ambigu dans la transcription.

**Simplement affirmé**
- « 90 % des particuliers ignorent… », « 95 % des particuliers ne savent pas pourquoi le prix bouge ».
- « L'order flow réduit radicalement l'interprétation » : promesse, pas démonstration.

**Promotion**
- Appels à s'abonner et à aimer ; pas de produit présenté dans cet épisode.

## 6. Transposabilité au crypto Binance

- **Presque tout est transposable** :
  - côté agresseur exact sur chaque trade agrégé (champ « buyer is maker ») ;
  - carnet par niveau de prix (profondeur) ;
  - spread, footprint, profils de volume et delta, POC, heatmap.
- **Limites** :
  - mises à jour de profondeur toutes les 100 ms : les ordres posés puis retirés entre deux mises à jour
    sont invisibles ;
  - pas de distinction entre une baisse de quantité due à un trade et une annulation, sauf en rapprochant
    les trades du même niveau ;
  - pas d'historique gratuit du carnet : la heatmap et le DOM n'existent qu'en direct (et en local).

## 7. Ce qui manque dans deepflow (par utilité pour un débutant)

Déjà présent : footprint bid × ask, profil bid / ask, profil delta, POC, volume profile, DOM, heatmap,
bulles de trades, fiche d'aide « Agresseurs, bid, ask et delta » et fiche « Bid / ask » (spread).

1. **Simulateur pédagogique du carnet** : petit carnet fictif où l'élève envoie des ordres au marché ou
   limites et voit les niveaux consommés, le footprint se remplir, la mèche et le spread s'élargir
   (reprise exacte de la démonstration 04:53-08:44). Composant React autonome dans le panneau Apprendre
   (`web/components/panels/LearnPanel.tsx`), logique pure dans un module séparé testable.
2. **Indicateur « liquidité retirée ou consommée »** : pour chaque niveau proche du prix, distinguer la
   baisse de quantité expliquée par des trades de celle due à des annulations. Rapprochement des écarts de
   profondeur et des trades du même niveau dans `server/flow.js`, affichage dans le panneau flux.
3. **Alerte spread anormal** : seuil sur le rapport entre le spread courant et sa médiane glissante, dans
   le système d'alertes existant, avec une ligne d'explication dans la fiche « Bid / ask »
   (`web/lib/help/flow.js`).
