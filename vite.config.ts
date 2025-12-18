
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Nạp biến môi trường từ .env và môi trường hệ thống (Vercel)
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error in the Vite config environment.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Đảm bảo Gemini SDK có thể truy cập API_KEY qua process.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
