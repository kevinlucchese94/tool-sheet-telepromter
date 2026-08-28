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
3. Gli altri componenti della band possono aprire lo stesso `/display` su
   qualunque dispositivo per vedere il testo anche loro.

### PC dedicato al gobbo: consiglio Linux + Chromium kiosk

Se il PC all-in-one è dedicato solo a questo uso, conviene una distro Linux
leggera con Chromium avviato in modalità kiosk (schermo intero automatico
all'accensione, niente popup di aggiornamento durante un concerto):

```bash
chromium --kiosk --incognito http://localhost:4000/display
```

configurato per partire all'avvio (autostart). Se il PC serve anche per
altro, va benissimo restare su Windows/macOS e aprire il browser a schermo
intero (F11) quando serve.

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
