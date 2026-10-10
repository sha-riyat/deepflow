#!/bin/bash
# Lance deepflow sur Mac : double-cliquez sur ce fichier dans le Finder (laissez la fenêtre ouverte).
cd "$(dirname "$0")" || exit 1
# Node installé avec nvm : chargé s'il existe (le Terminal ouvert par le Finder ne le charge pas).
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use >/dev/null 2>&1 || true
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js est introuvable. Installez la version LTS depuis https://nodejs.org puis relancez."
  read -r -p "Appuyez sur Entrée pour fermer."
  exit 1
fi
node scripts/launch.js || read -r -p "Appuyez sur Entrée pour fermer."
