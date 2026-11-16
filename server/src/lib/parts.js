import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ruoli che hanno una propria cartella di PDF. Il cantante usa i PDF caricati
// dal browser, quindi non compare qui.
export const PART_ROLES = ['chitarra', 'batteria'];

// Cartella che contiene le sottocartelle `chitarra/` e `batteria/`.
// Si può puntare alla cartella sincronizzata da Google Drive per desktop:
//   PARTS_DIR="G:\Il mio Drive\Musica" npm start
export const PARTS_DIR = process.env.PARTS_DIR
  ? path.resolve(process.env.PARTS_DIR)
  : path.join(__dirname, '..', '..', 'data', 'parts');

/**
 * Normalizza un nome per l'abbinamento: niente maiuscole, accenti,
 * estensione .pdf né punteggiatura ("Baila Morena +3.pdf" → "baila morena 3").
 */
export function normalizeName(name) {
  const base = String(name).replace(/\.pdf$/i, '');
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return normalized || base.toLowerCase().trim();
}

async function findRoleDir(role) {
  try {
    const entries = await fs.readdir(PARTS_DIR, { withFileTypes: true });
    const dir = entries.find((e) => e.isDirectory() && e.name.toLowerCase() === role);
    return dir ? path.join(PARTS_DIR, dir.name) : null;
  } catch {
    return null;
  }
}

/**
 * Cerca nella cartella del ruolo il PDF con lo stesso nome della canzone
 * (titolo o nome del file caricato dal cantante). Ritorna il percorso
 * assoluto oppure null se non esiste.
 */
export async function findPartPdf(role, song) {
  if (!PART_ROLES.includes(role)) return null;

  const dir = await findRoleDir(role);
  if (!dir) return null;

  const wanted = new Set([song.title, song.fileName].filter(Boolean).map(normalizeName));

  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return null;
  }

  const match = files.find((file) => /\.pdf$/i.test(file) && wanted.has(normalizeName(file)));
  return match ? path.join(dir, match) : null;
}
