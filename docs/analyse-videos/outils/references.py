# references.py sortie : images clés par outil (bande de 3 images autour du moment cité dans les rapports :
# les horodatages des sous-titres sont approximatifs).
import os, sys, json
from PIL import Image, ImageDraw
REFS = [
    ('00', 'Pz8f0wWW12M', 377, 'footprint-et-dom-deepcharts'),
    ('00', 'Pz8f0wWW12M', 2265, 'deep-trades-gros-ordres-par-prix'),
    ('00', 'Pz8f0wWW12M', 2305, 'deep-trades-fenetre-de-reglages'),
    ('00', 'Pz8f0wWW12M', 2394, 'outil-position'),
    ('04', 'r1cIAW0zr3Q', 98, 'heatmap-carnet-et-dom'),
    ('04', 'r1cIAW0zr3Q', 128, 'heatmap-nuage-des-teneurs-de-marche'),
    ('04', 'r1cIAW0zr3Q', 187, 'heatmap-reglage-du-contraste'),
    ('04', 'r1cIAW0zr3Q', 729, 'heatmap-cassure-du-plus-bas'),
    ('05', 'WPAP7JaVzF4', 457, 'footprint-profil-iceberg-et-valeurs-sous-bougies'),
    ('05', 'WPAP7JaVzF4', 611, 'iceberg-alerte'),
    ('05', 'WPAP7JaVzF4', 621, 'iceberg-indicateur-reglages'),
    ('06', '2Mm_1wS40m0', 750, 'heatmap-niveau-vide-par-stop-run'),
    ('07', 'h4emw9_2LU8', 257, 'footprint-poc-et-desequilibres'),
    ('07', 'h4emw9_2LU8', 396, 'footprint-volume-delta-et-profil'),
    ('07', 'h4emw9_2LU8', 594, 'footprint-zone-absorption-et-desequilibres'),
    ('08', '3MID2HLZS30', 526, 'stop-run-au-footprint'),
    ('10', 'o-w5Gxss6T0', 120, 'valeurs-delta-volume-sous-bougies'),
    ('10', 'o-w5Gxss6T0', 205, 'profil-plage-fixe-bougies-masquees'),
    ('10', 'o-w5Gxss6T0', 371, 'cvd-plus-bas-et-prix-plat'),
    ('13', 'Ni6quY00dcw', 197, 'valeurs-sous-bougies-delta-pct'),
    ('13', 'Ni6quY00dcw', 298, 'cvd-en-bougies'),
    ('13', 'Ni6quY00dcw', 335, 'cvd-divergence-absorption'),
    ('14', 'tvERE-Beu2U', 3594, 'profil-de-compression-value-area'),
    ('14', 'tvERE-Beu2U', 3828, 'gros-trades-filtres-1-min'),
    ('14', 'tvERE-Beu2U', 5144, 'profil-de-la-premiere-a-la-derniere-bulle'),
    ('14', 'tvERE-Beu2U', 9464, 'cvd-en-bougies-divergence'),
    ('16', 'JR50FQIQN2A', 858, 'reglage-source-mbp-mbo'),
    ('16', 'JR50FQIQN2A', 1186, 'deepdom-iceberg-tracker'),
    ('18', '9IliXww64uM', 194, 'composite-10-jours-et-lvn'),
    ('18', '9IliXww64uM', 459, 'footprint-absorption-sous-ib'),
    ('19', 'qihraSSdI_M', 265, 'volume-profile-value-area'),
    ('19', 'qihraSSdI_M', 957, 'profils-seance-cash-et-nuit'),
    ('19', 'qihraSSdI_M', 1120, 'composite-90-jours'),
    ('20', 'e_RlG84pq6g', 1505, 'pbd-profil-sur-range-journalier'),
    ('21', 'KfjjHv7DB8o', 12786, 'footprint-fond-delta-texte-desequilibre'),
    ('21', 'KfjjHv7DB8o', 12952, 'footprint-cellule-anormale'),
    ('22', 'kYX05qESJMs', 291, 'stats-sous-bougies-stop-run'),
]
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for num, vid, t, name in REFS:
    times = json.load(open(f'frames/{vid}/times.json'))
    i = min(range(len(times)), key=lambda k: abs(times[k] - t))
    picks = [max(0, i - 1), i, min(len(times) - 1, i + 1)]
    strip = Image.new('RGB', (320 * 3, 192), 'black'); dr = ImageDraw.Draw(strip)
    for k, j in enumerate(picks):
        strip.paste(Image.open(f'frames/{vid}/{j:04d}.jpg'), (k * 320, 12))
        s = int(times[j]); dr.text((k * 320 + 3, 0), f'{num} {s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}', fill='yellow')
    strip.save(f'{out}/{num}-{name}.jpg', quality=82, optimize=True)
print(len(REFS), 'références')
