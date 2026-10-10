# 19 — How to ACTUALLY use Volume Profiles

- Lien : https://www.youtube.com/watch?v=qihraSSdI_M
- Durée : 24:16
- Chaîne : Fabervaale ENG
- Présentateur : non nommé. À 14:51, il cite « Fabio Valentini, l'un des meilleurs scalpeurs » à la troisième
  personne : c'est soit un autre intervenant, soit une formulation promotionnelle (**ambigu**). Plateforme : DeepCharts.
- Transcription : ../transcriptions/qihraSSdI_M.txt

Images : aucune vignette n'est disponible pour cette vidéo. Les descriptions d'écran viennent uniquement de la
narration.

## 1. Résumé

Le profil de volume montre, à chaque prix, combien de transactions ont eu lieu sur une période : jour, semaine, ou
même une bougie de 1 min. Le présentateur explique :

- les **HVN** (high volume nodes, pics de volume) : le marché y a passé du temps ;
- les **LVN** (low volume nodes, creux de volume) : poussées directionnelles où un camp dominait ;
- la **value area** (zone de valeur) de 70 %, qu'il justifie par la loi normale (68 % à un écart-type).

Il compare ensuite le profil « Session Volume Profile » de TradingView (payant) au « Deep Profile » de DeepCharts.
Selon lui, TradingView approxime le volume, et l'écart se voit sur le POC : 69,99 contre 69,87.

Puis il présente les réglages DeepCharts : profil volume + delta, VWAP, séparation séance cash / séance électronique,
composite de 90 jours, profil par bougie. Il propose trois usages :

1. **le biais** : la valeur migre, c'est une « structure de marché par le volume » au sens de la théorie des
   enchères ;
2. **le support / la résistance** : les bords de la value area, à vendre en haut et à acheter en bas, ou à suivre
   en cas de cassure acceptée ;
3. **le déclencheur** : un déplacement du volume à l'intérieur d'une bougie au bord de la value area.

Il termine en disant qu'il vaut mieux regarder un HVN qu'un POC.

## 2. Outils et réglages exacts

- **Périodes** : profil jour, semaine, ou « n'importe quelle unité de temps », jusqu'à 1 min (01:04).
- **Couleurs** : value area en jaune, hors value area en gris (04:25).
- **Value area** : 68 % (1 écart-type), « arrondi à 70 % » (06:40–07:13). Il cite 95 % à 2 σ et 99,7 % à 3 σ,
  mais ne s'en sert pas.
- **TradingView** : indicateur « Session Volume Profile », payant, « basé sur le tick volume ». Lignes « regroupées
  bizarrement », taille de ligne réglable (« row size »).
- **DeepCharts** : clic droit, Indicateurs, « Deep Profile ». Volume réel de la CME, calcul sur la machine
  (processeur ou carte graphique).
- **Réglage « volume and delta »** (13:42) : le profil montre en plus le delta à chaque prix, c'est le **profil
  delta**.
- **VWAP** (15:24) : ligne jaune, VWAP de la séance, et **VWAP en développement**.
- **« Filter split time : RTH »** (15:57) : deux profils par jour, un pour la séance cash (heures régulières, RTH) et
  un pour Asie + Londres (séance électronique, ETH).
- **Indicateur de volume par heure** : volume dans le temps (16:30).
- **Modèle « ES 5 minutes »** (18:40), dont le nom de l'auteur est transcrit « Andrachimi » (**ambigu**), avec :
  - un profil séparé pour chaque séance (cash, et Londres + Asie) ;
  - un **profil composite** de tout le graphique, chargé sur **90 jours** (« Price settings », 90 jours) ;
  - un **profil par bougie**, visible au zoom.
- Il annonce d'autres profils à expliquer plus tard : « deep swing profile », profil à plage fixe, composite.

## 3. Règles concrètes et patterns

- **Lecture HVN / LVN** (02:12–04:25) :
  - HVN : beaucoup d'échanges des deux côtés, le prix y a passé du temps ;
  - LVN : un camp a dominé, ce sont des « sprints directionnels » ; le prix y passe vite.
  - Le temps passé à un prix détermine en grande partie le volume échangé à ce prix.
- **Hors value area = « anomalie statistique »** qui peut revenir vers la moyenne. Le bas de la value area offre des
  prix « bon marché », le haut des prix « chers » (07:13–08:16).
- **Range / retour à la moyenne** (08:16) :
  - contexte : marché en équilibre dans la value area ;
  - signal : une **enchère ratée**, c'est-à-dire une cassure qui échoue sous la VAL et un retour dans la value area ;
  - entrée : achat ;
  - stop : sous l'extrême de la cassure ;
  - cible : l'autre bord de la value area, ou, plus prudent, le POC ou le plus gros HVN.
  - « Bon taux de réussite et bon gain / risque », sans chiffres.
- **Suivi de tendance** (08:49–09:55) :
  - la tendance n'est confirmée que si une **nouvelle distribution** se forme au-dessus du plus gros volume
    précédent : « tout le range monte, pas seulement le plus haut » ;
  - entrée : soit tôt, soit après une cassure franche qui « passe du temps dehors », au **test** ;
  - stop : **sous le HVN principal**.
