# 🎤 tool-sheet-telepromter

Gobbo digitale per band. Carichi i testi delle canzoni (PDF), li scegli da un
tablet/telefono (il "controller") e li proietti a schermo intero, in tempo
reale, su un PC o su qualsiasi altro dispositivo collegato alla stessa rete
locale (il "gobbo").

Nato per un caso d'uso concreto: cantante con iPad in mano davanti a un PC
all-in-one usato come gobbo, tutto sulla stessa rete del mixer digitale
(es. Behringer X18).

## Stato del progetto

MVP funzionante: il PDF viene mostrato a schermo intero, sempre in negativo
(sfondo nero, scritte bianche) per il palco, e scorre con la tastiera —
freccia giù/destra o barra spaziatrice per avanzare, freccia su/sinistra o
shift+spazio per tornare indietro. Funziona anche con un pedale Bluetooth
"voltapagine" (quelli usati per gli spartiti), dato che questi in genere
emulano proprio questi tasti. Lo stesso comando è disponibile anche come
pulsanti grandi sul controller da tablet. Il riconoscimento vocale che
scorre da solo ascoltando chi canta è sul roadmap — vedi sotto — e non
ancora implementato: è un problema tecnicamente interessante (voce sul
palco, con basso/batteria/chitarre di sottofondo) ed è il punto dove più
aiuto serve.

## Come funziona

- **Backend** (`server/`): Node.js + Express + Socket.IO. Tiene lo stato
  condiviso (canzone corrente, quanto si è scorso, da 0 a 1) e lo
  sincronizza in tempo reale su tutti i client collegati — ogni display
  traduce questa frazione nella propria altezza scorribile, quindi la
  sincronizzazione funziona indipendentemente dalla risoluzione di ciascuno
  schermo. Salva il PDF originale e l'elenco delle righe di testo in un
  piccolo database JSON locale (`lowdb`) — nessun cloud, nessun account
  richiesto.
- **Frontend** (`client/`): React + Vite, tre viste:
  - `/` — repertorio: carica PDF, elenco canzoni, tocca per aprire il
    controller. L'estrazione del testo (tramite `pdf.js`) avviene nel
    browser al momento del caricamento.
  - `/controller/:id` — vista per il cantante: pulsanti avanti/indietro
    (o tastiera/pedale), controllo dimensione testo, barra di avanzamento.
  - `/display` — vista a schermo intero da aprire sul PC/gobbo (dimensiona
    tutto in base allo schermo del gobbo stesso, non del controller), con
    due modalità intercambiabili: **PDF originale** (la pagina vera e
    propria, accordi compresi, sempre in negativo) o **solo testo** (elenco
    scorrevole delle righe estratte, per canzoni senza bisogno di accordi).

Tutti i dispositivi comunicano tramite lo stesso server sulla rete locale:
niente internet necessario durante il live.

## Ruoli: cantante, chitarrista, batterista

La prima volta che si apre la pagina su un dispositivo viene chiesto
"Chi sei?" (la scelta resta salvata nel browser; si cambia da `/ruolo`).

- **Cantante**: tutto come descritto sopra. Sceglie la canzone dal
  repertorio e comanda il gobbo.
- **Chitarrista / batterista** (`/parte`): il loro tablet segue la canzone
  scelta dal cantante e mostra **la propria parte** a schermo intero, in
  negativo. Scorrono con ▲/▼ sullo schermo o con gli stessi tasti di
  tastiera/pedale, e **lo scroll è solo loro**: non muove il gobbo del
  cantante né la parte degli altri. Se per il brano non c'è una parte
  dedicata, vedono il PDF del cantante (con un avviso in alto), sempre con
  scroll indipendente.

### Dove mettere le parti di chitarra e batteria

Il server cerca i PDF in una cartella con una sottocartella per strumento:

```
<PARTS_DIR>/
├── chitarra/
│   └── Baila Morena +3.pdf
└── batteria/
    └── Baila Morena +3.pdf
```

Di default è `server/data/parts/` (creata al primo avvio). Per usare la
cartella sincronizzata da Google Drive per desktop, imposta `PARTS_DIR`
(la sottocartella `cantante/` eventualmente presente viene ignorata: il
cantante continua a caricare i PDF dal browser):

```bash
# macOS / Linux
PARTS_DIR="/percorso/di/Musica" npm start
```

```powershell
# Windows (PowerShell)
$env:PARTS_DIR = "G:\Il mio Drive\Musica"; npm start
```

