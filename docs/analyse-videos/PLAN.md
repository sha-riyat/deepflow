# Plan d'intégration des outils vus dans les vidéos

Ce plan reprend tout ce qui manque à deepflow d'après l'analyse des 23 vidéos (voir SYNTHESE.md et videos/). Il est
découpé en lots indépendants : chacun donne un ou plusieurs commits (une action = un commit, règles du CLAUDE.md).
Chaque élément indique la ou les vidéos sources (numéros des fichiers de videos/), le principe, les données, les
fichiers à toucher, les réglages, les tests et la fiche d'aide. Pour voir à quoi ressemble l'outil d'origine :
references/ (images clés nommées par outil, préfixées du numéro de vidéo) et images/NN-ID/ (toute la vidéo).

Rappels du projet : analyse manuelle uniquement (aucun signal automatique, scanner ni backtest) ; calculs purs dans
`shared/` testés avec `node --test` ; dessin Canvas hors React dans `web/lib/layers` ou `web/lib/chart` ; réglages
dans `web/lib/indicators.js` ; fichiers de 200 à 300 lignes (400 au plus) ; commentaires en français ; vérifications :
`npm test`, `cd web && npx tsc --noEmit`, `npm run web:build`, test visuel.

## État au moment de la reprise

- Branche : `outils-videos` (partie de `main` à jour, phases 1 à 5 fusionnées).
- Lot 1 (statistiques par bougie) : vérifié à l'écran avec des données Binance réelles (valeurs identiques aux klines
  officielles : volume, achats, delta %), en attente de validation et de commits, voir plus bas.
- Données de test hors ligne : `outils/gen-enregistrement.mjs` (enregistrement fictif) et
  `outils/playwright-aide.mjs` (scénarios Playwright). Binance, Bybit et OKX étaient bloqués dans l'environnement
  cloud ; en local, tout se teste en vrai.

## Ordre conseillé

| Lot | Contenu | Utilité débutant | Effort |
|---|---|---|---|
| 1 | Statistiques par bougie : delta %, volume relatif, taille moyenne | forte | faible (vérifié, à valider) |
| 2 | Gros trades façon Deep Trades | forte | moyen (fait, à valider ; points 1, 2, 3, 5, 6 ; le point 4 reporté) |
| 3 | Profil à plage fixe enrichi + fusion de profils | forte | moyen (points 1 à 8 faits ; 9 reporté) |
| 4 | Range d'ouverture réglable, position de l'ouverture, profils par session | forte | moyen (points 1 à 4 faits ; 5 à 7 à faire) |
| 5 | CVD en bougies et divergences complètes | moyenne | moyen |
| 6 | Footprint : déséquilibres à 2 niveaux, case anormale, POC, balayage | moyenne | moyen |
| 7 | Outil position : point mort, stop suiveur, sorties partielles, frais | forte | moyen |
| 8 | Journal : note, erreurs, courbe en R, statistiques par setup / heure | forte | moyen |
| 9 | Alertes sur clôture, compteur de touches d'un niveau | moyenne | faible |
| 10 | Carnet sans MBO : mur retiré / consommé, recharge (iceberg), vitesse du tape | moyenne | élevé |
| 11 | Apprentissage : fiches et check-list | forte | faible |
| 12 | Divers (VWAP ancré à une session, bandes du VWAP ancré, ratios long/short…) | faible à moyenne | variable |

---

## Lot 1 — Statistiques par bougie (« order flow values »)

Sources : 13 (CVD), 10, 22, 18, 21. Les vidéos lisent sous chaque bougie volume, delta, delta % et jugent une cassure
au volume relatif (« 300 → 169 → 1 200 », « volume au-dessus de la moyenne »).

