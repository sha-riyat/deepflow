// Lanceur pour un usage quotidien (double-clic sur deepflow.cmd ou deepflow.command) : vérifie
// Node, installe les dépendances de l'interface la première fois, construit la version optimisée
// si les sources ont changé, démarre le collecteur et l'interface, puis ouvre le navigateur.
// Ctrl+C (ou fermer la fenêtre) arrête tout. Option --no-open : sans ouvrir le navigateur.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_NODE, needsBuild, nodeOk, openCommand } from './checks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const URL_UI = 'http://localhost:3000';
const SOURCES = ['web/app', 'web/components', 'web/lib', 'shared', 'web/package.json', 'web/next.config.mjs', 'web/tsconfig.json'];
const say = (text) => console.log(`\n[deepflow] ${text}`);

function fail(text) {
  console.error(`\n[deepflow] ${text}`);
  process.exit(1);
}

// Commande npm visible dans la fenêtre ; rejet si elle échoue.
function run(args, cwd = root) {
  return new Promise((resolve, reject) => {
    const p = spawn('npm', args, { cwd, stdio: 'inherit', shell: true });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} : code ${code}`))));
  });
}

// Date de modification la plus récente de chaque fichier source (dossiers parcourus).
function mtimes(p) {
  if (!fs.existsSync(p)) return [];
  const st = fs.statSync(p);
  if (!st.isDirectory()) return [st.mtimeMs];
  return fs.readdirSync(p).flatMap((name) => (name === 'node_modules' ? [] : mtimes(path.join(p, name))));
}

const portBusy = (port) => new Promise((resolve) => {
  const s = net.connect(port, '127.0.0.1');
  s.on('connect', () => (s.destroy(), resolve(true)));
  s.on('error', () => resolve(false));
});

function openBrowser() {
  if (process.argv.includes('--no-open')) return;
  const [cmd, args] = openCommand(process.platform, URL_UI);
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => say(`Ouvrez ${URL_UI} dans votre navigateur.`)).unref();
}

async function waitForUi(ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(URL_UI)).ok) return true;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  if (!nodeOk(process.version)) {
    fail(`Node.js ${MIN_NODE.join('.')} ou plus récent est nécessaire (installé : ${process.version}). Téléchargez la version LTS sur https://nodejs.org puis relancez.`);
  }
  if (await portBusy(3000) || await portBusy(8787)) {
    say(`deepflow semble déjà lancé (ports 3000 ou 8787 occupés) : ouverture de ${URL_UI}.`);
    openBrowser();
    return;
  }
  if (!fs.existsSync(path.join(web, 'node_modules', 'next'))) {
    say('Première utilisation : installation des dépendances de l’interface (quelques minutes)…');
    await run(['ci', '--no-audit', '--no-fund'], web);
  }
  const buildId = path.join(web, '.next', 'BUILD_ID');
  const built = fs.existsSync(buildId) ? fs.statSync(buildId).mtimeMs : null;
  if (needsBuild(built, SOURCES.flatMap((s) => mtimes(path.join(root, s))))) {
    say('Construction de l’interface optimisée (une minute environ)…');
    await run(['run', 'build'], web);
  }
  say('Démarrage du collecteur (port 8787) et de l’interface (port 3000)…');
  const procs = [
    spawn(process.execPath, ['server/index.js'], { cwd: root, stdio: 'inherit' }),
    spawn('npm', ['run', 'start'], { cwd: web, stdio: 'inherit', shell: true }),
  ];
  const stop = () => {
    for (const p of procs) p.kill('SIGINT');
    setTimeout(() => process.exit(0), 500);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  for (const p of procs) p.on('exit', (code) => code && say(`un processus s’est arrêté (code ${code}) ; fermez cette fenêtre et relancez.`));
  if (await waitForUi()) {
    say(`Prêt : ${URL_UI} (laissez cette fenêtre ouverte ; Ctrl+C pour arrêter).`);
    openBrowser();
  } else say(`L’interface tarde à répondre ; essayez d’ouvrir ${URL_UI}.`);
}

main().catch((err) => fail(`${err.message}\nVérifiez votre connexion Internet (première installation) puis relancez.`));
