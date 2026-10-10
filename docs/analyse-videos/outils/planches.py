# planches.py id sortie [pas] : toutes les images d'une vidéo en planches de 12 (4 x 3), horodatées,
# nommées par l'heure de la première image (ex. 0h12m30.jpg) ; pas = garder une image sur `pas`.
import os, sys, json
from PIL import Image, ImageDraw
vid, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
d = f'frames/{vid}'
times = json.load(open(f'{d}/times.json'))
idx = list(range(0, len(times), step))
os.makedirs(out, exist_ok=True)
hms = lambda t: f'{int(t) // 3600}h{int(t) % 3600 // 60:02d}m{int(t) % 60:02d}'
for s in range(0, len(idx), 12):
    group = idx[s:s + 12]
    sheet = Image.new('RGB', (320 * 4, 192 * 3), 'black'); dr = ImageDraw.Draw(sheet)
    for k, i in enumerate(group):
        x, y = (k % 4) * 320, (k // 4) * 192
        sheet.paste(Image.open(f'{d}/{i:04d}.jpg'), (x, y + 12))
        t = int(times[i]); dr.text((x + 3, y), f'{t // 3600}:{t % 3600 // 60:02d}:{t % 60:02d}', fill='yellow')
    sheet.save(f'{out}/{hms(times[group[0]])}.jpg', quality=72, optimize=True)
print(vid, (len(idx) + 11) // 12, 'planches')
