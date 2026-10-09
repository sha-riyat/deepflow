// Lecture minimale d'une archive zip contenant un seul fichier (format Binance Vision) :
// retourne un flux décompressé de ce fichier, sans dépendance externe.
import zlib from 'node:zlib';
import { Readable } from 'node:stream';

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

export function openSingleEntry(buf) {
  // Fin du répertoire central : cherchée en partant de la fin (commentaire éventuel).
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === EOCD) {
      e = i;
      break;
    }
  }
  if (e < 0) throw new Error('archive zip invalide (fin de répertoire introuvable)');
  const cd = buf.readUInt32LE(e + 16);
  if (buf.readUInt32LE(cd) !== CENTRAL) throw new Error('archive zip invalide (répertoire central)');
  const method = buf.readUInt16LE(cd + 10);
  const compSize = buf.readUInt32LE(cd + 20);
  const nameLen = buf.readUInt16LE(cd + 28);
  const local = buf.readUInt32LE(cd + 42);
  const name = buf.toString('utf8', cd + 46, cd + 46 + nameLen);
  if (buf.readUInt32LE(local) !== LOCAL) throw new Error('archive zip invalide (entête locale)');
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(start, start + compSize);
  const raw = Readable.from([data]);
  if (method === 0) return { name, stream: raw };
  if (method !== 8) throw new Error(`méthode de compression zip non gérée : ${method}`);
  return { name, stream: raw.pipe(zlib.createInflateRaw()) };
}
