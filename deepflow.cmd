@echo off
rem Lance deepflow sous Windows : double-cliquez sur ce fichier (laissez la fenetre ouverte).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Installez la version LTS depuis https://nodejs.org puis relancez.
  pause
  exit /b 1
)
node scripts\launch.js
if errorlevel 1 pause
