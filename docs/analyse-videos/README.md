# Analyse des vidéos d'order flow (Fabervaale / DeepCharts)

Dossier de travail pour reprendre le chantier « outils vus dans les vidéos » en local.

| Fichier | Contenu |
|---|---|
| PLAN.md | Plan d'intégration complet dans deepflow : 12 lots, principe, données, fichiers, tests, état d'avancement |
| SYNTHESE.md | Ce qui est enseigné, par qui, jugement sur la maîtrise, ce que deepflow a déjà |
| BESOINS-BRUTS.md | Notes de travail : besoins relevés vidéo par vidéo |
| videos/NN-ID.md | Rapport détaillé par vidéo : résumé, outils et réglages, règles et stratégies, moments clés horodatés, évaluation critique, transposition à Binance, manques pour deepflow |
| images/NN-ID/ | Toutes les images récupérées de chaque vidéo, en planches de 12 vignettes horodatées (320 × 180 chacune ; une image toutes les 5 à 10 s, une sur deux pour les deux directs) ; nom du fichier = heure de la première image |
| references/ | Images clés par outil (bande de 3 images autour du moment cité dans les rapports), voir la liste plus bas |
| transcriptions/ID.txt | Transcription complète horodatée (sous-titres automatiques anglais) ; Pz8f0wWW12M.fr.vtt : traduction française automatique |
| outils/ | Scripts pour régénérer les données et tester hors ligne |

## Les vidéos

