# Synthèse de l'analyse des vidéos

Corpus : la vidéo « The Only Orderflow Guide You'll Ever Need » et la playlist de 22 vidéos de la chaîne Fabervaale
ENG (https://www.youtube.com/playlist?list=PLBVwIU37953qr7DBLMJVXqcaVrJAaQy3D), soit 23 vidéos et environ 14 h 15.

## Méthode et limites de l'analyse

- Sous-titres automatiques anglais récupérés pour les 23 vidéos (yt-dlp, client « android_vr »), convertis en texte
  horodaté (transcriptions/). Chaque transcription a été lue en entière ; les rapports par vidéo sont dans videos/.
- Images : le flux vidéo est refusé par Google (erreur 403, protection anti-robot), le découpage image par image en
  pleine résolution était donc impossible. Les planches d'aperçu de YouTube (320 × 180, une image toutes les 5 à 10 s,
  client « mweb ») ont été récupérées pour 19 vidéos et ont servi à vérifier les écrans clés (footprint, heatmap,
  vue Deep Trades, outil position). Les scripts sont dans outils/ pour tout régénérer en local.
- Les sous-titres automatiques déforment les noms et certains chiffres : les rapports signalent les passages ambigus.

## Qui enseigne

- **Fabio Valentini (Fabervaale)** : scalpeur sur futures Nasdaq / S&P (NQ, ES), partenaire de DeepCharts, classé à
  la Robbins World Cup (palmarès affirmé, non vérifiable ici).
- Plusieurs vidéos sont présentées par des **associés** (footprint, icebergs, liquidité, guide de 5 h, stratégie
  PBD) ; le direct de 3 h 34 est un épisode du **podcast Chart Fanatics** avec Fabio en invité.

## Ce qui est enseigné (le socle)

1. **Mécanique du marché** : ordres passifs (limites, carnet) contre agressifs (au marché) ; le prix bouge quand les
   agresseurs consomment les niveaux ; glissement ; « chemin de moindre résistance » (côté du carnet le plus mince).
2. **Effort contre résultat** : absorption (gros effort, pas de résultat), initiative (effort récompensé, déséquilibres
   d'un seul côté, volume au-dessus de la moyenne), balayage du carnet (peu d'effort, gros résultat), épuisement
   (volume qui décroît, déséquilibre contraire à l'extrême).
3. **Outils** : footprint (bid × ask, delta, profils par bougie, déséquilibres diagonaux 200 / 400 %, POC de bougie,
   enchères inachevées), delta et delta % par bougie, CVD (en bougies, divergences d'absorption ou de manque de
   participation), heatmap de liquidité, gros trades filtrés (« Deep Trades »), Volume Profile, VWAP et bandes.
4. **Théorie des enchères** : équilibre et déséquilibre, value area, POC, LVN / HVN, acceptation contre rejet,
   enchère ratée (« hook »), formes P / b / D, fusion de profils, profil de la séance cash.
5. **Stratégies** :
   - **PBD** (vidéo 20) : 4 setups par forme (break-in, cassure, enchère ratée, retournement complet), volumes de
     sortie et de rentrée, range d'ouverture de 15 min, stop sous le POC, cible à l'autre bord de la value area ;
   - **scalping en 4 étapes** (vidéos 14, 00) : état du marché → lieu (creux de volume de la jambe) → agression
     (gros ordre filtré) → cible (POC de l'équilibre précédent) ; pas de trade avant l'ouverture, pas la première
     poussée, clôture de confirmation, stop derrière la grosse agression, point mort rapide ;
   - **stop run, iceberg, divergence** (vidéo 22) : seuils chiffrés (volume × 4, delta ≥ 1/3, avant 7 h NY…) ;
   - **ORB** et stratégies mécaniques classiques (vidéos 15, 21).
6. **Risque** : 0,25 % par trade et 2 % par jour (compte personnel), setups risqués seulement avec les gains du
   jour, note A / B / C de la qualité du setup.

## Jugement sur la maîtrise

- **Solide** : mécanique du carnet, delta, lecture effort / résultat, cadre des enchères, gestion du risque montrée en
  direct (stops réduits, sorties partielles, refus des mauvais trades) ; prudence sur les divergences longues.
- **Faible** :
  - aucune statistique vérifiable ; le « 1 000 stop hunts » n'apparaît pas dans la vidéo (≈ 15 cas choisis) ;
  - taux de réussite affirmés ;
  - surajustement dans la vidéo « funded 150 000 $ », dont le titre est trompeur (900 $ retirés) ;
  - erreurs factuelles : value area présentée comme un écart-type, VWAP présenté comme une moyenne mobile, tick du
    MES, affirmation historique fausse et stéréotypée dans le guide de 5 h ;
  - contradictions (« je ne regarde jamais les ordres limites » contre le « chemin de moindre résistance ») ;
  - promotion constante : DeepCharts, prop firms, Telegram.
- Les indicateurs propriétaires (« stop run », « iceberg », IVB) sont des boîtes noires et des signaux automatiques :
  incompatibles avec la règle de deepflow. Leurs icebergs reposent sur le MBO (ordre par ordre), que Binance ne
  publie pas : en crypto, on ne peut qu'estimer une recharge probable.

## Ce que deepflow a déjà

Footprint (8 modes, déséquilibres, marques A / E), heatmap, bulles, gros prints, liquidations, CVD, divergences, CVD
spot / perp et multi-plateformes, Volume Profile (jour, semaine, visible, composite), value area de la veille et
acceptation / rejet, POC non testés, VWAP et bandes, IB et types d'ouverture, sessions, niveaux clés, OI par prix,
prime et financement, profil à plage fixe, VWAP ancré, outil position, replay, journal, aide intégrée.

## Ce qui manque

Voir PLAN.md (12 lots, ordonnés) et BESOINS-BRUTS.md (liste vidéo par vidéo). En bref :
- statistiques par bougie (delta %, volume relatif) ;
- gros trades façon Deep Trades ;
- profil à plage fixe enrichi et fusion de profils ;
- range d'ouverture réglable ;
- CVD en bougies et divergences complètes ;
- footprint plus fin ;
- outil position (point mort, stop suiveur, sorties partielles) ;
- journal (note, erreurs, courbe en R) ;
- alertes sur clôture ;
- carnet sans MBO (mur retiré / consommé, recharge probable, vitesse du tape) ;
- fiches d'apprentissage et check-list.

Ce n'est pas un conseil financier.
