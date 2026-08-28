import { io } from 'socket.io-client';

// In sviluppo il client (Vite, porta 5173) e il server (porta 4000) sono
// due processi diversi: ci si connette esplicitamente alla porta del server.
// In produzione il server serve anche il client dallo stesso origin, quindi
// basta connettersi senza specificare host.
const socketUrl = import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:4000` : undefined;

export const socket = io(socketUrl, { autoConnect: true });
