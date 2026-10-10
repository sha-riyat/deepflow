// Journal de trading (voir shared/journal.js) gardé dans IndexedDB : les captures du graphique sont
// trop lourdes pour localStorage. Base indisponible (navigation privée stricte) : rien n'est gardé.
import { cleanEntry } from '@shared/journal.js';

export type JournalEntry = NonNullable<ReturnType<typeof cleanEntry>>;

const DB = 'deepflow';
const STORE = 'journal';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close()) as Promise<T>;
}

// Entrées vérifiées, les plus récentes d'abord.
export async function listEntries(): Promise<JournalEntry[]> {
  const raw = await run('readonly', (s) => s.getAll());
  return (raw as unknown[]).map(cleanEntry).filter((e): e is JournalEntry => e !== null).sort((a, b) => b.t - a.t);
}

export const putEntry = (e: JournalEntry) => run('readwrite', (s) => s.put(e));
export const deleteEntry = (id: string) => run('readwrite', (s) => s.delete(id));

export function download(name: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
