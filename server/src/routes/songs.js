import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../lib/db.js';
import { PART_ROLES, findPartPdf } from '../lib/parts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Sono ammessi solo file PDF'));
    }
    cb(null, true);
  },
});

function pdfPath(id) {
  return path.join(uploadsDir, `${id}.pdf`);
}

export function songsRouter({ io }) {
  const router = Router();

  router.get('/', async (req, res) => {
    await db.read();
    const songs = db.data.songs.map(({ id, title, artist, lineCount }) => ({
      id,
      title,
      artist,
      lineCount,
    }));
    res.json(songs);
  });

  router.get('/:id', async (req, res) => {
    await db.read();
    const song = db.data.songs.find((s) => s.id === req.params.id);
    if (!song) return res.status(404).json({ error: 'Canzone non trovata' });
    res.json(song);
  });

  // Per quali strumenti esiste un PDF dedicato (stesso nome della canzone).
  router.get('/:id/parts', async (req, res) => {
    await db.read();
    const song = db.data.songs.find((s) => s.id === req.params.id);
    if (!song) return res.status(404).json({ error: 'Canzone non trovata' });
    const parts = {};
    for (const role of PART_ROLES) {
      parts[role] = Boolean(await findPartPdf(role, song));
    }
    res.json(parts);
  });

  // Con ?role=chitarra|batteria serve la parte dello strumento se esiste,
  // altrimenti ricade sul PDF del cantante (stessa risposta di sempre).
  router.get('/:id/pdf', async (req, res) => {
    await db.read();
    const song = db.data.songs.find((s) => s.id === req.params.id);
    if (!song) return res.status(404).json({ error: 'Canzone non trovata' });

    let file = pdfPath(song.id);
    if (PART_ROLES.includes(req.query.role)) {
      file = (await findPartPdf(req.query.role, song)) ?? file;
    }

    res.sendFile(file, { dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'PDF non trovato' });
    });
  });

  router.post('/', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nessun file PDF ricevuto' });

      let lines;
      try {
        lines = JSON.parse(req.body.lines || '[]');
      } catch {
        return res.status(400).json({ error: 'Righe del testo non valide' });
      }
      if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(422).json({ error: 'Nessun testo estratto dal PDF' });
      }

      const title = req.body.title?.trim() || req.file.originalname.replace(/\.pdf$/i, '');
      const artist = req.body.artist?.trim() || '';
      // Nome originale del file (inviato dal client in UTF-8): serve ad
      // abbinare le parti di chitarra/batteria anche se il titolo è stato cambiato.
      const fileName = req.body.fileName?.trim() || '';
      const id = nanoid(10);

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(pdfPath(id), req.file.buffer);

      const song = {
        id,
        title,
        artist,
        fileName,
        lines,
        lineCount: lines.length,
        createdAt: new Date().toISOString(),
      };

      await db.update(({ songs }) => songs.push(song));
      io.emit('songs:changed');
      res.status(201).json(song);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    await db.update(({ songs }) => {
      const idx = songs.findIndex((s) => s.id === req.params.id);
      if (idx !== -1) songs.splice(idx, 1);
    });
    await fs.rm(pdfPath(req.params.id), { force: true });
    io.emit('songs:changed');
    res.status(204).end();
  });

  return router;
}
