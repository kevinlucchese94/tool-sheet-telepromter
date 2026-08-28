# Contribuire

Grazie per l'interesse! Progetto giovane, struttura semplice apposta per
essere facile da capire e modificare.

## Setup rapido

```bash
npm install
npm run dev
```

Server su `http://localhost:4000`, client Vite su `http://localhost:5173`
(con proxy verso il server per API e websocket).

## Struttura

- `server/src/index.js` — entrypoint, wiring di Express/Socket.IO.
- `server/src/routes/songs.js` — API REST per caricare/elencare/cancellare
  canzoni e servire il PDF originale (`GET /api/songs/:id/pdf`).
- `server/src/lib/playbackState.js` — stato condiviso (canzone corrente,
  frazione di scorrimento 0–1), tenuto in memoria.
- `client/src/lib/pdfjs.js` — estrazione delle righe di testo dal PDF,
  eseguita nel browser con `pdf.js` al momento dell'upload (usata per la
  modalità "solo testo" e per l'anteprima sul controller).
- `client/src/pages/Home.jsx` — repertorio + upload (chiama l'estrazione
  prima di mandare il PDF al server).
- `client/src/pages/Controller.jsx` — vista di controllo (cantante):
  pulsanti avanti/indietro, tastiera, dimensione testo.
- `client/src/pages/Display.jsx` — vista a schermo intero (gobbo): gestisce
  i tasti (frecce/spazio/PageUp/PageDown) e lo switch tra modalità PDF e
  testo.
- `client/src/components/PdfLyricsView.jsx` — rendering delle pagine PDF
  originali (in negativo) con scroll a frazione.
- `client/src/components/TextScroll.jsx` — stessa logica di scroll ma per
  l'elenco di righe di testo estratte.

## Dove serve più aiuto

- **Riconoscimento vocale / matching del testo cantato** (vedi roadmap nel
  README): è il pezzo più interessante e più difficile — ambiente rumoroso,
  voce con strumenti dal vivo. Se hai esperienza con speech recognition o
  audio processing, è il punto di ingresso migliore.
- Miglioramenti UX sul controller (feedback visivo, gestione errori upload).
- Test automatici (attualmente assenti).

## Linee guida

- Codice semplice, niente astrazioni premature: è un progetto per un caso
  d'uso reale e concreto, non un framework generico.
- Apri una issue prima di lavorare a feature grosse, per allinearsi
  sull'approccio.
