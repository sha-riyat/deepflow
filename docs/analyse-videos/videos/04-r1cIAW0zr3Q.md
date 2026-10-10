# 04 — Stop Drawing Liquidity Lines... Use THIS Instead

- Lien : https://www.youtube.com/watch?v=r1cIAW0zr3Q
- Durée : 16:35
- Chaîne : Fabervaale ENG
- Présentateur : non nommé dans la transcription (auteur de la chaîne)
- Transcription : [../transcriptions/r1cIAW0zr3Q.txt](../transcriptions/r1cIAW0zr3Q.txt)

Remarque : le mot « DeepCharts » n'apparaît pas dans la transcription ; seuls des noms génériques
sont cités (heat map, bubbles, MBO).

## 1. Ce qui est enseigné

- Deux types de liquidité :
  - **passive** : ordres limites dans le carnet (les « market makers »), visibles dans la heatmap ;
  - **agressive** : ordres au marché (les « takers »), visibles en bulles.
- La heatmap montre le carnet actuel à droite et son historique à gauche.
- Les ordres du carnet sont une **intention** et non une pression réelle : ils peuvent être annulés.
- Théorie des enchères (AMT) : le marché alterne équilibre (« fair value ») et découverte de prix.
- Les gros acteurs fractionnent leurs ordres et préfèrent entrer quand le marché est liquide.
- Exemple chiffré : 2 000 contrats achetés au marché dans un carnet de 50 contrats par niveau
  consomment 40 ticks, soit 10 points sur l'ES (4 ticks par point).
- Rapprochement entre les cycles de Wyckoff, le « power of three » et l'AMT.
- La liquidité agit comme un **aimant** ou comme un **repoussoir**. Le trading consiste à aller
  « de liquidité en liquidité ».

## 2. Outils, graphiques, indicateurs

Aucun nom commercial n'est cité.

- **Heatmap** : plus la couleur est chaude, plus il y a d'ordres. Un réglage de **contraste**
  filtre le bruit.
- **« Market Maker Cloud »** : son propre terme (« I don't know if it has another name »). C'est
  la bande sombre qui suit le prix, faite d'ordres de teneurs de marché souvent annulés avant
  d'être touchés.
- **Lignes best bid / best ask** visibles en zoom serré.
- **Bulles** d'agression, roses pour les ventes.
- Aucun seuil ni réglage chiffré n'est donné.

## 3. Stratégies et règles concrètes

Les règles sont surtout qualitatives :
- plus une zone est épaisse, moins le prix la traverse directement, et plus il réagit, reprend de
  la force, puis revient l'attaquer ;
- des niveaux stables dans le temps ont tendance à être traversés un par un ;
- un carnet aminci après un mouvement vertical donne le « chemin de moindre résistance » ;
- **« flipping »** : une zone vendeuse consommée devient support (côté acheteur).

Il n'y a **ni entrée, ni stop, ni cible chiffrés**.

## 4. Moments clés à vérifier à l'écran

- 00:00 — lignes de liquidité dessinées comparées à une heatmap.
- 01:05 — schéma ask / bid.
- 01:39 — heatmap : carnet actuel plus historique.
- 02:12 — « Market Maker Cloud ».
- 02:44 — réglage du contraste.
- 03:17 — zone vendeuse chaude.
- 03:49 / 04:22 — lignes best bid / ask, bulles qui font monter l'ask.
- 07:06 — carnet à 50 contrats par niveau.
- 08:45 — schéma de Wyckoff.
- 11:22 — niveau qui **suit le prix** (spoofing).
- 11:50-12:01 — cassure du plus bas du jour, bulles roses, mouvement vertical.
- 12:34 — niveaux persistants traversés un par un.
- 13:07 — carnet qui « chauffe » à l'ouverture de New York, murs des deux côtés.
- 14:13 et 15:18 — flipping.
- 14:46 — stop run sans plus haut ni plus bas cassé.
- 15:50 — « liquidity to liquidity ».

## 5. Évaluation critique

- **Correct :** la mécanique passif / agressif, le carnet comme intention, l'impact d'un gros
  ordre au marché, et l'AMT.
- **Contradictions :**
  - à 10:21, il dit que « these bubbles are stop orders », alors que les bulles sont tous les
    ordres au marché, pas seulement des stops ;
  - le flipping est dit « technically illegal », puis « in this case it didn't exactly happen »
    (14:13), puis « what happened here is a flipping » (15:18). Le passage est confus.
- **Approximations historiques :**
  - le « power of three » est attribué à Larry Williams, ce qui est discutable ;
  - il écrit que Dalton et Steidlmayer ont « inventé » le volume profile, ce qui est inexact :
    Steidlmayer a créé le Market Profile, Dalton l'a popularisé.
- **Non démontré :** l'aimant / repoussoir est une lecture après coup, sans statistique.
- **Promotion :** « MBO… iceberg orders and stop runs with 100% objectivity » promis à 1 000
  likes. « 100 % » est exagéré : même avec le MBO, la détection reste une déduction.

## 6. Transposition au crypto Binance

**Faisable avec nos données :**
- la heatmap à 100 ms, les bulles et les lignes bid / ask existent déjà ;
- suivre une zone dans le temps (persistance, épaisseur) ;
- détecter un mur qui « suit le prix » : un niveau de taille comparable qui se déplace avec le
  meilleur prix en restant à distance constante ;
- distinguer un mur **retiré** d'un mur **consommé** : comparer la baisse de quantité à un prix
  avec le volume échangé à ce prix pendant la même fenêtre.

**Limites :**
- sans MBO, on ne sait pas si c'est le même ordre qui se déplace ou des ordres différents ;
- tout ce qui se passe en moins de 100 ms est invisible ;
- la liquidité crypto est répartie entre plusieurs plateformes ;
- le spoofing y est fréquent.

## 7. Ce qui manque dans deepflow

Déjà présents : le contraste (`gamma` dans `web/lib/store.ts`, `web/lib/layers/heat.js`, menu dans
`web/components/TopBar.tsx`, touches flèches) et les murs (`server/flow.js`, `#walls`). Les murs y
sont toutefois identifiés par ligne fixe (`side + row`) : un mur qui se déplace n'est pas suivi.

Classement par utilité pour un débutant :

1. **Mur retiré ou consommé** : à chaque disparition d'un mur dans `server/flow.js`, comparer la
   quantité perdue au volume des aggTrades au même prix ; l'étiqueter « retiré » (possible
   leurre) ou « mangé », et l'afficher sur la heatmap.
2. **Mur qui suit le prix (spoofing)** : dans `#walls`, rattacher un mur qui disparaît à un mur
   de taille proche qui apparaît à ± N lignes en moins d'une seconde, et compter ses
   déplacements.
3. **Masque du « nuage » près du prix** : option pour ignorer ±X lignes autour du milieu dans le
   calcul de couleur de `web/lib/layers/heat.js` et dans la détection des murs, pour ne garder
   que la liquidité éloignée.
4. **Flipping** : marquer un mur vendeur consommé suivi d'un rejet du prix au-dessus. C'est un
   repère à afficher, pas un signal (règle du projet).
