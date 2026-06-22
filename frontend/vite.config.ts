import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías pesadas en chunks independientes para mejorar la carga.
        manualChunks: {
          fullcalendar: [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/multimonth',
            '@fullcalendar/interaction',
          ],
          charts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'date-fns'],
        },
      },
    },
  },
});
