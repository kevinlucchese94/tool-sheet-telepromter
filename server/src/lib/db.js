import { JSONFilePreset } from 'lowdb/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, '..', '..', 'data', 'db.json');

const defaultData = { songs: [] };

export const db = await JSONFilePreset(dbFile, defaultData);
