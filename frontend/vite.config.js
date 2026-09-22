import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = process.env.VITE_API_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  build: { assetsDir: 'static', chunkSizeWarningLimit: 900 },
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/uploads': backend,
      '/assets': backend,
    },
  },
});
