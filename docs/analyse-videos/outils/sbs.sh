#!/bin/bash
# sbs.sh ID... : planches d'images 320 x 180 (client mobile), plusieurs essais, puis extraction.
for id in "$@"; do
  for i in 1 2 3 4 5 6; do
    [ -s "$id.sb.mhtml" ] && break
    timeout 600 yt-dlp --js-runtimes node --extractor-args "youtube:player_client=mweb" -f sb0 \
      -o "%(id)s.sb.%(ext)s" --no-progress "https://www.youtube.com/watch?v=$id" > "blog-$id.txt" 2>&1
    sleep $((i * 5))
  done
  if [ -s "$id.sb.mhtml" ]; then python3 sb.py "$id"; else echo "ÉCHEC $id"; fi
done
