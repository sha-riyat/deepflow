// Vérifications du lanceur (voir launch.js) : version de Node, interface à (re)construire.

export const MIN_NODE = [22, 4];

// Version de Node suffisante (« v22.11.0 » -> vrai).
export function nodeOk(version, min = MIN_NODE) {
  const [maj, minor] = String(version).replace(/^v/, '').split('.').map(Number);
  return maj > min[0] || (maj === min[0] && minor >= min[1]);
}

// L'interface optimisée est à reconstruire si elle n'existe pas ou si une source est plus récente.
export function needsBuild(buildTime, sourceTimes) {
  return buildTime === null || sourceTimes.some((t) => t > buildTime);
}

// Commande qui ouvre une adresse dans le navigateur par défaut.
export function openCommand(platform, url) {
  if (platform === 'win32') return ['cmd', ['/c', 'start', '""', url]];
  if (platform === 'darwin') return ['open', [url]];
  return ['xdg-open', [url]];
}