- **Biais** (17:02–17:36) : suivre où va le volume (la « valeur ») plutôt que les plus hauts et plus bas, « qui
  peuvent être aléatoires ».
- **Support / résistance** (17:36–18:08) :
  - en tendance haussière, attendre le bas de la value area de la veille ;
  - y voir le prix « échouer en dessous », entrer dans le sens de la tendance, viser l'autre bord ;
  - ou, si le prix passe du temps dehors après une cassure, jouer la cassure.
- **Séance cash** : prendre la value area de la **séance cash** plutôt que celle de la journée entière, car « c'est là
  que se traite le plus d'argent » et que ces zones « répondent mieux » (16:30).
- **Profil delta** (14:17–15:24) :
  - un gros ordre vendeur au sommet a ramené le prix dans l'équilibre ;
  - un gros groupe d'achats agressifs plus bas est ensuite défendu ;
  - la zone de **plus forte vente de la veille** est prolongée en fond : c'est là que « les vendeurs reprennent la
    main encore et encore ».
- **Déclencheur** (19:46–20:54) :
  - sur un profil par bougie, une bougie de vente dont le volume s'est déplacé vers le bas : un acheteur était bloqué
    par un gros vendeur ;
  - c'est une bougie englobante confirmée par le volume, après un échec de cassure de la value area du jour ;
  - stop au-dessus, objectif de l'autre côté (retour à la moyenne).
- **Cassure du range d'ouverture** (21:27–22:00) :
  - la séance démarre en bas, monte jusqu'à l'autre bord, échoue au-dessus, revient, puis casse à nouveau et y passe
    du temps ;
  - achat sur la cassure du range d'ouverture, stop « juste en dessous » ;
  - « toute la séance pour un 1:3, avec un taux de réussite très élevé ».
- **POC** (22:32) : ne pas trader le POC comme un niveau unique, souvent « aléatoire » (plusieurs prix voisins ont
  presque le même volume). Il vaut mieux repérer le **HVN**, qui est une zone.

## 4. Moments clés horodatés

- 00:00 — accroche : « l'indicateur de l'argent ».
- 01:04 — définition ; profil jour, semaine, 1 min.
- 01:37–02:44 — repérage un par un des HVN et des LVN sur un profil.
- 03:18 — schéma : LVN = mouvement rapide, HVN = temps passé.
- 04:25 — value area jaune / grise ; loi normale.
- 05:00 — analogies de la loi normale (taille, autre analogie de mauvais goût).
- 06:40 — 68 / 95 / 99,7 % ; value area ≈ 70 %.
- 07:45 — trading de range.
- 08:16 — schéma d'enchère ratée : achat, stop, cibles POC / autre bord.
- 08:49 — schéma de tendance : nouvelle distribution au-dessus.
- 09:55 — entrée au test, stop sous le HVN ; profil TradingView (payant).
- 10:59 — DeepCharts : volume réel de la CME.
- 12:05 — comparaison des POC : 69,99 contre 69,87, value areas proches mais décalées.
- 13:10 — value area de la veille comme support / résistance ; séance de Londres en cours.
- 13:42 — réglage volume + delta.
- 14:17 — profil delta : gros vendeur au sommet.
- 14:51 — gros groupe d'achats ; mention de Fabio Valentini.
- 15:24 — zone de vente prolongée ; VWAP et VWAP en développement.
- 15:57 — séparation RTH / ETH.
- 16:30 — volume par heure : la séance cash domine.
- 17:02–18:08 — les trois usages (biais, support / résistance, déclencheur).
- 18:40 — modèle ES 5 min, composite de 90 jours.
- 19:46 — profil par bougie : vendeur qui bloque un acheteur.
- 20:20 — déplacement de la valeur dans la bougie, englobante.
- 20:54 — déclencheur, stop au-dessus.
- 21:27 — exemple de séance : échec au-dessus, retour, nouvelle cassure.
- 22:00 — cassure du range d'ouverture, 1:3.
- 22:32 — POC contre HVN.
- 23:05 — il reconnaît que ses exemples sont choisis après coup.
- 23:37 — promotion du tutoriel sur la chaîne DeepCharts.

## 5. Évaluation critique

**Correct**

- La définition du profil, et les rôles des HVN et des LVN.
- Le lien entre temps passé et volume.
- La value area comme zone d'équilibre, l'enchère ratée, la migration de la valeur.
- L'intérêt du profil delta.
- La préférence pour une zone HVN plutôt que pour un POC isolé : un vrai conseil utile.
- Il reconnaît honnêtement que ses exemples sont choisis après coup.

**Approximations, voire erreurs**

- **La value area n'est pas un écart-type.** Les plateformes la calculent en partant du POC et en ajoutant les lignes
  voisines jusqu'à 70 % du volume (méthode CBOT). Le chiffre de 70 % vient de cette convention ; le lien avec 68 % et
  la loi normale n'est qu'une image.
