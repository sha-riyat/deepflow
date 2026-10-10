# Besoins relevés vidéo par vidéo (notes de travail brutes, reprises et ordonnées dans PLAN.md)
## Vidéo principale Pz8f0wWW12M (Fabervaale, 41 min, DeepCharts) — lue moi-même
Forces agressives/passives ; chemin de moindre résistance (carnet plus mince d'un côté, somme des blocs) ;
effort/résultat : absorption (gros effort, pas de résultat), initiative (effort + résultat, déséquilibres d'un seul côté,
volume > moyenne, clôture dans le sens), balayage du carnet (peu d'effort, gros résultat), épuisement (volume décroissant +
déséquilibre contraire au sommet) ; delta par bougie + profil delta ; volume profile (VA 68 %), POC, LVN (rééquilibrage),
forme P, double distribution ; FUSION de profils de jours qui se chevauchent ; profil de la session cash NY seulement ;
« hook » / enchère ratée aux bords de la VA ; biais coloré par jour (vert / orange / bleu) ; vue Deep Trades = gros
ordres seulement, sommés par niveau (72+61+60+62 = 300 sur un prix) ; stop au point mort puis suivi (trailing) sur
chaque nouvelle impulsion. Images : footprint bid×ask coloré + DOM avec volumes exécutés récents.
## EP1-3 (bases) : pas de stratégie. Manques : fiches types d'ordres / FIFO-MBO ; coût du financement dans l'outil
position ; liquidité retirée vs consommée ; alerte spread anormal ; marque « recharge » (iceberg probable) ;
repères d'annonces macro (CPI, FOMC) ; simulateur de carnet pédagogique.
## Liquidité / icebergs / stop runs : concepts justes, règles faibles, stats non sourcées, promotion.
Manques : mur retiré vs consommé ; mur qui suit le prix (spoofing) ; masque du « nuage » près du prix ;
recharge probable au tick (exécuté ≥ k × affiché, niveau tient, remontées) ; seuils par session ; alerte « niveau qui
tient » ; vide de liquidité après cassure ; marque balayage (côté opposé ≈ 0 sur N lignes, delta % > 25, tape rapide,
liquidations, OI en baisse) ; delta % sous la bougie ; panneau vitesse du tape ; total/delta d'un profil à plage fixe.
## VWAP / top trades : VWAP de session, bandes 1 / 1,5-2 / 3 σ ; retour au VWAP ; « banques aux bandes » non prouvé.
Manques : bandes sur le VWAP ancré ; VWAP ancré à une session (ouverture NY) ; multiplicateurs libres ; distance au VWAP
en σ ; pente du VWAP colorée ; volume relatif par heure ; VWAP J-1 prolongé ; marque ordres cadencés (TWAP) ;
CVD ancré au clic ; position avec renforts / point mort ; budget de risque du jour (journal) ; delta des gros prints par
bougie ; superposition prix / CVD normalisés ; zone d'équilibre (profil + CVD + delta gros prints) ; fiche Wyckoff.
## Stop hunts / scalper / 3 astuces : « 1 000 » absent de la vidéo, ~15 cas choisis ; stop run = agression d'un côté,
delta > 50 %, lignes à 0 ; sinon enchère ratée. Scalper : risque A/B/C, contexte → zone → déclencheur, CVD sans suite
(discrepancy), stop en profit, horaires (ouverture cash NY). Astuces : delta/volume chiffrés sous bougie, creux de volume
dans la VA d'un profil à plage fixe (bougies masquées), CVD plus bas plus bas / prix plat = absorption.
Manques : bilan au-delà d'un niveau (volume, delta, delta % depuis le franchissement) ; zones de hauts/bas égaux ;
journal note A/B/C + stats par setup / note / heure ; position à entrées fractionnées ; plage horaire personnelle ;
creux de volume (LVN) dans le profil à plage fixe ; divergence d'absorption au CVD (prix ≥ creux, CVD plus bas) ;
masquer les bougies ; bougie record de la séance.
## Stratégie PBD (e_RlG84pq6g) : formes P / b / D sur des ranges (journalier → 5 min → 1 min), profil sur la plage,
4 setups par forme : break-in (sortie puis clôture dans la zone + retest, vers l'autre bord), cassure (2 bougies dehors
ou bougie à fort volume, retest), enchère ratée (retournement), retournement complet ; filtre volume (fort à la sortie,
sec, fort à la rentrée) ; range d'ouverture 15 min ; stop sous le POC ; cibles autre bord de VA.
Manques : profil à plage fixe « actif » (VAH/VAL/POC prolongés + acceptation/rejet) ; aimant sur niveaux de profil ;
range d'ouverture réglable (5/15/30 min, ancre au choix) ; règle de mesure avec volume/delta du segment ; forme P/b/D
sur le profil à plage fixe ; fiche + check-list PBD.
## Funded 150k (kYX05qESJMs) : stop run (Londres, pic de volume ×4, |delta| ≥ 1/3 du volume, > 1 300 contrats, avant
7 h NY, haut/bas important, en phase d'épuisement ; entrée à la clôture à contre-sens, stop derrière l'extrême, cible
début du balayage) ; iceberg (1 tick devant, 1 à 3 fois) ; divergence CVD + 2e bande VWAP + bougie d'initiative.
Titre trompeur (900 $ retirés), sur-ajustement. Manques : multiple de volume vs N bougies (stats) ; journal avec
instantané (volume, delta %, multiple, heure UTC/NY, MAE/MFE) ; étiquettes d'erreur ; sorties partielles ; compteur de
touches d'un niveau ; avertissement frais/cible ; alerte d'heure limite.
## Footprint (h4emw9_2LU8, autre présentateur) : POC de bougie jaune, déséquilibres 200 % léger / 400 % fort, enchère
inachevée, affichage préféré volume + profil par bougie coloré par delta ; schéma R&I (initiative → épuisement →
absorption → initiative opposée), zone = absorption + groupe de déséquilibres, entrée au retest 1 tick avant.
Manques : déséquilibres visibles dans tous les modes ; deux niveaux de déséquilibre ; mode « profil + chiffres » ;
zones qui survivent aux retests (compteur) ; case à très gros volume n'importe où dans la bougie ; migration du POC.
## CVD (Ni6quY00dcw) : delta % (initiative ≥ 10 %), CVD en bougies, divergence d'absorption (prix ne casse pas, CVD
casse) vs manque de participation (prix casse/égale, CVD non) ; court terme seulement ; entrée sur bougie d'initiative.
Manques : CVD en bougies (OHLC du delta cumulé) ; divergences dans le panneau CVD ; sensibilité/distance réglables ;
creux/sommets égaux avec tolérance ; marque bougie divergente (sens opposé au delta) ; seuil d'initiative réglable.
## Volume Profile (qihraSSdI_M) : HVN/LVN, range vs tendance, séance cash séparée, composite 90 j, profil par bougie,
cassure du range d'ouverture. Manques : relation de valeur jour/veille (plus haute, chevauchement, intérieure…) ;
profils par session Asie/Londres/NY ; composite 30/90 j ; HVN/LVN de la veille prolongés ; delta extrême de la veille.
## 10 k$ / banques / guerre / 4 000 $ : ORB 15-30 min, méta-ordres et autocorrélation ; DeepDOM MBO « plus gros
ordre », Deep Iceberg Tracker > 150 contrats ; options (gamma, put wall, mouvement implicite) ; cadre valeur J-1 :
ouverture dans la VA → range ; acceptation = range formé hors de la valeur ; profil à plage fixe sur le nouveau range.
Manques : plage d'ouverture réglable (5/15/30/60 min, ancre au choix) ; courbe de capital en R + drawdown du journal ;
fiche « juger une méthode » ; replay avec carnet depuis l'interface ; mode footprint « taille moyenne par ordre » ;
statut des icebergs probables (actif/épuisé/cassé) ; filtre « marques près des niveaux » ; niveaux d'options (OI par
strike, mouvement implicite) ; stop suiveur dans l'outil position ; étiquette de position de l'ouverture (dans VA,
dans range, hors range) à 00:00 et ouverture NY ; profils par séance dans la journée ; multiple de volume sous bougie.
## Guide 4 h 56 (KfjjHv7DB8o, associé de Fabio) : edge = TR × R, ligne d'équilibre TR = 1/(1+R) ; AMT ; footprint
(fond = delta, texte = déséquilibre ≥ 200 %, zéros ignorés) ; responsive (absorption, delta % < 10, volume faible) vs
initiative (≥ 3 déséquilibres, volume et delta élevés, volume qui sèche au repli) ; enchère ratée (volume décroissant
dehors, revient en rentrant) ; cassure qualifiée (volume croissant, absorption/épuisement au retest) ; 5 stratégies
mécaniques (Oops, gap fill, ORB 15 min, règle des 4, PBD) ; macro, obligations, options/gamma ; validation statistique.
Manques : range d'ouverture configurable (heure et durée) ; ratios long/short Binance ; stats d'espérance + graphe
TR × R dans le journal, séparation replay / réel ; VAH/VAL/POC du profil à plage fixe prolongés ; cellule anormale ;
fiches PBD, responsive/initiative, espérance, options ; fiche « narrative » hebdo ; superposition d'un second symbole ;
COT CFTC Bitcoin CME ; gaps CME ; GEX Deribit.
## Direct 3 h 34 (podcast Chart Fanatics, Fabio invité, NQ 23 juin 2025) : 4 étapes état → lieu (LVN de la jambe) →
agression (gros print filtré 20-40 contrats) → cible (POC de l'équilibre précédent) ; pas de 1re poussée ; pas de
trade avant l'ouverture ; clôture 1 min de confirmation ; stop derrière la grosse agression ; point mort vite ;
« argent du jour » ; 0,25 %/trade, 2 %/jour ; 3 trades (+1 000 $ sur 1 contrat). Manques : delta par prix dans le
profil à plage fixe ; niveaux de delta max prolongés ; gros print avec / sans suite ; alerte sur clôture au-delà d'un
dessin ; compteur de tests/rejets d'un niveau ; aimant position sur gros prints / niveaux ; acceptation/rejet de la VA
d'un profil dessiné ; raccourci masquer bulles ; badge retard du flux ; CVD en bougies ; stats journal par jour ;
gros prints sous le seuil en neutre.
