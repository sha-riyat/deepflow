# Analyse des vidéos d'order flow (Fabervaale / DeepCharts)

Dossier de travail pour reprendre le chantier « outils vus dans les vidéos » en local.

| Fichier | Contenu |
|---|---|
| PLAN.md | Plan d'intégration complet dans deepflow : 12 lots, principe, données, fichiers, tests, état d'avancement |
| SYNTHESE.md | Ce qui est enseigné, par qui, jugement sur la maîtrise, ce que deepflow a déjà |
| BESOINS-BRUTS.md | Notes de travail : besoins relevés vidéo par vidéo |
| videos/NN-ID.md | Rapport détaillé par vidéo : résumé, outils et réglages, règles et stratégies, moments clés horodatés, évaluation critique, transposition à Binance, manques pour deepflow |
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
- En local, avec un navigateur connecté à YouTube, on peut aussi télécharger la vidéo complète
  (`yt-dlp --cookies-from-browser chrome -f 18 URL`) puis extraire des images avec ffmpeg
  (`ffmpeg -i video.mp4 -vf fps=1/5 img_%04d.jpg`).

Tests hors ligne de l'interface :
- `node outils/gen-enregistrement.mjs data/rec.ndjson.gz` puis `REPLAY=data/rec.ndjson.gz SPEED=0 npm run collector`
  et `npm run dev --prefix web` ;
- scénarios Playwright à partir de `outils/playwright-aide.mjs`.
