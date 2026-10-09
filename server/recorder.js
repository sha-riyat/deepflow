// Enregistrement et relecture des frames (une ligne JSON par frame, compressé en gzip).
// La première ligne contient les métadonnées ({ meta: true, symbol, market, bucket, ... }).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';

export class Recorder {
  constructor(dir, meta) {
    fs.mkdirSync(dir, { recursive: true });
    this.dir = dir;
    this.meta = meta;
    this.day = null;
    this.gz = null;
    // Vide régulièrement le tampon gzip pour limiter la perte en cas d'arrêt brutal.
    this.timer = setInterval(() => this.gz?.flush(), 10_000);
  }

  write(frame) {
    const day = new Date(frame.t).toISOString().slice(0, 10);
    if (day !== this.day) this.#rotate(day, frame.t);
    this.gz.write(JSON.stringify(frame) + '\n');
  }

  #rotate(day, t) {
    this.gz?.end();
    this.day = day;
    const stamp = new Date(t).toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    const file = path.join(this.dir, `${this.meta.symbol}-${this.meta.market}-${stamp}.ndjson.gz`);
    this.gz = zlib.createGzip();
    this.gz.pipe(fs.createWriteStream(file));
    this.gz.write(JSON.stringify({ meta: true, ...this.meta }) + '\n');
    console.log(`enregistrement → ${file}`);
  }

  close() {
    clearInterval(this.timer);
    this.gz?.end();
  }
}

// Itère sur les objets d'un enregistrement (.ndjson ou .ndjson.gz).
// Un fichier tronqué (arrêt brutal) est lu jusqu'à la dernière ligne complète.
export async function* readRecording(file) {
  let input = fs.createReadStream(file);
  if (file.endsWith('.gz')) {
    const gunzip = zlib.createGunzip({ finishFlush: zlib.constants.Z_SYNC_FLUSH });
    input.pipe(gunzip);
    input = gunzip;
  }
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line) continue;
      try {
        yield JSON.parse(line);
      } catch {
        return; // dernière ligne incomplète
      }
    }
  } catch (err) {
    if (err.code !== 'Z_BUF_ERROR') throw err;
  }
}

export async function readMeta(file) {
  for await (const obj of readRecording(file)) return obj.meta ? obj : null;
  return null;
}
