import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the SPA (Vite :5173) calls the NestJS API on same-origin `/api`.
// Proxy API + uploads to the running backend so `npm run dev` is a working site.
// Override the target with API_PROXY_TARGET if the backend runs on another port.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist-client',
    emptyOutDir: true,
    modulePreload: false,
  },
});
