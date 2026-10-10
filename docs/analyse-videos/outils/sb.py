# sb.py id : planches (mhtml de yt-dlp) -> images frames/<id>/NNNN.jpg (vignettes de 320 x 180),
# lues à l'octet près (Content-Length de chaque partie), avec l'horodatage de chaque image.
import os, re, sys, io, json
from PIL import Image
vid = sys.argv[1]
raw = open(f'{vid}.sb.mhtml', 'rb').read()
sec = lambda s: sum(float(x) * k for x, k in zip(s.decode().replace(',', '.').split(':'), (3600, 60, 1)))
spans = [(sec(a), sec(b)) for a, b in re.findall(rb'Slide #\d+: ([\d:,]+) \xe2\x80\x93 ([\d:,]+)', raw)]
imgs = []
for m in re.finditer(rb'(?i)Content-Type: image/jpeg\r?\n(?:[^\r\n]+\r?\n)*\r?\n', raw):
    head = m[0]
    n = int(re.search(rb'(?i)Content-Length: (\d+)', head)[1])
    imgs.append(raw[m.end():m.end() + n])
out = f'frames/{vid}'; os.makedirs(out, exist_ok=True)
times, k = [], 0
for i, b in enumerate(imgs):
    im = Image.open(io.BytesIO(b)); w, h = im.size; cols, rows = w // 320, h // 180
    t0, t1 = spans[i] if i < len(spans) else (0, 0)
    for j in range(rows * cols):
        r, c = divmod(j, cols)
        tile = im.crop((c * 320, r * 180, (c + 1) * 320, (r + 1) * 180))
        if tile.getextrema()[0][1] < 10: continue
        tile.save(f'{out}/{k:04d}.jpg'); times.append(round(t0 + (t1 - t0) * j / (cols * rows), 1)); k += 1
json.dump(times, open(f'{out}/times.json', 'w'))
print(vid, len(imgs), 'planches', k, 'images')
