# sheet.py id [début_s fin_s] : planches contact de 12 images (4 x 3) avec leur horodatage.
import os, sys, json
from PIL import Image, ImageDraw
vid = sys.argv[1]; d = f'frames/{vid}'
times = json.load(open(f'{d}/times.json'))
lo, hi = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0, 1e9)
idx = [i for i, t in enumerate(times) if lo <= t <= hi]
os.makedirs(f'sheets/{vid}', exist_ok=True)
for s in range(0, len(idx), 12):
    sheet = Image.new('RGB', (320 * 4, 190 * 3), 'black'); dr = ImageDraw.Draw(sheet)
    for k, i in enumerate(idx[s:s + 12]):
        x, y = (k % 4) * 320, (k // 4) * 190
        sheet.paste(Image.open(f'{d}/{i:04d}.jpg'), (x, y + 10)); t = int(times[i])
        dr.text((x + 2, y), f'{t // 60:02d}:{t % 60:02d}', fill='yellow')
    name = f'sheets/{vid}/{int(times[idx[s]]):05d}.jpg'; sheet.save(name, quality=88); print(name)
