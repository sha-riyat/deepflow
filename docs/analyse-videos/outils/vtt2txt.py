# vtt2txt.py fichier.vtt : texte horodaté (une ligne par ~30 s), doublons des sous-titres auto retirés.
import re, sys
lines = open(sys.argv[1], encoding='utf-8').read().splitlines()
out, last, t, buf, start = [], '', None, [], None
for ln in lines:
    m = re.match(r'(\d+):(\d+):(\d+)\.\d+ -->', ln)
    if m:
        t = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]); continue
    if not ln.strip() or ln.startswith(('WEBVTT', 'Kind:', 'Language:')) or '-->' in ln: continue
    txt = re.sub(r'<[^>]+>', '', ln).strip()
    if not txt or txt == last: continue
    last = txt
    if start is None: start = t
    buf.append(txt)
    if t is not None and t - start >= 30:
        out.append(f'[{start//60:02d}:{start%60:02d}] ' + ' '.join(buf)); buf, start = [], None
if buf: out.append(f'[{(start or 0)//60:02d}:{(start or 0)%60:02d}] ' + ' '.join(buf))
print('\n'.join(out))
