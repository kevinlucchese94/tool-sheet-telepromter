import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true espone il dev server sulla rete locale (utile per aprirlo
// direttamente da iPad/PC senza dover fare la build ogni volta)
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
