// Lance le collecteur (port 8787) et l'interface Next.js (port 3000) ; Ctrl+C arrête les deux.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'start' ? 'start' : 'dev';
const procs = [
  spawn(process.execPath, ['server/index.js'], { cwd: root, stdio: 'inherit' }),
  spawn('npm', ['run', mode], { cwd: path.join(root, 'web'), stdio: 'inherit', shell: true }),
];
const stop = () => {
  for (const p of procs) p.kill('SIGINT');
  setTimeout(() => process.exit(0), 500);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const p of procs) p.on('exit', (code) => code && code !== 0 && console.error(`processus arrêté (code ${code})`));