| N° | Vidéo | Durée |
|---|---|---|
| 00 | [The Only Orderflow Guide You'll Ever Need](https://www.youtube.com/watch?v=Pz8f0wWW12M) | 41:04 |
| 01 | [Complete Guide on Futures Contracts (EP.1)](https://www.youtube.com/watch?v=Vinyl5fKDW8) | 21:18 |
| 02 | [The Only Orderflow Basics Video You'll Ever Need (EP.2)](https://www.youtube.com/watch?v=xR5-jm_KA9k) | 13:06 |
| 03 | [Full MBO Orderflow Guide (EP3)](https://www.youtube.com/watch?v=z2cf2KIOA7I) | 11:02 |
| 04 | [Stop Drawing Liquidity Lines... Use THIS Instead](https://www.youtube.com/watch?v=r1cIAW0zr3Q) | 16:35 |
| 05 | [How Banks Hide their Orders Behind Price: a Guide on Icebergs](https://www.youtube.com/watch?v=WPAP7JaVzF4) | 13:25 |
| 06 | [banks don't hunt for your stop loss...](https://www.youtube.com/watch?v=2Mm_1wS40m0) | 20:35 |
| 07 | [The Only FOOTPRINT Chart Guide you'll Ever Need](https://www.youtube.com/watch?v=h4emw9_2LU8) | 14:52 |
| 08 | [I Analyzed 1.000 "Stop Hunts" with Orderflow](https://www.youtube.com/watch?v=3MID2HLZS30) | 13:16 |
| 09 | [I Traded with a Professional Scalper](https://www.youtube.com/watch?v=cLgdXZnLL_0) | 34:16 |
| 10 | [3 Order-flow Trading Tricks Exposed!](https://www.youtube.com/watch?v=o-w5Gxss6T0) | 8:35 |
| 11 | [The Indicator Banks ACTUALLY Use - Full Guide to VWAP](https://www.youtube.com/watch?v=R5L890juvRw) | 10:31 |
| 12 | [My Top 3 Trades from the Competition](https://www.youtube.com/watch?v=0jM5Y31YJak) | 8:19 |
| 13 | [My Favorite Orderflow Indicator: Beginners Guide to CVD](https://www.youtube.com/watch?v=Ni6quY00dcw) | 14:15 |
| 14 | [Trading LIVE with a World TOP Ranked Scalper](https://www.youtube.com/watch?v=tvERE-Beu2U) | 3:34:10 |
| 15 | [How to ACTUALLY Make your first $10k Trading](https://www.youtube.com/watch?v=3Zs52kfCwiU) | 33:27 |
| 16 | [EXPOSING How Banks Hide their Trades](https://www.youtube.com/watch?v=JR50FQIQN2A) | 30:15 |
| 17 | [Making 13.000$ in 4h Trading during the War](https://www.youtube.com/watch?v=XE2MQJE5yIY) | 17:42 |
| 18 | [Using Orderflow to Make $4000 in 1h](https://www.youtube.com/watch?v=9IliXww64uM) | 13:47 |
| 19 | [How to ACTUALLY use Volume Profiles](https://www.youtube.com/watch?v=qihraSSdI_M) | 24:16 |
| 20 | [The Only Trading STRATEGY you'll EVER need](https://www.youtube.com/watch?v=e_RlG84pq6g) | 42:08 |
| 21 | [Ultimate Beginner Guide to Pro Trading](https://www.youtube.com/watch?v=KfjjHv7DB8o) | 4:55:45 |
| 22 | [I Got Funded 150.000$ with This Strategy](https://www.youtube.com/watch?v=kYX05qESJMs) | 29:59 |

## Régénérer les données (outils/)

Prérequis : `pip install yt-dlp`, Node 22 (pour l'exécution JavaScript de yt-dlp), Python 3 avec Pillow, ffmpeg.
À lancer depuis un dossier de travail (hors du dépôt) où l'on a copié les scripts :

- `./subs.sh ID…` : sous-titres anglais (essais répétés si YouTube demande une vérification anti-robot).
- `python3 vtt2txt.py ID.en-orig.vtt > ID.txt` : transcription horodatée par blocs de 30 s.
- `./sbs.sh ID…` : planches d'aperçu 320 × 180 (client « mweb »), puis découpage en images (`sb.py`).
- `python3 sheet.py ID début_s fin_s` : planches contact de 12 images horodatées pour un passage.
- `python3 planches.py ID sortie [pas]` : planches de toute la vidéo (dossier images/) ; `python3 references.py sortie` :
  images clés (dossier references/).
- En local, avec un navigateur connecté à YouTube, on peut aussi télécharger la vidéo complète
  (`yt-dlp --cookies-from-browser chrome -f 18 URL`) puis extraire des images avec ffmpeg
  (`ffmpeg -i video.mp4 -vf fps=1/5 img_%04d.jpg`).

Tests hors ligne de l'interface :
- `node outils/gen-enregistrement.mjs data/rec.ndjson.gz` puis `REPLAY=data/rec.ndjson.gz SPEED=0 npm run collector`
  et `npm run dev --prefix web` ;
- scénarios Playwright à partir de `outils/playwright-aide.mjs`.

## Images clés (references/)

- [00-deep-trades-fenetre-de-reglages.jpg](references/00-deep-trades-fenetre-de-reglages.jpg)
- [00-deep-trades-gros-ordres-par-prix.jpg](references/00-deep-trades-gros-ordres-par-prix.jpg)
- [00-footprint-et-dom-deepcharts.jpg](references/00-footprint-et-dom-deepcharts.jpg)
- [00-outil-position.jpg](references/00-outil-position.jpg)
- [04-heatmap-carnet-et-dom.jpg](references/04-heatmap-carnet-et-dom.jpg)
- [04-heatmap-cassure-du-plus-bas.jpg](references/04-heatmap-cassure-du-plus-bas.jpg)
- [04-heatmap-nuage-des-teneurs-de-marche.jpg](references/04-heatmap-nuage-des-teneurs-de-marche.jpg)
- [04-heatmap-reglage-du-contraste.jpg](references/04-heatmap-reglage-du-contraste.jpg)
- [05-footprint-profil-iceberg-et-valeurs-sous-bougies.jpg](references/05-footprint-profil-iceberg-et-valeurs-sous-bougies.jpg)
- [05-iceberg-alerte.jpg](references/05-iceberg-alerte.jpg)
- [05-iceberg-indicateur-reglages.jpg](references/05-iceberg-indicateur-reglages.jpg)
- [06-heatmap-niveau-vide-par-stop-run.jpg](references/06-heatmap-niveau-vide-par-stop-run.jpg)
- [07-footprint-poc-et-desequilibres.jpg](references/07-footprint-poc-et-desequilibres.jpg)
- [07-footprint-volume-delta-et-profil.jpg](references/07-footprint-volume-delta-et-profil.jpg)
- [07-footprint-zone-absorption-et-desequilibres.jpg](references/07-footprint-zone-absorption-et-desequilibres.jpg)
- [08-stop-run-au-footprint.jpg](references/08-stop-run-au-footprint.jpg)
- [10-cvd-plus-bas-et-prix-plat.jpg](references/10-cvd-plus-bas-et-prix-plat.jpg)
- [10-profil-plage-fixe-bougies-masquees.jpg](references/10-profil-plage-fixe-bougies-masquees.jpg)
- [10-valeurs-delta-volume-sous-bougies.jpg](references/10-valeurs-delta-volume-sous-bougies.jpg)
- [13-cvd-divergence-absorption.jpg](references/13-cvd-divergence-absorption.jpg)
- [13-cvd-en-bougies.jpg](references/13-cvd-en-bougies.jpg)
- [13-valeurs-sous-bougies-delta-pct.jpg](references/13-valeurs-sous-bougies-delta-pct.jpg)
- [14-cvd-en-bougies-divergence.jpg](references/14-cvd-en-bougies-divergence.jpg)
- [14-gros-trades-filtres-1-min.jpg](references/14-gros-trades-filtres-1-min.jpg)
- [14-profil-de-compression-value-area.jpg](references/14-profil-de-compression-value-area.jpg)
- [14-profil-de-la-premiere-a-la-derniere-bulle.jpg](references/14-profil-de-la-premiere-a-la-derniere-bulle.jpg)
- [16-deepdom-iceberg-tracker.jpg](references/16-deepdom-iceberg-tracker.jpg)
- [16-reglage-source-mbp-mbo.jpg](references/16-reglage-source-mbp-mbo.jpg)
- [18-composite-10-jours-et-lvn.jpg](references/18-composite-10-jours-et-lvn.jpg)
- [18-footprint-absorption-sous-ib.jpg](references/18-footprint-absorption-sous-ib.jpg)
- [19-composite-90-jours.jpg](references/19-composite-90-jours.jpg)
- [19-profils-seance-cash-et-nuit.jpg](references/19-profils-seance-cash-et-nuit.jpg)
- [19-volume-profile-value-area.jpg](references/19-volume-profile-value-area.jpg)
- [20-pbd-profil-sur-range-journalier.jpg](references/20-pbd-profil-sur-range-journalier.jpg)
- [21-footprint-cellule-anormale.jpg](references/21-footprint-cellule-anormale.jpg)
- [21-footprint-fond-delta-texte-desequilibre.jpg](references/21-footprint-fond-delta-texte-desequilibre.jpg)
- [22-stats-sous-bougies-stop-run.jpg](references/22-stats-sous-bougies-stop-run.jpg)

Les vignettes viennent des aperçus YouTube (320 × 180) : assez pour voir la mise en page et les outils, pas toujours pour lire
les chiffres. Pour la pleine résolution, télécharger les vidéos en local (voir plus haut) et extraire les images avec
ffmpeg aux horodatages des rapports.
