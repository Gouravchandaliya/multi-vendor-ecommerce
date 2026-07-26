import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration.
 *
 * The proxy rule forwards any request from the React dev server that starts with /api
 * to the Express backend running on port 5000.
 * This means in development, Axios calls to '/api/v1/...' work without CORS issues
 * because the browser sees them as same-origin (localhost:5173).
 * In production, the frontend is on a different domain so the full API URL is used.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