Il PDF di uno strumento viene abbinato alla canzone **dal nome del file**,
ignorando maiuscole, accenti e punteggiatura (`BAILA MORENA +3.pdf` =
`Baila Morena +3.pdf`). Si confronta con il nome del file caricato dal
cantante e con il titolo. I file nuovi sono visibili subito, senza
riavviare il server.

> Con Google Drive per desktop imposta la cartella come **"Disponibile
> offline"**: con i file solo in streaming il primo caricamento di un PDF
> può essere lento, e a metà concerto non è il momento.

## Requisiti

- Node.js 20+ e npm
- Tutti i dispositivi (PC gobbo, iPad, telefoni dei bandmate) sulla stessa
  rete Wi-Fi/LAN (es. lo stesso router usato per l'X18)

## Setup

```bash
npm install
npm run dev
```

Questo avvia sia il server (porta 4000) che il client Vite (porta 5173) in
modalità sviluppo, accessibili da altri dispositivi sulla rete
(`http://<ip-del-pc>:5173`).

## Uso in produzione (concerto/prova)

Sul PC che farà da server (può essere lo stesso PC all-in-one usato come
gobbo):

```bash
npm run build   # builda il client React
npm start        # avvia il server, che serve anche il client, su porta 4000
```

Poi:
1. Sul PC gobbo apri `http://localhost:4000/display` a schermo intero
   (in kiosk mode se possibile — vedi sotto).
2. Sull'iPad/telefono apri `http://<ip-del-pc>:4000/` per scegliere ed
   avanzare le canzoni.
3. Chitarrista e batterista aprono `http://<ip-del-pc>:4000/` dal proprio
   tablet e scelgono il proprio ruolo (vedi sopra). Il PC gobbo, finché
   nessuno sceglie una canzone, mostra "Seleziona sul tuo tablet la canzone
   da caricare".

### PC dedicato al gobbo: consiglio Linux + Chromium kiosk

Se il PC all-in-one è dedicato solo a questo uso, conviene una distro Linux
leggera con Chromium avviato in modalità kiosk (schermo intero automatico
all'accensione, niente popup di aggiornamento durante un concerto):

```bash
chromium --kiosk --incognito http://localhost:4000/display
```

configurato per partire all'avvio (autostart). Se il PC serve anche per
altro, va benissimo restare su Windows/macOS e aprire il browser a schermo
intero (F11) quando serve. Su Windows funziona anche la modalità kiosk di
Chrome: `chrome.exe --kiosk http://localhost:4000/display`.

## Roadmap

- [ ] **Scorrimento guidato dalla voce**: riconoscimento vocale dal
      microfono che confronta ciò che viene cantato con il testo caricato e
      avanza lo scroll da solo, invece di doverlo far scorrere manualmente
      (tastiera/pedale/pulsante). Prima opzione da esplorare: Web Speech API
      lato browser (semplice, gratis, ma manda l'audio a servizi cloud e
      soffre col rumore di fondo); alternativa più robusta: Whisper locale
      (whisper.cpp) per trascrizione offline.
  - Sarà sempre disattivabile a favore dello scroll manuale.
- [ ] **Scorrimento automatico a velocità costante** (senza AI): un
      play/pausa con slider di velocità, come opzione alternativa al comando
      manuale per chi preferisce non toccare/premere nulla durante il pezzo.
- [ ] **Import diretto da Google Drive** (oggi si carica il PDF a mano dal
      browser).
- [ ] Navigazione per sezioni (strofa/ritornello), non solo riga per riga.
- [ ] PWA installabile (icona su home screen di iPad/telefono).
- [ ] Vista "prossime canzoni" / scaletta ordinata per il concerto.

### Nota sui PDF stampati da siti di accordi

Molti PDF scaricati da siti come accordiespartiti.it includono
intestazione/piè di pagina (data di stampa, URL della pagina) su ogni
pagina: vengono filtrati automaticamente in base a pattern comuni
(`client/src/lib/pdfjs.js`, `NOISE_PATTERNS`). Se un PDF ha un
formato diverso e queste righe indesiderate compaiono comunque nell'elenco,
è lì che va aggiunto un nuovo pattern.

## Contribuire

Progetto open source, contributi benvenuti — issue e PR sono il benvenuto,
specialmente su riconoscimento vocale/matching del testo cantato, che è la
parte più sperimentale. Vedi [CONTRIBUTING.md](CONTRIBUTING.md).

## Licenza

MIT — vedi [LICENSE](LICENSE).