- Les profils réels sont souvent à plusieurs bosses (double distribution). Dire que « tout ce qui sort est une
  anomalie qui revient à la moyenne » est contredit par ses propres exemples de cassure.
- Le profil TradingView « basé sur le tick volume » est probablement inexact. Le Session Volume Profile répartit le
  volume de bougies plus courtes : c'est une approximation de la **répartition**, pas forcément du tick volume.
  **À vérifier.**
- « Le volume est un indicateur avancé » : non démontré.

**Affirmé sans preuve**

- « Taux de réussite très élevé », « 1:3 », « bon gain / risque » : aucune statistique.
- « Les institutionnels utilisent ces indicateurs ».

**Promotion** : forte pour DeepCharts (comparaison orientée avec TradingView, modèles, tutoriel annoncé).
**Hors sujet** : l'analogie de mauvais goût de 05:00.

## 6. Transposabilité au crypto Binance

- **Volume réel** : deepflow calcule les profils à partir des trades Binance. L'argument « vrai volume contre
  approximation » est donc déjà réglé.
- **Séances** : pas de séance « cash ». La séparation RTH / ETH se transpose en profils **Asie / Londres / New York**.
  L'ouverture de New York reste le moment le plus actif sur BTC, mais l'écart avec les autres séances est moins marqué
  que sur ES.
- **Session de référence** : le jour UTC, comme dans deepflow. Le week-end, peu actif, déforme les composites et la
  value area du lundi.
- **Composite de 90 jours** : techniquement possible avec les archives Binance Vision, mais lourd à charger.
- **Taille de ligne** : le pas du profil compte beaucoup. deepflow utilise un pourcentage du prix (`rowBucket`, 0,05 %
  par défaut).

## 7. Ce qui manque dans deepflow (absent de notes.md), par utilité

Vérifié dans `web/lib/layers/volprofile.js`, `web/lib/layers/levels.js` (`drawNodes`), `shared/auction.js`,
`shared/opening.js` et `web/lib/indicators.js` (`OPTIONS.profile`, `OPTIONS.ib`). Déjà présents : profil jour,
semaine, plage visible, composites 5 et 10 jours ; types volume, achats / ventes et delta ; HVN / LVN ; forme ;
POC et value area en développement ; value area de la veille avec acceptation / rejet ; VWAP ; profil par bougie
(mode profil du footprint).

1. **Relation de valeur entre le jour et la veille** : value area plus haute, chevauchement par le haut, intérieure,
   extérieure, chevauchement par le bas, plus basse. C'est la lecture « biais par la migration de la valeur » de la
   vidéo. `auctionState` ne lit que l'acceptation ou le rejet face à la value area de la veille. Piste : fonction pure
   `valueRelation(prev, today)` dans `shared/auction.js` (comparaison VAH / VAL / POC), avec son libellé dans la
   légende du calque `prev`, plus un test.
2. **Profils par séance (Asie / Londres / New York)**, équivalent du « split RTH ». notes.md cite le concept (« profil
   de la séance cash NY seulement »), mais l'outil n'existe pas : `OPTIONS.profile.range` ne propose que
   day / week / visible / c5 / c10. Piste : période « Par séance » dans `OPTIONS.profile.range`, découpée avec les
   horaires de `shared/sessions.js`, avec POC et value area pour chaque séance, dessinés dans `volprofile.js`.
3. **Composite long (30 / 90 jours)** pour le biais de fond. Piste : choix `c30` et `c90` dans
   `OPTIONS.profile.range`, avec `compositeSession` (déjà générique) ; vérifier que le serveur charge assez de
   sessions (historique Binance Vision), sinon le dire dans l'interface.
4. **HVN en bande, et HVN / LVN de la veille prolongés.** `drawNodes` dessine un HVN comme un trait de 6 px sur une
   seule ligne, alors que la vidéo dit de raisonner en zones. Piste :
   - bande entre les lignes voisines dont le volume lissé dépasse un pourcentage du pic (fonction dans
     `shared/auction.js`, à côté de `volumeNodes`) ;
   - option dans le calque `prev` pour prolonger les HVN / LVN d'hier sur la journée.
5. **Niveaux de delta extrême du profil de la veille prolongés** : le prix ou la zone de plus forte vente et de plus
   fort achat nets du profil delta, prolongés jusqu'au retest (15:24). Piste : calcul dans `shared/profile.js` ou
   `shared/auction.js` sur `rows` (`bv − sv`), dessin dans `volprofile.js` à la manière des POC non testés.
6. **Range d'ouverture réglable et ancrable** : 5 / 15 / 30 / 60 min, à minuit UTC, à l'ouverture de Londres ou de
   New York. L'IB de deepflow est fixe (première heure de la journée UTC, `shared/opening.js`) et ne sert donc pas pour
   la cassure du range d'ouverture de New York montrée à 22:00. Piste : options `len` et `anchor` dans `OPTIONS.ib`,
   et paramètres dans `shared/opening.js`.
7. **Pourcentage de value area réglable** (68 / 70 / 80 %) : faible utilité. Piste : paramètre de `valueArea` dans
   `shared/profile.js`, plus une option du profil.
