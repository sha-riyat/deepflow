#!/bin/bash
# subs.sh ID... : sous-titres anglais (auto, langue d'origine), plusieurs essais par vidéo.
for id in "$@"; do
  for i in 1 2 3 4 5 6 7 8; do
    yt-dlp --js-runtimes node --extractor-args "youtube:player_client=android_vr" --skip-download \
      --write-auto-subs --write-subs --sub-langs "en-orig,en" --sub-format vtt \
      -o "%(id)s.%(ext)s" --no-progress "https://www.youtube.com/watch?v=$id" > "slog-$id.txt" 2>&1
    ls $id.en*.vtt >/dev/null 2>&1 && { echo "OK $id"; break; }
    sleep $((i * 4))
  done
  ls $id.en*.vtt >/dev/null 2>&1 || echo "ÉCHEC $id"
done
