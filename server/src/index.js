import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { db } from './lib/db.js';
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

  socket.on('song:select', async ({ songId }) => {
    await db.read();
    const song = db.data.songs.find((s) => s.id === songId);
    if (!song) return;
    io.emit('state:update', setSong(songId));
  });

  socket.on('scroll:step', ({ delta }) => {
    io.emit('state:update', stepScroll(delta));
  });

  socket.on('scroll:set', ({ fraction }) => {
    io.emit('state:update', setScroll(fraction));
  });

  socket.on('settings:fontSize', ({ fontSize }) => {
    io.emit('state:update', setFontSize(fontSize));
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server gobbo in ascolto su http://0.0.0.0:${PORT}`);
});
