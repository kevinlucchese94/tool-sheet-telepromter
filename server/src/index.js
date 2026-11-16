import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { db } from './lib/db.js';
import { PART_ROLES, PARTS_DIR } from './lib/parts.js';
import { songsRouter } from './routes/songs.js';
import { getState, setSong, setScroll, stepScroll, setFontSize } from './lib/playbackState.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api/songs', songsRouter({ io }));

// In produzione il client Vite è già buildato in client/dist:
// il server serve direttamente quel bundle, così sul PC/iPad basta
// aprire http://<ip-del-server>:4000
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

io.on('connection', (socket) => {
  socket.emit('state:update', getState());

  // Per chi apre una vista senza ricaricare la pagina (es. dopo "Cambia ruolo"):
  // lo stato arriva solo a chi lo chiede, senza disturbare gli altri client.
  socket.on('state:get', () => {
    socket.emit('state:update', getState());
  });

  socket.on('song:select', async ({ songId }) => {
    await db.read();
    const song = db.data.songs.find((s) => s.id === songId);
    if (!song) return;
    io.emit('state:update', setSong(songId));
  });

  // `role` (chitarra | batteria) fa scorrere solo la parte di quello
  // strumento; senza ruolo scorre il cantante, come prima.
  socket.on('scroll:step', ({ delta, role }) => {
    io.emit('state:update', stepScroll(delta, role));
  });

  socket.on('scroll:set', ({ fraction, role }) => {
    io.emit('state:update', setScroll(fraction, role));
  });

  socket.on('settings:fontSize', ({ fontSize }) => {
    io.emit('state:update', setFontSize(fontSize));
  });
});

// Crea le cartelle delle parti se non esistono, così basta trascinarci i PDF.
await Promise.all(PART_ROLES.map((role) => fs.mkdir(path.join(PARTS_DIR, role), { recursive: true }).catch(() => {})));

httpServer.listen(PORT, () => {
  console.log(`Server gobbo in ascolto su http://0.0.0.0:${PORT}`);
  console.log(`Parti chitarra/batteria lette da: ${PARTS_DIR}`);
});
