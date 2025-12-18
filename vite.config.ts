
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ép kiểu biến môi trường để @google/genai có thể đọc được process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
    host: true
  }
});