- **Fait et vérifié à l'écran** :
  - `shared/barstats.js` : `deltaPct(b)`, `relativeVolume(items, i, n = 20)` (volume / moyenne des n précédentes,
    null s'il y en a moins de 5), `avgSize(b)` (volume / nombre de trades agrégés = taille moyenne d'un ordre
    agresseur), `INITIATIVE_PCT = 10`.
  - `test/barstats.test.js`.
  - `web/lib/chart/statspane.js` : tableau sorti de `panes.js` ; lignes Delta, Volume, Delta %, Vol. ×, Achats,
    Ventes, Trades, Taille moy. ; delta % en couleur pleine seulement au-delà de 10 % (sinon gris), Vol. × ≥ 2 en
    orange ; légende du panneau : Delta %, Vol. ×, Trades.
  - `web/lib/chart/panes.js` : utilise `drawStats` et `statsValues` du nouveau module.
- Corrigé à la vérification : la légende HTML du panneau recouvrait la première ligne (Delta) ; `drawStats` réserve
  maintenant une bande de 18 px en haut quand le panneau fait au moins 64 px (5 lignes visibles dans un panneau de
  hauteur standard : Delta, Volume, Delta %, Vol. ×, Achats ; Trades et Taille moy. dans un panneau plus haut).
- Fiche d'aide « Statistiques par bougie » harmonisée (10 % = initiative, au-delà de 30 % = domination, pièges).
- Option possible : seuil d'initiative réglable (les panneaux n'ont pas encore de réglages : prévoir `opts.stats`).
- Commit : « Ajoute le delta en % coloré, le volume relatif et la taille moyenne au panneau Statistiques ».

## Lot 2 — Gros trades façon « Deep Trades »

