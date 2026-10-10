// Fenêtres détachables : chaque fenêtre du navigateur est un espace de travail complet, avec sa
// propre mise en page (`/?w=identifiant` ; sans paramètre : la fenêtre principale). Elles se
// parlent par un BroadcastChannel : réticule synchronisé et liens par couleur d'une fenêtre à
// l'autre (posez-les sur plusieurs écrans).
export type WindowMessage =
  | { type: 'cross'; t: number | null }
  | { type: 'link'; link: string; key?: string; series?: { type: string; param: number } };

export const windowId = typeof location === 'undefined' ? '' : new URLSearchParams(location.search).get('w') ?? '';

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('deepflow');
const handlers = new Set<(m: WindowMessage) => void>();
if (channel) channel.onmessage = (e) => handlers.forEach((fn) => fn(e.data as WindowMessage));

export function post(m: WindowMessage) {
  channel?.postMessage(m);
}

export function onWindowMessage(fn: (m: WindowMessage) => void): () => void {
  handlers.add(fn);
  return () => handlers.delete(fn);
}

// Ouvre une nouvelle fenêtre ; `prepare(id)` enregistre d'abord sa mise en page.
export function openWindow(prepare: (id: string) => void) {
  const id = Math.random().toString(36).slice(2, 8);
  prepare(id);
  window.open(`/?w=${id}`, `deepflow-${id}`, 'popup,width=1280,height=800');
}
