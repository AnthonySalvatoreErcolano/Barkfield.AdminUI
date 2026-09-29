/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The API's CORS allows exactly http://localhost:5173. Without strictPort, Vite quietly moves to 5174
    // when 5173 is busy, and every request then fails as a CORS error instead of saying why.
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
});