Sources : 00 (37:28–40:30, vérifié à l'image), 09, 12, 14, 17, 18, 22.
Ce que montrent les vidéos : seuls les gros ordres exécutés, en cercles verts (acheteurs) / violets (vendeurs) au prix
exact dans la bougie, taille proportionnelle ; plusieurs gros ordres au même prix additionnés (72 + 61 + 60 + 62 ≈ 300
contrats) ; filtre réglable par session (20 à Londres, 30 à New York, 40 en direct) ; bulles sous le seuil en neutre.

1. **Gros prints sommés par niveau dans la bougie** : option « Regroupement : par ordre / par niveau dans la bougie ».
   Données : `data.bigPrints()` (déjà côté client). Calcul pur `groupBigPrints(prints, items, row)` dans
   `shared/` (clé = index de bougie × ligne de prix × côté ; somme des quantités, nombre d'ordres). Dessin dans
   `web/lib/layers/flow.js` (`drawBigPrints`) : cercle de surface proportionnelle, nombre écrit, « ×4 » si plusieurs.
2. **Gros print avec ou sans suite** : pour chaque gros print, avancée du prix dans son sens sur les N secondes (ou
   la bougie) suivantes ; s'il reste sous k lignes, marque « absorbé » (cercle évidé, ou point gris au centre).
   Calcul pur testé ; réglages N (30 s, 1 min, 5 min) et k.
3. **Seuil par session** : seuil automatique calculé par session Asie / Londres / New York (centile 99,5 % des
   ordres de la session) au lieu d'un seul seuil glissant ; ou seuil en $ réglable par session.
4. **Sous le seuil en neutre** (option) : petits points gris pour les ordres moyens au lieu de les masquer.
5. **Delta des gros prints par bougie** : nouveau panneau ou ligne du panneau Statistiques (achats − ventes des
   seuls gros prints) pour voir « quand les gros ne poussent plus » (vidéo 12).
6. **Raccourci** pour masquer / afficher bulles et gros prints (vidéo 14) : Maj + B, Maj + G dans
   `Workspace.tsx` (les lettres seules ouvrent la recherche de symbole).
Fiche d'aide : « Deep Trades : lire les gros ordres » (absorption = gros ordres répétés sans résultat).

**Avancement (vérifié à l'écran avec des données Binance réelles)** : points 1 (`shared/bigprints.js`, `groupBigPrints`,
« ×n » dans l'étiquette), 2 (`printFollow`, anneau creux = absorbé ; l'avancée minimale est une fraction de l'amplitude
moyenne d'une bougie, pour suivre l'unité de temps), 3 (seuil de base
multiplié par session : Asie ×0,5, Londres ×1, New York ×2, `sessionAt` dans `shared/sessions.js`), 5 (ligne « Gros Δ »
du panneau Statistiques, `bigDeltas`) et 6 (un seul raccourci, Maj + G : bulles et gros prints ensemble). Rendu revu d'après les captures des vidéos 00 et 14 (cercles pleins lumineux,
sans texte sauf les 5 plus gros, un seul calque lisible : bulles de volume et gros prints ne s'affichent pas ensemble).
Point 4 (petits
ordres en points gris, jaunes sous le seuil dans la vidéo 14) reporté : il obligerait le serveur à envoyer des milliers d'ordres de plus pour un gain de lecture faible.

## Lot 3 — Profil à plage fixe enrichi, fusion de profils

**Avancement** : points 1 à 7 faits, vérifiés à l'écran et commités (type de profil ; pics / creux, totaux et forme, avec
correction de la position des pics ; prolongement et état acceptation / rejet ; niveaux de delta maximal ; masquage des
bougies par le bouton œil ou Maj + C). Ajouts hors liste : bouton « Réglages du dessin » sur tous les dessins et taille des
lignes d'un profil de plage choisie d'après sa hauteur (≈ 30 lignes). **Point 8 fait** : la plage d'un profil (dessiné ou
visible) est lue jour par jour (`forEachChunk` dans `server/history/store.js`), 10 jours au plus (`RANGE_DAYS` dans
`server/queries.js`, `MAX_SPAN` côté navigateur) ; tracer la plage sur plusieurs jours donne un profil fusionné. Mesuré sur
10 jours réels de BTCUSDT (archives Binance Vision) : 31 s au premier tracé (téléchargement), 1,6 s ensuite (cache disque),
558 Mo de mémoire au plus (plus d'un Go en réunissant les jours) ; délai du relais Next.js porté à 180 s pour ce premier tracé
(`experimental.proxyTimeout`). La vue « plage visible » reste limitée à 3 jours côté navigateur (rechargée à chaque
défilement). **Reste** : point 9 (composites 30 / 90 jours, reporté volontairement) ; non vérifié visuellement (session
directe impossible dans l'environnement cloud : fapi.binance.com répond 451).

Sources : 00, 10, 14, 18, 19, 20, 21.
1. **Type de profil** du dessin : volume, achats / ventes, delta par prix (aujourd'hui `vp()` de
   `web/lib/layers/drawtools.js` appelle `histogram` en `kind: 'volume'`). Ajouter `d.style.kind` modifiable dans la
   barre de style du dessin (`web/components/DrawingStyle.tsx`).
2. **Creux et pics de volume (LVN / HVN)** dans le profil dessiné, et le plus faible volume dans la value area
   (vidéo 10 : « vrai fair value gap ») : réutiliser `volumeNodes` (`shared/auction.js`) et `drawNodes`
   (`web/lib/layers/levels.js`).
3. **Totaux** : volume total, delta, delta %, nombre de bougies, écrits dans l'étiquette du profil.
4. **Forme P / b / D** du profil dessiné : `profileShape` existe déjà pour le profil du jour.
5. **VAH / VAL / POC prolongés vers la droite** jusqu'au retest (option du dessin), et **état acceptation / rejet**
   de la value area du profil dessiné : réutiliser `auctionState` (2 clôtures de 30 min dehors / dedans) avec le
   profil dessiné à la place de la veille.
6. **Niveaux de delta maximal** (plus forte vente, plus fort achat) du profil prolongés (vidéos 14, 19).
7. **Masquer les bougies** en un clic pour lire le profil seul (vidéo 10) : préférence de vue.
8. **Fusion de profils (composite à la carte)** : sélectionner 2 ou 3 jours qui se chevauchent pour un seul profil
   (vidéo 00) ; le plus simple : le profil à plage fixe accepte déjà une plage de 3 jours → porter la limite à 10 jours
   (côté serveur `rangeProfile`, `maxDays`) et documenter « tracer le profil sur les jours à fusionner ».
9. **Composite 30 / 90 jours** (vidéo 19) : nouvelles valeurs `c30`, `c90` de `OPTIONS.profile.range` ; attention au
   coût (sessions journalières en cache côté serveur, chargement progressif).
Tests : formes, totaux, acceptation sur un profil arbitraire. Fiche : « Méthode PBD » (lot 11).

## Lot 4 — Range d'ouverture, position de l'ouverture, profils par session

Sources : 15, 18, 20, 21 (ORB 15 / 30 min), 14 (pas de trade avant l'ouverture), 09, 19.
1. **Range d'ouverture réglable** : durée 5 / 15 / 30 / 60 min, ancre 00:00 UTC, Londres (8 h locales), New York
   (9 h 30 locales, heure d'été gérée par `shared/sessions.js`). Calcul pur `openingRange(bars, anchor, minutes)` dans
   `shared/opening.js` ; calque `web/lib/layers/ib.js` généralisé (haut, bas, milieu prolongés ; extensions 1,5× / 2×
   en option). L'IB actuelle (première heure UTC) devient un cas particulier.
   **Fait** : calque séparé `orb` (`web/lib/layers/orb.js`), l'IB et le type d'ouverture de Dalton restent inchangés ;
   calcul `orbStart` / `orbWindow` / `orbRange` dans `shared/opening.js` (testé) ; bougies d'une minute de la fenêtre
   chargées par `loadOpeningRange`, rafraîchies toutes les 30 s pendant la formation. Vérifié à l'écran sur un
   enregistrement fictif (ancre UTC) ; New York et Londres couverts par le test unitaire seulement.
   **Point 2 fait** : `openLocation(prev, today, price)` renvoie aussi `zone` (value / range / out) et `openZoneLabel`
   donne le libellé ; `nyOpenPrice` (dernier prix de la période de 30 min qui précède l'ouverture de New York, à un
   tick près) ; légende du calque `open`. Vérifié à l'écran avec une veille fictive (00:00 UTC) ; la position à New
   York n'est couverte que par le test unitaire (dimanche).
   **Point 3 fait** : `sessionSegments` (`shared/sessions.js`, séances sans chevauchement, New York l'emporte puis
   Londres, comme `sessionAt`), mode `sessions` de `/api/profile` (`server/sessionprofiles.js`, 7 jours, cache des
   séances finies), choix « Séances Asie / Londres / NY » dans le profil, fond teinté et nom de la séance. Vérifié à
   l'écran avec des séances simulées (dimanche : aucune séance réelle) ; le calcul serveur est couvert par un test.
   **Point 4 fait** : `valueRelation(prev, today)` et `RELATION_LABEL` (`shared/auction.js`, testés) ; relation
   ajoutée à la légende du calque `prev` (« en cours », la value area du jour se construit), explication dans la
   fiche d'aide. Vérifié à l'écran avec une veille simulée.
2. **Position de l'ouverture** (vidéo 18) : dans la value area de la veille, dans le range de la veille mais hors
   value area, hors du range ; mesurée à 00:00 UTC et à l'ouverture de New York. Étend `openLocation`
   (`shared/auction.js`). Lecture : ouverture dans la valeur → journée de rotation probable.
3. **Profils par séance dans la journée** (Asie, Londres, New York côte à côte, NY plus foncé) : nouvelle période
   `sessions` dans `OPTIONS.profile.range`, découpe avec `marketSessions` (`shared/sessions.js`), côté serveur
   `profiles` avec des plages libres.
4. **Relation de valeur jour / veille** (plus haute, chevauchement haut, intérieure, extérieure, plus basse) dans la
   légende : `valueRelation(prev, today)` dans `shared/auction.js`.
5. **HVN / LVN de la veille prolongés** sur la journée (calque `prev`).
6. **Plage horaire personnelle grisée** (hors de « mes heures ») : préférence globale.
7. **VWAP ancré à une session** (ouverture NY) : nouvelle valeur de `OPTIONS.vwap.period` (lot 12 sinon).

## Lot 5 — CVD en bougies et divergences

Sources : 13 (CVD), 10, 12, 14, 22.
1. **CVD en bougies** : suivre le plus haut et le plus bas du delta cumulé pendant la construction de chaque bougie
   (`shared/bars.js` : champs `dh`, `dl` relatifs au delta de la bougie) ; pour les bougies venant des klines (sans
   trades), rester en ligne. Style « Ligne / Bougies » du panneau CVD (`web/lib/chart/panes.js`).
2. **Divergence d'absorption** : le prix ne fait pas de nouvel extrême (creux égal ou plus haut, à N lignes près)
   alors que le CVD en fait un ; et **manque de participation** : le prix casse ou égale, le CVD non. Étendre
   `cvdDivergences` (`shared/cvd.js`) avec le type et une tolérance « égal » en lignes.
3. **Réglages** : sensibilité des pivots (k aujourd'hui fixe à 5) et écart maximal entre les deux pivots (les
   vidéos insistent : divergences courtes seulement). `OPTIONS.div`.
4. **Divergences tracées aussi dans le panneau CVD**.
5. **Marque « bougie divergente »** : sens de la bougie opposé à son delta, ou |delta %| sous le seuil sur une grande
   bougie.
6. **CVD ancré au clic** (vidéo 12) : outil de dessin comme le VWAP ancré, CVD remis à zéro au début d'une zone.
7. **Superposition prix / CVD normalisés** sur la plage visible (option du panneau).
Fiche : « Divergences : absorption ou manque de participation » (CVD = agression et absorption).

## Lot 6 — Footprint : lecture fine

Sources : 07 (footprint), 21, 06, 08, 22.
1. **Déséquilibres à deux niveaux** : 200 % (couleur légère) et 400 % (forte) ; `imbalances()` renvoie la force ;
   réglage `ratio2` dans `FP_OPTIONS`.
2. **Déséquilibres visibles dans tous les modes** (aujourd'hui seulement bid × ask et échelle :
   `outline && SPLIT.includes(mode)` dans `web/lib/layers/footprint.js`) : liseré du côté dominant.
3. **Mode « profil + chiffres »** (affichage préféré de la vidéo 07) : barres de volume par prix colorées par le
   delta, volume et delta écrits, déséquilibres conservés.
4. **POC de chaque bougie mis en évidence** (case jaune) et **migration du POC** (trait reliant les POC successifs).
5. **Case anormale** n'importe où dans la bougie : volume ≥ k × médiane des cases récentes (ou seuil en $) ; contour
   (`heavyCells()` dans `shared/footprint.js`). `flowMarks` ne regarde aujourd'hui que les 2 lignes extrêmes.
6. **Marque « balayage » (stop run, sans signal)** : N lignes consécutives où le côté opposé est ≈ 0, |delta %| ≥ 25
   à 50 %, volume relatif ≥ 2, idéalement au-delà d'un haut / bas de référence ; renforcée si liquidations dans la
   même seconde. Distinguer de l'**enchère ratée** (peu de volume au-delà du niveau). Marque « S » comme A / E.
7. **Zones de déséquilibres empilés qui survivent aux retests** : option « prolonger jusqu'à une clôture au-delà »,
   compteur de retests (`drawFootprintZones`, `web/lib/layers/fpmarks.js`).
8. **Mode « taille moyenne par ordre »** (volume / nombre de trades agrégés par case) : gros acteur contre foule.

## Lot 7 — Outil position

Sources : 00, 09, 12, 14, 17, 22, 21.
1. **Point mort** en un clic (stop ramené à l'entrée, frais compris) et **stop en profit** (« +x R verrouillés »).
2. **Stop suiveur** : bouton « sous la dernière mèche » / « sous le dernier gros print », historique des déplacements.
3. **Sorties partielles** : TP1 sur x %, le reste vers une cible ; R global recalculé.
4. **Entrées fractionnées / renforts** : plusieurs prix d'entrée, prix moyen, stop commun.
5. **Avertissement frais / cible** : si la cible est inférieure à x fois les frais aller-retour (scalps de 2 ticks
   impossibles sur Binance).
6. **Aimant sur les niveaux** : POC, VAH, VAL, LVN, VWAP, plus haut / bas de la veille, gros prints (stop « k lignes
   avant l'extrême »), en plus de l'aimant OHLC (`web/lib/drawings/editor.js`, `#anchor`).
7. **Coût du financement** estimé selon la durée de détention (vidéo 01).
8. **Risque selon la note du setup** (A / B / C, vidéo 09) et rappel du « budget du jour » (lot 8).
Fichiers : `shared/measures.js` (calculs testés), `web/lib/layers/drawtools.js`, `web/components/DrawingStyle.tsx`.

## Lot 8 — Journal

Sources : 09, 14, 22, 21, 15.
1. **Note A / B / C** et **setup** normalisé (liste : break-in, cassure, enchère ratée, retournement, absorption,
   balayage, momentum…) ; champ `grade` dans `cleanEntry` (`shared/journal.js`).
2. **Étiquettes d'erreur** (hors horaire, début d'impulsion, mauvais sens, hors plan) et coût cumulé par erreur.
3. **Instantané à l'enregistrement** : volume, delta %, volume relatif de la bougie, heure UTC et heure de New York.
4. **MAE / MFE** (excursions défavorable / favorable maximales) entre l'entrée et la sortie, à partir des bougies.
5. **Courbe de capital en R**, drawdown maximal, plus longue série de pertes ; **graphe taux de réussite × R** avec
   la ligne d'équilibre TR = 1 / (1 + R) (vidéo 21).
6. **Statistiques par setup, note, heure, jour de la semaine** ; séparation **replay / réel**.
7. **Budget de risque du jour** : P&L réalisé du jour et risque autorisé = fraction des gains (« argent du jour »,
   vidéos 12 et 14), affichage seulement.
8. **Fiche « narrative » hebdomadaire** (3 scénarios, données attendues, biais) — option.
Aucune de ces statistiques n'est un backtest : elles portent sur les trades réellement notés.

## Lot 9 — Alertes et niveaux dessinés

Sources : 14, 22, 08.
1. **Alerte sur clôture de bougie au-delà d'un niveau ou d'un dessin** (unité de temps, part minimale du corps) :
   nouveau type dans `server/alerts.js`, création par clic droit sur une horizontale ou un rectangle.
2. **Compteur de touches et de rejets** d'un niveau dessiné (« 3 rejets ») et volume échangé à chaque passage.
3. **Bilan au-delà d'un niveau** (vidéo 08) : depuis le franchissement, volume, delta et delta % échangés au-delà
   du prix, rapportés au volume moyen par ligne de la séance (stop run ou enchère ratée ?).
4. **Zones de hauts / bas égaux** : pivots à moins de N lignes regroupés en bande « ×3 ».

## Lot 10 — Carnet d'ordres sans MBO (approximations honnêtes)

Sources : 03, 04, 05, 06, 16, 22, 21. Binance ne publie que le carnet agrégé par prix (MBP, 100 ms) : on ne peut
qu'inférer. Tout doit être étiqueté « probable ».
1. **Mur retiré ou consommé** : à la disparition d'un mur (`server/flow.js`, `#walls`), comparer la quantité perdue
   au volume échangé à ce prix pendant la même fenêtre ; « retiré » (possible leurre) ou « mangé » ; marque sur la
   heatmap.
2. **Mur qui suit le prix** (spoofing) : un mur qui disparaît et réapparaît à ± N lignes en moins d'une seconde avec
   une taille proche ; compter ses déplacements.
3. **Recharge probable (iceberg approximé)** au meilleur bid / ask, au tick exact : volume exécuté sur la fenêtre ≥
   k × quantité maximale affichée (k ≥ 3), niveau non franchi, quantité affichée qui remonte après chaque baisse
   (compter les remontées) ; seuil relatif à la session. Statut actif / épuisé / cassé, volume caché estimé.
   Côté serveur (carnet complet au tick dans `server/orderbook.js`), diffusé comme les gros prints.
4. **Vitesse du tape** : trades et volume par seconde, en z-score de session ; panneau.
5. **Masque du « nuage » de teneurs de marché** près du prix (± X lignes ignorées dans la couleur de la heatmap).
6. **Chemin de moindre résistance** (vidéo 00) : profondeur cumulée au-dessus vs en dessous sur N lignes (déjà proche
   du « déséquilibre carnet » du panneau Flux : l'afficher en jauge sur le DOM).
7. **Replay avec carnet depuis l'interface** : enregistrement continu du carnet (déjà `RECORD=1`) activable dans les
   réglages, et choix « jour enregistré » dans le bouton Replay.
8. **Indicateur de retard du flux** (badge si le dernier trade a plus de 2 s de retard).
9. À vérifier : le flux spot `@trade` publiait les identifiants d'ordres (b / a) ; s'ils existent encore, un même
   ordre passif servi plusieurs fois serait reconnaissable (spot seulement).

## Lot 11 — Apprentissage (aide intégrée, `web/lib/help/`)

Nouvelles fiches (avec statut donnée mesurée / règle empirique / contexte) :
1. **Effort / résultat** : absorption, initiative, balayage du carnet, épuisement (vidéo 00, 07, 21).
2. **Responsive contre initiative** : seuils cités (delta % < 10, ≥ 3 déséquilibres, volume qui sèche au repli).
3. **Méthode PBD** : formes P / b / D, 4 setups chacune (break-in, cassure, enchère ratée, retournement complet),
   critères de volume ; **check-list cochable** avant trade (vidéo 20).
4. **Stop run ou enchère ratée** : agression d'un côté et delta fort au-delà du niveau, sinon enchère ratée ;
   les liquidations comme stops visibles en crypto (vidéos 06, 08).
5. **Icebergs et MBO** : pourquoi Binance ne permet qu'une estimation (03, 05, 16).
6. **Types d'ordres, file d'attente (FIFO), teneurs de marché** (01, 02, 03).
7. **Espérance** : taux de réussite × R, ligne d'équilibre, profit factor, surajustement (21, 15).
8. **VWAP n'est pas une moyenne mobile** ; bandes et retour à la moyenne (11).
9. **Routine de scalping en 4 étapes** : état du marché → lieu (LVN de la jambe) → agression (gros ordre) → cible
   (POC de l'équilibre précédent) ; règles : pas de trade avant l'ouverture, pas la première poussée, clôture de
   confirmation, stop derrière la grosse agression, point mort rapide, risque 0,25 % par trade et 2 % par jour (14).
10. **Wyckoff** (accumulation, distribution) avec critères observables (12, 08).
Lien depuis la routine d'analyse existante (`method`).

## Lot 12 — Divers

- Bandes ±σ sur le **VWAP ancré** (dessin) ; multiplicateurs de bandes libres (1 ; 1,5 ; 2) ; distance au VWAP en σ ;
  pente du VWAP colorée ; VWAP J-1 prolongé ; volume relatif par heure (courbe en U) (vidéo 11).
- **Ratios long / short Binance** (comptes, top traders, volume taker) en panneau (vidéo 21).
- **Bougie record** de la séance (volume ou |delta| maximal) (vidéo 10).
- **Repères d'annonces macro** (CPI, FOMC, NFP) en lignes verticales, liste éditable (vidéos 03, 21).
- **Alerte spread anormal** (vidéo 02).
- Superposition d'un second symbole en base 100 (intermarché) (vidéo 21).
- Écartés pour l'instant : niveaux d'options / gamma (Deribit, Binance eapi), COT CFTC, fil d'actualités, gaps CME.
- **Interdits par le projet** : signaux automatiques (IVB, indicateurs « stop run » / « iceberg » qui préviennent ou
  déclenchent), scanner, backtest. Tout ce qui précède reste des marques de lecture manuelle.

## Après chaque lot

1. `npm test`, `cd web && npx tsc --noEmit`, `npm run web:build`.
2. Test visuel (données réelles en local, ou `outils/gen-enregistrement.mjs` + Playwright).
3. Commit par action (fonctionnalité, correctif, documentation séparés), message en français simple.
4. README.md mis à jour dans un commit séparé quand une fonctionnalité visible change.
